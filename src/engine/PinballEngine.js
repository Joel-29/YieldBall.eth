import Matter from 'matter-js';

const {
  Engine,
  Render,
  Runner,
  Bodies,
  Body,
  Composite,
  Constraint,
  Events,
} = Matter;

// Base flipper width for scaling
const BASE_FLIPPER_WIDTH = 70;

// Game settings based on player class (from ENS yieldball.class)
export const PLAYER_CLASSES = {
  whale: {
    flipperWidth: BASE_FLIPPER_WIDTH * 1.5, // 1.5x flipper size
    ballDensity: 2.0,
    ballSpeed: 0.6, // Slower ball
    yieldMultiplier: 1.0,
    flipperCooldown: 100,
    description: 'Whale Mode: 1.5x Flippers, Slow Ball',
  },
  degen: {
    flipperWidth: BASE_FLIPPER_WIDTH * 0.5, // 0.5x flipper size
    ballDensity: 0.5,
    ballSpeed: 1.5,
    yieldMultiplier: 2.0, // 2x yield multiplier
    flipperCooldown: 100,
    description: 'Degen Mode: 0.5x Flippers, 2x Yield!',
  },
  sniper: {
    flipperWidth: BASE_FLIPPER_WIDTH,
    ballDensity: 0.8,
    ballSpeed: 1.8,
    yieldMultiplier: 1.2,
    flipperCooldown: 0,
    description: 'Sniper Mode: Fast Ball, 1.2x Yield',
  },
  default: {
    flipperWidth: BASE_FLIPPER_WIDTH,
    ballDensity: 1.0,
    ballSpeed: 1.0,
    yieldMultiplier: 1.0,
    flipperCooldown: 100,
    description: 'Standard Mode',
  },
};

// Generate cryptographic hash for state channel simulation
function generateStateHash(data) {
  const timestamp = Date.now();
  const payload = JSON.stringify({ ...data, timestamp, nonce: Math.random() });
  let hash = '0x';
  for (let i = 0; i < 64; i++) {
    hash += Math.floor(Math.random() * 16).toString(16);
  }
  return { hash, timestamp, payload };
}

export class PinballEngine {
  constructor(container, options = {}) {
    this.container = container;
    // Canvas size 400x600 as per spec
    this.width = options.width || 400;
    this.height = options.height || 600;
    this.playerClass = options.playerClass || 'default';
    this.onBumperHit = options.onBumperHit || (() => {});
    this.onFlashLoanRamp = options.onFlashLoanRamp || (() => {});
    this.onDrain = options.onDrain || (() => {});
    this.onScoreUpdate = options.onScoreUpdate || (() => {});
    this.onStateUpdate = options.onStateUpdate || (() => {});
    
    this.settings = PLAYER_CLASSES[this.playerClass];
    this.score = 0;
    this.isGameOver = false;
    this.ball = null;
    this.leftFlipper = null;
    this.rightFlipper = null;
    this.leftFlipperConstraint = null;
    this.rightFlipperConstraint = null;
    this.bumpers = [];
    this.flashLoanRamp = null;
    this.ballTrail = [];
    this.ballLaunched = false;
    
    // Flipper angle settings (in radians)
    // Resting state: 30 degrees, Active state: -30 degrees
    this.flipperRestAngle = Math.PI / 6;  // 30 degrees
    this.flipperActiveAngle = -Math.PI / 6; // -30 degrees
    
    // Flipper pivot positions
    this.leftHingePos = { x: 120, y: 550 };
    this.rightHingePos = { x: 280, y: 550 };
    
    this.init();
  }

  // Sign state update - simulates Yellow Network state channel
  signStateUpdate(action, data) {
    const stateData = {
      action,
      ...data,
      score: this.score,
      playerClass: this.playerClass,
    };
    
    const { hash, timestamp } = generateStateHash(stateData);
    
    console.log(`%c🔐 STATE CHANNEL UPDATE`, 'color: #fbbf24; font-weight: bold; font-size: 14px;');
    console.log(`%c   Action: ${action}`, 'color: #00f5ff;');
    console.log(`%c   Hash: ${hash}`, 'color: #8b5cf6;');
    console.log(`%c   Timestamp: ${timestamp}`, 'color: #22c55e;');
    
    this.onStateUpdate({ action, hash, timestamp, data: stateData });
    
    return hash;
  }

  init() {
    // Create engine with gravity
    this.engine = Engine.create({
      gravity: { x: 0, y: 1 },
    });

    // Create renderer - ensure bounds match world exactly
    this.render = Render.create({
      element: this.container,
      engine: this.engine,
      options: {
        width: this.width,
        height: this.height,
        wireframes: false,
        background: '#0f172a',
        pixelRatio: window.devicePixelRatio || 1,
      },
    });

    // Set render bounds to match world exactly - prevents ball disappearing
    this.render.bounds = {
      min: { x: 0, y: 0 },
      max: { x: this.width, y: this.height }
    };

    this.createWalls();
    this.createFlippers();
    this.createBumpers();
    this.createLaunchTube();
    this.createBall();
    this.setupCollisionEvents();
    this.setupCustomRendering();

    // Run the engine and renderer
    this.runner = Runner.create();
    Runner.run(this.runner, this.engine);
    Render.run(this.render);

    // Setup keyboard controls
    this.setupControls();
  }

  createWalls() {
    const wallThickness = 20;
    
    const wallOptions = {
      isStatic: true,
      render: {
        fillStyle: '#1e293b',
        strokeStyle: '#8b5cf6',
        lineWidth: 3,
      },
    };

    // Create 4 solid walls - ensuring ball never escapes
    const walls = [
      // Top wall - at y: wallThickness/2 so ball bounces back
      Bodies.rectangle(this.width / 2, wallThickness / 2, this.width, wallThickness, {
        ...wallOptions,
        label: 'topWall',
      }),
      // Left wall
      Bodies.rectangle(wallThickness / 2, this.height / 2, wallThickness, this.height, {
        ...wallOptions,
        label: 'leftWall',
      }),
      // Right wall (with gap for launch tube)
      Bodies.rectangle(this.width - wallThickness / 2, this.height / 2 - 100, wallThickness, this.height - 200, {
        ...wallOptions,
        label: 'rightWall',
      }),
    ];

    // Bottom drain - sensor at y:610 that triggers game over
    this.drain = Bodies.rectangle(this.width / 2, 610, this.width, 40, {
      isStatic: true,
      isSensor: true,
      label: 'drain',
      render: {
        fillStyle: 'rgba(255, 0, 110, 0.1)',
        strokeStyle: '#ff006e',
        lineWidth: 1,
      },
    });

    // Flash Loan Ramp sensor at the top (special bonus area)
    this.flashLoanRamp = Bodies.rectangle(this.width / 2, 60, 100, 30, {
      isStatic: true,
      isSensor: true,
      label: 'flashLoanRamp',
      render: {
        fillStyle: 'rgba(34, 197, 94, 0.3)',
        strokeStyle: '#22c55e',
        lineWidth: 2,
      },
    });

    // Bottom slopes to guide ball to drain
    const leftSlope = Bodies.rectangle(70, this.height - 50, 100, 15, {
      ...wallOptions,
      angle: Math.PI * 0.2,
      label: 'leftSlope',
    });

    const rightSlope = Bodies.rectangle(this.width - 110, this.height - 50, 100, 15, {
      ...wallOptions,
      angle: -Math.PI * 0.2,
      label: 'rightSlope',
    });

    Composite.add(this.engine.world, [...walls, this.drain, this.flashLoanRamp, leftSlope, rightSlope]);
  }

  createFlippers() {
    const flipperWidth = this.settings.flipperWidth;
    const flipperHeight = 15;
    
    // Create static circular hinges for each flipper
    const hingeOptions = {
      isStatic: true,
      render: {
        fillStyle: '#8b5cf6',
        strokeStyle: '#00f5ff',
        lineWidth: 2,
      },
    };

    // Left hinge
    const leftHinge = Bodies.circle(this.leftHingePos.x, this.leftHingePos.y, 8, {
      ...hingeOptions,
      label: 'leftHinge',
    });

    // Right hinge
    const rightHinge = Bodies.circle(this.rightHingePos.x, this.rightHingePos.y, 8, {
      ...hingeOptions,
      label: 'rightHinge',
    });

    // Flipper body options
    const flipperOptions = {
      density: 0.01,
      friction: 0.1,
      frictionAir: 0.02,
      restitution: 0.3,
      render: {
        fillStyle: '#ff006e',
        strokeStyle: '#00f5ff',
        lineWidth: 2,
      },
      chamfer: { radius: 5 },
    };

    // Left flipper - positioned so its LEFT end is at the hinge
    this.leftFlipper = Bodies.rectangle(
      this.leftHingePos.x + flipperWidth / 2,
      this.leftHingePos.y,
      flipperWidth,
      flipperHeight,
      { ...flipperOptions, label: 'leftFlipper' }
    );

    // Right flipper - positioned so its RIGHT end is at the hinge
    this.rightFlipper = Bodies.rectangle(
      this.rightHingePos.x - flipperWidth / 2,
      this.rightHingePos.y,
      flipperWidth,
      flipperHeight,
      { ...flipperOptions, label: 'rightFlipper' }
    );

    // Set initial rest angles
    Body.setAngle(this.leftFlipper, this.flipperRestAngle);
    Body.setAngle(this.rightFlipper, -this.flipperRestAngle);

    // Update flipper positions after angle is set
    Body.setPosition(this.leftFlipper, {
      x: this.leftHingePos.x + (flipperWidth / 2) * Math.cos(this.flipperRestAngle),
      y: this.leftHingePos.y + (flipperWidth / 2) * Math.sin(this.flipperRestAngle)
    });

    Body.setPosition(this.rightFlipper, {
      x: this.rightHingePos.x - (flipperWidth / 2) * Math.cos(this.flipperRestAngle),
      y: this.rightHingePos.y + (flipperWidth / 2) * Math.sin(this.flipperRestAngle)
    });

    // Create constraints to anchor flippers to hinges
    // Left flipper constraint - pin left end to left hinge
    this.leftFlipperConstraint = Constraint.create({
      pointA: this.leftHingePos,
      bodyB: this.leftFlipper,
      pointB: { x: -flipperWidth / 2, y: 0 },
      stiffness: 0.9,
      length: 0,
      render: {
        visible: false,
      },
    });

    // Right flipper constraint - pin right end to right hinge
    this.rightFlipperConstraint = Constraint.create({
      pointA: this.rightHingePos,
      bodyB: this.rightFlipper,
      pointB: { x: flipperWidth / 2, y: 0 },
      stiffness: 0.9,
      length: 0,
      render: {
        visible: false,
      },
    });

    Composite.add(this.engine.world, [
      leftHinge,
      rightHinge,
      this.leftFlipper,
      this.rightFlipper,
      this.leftFlipperConstraint,
      this.rightFlipperConstraint,
    ]);

    // Track flipper states
    this.leftFlipperActive = false;
    this.rightFlipperActive = false;
  }

  createBumpers() {
    // Bumper positions for 400x600 canvas
    const bumperPositions = [
      { x: 100, y: 180, color: '#ff006e', radius: 25 },  // Left bumper
      { x: 200, y: 130, color: '#00f5ff', radius: 30 },  // Center top bumper
      { x: 300, y: 180, color: '#ff006e', radius: 25 },  // Right bumper
      { x: 150, y: 280, color: '#8b5cf6', radius: 22 },  // Lower left
      { x: 250, y: 280, color: '#8b5cf6', radius: 22 },  // Lower right
    ];

    this.bumpers = bumperPositions.map((pos, index) => {
      const bumper = Bodies.circle(pos.x, pos.y, pos.radius, {
        isStatic: true,
        restitution: 1.2,
        label: `bumper-${index}`,
        render: {
          fillStyle: pos.color,
          strokeStyle: '#ffffff',
          lineWidth: 3,
        },
      });
      bumper.bumperColor = pos.color;
      bumper.isGlowing = false;
      bumper.glowIntensity = 0;
      return bumper;
    });

    Composite.add(this.engine.world, this.bumpers);
  }

  createLaunchTube() {
    const tubeX = this.width - 30;
    const tubeWidth = 30;
    
    const tubeOptions = {
      isStatic: true,
      render: {
        fillStyle: '#1e293b',
        strokeStyle: '#22c55e',
        lineWidth: 2,
      },
    };

    // Launch tube walls
    const tubeLeft = Bodies.rectangle(tubeX - tubeWidth / 2, this.height - 150, 8, 300, tubeOptions);
    const tubeRight = Bodies.rectangle(tubeX + tubeWidth / 2, this.height - 150, 8, 300, {
      ...tubeOptions,
      render: {
        ...tubeOptions.render,
        strokeStyle: '#8b5cf6',
      },
    });

    // Stopper at bottom of launch tube
    const tubeStopper = Bodies.rectangle(tubeX, this.height - 20, tubeWidth, 10, tubeOptions);

    // Curved guide at top of launch tube
    const tubeGuide = Bodies.rectangle(tubeX - 25, 100, 50, 10, {
      ...tubeOptions,
      angle: Math.PI * 0.25,
    });

    Composite.add(this.engine.world, [tubeLeft, tubeRight, tubeStopper, tubeGuide]);
  }

  createBall() {
    // Ball starts in launch tube
    const ballX = this.width - 30;
    const ballY = this.height - 60;
    const ballRadius = 12;

    // Ball physics as per spec: restitution: 0.5, friction: 0.01
    this.ball = Bodies.circle(ballX, ballY, ballRadius, {
      restitution: 0.5,
      friction: 0.01,
      frictionAir: 0.001,
      density: this.settings.ballDensity * 0.002,
      label: 'ball',
      render: {
        fillStyle: '#ff006e',
        strokeStyle: '#00f5ff',
        lineWidth: 2,
      },
    });

    Composite.add(this.engine.world, this.ball);
  }

  setupCollisionEvents() {
    // Delay drain detection to prevent false triggers at start
    this.drainEnabled = false;
    setTimeout(() => {
      this.drainEnabled = true;
    }, 1500);

    Events.on(this.engine, 'collisionStart', (event) => {
      event.pairs.forEach((pair) => {
        const labels = [pair.bodyA.label, pair.bodyB.label];
        
        // Check for bumper hits
        this.bumpers.forEach((bumper, index) => {
          if (labels.includes(bumper.label) && labels.includes('ball')) {
            this.handleBumperHit(bumper, index);
          }
        });

        // Check for Flash Loan Ramp hit
        if (labels.includes('flashLoanRamp') && labels.includes('ball')) {
          this.handleFlashLoanRamp();
        }

        // Check for drain (only if enabled and ball was launched)
        if (labels.includes('drain') && labels.includes('ball') && this.drainEnabled && this.ballLaunched) {
          this.handleDrain();
        }
      });
    });

    // Track ball position for trail effect and flipper updates
    Events.on(this.engine, 'afterUpdate', () => {
      if (this.ball && !this.isGameOver) {
        // Ball trail
        this.ballTrail.push({ x: this.ball.position.x, y: this.ball.position.y });
        if (this.ballTrail.length > 15) {
          this.ballTrail.shift();
        }
        
        // Keep ball within horizontal bounds
        const ballPos = this.ball.position;
        if (ballPos.x < 30) {
          Body.setPosition(this.ball, { x: 30, y: ballPos.y });
        } else if (ballPos.x > this.width - 50) {
          // Allow ball in launch tube area
        }
      }
      
      // Update flippers based on active state
      this.updateFlippers();
    });
  }
  
  updateFlippers() {
    if (!this.leftFlipper || !this.rightFlipper) return;
    
    const angularSpeed = 0.4;
    const returnSpeed = 0.15;
    
    // Left flipper control
    if (this.leftFlipperActive) {
      // Apply upward angular velocity
      const targetAngle = this.flipperActiveAngle;
      const currentAngle = this.leftFlipper.angle;
      if (currentAngle > targetAngle) {
        Body.setAngularVelocity(this.leftFlipper, -angularSpeed);
      }
    } else {
      // Spring back to rest position
      const targetAngle = this.flipperRestAngle;
      const currentAngle = this.leftFlipper.angle;
      const diff = targetAngle - currentAngle;
      Body.setAngularVelocity(this.leftFlipper, diff * returnSpeed);
    }
    
    // Right flipper control (mirrored)
    if (this.rightFlipperActive) {
      const targetAngle = -this.flipperActiveAngle;
      const currentAngle = this.rightFlipper.angle;
      if (currentAngle < targetAngle) {
        Body.setAngularVelocity(this.rightFlipper, angularSpeed);
      }
    } else {
      const targetAngle = -this.flipperRestAngle;
      const currentAngle = this.rightFlipper.angle;
      const diff = targetAngle - currentAngle;
      Body.setAngularVelocity(this.rightFlipper, diff * returnSpeed);
    }
    
    // Clamp flipper angles to prevent over-rotation
    const leftAngle = this.leftFlipper.angle;
    if (leftAngle < this.flipperActiveAngle) {
      Body.setAngle(this.leftFlipper, this.flipperActiveAngle);
      Body.setAngularVelocity(this.leftFlipper, 0);
    } else if (leftAngle > this.flipperRestAngle) {
      Body.setAngle(this.leftFlipper, this.flipperRestAngle);
      Body.setAngularVelocity(this.leftFlipper, 0);
    }
    
    const rightAngle = this.rightFlipper.angle;
    if (rightAngle > -this.flipperActiveAngle) {
      Body.setAngle(this.rightFlipper, -this.flipperActiveAngle);
      Body.setAngularVelocity(this.rightFlipper, 0);
    } else if (rightAngle < -this.flipperRestAngle) {
      Body.setAngle(this.rightFlipper, -this.flipperRestAngle);
      Body.setAngularVelocity(this.rightFlipper, 0);
    }
  }

  handleBumperHit(bumper, index) {
    const basePoints = 100;
    const points = basePoints * this.settings.yieldMultiplier;
    this.score += points;
    
    // Trigger neon flash effect
    bumper.isGlowing = true;
    bumper.glowIntensity = 1;
    bumper.render.strokeStyle = '#ffff00';
    bumper.render.lineWidth = 8;
    
    setTimeout(() => {
      bumper.isGlowing = false;
      bumper.glowIntensity = 0;
      bumper.render.strokeStyle = '#ffffff';
      bumper.render.lineWidth = 3;
    }, 200);

    // Sign state channel update
    this.signStateUpdate('BUMPER_HIT', {
      bumperIndex: index,
      points,
      yieldMultiplier: this.settings.yieldMultiplier,
    });

    this.onBumperHit(index, points, this.settings.yieldMultiplier);
    this.onScoreUpdate(this.score);
  }

  handleFlashLoanRamp() {
    const flashLoanBonus = 500 * this.settings.yieldMultiplier;
    this.score += flashLoanBonus;
    
    console.log(`%c⚡ FLASH LOAN RAMP! +${flashLoanBonus} points!`, 
      'color: #22c55e; font-weight: bold; font-size: 16px;');
    
    this.signStateUpdate('FLASH_LOAN_RAMP', {
      bonus: flashLoanBonus,
      yieldMultiplier: this.settings.yieldMultiplier,
    });

    // Visual feedback
    this.flashLoanRamp.render.fillStyle = 'rgba(34, 197, 94, 0.8)';
    setTimeout(() => {
      this.flashLoanRamp.render.fillStyle = 'rgba(34, 197, 94, 0.3)';
    }, 300);

    this.onFlashLoanRamp(flashLoanBonus);
    this.onScoreUpdate(this.score);
  }

  handleDrain() {
    if (this.isGameOver) return;
    
    this.isGameOver = true;
    console.log(`%c⚠️ BALL DRAINED - Session ending...`, 
      'color: #ff006e; font-weight: bold; font-size: 16px;');
    
    this.onDrain(this.score);
  }

  setupCustomRendering() {
    Events.on(this.render, 'afterRender', () => {
      const ctx = this.render.context;
      
      // Draw ball trail
      if (this.ballTrail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(this.ballTrail[0].x, this.ballTrail[0].y);
        
        this.ballTrail.forEach((point) => {
          ctx.lineTo(point.x, point.y);
        });
        
        const gradient = ctx.createLinearGradient(
          this.ballTrail[0].x, this.ballTrail[0].y,
          this.ballTrail[this.ballTrail.length - 1].x,
          this.ballTrail[this.ballTrail.length - 1].y
        );
        gradient.addColorStop(0, 'rgba(255, 0, 110, 0)');
        gradient.addColorStop(1, 'rgba(255, 0, 110, 0.8)');
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      // Draw ball glow
      if (this.ball) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.ball.position.x, this.ball.position.y, 25, 0, Math.PI * 2);
        const glowGradient = ctx.createRadialGradient(
          this.ball.position.x, this.ball.position.y, 0,
          this.ball.position.x, this.ball.position.y, 30
        );
        glowGradient.addColorStop(0, 'rgba(255, 0, 110, 0.6)');
        glowGradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.3)');
        glowGradient.addColorStop(1, 'rgba(139, 92, 246, 0)');
        ctx.fillStyle = glowGradient;
        ctx.fill();
        ctx.restore();
      }

      // Draw bumper glow effects
      this.bumpers.forEach((bumper) => {
        if (bumper.isGlowing) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(bumper.position.x, bumper.position.y, 50, 0, Math.PI * 2);
          const bumperGlow = ctx.createRadialGradient(
            bumper.position.x, bumper.position.y, 15,
            bumper.position.x, bumper.position.y, 55
          );
          bumperGlow.addColorStop(0, 'rgba(255, 255, 0, 0.9)');
          bumperGlow.addColorStop(1, 'rgba(255, 255, 0, 0)');
          ctx.fillStyle = bumperGlow;
          ctx.fill();
          ctx.restore();
        }
      });

      // Draw launch instructions if ball not launched
      if (!this.ballLaunched) {
        ctx.save();
        ctx.font = '12px Orbitron, sans-serif';
        ctx.fillStyle = '#22c55e';
        ctx.textAlign = 'center';
        ctx.fillText('Press SPACE', this.width - 30, this.height - 100);
        ctx.fillText('to launch!', this.width - 30, this.height - 85);
        ctx.restore();
      }
    });
  }

  setupControls() {
    this.keyDownHandler = (e) => {
      if (this.isGameOver) return;
      
      // Prevent default to stop page scrolling
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) {
        e.preventDefault();
      }
      
      // Left flipper: A or Left Arrow
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
        this.leftFlipperActive = true;
      }
      
      // Right flipper: D or Right Arrow
      if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
        this.rightFlipperActive = true;
      }

      // Launch ball: Space
      if (e.key === ' ' || e.key === 'Space') {
        this.launchBall();
      }
    };

    this.keyUpHandler = (e) => {
      if (this.isGameOver) return;
      
      // Left flipper release
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
        this.leftFlipperActive = false;
      }
      
      // Right flipper release
      if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
        this.rightFlipperActive = false;
      }
    };

    document.addEventListener('keydown', this.keyDownHandler);
    document.addEventListener('keyup', this.keyUpHandler);
  }

  launchBall() {
    if (!this.ball || this.isGameOver || this.ballLaunched) return;
    
    this.ballLaunched = true;
    
    // Apply upward launch force with random variation
    const baseForce = 0.05 * this.settings.ballSpeed;
    const randomVariation = 0.8 + Math.random() * 0.4; // 0.8 to 1.2 multiplier
    const launchForce = baseForce * randomVariation;
    
    Body.applyForce(this.ball, this.ball.position, { x: -0.002, y: -launchForce });
    
    console.log(`%c🚀 Ball launched! Speed multiplier: ${this.settings.ballSpeed}x`, 
      'color: #22c55e; font-weight: bold;');
  }

  flipLeft() {
    if (this.isGameOver) return;
    this.leftFlipperActive = true;
    setTimeout(() => {
      this.leftFlipperActive = false;
    }, 150);
  }

  flipRight() {
    if (this.isGameOver) return;
    this.rightFlipperActive = true;
    setTimeout(() => {
      this.rightFlipperActive = false;
    }, 150);
  }

  reset() {
    this.isGameOver = false;
    this.score = 0;
    this.ballTrail = [];
    this.ballLaunched = false;
    this.drainEnabled = false;
    this.leftFlipperActive = false;
    this.rightFlipperActive = false;
    
    // Reset ball position to launch tube
    Body.setPosition(this.ball, { x: this.width - 30, y: this.height - 60 });
    Body.setVelocity(this.ball, { x: 0, y: 0 });
    Body.setAngularVelocity(this.ball, 0);
    
    // Reset flipper angles
    Body.setAngle(this.leftFlipper, this.flipperRestAngle);
    Body.setAngle(this.rightFlipper, -this.flipperRestAngle);
    Body.setAngularVelocity(this.leftFlipper, 0);
    Body.setAngularVelocity(this.rightFlipper, 0);
    
    // Re-enable drain after delay
    setTimeout(() => {
      this.drainEnabled = true;
    }, 1500);
    
    this.onScoreUpdate(0);
  }

  destroy() {
    document.removeEventListener('keydown', this.keyDownHandler);
    document.removeEventListener('keyup', this.keyUpHandler);
    
    Render.stop(this.render);
    Runner.stop(this.runner);
    Engine.clear(this.engine);
    
    if (this.render.canvas) {
      this.render.canvas.remove();
    }
    
    this.render.textures = {};
  }
}

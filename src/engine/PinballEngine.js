import Matter from 'matter-js';

const {
  Engine,
  Render,
  Runner,
  Bodies,
  Body,
  Composite,
  Events,
  Vector,
  Constraint,
} = Matter;

// Game settings based on player class (from ENS yieldball.class)
export const PLAYER_CLASSES = {
  whale: {
    flipperWidth: 160,
    ballDensity: 2.0,
    ballSpeed: 0.7,
    yieldMultiplier: 0.5,
    flipperCooldown: 100,
    description: 'Whale Mode: Large flippers, heavy ball, 0.5x yield',
  },
  degen: {
    flipperWidth: 50,
    ballDensity: 0.5,
    ballSpeed: 1.5,
    yieldMultiplier: 2.0,
    flipperCooldown: 100,
    description: 'Degen Mode: Small flippers, light ball, 2x yield!',
  },
  sniper: {
    flipperWidth: 100,
    ballDensity: 0.8,
    ballSpeed: 1.8,
    yieldMultiplier: 1.2,
    flipperCooldown: 0,
    description: 'Sniper Mode: Fast ball, no cooldown, 1.2x yield',
  },
  default: {
    flipperWidth: 100,
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
  // Simulate a keccak256-like hash
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
    this.bumpers = [];
    this.flashLoanRamp = null;
    this.ballTrail = [];
    this.lastFlipperUse = { left: 0, right: 0 };
    
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
    
    const { hash, timestamp, payload } = generateStateHash(stateData);
    
    console.log(`%c🔐 STATE CHANNEL UPDATE`, 'color: #fbbf24; font-weight: bold; font-size: 14px;');
    console.log(`%c   Action: ${action}`, 'color: #00f5ff;');
    console.log(`%c   Hash: ${hash}`, 'color: #8b5cf6;');
    console.log(`%c   Timestamp: ${timestamp}`, 'color: #22c55e;');
    
    this.onStateUpdate({ action, hash, timestamp, data: stateData });
    
    return hash;
  }

  init() {
    // Create engine
    this.engine = Engine.create({
      gravity: { x: 0, y: 1 },
    });

    // Create renderer with custom background
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

    this.createTable();
    this.createFlippers();
    this.createBumpers();
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

  createTable() {
    const wallOptions = {
      isStatic: true,
      render: {
        fillStyle: '#1e293b',
        strokeStyle: '#8b5cf6',
        lineWidth: 3,
      },
    };

    // Create walls for 400x600 canvas
    const walls = [
      // Left wall
      Bodies.rectangle(10, this.height / 2, 20, this.height, wallOptions),
      // Right wall
      Bodies.rectangle(this.width - 10, this.height / 2, 20, this.height, wallOptions),
      // Top wall
      Bodies.rectangle(this.width / 2, 10, this.width, 20, wallOptions),
      // Bottom left slope - guide ball to center
      Bodies.rectangle(70, this.height - 70, 120, 18, {
        ...wallOptions,
        angle: Math.PI * 0.22,
      }),
      // Bottom right slope - guide ball to center  
      Bodies.rectangle(this.width - 100, this.height - 70, 120, 18, {
        ...wallOptions,
        angle: -Math.PI * 0.22,
      }),
      // Launch lane right wall
      Bodies.rectangle(this.width - 20, this.height - 250, 10, 400, wallOptions),
      // Launch lane left wall
      Bodies.rectangle(this.width - 45, this.height - 250, 10, 350, wallOptions),
      // Launch lane stopper (ball rests here)
      Bodies.rectangle(this.width - 32, this.height - 70, 35, 10, wallOptions),
    ];

    // Create drain sensor (invisible area at bottom center)
    this.drain = Bodies.rectangle(this.width / 2, this.height + 25, 180, 40, {
      isStatic: true,
      isSensor: true,
      label: 'drain',
      render: {
        fillStyle: 'transparent',
      },
    });

    // Flash Loan Ramp sensor at the top (special bonus area)
    this.flashLoanRamp = Bodies.rectangle(this.width / 2, 60, 120, 40, {
      isStatic: true,
      isSensor: true,
      label: 'flashLoanRamp',
      render: {
        fillStyle: 'rgba(34, 197, 94, 0.3)',
        strokeStyle: '#22c55e',
        lineWidth: 2,
      },
    });

    Composite.add(this.engine.world, [...walls, this.drain, this.flashLoanRamp]);
  }

  createFlippers() {
    const flipperWidth = this.settings.flipperWidth;
    const flipperHeight = 14;
    const flipperY = this.height - 85;
    
    const flipperOptions = {
      render: {
        fillStyle: '#ff006e',
        strokeStyle: '#00f5ff',
        lineWidth: 2,
      },
      chamfer: { radius: 6 },
    };

    // Left flipper - adjusted for 400px width
    const leftPivotX = 80;
    this.leftFlipper = Bodies.rectangle(
      leftPivotX + flipperWidth / 2 - 15,
      flipperY,
      flipperWidth,
      flipperHeight,
      { ...flipperOptions, label: 'leftFlipper' }
    );

    const leftPivot = Bodies.circle(leftPivotX, flipperY, 5, {
      isStatic: true,
      render: { fillStyle: '#8b5cf6' },
    });

    const leftConstraint = Constraint.create({
      bodyA: this.leftFlipper,
      pointA: { x: -flipperWidth / 2 + 15, y: 0 },
      bodyB: leftPivot,
      pointB: { x: 0, y: 0 },
      stiffness: 1,
      length: 0,
    });

    // Right flipper - adjusted for 400px width
    const rightPivotX = this.width - 80;
    this.rightFlipper = Bodies.rectangle(
      rightPivotX - flipperWidth / 2 + 15,
      flipperY,
      flipperWidth,
      flipperHeight,
      { ...flipperOptions, label: 'rightFlipper' }
    );

    const rightPivot = Bodies.circle(rightPivotX, flipperY, 5, {
      isStatic: true,
      render: { fillStyle: '#8b5cf6' },
    });

    const rightConstraint = Constraint.create({
      bodyA: this.rightFlipper,
      pointA: { x: flipperWidth / 2 - 15, y: 0 },
      bodyB: rightPivot,
      pointB: { x: 0, y: 0 },
      stiffness: 1,
      length: 0,
    });

    // Set initial angles
    Body.setAngle(this.leftFlipper, 0.3);
    Body.setAngle(this.rightFlipper, -0.3);

    Composite.add(this.engine.world, [
      this.leftFlipper,
      this.rightFlipper,
      leftPivot,
      rightPivot,
      leftConstraint,
      rightConstraint,
    ]);
  }

  createBumpers() {
    // Bumper positions adjusted for 400x600 canvas
    const bumperPositions = [
      { x: 100, y: 180, color: '#ff006e' },  // Left bumper - neon pink
      { x: 200, y: 250, color: '#00f5ff' },  // Center bumper - neon cyan
      { x: 300, y: 180, color: '#ff006e' },  // Right bumper - neon pink
    ];

    this.bumpers = bumperPositions.map((pos, index) => {
      const bumper = Bodies.circle(pos.x, pos.y, 28, {
        isStatic: true,
        restitution: 1.5,
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

  createBall() {
    // Ball starts in launch lane, resting on stopper
    const ballX = this.width - 32;
    const ballY = this.height - 95;

    // Use ball density from class settings
    const ballDensity = this.settings.ballDensity * 0.002;

    this.ball = Bodies.circle(ballX, ballY, 12, {
      restitution: 0.6,
      friction: 0.001,
      frictionAir: 0.001,
      density: ballDensity,
      label: 'ball',
      render: {
        fillStyle: '#ff006e',
        strokeStyle: '#00f5ff',
        lineWidth: 2,
      },
    });

    // Make ball static initially until launched
    Body.setStatic(this.ball, true);
    this.ballLaunched = false;

    Composite.add(this.engine.world, this.ball);
  }

  setupCollisionEvents() {
    // Delay drain detection to prevent false triggers at start
    this.drainEnabled = false;
    setTimeout(() => {
      this.drainEnabled = true;
    }, 2000);

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

    // Track ball position for trail effect
    Events.on(this.engine, 'afterUpdate', () => {
      if (this.ball && !this.isGameOver) {
        this.ballTrail.push({ x: this.ball.position.x, y: this.ball.position.y });
        if (this.ballTrail.length > 20) {
          this.ballTrail.shift();
        }
      }
    });
  }

  handleBumperHit(bumper, index) {
    const basePoints = 100;
    const points = basePoints * this.settings.yieldMultiplier;
    this.score += points;
    
    // Trigger glow effect
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

    // Sign state channel update with cryptographic hash
    this.signStateUpdate('BUMPER_HIT', {
      bumperIndex: index,
      points,
      yieldMultiplier: this.settings.yieldMultiplier,
    });

    this.onBumperHit(index, points, this.settings.yieldMultiplier);
    this.onScoreUpdate(this.score);
  }

  handleFlashLoanRamp() {
    // Flash Loan Ramp gives big bonus!
    const flashLoanBonus = 500 * this.settings.yieldMultiplier;
    this.score += flashLoanBonus;
    
    console.log(`%c⚡ FLASH LOAN RAMP! +${flashLoanBonus} points!`, 
      'color: #22c55e; font-weight: bold; font-size: 16px;');
    
    // Sign state channel update
    this.signStateUpdate('FLASH_LOAN_RAMP', {
      bonus: flashLoanBonus,
      yieldMultiplier: this.settings.yieldMultiplier,
    });

    // Visual feedback for ramp
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
        
        this.ballTrail.forEach((point, index) => {
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
        ctx.lineWidth = 10;
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
            bumper.position.x, bumper.position.y, 20,
            bumper.position.x, bumper.position.y, 60
          );
          bumperGlow.addColorStop(0, 'rgba(255, 255, 0, 0.8)');
          bumperGlow.addColorStop(1, 'rgba(255, 255, 0, 0)');
          ctx.fillStyle = bumperGlow;
          ctx.fill();
          ctx.restore();
        }
      });
    });
  }

  setupControls() {
    this.keyDownHandler = (e) => {
      if (this.isGameOver) return;
      
      const now = Date.now();
      const cooldown = this.settings.flipperCooldown;
      
      // Left flipper: A or Left Arrow (with cooldown check)
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
        if (now - this.lastFlipperUse.left >= cooldown) {
          Body.setAngularVelocity(this.leftFlipper, -0.4);
          this.lastFlipperUse.left = now;
        }
      }
      
      // Right flipper: D or Right Arrow (with cooldown check)
      if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
        if (now - this.lastFlipperUse.right >= cooldown) {
          Body.setAngularVelocity(this.rightFlipper, 0.4);
          this.lastFlipperUse.right = now;
        }
      }

      // Launch ball: Space
      if (e.key === ' ' || e.key === 'Space') {
        this.launchBall();
      }
    };

    this.keyUpHandler = (e) => {
      if (this.isGameOver) return;
      
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
        Body.setAngularVelocity(this.leftFlipper, 0.2);
      }
      
      if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
        Body.setAngularVelocity(this.rightFlipper, -0.2);
      }
    };

    document.addEventListener('keydown', this.keyDownHandler);
    document.addEventListener('keyup', this.keyUpHandler);
  }

  launchBall() {
    if (!this.ball || this.isGameOver) return;
    
    // If ball hasn't been launched yet, make it dynamic and launch
    if (!this.ballLaunched) {
      Body.setStatic(this.ball, false);
      this.ballLaunched = true;
      
      // Strong upward launch force
      const launchForce = -0.035 * this.settings.ballSpeed;
      Body.setVelocity(this.ball, { x: -2, y: -15 * this.settings.ballSpeed });
      
      console.log(`%c🚀 Ball launched! Speed multiplier: ${this.settings.ballSpeed}x`, 
        'color: #22c55e; font-weight: bold;');
    }
  }

  flipLeft() {
    if (this.isGameOver) return;
    Body.setAngularVelocity(this.leftFlipper, -0.4);
    setTimeout(() => {
      Body.setAngularVelocity(this.leftFlipper, 0.2);
    }, 150);
  }

  flipRight() {
    if (this.isGameOver) return;
    Body.setAngularVelocity(this.rightFlipper, 0.4);
    setTimeout(() => {
      Body.setAngularVelocity(this.rightFlipper, -0.2);
    }, 150);
  }

  reset() {
    this.isGameOver = false;
    this.score = 0;
    this.ballTrail = [];
    this.ballLaunched = false;
    this.drainEnabled = false;
    this.lastFlipperUse = { left: 0, right: 0 };
    
    // Reset ball position to launch lane (400x600 canvas)
    Body.setPosition(this.ball, { x: this.width - 32, y: this.height - 95 });
    Body.setVelocity(this.ball, { x: 0, y: 0 });
    Body.setAngularVelocity(this.ball, 0);
    Body.setStatic(this.ball, true);
    
    // Re-enable drain after delay
    setTimeout(() => {
      this.drainEnabled = true;
    }, 2000);
    
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
  }
}

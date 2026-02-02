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

// Game settings based on player class
export const PLAYER_CLASSES = {
  whale: {
    flipperWidth: 150,
    ballSpeed: 0.8,
    multiplier: 1,
    description: 'Whale Mode: Large flippers, slow ball',
  },
  degen: {
    flipperWidth: 40,
    ballSpeed: 1.5,
    multiplier: 2,
    description: 'Degen Mode: Small flippers, fast ball, 2x multiplier!',
  },
  default: {
    flipperWidth: 100,
    ballSpeed: 1,
    multiplier: 1,
    description: 'Standard Mode',
  },
};

export class PinballEngine {
  constructor(container, options = {}) {
    this.container = container;
    this.width = options.width || 500;
    this.height = options.height || 800;
    this.playerClass = options.playerClass || 'default';
    this.onBumperHit = options.onBumperHit || (() => {});
    this.onDrain = options.onDrain || (() => {});
    this.onScoreUpdate = options.onScoreUpdate || (() => {});
    
    this.settings = PLAYER_CLASSES[this.playerClass];
    this.score = 0;
    this.isGameOver = false;
    this.ball = null;
    this.leftFlipper = null;
    this.rightFlipper = null;
    this.bumpers = [];
    this.ballTrail = [];
    
    this.init();
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

    // Create walls
    const walls = [
      // Left wall
      Bodies.rectangle(10, this.height / 2, 20, this.height, wallOptions),
      // Right wall
      Bodies.rectangle(this.width - 10, this.height / 2, 20, this.height, wallOptions),
      // Top wall
      Bodies.rectangle(this.width / 2, 10, this.width, 20, wallOptions),
      // Bottom left slope - adjusted to guide ball to center
      Bodies.rectangle(100, this.height - 80, 180, 20, {
        ...wallOptions,
        angle: Math.PI * 0.2,
      }),
      // Bottom right slope - adjusted to guide ball to center
      Bodies.rectangle(this.width - 140, this.height - 80, 180, 20, {
        ...wallOptions,
        angle: -Math.PI * 0.2,
      }),
      // Launch lane right wall
      Bodies.rectangle(this.width - 25, this.height - 300, 10, 500, wallOptions),
      // Launch lane left wall
      Bodies.rectangle(this.width - 55, this.height - 300, 10, 400, wallOptions),
      // Launch lane stopper (ball rests here)
      Bodies.rectangle(this.width - 40, this.height - 80, 40, 10, wallOptions),
    ];

    // Create drain sensor (invisible area at bottom center)
    this.drain = Bodies.rectangle(this.width / 2 - 20, this.height + 30, 200, 40, {
      isStatic: true,
      isSensor: true,
      label: 'drain',
      render: {
        fillStyle: 'transparent',
      },
    });

    // Launch lane
    const launchLane = [
      Bodies.rectangle(this.width - 35, this.height - 200, 10, 400, wallOptions),
    ];

    Composite.add(this.engine.world, [...walls, ...launchLane, this.drain]);
  }

  createFlippers() {
    const flipperWidth = this.settings.flipperWidth;
    const flipperHeight = 15;
    const flipperY = this.height - 100;
    
    const flipperOptions = {
      render: {
        fillStyle: '#ff006e',
        strokeStyle: '#00f5ff',
        lineWidth: 2,
      },
      chamfer: { radius: 7 },
    };

    // Left flipper
    const leftPivotX = 120;
    this.leftFlipper = Bodies.rectangle(
      leftPivotX + flipperWidth / 2 - 20,
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
      pointA: { x: -flipperWidth / 2 + 20, y: 0 },
      bodyB: leftPivot,
      pointB: { x: 0, y: 0 },
      stiffness: 1,
      length: 0,
    });

    // Right flipper
    const rightPivotX = this.width - 120;
    this.rightFlipper = Bodies.rectangle(
      rightPivotX - flipperWidth / 2 + 20,
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
      pointA: { x: flipperWidth / 2 - 20, y: 0 },
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
    const bumperPositions = [
      { x: 150, y: 200, color: '#ff006e' },
      { x: 250, y: 280, color: '#00f5ff' },
      { x: 350, y: 200, color: '#ff006e' },
    ];

    this.bumpers = bumperPositions.map((pos, index) => {
      const bumper = Bodies.circle(pos.x, pos.y, 35, {
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
      return bumper;
    });

    Composite.add(this.engine.world, this.bumpers);
  }

  createBall() {
    // Ball starts in launch lane, resting on stopper
    const ballX = this.width - 40;
    const ballY = this.height - 110;

    this.ball = Bodies.circle(ballX, ballY, 15, {
      restitution: 0.6,
      friction: 0.001,
      frictionAir: 0.001,
      density: 0.002,
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
    const points = 100 * this.settings.multiplier;
    this.score += points;
    
    // Trigger glow effect
    bumper.isGlowing = true;
    bumper.render.strokeStyle = '#ffff00';
    bumper.render.lineWidth = 8;
    
    setTimeout(() => {
      bumper.isGlowing = false;
      bumper.render.strokeStyle = '#ffffff';
      bumper.render.lineWidth = 3;
    }, 200);

    // State channel simulation
    console.log(`%c🔐 Signing State Update... Bumper ${index + 1} hit! +${points} points`, 
      'color: #00f5ff; font-weight: bold; font-size: 14px;');
    console.log(`%c📡 Yellow Network: State channel update pending...`, 
      'color: #fbbf24; font-size: 12px;');

    this.onBumperHit(index, points);
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
      
      // Left flipper: A or Left Arrow
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
        Body.setAngularVelocity(this.leftFlipper, -0.4);
      }
      
      // Right flipper: D or Right Arrow
      if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
        Body.setAngularVelocity(this.rightFlipper, 0.4);
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
    
    // Reset ball position to launch lane
    Body.setPosition(this.ball, { x: this.width - 40, y: this.height - 110 });
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

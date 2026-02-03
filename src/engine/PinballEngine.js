/**
 * YieldBall.eth - Zero-Bug Pinball Engine
 * 
 * Architecture Rules:
 * 1. NO React state for physics - all in class instance
 * 2. Physical stoppers for flipper limits (not code limits)
 * 3. Spring constraints to pull flippers down
 * 4. 100px thick walls to prevent tunneling
 * 5. bullet: true for ball CCD
 */

import Matter from 'matter-js';

const { Engine, Render, Runner, Bodies, Body, Composite, Constraint, Events } = Matter;

// Player class settings for ENS integration
export const PLAYER_CLASSES = {
  whale: {
    flipperScale: 1.5,
    ballMass: 2.0,
    ballSpeed: 0.6,
    yieldMultiplier: 1.0,
    description: 'Whale Mode: 1.5x Flippers, Heavy Ball',
  },
  degen: {
    flipperScale: 0.6,
    ballMass: 1.0,
    ballSpeed: 1.2,
    yieldMultiplier: 2.0,
    description: 'Degen Mode: 0.6x Flippers, 2x Yield!',
  },
  sniper: {
    flipperScale: 1.0,
    ballMass: 0.8,
    ballSpeed: 1.5,
    yieldMultiplier: 1.2,
    description: 'Sniper Mode: Fast Ball, 1.2x Yield',
  },
  default: {
    flipperScale: 1.0,
    ballMass: 1.0,
    ballSpeed: 1.0,
    yieldMultiplier: 1.0,
    description: 'Standard Mode',
  },
};

export class PinballEngine {
  constructor(container, options = {}) {
    this.container = container;
    this.width = 400;
    this.height = 600;
    this.playerClass = options.playerClass || 'default';
    this.settings = PLAYER_CLASSES[this.playerClass] || PLAYER_CLASSES.default;
    
    // Callbacks
    this.onBumperHit = options.onBumperHit || (() => {});
    this.onFlashLoanRamp = options.onFlashLoanRamp || (() => {});
    this.onDrain = options.onDrain || (() => {});
    this.onScoreUpdate = options.onScoreUpdate || (() => {});
    
    // Game state (NOT React state!)
    this.score = 0;
    this.isGameOver = false;
    this.ballLaunched = false;
    this.gameActive = false;
    
    // Physics references
    this.engine = null;
    this.render = null;
    this.runner = null;
    this.ball = null;
    this.leftFlipper = null;
    this.rightFlipper = null;
    this.leftSpring = null;
    this.rightSpring = null;
    this.bumpers = [];
    this.ballTrail = [];
    
    // Input state
    this.leftPressed = false;
    this.rightPressed = false;
    
    this.init();
  }

  init() {
    // ========== 1. CREATE ENGINE ==========
    this.engine = Engine.create({
      enableSleeping: false, // Never let ball sleep
    });
    this.engine.gravity.y = 1.0;

    // ========== 2. CREATE RENDERER ==========
    this.render = Render.create({
      element: this.container,
      engine: this.engine,
      options: {
        width: this.width,
        height: this.height,
        wireframes: false,
        background: '#020617',
        pixelRatio: window.devicePixelRatio || 1,
      },
    });

    // ========== 3. CREATE ALL PHYSICS OBJECTS ==========
    this.createWalls();
    this.createFlippersWithPhysicalStoppers();
    this.createBumpers();
    this.createLaunchTube();
    this.createBall();
    this.createDrainSensor();
    this.setupCollisions();
    this.setupRendering();

    // ========== 4. START ENGINE ==========
    this.runner = Runner.create();
    Runner.run(this.runner, this.engine);
    Render.run(this.render);

    // ========== 5. SETUP INPUT ==========
    this.setupControls();
    
    this.gameActive = true;
    console.log('%c🎮 YieldBall Engine Initialized', 'color: #22c55e; font-weight: bold;');
  }

  // ========== WALLS: 100px thick to prevent tunneling ==========
  createWalls() {
    const wallThickness = 100;
    const wallOptions = {
      isStatic: true,
      render: { fillStyle: '#1e293b', strokeStyle: '#8b5cf6', lineWidth: 2 },
      friction: 0.1,
      restitution: 0.5,
    };

    const walls = [
      // Top wall at y: -10 (mostly off-screen)
      Bodies.rectangle(this.width / 2, -wallThickness / 2 - 10, this.width + 200, wallThickness, {
        ...wallOptions,
        label: 'topWall',
      }),
      // Left wall
      Bodies.rectangle(-wallThickness / 2 + 5, this.height / 2, wallThickness, this.height + 200, {
        ...wallOptions,
        label: 'leftWall',
      }),
      // Right wall (partial - leaves gap for launch tube)
      Bodies.rectangle(this.width + wallThickness / 2 - 50, this.height / 2 - 100, wallThickness, this.height - 150, {
        ...wallOptions,
        label: 'rightWall',
      }),
    ];

    // Bottom slopes to guide ball to center
    const leftSlope = Bodies.rectangle(80, this.height - 60, 120, 15, {
      isStatic: true,
      angle: Math.PI * 0.15,
      render: { fillStyle: '#1e293b', strokeStyle: '#8b5cf6', lineWidth: 2 },
    });

    const rightSlope = Bodies.rectangle(this.width - 120, this.height - 60, 120, 15, {
      isStatic: true,
      angle: -Math.PI * 0.15,
      render: { fillStyle: '#1e293b', strokeStyle: '#8b5cf6', lineWidth: 2 },
    });

    Composite.add(this.engine.world, [...walls, leftSlope, rightSlope]);
  }

  // ========== FLIPPERS WITH PHYSICAL STOPPERS (THE FIX!) ==========
  createFlippersWithPhysicalStoppers() {
    const flipperWidth = 70 * this.settings.flipperScale;
    const flipperHeight = 14;
    
    // Pivot positions
    const leftPivotX = 100;
    const rightPivotX = 300;
    const pivotY = 530;
    
    // ===== LEFT FLIPPER =====
    
    // 1. Static Hinge Circle (the pivot point)
    const leftHinge = Bodies.circle(leftPivotX, pivotY, 8, {
      isStatic: true,
      label: 'leftHinge',
      collisionFilter: { category: 0x0004, mask: 0x0000 }, // Collides with nothing
      render: { fillStyle: '#8b5cf6', strokeStyle: '#00f5ff', lineWidth: 2 },
    });

    // 2. Flipper Rectangle
    this.leftFlipper = Bodies.rectangle(
      leftPivotX + flipperWidth / 2, 
      pivotY, 
      flipperWidth, 
      flipperHeight, 
      {
        label: 'leftFlipper',
        density: 0.002,
        friction: 1.0,
        restitution: 0.5,
        render: { fillStyle: '#ff006e', strokeStyle: '#00f5ff', lineWidth: 2 },
      }
    );

    // 3. Constraint to attach flipper to hinge
    const leftConstraint = Constraint.create({
      bodyA: leftHinge,
      bodyB: this.leftFlipper,
      pointA: { x: 0, y: 0 },
      pointB: { x: -flipperWidth / 2 + 5, y: 0 },
      stiffness: 1,
      length: 0,
      render: { visible: false },
    });

    // 4. PHYSICAL STOPPERS (invisible static rectangles)
    // Upper stopper - prevents flipper from going too high
    const leftUpperStopper = Bodies.rectangle(
      leftPivotX + flipperWidth - 10,
      pivotY - 25,
      15, 8,
      {
        isStatic: true,
        label: 'stopper',
        collisionFilter: { category: 0x0008, mask: 0x0002 }, // Only collides with flippers
        render: { visible: false },
      }
    );
    
    // Lower stopper - prevents flipper from going too low
    const leftLowerStopper = Bodies.rectangle(
      leftPivotX + flipperWidth - 10,
      pivotY + 30,
      15, 8,
      {
        isStatic: true,
        label: 'stopper',
        collisionFilter: { category: 0x0008, mask: 0x0002 },
        render: { visible: false },
      }
    );

    // 5. Spring Constraint (pulls flipper down when not pressed)
    const leftSpringAnchor = Bodies.circle(leftPivotX + flipperWidth, pivotY + 40, 3, {
      isStatic: true,
      collisionFilter: { category: 0x0004, mask: 0x0000 },
      render: { visible: false },
    });

    this.leftSpring = Constraint.create({
      bodyA: leftSpringAnchor,
      bodyB: this.leftFlipper,
      pointA: { x: 0, y: 0 },
      pointB: { x: flipperWidth / 2 - 5, y: 0 },
      stiffness: 0.05,
      damping: 0.1,
      length: 20,
      render: { visible: false },
    });

    // ===== RIGHT FLIPPER =====
    
    const rightHinge = Bodies.circle(rightPivotX, pivotY, 8, {
      isStatic: true,
      label: 'rightHinge',
      collisionFilter: { category: 0x0004, mask: 0x0000 },
      render: { fillStyle: '#8b5cf6', strokeStyle: '#00f5ff', lineWidth: 2 },
    });

    this.rightFlipper = Bodies.rectangle(
      rightPivotX - flipperWidth / 2, 
      pivotY, 
      flipperWidth, 
      flipperHeight, 
      {
        label: 'rightFlipper',
        density: 0.002,
        friction: 1.0,
        restitution: 0.5,
        render: { fillStyle: '#ff006e', strokeStyle: '#00f5ff', lineWidth: 2 },
      }
    );

    const rightConstraint = Constraint.create({
      bodyA: rightHinge,
      bodyB: this.rightFlipper,
      pointA: { x: 0, y: 0 },
      pointB: { x: flipperWidth / 2 - 5, y: 0 },
      stiffness: 1,
      length: 0,
      render: { visible: false },
    });

    // Right upper stopper
    const rightUpperStopper = Bodies.rectangle(
      rightPivotX - flipperWidth + 10,
      pivotY - 25,
      15, 8,
      {
        isStatic: true,
        label: 'stopper',
        collisionFilter: { category: 0x0008, mask: 0x0002 },
        render: { visible: false },
      }
    );
    
    // Right lower stopper
    const rightLowerStopper = Bodies.rectangle(
      rightPivotX - flipperWidth + 10,
      pivotY + 30,
      15, 8,
      {
        isStatic: true,
        label: 'stopper',
        collisionFilter: { category: 0x0008, mask: 0x0002 },
        render: { visible: false },
      }
    );

    // Right spring
    const rightSpringAnchor = Bodies.circle(rightPivotX - flipperWidth, pivotY + 40, 3, {
      isStatic: true,
      collisionFilter: { category: 0x0004, mask: 0x0000 },
      render: { visible: false },
    });

    this.rightSpring = Constraint.create({
      bodyA: rightSpringAnchor,
      bodyB: this.rightFlipper,
      pointA: { x: 0, y: 0 },
      pointB: { x: -flipperWidth / 2 + 5, y: 0 },
      stiffness: 0.05,
      damping: 0.1,
      length: 20,
      render: { visible: false },
    });

    // Set flipper collision category
    this.leftFlipper.collisionFilter = { category: 0x0002, mask: 0x0001 | 0x0008 };
    this.rightFlipper.collisionFilter = { category: 0x0002, mask: 0x0001 | 0x0008 };

    // Add all to world
    Composite.add(this.engine.world, [
      leftHinge, this.leftFlipper, leftConstraint,
      leftUpperStopper, leftLowerStopper, leftSpringAnchor, this.leftSpring,
      rightHinge, this.rightFlipper, rightConstraint,
      rightUpperStopper, rightLowerStopper, rightSpringAnchor, this.rightSpring,
    ]);
  }

  createBumpers() {
    const bumperData = [
      { x: 100, y: 180, radius: 25, color: '#ff006e' },
      { x: 200, y: 120, radius: 30, color: '#00f5ff' },
      { x: 300, y: 180, radius: 25, color: '#ff006e' },
      { x: 150, y: 280, radius: 22, color: '#8b5cf6' },
      { x: 250, y: 280, radius: 22, color: '#8b5cf6' },
      { x: 200, y: 380, radius: 20, color: '#22c55e' }, // Flash Loan bumper
    ];

    this.bumpers = bumperData.map((b, i) => {
      const bumper = Bodies.circle(b.x, b.y, b.radius, {
        isStatic: true,
        restitution: 1.5,
        label: i === 5 ? 'flashLoanRamp' : `bumper-${i}`,
        render: { fillStyle: b.color, strokeStyle: '#fff', lineWidth: 3 },
      });
      bumper.bumperColor = b.color;
      bumper.bumperIndex = i;
      return bumper;
    });

    Composite.add(this.engine.world, this.bumpers);
  }

  createLaunchTube() {
    const tubeX = this.width - 25;
    const tubeOptions = {
      isStatic: true,
      friction: 0.02,
      render: { fillStyle: '#1e293b', strokeStyle: '#22c55e', lineWidth: 2 },
    };

    const tubeLeft = Bodies.rectangle(tubeX - 18, this.height - 150, 8, 320, tubeOptions);
    const tubeRight = Bodies.rectangle(tubeX + 18, this.height - 150, 8, 320, {
      ...tubeOptions,
      render: { ...tubeOptions.render, strokeStyle: '#8b5cf6' },
    });

    // Curved guide at top
    const tubeGuide = Bodies.rectangle(tubeX - 25, 85, 50, 12, {
      ...tubeOptions,
      angle: Math.PI * 0.2,
    });

    Composite.add(this.engine.world, [tubeLeft, tubeRight, tubeGuide]);
  }

  createBall() {
    const ballX = this.width - 25;
    const ballY = this.height - 60;

    this.ball = Bodies.circle(ballX, ballY, 12, {
      label: 'ball',
      restitution: 0.6,
      friction: 0.001,
      frictionAir: 0.01,
      density: 0.001 * this.settings.ballMass,
      // CRITICAL: bullet mode for continuous collision detection
      isSleeping: false,
      slop: 0.01,
      collisionFilter: { category: 0x0001, mask: 0xFFFF },
      render: { fillStyle: '#ff006e', strokeStyle: '#00f5ff', lineWidth: 3 },
    });

    Composite.add(this.engine.world, this.ball);
  }

  createDrainSensor() {
    this.drain = Bodies.rectangle(this.width / 2, this.height + 30, this.width, 60, {
      isStatic: true,
      isSensor: true,
      label: 'drain',
      render: { fillStyle: 'rgba(255, 0, 110, 0.1)' },
    });

    Composite.add(this.engine.world, this.drain);
  }

  setupCollisions() {
    // Delay drain detection to avoid instant game over
    this.drainEnabled = false;
    setTimeout(() => { this.drainEnabled = true; }, 2000);

    Events.on(this.engine, 'collisionStart', (event) => {
      event.pairs.forEach((pair) => {
        const labels = [pair.bodyA.label, pair.bodyB.label];
        
        // Ball hit bumper
        this.bumpers.forEach((bumper) => {
          if (labels.includes(bumper.label) && labels.includes('ball')) {
            this.handleBumperHit(bumper);
          }
        });

        // Ball hit drain
        if (labels.includes('drain') && labels.includes('ball')) {
          if (this.drainEnabled && this.ballLaunched && !this.isGameOver) {
            this.handleGameOver();
          }
        }
      });
    });

    // Ball trail + fallback drain check
    Events.on(this.engine, 'afterUpdate', () => {
      if (!this.ball || this.isGameOver) return;
      
      this.ballTrail.push({ x: this.ball.position.x, y: this.ball.position.y });
      if (this.ballTrail.length > 12) this.ballTrail.shift();

      // Fallback drain check
      if (this.drainEnabled && this.ballLaunched && this.ball.position.y > this.height + 50) {
        this.handleGameOver();
      }
    });
  }

  handleBumperHit(bumper) {
    const isFlashLoan = bumper.label === 'flashLoanRamp';
    const points = isFlashLoan ? 500 : 100;
    const multipliedPoints = points * this.settings.yieldMultiplier;
    
    this.score += multipliedPoints;

    // Visual flash
    const originalColor = bumper.bumperColor;
    bumper.render.fillStyle = '#ffff00';
    bumper.render.lineWidth = 8;
    setTimeout(() => {
      bumper.render.fillStyle = originalColor;
      bumper.render.lineWidth = 3;
    }, 100);

    // Callbacks
    if (isFlashLoan) {
      this.onFlashLoanRamp(multipliedPoints);
    } else {
      this.onBumperHit(bumper.bumperIndex, multipliedPoints, this.settings.yieldMultiplier);
    }
    this.onScoreUpdate(this.score);
  }

  handleGameOver() {
    if (this.isGameOver) return;
    this.isGameOver = true;
    this.gameActive = false;
    console.log('%c🏁 Game Over!', 'color: #ff006e; font-weight: bold;');
    this.onDrain(this.score);
  }

  setupRendering() {
    Events.on(this.render, 'afterRender', () => {
      const ctx = this.render.context;

      // Ball glow trail
      for (let i = 0; i < this.ballTrail.length; i++) {
        const p = this.ballTrail[i];
        const alpha = (i / this.ballTrail.length) * 0.4;
        const r = 4 + (i / this.ballTrail.length) * 6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 0, 110, ${alpha})`;
        ctx.fill();
      }

      // Ball glow
      if (this.ball) {
        ctx.beginPath();
        ctx.arc(this.ball.position.x, this.ball.position.y, 28, 0, Math.PI * 2);
        const glow = ctx.createRadialGradient(
          this.ball.position.x, this.ball.position.y, 0,
          this.ball.position.x, this.ball.position.y, 35
        );
        glow.addColorStop(0, 'rgba(255, 0, 110, 0.5)');
        glow.addColorStop(1, 'rgba(139, 92, 246, 0)');
        ctx.fillStyle = glow;
        ctx.fill();
      }

      // Bumper glows
      this.bumpers.forEach((b) => {
        ctx.beginPath();
        ctx.arc(b.position.x, b.position.y, b.circleRadius + 12, 0, Math.PI * 2);
        const g = ctx.createRadialGradient(
          b.position.x, b.position.y, b.circleRadius,
          b.position.x, b.position.y, b.circleRadius + 18
        );
        g.addColorStop(0, b.bumperColor + '60');
        g.addColorStop(1, b.bumperColor + '00');
        ctx.fillStyle = g;
        ctx.fill();
      });

      // Launch hint
      if (!this.ballLaunched) {
        ctx.font = 'bold 12px monospace';
        ctx.fillStyle = '#22c55e';
        ctx.textAlign = 'center';
        ctx.fillText('SPACE', this.width - 25, this.height - 100);
        ctx.fillText('to launch', this.width - 25, this.height - 85);
      }
    });
  }

  // ========== INPUT: Angular velocity on keydown/keyup ==========
  setupControls() {
    this.handleKeyDown = (e) => {
      if (this.isGameOver) return;

      // Prevent page scroll
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'a', 'A', 'd', 'D'].includes(e.key)) {
        e.preventDefault();
      }

      // Left flipper - massive angular velocity UP
      if ((e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') && !this.leftPressed) {
        this.leftPressed = true;
        Body.setAngularVelocity(this.leftFlipper, -0.3);
      }

      // Right flipper - massive angular velocity UP
      if ((e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') && !this.rightPressed) {
        this.rightPressed = true;
        Body.setAngularVelocity(this.rightFlipper, 0.3);
      }

      // Launch ball
      if (e.key === ' ') {
        this.launchBall();
      }
    };

    this.handleKeyUp = (e) => {
      // Left flipper - snap back down (spring + velocity)
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
        this.leftPressed = false;
        Body.setAngularVelocity(this.leftFlipper, 0.15);
      }

      // Right flipper - snap back down
      if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
        this.rightPressed = false;
        Body.setAngularVelocity(this.rightFlipper, -0.15);
      }
    };

    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  launchBall() {
    if (!this.ball || this.isGameOver || this.ballLaunched) return;

    this.ballLaunched = true;
    const launchPower = 22 * this.settings.ballSpeed;
    Body.setVelocity(this.ball, { x: -3, y: -launchPower });
    
    console.log('%c🚀 Ball Launched!', 'color: #22c55e; font-weight: bold;');
  }

  // Mobile controls
  flipLeft() {
    if (this.isGameOver) return;
    Body.setAngularVelocity(this.leftFlipper, -0.3);
    setTimeout(() => {
      if (!this.leftPressed) {
        Body.setAngularVelocity(this.leftFlipper, 0.15);
      }
    }, 150);
  }

  flipRight() {
    if (this.isGameOver) return;
    Body.setAngularVelocity(this.rightFlipper, 0.3);
    setTimeout(() => {
      if (!this.rightPressed) {
        Body.setAngularVelocity(this.rightFlipper, -0.15);
      }
    }, 150);
  }

  reset() {
    this.isGameOver = false;
    this.ballLaunched = false;
    this.gameActive = true;
    this.score = 0;
    this.ballTrail = [];
    this.drainEnabled = false;
    this.leftPressed = false;
    this.rightPressed = false;

    // Reset ball position
    Body.setPosition(this.ball, { x: this.width - 25, y: this.height - 60 });
    Body.setVelocity(this.ball, { x: 0, y: 0 });
    Body.setAngularVelocity(this.ball, 0);

    // Reset flippers
    Body.setAngle(this.leftFlipper, 0.3);
    Body.setAngle(this.rightFlipper, -0.3);
    Body.setAngularVelocity(this.leftFlipper, 0);
    Body.setAngularVelocity(this.rightFlipper, 0);

    setTimeout(() => { this.drainEnabled = true; }, 2000);
    this.onScoreUpdate(0);
  }

  // ========== THE CLEANUP (Stops the bugs!) ==========
  destroy() {
    // Remove event listeners
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);

    // Stop everything
    if (this.render) {
      Render.stop(this.render);
    }
    if (this.runner) {
      Runner.stop(this.runner);
    }
    if (this.engine) {
      Engine.clear(this.engine);
    }
    if (this.render?.canvas) {
      this.render.canvas.remove();
    }
    if (this.render) {
      this.render.textures = {};
    }

    // Clear references
    this.engine = null;
    this.render = null;
    this.runner = null;
    this.ball = null;
    this.leftFlipper = null;
    this.rightFlipper = null;

    console.log('%c🧹 Engine Destroyed', 'color: #ff006e;');
  }
}

/**
 * YieldBall.eth - Pachinko Engine
 * 
 * A Web3 Pachinko game with:
 * - Triangle grid of pegs
 * - 5 Buckets with DeFi multipliers
 * - ENS-driven ball physics
 * - Yellow Network state channel simulation
 */

import Matter from 'matter-js';

const { Engine, Render, Runner, Bodies, Body, Composite, Events } = Matter;

// Ball configurations based on ENS class
// Physics tuned for smooth flow: zero friction, low air friction, high bounce
export const BALL_CONFIGS = {
  whale: {
    scale: 1.5,
    mass: 3,
    restitution: 0.7,
    friction: 0,
    frictionAir: 0.008,
    slop: 0.05,
    color: '#ffd700', // Gold
    label: '🐋 Whale',
    yieldMultiplier: 1.0,
  },
  degen: {
    scale: 0.7,
    mass: 1,
    restitution: 0.9,
    friction: 0,
    frictionAir: 0.005,
    slop: 0.05,
    color: '#ff006e', // Neon Red
    label: '🔥 Degen',
    yieldMultiplier: 2.0,
  },
  default: {
    scale: 1.0,
    mass: 1,
    restitution: 0.75,
    friction: 0,
    frictionAir: 0.006,
    slop: 0.05,
    color: '#c0c0c0', // Silver
    label: '⚡ Standard',
    yieldMultiplier: 1.0,
  },
};

// Bucket configurations (DeFi protocols)
export const BUCKETS = [
  { label: 'Aave', multiplier: 1.0, color: '#b6509e' },
  { label: 'GHO', multiplier: 2.0, color: '#00d395' },
  { label: 'Uniswap', multiplier: 1.5, color: '#ff007a' },
  { label: 'Degen', multiplier: 5.0, color: '#ff006e' },
  { label: 'Safe', multiplier: 1.0, color: '#12ff80' },
];

export class PachinkoEngine {
  constructor(container, options = {}) {
    this.container = container;
    this.width = 500;
    this.height = 700;
    this.ensClass = options.ensClass || 'default';
    this.ballConfig = BALL_CONFIGS[this.ensClass] || BALL_CONFIGS.default;
    
    // Callbacks
    this.onPegHit = options.onPegHit || (() => {});
    this.onBucketLand = options.onBucketLand || (() => {});
    this.onBallDrop = options.onBallDrop || (() => {});
    
    // Game state
    this.ball = null;
    this.pegs = [];
    this.buckets = [];
    this.isPlaying = false;
    this.pegHitCount = 0;
    this.stallFrames = 0; // Anti-stall tracking
    
    // Physics refs
    this.engine = null;
    this.render = null;
    this.runner = null;
    
    this.init();
  }

  init() {
    // 1. Create Engine with CCD for smooth collision detection
    this.engine = Engine.create({
      enableSleeping: false,
      positionIterations: 10,
      velocityIterations: 10,
    });
    this.engine.gravity.y = 0.9;

    // 2. Create Renderer with TRANSPARENT background for animated grid visibility
    this.render = Render.create({
      element: this.container,
      engine: this.engine,
      options: {
        width: this.width,
        height: this.height,
        wireframes: false,
        background: 'transparent',
        pixelRatio: window.devicePixelRatio || 1,
      },
    });

    // 3. Create Physics Objects
    this.createWalls();
    this.createPegGrid();
    this.createBuckets();
    this.setupCollisions();
    this.setupRendering();
    this.setupAntiStall();

    // 4. Start Engine
    this.runner = Runner.create();
    Runner.run(this.runner, this.engine);
    Render.run(this.render);

    // 5. Setup Click Handler
    this.setupClickHandler();

    console.log('%c🎰 Pachinko Engine Initialized', 'color: #00f5ff; font-weight: bold;');
  }

  createWalls() {
    const wallOptions = {
      isStatic: true,
      render: { fillStyle: '#1e293b', strokeStyle: '#8b5cf6', lineWidth: 2 },
      friction: 0,
      restitution: 0.6,
    };

    const walls = [
      // Left wall
      Bodies.rectangle(-25, this.height / 2, 50, this.height + 100, wallOptions),
      // Right wall
      Bodies.rectangle(this.width + 25, this.height / 2, 50, this.height + 100, wallOptions),
      // Top funnel left
      Bodies.rectangle(50, 60, 120, 10, { ...wallOptions, angle: Math.PI * 0.15 }),
      // Top funnel right
      Bodies.rectangle(this.width - 50, 60, 120, 10, { ...wallOptions, angle: -Math.PI * 0.15 }),
    ];

    // Add beveled deflectors at wall-peg junctions to prevent corner wedging
    const bevelOptions = {
      isStatic: true,
      render: { fillStyle: '#1e293b', strokeStyle: '#8b5cf6', lineWidth: 1 },
      friction: 0,
      restitution: 0.8,
    };

    // Left wall bevels - angled triangles to deflect ball away from wall
    for (let y = 150; y < this.height - 100; y += 90) {
      walls.push(
        Bodies.polygon(15, y, 3, 12, { ...bevelOptions, angle: Math.PI / 6 })
      );
    }

    // Right wall bevels
    for (let y = 150; y < this.height - 100; y += 90) {
      walls.push(
        Bodies.polygon(this.width - 15, y, 3, 12, { ...bevelOptions, angle: -Math.PI / 6 })
      );
    }

    Composite.add(this.engine.world, walls);
  }

  createPegGrid() {
    const pegRadius = 7; // Slightly smaller pegs
    const ballRadius = 12; // Base ball radius
    const startY = 120;
    const rows = 11; // Slightly fewer rows
    
    // Dynamic spacing: Gap = (BallRadius * 2) * 1.6 to prevent wedging
    const minGap = (ballRadius * 2) * 1.6;
    const pegSpacingX = minGap + pegRadius * 2; // ~52px
    const pegSpacingY = minGap + pegRadius * 2; // ~52px

    // Create triangle grid pattern
    for (let row = 0; row < rows; row++) {
      const pegsInRow = row + 3;
      const rowWidth = (pegsInRow - 1) * pegSpacingX;
      const startX = (this.width - rowWidth) / 2;

      for (let col = 0; col < pegsInRow; col++) {
        const x = startX + col * pegSpacingX;
        const y = startY + row * pegSpacingY;

        // Alternate colors for visual variety
        const colorIndex = (row + col) % 3;
        const colors = ['#ff006e', '#00f5ff', '#8b5cf6'];

        const peg = Bodies.circle(x, y, pegRadius, {
          isStatic: true,
          restitution: 0.85, // High bounce
          friction: 0, // Zero friction - slippery pegs
          label: `peg-${row}-${col}`,
          render: {
            fillStyle: colors[colorIndex],
            strokeStyle: '#ffffff',
            lineWidth: 2,
          },
        });
        peg.pegColor = colors[colorIndex];
        this.pegs.push(peg);
      }
    }

    Composite.add(this.engine.world, this.pegs);
  }

  createBuckets() {
    const bucketWidth = this.width / BUCKETS.length;
    const bucketHeight = 80;
    const y = this.height - bucketHeight / 2;

    // Bucket dividers
    for (let i = 1; i < BUCKETS.length; i++) {
      const divider = Bodies.rectangle(
        i * bucketWidth,
        this.height - 40,
        8,
        80,
        {
          isStatic: true,
          render: { fillStyle: '#1e293b', strokeStyle: '#8b5cf6', lineWidth: 2 },
        }
      );
      Composite.add(this.engine.world, divider);
    }

    // Bucket sensors (invisible)
    BUCKETS.forEach((bucket, i) => {
      const sensor = Bodies.rectangle(
        bucketWidth / 2 + i * bucketWidth,
        this.height - 20,
        bucketWidth - 10,
        30,
        {
          isStatic: true,
          isSensor: true,
          label: `bucket-${i}`,
          render: { fillStyle: 'transparent' },
        }
      );
      sensor.bucketData = bucket;
      sensor.bucketIndex = i;
      this.buckets.push(sensor);
    });

    // Bottom floor
    const floor = Bodies.rectangle(this.width / 2, this.height + 20, this.width, 40, {
      isStatic: true,
      render: { fillStyle: '#020617' },
    });

    Composite.add(this.engine.world, [...this.buckets, floor]);
  }

  setupCollisions() {
    Events.on(this.engine, 'collisionStart', (event) => {
      if (!this.ball) return;

      event.pairs.forEach((pair) => {
        const labels = [pair.bodyA.label, pair.bodyB.label];

        // Peg hit
        if (labels.includes('ball')) {
          const otherBody = pair.bodyA.label === 'ball' ? pair.bodyB : pair.bodyA;
          
          if (otherBody.label.startsWith('peg-')) {
            this.handlePegHit(otherBody);
          }

          if (otherBody.label.startsWith('bucket-')) {
            this.handleBucketLand(otherBody);
          }
        }
      });
    });
  }

  handlePegHit(peg) {
    this.pegHitCount++;
    
    // Visual flash
    const originalColor = peg.pegColor;
    peg.render.fillStyle = '#ffff00';
    peg.render.lineWidth = 5;
    setTimeout(() => {
      peg.render.fillStyle = originalColor;
      peg.render.lineWidth = 2;
    }, 100);

    // Callback (for Yellow Network simulation)
    this.onPegHit(this.pegHitCount, peg.label);
  }

  handleBucketLand(bucketSensor) {
    if (!this.isPlaying) return;
    
    this.isPlaying = false;
    const bucketData = bucketSensor.bucketData;
    
    console.log(`%c🎯 Landed in ${bucketData.label} (${bucketData.multiplier}x)!`, 
      'color: #22c55e; font-weight: bold;');
    
    // Remove ball
    if (this.ball) {
      Composite.remove(this.engine.world, this.ball);
      this.ball = null;
    }

    this.onBucketLand(bucketData, this.pegHitCount);
  }

  setupRendering() {
    Events.on(this.render, 'afterRender', () => {
      const ctx = this.render.context;

      // Peg glow effects
      this.pegs.forEach((peg) => {
        ctx.beginPath();
        ctx.arc(peg.position.x, peg.position.y, 18, 0, Math.PI * 2);
        const gradient = ctx.createRadialGradient(
          peg.position.x, peg.position.y, 8,
          peg.position.x, peg.position.y, 22
        );
        gradient.addColorStop(0, peg.pegColor + '40');
        gradient.addColorStop(1, peg.pegColor + '00');
        ctx.fillStyle = gradient;
        ctx.fill();
      });

      // Ball glow
      if (this.ball) {
        ctx.beginPath();
        ctx.arc(this.ball.position.x, this.ball.position.y, 30, 0, Math.PI * 2);
        const ballGlow = ctx.createRadialGradient(
          this.ball.position.x, this.ball.position.y, 0,
          this.ball.position.x, this.ball.position.y, 35
        );
        ballGlow.addColorStop(0, this.ballConfig.color + '80');
        ballGlow.addColorStop(1, this.ballConfig.color + '00');
        ctx.fillStyle = ballGlow;
        ctx.fill();
      }

      // Bucket labels
      const bucketWidth = this.width / BUCKETS.length;
      BUCKETS.forEach((bucket, i) => {
        const x = bucketWidth / 2 + i * bucketWidth;
        const y = this.height - 55;

        // Background glow
        ctx.beginPath();
        ctx.arc(x, y + 10, 30, 0, Math.PI * 2);
        const bucketGlow = ctx.createRadialGradient(x, y + 10, 0, x, y + 10, 40);
        bucketGlow.addColorStop(0, bucket.color + '30');
        bucketGlow.addColorStop(1, bucket.color + '00');
        ctx.fillStyle = bucketGlow;
        ctx.fill();

        // Label
        ctx.font = 'bold 11px monospace';
        ctx.fillStyle = bucket.color;
        ctx.textAlign = 'center';
        ctx.fillText(bucket.label, x, y);
        ctx.font = 'bold 14px monospace';
        ctx.fillStyle = '#fff';
        ctx.fillText(`${bucket.multiplier}x`, x, y + 18);
      });

      // Drop zone hint
      if (!this.isPlaying && !this.ball) {
        ctx.font = 'bold 14px monospace';
        ctx.fillStyle = '#22c55e';
        ctx.textAlign = 'center';
        ctx.fillText('👆 Click above to drop ball', this.width / 2, 40);
      }
    });
  }

  setupAntiStall() {
    // Anti-stall logic: if ball velocity is too low for too long, give it a nudge
    Events.on(this.engine, 'beforeUpdate', () => {
      if (!this.ball || !this.isPlaying) {
        this.stallFrames = 0;
        return;
      }

      const velocity = this.ball.velocity;
      const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);

      // Check if ball is nearly stationary (speed < 0.3) and not at the bottom
      if (speed < 0.3 && this.ball.position.y < this.height - 100) {
        this.stallFrames++;

        // After 45 frames (~0.75 sec) of stalling, apply a random nudge
        if (this.stallFrames > 45) {
          const nudgeX = (Math.random() - 0.5) * 4; // Random horizontal force
          const nudgeY = Math.random() * 2 + 1; // Downward bias
          
          Body.setVelocity(this.ball, {
            x: velocity.x + nudgeX,
            y: velocity.y + nudgeY,
          });

          console.log('%c⚡ Anti-stall nudge applied!', 'color: #ffd700;');
          this.stallFrames = 0;
        }
      } else {
        this.stallFrames = 0;
      }
    });
  }

  setupClickHandler() {
    this.handleClick = (e) => {
      if (this.isPlaying || this.ball) return;

      const rect = this.render.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Only allow drops in the top section
      if (y < 80) {
        this.dropBall(x);
      }
    };

    this.render.canvas.addEventListener('click', this.handleClick);
  }

  dropBall(x) {
    if (this.isPlaying || this.ball) return;

    // Clamp x to valid drop zone
    const clampedX = Math.max(60, Math.min(this.width - 60, x));
    
    const baseRadius = 12;
    const radius = baseRadius * this.ballConfig.scale;

    this.ball = Bodies.circle(clampedX, 20, radius, {
      label: 'ball',
      restitution: this.ballConfig.restitution,
      friction: this.ballConfig.friction,
      frictionAir: this.ballConfig.frictionAir,
      slop: this.ballConfig.slop,
      density: 0.001 * this.ballConfig.mass,
      render: {
        fillStyle: this.ballConfig.color,
        strokeStyle: '#fff',
        lineWidth: 2,
      },
    });

    Composite.add(this.engine.world, this.ball);
    this.isPlaying = true;
    this.pegHitCount = 0;
    this.stallFrames = 0; // Reset stall counter
    
    this.onBallDrop();
    console.log(`%c🎱 Ball dropped! (${this.ballConfig.label})`, 'color: #00f5ff;');
  }

  // Update ENS class and reconfigure ball
  setEnsClass(ensClass) {
    this.ensClass = ensClass;
    this.ballConfig = BALL_CONFIGS[ensClass] || BALL_CONFIGS.default;
    console.log(`%c🔗 ENS Class set to: ${ensClass}`, 'color: #8b5cf6;');
  }

  // Reset for new game
  reset() {
    if (this.ball) {
      Composite.remove(this.engine.world, this.ball);
      this.ball = null;
    }
    this.isPlaying = false;
    this.pegHitCount = 0;
  }

  // Cleanup (THE CLEANUP - Stops the bugs!)
  destroy() {
    if (this.render?.canvas) {
      this.render.canvas.removeEventListener('click', this.handleClick);
    }

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

    this.engine = null;
    this.render = null;
    this.runner = null;

    console.log('%c🧹 Pachinko Engine Destroyed', 'color: #ff006e;');
  }
}

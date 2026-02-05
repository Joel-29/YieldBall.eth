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

const { Engine, Render, Runner, Bodies, Body, Composite, Events, Vector } = Matter;

// =============================================================================
// PHYSICS CONFIGURATION - Tuned for smooth, natural Pachinko gameplay
// =============================================================================
export const PHYSICS_CONFIG = {
  // Anti-stuck detection thresholds
  STUCK_VELOCITY_THRESHOLD: 0.4,      // Speed below which ball might be stuck
  STUCK_FRAMES_THRESHOLD: 40,          // Frames before applying nudge (~0.67s at 60fps)
  STUCK_CORNER_THRESHOLD: 60,          // Longer threshold for corner detection
  
  // Anti-stuck nudge forces (small, natural-feeling)
  NUDGE_FORCE_MIN: 0.8,
  NUDGE_FORCE_MAX: 1.5,
  NUDGE_DOWNWARD_BIAS: 0.6,            // Slight downward preference
  
  // Collision position correction
  COLLISION_OFFSET: 0.5,               // Pixels to offset after collision
  OVERLAP_CORRECTION: 1.2,             // Multiplier for overlap resolution
  
  // Jitter prevention
  JITTER_VELOCITY_THRESHOLD: 0.2,      // Very low velocity = jittering
  JITTER_DAMPING: 0.85,                // Damping to apply when jittering
  
  // Boundary margins
  WALL_MARGIN: 15,                     // Min distance from walls
  PEG_ESCAPE_VELOCITY: 2.0,            // Min velocity to escape peg traps
  
  // Deterministic randomness seed (changes per drop)
  RANDOM_SEED_MULTIPLIER: 1337,
};

// Ball configurations based on ENS class
// Physics tuned for HIGH-VELOCITY arcade feel with anti-stuck properties
export const BALL_CONFIGS = {
  whale: {
    scale: 1.5,
    mass: 3,
    restitution: 0.4,     // Lower bounce at high speed prevents flying off
    friction: 0.006,      // Lower friction for speed
    frictionAir: 0.008,   // LOW air friction - ball maintains speed
    frictionStatic: 0.015,
    slop: 0.02,
    color: '#ffd700',
    label: '🐋 Whale',
    yieldMultiplier: 1.0,
    speedMultiplier: 1.0, // Base speed
    description: 'Heavy ball, hard to bounce',
  },
  degen: {
    scale: 0.7,
    mass: 1,
    restitution: 0.45,    // Slightly higher for degen chaos
    friction: 0.004,
    frictionAir: 0.006,   // VERY LOW air friction - max speed!
    frictionStatic: 0.01,
    slop: 0.02,
    color: '#ff006e',
    label: '🔥 Degen',
    yieldMultiplier: 2.0,
    speedMultiplier: 1.2, // 1.2x speed boost for Degen class!
    description: 'Small & fast, 2x Yield!',
  },
  default: {
    scale: 1.0,
    mass: 1,
    restitution: 0.42,    // Balanced bounce
    friction: 0.005,
    frictionAir: 0.008,   // LOW air friction for snappy gameplay
    frictionStatic: 0.012,
    slop: 0.02,
    color: '#c0c0c0',
    label: '⚡ Standard',
    yieldMultiplier: 1.0,
    speedMultiplier: 1.0,
    description: 'Balanced ball',
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
    
    // ENS Speed Multiplier - Degen gets 1.2x gravity for even faster gameplay
    this.speedMultiplier = this.ballConfig.speedMultiplier || 1.0;
    
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
    
    // Anti-stuck tracking system
    this.stuckDetection = {
      stallFrames: 0,           // Frames with low velocity
      cornerFrames: 0,          // Frames stuck near corners
      lastPosition: { x: 0, y: 0 },
      lastVelocity: { x: 0, y: 0 },
      recentCollisions: [],     // Track recent collision points
      jitterCount: 0,           // Consecutive jitter detections
      dropSeed: 0,              // Deterministic randomness seed
    };
    
    // Physics refs
    this.engine = null;
    this.render = null;
    this.runner = null;
    
    this.init();
  }

  init() {
    // 1. Create Engine with HIGH-VELOCITY physics (aggressive arcade feel)
    this.engine = Engine.create({
      enableSleeping: false,
      positionIterations: 8,   // More iterations for faster collisions
      velocityIterations: 6,
    });
    this.engine.gravity.y = 1;
    // HIGH-VELOCITY: 0.002 gravity scale for aggressive downward pull
    // ENS Degen class gets 1.2x gravity multiplier!
    this.engine.gravity.scale = 0.002 * this.speedMultiplier;

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
    const pegRadius = 8;
    const startY = 120;
    const rows = 12;
    const pegSpacingX = 45;
    const pegSpacingY = 45;

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

        // HIGH-VELOCITY: Lower peg restitution (0.5) prevents wild bounces at speed
        // Slight variation per peg prevents perfectly symmetric bounces
        const pegVariation = ((row * 7 + col * 13) % 100) / 1000; // 0 to 0.099
        const pegRestitution = 0.5 + (pegVariation * 0.5); // 0.5 to 0.55 range

        const peg = Bodies.circle(x, y, pegRadius, {
          isStatic: true,
          restitution: pegRestitution,
          friction: 0.003 + (pegVariation / 3), // Lower friction for speed
          frictionStatic: 0.008,
          slop: 0.01,
          label: `peg-${row}-${col}`,
          render: {
            fillStyle: colors[colorIndex],
            strokeStyle: '#ffffff',
            lineWidth: 2,
          },
        });
        peg.pegColor = colors[colorIndex];
        peg.pegRow = row;
        peg.pegCol = col;
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
    // Comprehensive anti-stuck system with multiple detection strategies
    Events.on(this.engine, 'beforeUpdate', () => {
      if (!this.ball || !this.isPlaying) {
        this.resetStuckDetection();
        return;
      }

      const pos = this.ball.position;
      const vel = this.ball.velocity;
      const speed = Vector.magnitude(vel);
      const sd = this.stuckDetection;

      // Skip if ball is near the bottom (about to land)
      if (pos.y > this.height - 100) {
        this.resetStuckDetection();
        return;
      }

      // 1. JITTER DETECTION - Very low velocity oscillation
      if (speed < PHYSICS_CONFIG.JITTER_VELOCITY_THRESHOLD && speed > 0.01) {
        // Check if velocity is oscillating (sign changes)
        const velChanged = (vel.x * sd.lastVelocity.x < 0) || (vel.y * sd.lastVelocity.y < 0);
        if (velChanged) {
          sd.jitterCount++;
          if (sd.jitterCount > 8) {
            this.applyJitterCorrection();
            sd.jitterCount = 0;
          }
        }
      } else {
        sd.jitterCount = Math.max(0, sd.jitterCount - 1);
      }

      // 2. GENERAL STUCK DETECTION - Low velocity for extended period
      if (speed < PHYSICS_CONFIG.STUCK_VELOCITY_THRESHOLD) {
        sd.stallFrames++;
        
        if (sd.stallFrames > PHYSICS_CONFIG.STUCK_FRAMES_THRESHOLD) {
          this.applyAntiStuckNudge('general');
          sd.stallFrames = 0;
        }
      } else {
        sd.stallFrames = Math.max(0, sd.stallFrames - 2); // Gradual recovery
      }

      // 3. CORNER STUCK DETECTION - Ball near walls with low velocity
      const nearLeftWall = pos.x < PHYSICS_CONFIG.WALL_MARGIN;
      const nearRightWall = pos.x > this.width - PHYSICS_CONFIG.WALL_MARGIN;
      const nearCorner = (nearLeftWall || nearRightWall) && speed < PHYSICS_CONFIG.STUCK_VELOCITY_THRESHOLD * 1.5;
      
      if (nearCorner) {
        sd.cornerFrames++;
        if (sd.cornerFrames > PHYSICS_CONFIG.STUCK_CORNER_THRESHOLD) {
          this.applyCornerEscape(nearLeftWall);
          sd.cornerFrames = 0;
        }
      } else {
        sd.cornerFrames = Math.max(0, sd.cornerFrames - 1);
      }

      // 4. PEG TRAP DETECTION - Ball stuck between pegs (position barely changing)
      const posDelta = Vector.magnitude(Vector.sub(pos, sd.lastPosition));
      if (posDelta < 0.5 && speed < PHYSICS_CONFIG.STUCK_VELOCITY_THRESHOLD) {
        sd.stallFrames += 2; // Accelerate stuck detection when truly immobile
      }

      // 5. BOUNDARY CORRECTION - Keep ball in valid play area
      this.applyBoundaryCorrection();

      // Update tracking
      sd.lastPosition = { x: pos.x, y: pos.y };
      sd.lastVelocity = { x: vel.x, y: vel.y };
    });

    // Collision-based position correction
    Events.on(this.engine, 'collisionActive', (event) => {
      if (!this.ball || !this.isPlaying) return;
      this.handleActiveCollisions(event);
    });
  }

  /**
   * Generate deterministic but varied random value based on drop seed
   */
  seededRandom(offset = 0) {
    const seed = this.stuckDetection.dropSeed + offset;
    const x = Math.sin(seed * PHYSICS_CONFIG.RANDOM_SEED_MULTIPLIER) * 10000;
    return x - Math.floor(x);
  }

  /**
   * Apply gentle nudge to free stuck ball
   */
  applyAntiStuckNudge(reason) {
    if (!this.ball) return;
    
    const vel = this.ball.velocity;
    const nudgeStrength = PHYSICS_CONFIG.NUDGE_FORCE_MIN + 
      this.seededRandom(this.stuckDetection.stallFrames) * 
      (PHYSICS_CONFIG.NUDGE_FORCE_MAX - PHYSICS_CONFIG.NUDGE_FORCE_MIN);
    
    // Deterministic but varied direction
    const angle = (this.seededRandom(Date.now() % 1000) - 0.5) * Math.PI * 0.6; // -54° to +54°
    const nudgeX = Math.sin(angle) * nudgeStrength;
    const nudgeY = Math.cos(angle) * nudgeStrength * PHYSICS_CONFIG.NUDGE_DOWNWARD_BIAS + 
                   PHYSICS_CONFIG.NUDGE_DOWNWARD_BIAS;
    
    Body.setVelocity(this.ball, {
      x: vel.x + nudgeX,
      y: vel.y + nudgeY,
    });

    console.log(`%c⚡ Anti-stuck nudge (${reason}): dx=${nudgeX.toFixed(2)}, dy=${nudgeY.toFixed(2)}`, 'color: #ffd700;');
  }

  /**
   * Apply correction for jittering ball (rapid oscillation)
   */
  applyJitterCorrection() {
    if (!this.ball) return;
    
    const vel = this.ball.velocity;
    
    // Dampen current velocity and add small downward push
    Body.setVelocity(this.ball, {
      x: vel.x * PHYSICS_CONFIG.JITTER_DAMPING,
      y: Math.max(vel.y * PHYSICS_CONFIG.JITTER_DAMPING, 0.8), // Ensure downward motion
    });

    console.log('%c🔧 Jitter correction applied', 'color: #00f5ff;');
  }

  /**
   * Escape from wall corners with directed force
   */
  applyCornerEscape(isLeftWall) {
    if (!this.ball) return;
    
    const escapeX = isLeftWall ? PHYSICS_CONFIG.PEG_ESCAPE_VELOCITY : -PHYSICS_CONFIG.PEG_ESCAPE_VELOCITY;
    const escapeY = PHYSICS_CONFIG.PEG_ESCAPE_VELOCITY * 0.5;
    
    Body.setVelocity(this.ball, {
      x: escapeX,
      y: escapeY,
    });
    
    // Also nudge position slightly away from wall
    const offsetX = isLeftWall ? PHYSICS_CONFIG.COLLISION_OFFSET * 2 : -PHYSICS_CONFIG.COLLISION_OFFSET * 2;
    Body.setPosition(this.ball, {
      x: this.ball.position.x + offsetX,
      y: this.ball.position.y,
    });

    console.log(`%c🚀 Corner escape (${isLeftWall ? 'left' : 'right'} wall)`, 'color: #ff006e;');
  }

  /**
   * Keep ball within valid boundaries
   */
  applyBoundaryCorrection() {
    if (!this.ball) return;
    
    const pos = this.ball.position;
    const radius = this.ball.circleRadius || 12;
    const margin = radius + 2;
    let corrected = false;
    let newX = pos.x;
    let newY = pos.y;
    
    // Left boundary
    if (pos.x < margin) {
      newX = margin + PHYSICS_CONFIG.COLLISION_OFFSET;
      corrected = true;
    }
    // Right boundary
    if (pos.x > this.width - margin) {
      newX = this.width - margin - PHYSICS_CONFIG.COLLISION_OFFSET;
      corrected = true;
    }
    // Top boundary (shouldn't go above drop zone)
    if (pos.y < margin) {
      newY = margin + PHYSICS_CONFIG.COLLISION_OFFSET;
      corrected = true;
    }
    
    if (corrected) {
      Body.setPosition(this.ball, { x: newX, y: newY });
    }
  }

  /**
   * Handle active (ongoing) collisions to prevent penetration
   */
  handleActiveCollisions(event) {
    event.pairs.forEach((pair) => {
      if (pair.bodyA.label !== 'ball' && pair.bodyB.label !== 'ball') return;
      
      const ball = pair.bodyA.label === 'ball' ? pair.bodyA : pair.bodyB;
      const other = pair.bodyA.label === 'ball' ? pair.bodyB : pair.bodyA;
      
      // Skip bucket sensors
      if (other.isSensor) return;
      
      // Calculate separation vector
      const dx = ball.position.x - other.position.x;
      const dy = ball.position.y - other.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 0.01) return; // Avoid division by zero
      
      // If objects are overlapping, push ball out
      const ballRadius = ball.circleRadius || 12;
      const otherRadius = other.circleRadius || 8;
      const minDist = ballRadius + otherRadius;
      
      if (dist < minDist) {
        const overlap = minDist - dist;
        const correction = overlap * PHYSICS_CONFIG.OVERLAP_CORRECTION;
        
        // Normalize and apply correction
        const nx = dx / dist;
        const ny = dy / dist;
        
        Body.setPosition(ball, {
          x: ball.position.x + nx * correction,
          y: ball.position.y + ny * correction,
        });
        
        // Add tiny velocity boost in separation direction to prevent re-collision
        const vel = ball.velocity;
        const speed = Vector.magnitude(vel);
        if (speed < PHYSICS_CONFIG.PEG_ESCAPE_VELOCITY) {
          Body.setVelocity(ball, {
            x: vel.x + nx * 0.3,
            y: vel.y + ny * 0.3 + 0.2, // Slight downward bias
          });
        }
      }
    });
  }

  /**
   * Reset stuck detection state
   */
  resetStuckDetection() {
    this.stuckDetection.stallFrames = 0;
    this.stuckDetection.cornerFrames = 0;
    this.stuckDetection.jitterCount = 0;
    this.stuckDetection.recentCollisions = [];
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

    // Generate deterministic seed for this drop (based on position and time)
    this.stuckDetection.dropSeed = (clampedX * 1000 + Date.now()) % 100000;

    this.ball = Bodies.circle(clampedX, 20, radius, {
      label: 'ball',
      restitution: this.ballConfig.restitution,
      friction: this.ballConfig.friction,
      frictionStatic: this.ballConfig.frictionStatic,
      frictionAir: this.ballConfig.frictionAir,
      slop: this.ballConfig.slop,
      density: 0.001 * this.ballConfig.mass,
      // Prevent tunneling through pegs
      isSleeping: false,
      render: {
        fillStyle: this.ballConfig.color,
        strokeStyle: '#fff',
        lineWidth: 2,
      },
    });

    Composite.add(this.engine.world, this.ball);
    
    // HIGH-VELOCITY: Apply strong initial downward velocity
    // ENS Speed Multiplier: Degen class gets 1.2x speed boost!
    const speedMultiplier = this.ballConfig.speedMultiplier || 1.0;
    const initialNudgeX = (this.seededRandom(0) - 0.5) * 2; // Wider horizontal variance
    const initialVelocityY = 5 * speedMultiplier; // Base 5, boosted for Degen
    
    Body.setVelocity(this.ball, { x: initialNudgeX, y: initialVelocityY });
    
    this.isPlaying = true;
    this.pegHitCount = 0;
    this.resetStuckDetection();
    
    this.onBallDrop();
    console.log(`%c🎱 Ball dropped! Speed: ${speedMultiplier}x, Seed: ${this.stuckDetection.dropSeed} (${this.ballConfig.label})`, 'color: #00f5ff;');
  }

  // Update ENS class and reconfigure ball (including speed multiplier)
  setEnsClass(ensClass) {
    this.ensClass = ensClass;
    this.ballConfig = BALL_CONFIGS[ensClass] || BALL_CONFIGS.default;
    this.speedMultiplier = this.ballConfig.speedMultiplier || 1.0;
    
    // Update gravity for ENS speed multiplier
    if (this.engine) {
      this.engine.gravity.scale = 0.002 * this.speedMultiplier;
    }
    
    console.log(`%c🔗 ENS Class set to: ${ensClass} (Speed: ${this.speedMultiplier}x)`, 'color: #8b5cf6;');
  }

  // Reset for new game
  reset() {
    if (this.ball) {
      Composite.remove(this.engine.world, this.ball);
      this.ball = null;
    }
    this.isPlaying = false;
    this.pegHitCount = 0;
    this.resetStuckDetection();
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

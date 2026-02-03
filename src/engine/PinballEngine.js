import Phaser from 'phaser';

// Base flipper width for scaling
const BASE_FLIPPER_WIDTH = 70;

// Game settings based on player class (from ENS yieldball.class)
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

// Pinball Scene Class
class PinballScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PinballScene' });
    this.ball = null;
    this.leftFlipper = null;
    this.rightFlipper = null;
    this.bumpers = [];
    this.bumperSprites = [];
    this.ballLaunched = false;
    this.isGameOver = false;
    this.score = 0;
    this.leftFlipperActive = false;
    this.rightFlipperActive = false;
    this.flipperAngleLimit = Phaser.Math.DegToRad(30);
    this.flipperRestAngle = Phaser.Math.DegToRad(30);
  }

  init(data) {
    // Get callbacks from global scope (set by PinballEngine wrapper)
    const callbacks = window.__yieldballCallbacks || {};
    this.playerClass = callbacks.playerClass || 'default';
    this.settings = callbacks.settings || PLAYER_CLASSES.default;
    this.onBumperHit = callbacks.onBumperHit || (() => {});
    this.onFlashLoanRamp = callbacks.onFlashLoanRamp || (() => {});
    this.onDrain = callbacks.onDrain || (() => {});
    this.onScoreUpdate = callbacks.onScoreUpdate || (() => {});
    this.score = 0;
    this.ballLaunched = false;
    this.isGameOver = false;
  }

  create() {
    const { width, height } = this.scale;
    
    // Draw cyberpunk background first (lowest layer)
    this.createBackground();
    
    // Create walls
    this.createWalls();
    
    // Create bumpers
    this.createBumpers();
    
    // Create launch tube
    this.createLaunchTube();
    
    // Create flippers (must be after background)
    this.createFlippers();
    
    // Setup keyboard controls
    this.setupControls();
    
    // Setup collision events
    this.setupCollisions();
    
    // Create particle emitter texture
    this.createParticleTexture();
    
    // Add launch instruction text
    this.launchText = this.add.text(width - 30, height - 120, 'Press\nSPACE', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#22c55e',
      align: 'center',
    }).setOrigin(0.5);
    
    // Create ball graphics (but don't spawn physics body yet)
    this.ballGraphics = this.add.graphics();
    this.ballGraphics.setDepth(10);
    
    // Enable drain detection after a delay
    this.drainEnabled = false;
    this.time.delayedCall(1500, () => {
      this.drainEnabled = true;
    });
  }

  createBackground() {
    const { width, height } = this.scale;
    
    // Dark background with grid
    const graphics = this.add.graphics();
    graphics.setDepth(-10);
    graphics.fillStyle(0x020617, 1);
    graphics.fillRect(0, 0, width, height);
    
    // Draw neon grid lines
    graphics.lineStyle(1, 0x1e293b, 0.5);
    for (let x = 0; x <= width; x += 20) {
      graphics.lineBetween(x, 0, x, height);
    }
    for (let y = 0; y <= height; y += 20) {
      graphics.lineBetween(0, y, width, y);
    }
  }

  createWalls() {
    const { width, height } = this.scale;
    const wallThickness = 32;
    
    // Draw visual walls
    const wallGraphics = this.add.graphics();
    wallGraphics.setDepth(5);
    wallGraphics.lineStyle(3, 0x8b5cf6, 1);
    
    // Left wall line
    wallGraphics.lineBetween(10, 0, 10, height);
    
    // Top wall line
    wallGraphics.lineBetween(10, 10, width - 10, 10);
    
    // Right wall line (partial - gap for launch tube)
    wallGraphics.lineBetween(width - 50, 10, width - 50, height - 300);
    
    // Create physics walls
    // Top wall
    this.matter.add.rectangle(width / 2, 0, width + 100, wallThickness, {
      isStatic: true,
      label: 'wall',
    });
    
    // Left wall
    this.matter.add.rectangle(0, height / 2, wallThickness, height + 100, {
      isStatic: true,
      label: 'wall',
    });
    
    // Right wall (partial)
    this.matter.add.rectangle(width - 35, height / 2 - 150, wallThickness, height - 250, {
      isStatic: true,
      label: 'wall',
    });
    
    // Bottom drain zone (sensor)
    this.drainZone = this.matter.add.rectangle(width / 2, height + 30, width, 60, {
      isStatic: true,
      isSensor: true,
      label: 'drain',
    });
    
    // Draw drain warning line
    const drainGraphics = this.add.graphics();
    drainGraphics.setDepth(5);
    drainGraphics.lineStyle(2, 0xff006e, 0.5);
    drainGraphics.lineBetween(10, height - 10, width - 60, height - 10);
    
    // Bottom slopes (physical)
    this.matter.add.rectangle(70, height - 50, 100, 15, {
      isStatic: true,
      angle: Phaser.Math.DegToRad(25),
      label: 'slope',
    });
    
    this.matter.add.rectangle(width - 110, height - 50, 100, 15, {
      isStatic: true,
      angle: Phaser.Math.DegToRad(-25),
      label: 'slope',
    });
    
    // Draw slopes visually using polygons
    const slopeGraphics = this.add.graphics();
    slopeGraphics.setDepth(5);
    slopeGraphics.fillStyle(0x1e293b, 1);
    slopeGraphics.lineStyle(3, 0x8b5cf6, 1);
    
    // Left slope visual (rotated rectangle approximation)
    slopeGraphics.fillRect(20, height - 65, 100, 15);
    slopeGraphics.strokeRect(20, height - 65, 100, 15);
    
    // Right slope visual
    slopeGraphics.fillRect(width - 160, height - 65, 100, 15);
    slopeGraphics.strokeRect(width - 160, height - 65, 100, 15);
    
    // Flash Loan Ramp zone (sensor)
    this.flashLoanRamp = this.matter.add.rectangle(width / 2, 70, 100, 30, {
      isStatic: true,
      isSensor: true,
      label: 'flashLoanRamp',
    });
    
    // Draw flash loan ramp
    const rampGraphics = this.add.graphics();
    rampGraphics.setDepth(5);
    rampGraphics.fillStyle(0x22c55e, 0.3);
    rampGraphics.fillRect(width / 2 - 50, 55, 100, 30);
    rampGraphics.lineStyle(2, 0x22c55e, 1);
    rampGraphics.strokeRect(width / 2 - 50, 55, 100, 30);
    
    this.add.text(width / 2, 70, '⚡ FLASH LOAN', {
      fontSize: '10px',
      fontFamily: 'monospace',
      color: '#22c55e',
    }).setOrigin(0.5).setDepth(6);
  }

  createFlippers() {
    const { width, height } = this.scale;
    const flipperWidth = BASE_FLIPPER_WIDTH * this.settings.flipperScale;
    const flipperHeight = 14;
    
    // Flipper pivot positions
    const leftPivotX = 120;
    const rightPivotX = 280;
    const pivotY = 550;
    
    // Draw pivot points
    const pivotGraphics = this.add.graphics();
    pivotGraphics.setDepth(5);
    pivotGraphics.fillStyle(0x8b5cf6, 1);
    pivotGraphics.fillCircle(leftPivotX, pivotY, 6);
    pivotGraphics.fillCircle(rightPivotX, pivotY, 6);
    pivotGraphics.lineStyle(2, 0x00f5ff, 1);
    pivotGraphics.strokeCircle(leftPivotX, pivotY, 8);
    pivotGraphics.strokeCircle(rightPivotX, pivotY, 8);
    
    // Create flipper physics bodies
    this.leftFlipper = this.matter.add.rectangle(
      leftPivotX + flipperWidth / 2 - 10,
      pivotY,
      flipperWidth,
      flipperHeight,
      {
        label: 'leftFlipper',
        chamfer: { radius: 5 },
        friction: 0.1,
        restitution: 0.5,
      }
    );
    
    this.rightFlipper = this.matter.add.rectangle(
      rightPivotX - flipperWidth / 2 + 10,
      pivotY,
      flipperWidth,
      flipperHeight,
      {
        label: 'rightFlipper',
        chamfer: { radius: 5 },
        friction: 0.1,
        restitution: 0.5,
      }
    );
    
    // Pin flippers to pivot points using world constraints
    this.matter.add.worldConstraint(this.leftFlipper, 0, 1, {
      pointA: { x: leftPivotX, y: pivotY },
      pointB: { x: -flipperWidth / 2 + 10, y: 0 },
    });
    
    this.matter.add.worldConstraint(this.rightFlipper, 0, 1, {
      pointA: { x: rightPivotX, y: pivotY },
      pointB: { x: flipperWidth / 2 - 10, y: 0 },
    });
    
    // Set initial resting angles
    Phaser.Physics.Matter.Matter.Body.setAngle(this.leftFlipper, this.flipperRestAngle);
    Phaser.Physics.Matter.Matter.Body.setAngle(this.rightFlipper, -this.flipperRestAngle);
    
    // Create flipper graphics
    this.leftFlipperGraphics = this.add.graphics();
    this.leftFlipperGraphics.setDepth(6);
    this.rightFlipperGraphics = this.add.graphics();
    this.rightFlipperGraphics.setDepth(6);
    
    // Store flipper dimensions
    this.flipperWidth = flipperWidth;
    this.flipperHeight = flipperHeight;
  }

  createBumpers() {
    const bumperPositions = [
      { x: 100, y: 180, radius: 25, color: 0xff006e },
      { x: 200, y: 130, radius: 30, color: 0x00f5ff },
      { x: 300, y: 180, radius: 25, color: 0xff006e },
      { x: 150, y: 280, radius: 22, color: 0x8b5cf6 },
      { x: 250, y: 280, radius: 22, color: 0x8b5cf6 },
    ];
    
    this.bumpers = [];
    this.bumperGraphicsArr = [];
    
    bumperPositions.forEach((pos, index) => {
      // Create physics body
      const bumper = this.matter.add.circle(pos.x, pos.y, pos.radius, {
        isStatic: true,
        restitution: 1.5,
        label: `bumper-${index}`,
      });
      bumper.bumperColor = pos.color;
      bumper.bumperRadius = pos.radius;
      bumper.bumperX = pos.x;
      bumper.bumperY = pos.y;
      this.bumpers.push(bumper);
      
      // Draw glow effect (background)
      const glowGraphics = this.add.graphics();
      glowGraphics.setDepth(3);
      glowGraphics.fillStyle(pos.color, 0.3);
      glowGraphics.fillCircle(pos.x, pos.y, pos.radius + 10);
      
      // Draw bumper
      const bumperGraphics = this.add.graphics();
      bumperGraphics.setDepth(4);
      bumperGraphics.fillStyle(pos.color, 1);
      bumperGraphics.fillCircle(pos.x, pos.y, pos.radius);
      bumperGraphics.lineStyle(3, 0xffffff, 1);
      bumperGraphics.strokeCircle(pos.x, pos.y, pos.radius);
      
      this.bumperGraphicsArr.push({ main: bumperGraphics, glow: glowGraphics, ...pos, index });
    });
  }

  createLaunchTube() {
    const { width, height } = this.scale;
    const tubeX = width - 30;
    const tubeWidth = 30;
    
    // Physics walls for tube
    this.matter.add.rectangle(tubeX - tubeWidth / 2 - 5, height - 150, 8, 300, {
      isStatic: true,
      label: 'launchTubeLeft',
    });
    
    this.matter.add.rectangle(tubeX + tubeWidth / 2 + 5, height - 150, 8, 300, {
      isStatic: true,
      label: 'launchTubeRight',
    });
    
    // Bottom stopper
    this.matter.add.rectangle(tubeX, height - 15, tubeWidth, 10, {
      isStatic: true,
      label: 'launchTubeStopper',
    });
    
    // Guide at top
    this.matter.add.rectangle(tubeX - 20, 100, 40, 10, {
      isStatic: true,
      angle: Phaser.Math.DegToRad(25),
      label: 'launchTubeGuide',
    });
    
    // Draw launch tube visuals
    const tubeGraphics = this.add.graphics();
    tubeGraphics.setDepth(5);
    tubeGraphics.lineStyle(2, 0x22c55e, 1);
    tubeGraphics.strokeRect(tubeX - tubeWidth / 2 - 5, height - 300, tubeWidth + 10, 285);
  }

  createParticleTexture() {
    // Create a simple particle texture using graphics
    const particleGfx = this.make.graphics({ add: false });
    particleGfx.fillStyle(0xff006e, 1);
    particleGfx.fillCircle(8, 8, 8);
    particleGfx.generateTexture('particle', 16, 16);
    particleGfx.destroy();
  }

  createBall() {
    const { width, height } = this.scale;
    const ballX = width - 30;
    const ballY = height - 60;
    const ballRadius = 12;
    
    // Remove existing ball if any
    if (this.ball) {
      this.matter.world.remove(this.ball);
    }
    
    // Create ball physics body
    this.ball = this.matter.add.circle(ballX, ballY, ballRadius, {
      restitution: 0.6,
      friction: 0,
      frictionAir: 0.01,
      label: 'ball',
    });
    
    // Set ball mass based on player class
    Phaser.Physics.Matter.Matter.Body.setMass(this.ball, this.settings.ballMass);
    
    // Create particle emitter for ball trail
    if (!this.ballParticles) {
      this.ballParticles = this.add.particles(0, 0, 'particle', {
        speed: { min: 0, max: 10 },
        scale: { start: 0.5, end: 0 },
        alpha: { start: 0.6, end: 0 },
        lifespan: 300,
        blendMode: 'ADD',
        frequency: 30,
        emitting: false,
      });
      this.ballParticles.setDepth(9);
    }
  }

  setupControls() {
    // Keyboard controls
    this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyLeft = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
    this.keyRight = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
    this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    
    // Touch/click controls
    this.lastTapTime = 0;
    this.input.on('pointerdown', (pointer) => {
      if (this.isGameOver) return;
      
      const { width } = this.scale;
      const now = this.time.now;
      
      // Double tap to launch
      if (now - this.lastTapTime < 300) {
        this.launchBall();
        this.lastTapTime = 0;
        return;
      }
      this.lastTapTime = now;
      
      // Single tap - left or right flipper
      if (pointer.x < width / 2) {
        this.flipLeft();
      } else {
        this.flipRight();
      }
    });
  }

  setupCollisions() {
    this.matter.world.on('collisionstart', (event) => {
      event.pairs.forEach((pair) => {
        const labels = [pair.bodyA.label, pair.bodyB.label];
        
        // Check bumper hits
        this.bumpers.forEach((bumper, index) => {
          if (labels.includes(bumper.label) && labels.includes('ball')) {
            this.handleBumperHit(bumper, index);
          }
        });
        
        // Check Flash Loan Ramp
        if (labels.includes('flashLoanRamp') && labels.includes('ball')) {
          this.handleFlashLoanRamp();
        }
        
        // Check drain
        if (labels.includes('drain') && labels.includes('ball') && this.drainEnabled && this.ballLaunched) {
          this.handleDrain();
        }
      });
    });
  }

  handleBumperHit(bumper, index) {
    const basePoints = 100;
    const points = basePoints * this.settings.yieldMultiplier;
    this.score += points;
    
    // Flash effect on bumper
    const bumperGfx = this.bumperGraphicsArr[index];
    if (bumperGfx) {
      bumperGfx.main.clear();
      bumperGfx.main.fillStyle(0xffff00, 1);
      bumperGfx.main.fillCircle(bumperGfx.x, bumperGfx.y, bumperGfx.radius);
      bumperGfx.main.lineStyle(5, 0xffffff, 1);
      bumperGfx.main.strokeCircle(bumperGfx.x, bumperGfx.y, bumperGfx.radius);
      
      // Reset after flash
      this.time.delayedCall(150, () => {
        bumperGfx.main.clear();
        bumperGfx.main.fillStyle(bumperGfx.color, 1);
        bumperGfx.main.fillCircle(bumperGfx.x, bumperGfx.y, bumperGfx.radius);
        bumperGfx.main.lineStyle(3, 0xffffff, 1);
        bumperGfx.main.strokeCircle(bumperGfx.x, bumperGfx.y, bumperGfx.radius);
      });
    }
    
    // Emit event to React
    this.game.events.emit('updateScore', { points, total: this.score, yieldMultiplier: this.settings.yieldMultiplier });
    this.onBumperHit(index, points, this.settings.yieldMultiplier);
    this.onScoreUpdate(this.score);
  }

  handleFlashLoanRamp() {
    const bonus = 500 * this.settings.yieldMultiplier;
    this.score += bonus;
    
    console.log(`%c⚡ FLASH LOAN RAMP! +${bonus} points!`, 'color: #22c55e; font-weight: bold;');
    
    this.game.events.emit('flashLoanRamp', { bonus, total: this.score });
    this.onFlashLoanRamp(bonus);
    this.onScoreUpdate(this.score);
  }

  handleDrain() {
    if (this.isGameOver) return;
    
    this.isGameOver = true;
    this.ballLaunched = false;
    
    console.log(`%c⚠️ BALL DRAINED!`, 'color: #ff006e; font-weight: bold;');
    
    // Stop particle emitter
    if (this.ballParticles) {
      this.ballParticles.stop();
    }
    
    this.game.events.emit('drain', { score: this.score });
    this.onDrain(this.score);
  }

  launchBall() {
    if (this.isGameOver || this.ballLaunched) return;
    
    if (!this.ball) {
      this.createBall();
    }
    
    this.ballLaunched = true;
    
    // Hide launch text
    if (this.launchText) {
      this.launchText.setVisible(false);
    }
    
    // Apply upward launch force
    const launchForce = 0.05 * this.settings.ballSpeed;
    const randomVariation = 0.8 + Math.random() * 0.4;
    
    Phaser.Physics.Matter.Matter.Body.applyForce(this.ball, this.ball.position, {
      x: -0.002,
      y: -launchForce * randomVariation,
    });
    
    // Start particle emitter
    if (this.ballParticles) {
      this.ballParticles.start();
    }
    
    console.log(`%c🚀 Ball launched!`, 'color: #22c55e; font-weight: bold;');
  }

  flipLeft() {
    if (this.isGameOver) return;
    this.leftFlipperActive = true;
    
    // Apply angular velocity: -0.2 as per spec
    Phaser.Physics.Matter.Matter.Body.setAngularVelocity(this.leftFlipper, -0.2);
    
    this.time.delayedCall(150, () => {
      this.leftFlipperActive = false;
    });
  }

  flipRight() {
    if (this.isGameOver) return;
    this.rightFlipperActive = true;
    
    // Apply angular velocity: 0.2 as per spec
    Phaser.Physics.Matter.Matter.Body.setAngularVelocity(this.rightFlipper, 0.2);
    
    this.time.delayedCall(150, () => {
      this.rightFlipperActive = false;
    });
  }

  update() {
    // Update flippers
    this.updateFlippers();
    
    // Draw flippers
    this.drawFlippers();
    
    // Draw ball
    this.drawBall();
    
    // Check if ball fell through (backup drain detection)
    if (this.ball && this.ballLaunched && !this.isGameOver && this.drainEnabled) {
      if (this.ball.position.y > this.scale.height + 20) {
        this.handleDrain();
      }
    }
  }

  updateFlippers() {
    const angleLimit = this.flipperAngleLimit;
    const restAngle = this.flipperRestAngle;
    const MatterBody = Phaser.Physics.Matter.Matter.Body;
    
    // Left flipper
    if (this.keyA.isDown || this.keyLeft.isDown || this.leftFlipperActive) {
      if (this.leftFlipper.angle > -angleLimit) {
        MatterBody.setAngularVelocity(this.leftFlipper, -0.2);
      } else {
        MatterBody.setAngle(this.leftFlipper, -angleLimit);
        MatterBody.setAngularVelocity(this.leftFlipper, 0);
      }
    } else {
      if (this.leftFlipper.angle < restAngle) {
        MatterBody.setAngularVelocity(this.leftFlipper, 0.15);
      } else {
        MatterBody.setAngle(this.leftFlipper, restAngle);
        MatterBody.setAngularVelocity(this.leftFlipper, 0);
      }
    }
    
    // Right flipper
    if (this.keyD.isDown || this.keyRight.isDown || this.rightFlipperActive) {
      if (this.rightFlipper.angle < angleLimit) {
        MatterBody.setAngularVelocity(this.rightFlipper, 0.2);
      } else {
        MatterBody.setAngle(this.rightFlipper, angleLimit);
        MatterBody.setAngularVelocity(this.rightFlipper, 0);
      }
    } else {
      if (this.rightFlipper.angle > -restAngle) {
        MatterBody.setAngularVelocity(this.rightFlipper, -0.15);
      } else {
        MatterBody.setAngle(this.rightFlipper, -restAngle);
        MatterBody.setAngularVelocity(this.rightFlipper, 0);
      }
    }
    
    // Launch ball with space
    if (Phaser.Input.Keyboard.JustDown(this.keySpace)) {
      this.launchBall();
    }
  }

  drawFlippers() {
    const w = this.flipperWidth;
    const h = this.flipperHeight;
    
    // Left flipper
    this.leftFlipperGraphics.clear();
    this.leftFlipperGraphics.fillStyle(0xff006e, 1);
    this.leftFlipperGraphics.lineStyle(2, 0x00f5ff, 1);
    
    // Draw rotated rectangle using polygon
    const leftVerts = this.getRotatedRectVerts(
      this.leftFlipper.position.x,
      this.leftFlipper.position.y,
      w, h,
      this.leftFlipper.angle
    );
    this.leftFlipperGraphics.fillPoints(leftVerts, true);
    this.leftFlipperGraphics.strokePoints(leftVerts, true);
    
    // Right flipper
    this.rightFlipperGraphics.clear();
    this.rightFlipperGraphics.fillStyle(0xff006e, 1);
    this.rightFlipperGraphics.lineStyle(2, 0x00f5ff, 1);
    
    const rightVerts = this.getRotatedRectVerts(
      this.rightFlipper.position.x,
      this.rightFlipper.position.y,
      w, h,
      this.rightFlipper.angle
    );
    this.rightFlipperGraphics.fillPoints(rightVerts, true);
    this.rightFlipperGraphics.strokePoints(rightVerts, true);
  }

  getRotatedRectVerts(cx, cy, w, h, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const hw = w / 2;
    const hh = h / 2;
    
    const corners = [
      { x: -hw, y: -hh },
      { x: hw, y: -hh },
      { x: hw, y: hh },
      { x: -hw, y: hh },
    ];
    
    return corners.map(c => ({
      x: cx + c.x * cos - c.y * sin,
      y: cy + c.x * sin + c.y * cos,
    }));
  }

  drawBall() {
    if (!this.ball) return;
    
    const x = this.ball.position.x;
    const y = this.ball.position.y;
    const radius = 12;
    
    this.ballGraphics.clear();
    
    // Ball glow
    this.ballGraphics.fillStyle(0xff006e, 0.3);
    this.ballGraphics.fillCircle(x, y, radius + 10);
    
    // Ball body
    this.ballGraphics.fillStyle(0xff006e, 1);
    this.ballGraphics.fillCircle(x, y, radius);
    this.ballGraphics.lineStyle(2, 0x00f5ff, 1);
    this.ballGraphics.strokeCircle(x, y, radius);
    
    // Inner highlight
    this.ballGraphics.fillStyle(0xffffff, 0.5);
    this.ballGraphics.fillCircle(x - 3, y - 3, radius / 3);
    
    // Update particle emitter position
    if (this.ballParticles && this.ballLaunched) {
      this.ballParticles.setPosition(x, y);
    }
  }

  reset() {
    const { width, height } = this.scale;
    
    this.isGameOver = false;
    this.score = 0;
    this.ballLaunched = false;
    this.drainEnabled = false;
    
    // Reset ball position
    if (this.ball) {
      const MatterBody = Phaser.Physics.Matter.Matter.Body;
      MatterBody.setPosition(this.ball, { x: width - 30, y: height - 60 });
      MatterBody.setVelocity(this.ball, { x: 0, y: 0 });
      MatterBody.setAngularVelocity(this.ball, 0);
    }
    
    // Reset flippers
    const MatterBody = Phaser.Physics.Matter.Matter.Body;
    MatterBody.setAngle(this.leftFlipper, this.flipperRestAngle);
    MatterBody.setAngle(this.rightFlipper, -this.flipperRestAngle);
    MatterBody.setAngularVelocity(this.leftFlipper, 0);
    MatterBody.setAngularVelocity(this.rightFlipper, 0);
    
    // Show launch text
    if (this.launchText) {
      this.launchText.setVisible(true);
    }
    
    // Re-enable drain after delay
    this.time.delayedCall(1500, () => {
      this.drainEnabled = true;
    });
    
    this.onScoreUpdate(0);
  }
}

// PinballEngine wrapper class for React integration
export class PinballEngine {
  constructor(container, options = {}) {
    this.container = container;
    this.width = options.width || 400;
    this.height = options.height || 600;
    this.playerClass = options.playerClass || 'default';
    this.onBumperHit = options.onBumperHit || (() => {});
    this.onFlashLoanRamp = options.onFlashLoanRamp || (() => {});
    this.onDrain = options.onDrain || (() => {});
    this.onScoreUpdate = options.onScoreUpdate || (() => {});
    this.onStateUpdate = options.onStateUpdate || (() => {});
    
    this.settings = PLAYER_CLASSES[this.playerClass] || PLAYER_CLASSES.default;
    this.game = null;
    this.scene = null;
    
    this.init();
  }

  init() {
    // Store callbacks in global scope for scene access
    window.__yieldballCallbacks = {
      playerClass: this.playerClass,
      settings: this.settings,
      onBumperHit: this.onBumperHit,
      onFlashLoanRamp: this.onFlashLoanRamp,
      onDrain: this.onDrain,
      onScoreUpdate: this.onScoreUpdate,
    };
    
    // Phaser game configuration - use the class directly
    const config = {
      type: Phaser.AUTO,
      width: this.width,
      height: this.height,
      parent: this.container,
      backgroundColor: '#020617',
      physics: {
        default: 'matter',
        matter: {
          gravity: { y: 1.5 },
          debug: false,
        },
      },
      scene: [PinballScene],
    };
    
    // Create Phaser game
    this.game = new Phaser.Game(config);
    
    // Wait for boot then start scene with data
    this.game.events.once('ready', () => {
      this.scene = this.game.scene.getScene('PinballScene');
    });
    
    // Forward game events to React
    this.game.events.on('updateScore', (data) => {
      this.onStateUpdate({ action: 'BUMPER_HIT', ...data });
    });
    
    this.game.events.on('flashLoanRamp', (data) => {
      this.onStateUpdate({ action: 'FLASH_LOAN_RAMP', ...data });
    });
    
    this.game.events.on('drain', (data) => {
      this.onStateUpdate({ action: 'DRAIN', ...data });
    });
  }

  launchBall() {
    const scene = this.scene || this.game?.scene?.getScene('PinballScene');
    if (scene && scene.launchBall) {
      scene.launchBall();
    }
  }

  flipLeft() {
    const scene = this.scene || this.game?.scene?.getScene('PinballScene');
    if (scene && scene.flipLeft) {
      scene.flipLeft();
    }
  }

  flipRight() {
    const scene = this.scene || this.game?.scene?.getScene('PinballScene');
    if (scene && scene.flipRight) {
      scene.flipRight();
    }
  }

  reset() {
    const scene = this.scene || this.game?.scene?.getScene('PinballScene');
    if (scene) {
      scene.reset();
      if (scene.createBall) {
        scene.createBall();
      }
    }
  }

  destroy() {
    if (this.game) {
      this.game.destroy(true);
      this.game = null;
      this.scene = null;
    }
  }
}

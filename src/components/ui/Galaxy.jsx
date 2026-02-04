import React, { useRef, useEffect, useCallback } from 'react';

/**
 * Galaxy Background Component (ReactBits Style)
 * 
 * A fixed, full-screen animated star field with:
 * - High-density stars with varying sizes and brightness
 * - Subtle rotation creating a cosmic vortex effect
 * - Deep space blues, purples, and blacks (Cyberpunk theme)
 * - Warp speed effect triggered externally via ref
 * 
 * Performance optimized:
 * - Single canvas element
 * - RequestAnimationFrame for smooth 60fps
 * - pointer-events: none to not block game clicks
 */

const STAR_COLORS = [
  '#ffffff', // White
  '#e0e7ff', // Light blue-white
  '#c7d2fe', // Indigo-white
  '#a5b4fc', // Light indigo
  '#818cf8', // Indigo
  '#00f5ff', // Neon cyan
  '#8b5cf6', // Purple
  '#ff006e', // Pink (rare)
];

class Star {
  constructor(canvas, config) {
    this.canvas = canvas;
    this.config = config;
    this.reset();
  }

  reset() {
    const { width, height } = this.canvas;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Random angle and distance from center
    this.angle = Math.random() * Math.PI * 2;
    this.distance = Math.random() * Math.max(width, height) * 0.8;
    
    // Position based on polar coordinates
    this.x = centerX + Math.cos(this.angle) * this.distance;
    this.y = centerY + Math.sin(this.angle) * this.distance;
    
    // Star properties
    this.size = Math.random() * 2 + 0.5;
    this.baseSize = this.size;
    this.brightness = Math.random() * 0.5 + 0.5;
    this.twinkleSpeed = Math.random() * 0.02 + 0.01;
    this.twinklePhase = Math.random() * Math.PI * 2;
    this.color = STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)];
    
    // Depth (for parallax effect)
    this.z = Math.random() * 3 + 1;
  }

  update(deltaTime, rotationSpeed, warpFactor) {
    const { width, height } = this.canvas;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Rotate around center
    const effectiveRotation = rotationSpeed * warpFactor * (1 / this.z);
    this.angle += effectiveRotation * deltaTime;
    
    // During warp, stars streak outward
    if (warpFactor > 1) {
      this.distance += (warpFactor - 1) * 50 * deltaTime * this.z;
    }
    
    // Update position
    this.x = centerX + Math.cos(this.angle) * this.distance;
    this.y = centerY + Math.sin(this.angle) * this.distance;
    
    // Twinkle effect
    this.twinklePhase += this.twinkleSpeed;
    const twinkle = Math.sin(this.twinklePhase) * 0.3 + 0.7;
    this.size = this.baseSize * twinkle * (warpFactor > 1 ? warpFactor * 0.5 : 1);
    
    // Reset if out of bounds
    const margin = 50;
    if (
      this.x < -margin || 
      this.x > width + margin || 
      this.y < -margin || 
      this.y > height + margin
    ) {
      this.reset();
      // Start from center during warp
      if (warpFactor > 1) {
        this.distance = Math.random() * 50;
        this.x = centerX + Math.cos(this.angle) * this.distance;
        this.y = centerY + Math.sin(this.angle) * this.distance;
      }
    }
  }

  draw(ctx, warpFactor) {
    ctx.save();
    
    // Star glow
    const glowSize = this.size * (warpFactor > 1 ? 3 : 2);
    const gradient = ctx.createRadialGradient(
      this.x, this.y, 0,
      this.x, this.y, glowSize
    );
    gradient.addColorStop(0, this.color);
    gradient.addColorStop(0.5, this.color + '80');
    gradient.addColorStop(1, 'transparent');
    
    ctx.globalAlpha = this.brightness * (warpFactor > 1 ? 1 : 0.8);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, glowSize, 0, Math.PI * 2);
    ctx.fill();
    
    // Core
    ctx.globalAlpha = this.brightness;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    
    // Warp streak effect
    if (warpFactor > 1.5) {
      const { width, height } = this.canvas;
      const centerX = width / 2;
      const centerY = height / 2;
      const dx = this.x - centerX;
      const dy = this.y - centerY;
      const streakLength = warpFactor * 15;
      
      ctx.strokeStyle = this.color + '60';
      ctx.lineWidth = this.size * 0.5;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(
        this.x + (dx / this.distance) * streakLength,
        this.y + (dy / this.distance) * streakLength
      );
      ctx.stroke();
    }
    
    ctx.restore();
  }
}

class Nebula {
  constructor(canvas) {
    this.canvas = canvas;
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.radius = Math.random() * 300 + 150;
    this.color = Math.random() > 0.5 ? '#8b5cf6' : '#00f5ff';
    this.opacity = Math.random() * 0.05 + 0.02;
    this.rotationSpeed = (Math.random() - 0.5) * 0.0001;
    this.angle = Math.random() * Math.PI * 2;
  }

  update(deltaTime) {
    this.angle += this.rotationSpeed * deltaTime;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius);
    gradient.addColorStop(0, this.color + Math.floor(this.opacity * 255).toString(16).padStart(2, '0'));
    gradient.addColorStop(0.5, this.color + '10');
    gradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(0, 0, this.radius, this.radius * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }
}

export function Galaxy({ 
  speed = 0.2,
  density = 1.0,
  className = '',
}) {
  // Convert speed prop to rotation: speed 0.2 = gentle cosmic drift
  const rotationSpeed = speed * 0.0005;
  const starCount = Math.floor(300 * density);
  const nebulaCount = Math.floor(3 * density);
  
  const canvasRef = useRef(null);
  const starsRef = useRef([]);
  const nebulaeRef = useRef([]);
  const animationRef = useRef(null);
  const lastTimeRef = useRef(0);
  // REMOVED: Warp effects - Galaxy stays calm always
  // const warpFactorRef = useRef(1);
  // const warpTargetRef = useRef(1);

  // Galaxy is now a STATIC calm background
  // No warp effects - stays consistent across entire app

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // Reinitialize stars on resize
      starsRef.current = Array.from(
        { length: starCount },
        () => new Star(canvas, { rotationSpeed })
      );
      
      nebulaeRef.current = Array.from(
        { length: nebulaCount },
        () => new Nebula(canvas)
      );
    };
    
    resize();
    window.addEventListener('resize', resize);

    // Animation loop - calm, consistent cosmic background
    const animate = (timestamp) => {
      const deltaTime = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      // Static warp factor of 1 (no speed changes)
      const warpFactor = 1;

      // Clear with deep space gradient
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height)
      );
      gradient.addColorStop(0, '#0f0a1e'); // Deep purple-black center
      gradient.addColorStop(0.5, '#070510'); // Dark purple
      gradient.addColorStop(1, '#020617'); // cyber-darker edge
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw nebulae
      nebulaeRef.current.forEach(nebula => {
        nebula.update(deltaTime);
        nebula.draw(ctx);
      });

      // Update and draw stars (warpFactor = 1 always)
      starsRef.current.forEach(star => {
        star.update(deltaTime, rotationSpeed, warpFactor);
        star.draw(ctx, warpFactor);
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [starCount, rotationSpeed, nebulaCount]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 z-0 pointer-events-none ${className}`}
      style={{
        background: '#020617',
      }}
    />
  );
}

export default Galaxy;

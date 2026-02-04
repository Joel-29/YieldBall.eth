import { useEffect, useRef, useCallback } from 'react';

/**
 * PixelSnow Background Component (ReactBits Style)
 * 
 * A pixelated falling snow effect with:
 * - Retro pixel aesthetic
 * - Varying snowflake sizes and speeds
 * - Depth perception via opacity
 * - Cyberpunk color theming
 */

class Snowflake {
  constructor(canvas, config) {
    this.canvas = canvas;
    this.config = config;
    this.reset(true);
  }

  reset(initial = false) {
    const { width, height } = this.canvas;
    
    this.x = Math.random() * width;
    this.y = initial ? Math.random() * height : -10;
    
    // Depth (z) affects size, speed, and opacity
    this.z = Math.random() * 3 + 1;
    
    // Base size affected by depth
    this.size = Math.floor((4 - this.z) * this.config.flakeSize + 1);
    
    // Speed affected by depth and config
    this.speedY = (0.5 + Math.random() * 0.5) * this.config.speed * (4 - this.z);
    this.speedX = (Math.random() - 0.5) * 0.3 * this.config.speed;
    
    // Drift for natural movement
    this.drift = Math.random() * Math.PI * 2;
    this.driftSpeed = Math.random() * 0.02 + 0.01;
    
    // Opacity based on depth
    this.opacity = (4 - this.z) / 3 * this.config.brightness;
  }

  update(deltaTime) {
    const { width, height } = this.canvas;
    
    // Apply drift
    this.drift += this.driftSpeed;
    const driftX = Math.sin(this.drift) * 0.5;
    
    // Apply wind direction
    const windRad = (this.config.direction * Math.PI) / 180;
    const windX = Math.sin(windRad) * this.speedY * 0.3;
    
    this.x += (this.speedX + driftX + windX) * deltaTime * 0.05;
    this.y += this.speedY * deltaTime * 0.05;
    
    // Wrap horizontally
    if (this.x > width + 10) this.x = -10;
    if (this.x < -10) this.x = width + 10;
    
    // Reset if off bottom
    if (this.y > height + 10) {
      this.reset();
    }
  }

  draw(ctx) {
    const { color, pixelSize } = this.config;
    
    // Pixelate position
    const px = Math.floor(this.x / pixelSize) * pixelSize;
    const py = Math.floor(this.y / pixelSize) * pixelSize;
    
    ctx.globalAlpha = this.opacity;
    ctx.fillStyle = color;
    
    // Draw pixelated square snowflake
    const size = Math.max(pixelSize, this.size * pixelSize);
    ctx.fillRect(px, py, size, size);
    
    ctx.globalAlpha = 1;
  }
}

export default function PixelSnow({
  color = '#ffffff',
  flakeSize = 2,
  pixelSize = 3,
  speed = 1.5,
  density = 150,
  direction = 180,
  brightness = 0.8,
  className = '',
}) {
  const canvasRef = useRef(null);
  const snowflakesRef = useRef([]);
  const animationRef = useRef(null);
  const lastTimeRef = useRef(0);

  const config = {
    color,
    flakeSize,
    pixelSize,
    speed,
    direction,
    brightness,
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.offsetWidth;
        canvas.height = parent.offsetHeight;
      }
      
      // Reinitialize snowflakes on resize
      snowflakesRef.current = Array.from(
        { length: density },
        () => new Snowflake(canvas, config)
      );
    };
    
    resize();
    window.addEventListener('resize', resize);

    const animate = (timestamp) => {
      const deltaTime = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      // Clear with transparency
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw snowflakes
      snowflakesRef.current.forEach(flake => {
        flake.update(deltaTime);
        flake.draw(ctx);
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
  }, [density, color, flakeSize, pixelSize, speed, direction, brightness]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{
        background: 'transparent',
      }}
    />
  );
}

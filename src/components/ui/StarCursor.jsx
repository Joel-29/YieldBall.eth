'use client';
import { useEffect, useRef } from 'react';

/**
 * StarCursor - Cosmic Star Trail Cursor
 * 
 * Creates a trail of glowing stars and cosmic particles following the cursor.
 * Non-blocking: pointer-events: none so it doesn't interfere with clicks.
 */
function StarCursor({
  starCount = 20,
  starSize = 3,
  trailLength = 15,
  colors = ['#00f2ff', '#7000ff', '#ffffff', '#fbbf24'],
  glowIntensity = 15,
  speed = 0.15,
}) {
  const canvasRef = useRef(null);
  const starsRef = useRef([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animationRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize stars
    const initStars = () => {
      starsRef.current = [];
      for (let i = 0; i < starCount; i++) {
        starsRef.current.push({
          x: mouseRef.current.x,
          y: mouseRef.current.y,
          size: Math.random() * starSize + 1,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 1,
          vx: 0,
          vy: 0,
          trail: [],
          twinkle: Math.random() * Math.PI * 2,
          twinkleSpeed: 0.05 + Math.random() * 0.1,
        });
      }
    };
    initStars();

    // Track mouse position
    const handleMouseMove = (e) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Track touch position
    const handleTouchMove = (e) => {
      if (e.touches.length > 0) {
        mouseRef.current.x = e.touches[0].clientX;
        mouseRef.current.y = e.touches[0].clientY;
      }
    };
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    // Draw a star shape
    const drawStar = (ctx, x, y, size, color, alpha, twinkle) => {
      const twinkleAlpha = 0.5 + Math.sin(twinkle) * 0.5;
      const finalAlpha = alpha * twinkleAlpha;
      
      ctx.save();
      ctx.globalAlpha = finalAlpha;
      
      // Glow effect
      ctx.shadowBlur = glowIntensity;
      ctx.shadowColor = color;
      
      // Draw 4-point star
      ctx.beginPath();
      ctx.fillStyle = color;
      
      const spikes = 4;
      const outerRadius = size;
      const innerRadius = size * 0.4;
      
      for (let i = 0; i < spikes * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (i * Math.PI) / spikes - Math.PI / 2;
        const px = x + Math.cos(angle) * radius;
        const py = y + Math.sin(angle) * radius;
        
        if (i === 0) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.closePath();
      ctx.fill();
      
      // Inner bright core
      ctx.beginPath();
      ctx.arc(x, y, size * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = finalAlpha * 0.8;
      ctx.fill();
      
      ctx.restore();
    };

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      starsRef.current.forEach((star, index) => {
        // Calculate target position with offset based on index
        const angle = (index / starCount) * Math.PI * 2;
        const radius = 5 + (index % 5) * 3;
        const targetX = mouseRef.current.x + Math.cos(angle) * radius;
        const targetY = mouseRef.current.y + Math.sin(angle) * radius;

        // Smooth follow with easing
        const ease = speed + (index * 0.01);
        star.vx = (targetX - star.x) * ease;
        star.vy = (targetY - star.y) * ease;
        star.x += star.vx;
        star.y += star.vy;

        // Update twinkle
        star.twinkle += star.twinkleSpeed;

        // Add to trail
        star.trail.unshift({ x: star.x, y: star.y, alpha: 1 });
        if (star.trail.length > trailLength) {
          star.trail.pop();
        }

        // Draw trail
        star.trail.forEach((point, i) => {
          const trailAlpha = 1 - (i / trailLength);
          const trailSize = star.size * (1 - i / trailLength * 0.5);
          drawStar(ctx, point.x, point.y, trailSize, star.color, trailAlpha * 0.3, star.twinkle);
        });

        // Draw main star
        drawStar(ctx, star.x, star.y, star.size, star.color, 1, star.twinkle);
      });

      // Draw cursor glow at mouse position
      const gradient = ctx.createRadialGradient(
        mouseRef.current.x, mouseRef.current.y, 0,
        mouseRef.current.x, mouseRef.current.y, 30
      );
      gradient.addColorStop(0, 'rgba(0, 242, 255, 0.3)');
      gradient.addColorStop(0.5, 'rgba(112, 0, 255, 0.1)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.beginPath();
      ctx.arc(mouseRef.current.x, mouseRef.current.y, 30, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [starCount, starSize, trailLength, colors, glowIntensity, speed]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[9999] pointer-events-none"
      style={{ 
        mixBlendMode: 'screen',
      }}
    />
  );
}

export default StarCursor;

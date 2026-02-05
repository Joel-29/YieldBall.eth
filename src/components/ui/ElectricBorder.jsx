/**
 * ElectricBorder - ReactBits Style Canvas Animation
 * 
 * High-performance animated electric border using:
 * - Canvas-based rendering with noise functions
 * - Simplex noise for organic movement
 * - RequestAnimationFrame for smooth 60fps
 * 
 * Props:
 * - color: Electric border color (default: #7df9ff)
 * - speed: Animation speed multiplier (default: 1)
 * - chaos: Noise chaos factor (default: 0.12)
 * - borderRadius: Corner radius in pixels (default: 24)
 * - borderWidth: Border thickness (default: 3)
 */

import React, { useRef, useEffect, useCallback } from 'react';
import './ElectricBorder.css';

// Simplex noise implementation (2D)
const GRAD3 = [
  [1, 1], [-1, 1], [1, -1], [-1, -1],
  [1, 0], [-1, 0], [0, 1], [0, -1],
];

const F2 = 0.5 * (Math.sqrt(3) - 1);
const G2 = (3 - Math.sqrt(3)) / 6;

function createNoise2D(seed = Math.random() * 1000) {
  const perm = new Uint8Array(512);
  const permMod8 = new Uint8Array(512);
  
  // Initialize permutation table
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  
  // Shuffle based on seed
  let s = seed;
  for (let i = 255; i > 0; i--) {
    s = (s * 16807) % 2147483647;
    const j = s % (i + 1);
    [p[i], p[j]] = [p[j], p[i]];
  }
  
  for (let i = 0; i < 512; i++) {
    perm[i] = p[i & 255];
    permMod8[i] = perm[i] % 8;
  }

  return function noise2D(x, y) {
    const s = (x + y) * F2;
    const i = Math.floor(x + s);
    const j = Math.floor(y + s);
    
    const t = (i + j) * G2;
    const X0 = i - t;
    const Y0 = j - t;
    const x0 = x - X0;
    const y0 = y - Y0;
    
    const i1 = x0 > y0 ? 1 : 0;
    const j1 = x0 > y0 ? 0 : 1;
    
    const x1 = x0 - i1 + G2;
    const y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2;
    const y2 = y0 - 1 + 2 * G2;
    
    const ii = i & 255;
    const jj = j & 255;
    
    let n0 = 0, n1 = 0, n2 = 0;
    
    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 >= 0) {
      const gi0 = permMod8[ii + perm[jj]];
      t0 *= t0;
      n0 = t0 * t0 * (GRAD3[gi0][0] * x0 + GRAD3[gi0][1] * y0);
    }
    
    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 >= 0) {
      const gi1 = permMod8[ii + i1 + perm[jj + j1]];
      t1 *= t1;
      n1 = t1 * t1 * (GRAD3[gi1][0] * x1 + GRAD3[gi1][1] * y1);
    }
    
    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 >= 0) {
      const gi2 = permMod8[ii + 1 + perm[jj + 1]];
      t2 *= t2;
      n2 = t2 * t2 * (GRAD3[gi2][0] * x2 + GRAD3[gi2][1] * y2);
    }
    
    return 70 * (n0 + n1 + n2);
  };
}

// Octaved noise for more organic movement
function octavedNoise(noise2D, x, y, octaves = 4, persistence = 0.5) {
  let total = 0;
  let frequency = 1;
  let amplitude = 1;
  let maxValue = 0;
  
  for (let i = 0; i < octaves; i++) {
    total += noise2D(x * frequency, y * frequency) * amplitude;
    maxValue += amplitude;
    amplitude *= persistence;
    frequency *= 2;
  }
  
  return total / maxValue;
}

// Parse color to RGB
function parseColor(color) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = color || '#7df9ff';
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return { r, g, b };
}

export function ElectricBorder({
  children,
  color = '#7df9ff',
  speed = 1,
  chaos = 0.12,
  borderRadius = 24,
  borderWidth = 3,
  className = '',
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const noiseRef = useRef(null);
  const timeRef = useRef(0);
  const colorRef = useRef(parseColor(color));

  // Update color when prop changes
  useEffect(() => {
    colorRef.current = parseColor(color);
  }, [color]);

  // Initialize noise function
  useEffect(() => {
    noiseRef.current = createNoise2D();
  }, []);

  // Draw electric border on canvas
  const drawBorder = useCallback((ctx, width, height, time) => {
    if (!noiseRef.current) return;
    
    const noise2D = noiseRef.current;
    const { r, g, b } = colorRef.current;
    
    ctx.clearRect(0, 0, width, height);
    
    // Calculate border path with rounded corners
    const radius = Math.min(borderRadius, width / 2, height / 2);
    const segments = 200; // Number of points along the border
    const perimeter = 2 * (width + height - 4 * radius) + 2 * Math.PI * radius;
    
    ctx.lineWidth = borderWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Draw multiple electric strands
    for (let strand = 0; strand < 3; strand++) {
      ctx.beginPath();
      
      const strandOffset = strand * 0.3;
      const strandIntensity = 1 - strand * 0.25;
      
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const pos = t * perimeter;
        
        // Get base position on border
        let x, y;
        let normalX = 0, normalY = 0;
        
        // Calculate position along rounded rectangle
        const straightTop = width - 2 * radius;
        const straightRight = height - 2 * radius;
        const straightBottom = width - 2 * radius;
        const straightLeft = height - 2 * radius;
        const cornerLength = Math.PI * radius / 2;
        
        let accumulated = 0;
        
        // Top edge
        if (pos < straightTop) {
          x = radius + pos;
          y = 0;
          normalX = 0;
          normalY = -1;
        } else if (pos < straightTop + cornerLength) {
          // Top-right corner
          accumulated = straightTop;
          const angle = (pos - accumulated) / radius;
          x = width - radius + Math.sin(angle) * radius;
          y = radius - Math.cos(angle) * radius;
          normalX = Math.sin(angle);
          normalY = -Math.cos(angle);
        } else if (pos < straightTop + cornerLength + straightRight) {
          // Right edge
          accumulated = straightTop + cornerLength;
          x = width;
          y = radius + (pos - accumulated);
          normalX = 1;
          normalY = 0;
        } else if (pos < straightTop + 2 * cornerLength + straightRight) {
          // Bottom-right corner
          accumulated = straightTop + cornerLength + straightRight;
          const angle = (pos - accumulated) / radius;
          x = width - radius + Math.cos(angle) * radius;
          y = height - radius + Math.sin(angle) * radius;
          normalX = Math.cos(angle);
          normalY = Math.sin(angle);
        } else if (pos < straightTop + 2 * cornerLength + straightRight + straightBottom) {
          // Bottom edge
          accumulated = straightTop + 2 * cornerLength + straightRight;
          x = width - radius - (pos - accumulated);
          y = height;
          normalX = 0;
          normalY = 1;
        } else if (pos < straightTop + 3 * cornerLength + straightRight + straightBottom) {
          // Bottom-left corner
          accumulated = straightTop + 2 * cornerLength + straightRight + straightBottom;
          const angle = (pos - accumulated) / radius;
          x = radius - Math.sin(angle) * radius;
          y = height - radius + Math.cos(angle) * radius;
          normalX = -Math.sin(angle);
          normalY = Math.cos(angle);
        } else if (pos < straightTop + 3 * cornerLength + straightRight + straightBottom + straightLeft) {
          // Left edge
          accumulated = straightTop + 3 * cornerLength + straightRight + straightBottom;
          x = 0;
          y = height - radius - (pos - accumulated);
          normalX = -1;
          normalY = 0;
        } else {
          // Top-left corner
          accumulated = straightTop + 3 * cornerLength + straightRight + straightBottom + straightLeft;
          const angle = (pos - accumulated) / radius;
          x = radius - Math.cos(angle) * radius;
          y = radius - Math.sin(angle) * radius;
          normalX = -Math.cos(angle);
          normalY = -Math.sin(angle);
        }
        
        // Apply noise displacement
        const noiseVal = octavedNoise(
          noise2D,
          t * 5 + time * speed + strandOffset,
          time * speed * 0.5 + strandOffset,
          3,
          0.5
        );
        
        const displacement = noiseVal * chaos * 30;
        x += normalX * displacement;
        y += normalY * displacement;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      
      // Stroke with gradient effect
      const alpha = (0.4 + Math.sin(time * 3 + strand) * 0.3) * strandIntensity;
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.8)`;
      ctx.shadowBlur = 10 + strand * 5;
      ctx.stroke();
    }
    
    // Add bright spark points
    const sparkCount = 5;
    for (let i = 0; i < sparkCount; i++) {
      const sparkT = (time * speed * 0.2 + i / sparkCount) % 1;
      const sparkPos = sparkT * perimeter;
      
      // Simplified position calculation for sparks
      let sparkX, sparkY;
      const straightTop = width - 2 * radius;
      
      if (sparkPos < straightTop) {
        sparkX = radius + sparkPos;
        sparkY = 0;
      } else {
        // Approximate for other edges
        const remaining = sparkPos - straightTop;
        const edgeLength = perimeter / 4;
        const edge = Math.floor(remaining / edgeLength);
        const edgeT = (remaining % edgeLength) / edgeLength;
        
        switch (edge % 4) {
          case 0:
            sparkX = width;
            sparkY = edgeT * height;
            break;
          case 1:
            sparkX = width - edgeT * width;
            sparkY = height;
            break;
          case 2:
            sparkX = 0;
            sparkY = height - edgeT * height;
            break;
          default:
            sparkX = edgeT * width;
            sparkY = 0;
        }
      }
      
      const sparkIntensity = 0.5 + Math.sin(time * 5 + i * 2) * 0.5;
      ctx.beginPath();
      ctx.arc(sparkX, sparkY, 2 + sparkIntensity * 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${sparkIntensity * 0.8})`;
      ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 1)`;
      ctx.shadowBlur = 15;
      ctx.fill();
    }
  }, [borderRadius, borderWidth, chaos, speed]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    let running = true;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.scale(dpr, dpr);
    };

    const animate = () => {
      if (!running) return;
      
      const rect = container.getBoundingClientRect();
      timeRef.current += 0.016; // ~60fps
      
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      const dpr = window.devicePixelRatio || 1;
      ctx.scale(dpr, dpr);
      
      drawBorder(ctx, rect.width, rect.height, timeRef.current);
      
      animationRef.current = requestAnimationFrame(animate);
    };

    resize();
    animate();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    window.addEventListener('resize', resize);

    return () => {
      running = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      resizeObserver.disconnect();
      window.removeEventListener('resize', resize);
    };
  }, [drawBorder]);

  return (
    <div
      ref={containerRef}
      className={`eb-container ${className}`}
      style={{ 
        '--eb-color': color,
        borderRadius: `${borderRadius}px`,
      }}
    >
      {/* Outer glow effect */}
      <div className="eb-glow" style={{ borderRadius: `${borderRadius}px` }} />
      
      {/* Canvas for electric animation */}
      <canvas
        ref={canvasRef}
        className="eb-canvas"
        style={{ borderRadius: `${borderRadius}px` }}
      />
      
      {/* Inner glow overlay */}
      <div className="eb-inner-glow" style={{ borderRadius: `${borderRadius}px` }} />
      
      {/* Content */}
      <div className="eb-content" style={{ borderRadius: `${borderRadius}px` }}>
        {children}
      </div>
    </div>
  );
}

export default ElectricBorder;

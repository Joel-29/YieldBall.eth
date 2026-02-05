/**
 * ElectricBorder - Animated electric/lightning border effect
 * Inspired by ReactBits - creates a pulsing, glowing border effect
 * Perfect for high-value UI elements like settlement modals
 */

import React, { useMemo } from 'react';

export function ElectricBorder({ 
  children, 
  colorFrom = '#00f2ff', // Electric Cyan
  colorTo = '#7000ff',   // Deep Purple
  className = '',
  borderWidth = 2,
  glowIntensity = 1,
  pulseSpeed = 2, // seconds
  cornerRadius = 16,
}) {
  // Generate unique animation ID for multiple instances
  const animId = useMemo(() => `electric-${Math.random().toString(36).substr(2, 9)}`, []);

  return (
    <div className={`relative ${className}`}>
      {/* SVG Filter for glow effect */}
      <svg className="absolute w-0 h-0">
        <defs>
          <filter id={`${animId}-glow`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={4 * glowIntensity} result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <linearGradient id={`${animId}-gradient`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colorFrom}>
              <animate
                attributeName="stop-color"
                values={`${colorFrom};${colorTo};${colorFrom}`}
                dur={`${pulseSpeed}s`}
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="50%" stopColor={colorTo}>
              <animate
                attributeName="stop-color"
                values={`${colorTo};${colorFrom};${colorTo}`}
                dur={`${pulseSpeed}s`}
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="100%" stopColor={colorFrom}>
              <animate
                attributeName="stop-color"
                values={`${colorFrom};${colorTo};${colorFrom}`}
                dur={`${pulseSpeed}s`}
                repeatCount="indefinite"
              />
            </stop>
          </linearGradient>
        </defs>
      </svg>

      {/* Outer glow layer */}
      <div 
        className="absolute -inset-1 rounded-[inherit] opacity-60 blur-md animate-pulse"
        style={{
          background: `linear-gradient(135deg, ${colorFrom}, ${colorTo})`,
          borderRadius: cornerRadius + 4,
          animation: `electric-pulse ${pulseSpeed}s ease-in-out infinite`,
        }}
      />

      {/* Electric border container */}
      <div 
        className="absolute inset-0 overflow-hidden"
        style={{ borderRadius: cornerRadius }}
      >
        {/* Rotating gradient border */}
        <div 
          className="absolute inset-0"
          style={{
            borderRadius: cornerRadius,
            padding: borderWidth,
            background: `linear-gradient(var(--electric-angle, 0deg), ${colorFrom}, ${colorTo}, ${colorFrom})`,
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
            animation: `electric-rotate ${pulseSpeed * 2}s linear infinite`,
          }}
        />

        {/* Sparkle particles */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              background: i % 2 === 0 ? colorFrom : colorTo,
              boxShadow: `0 0 ${6 * glowIntensity}px ${i % 2 === 0 ? colorFrom : colorTo}`,
              animation: `electric-sparkle-${i % 3} ${1 + (i * 0.3)}s ease-in-out infinite`,
              animationDelay: `${i * 0.2}s`,
              top: `${10 + (i * 15)}%`,
              left: i < 3 ? '0%' : '100%',
              transform: 'translateX(-50%)',
            }}
          />
        ))}
      </div>

      {/* Inner glow border */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          borderRadius: cornerRadius,
          boxShadow: `
            inset 0 0 ${20 * glowIntensity}px ${colorFrom}20,
            inset 0 0 ${40 * glowIntensity}px ${colorTo}10
          `,
        }}
      />

      {/* Content */}
      <div className="relative z-10" style={{ borderRadius: cornerRadius }}>
        {children}
      </div>

      {/* Keyframes injected via style tag */}
      <style>{`
        @keyframes electric-pulse {
          0%, 100% { 
            opacity: 0.4; 
            transform: scale(1);
          }
          50% { 
            opacity: 0.7; 
            transform: scale(1.02);
          }
        }
        
        @keyframes electric-rotate {
          0% { --electric-angle: 0deg; }
          100% { --electric-angle: 360deg; }
        }
        
        @keyframes electric-sparkle-0 {
          0%, 100% { 
            opacity: 0; 
            transform: translateX(-50%) translateY(0);
          }
          50% { 
            opacity: 1; 
            transform: translateX(-50%) translateY(10px);
          }
        }
        
        @keyframes electric-sparkle-1 {
          0%, 100% { 
            opacity: 0; 
            transform: translateX(-50%) translateY(0);
          }
          50% { 
            opacity: 1; 
            transform: translateX(-50%) translateY(-10px);
          }
        }
        
        @keyframes electric-sparkle-2 {
          0%, 100% { 
            opacity: 0; 
            transform: translateX(-50%) scale(0.5);
          }
          50% { 
            opacity: 1; 
            transform: translateX(-50%) scale(1.5);
          }
        }

        @property --electric-angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }
      `}</style>
    </div>
  );
}

/**
 * ElectricGlow - Just the glow effect without border, for backgrounds
 */
export function ElectricGlow({
  colorFrom = '#00f2ff',
  colorTo = '#7000ff',
  className = '',
  intensity = 1,
  pulseSpeed = 3,
}) {
  return (
    <div 
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{
        background: `radial-gradient(ellipse at center, ${colorFrom}${Math.round(20 * intensity).toString(16).padStart(2, '0')}, ${colorTo}${Math.round(10 * intensity).toString(16).padStart(2, '0')}, transparent 70%)`,
        animation: `electric-glow-pulse ${pulseSpeed}s ease-in-out infinite`,
      }}
    >
      <style>{`
        @keyframes electric-glow-pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}

export default ElectricBorder;

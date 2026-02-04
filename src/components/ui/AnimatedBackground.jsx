import React, { useMemo } from 'react';

/**
 * AnimatedBackground - Moving Grid Background (ReactBits Style)
 * 
 * Creates an engaging, high-tech animated background with glowing 
 * teal/purple grid lines that move slowly in the background.
 */
export function AnimatedBackground({ children }) {
  return (
    <div className="relative min-h-screen bg-cyber-darker overflow-hidden">
      {/* Animated Grid Layer */}
      <div 
        className="absolute inset-0 pointer-events-none will-change-transform"
        style={{
          backgroundImage: `
            linear-gradient(rgba(139, 92, 246, 0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139, 92, 246, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          animation: 'grid-flow 20s linear infinite',
        }}
      />

      {/* Secondary Grid (offset, slower) */}
      <div 
        className="absolute inset-0 pointer-events-none will-change-transform"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 245, 255, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 245, 255, 0.04) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
          backgroundPosition: '20px 20px',
          animation: 'grid-flow 40s linear infinite reverse',
        }}
      />

      {/* Glowing orbs for depth */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute w-96 h-96 rounded-full blur-3xl opacity-10"
          style={{
            background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)',
            top: '10%',
            left: '10%',
            animation: 'pulse 8s ease-in-out infinite',
          }}
        />
        <div 
          className="absolute w-80 h-80 rounded-full blur-3xl opacity-10"
          style={{
            background: 'radial-gradient(circle, #00f5ff 0%, transparent 70%)',
            bottom: '20%',
            right: '10%',
            animation: 'pulse 10s ease-in-out infinite reverse',
          }}
        />
        <div 
          className="absolute w-64 h-64 rounded-full blur-3xl opacity-5"
          style={{
            background: 'radial-gradient(circle, #ff006e 0%, transparent 70%)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            animation: 'pulse 12s ease-in-out infinite',
          }}
        />
      </div>

      {/* Scanline overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          background: `repeating-linear-gradient(
            0deg,
            rgba(0, 0, 0, 0.1),
            rgba(0, 0, 0, 0.1) 1px,
            transparent 1px,
            transparent 2px
          )`,
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

/**
 * AnimatedSquares - Floating squares background variation
 */
export function AnimatedSquares({ count = 15 }) {
  const squares = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      size: Math.random() * 60 + 20,
      left: Math.random() * 100,
      top: Math.random() * 100,
      duration: Math.random() * 20 + 15,
      delay: Math.random() * 10,
      opacity: Math.random() * 0.08 + 0.02,
    }));
  }, [count]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {squares.map((square) => (
        <div
          key={square.id}
          className="absolute border border-neon-purple/20 rounded-lg will-change-transform"
          style={{
            width: square.size,
            height: square.size,
            left: `${square.left}%`,
            top: `${square.top}%`,
            opacity: square.opacity,
            animation: `float ${square.duration}s ease-in-out ${square.delay}s infinite`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
      `}</style>
    </div>
  );
}

export default AnimatedBackground;

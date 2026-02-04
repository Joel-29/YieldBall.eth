import React from 'react';

/**
 * ShinyText Component (ReactBits Style)
 * 
 * A text component with a continuous shimmer effect using a linear gradient
 * transition. Supports multiple color themes and animation speeds.
 * 
 * @param {string} variant - 'silver' | 'gold' | 'neon' | 'rainbow'
 * @param {string} speed - 'slow' | 'normal' | 'fast'
 * @param {boolean} disabled - Disable the shimmer effect
 */
export function ShinyText({ 
  children, 
  variant = 'silver',
  speed = 'normal',
  disabled = false,
  className = '',
  as: Component = 'span',
  ...props
}) {
  const gradients = {
    silver: 'linear-gradient(90deg, #b5b5b5 0%, #ffffff 25%, #b5b5b5 50%, #ffffff 75%, #b5b5b5 100%)',
    gold: 'linear-gradient(90deg, #b8860b 0%, #ffd700 20%, #fff8dc 40%, #ffd700 60%, #b8860b 80%, #ffd700 100%)',
    neon: 'linear-gradient(90deg, #ff006e 0%, #00f5ff 25%, #8b5cf6 50%, #00f5ff 75%, #ff006e 100%)',
    rainbow: 'linear-gradient(90deg, #ff006e 0%, #fbbf24 20%, #22c55e 40%, #00f5ff 60%, #8b5cf6 80%, #ff006e 100%)',
    cyan: 'linear-gradient(90deg, #0891b2 0%, #00f5ff 25%, #ffffff 50%, #00f5ff 75%, #0891b2 100%)',
    pink: 'linear-gradient(90deg, #be185d 0%, #ff006e 25%, #ffffff 50%, #ff006e 75%, #be185d 100%)',
    purple: 'linear-gradient(90deg, #6d28d9 0%, #8b5cf6 25%, #ffffff 50%, #8b5cf6 75%, #6d28d9 100%)',
  };

  const speeds = {
    slow: 'animate-shiny-slow',
    normal: 'animate-shiny',
    fast: 'animate-shiny-fast',
  };

  const style = disabled ? {} : {
    backgroundImage: gradients[variant] || gradients.silver,
    backgroundSize: '200% 100%',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    color: 'transparent',
  };

  return (
    <Component
      className={`${disabled ? '' : speeds[speed]} ${className}`}
      style={style}
      {...props}
    >
      {children}
    </Component>
  );
}

/**
 * ShinyBadge - A badge with shiny text and glowing border
 */
export function ShinyBadge({
  children,
  variant = 'neon',
  className = '',
  glowColor = '#8b5cf6',
}) {
  return (
    <div
      className={`
        inline-flex items-center px-3 py-1 rounded-full
        backdrop-blur-md bg-white/5 border border-white/10
        shadow-lg
        ${className}
      `}
      style={{
        boxShadow: `0 0 20px ${glowColor}40, inset 0 0 20px ${glowColor}10`,
      }}
    >
      <ShinyText variant={variant} speed="normal" className="font-cyber text-sm font-bold uppercase tracking-wider">
        {children}
      </ShinyText>
    </div>
  );
}

/**
 * ShinyButton - Interactive button with shiny hover effects
 */
export function ShinyButton({
  children,
  onClick,
  disabled = false,
  variant = 'purple',
  className = '',
  ...props
}) {
  const colors = {
    purple: {
      base: 'from-neon-purple/80 to-neon-pink/80',
      hover: 'from-neon-purple to-neon-pink',
      glow: '#8b5cf6',
      text: 'purple',
    },
    cyan: {
      base: 'from-neon-cyan/80 to-neon-purple/80',
      hover: 'from-neon-cyan to-neon-purple',
      glow: '#00f5ff',
      text: 'cyan',
    },
    pink: {
      base: 'from-neon-pink/80 to-neon-purple/80',
      hover: 'from-neon-pink to-neon-purple',
      glow: '#ff006e',
      text: 'pink',
    },
    gold: {
      base: 'from-yellow-500/80 to-orange-500/80',
      hover: 'from-yellow-400 to-orange-400',
      glow: '#ffd700',
      text: 'gold',
    },
  };

  const colorConfig = colors[variant] || colors.purple;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        group relative overflow-hidden
        px-8 py-4 rounded-xl
        bg-gradient-to-r ${colorConfig.base}
        hover:bg-gradient-to-r ${colorConfig.hover}
        border border-white/20
        transition-all duration-300
        hover:scale-105 hover:-translate-y-0.5
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
        ${className}
      `}
      style={{
        boxShadow: `0 4px 30px ${colorConfig.glow}40`,
      }}
      {...props}
    >
      {/* Shimmer overlay on hover */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)',
          backgroundSize: '200% 100%',
          animation: 'shiny 1.5s linear infinite',
        }}
      />
      
      {/* Button text */}
      <ShinyText 
        variant={colorConfig.text}
        speed="normal"
        className="relative z-10 font-arcade text-sm md:text-base"
      >
        {children}
      </ShinyText>
    </button>
  );
}

/**
 * GlassmorphicCard - Premium glassmorphism container
 */
export function GlassmorphicCard({
  children,
  className = '',
  glowColor = '#8b5cf6',
  neonBorder = true,
}) {
  return (
    <div
      className={`
        relative rounded-2xl
        backdrop-blur-md bg-white/5
        ${neonBorder ? 'border border-white/10' : ''}
        shadow-glass
        ${className}
      `}
      style={{
        boxShadow: neonBorder 
          ? `0 0 30px ${glowColor}20, inset 0 1px 0 rgba(255,255,255,0.1)`
          : undefined,
      }}
    >
      {children}
    </div>
  );
}

export default ShinyText;

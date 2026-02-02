import React from 'react';

export function NeonButton({ 
  children, 
  onClick, 
  variant = 'purple', 
  size = 'md',
  disabled = false,
  className = '',
  ...props 
}) {
  const variants = {
    purple: 'border-neon-purple text-neon-purple hover:bg-neon-purple/20 hover:shadow-neon-purple',
    pink: 'border-neon-pink text-neon-pink hover:bg-neon-pink/20 hover:shadow-neon-pink',
    cyan: 'border-neon-cyan text-neon-cyan hover:bg-neon-cyan/20 hover:shadow-neon-cyan',
    green: 'border-neon-green text-neon-green hover:bg-neon-green/20',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        font-cyber font-bold uppercase tracking-wider
        border-2 rounded-lg
        transition-all duration-300 ease-out
        ${variants[variant]}
        ${sizes[size]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:-translate-y-0.5'}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}

export function NeonCard({ children, className = '', glow = 'purple' }) {
  const glowColors = {
    purple: 'border-neon-purple/50 shadow-neon-purple/20',
    pink: 'border-neon-pink/50 shadow-neon-pink/20',
    cyan: 'border-neon-cyan/50 shadow-neon-cyan/20',
  };

  return (
    <div className={`
      bg-cyber-darker/80 backdrop-blur-sm
      border rounded-xl p-6
      ${glowColors[glow]}
      ${className}
    `}>
      {children}
    </div>
  );
}

export function NeonText({ children, color = 'cyan', as: Component = 'span', className = '' }) {
  const colors = {
    pink: 'neon-text-pink',
    cyan: 'neon-text-cyan',
    purple: 'neon-text-purple',
  };

  return (
    <Component className={`${colors[color]} ${className}`}>
      {children}
    </Component>
  );
}

export function GlowingOrb({ color = 'pink', size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const colors = {
    pink: 'bg-neon-pink shadow-neon-pink',
    cyan: 'bg-neon-cyan shadow-neon-cyan',
    purple: 'bg-neon-purple shadow-neon-purple',
  };

  return (
    <div className={`
      rounded-full animate-pulse
      ${sizes[size]}
      ${colors[color]}
      ${className}
    `} />
  );
}

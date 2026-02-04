/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'cyber-dark': '#0f172a',
        'cyber-darker': '#020617',
        'neon-pink': '#ff006e',
        'neon-cyan': '#00f5ff',
        'neon-purple': '#8b5cf6',
        'neon-yellow': '#fbbf24',
        'neon-green': '#22c55e',
        'neon-gold': '#ffd700',
      },
      fontFamily: {
        'arcade': ['"Press Start 2P"', 'monospace'],
        'cyber': ['Orbitron', 'sans-serif'],
        'mono': ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-neon': 'pulse-neon 2s ease-in-out infinite',
        'glow': 'glow 1.5s ease-in-out infinite alternate',
        'flicker': 'flicker 0.15s infinite',
        'shiny': 'shiny 2s linear infinite',
        'shiny-slow': 'shiny 3s linear infinite',
        'shiny-fast': 'shiny 1.5s linear infinite',
        'pulse-yield': 'pulse-yield 0.3s ease-out',
        'slide-up': 'slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slide-down 0.3s ease-out',
        'grid-flow': 'grid-flow 20s linear infinite',
        'bucket-glow': 'bucket-glow 2s ease-in-out infinite',
      },
      keyframes: {
        'pulse-neon': {
          '0%, 100%': { 
            boxShadow: '0 0 5px currentColor, 0 0 10px currentColor, 0 0 20px currentColor',
            opacity: '1'
          },
          '50%': { 
            boxShadow: '0 0 10px currentColor, 0 0 20px currentColor, 0 0 40px currentColor',
            opacity: '0.8'
          },
        },
        'glow': {
          '0%': { filter: 'drop-shadow(0 0 5px currentColor)' },
          '100%': { filter: 'drop-shadow(0 0 20px currentColor)' },
        },
        'flicker': {
          '0%, 19%, 21%, 23%, 25%, 54%, 56%, 100%': { opacity: '1' },
          '20%, 24%, 55%': { opacity: '0.4' },
        },
        'shiny': {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        'pulse-yield': {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'grid-flow': {
          '0%': { transform: 'translateY(0) translateX(0)' },
          '100%': { transform: 'translateY(40px) translateX(40px)' },
        },
        'bucket-glow': {
          '0%, 100%': { opacity: '0.6', filter: 'blur(8px)' },
          '50%': { opacity: '1', filter: 'blur(12px)' },
        },
      },
      boxShadow: {
        'neon-pink': '0 0 5px #ff006e, 0 0 10px #ff006e, 0 0 20px #ff006e, 0 0 40px #ff006e',
        'neon-cyan': '0 0 5px #00f5ff, 0 0 10px #00f5ff, 0 0 20px #00f5ff, 0 0 40px #00f5ff',
        'neon-purple': '0 0 5px #8b5cf6, 0 0 10px #8b5cf6, 0 0 20px #8b5cf6, 0 0 40px #8b5cf6',
        'neon-gold': '0 0 5px #ffd700, 0 0 10px #ffd700, 0 0 20px #ffd700',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.36)',
      },
      backdropBlur: {
        'xs': '2px',
      },
    },
  },
  plugins: [],
}

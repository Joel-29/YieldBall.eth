import React from 'react';
import { NeonText } from './ui/NeonElements.jsx';
import { PLAYER_CLASSES } from '../engine/PinballEngine.js';

export function GameHUD({ 
  score, 
  yieldEarned, 
  principal,
  playerClass,
  isPlaying 
}) {
  const classSettings = PLAYER_CLASSES[playerClass] || PLAYER_CLASSES.default;

  return (
    <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none z-10">
      {/* Left Panel - Score */}
      <div className="bg-cyber-darker/90 backdrop-blur-sm border border-neon-pink/50 rounded-lg p-4 min-w-[180px]">
        <p className="text-xs text-gray-500 font-cyber uppercase tracking-wider mb-1">Score</p>
        <NeonText color="pink" className="font-arcade text-2xl">
          {score.toLocaleString()}
        </NeonText>
        
        {classSettings.multiplier > 1 && (
          <div className="mt-2 bg-neon-yellow/20 rounded px-2 py-1 inline-block">
            <span className="text-neon-yellow text-xs font-cyber font-bold">
              {classSettings.multiplier}x MULTIPLIER
            </span>
          </div>
        )}
      </div>

      {/* Right Panel - Yield */}
      <div className="bg-cyber-darker/90 backdrop-blur-sm border border-neon-cyan/50 rounded-lg p-4 min-w-[200px] text-right">
        <p className="text-xs text-gray-500 font-cyber uppercase tracking-wider mb-1">Real-time Yield</p>
        <div className="flex items-baseline justify-end gap-1">
          <span className="text-gray-400 font-cyber text-sm">$</span>
          <NeonText color="cyan" className="font-arcade text-2xl">
            {yieldEarned.toFixed(4)}
          </NeonText>
        </div>
        
        <div className="mt-2 pt-2 border-t border-gray-700">
          <p className="text-xs text-gray-500 font-cyber">
            Principal: <span className="text-white">${principal}</span>
          </p>
          <p className="text-xs text-neon-cyan font-cyber mt-1">
            Total: ${(principal + yieldEarned).toFixed(4)}
          </p>
        </div>
      </div>
    </div>
  );
}

export function ControlsHint({ playerClass }) {
  const classSettings = PLAYER_CLASSES[playerClass] || PLAYER_CLASSES.default;

  return (
    <div className="absolute bottom-4 left-4 right-4 flex justify-center pointer-events-none z-10">
      <div className="bg-cyber-darker/90 backdrop-blur-sm border border-neon-purple/30 rounded-lg px-6 py-3">
        <div className="flex items-center gap-8 text-sm font-cyber">
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-neon-pink/20 border border-neon-pink/50 rounded text-neon-pink">A</kbd>
            <span className="text-gray-400">or</span>
            <kbd className="px-2 py-1 bg-neon-pink/20 border border-neon-pink/50 rounded text-neon-pink">←</kbd>
            <span className="text-gray-500">Left Flipper</span>
          </div>
          
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-neon-cyan/20 border border-neon-cyan/50 rounded text-neon-cyan">D</kbd>
            <span className="text-gray-400">or</span>
            <kbd className="px-2 py-1 bg-neon-cyan/20 border border-neon-cyan/50 rounded text-neon-cyan">→</kbd>
            <span className="text-gray-500">Right Flipper</span>
          </div>
          
          <div className="flex items-center gap-2">
            <kbd className="px-3 py-1 bg-neon-purple/20 border border-neon-purple/50 rounded text-neon-purple">SPACE</kbd>
            <span className="text-gray-500">Launch</span>
          </div>
        </div>
        
        <p className="text-center text-xs text-gray-600 mt-2 font-cyber">
          {classSettings.description}
        </p>
      </div>
    </div>
  );
}

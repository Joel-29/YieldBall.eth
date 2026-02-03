import React from 'react';
import { useAccount, useEnsName } from 'wagmi';
import { NeonText } from './ui/NeonElements.jsx';
import { PLAYER_CLASSES } from '../engine/PinballEngine.js';

export function GameHUD({ 
  score, 
  yieldEarned, 
  principal,
  playerClass,
  yieldMultiplier = 1,
  isPlaying 
}) {
  const { address } = useAccount();
  const { data: ensName } = useEnsName({ address });
  const classSettings = PLAYER_CLASSES[playerClass] || PLAYER_CLASSES.default;

  // Format address for display
  const displayAddress = ensName || (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '');

  return (
    <>
      {/* Top HUD Bar - Principal: 100 USDC | Yield: $[yieldEarned] */}
      <div className="absolute -top-14 left-0 right-0 flex justify-center pointer-events-none z-10">
        <div className="bg-cyber-darker/95 backdrop-blur-md border-2 border-neon-purple/60 rounded-full px-6 py-3 shadow-lg shadow-neon-purple/20">
          <div className="flex items-center gap-6">
            {/* Principal */}
            <div className="flex items-center gap-2">
              <span className="text-gray-400 font-cyber text-sm">Principal:</span>
              <span className="text-white font-arcade text-lg">{principal}</span>
              <span className="text-gray-500 font-cyber text-xs">USDC</span>
            </div>
            
            <div className="w-px h-6 bg-neon-purple/40" />
            
            {/* Yield */}
            <div className="flex items-center gap-2">
              <span className="text-gray-400 font-cyber text-sm">Yield:</span>
              <NeonText color="cyan" className="font-arcade text-lg">
                ${yieldEarned.toFixed(4)}
              </NeonText>
              {yieldMultiplier > 1 && (
                <span className="text-neon-yellow text-xs font-cyber font-bold bg-neon-yellow/20 px-2 py-0.5 rounded">
                  {yieldMultiplier}x
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Player Info - Left */}
      <div className="absolute top-2 left-2 pointer-events-none z-10">
        <div className="bg-cyber-darker/90 backdrop-blur-sm border border-neon-purple/50 rounded-lg p-2">
          <p className="text-xs text-gray-500 font-cyber uppercase tracking-wider">Player</p>
          <NeonText color="purple" className="font-cyber text-xs">
            {displayAddress || 'Connected'}
          </NeonText>
          {playerClass !== 'default' && (
            <div className={`mt-1 px-2 py-0.5 rounded text-xs font-cyber font-bold inline-block ${
              playerClass === 'whale' ? 'bg-neon-cyan/20 text-neon-cyan' :
              playerClass === 'degen' ? 'bg-neon-pink/20 text-neon-pink' :
              'bg-neon-green/20 text-neon-green'
            }`}>
              {playerClass.toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {/* Score Display - Right */}
      <div className="absolute top-2 right-2 pointer-events-none z-10">
        <div className="bg-cyber-darker/90 backdrop-blur-sm border border-neon-pink/50 rounded-lg p-2 text-right">
          <p className="text-xs text-gray-500 font-cyber uppercase tracking-wider">Score</p>
          <NeonText color="pink" className="font-arcade text-lg">
            {score.toLocaleString()}
          </NeonText>
        </div>
      </div>
    </>
  );
}

export function ControlsHint({ playerClass }) {
  const classSettings = PLAYER_CLASSES[playerClass] || PLAYER_CLASSES.default;

  return (
    <div className="absolute -bottom-20 left-0 right-0 flex justify-center pointer-events-none z-10">
      <div className="bg-cyber-darker/90 backdrop-blur-sm border border-neon-purple/30 rounded-lg px-4 py-2">
        <div className="flex items-center gap-4 text-xs font-cyber">
          <div className="flex items-center gap-1">
            <kbd className="px-2 py-1 bg-neon-pink/20 border border-neon-pink/50 rounded text-neon-pink">A/←</kbd>
            <span className="text-gray-500">Left</span>
          </div>
          
          <div className="flex items-center gap-1">
            <kbd className="px-2 py-1 bg-neon-cyan/20 border border-neon-cyan/50 rounded text-neon-cyan">D/→</kbd>
            <span className="text-gray-500">Right</span>
          </div>
          
          <div className="flex items-center gap-1">
            <kbd className="px-2 py-1 bg-neon-purple/20 border border-neon-purple/50 rounded text-neon-purple">SPACE</kbd>
            <span className="text-gray-500">Launch</span>
          </div>
        </div>
        
        <p className="text-center text-xs text-gray-600 mt-1 font-cyber">
          {classSettings.description}
        </p>
        
        <p className="text-center text-xs text-gray-500 mt-1 font-cyber md:hidden">
          📱 Tap left/right to flip • Double-tap to launch
        </p>
      </div>
    </div>
  );
}

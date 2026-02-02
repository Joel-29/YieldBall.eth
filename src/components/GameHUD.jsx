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
      {/* Top HUD Bar */}
      <div className="absolute top-2 left-2 right-2 flex justify-between items-start pointer-events-none z-10">
        {/* Left Panel - Wallet/ENS */}
        <div className="bg-cyber-darker/90 backdrop-blur-sm border border-neon-purple/50 rounded-lg p-3">
          <p className="text-xs text-gray-500 font-cyber uppercase tracking-wider mb-1">Player</p>
          <NeonText color="purple" className="font-cyber text-sm">
            {displayAddress || 'Not Connected'}
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

        {/* Right Panel - Principal (Safe) */}
        <div className="bg-cyber-darker/90 backdrop-blur-sm border border-neon-green/50 rounded-lg p-3 text-right">
          <p className="text-xs text-gray-500 font-cyber uppercase tracking-wider mb-1">Principal</p>
          <div className="flex items-baseline justify-end gap-1">
            <NeonText color="cyan" className="font-arcade text-lg">
              {principal}
            </NeonText>
            <span className="text-gray-400 font-cyber text-xs">USDC</span>
          </div>
          <p className="text-xs text-neon-green font-cyber mt-1">🔒 Safe in Aave</p>
        </div>
      </div>

      {/* Center - Claimed Yield (The Score) */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10">
        <div className="bg-cyber-darker/80 backdrop-blur-sm border-2 border-neon-cyan/60 rounded-xl p-4 text-center shadow-[0_0_30px_rgba(0,245,255,0.3)]">
          <p className="text-xs text-gray-400 font-cyber uppercase tracking-wider mb-1">Claimed Yield</p>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-neon-cyan font-cyber text-lg">$</span>
            <NeonText color="cyan" className="font-arcade text-3xl">
              {yieldEarned.toFixed(6)}
            </NeonText>
          </div>
          {yieldMultiplier > 1 && (
            <div className="mt-2 bg-neon-yellow/20 rounded px-2 py-1 inline-block">
              <span className="text-neon-yellow text-xs font-cyber font-bold">
                {yieldMultiplier}x YIELD
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Score Display (Bottom) */}
      <div className="absolute bottom-20 left-2 pointer-events-none z-10">
        <div className="bg-cyber-darker/80 backdrop-blur-sm border border-neon-pink/40 rounded-lg p-2">
          <p className="text-xs text-gray-500 font-cyber">Score</p>
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
    <div className="absolute -bottom-16 left-0 right-0 flex justify-center pointer-events-none z-10">
      <div className="bg-cyber-darker/90 backdrop-blur-sm border border-neon-purple/30 rounded-lg px-4 py-2">
        <div className="flex items-center gap-6 text-xs font-cyber">
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
      </div>
    </div>
  );
}

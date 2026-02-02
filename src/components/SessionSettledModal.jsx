import React from 'react';
import { NeonButton, NeonText } from './ui/NeonElements.jsx';

export function SessionSettledModal({ 
  isOpen, 
  principal, 
  yieldEarned, 
  score, 
  bumperHits,
  onWithdraw 
}) {
  if (!isOpen) return null;

  const totalAmount = principal + yieldEarned;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      
      {/* Modal */}
      <div className="relative bg-cyber-dark border-2 border-neon-purple rounded-2xl p-8 max-w-md w-full mx-4 shadow-neon-purple animate-pulse-neon">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="font-arcade text-2xl mb-2">
            <NeonText color="cyan">SESSION</NeonText>
          </h2>
          <h2 className="font-arcade text-2xl">
            <NeonText color="pink">SETTLED</NeonText>
          </h2>
        </div>

        {/* Decorative line */}
        <div className="h-0.5 bg-gradient-to-r from-transparent via-neon-purple to-transparent mb-8" />

        {/* Stats */}
        <div className="space-y-4 mb-8">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 font-cyber">Principal:</span>
            <span className="font-cyber text-white text-xl">${principal.toFixed(2)} USDC</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-400 font-cyber">Yield Earned:</span>
            <NeonText color="cyan" className="font-cyber text-xl">
              +${yieldEarned.toFixed(4)}
            </NeonText>
          </div>

          <div className="h-px bg-neon-purple/30" />

          <div className="flex justify-between items-center">
            <span className="text-gray-400 font-cyber">Total:</span>
            <NeonText color="pink" className="font-cyber text-2xl font-bold">
              ${totalAmount.toFixed(4)}
            </NeonText>
          </div>
        </div>

        {/* Game Stats */}
        <div className="bg-cyber-darker rounded-lg p-4 mb-8">
          <h3 className="font-arcade text-xs text-neon-purple mb-4">GAME STATS</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-500 text-sm font-cyber">Score</p>
              <p className="text-white font-cyber text-lg">{score.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm font-cyber">Bumper Hits</p>
              <p className="text-white font-cyber text-lg">{bumperHits}</p>
            </div>
          </div>
        </div>

        {/* State Channel Message */}
        <div className="bg-neon-yellow/10 border border-neon-yellow/30 rounded-lg p-3 mb-6">
          <p className="text-neon-yellow text-xs font-cyber text-center">
            ⚡ State channel closed via Yellow Network
          </p>
        </div>

        {/* Withdraw Button */}
        <NeonButton 
          onClick={onWithdraw}
          variant="green"
          size="lg"
          className="w-full"
        >
          💰 Withdraw All
        </NeonButton>
      </div>
    </div>
  );
}

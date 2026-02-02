import React from 'react';
import { NeonButton, NeonText } from './ui/NeonElements.jsx';

export function SessionSettledModal({ 
  isOpen, 
  principal, 
  yieldEarned, 
  score, 
  bumperHits,
  flashLoanHits = 0,
  onWithdraw 
}) {
  if (!isOpen) return null;

  const totalAmount = principal + yieldEarned;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
      
      {/* Glassmorphism Modal */}
      <div className="relative w-full max-w-md">
        {/* Glow effect behind modal */}
        <div className="absolute -inset-1 bg-gradient-to-r from-neon-pink via-neon-purple to-neon-cyan rounded-3xl blur-xl opacity-50 animate-pulse" />
        
        {/* Modal content with glassmorphism */}
        <div className="relative bg-cyber-dark/90 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          {/* Inner glow border */}
          <div className="absolute inset-0 rounded-2xl border-2 border-neon-purple/30 pointer-events-none" />
          
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-block px-4 py-2 bg-neon-green/20 border border-neon-green/40 rounded-full mb-4">
              <span className="text-neon-green text-sm font-cyber">✓ No-Loss Complete</span>
            </div>
            <h2 className="font-arcade text-xl mb-1">
              <NeonText color="cyan">SESSION</NeonText>
            </h2>
            <h2 className="font-arcade text-xl">
              <NeonText color="pink">SETTLED</NeonText>
            </h2>
          </div>

          {/* Principal Returned - Highlighted */}
          <div className="bg-neon-green/10 border border-neon-green/30 rounded-xl p-4 mb-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-400 font-cyber text-sm">Principal Returned</p>
                <p className="text-xs text-neon-green font-cyber">🔒 From Aave V3</p>
              </div>
              <span className="font-cyber text-white text-2xl">${principal.toFixed(2)}</span>
            </div>
          </div>

          {/* Yield Earned - Highlighted */}
          <div className="bg-neon-cyan/10 border border-neon-cyan/30 rounded-xl p-4 mb-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-400 font-cyber text-sm">Yield Earned</p>
                <p className="text-xs text-neon-cyan font-cyber">⚡ From gameplay</p>
              </div>
              <NeonText color="cyan" className="font-cyber text-2xl">
                +${yieldEarned.toFixed(6)}
              </NeonText>
            </div>
          </div>

          {/* Total */}
          <div className="bg-gradient-to-r from-neon-pink/20 to-neon-purple/20 border border-neon-pink/30 rounded-xl p-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-white font-cyber text-lg">Total Withdraw:</span>
              <NeonText color="pink" className="font-arcade text-2xl">
                ${totalAmount.toFixed(6)}
              </NeonText>
            </div>
          </div>

          {/* Game Stats */}
          <div className="bg-white/5 backdrop-blur rounded-lg p-4 mb-6">
            <h3 className="font-arcade text-xs text-gray-400 mb-3">GAME STATS</h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-gray-500 text-xs font-cyber">Score</p>
                <p className="text-white font-cyber text-sm">{score.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs font-cyber">Bumpers</p>
                <p className="text-white font-cyber text-sm">{bumperHits}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs font-cyber">Flash Loans</p>
                <p className="text-white font-cyber text-sm">{flashLoanHits}</p>
              </div>
            </div>
          </div>

          {/* State Channel Message */}
          <div className="bg-neon-yellow/10 border border-neon-yellow/30 rounded-lg p-3 mb-6">
            <p className="text-neon-yellow text-xs font-cyber text-center">
              ⚡ State channel settled via Yellow Network
            </p>
          </div>

          {/* Settle & Withdraw Button */}
          <NeonButton 
            onClick={onWithdraw}
            variant="green"
            size="lg"
            className="w-full"
          >
            💰 Settle & Withdraw
          </NeonButton>
        </div>
      </div>
    </div>
  );
}

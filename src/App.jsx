import React, { useRef } from 'react';
import { useAccount } from 'wagmi';
import { Header } from './components/Header.jsx';
import { VaultPanel } from './components/VaultPanel.jsx';
import { PinballGame } from './components/PinballGame.jsx';
import { SessionSettledModal } from './components/SessionSettledModal.jsx';
import { NeonText } from './components/ui/NeonElements.jsx';
import { useGameState } from './hooks/useGameState.js';

function App() {
  const { isConnected } = useAccount();
  const engineRef = useRef(null);
  
  const {
    gameState,
    deposit,
    updateScore,
    recordBumperHit,
    recordFlashLoanHit,
    recordStateUpdate,
    endGame,
    withdraw,
  } = useGameState();

  const handleDeposit = (playerClass) => {
    deposit(playerClass);
  };

  const handleBumperHit = (bumperIndex, points, multiplier) => {
    recordBumperHit(bumperIndex, points, multiplier);
  };

  const handleFlashLoanRamp = (bonus) => {
    recordFlashLoanHit(bonus);
  };

  const handleStateUpdate = (stateData) => {
    recordStateUpdate(stateData);
  };

  const handleDrain = (finalScore) => {
    endGame(finalScore);
  };

  const handleWithdraw = () => {
    withdraw();
    if (engineRef.current) {
      engineRef.current.reset();
    }
  };

  return (
    <div className="min-h-screen bg-cyber-dark cyber-grid">
      <Header />
      
      {/* Main Content */}
      <main className="pt-24 pb-12 px-4">
        {!gameState.isDeposited ? (
          // Landing / Deposit Screen
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="font-arcade text-4xl md:text-6xl mb-4">
                <NeonText color="pink">YIELD</NeonText>
                <NeonText color="cyan">BALL</NeonText>
              </h1>
              <p className="text-gray-400 font-cyber text-lg max-w-2xl mx-auto">
                The first "No-Loss" Web3 pinball game. Deposit to Aave V3, 
                earn yield while you play, and withdraw your principal + earnings.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <div className="bg-cyber-darker/50 border border-neon-pink/30 rounded-xl p-6">
                <div className="text-4xl mb-4">💰</div>
                <h3 className="font-arcade text-sm text-neon-pink mb-2">NO-LOSS ARCADE</h3>
                <p className="text-gray-400 text-sm font-cyber">
                  Your deposit earns yield in Aave V3. Bumper hits claim your share!
                </p>
              </div>
              
              <div className="bg-cyber-darker/50 border border-neon-cyan/30 rounded-xl p-6">
                <div className="text-4xl mb-4">⚡</div>
                <h3 className="font-arcade text-sm text-neon-cyan mb-2">STATE CHANNELS</h3>
                <p className="text-gray-400 text-sm font-cyber">
                  Every interaction is a signed state update via Yellow Network.
                </p>
              </div>
              
              <div className="bg-cyber-darker/50 border border-neon-purple/30 rounded-xl p-6">
                <div className="text-4xl mb-4">🎮</div>
                <h3 className="font-arcade text-sm text-neon-purple mb-2">ENS IDENTITY</h3>
                <p className="text-gray-400 text-sm font-cyber">
                  Set yieldball.class in your ENS to unlock special game modes!
                </p>
              </div>
            </div>

            {/* Vault Panel */}
            <div className="flex justify-center">
              <VaultPanel 
                onDeposit={handleDeposit}
                isDeposited={gameState.isDeposited}
                isConnected={isConnected}
              />
            </div>

            {/* ENS Class Guide */}
            <div className="mt-12 max-w-3xl mx-auto">
              <h3 className="font-arcade text-sm text-center text-gray-500 mb-6">
                ENS CLASS GUIDE
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-cyber-darker/30 border border-gray-700 rounded-lg p-4 text-center">
                  <p className="text-gray-500 text-xs font-cyber mb-2">Default</p>
                  <p className="text-white font-cyber text-sm">100px Flippers</p>
                  <p className="text-gray-400 text-xs font-cyber">1.0x yield</p>
                </div>
                <div className="bg-neon-cyan/10 border border-neon-cyan/30 rounded-lg p-4 text-center">
                  <p className="text-neon-cyan text-xs font-cyber mb-2">🐋 Whale</p>
                  <p className="text-white font-cyber text-sm">160px Flippers</p>
                  <p className="text-gray-400 text-xs font-cyber">Heavy ball • 0.5x yield</p>
                </div>
                <div className="bg-neon-pink/10 border border-neon-pink/30 rounded-lg p-4 text-center">
                  <p className="text-neon-pink text-xs font-cyber mb-2">🔥 Degen</p>
                  <p className="text-white font-cyber text-sm">50px Flippers</p>
                  <p className="text-gray-400 text-xs font-cyber">Light ball • 2.0x yield</p>
                </div>
                <div className="bg-neon-green/10 border border-neon-green/30 rounded-lg p-4 text-center">
                  <p className="text-neon-green text-xs font-cyber mb-2">🎯 Sniper</p>
                  <p className="text-white font-cyber text-sm">No cooldown</p>
                  <p className="text-gray-400 text-xs font-cyber">Fast ball • 1.2x yield</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Game Screen
          <div className="flex flex-col items-center">
            <div className="mb-4 text-center">
              <h2 className="font-arcade text-xl">
                <NeonText color="pink">GAME</NeonText>
                {' '}
                <NeonText color="cyan">ON</NeonText>
              </h2>
              <p className="text-gray-500 font-cyber text-xs mt-1">
                SPACE to launch • A/D or ←/→ to flip
              </p>
            </div>

            <PinballGame
              playerClass={gameState.playerClass}
              onBumperHit={handleBumperHit}
              onFlashLoanRamp={handleFlashLoanRamp}
              onDrain={handleDrain}
              onScoreUpdate={updateScore}
              onStateUpdate={handleStateUpdate}
              score={gameState.score}
              yieldEarned={gameState.yieldEarned}
              principal={gameState.principal}
              yieldMultiplier={gameState.yieldMultiplier}
              isPlaying={gameState.isPlaying || gameState.isGameOver}
              engineRef={engineRef}
            />
          </div>
        )}
      </main>

      {/* Session Settled Modal */}
      <SessionSettledModal
        isOpen={gameState.isGameOver}
        principal={gameState.principal}
        yieldEarned={gameState.yieldEarned}
        score={gameState.score}
        bumperHits={gameState.bumperHits}
        flashLoanHits={gameState.flashLoanHits}
        onWithdraw={handleWithdraw}
      />

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-600 font-cyber text-sm">
            YieldBall.eth © 2026 • Built with 💜 for the Web3 Gaming Hackathon
          </p>
          <div className="flex justify-center gap-6 mt-4">
            <a href="#" className="text-gray-500 hover:text-neon-pink transition-colors text-sm font-cyber">
              GitHub
            </a>
            <a href="#" className="text-gray-500 hover:text-neon-cyan transition-colors text-sm font-cyber">
              Twitter
            </a>
            <a href="#" className="text-gray-500 hover:text-neon-purple transition-colors text-sm font-cyber">
              Discord
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;

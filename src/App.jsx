import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Info, Coins, Zap, Fingerprint, ChevronDown, ChevronUp } from 'lucide-react';
import { PachinkoGame } from './components/PachinkoGame.jsx';
import { SettlementModal } from './components/SettlementModal.jsx';
import { useYieldBallClass, formatAddress, getMockClass } from './hooks/useEnsIdentity.js';
import { BALL_CONFIGS } from './engine/PachinkoEngine.js';

function App() {
  const { isConnected, address } = useAccount();
  const { ensName, ensAvatar, yieldballClass, ballConfig, isLoading } = useYieldBallClass();
  
  // Game state
  const [isPlaying, setIsPlaying] = useState(false);
  const [settlement, setSettlement] = useState(null);
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  // Use mock class for demo if not connected or no ENS class
  const effectiveClass = yieldballClass !== 'default' ? yieldballClass : getMockClass(address);
  const effectiveBallConfig = BALL_CONFIGS[effectiveClass] || BALL_CONFIGS.default;

  const handleStartGame = () => {
    setIsPlaying(true);
    setSettlement(null);
  };

  const handleSettlement = (settlementData) => {
    setSettlement(settlementData);
  };

  const handleWithdraw = () => {
    console.log('%c💸 Withdrawing from Aave V3 Vault...', 'color: #22c55e; font-weight: bold;');
    setSettlement(null);
    setIsPlaying(false);
  };

  const handlePlayAgain = () => {
    setSettlement(null);
  };

  return (
    <div className="min-h-screen bg-cyber-dark cyber-grid">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-gray-800/50 bg-cyber-dark/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-pink to-neon-purple flex items-center justify-center shadow-lg shadow-neon-purple/30">
              <span className="text-xl">🎰</span>
            </div>
            <div>
              <h1 className="font-arcade text-lg">
                <span className="text-neon-pink">YIELD</span>
                <span className="text-neon-cyan">BALL</span>
                <span className="text-gray-500">.eth</span>
              </h1>
              <p className="text-gray-500 text-xs font-cyber">Web3 Pachinko</p>
            </div>
          </div>
          <ConnectButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-12 px-4">
        {!isPlaying ? (
          // Landing Screen
          <div className="max-w-4xl mx-auto">
            {/* Hero */}
            <div className="text-center mb-12">
              <h1 className="font-arcade text-4xl md:text-6xl mb-4">
                <span className="text-neon-pink">YIELD</span>
                <span className="text-neon-cyan">BALL</span>
              </h1>
              <p className="text-gray-400 font-cyber text-lg max-w-2xl mx-auto">
                The first "No-Loss" Web3 Pachinko game. Your 100 USDC earns yield on Aave 
                while you play. ENS identity determines your ball physics!
              </p>
            </div>

            {/* How It Works Section */}
            <div className="mb-8">
              <button
                onClick={() => setShowHowItWorks(!showHowItWorks)}
                className="w-full bg-cyber-darker/50 border border-neon-purple/30 rounded-xl p-4 flex items-center justify-between hover:border-neon-purple/50 transition-all"
              >
                <div className="flex items-center gap-3">
                  <Info className="w-5 h-5 text-neon-purple" />
                  <span className="font-cyber text-white">How it Works</span>
                </div>
                {showHowItWorks ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {showHowItWorks && (
                <div className="mt-4 grid md:grid-cols-3 gap-4">
                  <div className="bg-cyber-darker/50 border border-neon-cyan/30 rounded-xl p-6">
                    <Coins className="w-8 h-8 text-neon-cyan mb-3" />
                    <h3 className="font-arcade text-sm text-neon-cyan mb-2">AAVE VAULT</h3>
                    <p className="text-gray-400 text-sm font-cyber">
                      Your 100 USDC is earning interest on Aave V3 while you play.
                    </p>
                  </div>
                  
                  <div className="bg-cyber-darker/50 border border-neon-pink/30 rounded-xl p-6">
                    <Fingerprint className="w-8 h-8 text-neon-pink mb-3" />
                    <h3 className="font-arcade text-sm text-neon-pink mb-2">ENS IDENTITY</h3>
                    <p className="text-gray-400 text-sm font-cyber">
                      Your ENS record sets your ball physics. Set yieldball.class to customize!
                    </p>
                  </div>
                  
                  <div className="bg-cyber-darker/50 border border-neon-yellow/30 rounded-xl p-6">
                    <Zap className="w-8 h-8 text-neon-yellow mb-3" />
                    <h3 className="font-arcade text-sm text-neon-yellow mb-2">YELLOW NETWORK</h3>
                    <p className="text-gray-400 text-sm font-cyber">
                      Every bounce is a signed state update via Yellow Network.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* ENS Class Preview */}
            <div className="bg-cyber-darker/50 border border-neon-purple/30 rounded-xl p-6 mb-8">
              <h3 className="font-arcade text-sm text-gray-400 mb-4">YOUR BALL</h3>
              
              <div className="flex items-center gap-6">
                {/* Ball Preview */}
                <div 
                  className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{ 
                    backgroundColor: effectiveBallConfig.color,
                    boxShadow: `0 0 30px ${effectiveBallConfig.color}80`,
                  }}
                >
                  <span className="text-2xl">{effectiveBallConfig.label.split(' ')[0]}</span>
                </div>

                <div className="flex-1">
                  <p className="font-arcade text-lg" style={{ color: effectiveBallConfig.color }}>
                    {effectiveBallConfig.label}
                  </p>
                  <p className="text-gray-400 font-cyber text-sm mt-1">
                    {effectiveBallConfig.description}
                  </p>
                  
                  <div className="flex gap-4 mt-3">
                    <div>
                      <span className="text-gray-500 text-xs font-cyber">Scale:</span>
                      <span className="text-white font-cyber ml-1">{effectiveBallConfig.scale}x</span>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs font-cyber">Mass:</span>
                      <span className="text-white font-cyber ml-1">{effectiveBallConfig.mass}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs font-cyber">Bounce:</span>
                      <span className="text-white font-cyber ml-1">{effectiveBallConfig.restitution}</span>
                    </div>
                    {effectiveBallConfig.yieldMultiplier > 1 && (
                      <div>
                        <span className="text-gray-500 text-xs font-cyber">Yield:</span>
                        <span className="text-neon-pink font-cyber ml-1">{effectiveBallConfig.yieldMultiplier}x</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ENS Info */}
              {ensName && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <div className="flex items-center gap-3">
                    {ensAvatar && (
                      <img src={ensAvatar} alt="ENS Avatar" className="w-8 h-8 rounded-full" />
                    )}
                    <div>
                      <p className="text-neon-purple font-cyber text-sm">{ensName}</p>
                      <p className="text-gray-500 text-xs font-cyber">
                        yieldball.class: {yieldballClass || 'not set'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ENS Class Guide */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div 
                className={`rounded-xl p-4 text-center border-2 transition-all ${
                  effectiveClass === 'whale' ? 'border-yellow-400 bg-yellow-400/10' : 'border-gray-700 bg-cyber-darker/30'
                }`}
              >
                <div 
                  className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
                  style={{ backgroundColor: '#ffd700' }}
                >
                  <span className="text-xl">🐋</span>
                </div>
                <p className="text-yellow-400 text-xs font-cyber mb-1">whale</p>
                <p className="text-white font-cyber text-sm">1.5x Scale, Heavy</p>
                <p className="text-gray-500 text-xs font-cyber">Harder to bounce</p>
              </div>
              
              <div 
                className={`rounded-xl p-4 text-center border-2 transition-all ${
                  effectiveClass === 'degen' ? 'border-neon-pink bg-neon-pink/10' : 'border-gray-700 bg-cyber-darker/30'
                }`}
              >
                <div 
                  className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
                  style={{ backgroundColor: '#ff006e' }}
                >
                  <span className="text-xl">🔥</span>
                </div>
                <p className="text-neon-pink text-xs font-cyber mb-1">degen</p>
                <p className="text-white font-cyber text-sm">0.7x Scale, Bouncy</p>
                <p className="text-neon-pink text-xs font-cyber font-bold">2x Yield!</p>
              </div>
              
              <div 
                className={`rounded-xl p-4 text-center border-2 transition-all ${
                  effectiveClass === 'default' ? 'border-gray-400 bg-gray-400/10' : 'border-gray-700 bg-cyber-darker/30'
                }`}
              >
                <div 
                  className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
                  style={{ backgroundColor: '#c0c0c0' }}
                >
                  <span className="text-xl">⚡</span>
                </div>
                <p className="text-gray-400 text-xs font-cyber mb-1">default</p>
                <p className="text-white font-cyber text-sm">1.0x Scale</p>
                <p className="text-gray-500 text-xs font-cyber">Standard ball</p>
              </div>
            </div>

            {/* Start Button */}
            <div className="flex justify-center">
              {isConnected ? (
                <button
                  onClick={handleStartGame}
                  className="group relative px-12 py-4 bg-gradient-to-r from-neon-pink to-neon-purple rounded-xl font-arcade text-white text-lg overflow-hidden hover:scale-105 transition-all duration-300 shadow-lg shadow-neon-purple/40"
                >
                  <span className="relative z-10">DEPOSIT 100 USDC & PLAY</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-neon-purple to-neon-pink opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ) : (
                <div className="text-center">
                  <p className="text-gray-400 font-cyber mb-4">Connect wallet to play</p>
                  <ConnectButton />
                </div>
              )}
            </div>
          </div>
        ) : (
          // Game Screen
          <div className="flex flex-col items-center">
            <div className="mb-4 text-center">
              <h2 className="font-arcade text-xl">
                <span className="text-neon-pink">GAME</span>
                {' '}
                <span className="text-neon-cyan">ON</span>
              </h2>
              <p className="text-gray-500 font-cyber text-xs mt-1">
                Click at the top to drop your ball!
              </p>
            </div>

            <PachinkoGame
              ensClass={effectiveClass}
              ensName={ensName || formatAddress(address)}
              ensAvatar={ensAvatar}
              ballConfig={effectiveBallConfig}
              onSettlement={handleSettlement}
            />

            <button
              onClick={() => setIsPlaying(false)}
              className="mt-6 text-gray-500 font-cyber text-sm hover:text-white transition-colors"
            >
              ← Back to Vault
            </button>
          </div>
        )}
      </main>

      {/* Settlement Modal */}
      <SettlementModal
        isOpen={!!settlement}
        settlement={settlement}
        principal={100}
        onWithdraw={handleWithdraw}
        onPlayAgain={handlePlayAgain}
      />

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-600 font-cyber text-sm">
            YieldBall.eth © 2026 • Built with 💜 for the Web3 Gaming Hackathon
          </p>
          <p className="text-gray-700 font-cyber text-xs mt-2">
            Powered by Aave V3 • Yellow Network • ENS
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;

import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Info, Coins, Zap, Fingerprint, ChevronDown, ChevronUp } from 'lucide-react';
import { PachinkoGame } from './components/PachinkoGame.jsx';
import { SettlementModal } from './components/SettlementModal.jsx';
import { useYieldBallClass, formatAddress, getMockClass } from './hooks/useEnsIdentity.js';
import { BALL_CONFIGS } from './engine/PachinkoEngine.js';
import { AnimatedBackground, AnimatedSquares } from './components/ui/AnimatedBackground.jsx';
import { ShinyText, ShinyButton, GlassmorphicCard } from './components/ui/ShinyText.jsx';

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
    <AnimatedBackground>
      {/* Floating Squares Effect */}
      <AnimatedSquares count={12} />
      
      {/* Header with Glassmorphism */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-cyber-darker/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-pink to-neon-purple flex items-center justify-center shadow-lg shadow-neon-purple/30">
              <span className="text-xl">🎰</span>
            </div>
            <div>
              <h1 className="font-arcade text-lg">
                <ShinyText variant="pink" speed="slow">YIELD</ShinyText>
                <ShinyText variant="cyan" speed="slow">BALL</ShinyText>
                <span className="text-gray-500">.eth</span>
              </h1>
              <p className="text-gray-500 text-xs font-mono">Web3 Pachinko</p>
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
                <ShinyText variant="pink" speed="slow" className="text-4xl md:text-6xl">YIELD</ShinyText>
                <ShinyText variant="cyan" speed="slow" className="text-4xl md:text-6xl">BALL</ShinyText>
              </h1>
              <p className="text-gray-400 font-mono text-lg max-w-2xl mx-auto">
                The first "No-Loss" Web3 Pachinko game. Your 100 USDC earns yield on Aave 
                while you play. ENS identity determines your ball physics!
              </p>
            </div>

            {/* How It Works Section */}
            <div className="mb-8">
              <button
                onClick={() => setShowHowItWorks(!showHowItWorks)}
                className="w-full backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between hover:border-neon-purple/50 transition-all"
              >
                <div className="flex items-center gap-3">
                  <Info className="w-5 h-5 text-neon-purple" />
                  <span className="font-mono text-white">How it Works</span>
                </div>
                {showHowItWorks ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {showHowItWorks && (
                <div className="mt-4 grid md:grid-cols-3 gap-4 animate-slide-down">
                  <GlassmorphicCard className="p-6" glowColor="#00f5ff">
                    <Coins className="w-8 h-8 text-neon-cyan mb-3" />
                    <ShinyText variant="cyan" className="font-arcade text-sm block mb-2">AAVE VAULT</ShinyText>
                    <p className="text-gray-400 text-sm font-mono">
                      Your 100 USDC is earning interest on Aave V3 while you play.
                    </p>
                  </GlassmorphicCard>
                  
                  <GlassmorphicCard className="p-6" glowColor="#ff006e">
                    <Fingerprint className="w-8 h-8 text-neon-pink mb-3" />
                    <ShinyText variant="pink" className="font-arcade text-sm block mb-2">ENS IDENTITY</ShinyText>
                    <p className="text-gray-400 text-sm font-mono">
                      Your ENS record sets your ball physics. Set yieldball.class to customize!
                    </p>
                  </GlassmorphicCard>
                  
                  <GlassmorphicCard className="p-6" glowColor="#fbbf24">
                    <Zap className="w-8 h-8 text-neon-yellow mb-3" />
                    <ShinyText variant="gold" className="font-arcade text-sm block mb-2">YELLOW NETWORK</ShinyText>
                    <p className="text-gray-400 text-sm font-mono">
                      Every bounce is a signed state update via Yellow Network.
                    </p>
                  </GlassmorphicCard>
                </div>
              )}
            </div>

            {/* ENS Class Preview */}
            <GlassmorphicCard className="p-6 mb-8" glowColor="#8b5cf6">
              <h3 className="font-arcade text-sm text-gray-400 mb-4">YOUR BALL</h3>
              
              <div className="flex items-center gap-6">
                {/* Ball Preview */}
                <div 
                  className="w-20 h-20 rounded-full flex items-center justify-center animate-pulse"
                  style={{ 
                    backgroundColor: effectiveBallConfig.color,
                    boxShadow: `0 0 30px ${effectiveBallConfig.color}80`,
                  }}
                >
                  <span className="text-2xl">{effectiveBallConfig.label.split(' ')[0]}</span>
                </div>

                <div className="flex-1">
                  <ShinyText 
                    variant={effectiveClass === 'whale' ? 'gold' : effectiveClass === 'degen' ? 'pink' : 'silver'}
                    speed="fast"
                    className="font-arcade text-lg block"
                  >
                    {effectiveBallConfig.label}
                  </ShinyText>
                  <p className="text-gray-400 font-mono text-sm mt-1">
                    {effectiveBallConfig.description}
                  </p>
                  
                  <div className="flex gap-4 mt-3">
                    <div>
                      <span className="text-gray-500 text-xs font-mono">Scale:</span>
                      <span className="text-white font-mono ml-1">{effectiveBallConfig.scale}x</span>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs font-mono">Mass:</span>
                      <span className="text-white font-mono ml-1">{effectiveBallConfig.mass}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs font-mono">Bounce:</span>
                      <span className="text-white font-mono ml-1">{effectiveBallConfig.restitution}</span>
                    </div>
                    {effectiveBallConfig.yieldMultiplier > 1 && (
                      <div>
                        <span className="text-gray-500 text-xs font-mono">Yield:</span>
                        <ShinyText variant="pink" className="font-mono ml-1">{effectiveBallConfig.yieldMultiplier}x</ShinyText>
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
                      <p className="text-neon-purple font-mono text-sm">{ensName}</p>
                      <p className="text-gray-500 text-xs font-mono">
                        yieldball.class: {yieldballClass || 'not set'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </GlassmorphicCard>

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
                <ShinyButton
                  onClick={handleStartGame}
                  variant="purple"
                  className="text-lg"
                >
                  DEPOSIT 100 USDC & PLAY
                </ShinyButton>
              ) : (
                <div className="text-center">
                  <p className="text-gray-400 font-mono mb-4">Connect wallet to play</p>
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
                <ShinyText variant="pink" speed="fast">GAME</ShinyText>
                {' '}
                <ShinyText variant="cyan" speed="fast">ON</ShinyText>
              </h2>
              <p className="text-gray-500 font-mono text-xs mt-1">
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
              className="mt-6 text-gray-500 font-mono text-sm hover:text-white transition-colors"
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
      <footer className="border-t border-white/10 py-8 px-4 backdrop-blur-sm bg-cyber-darker/50">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-600 font-mono text-sm">
            YieldBall.eth © 2026 • Built with 💜 for the Web3 Gaming Hackathon
          </p>
          <p className="text-gray-700 font-mono text-xs mt-2">
            Powered by Aave V3 • Yellow Network • ENS
          </p>
        </div>
      </footer>
    </AnimatedBackground>
  );
}

export default App;

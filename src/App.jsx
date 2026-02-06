import React, { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain, useWalletClient, usePublicClient } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Info, Coins, Zap, Fingerprint, ChevronDown, ChevronUp } from 'lucide-react';
import { PachinkoGame } from './components/PachinkoGame.jsx';
import { SettlementModal } from './components/SettlementModal.jsx';
import { ContractTester } from './components/ContractTester.jsx';
import { useYieldBallClass, formatAddress, getMockClass } from './hooks/useEnsIdentity.js';
import { BALL_CONFIGS } from './engine/PachinkoEngine.js';
import { VAULT_ADDRESS, VAULT_ABI, TARGET_CHAIN_ID } from './config/wagmi.js';
import { Galaxy } from './components/ui/Galaxy.jsx';
import { ShinyText, ShinyButton, GlassmorphicCard } from './components/ui/ShinyText.jsx';
import { initializeYellowNetwork, createGameSession } from './utils/yellowNetwork.js';

function App() {
  const { isConnected, address, chainId } = useAccount();
  const { ensName, ensAvatar, yieldballClass, ballConfig, isLoading } = useYieldBallClass();
  const { switchChain } = useSwitchChain();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  
  // Game state
  const [isPlaying, setIsPlaying] = useState(false);
  const [settlement, setSettlement] = useState(null);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [isDepositLoading, setIsDepositLoading] = useState(false);
  const [yellowInitialized, setYellowInitialized] = useState(false);

  // Deposit transaction hooks
  const { 
    writeContract, 
    data: depositTxHash, 
    isPending: isDepositPending,
    error: depositError,
  } = useWriteContract();

  // Wait for deposit transaction confirmation
  const { 
    isLoading: isDepositConfirming, 
    isSuccess: isDepositSuccess,
  } = useWaitForTransactionReceipt({
    hash: depositTxHash,
  });

  // Check if we're on the test route
  const isTestRoute = window.location.pathname === '/test' || window.location.search.includes('test=true');

  // Use mock class for demo if not connected or no ENS class
  const effectiveClass = yieldballClass !== 'default' ? yieldballClass : getMockClass(address);
  const effectiveBallConfig = BALL_CONFIGS[effectiveClass] || BALL_CONFIGS.default;

  // Transaction Gate: Only start game after deposit is confirmed
  useEffect(() => {
    if (isDepositSuccess) {
      console.log('%c✅ Deposit confirmed on Base Sepolia! Unlocking game...', 'color: #22c55e; font-weight: bold;');
      setIsPlaying(true);
      setIsDepositLoading(false);
    }
  }, [isDepositSuccess]);

  // Initialize Yellow Network when wallet connects
  useEffect(() => {
    if (isConnected && address && walletClient && publicClient && !yellowInitialized) {
      console.log('%c🟡 Initializing Yellow Network SDK...', 'color: #fbbf24; font-weight: bold;');
      initializeYellowNetwork(walletClient, publicClient, chainId)
        .then(() => {
          setYellowInitialized(true);
          console.log('%c✅ Yellow Network ready for state channels', 'color: #22c55e; font-weight: bold;');
        })
        .catch(err => {
          console.error('⚠️ Yellow Network init failed, running in simulation mode:', err);
          setYellowInitialized(true); // Still allow gameplay
        });
    }
  }, [isConnected, address, walletClient, publicClient, chainId, yellowInitialized]);

  const handleStartGame = async () => {
    // DO NOT start game immediately - trigger deposit transaction first
    setIsDepositLoading(true);
    setSettlement(null);
    
    try {
      // Check if on correct chain
      if (chainId !== TARGET_CHAIN_ID) {
        console.log('🔄 Switching to Base Sepolia...');
        try {
          await switchChain({ chainId: TARGET_CHAIN_ID });
        } catch (err) {
          console.error('Failed to switch chain:', err);
          setIsDepositLoading(false);
          return;
        }
      }

      // Create Yellow Network state channel before deposit
      console.log('%c🟡 Creating Yellow Network state channel...', 'color: #fbbf24; font-weight: bold;');
      await createGameSession(address, 100); // 100 USDC deposit

      console.log('%c💰 Calling Vault deposit(100 USDC)...', 'color: #fbbf24; font-weight: bold;');
      
      // Call vault deposit function with 100 USDC (100000000 = 100 * 10^6)
      writeContract({
        address: VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName: 'deposit',
        args: [BigInt(100000000)],
        chainId: TARGET_CHAIN_ID,
        gas: 150000n,
      });
    } catch (error) {
      console.error('Deposit failed:', error);
      setIsDepositLoading(false);
    }
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

  // Render Contract Tester if on test route
  if (isTestRoute) {
    return <ContractTester />;
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#020617]">
      {/* Galaxy Background - Fixed at z-0, optimized for performance */}
      <Galaxy speed={0.2} density={0.8} />
      
      {/* Main Content Container - z-index 10 */}
      <div className="relative z-10">
        {/* Header with Glassmorphism */}
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/30 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-pink to-neon-purple flex items-center justify-center shadow-lg shadow-neon-purple/50 overflow-hidden">
              <img src="/pinball.png" alt="YieldBall" className="w-8 h-8 object-contain" />
            </div>
            <div>
              <h1 className="font-arcade text-lg">
                <ShinyText variant="silver" speed="slow">YIELD</ShinyText>
                <ShinyText variant="silver" speed="slow">BALL</ShinyText>
                <ShinyText variant="purple" speed="slow" className="text-sm">.eth</ShinyText>
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
            {/* Hero with Star-Shine Effect */}
            <div className="text-center mb-12">
              <h1 className="font-arcade text-4xl md:text-6xl mb-4">
                <ShinyText variant="silver" speed="slow" className="text-4xl md:text-6xl">YIELD</ShinyText>
                <ShinyText variant="silver" speed="slow" className="text-4xl md:text-6xl">BALL</ShinyText>
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
                {/* Shiny Thunder Symbol in Circle - Left side */}
                <div 
                  className="w-20 h-20 rounded-full flex items-center justify-center relative flex-shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 100%)',
                    boxShadow: '0 0 40px rgba(251, 191, 36, 0.4), 0 0 80px rgba(251, 191, 36, 0.2), inset 0 0 20px rgba(251, 191, 36, 0.1)',
                    border: '2px solid rgba(251, 191, 36, 0.5)',
                  }}
                >
                  {/* Outer glow ring */}
                  <div className="absolute inset-0 rounded-full animate-pulse" style={{ boxShadow: '0 0 30px rgba(251, 191, 36, 0.6)' }} />
                  {/* Thunder bolt - thick and shiny */}
                  <svg 
                    viewBox="0 0 24 24" 
                    className="w-12 h-12"
                    style={{
                      filter: 'drop-shadow(0 0 8px #fbbf24) drop-shadow(0 0 16px #fbbf24)',
                    }}
                  >
                    <path 
                      d="M13 2L4 14h7l-2 8 11-12h-7l2-8z" 
                      fill="url(#thunderGradient)"
                      stroke="#fcd34d"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                    <defs>
                      <linearGradient id="thunderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#fef3c7" />
                        <stop offset="50%" stopColor="#fbbf24" />
                        <stop offset="100%" stopColor="#f59e0b" />
                      </linearGradient>
                    </defs>
                  </svg>
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

            {/* Start Button with Transaction Gate */}
            <div className="flex flex-col items-center gap-3">
              {/* Loading Message */}
              {(isDepositPending || isDepositConfirming) && (
                <ShinyText variant="cyan" speed="fast" className="text-sm">
                  {isDepositPending ? 'Confirm transaction in wallet...' : 'Staking on Base Sepolia...'}
                </ShinyText>
              )}
              
              {/* Error Message */}
              {depositError && (
                <p className="text-red-400 text-sm font-mono">Transaction failed. Please try again.</p>
              )}
              
              {isConnected ? (
                <ShinyButton
                  onClick={handleStartGame}
                  variant="purple"
                  className="text-lg"
                  disabled={isDepositLoading || isDepositPending || isDepositConfirming}
                >
                  {(isDepositPending || isDepositConfirming) ? 'STAKING ON BASE SEPOLIA...' : 'DEPOSIT 100 USDC & PLAY'}
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
              className="mt-6 text-gray-500 font-mono text-sm hover:text-white transition-colors backdrop-blur-sm"
            >
              ← Back to Vault
            </button>
          </div>
        )}
      </main>

      {/* Settlement Modal with Deep Blur */}
      <SettlementModal
        isOpen={!!settlement}
        settlement={settlement}
        principal={100}
        onWithdraw={handleWithdraw}
        onPlayAgain={handlePlayAgain}
      />

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-4 backdrop-blur-xl bg-black/30">
        <div className="max-w-6xl mx-auto text-center">
          <ShinyText variant="silver" className="font-mono text-sm">
            YieldBall.eth © 2026 
          </ShinyText>
          <br />
           <ShinyText variant="silver" className="font-mono text-sm">
            Stop watching your yield. Start playing with it.
          </ShinyText>
        </div>
      </footer>
      </div>
    </div>
  );
}

export default App;

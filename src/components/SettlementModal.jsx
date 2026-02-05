import React, { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain, useReadContract } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { CheckCircle, Coins, TrendingUp, Zap, ArrowRight, Wallet, Loader2, ExternalLink, AlertCircle, Gift } from 'lucide-react';
import { ShinyText, ShinyButton, GlassmorphicCard } from './ui/ShinyText.jsx';
import PixelSnow from './ui/PixelSnow.jsx';
import { ElectricBorder } from './ui/ElectricBorder.jsx';
import { 
  VAULT_ADDRESS, 
  VAULT_ABI, 
  TARGET_CHAIN_ID,
  YBT_TOKEN_ADDRESS,
  YBT_ABI,
  REWARD_AMOUNT_DISPLAY,
  REWARD_AMOUNT_WEI,
} from '../config/wagmi.js';

export function SettlementModal({ 
  isOpen, 
  settlement,
  principal = 100,
  onWithdraw,
  onPlayAgain,
}) {
  const { address, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const [isFinalized, setIsFinalized] = useState(false);
  const [rewardClaimed, setRewardClaimed] = useState(false);

  // writeContract hook for vault withdrawal
  const { 
    writeContract, 
    data: txHash, 
    isPending: isWritePending,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();

  // Separate hook for claiming reward tokens
  const {
    writeContract: writeReward,
    data: rewardTxHash,
    isPending: isRewardPending,
    error: rewardError,
    reset: resetReward,
  } = useWriteContract();

  // Wait for transaction confirmation
  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed,
    error: confirmError,
  } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Wait for reward transaction confirmation
  const {
    isLoading: isRewardConfirming,
    isSuccess: isRewardConfirmed,
    error: rewardConfirmError,
  } = useWaitForTransactionReceipt({
    hash: rewardTxHash,
  });

  // Read player's YBT balance
  const { data: ybtBalance, refetch: refetchBalance } = useReadContract({
    address: YBT_TOKEN_ADDRESS,
    abi: YBT_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    enabled: !!YBT_TOKEN_ADDRESS && !!address,
  });

  // Check if token contract is configured (we now call token directly, not game contract)
  const isTokenConfigured = YBT_TOKEN_ADDRESS && YBT_TOKEN_ADDRESS !== null;

  // Handle successful reward claim
  useEffect(() => {
    if (isRewardConfirmed && !rewardClaimed) {
      setRewardClaimed(true);
      refetchBalance?.();
      console.log('%c✅ YBT Tokens Minted Successfully!', 'color: #22c55e; font-weight: bold; font-size: 14px;');
    }
  }, [isRewardConfirmed, rewardClaimed, refetchBalance]);

  if (!isOpen || !settlement) return null;

  const { bucket, pegHits, baseYield, finalYield, multiplier, sessionDuration } = settlement;
  const totalPayout = principal + finalYield;

  // Convert to USDC units (6 decimals)
  const principalUnits = parseUnits(principal.toString(), 6);
  const yieldUnits = parseUnits(finalYield.toFixed(6), 6);

  const handleFinalizeOnChain = async () => {
    // Check if on correct chain
    if (chainId !== TARGET_CHAIN_ID) {
      try {
        await switchChain({ chainId: TARGET_CHAIN_ID });
      } catch (err) {
        console.error('Failed to switch chain:', err);
        return;
      }
    }

    // Call vault withdraw function
    writeContract({
      address: VAULT_ADDRESS,
      abi: VAULT_ABI,
      functionName: 'withdraw',
      args: [principalUnits, yieldUnits],
      chainId: TARGET_CHAIN_ID,
    });
  };

  // Claim YBT reward tokens - DIRECT MINT to user's wallet
  const handleClaimReward = async () => {
    if (!isTokenConfigured) {
      console.error('❌ YBT Token not configured. Set YBT_TOKEN_ADDRESS in wagmi.js');
      return;
    }
    
    if (!address) {
      console.error('❌ No wallet connected');
      return;
    }

    // Check if on correct chain (Base Sepolia)
    if (chainId !== TARGET_CHAIN_ID) {
      console.log('🔄 Switching to Base Sepolia...');
      try {
        await switchChain({ chainId: TARGET_CHAIN_ID });
      } catch (err) {
        console.error('❌ Failed to switch chain:', err);
        return;
      }
    }

    console.log('%c🎮 Claiming YBT Reward...', 'color: #fbbf24; font-weight: bold;');
    console.log('Token Address:', YBT_TOKEN_ADDRESS);
    console.log('Recipient:', address);
    console.log('Amount:', REWARD_AMOUNT_DISPLAY, 'YBT');

    // DIRECT MINT: Call token contract's mint() function directly
    // This sends 10 YBT (10 * 10^18 wei) to the connected wallet
    try {
      writeReward({
        address: YBT_TOKEN_ADDRESS,
        abi: YBT_ABI,
        functionName: 'mint',
        args: [address, BigInt(REWARD_AMOUNT_WEI)],
        chainId: TARGET_CHAIN_ID,
      });
    } catch (err) {
      console.error('❌ Mint transaction failed:', err);
      console.error('Error details:', err.message);
    }
  };

  // Handle successful transaction
  if (isConfirmed && !isFinalized) {
    setIsFinalized(true);
    setTimeout(() => {
      onWithdraw();
    }, 3000);
  }

  const isLoading = isWritePending || isConfirming;
  const isRewardLoading = isRewardPending || isRewardConfirming;
  const error = writeError || confirmError;
  const rewardTxError = rewardError || rewardConfirmError;

  // Format YBT balance for display
  const formattedYbtBalance = ybtBalance ? formatUnits(ybtBalance, 18) : '0';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Transparent backdrop - Galaxy Background visible (z-index: 0) */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-xl" style={{ zIndex: 0 }} />
      
      {/* Pixel Snow Effect - Celebratory particles */}
      <PixelSnow 
        color="#7df9ff"
        flakeSize={2}
        pixelSize={3}
        speed={2}
        density={80}
        direction={180}
        brightness={0.7}
      />
      
      {/* Modal Container with Electric Border (z-index: 10) */}
      <div className="relative w-full max-w-md animate-slide-up" style={{ zIndex: 10 }}>
        {/* ELECTRIC BORDER - ReactBits Style Canvas Animation */}
        <ElectricBorder
          color="#7df9ff"
          speed={1}
          chaos={0.12}
          borderRadius={24}
          borderWidth={3}
        >
          {/* Content Card - Glassmorphic/Transparent (z-index: 20) */}
          <div 
            className="bg-black/40 backdrop-blur-xl border border-white/10 p-8 rounded-[24px]"
            style={{ zIndex: 20 }}
          >
            
            {/* ========== HEADER - Shiny "Session Settled!" ========== */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-neon-green/20 border border-neon-green/40 rounded-full mb-4">
                <CheckCircle className="w-5 h-5 text-neon-green" />
                <span className="text-neon-green text-sm font-cyber">No-Loss Complete</span>
              </div>
              
              <h1 className="font-arcade text-3xl mb-2">
                <ShinyText variant="cyan" speed="fast" className="text-3xl">
                  Session Settled!
                </ShinyText>
              </h1>
              
              <p className="text-gray-400 font-mono text-sm">
                Landed in <span style={{ color: bucket.color }}>{bucket.label}</span> ({multiplier}x Multiplier)
              </p>
            </div>

            {/* ========== STATS GRID - Two Columns ========== */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* Principal Card */}
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Coins className="w-4 h-4 text-neon-purple" />
                  <span className="text-gray-400 font-mono text-xs uppercase">Principal</span>
                </div>
                <p className="text-white font-arcade text-xl">${principal.toFixed(2)}</p>
                <p className="text-neon-purple font-mono text-xs mt-1">🔒 Locked in Aave V3</p>
              </div>
              
              {/* Yield Earned Card */}
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-neon-cyan" />
                  <span className="text-gray-400 font-mono text-xs uppercase">Yield Earned</span>
                </div>
                <ShinyText variant="cyan" speed="fast" className="font-arcade text-xl">
                  +${finalYield.toFixed(6)}
                </ShinyText>
                <p className="text-neon-cyan font-mono text-xs mt-1">⚡ {pegHits} bounces × {multiplier}x</p>
              </div>
            </div>

            {/* ========== TOTAL PAYOUT HIGHLIGHT ========== */}
            <div className="relative mb-6">
              {/* Glow behind */}
              <div 
                className="absolute inset-0 rounded-2xl blur-xl opacity-30"
                style={{ background: `linear-gradient(135deg, #7df9ff, ${bucket.color})` }}
              />
              
              <div className="relative bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <p className="text-center text-gray-400 font-mono text-sm mb-2">TOTAL PAYOUT</p>
                <div className="text-center">
                  <ShinyText variant="gold" speed="fast" className="font-arcade text-4xl">
                    ${totalPayout.toFixed(6)}
                  </ShinyText>
                </div>
                <p className="text-center text-gray-500 font-mono text-xs mt-2">
                  Session: {Math.floor(sessionDuration)}s • Base Yield: ${baseYield.toFixed(4)}
                </p>
              </div>
            </div>

            {/* ========== TRANSACTION STATUS ========== */}
            {txHash && (
              <div className={`rounded-xl p-3 mb-4 ${isConfirmed ? 'bg-neon-green/20 border border-neon-green/50' : 'bg-neon-cyan/20 border border-neon-cyan/50'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isConfirming ? (
                      <Loader2 className="w-4 h-4 text-neon-cyan animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-neon-green" />
                    )}
                    <span className="text-white font-cyber text-sm">
                      {isConfirming ? 'Confirming on Base...' : 'Transaction Confirmed!'}
                    </span>
                  </div>
                  <a
                    href={`https://sepolia.basescan.org/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-neon-cyan hover:underline text-xs font-cyber"
                  >
                    View <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 mb-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span className="text-red-400 font-cyber text-sm">
                    {error.shortMessage || error.message?.slice(0, 80) || 'Transaction failed'}
                  </span>
                </div>
              </div>
            )}

            {/* ========== YBT REWARD SECTION ========== */}
            {isTokenConfigured && !isConfirmed && (
              <div className="bg-gradient-to-r from-neon-pink/20 to-neon-purple/20 border border-neon-pink/40 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Gift className="w-5 h-5 text-neon-pink" />
                    <span className="font-arcade text-sm text-neon-pink">BONUS REWARD</span>
                  </div>
                  <span className="text-neon-cyan font-arcade">+{REWARD_AMOUNT_DISPLAY} YBT</span>
                </div>
                
                {rewardTxHash ? (
                  <div className={`rounded-lg p-2 ${isRewardConfirmed ? 'bg-neon-green/20' : 'bg-neon-cyan/20'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isRewardConfirming ? (
                          <Loader2 className="w-3 h-3 text-neon-cyan animate-spin" />
                        ) : (
                          <CheckCircle className="w-3 h-3 text-neon-green" />
                        )}
                        <span className="text-white font-cyber text-xs">
                          {isRewardConfirming ? 'Minting...' : 'Tokens Minted!'}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleClaimReward}
                    disabled={isRewardLoading}
                    className="w-full py-2 bg-gradient-to-r from-neon-pink to-neon-purple rounded-lg font-cyber text-white text-sm hover:opacity-90 transition-all disabled:opacity-50"
                  >
                    {isRewardLoading ? 'Claiming...' : `Claim ${REWARD_AMOUNT_DISPLAY} YBT`}
                  </button>
                )}
              </div>
            )}

            {/* ========== MAIN CTA - FINALIZE BUTTON with Neon Glow ========== */}
            {!isConfirmed ? (
              <button
                onClick={handleFinalizeOnChain}
                disabled={isLoading}
                className="w-full py-4 px-6 rounded-xl font-arcade text-white text-lg flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                style={{
                  background: 'linear-gradient(135deg, #7df9ff 0%, #00d4ff 50%, #7df9ff 100%)',
                  boxShadow: '0 0 30px rgba(125, 249, 255, 0.5), 0 0 60px rgba(125, 249, 255, 0.3)',
                }}
              >
                {/* Animated shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {isWritePending ? 'Confirm in Wallet...' : 'Confirming...'}
                  </>
                ) : (
                  <>
                    <Wallet className="w-5 h-5" />
                    <span className="text-cyber-darker">⚡ Finalize on Base ⚡</span>
                  </>
                )}
              </button>
            ) : (
              <div className="text-center py-4">
                <CheckCircle className="w-12 h-12 text-neon-green mx-auto mb-3" />
                <p className="font-arcade text-neon-green text-lg">WITHDRAWAL COMPLETE!</p>
                <p className="text-gray-400 font-cyber text-sm mt-2">
                  ${totalPayout.toFixed(6)} USDC sent to your wallet
                </p>
              </div>
            )}

            {/* Secondary Actions */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={onPlayAgain}
                className="flex-1 py-3 px-4 bg-white/10 border border-white/20 rounded-lg font-cyber text-white hover:bg-white/20 transition-all"
              >
                Play Again
              </button>
              <button
                onClick={onWithdraw}
                className="flex-1 py-3 px-4 border border-gray-600 rounded-lg font-cyber text-gray-400 hover:text-white hover:border-gray-500 transition-all"
              >
                Close
              </button>
            </div>

            {/* ========== FOOTER - Yellow Network Verification ========== */}
            <div className="mt-6 pt-4 border-t border-white/10">
              <p className="text-center text-gray-500 font-mono text-xs">
                ⚡ Verified by Yellow Network State Channels
              </p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <div className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse" />
                <p className="text-gray-600 font-mono text-xs">
                  Base Sepolia • Aave V3 Vault
                </p>
              </div>
            </div>

          </div>
        </ElectricBorder>
      </div>
    </div>
  );
}

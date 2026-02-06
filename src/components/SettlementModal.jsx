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

    console.log('%c💸 Finalizing settlement...', 'color: #7df9ff; font-weight: bold;');
    console.log('Principal:', principal, 'USDC');
    console.log('Yield:', finalYield.toFixed(6), 'USDC');

    // Call vault withdraw function with gas limit
    writeContract({
      address: VAULT_ADDRESS,
      abi: VAULT_ABI,
      functionName: 'withdraw',
      args: [principalUnits, yieldUnits],
      chainId: TARGET_CHAIN_ID,
      gas: 150000n,
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
        gas: 150000n,
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
          borderRadius={16}
          borderWidth={2}
        >
          {/* Content Card - Clean dark background like ReactBits Electric Card */}
          <div 
            className="bg-[#0a0a0f] p-6 rounded-[16px]"
            style={{ zIndex: 20 }}
          >
            
            {/* ========== BADGE - "SETTLED" pill like ReactBits "FEATURED" ========== */}
            <div className="mb-6">
              <span className="inline-block px-3 py-1.5 bg-white/10 border border-white/20 rounded-full text-white/80 text-xs font-medium tracking-wide">
                SETTLED
              </span>
            </div>

            {/* ========== TITLE - Clean white text ========== */}
            <h1 className="text-white text-3xl font-bold mb-3">
              Session Complete
            </h1>
            
            {/* ========== DESCRIPTION - Gray text ========== */}
            <p className="text-gray-400 text-base mb-8">
              You landed in <span className="text-white font-medium" style={{ color: bucket.color }}>{bucket.label}</span> with a {multiplier}x multiplier.
            </p>

            {/* ========== PAYOUT SECTION ========== */}
            <div className="space-y-3 mb-8">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-sm">Principal</span>
                <span className="text-white font-medium">${principal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-sm">Yield Earned</span>
                <span className="text-[#7df9ff] font-medium">+${finalYield.toFixed(6)}</span>
              </div>
              <div className="h-px bg-white/10 my-2" />
              <div className="flex justify-between items-center">
                <span className="text-white font-medium">Total Payout</span>
                <span className="text-white text-xl font-bold">${totalPayout.toFixed(6)}</span>
              </div>
            </div>

            {/* ========== META BADGES - Like "Live" and "v1.0" in ReactBits ========== */}
            <div className="flex items-center gap-2 mb-8">
              <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-gray-400 text-xs">
                {pegHits} bounces
              </span>
              <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-gray-400 text-xs">
                {Math.floor(sessionDuration)}s
              </span>
              {ybtBalance !== undefined && (
                <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-gray-400 text-xs">
                  {parseFloat(formattedYbtBalance).toFixed(0)} YBT
                </span>
              )}
            </div>

            {/* ========== TRANSACTION STATUS ========== */}
            {txHash && (
              <div className={`rounded-lg p-3 mb-4 ${isConfirmed ? 'bg-green-500/10 border border-green-500/30' : 'bg-[#7df9ff]/10 border border-[#7df9ff]/30'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isConfirming ? (
                      <Loader2 className="w-4 h-4 text-[#7df9ff] animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    )}
                    <span className="text-white text-sm">
                      {isConfirming ? 'Confirming on Base...' : 'Transaction Confirmed!'}
                    </span>
                  </div>
                  <a
                    href={`https://sepolia.basescan.org/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[#7df9ff] hover:underline text-xs"
                  >
                    View <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span className="text-red-400 text-sm">
                    {error.shortMessage || error.message?.slice(0, 80) || 'Transaction failed'}
                  </span>
                </div>
              </div>
            )}

            {/* ========== YBT REWARD SECTION ========== */}
            {isTokenConfigured && !isConfirmed && (
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Gift className="w-4 h-4 text-[#7df9ff]" />
                    <span className="text-white text-sm font-medium">Bonus Reward</span>
                  </div>
                  <span className="text-[#7df9ff] font-medium">+{REWARD_AMOUNT_DISPLAY} YBT</span>
                </div>
                
                {rewardTxHash ? (
                  <div className={`rounded-lg p-2 ${isRewardConfirmed ? 'bg-green-500/10' : 'bg-[#7df9ff]/10'}`}>
                    <div className="flex items-center gap-2">
                      {isRewardConfirming ? (
                        <Loader2 className="w-3 h-3 text-[#7df9ff] animate-spin" />
                      ) : (
                        <CheckCircle className="w-3 h-3 text-green-400" />
                      )}
                      <span className="text-white text-xs">
                        {isRewardConfirming ? 'Minting...' : 'Tokens Minted!'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleClaimReward}
                    disabled={isRewardLoading}
                    className="w-full py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white text-sm transition-all disabled:opacity-50"
                  >
                    {isRewardLoading ? 'Claiming...' : `Claim ${REWARD_AMOUNT_DISPLAY} YBT`}
                  </button>
                )}
              </div>
            )}

            {/* ========== MAIN CTA - Clean white button like ReactBits "Get Started" ========== */}
            {!isConfirmed ? (
              <button
                onClick={handleFinalizeOnChain}
                disabled={isLoading}
                className="w-full py-4 bg-white text-black font-semibold rounded-xl flex items-center justify-center gap-2 transition-all hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {isWritePending ? 'Confirm in Wallet...' : 'Confirming...'}
                  </>
                ) : (
                  <>
                    <span>Finalize on Base</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            ) : (
              <div className="text-center py-4">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <p className="text-green-400 text-lg font-semibold">Withdrawal Complete!</p>
                <p className="text-gray-400 text-sm mt-2">
                  ${totalPayout.toFixed(6)} USDC sent to your wallet
                </p>
              </div>
            )}

            {/* Secondary Actions */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={onPlayAgain}
                className="flex-1 py-3 px-4 bg-white/5 border border-white/10 rounded-lg text-white text-sm hover:bg-white/10 transition-all"
              >
                Play Again
              </button>
              <button
                onClick={onWithdraw}
                className="flex-1 py-3 px-4 border border-white/10 rounded-lg text-gray-400 text-sm hover:text-white hover:border-white/20 transition-all"
              >
                Close
              </button>
            </div>

          </div>
        </ElectricBorder>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain, useReadContract } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { CheckCircle, Coins, TrendingUp, Zap, ArrowRight, Wallet, Loader2, ExternalLink, AlertCircle, Gift } from 'lucide-react';
import { 
  VAULT_ADDRESS, 
  VAULT_ABI, 
  TARGET_CHAIN_ID,
  GAME_CONTRACT_ADDRESS,
  GAME_ABI,
  YBT_TOKEN_ADDRESS,
  YBT_ABI,
  REWARD_AMOUNT_DISPLAY,
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

  // Check if game contract is configured
  const isGameConfigured = GAME_CONTRACT_ADDRESS && GAME_CONTRACT_ADDRESS !== null;
  const isTokenConfigured = YBT_TOKEN_ADDRESS && YBT_TOKEN_ADDRESS !== null;

  // Handle successful reward claim
  useEffect(() => {
    if (isRewardConfirmed && !rewardClaimed) {
      setRewardClaimed(true);
      refetchBalance?.();
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

  // Claim YBT reward tokens
  const handleClaimReward = async () => {
    if (!isGameConfigured || !address) {
      console.warn('Game contract not configured or no address');
      return;
    }

    // Check if on correct chain
    if (chainId !== TARGET_CHAIN_ID) {
      try {
        await switchChain({ chainId: TARGET_CHAIN_ID });
      } catch (err) {
        console.error('Failed to switch chain:', err);
        return;
      }
    }

    // Call game contract to reward winner
    writeReward({
      address: GAME_CONTRACT_ADDRESS,
      abi: GAME_ABI,
      functionName: 'rewardWinner',
      args: [address],
      chainId: TARGET_CHAIN_ID,
    });
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
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-lg" />
      
      {/* Modal */}
      <div className="relative w-full max-w-md">
        {/* Glow effect */}
        <div 
          className="absolute -inset-2 rounded-3xl blur-2xl opacity-50 animate-pulse"
          style={{ background: `linear-gradient(135deg, ${bucket.color}, #8b5cf6)` }}
        />
        
        {/* Content */}
        <div className="relative bg-gradient-to-b from-cyber-dark/95 to-cyber-darker/95 backdrop-blur-2xl border border-white/20 rounded-2xl p-8 shadow-2xl">
          
          {/* Off-Chain Success Banner */}
          <div className="bg-neon-yellow/20 border-2 border-neon-yellow rounded-xl p-4 mb-6">
            <div className="flex items-center justify-center gap-3">
              <CheckCircle className="w-6 h-6 text-neon-yellow" />
              <span className="font-arcade text-lg text-neon-yellow">
                Yield Secured Off-Chain!
              </span>
            </div>
            <p className="text-center text-gray-400 font-cyber text-xs mt-2">
              Your session has been signed via Yellow Network State Channel
            </p>
          </div>

          {/* Bucket Badge */}
          <div className="flex justify-center mb-4">
            <div 
              className="px-4 py-2 rounded-full flex items-center gap-2"
              style={{ 
                backgroundColor: bucket.color + '30',
                borderColor: bucket.color,
                borderWidth: 2,
              }}
            >
              <span className="font-cyber text-sm" style={{ color: bucket.color }}>
                Landed in {bucket.label} ({multiplier}x)
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-white/5 rounded-lg p-2 text-center">
              <Zap className="w-4 h-4 mx-auto mb-1 text-neon-yellow" />
              <p className="text-gray-500 text-xs font-cyber">Bounces</p>
              <p className="text-white font-arcade text-sm">{pegHits}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-2 text-center">
              <TrendingUp className="w-4 h-4 mx-auto mb-1 text-neon-green" />
              <p className="text-gray-500 text-xs font-cyber">Base Yield</p>
              <p className="text-white font-cyber text-sm">${baseYield.toFixed(4)}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-2 text-center">
              <Coins className="w-4 h-4 mx-auto mb-1 text-neon-cyan" />
              <p className="text-gray-500 text-xs font-cyber">Time</p>
              <p className="text-white font-cyber text-sm">{Math.floor(sessionDuration)}s</p>
            </div>
          </div>

          {/* Payout Breakdown */}
          <div className="bg-white/5 rounded-xl p-4 mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400 font-cyber text-sm">Principal (Aave V3)</span>
              <span className="text-white font-cyber">${principal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400 font-cyber text-sm">Yield Earned</span>
              <span className="text-neon-cyan font-cyber">+${finalYield.toFixed(6)}</span>
            </div>
            <div className="border-t border-gray-700 pt-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-white font-cyber font-bold">Total Payout</span>
                <span className="text-neon-pink font-arcade text-xl">${totalPayout.toFixed(6)}</span>
              </div>
            </div>
          </div>

          {/* Transaction Status */}
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
                    {isConfirming ? 'Confirming...' : 'Transaction Confirmed!'}
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

          {/* Reward Token Error Display */}
          {rewardTxError && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 mb-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span className="text-red-400 font-cyber text-sm">
                  Reward claim failed: {rewardTxError.shortMessage || rewardTxError.message?.slice(0, 60) || 'Unknown error'}
                </span>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* DEMO TOKEN REWARD SECTION */}
          {/* ============================================================ */}
          {isGameConfigured && isTokenConfigured && (
            <div className="bg-gradient-to-r from-neon-pink/20 to-neon-purple/20 border-2 border-neon-pink/50 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-neon-pink" />
                  <span className="font-arcade text-sm text-neon-pink">🎉 WIN REWARD</span>
                </div>
                <span className="text-neon-cyan font-arcade text-lg">+{REWARD_AMOUNT_DISPLAY} YBT</span>
              </div>
              
              {/* Reward Transaction Status */}
              {rewardTxHash && (
                <div className={`rounded-lg p-2 mb-3 ${isRewardConfirmed ? 'bg-neon-green/20' : 'bg-neon-cyan/20'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isRewardConfirming ? (
                        <Loader2 className="w-3 h-3 text-neon-cyan animate-spin" />
                      ) : (
                        <CheckCircle className="w-3 h-3 text-neon-green" />
                      )}
                      <span className="text-white font-cyber text-xs">
                        {isRewardConfirming ? 'Claiming...' : 'Tokens Claimed!'}
                      </span>
                    </div>
                    <a
                      href={`https://sepolia.basescan.org/tx/${rewardTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-neon-cyan hover:underline text-xs font-cyber"
                    >
                      View <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}
              
              {/* Claim Button or Success */}
              {!isRewardConfirmed ? (
                <button
                  onClick={handleClaimReward}
                  disabled={isRewardLoading}
                  className="w-full py-3 px-4 bg-gradient-to-r from-neon-pink to-neon-purple rounded-lg font-arcade text-white flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {isRewardLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {isRewardPending ? 'Confirm in Wallet...' : 'Claiming...'}
                    </>
                  ) : (
                    <>
                      <Gift className="w-4 h-4" />
                      Claim {REWARD_AMOUNT_DISPLAY} YBT Tokens
                    </>
                  )}
                </button>
              ) : (
                <div className="text-center py-2">
                  <p className="text-neon-green font-cyber text-sm">✅ {REWARD_AMOUNT_DISPLAY} YBT added to wallet!</p>
                  <p className="text-gray-500 font-cyber text-xs mt-1">
                    Token: {YBT_TOKEN_ADDRESS?.slice(0, 10)}...{YBT_TOKEN_ADDRESS?.slice(-6)}
                  </p>
                </div>
              )}
              
              {/* Current Balance */}
              {ybtBalance !== undefined && (
                <p className="text-center text-gray-400 font-cyber text-xs mt-2">
                  Your YBT Balance: {parseFloat(formattedYbtBalance).toFixed(2)} YBT
                </p>
              )}
            </div>
          )}

          {/* Demo Mode Notice - when contracts not configured */}
          {(!isGameConfigured || !isTokenConfigured) && (
            <div className="bg-neon-yellow/10 border border-neon-yellow/30 rounded-xl p-3 mb-4">
              <p className="text-neon-yellow font-cyber text-xs text-center">
                🎮 Demo Mode: Deploy contracts to enable token rewards
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            {/* Main CTA - Finalize on Base/Sepolia */}
            {!isConfirmed && (
              <button
                onClick={handleFinalizeOnChain}
                disabled={isLoading}
                className="w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl font-arcade text-white text-lg flex items-center justify-center gap-3 hover:opacity-90 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {isWritePending ? 'Confirm in Wallet...' : 'Confirming...'}
                  </>
                ) : (
                  <>
                    <Wallet className="w-5 h-5" />
                    Finalize on Base/Sepolia
                  </>
                )}
              </button>
            )}

            {/* Success State */}
            {isConfirmed && (
              <div className="text-center py-4">
                <CheckCircle className="w-12 h-12 text-neon-green mx-auto mb-3" />
                <p className="font-arcade text-neon-green text-lg">WITHDRAWAL COMPLETE!</p>
                <p className="text-gray-400 font-cyber text-sm mt-2">
                  ${totalPayout.toFixed(6)} USDC sent to your wallet
                </p>
              </div>
            )}

            {/* Secondary Actions */}
            <div className="flex gap-3">
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
          </div>

          {/* Network Badge */}
          <div className="mt-6 flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <p className="text-gray-500 font-cyber text-xs">
              Base Sepolia • Yellow Network State Channel
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { 
  useAccount, 
  useWriteContract, 
  useWaitForTransactionReceipt,
  useReadContract,
  useSwitchChain
} from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { 
  VAULT_ADDRESS, 
  VAULT_ABI,
  YBT_TOKEN_ADDRESS,
  YBT_ABI,
  GAME_CONTRACT_ADDRESS,
  GAME_ABI,
  TARGET_CHAIN_ID,
  config
} from '../config/wagmi.js';
import { Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

// Test result component
const TestResult = ({ status, message, txHash }) => {
  const statusColors = {
    pending: 'text-yellow-400',
    success: 'text-green-400',
    error: 'text-red-400',
    idle: 'text-gray-400'
  };

  const statusIcons = {
    pending: <Loader2 className="w-4 h-4 animate-spin" />,
    success: <CheckCircle className="w-4 h-4" />,
    error: <XCircle className="w-4 h-4" />,
    idle: <AlertTriangle className="w-4 h-4" />
  };

  return (
    <div className={`flex items-center gap-2 ${statusColors[status]} font-mono text-sm`}>
      {statusIcons[status]}
      <span>{message}</span>
      {txHash && (
        <a 
          href={`https://sepolia.basescan.org/tx/${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:underline ml-2"
        >
          View Tx
        </a>
      )}
    </div>
  );
};

export function ContractTester() {
  const { address, isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();

  // ============================================================
  // STATE FOR ALL TESTS
  // ============================================================
  const [depositAmount, setDepositAmount] = useState('100');
  const [withdrawPrincipal, setWithdrawPrincipal] = useState('100');
  const [withdrawYield, setWithdrawYield] = useState('5');
  const [mintAmount, setMintAmount] = useState('10');
  const [testResults, setTestResults] = useState({});

  // ============================================================
  // VAULT CONTRACT FUNCTIONS
  // ============================================================
  
  // Deposit
  const { 
    writeContract: writeDeposit, 
    data: depositHash,
    isPending: isDepositPending,
    error: depositError,
    reset: resetDeposit
  } = useWriteContract();

  const { 
    isLoading: isDepositConfirming, 
    isSuccess: isDepositConfirmed 
  } = useWaitForTransactionReceipt({ hash: depositHash });

  // Withdraw
  const { 
    writeContract: writeWithdraw, 
    data: withdrawHash,
    isPending: isWithdrawPending,
    error: withdrawError,
    reset: resetWithdraw
  } = useWriteContract();

  const { 
    isLoading: isWithdrawConfirming, 
    isSuccess: isWithdrawConfirmed 
  } = useWaitForTransactionReceipt({ hash: withdrawHash });

  // ============================================================
  // YBT TOKEN FUNCTIONS
  // ============================================================
  
  // Mint YBT
  const { 
    writeContract: writeMint, 
    data: mintHash,
    isPending: isMintPending,
    error: mintError,
    reset: resetMint
  } = useWriteContract();

  const { 
    isLoading: isMintConfirming, 
    isSuccess: isMintConfirmed 
  } = useWaitForTransactionReceipt({ hash: mintHash });

  // Transfer YBT
  const { 
    writeContract: writeTransfer, 
    data: transferHash,
    isPending: isTransferPending,
    error: transferError,
    reset: resetTransfer
  } = useWriteContract();

  const { 
    isLoading: isTransferConfirming, 
    isSuccess: isTransferConfirmed 
  } = useWaitForTransactionReceipt({ hash: transferHash });

  // ============================================================
  // GAME CONTRACT FUNCTIONS
  // ============================================================
  
  // Reward Winner
  const { 
    writeContract: writeReward, 
    data: rewardHash,
    isPending: isRewardPending,
    error: rewardError,
    reset: resetReward
  } = useWriteContract();

  const { 
    isLoading: isRewardConfirming, 
    isSuccess: isRewardConfirmed 
  } = useWaitForTransactionReceipt({ hash: rewardHash });

  // ============================================================
  // READ FUNCTIONS
  // ============================================================
  
  // YBT Balance
  const { data: ybtBalance, refetch: refetchYbtBalance } = useReadContract({
    address: YBT_TOKEN_ADDRESS,
    abi: YBT_ABI,
    functionName: 'balanceOf',
    args: [address],
    enabled: !!address,
  });

  // YBT Total Supply
  const { data: ybtTotalSupply, refetch: refetchTotalSupply } = useReadContract({
    address: YBT_TOKEN_ADDRESS,
    abi: YBT_ABI,
    functionName: 'totalSupply',
  });

  // Player Stats from Game Contract
  const { data: playerStats, refetch: refetchPlayerStats } = useReadContract({
    address: GAME_CONTRACT_ADDRESS,
    abi: GAME_ABI,
    functionName: 'getPlayerStats',
    args: [address],
    enabled: !!address,
  });

  // Game Contract Token Balance
  const { data: gameTokenBalance, refetch: refetchGameBalance } = useReadContract({
    address: GAME_CONTRACT_ADDRESS,
    abi: GAME_ABI,
    functionName: 'getTokenBalance',
  });

  // ============================================================
  // HANDLER FUNCTIONS
  // ============================================================

  const handleSwitchNetwork = async () => {
    try {
      await switchChain({ chainId: TARGET_CHAIN_ID });
      updateTestResult('network', 'success', 'Switched to Base Sepolia');
    } catch (err) {
      updateTestResult('network', 'error', err.message);
    }
  };

  const updateTestResult = (key, status, message, txHash = null) => {
    setTestResults(prev => ({
      ...prev,
      [key]: { status, message, txHash }
    }));
  };

  // Test Deposit
  const handleTestDeposit = async () => {
    try {
      resetDeposit();
      updateTestResult('deposit', 'pending', 'Initiating deposit...');
      
      const amountWei = parseUnits(depositAmount, 6); // USDC has 6 decimals
      
      writeDeposit({
        address: VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName: 'deposit',
        args: [amountWei],
      });
    } catch (err) {
      updateTestResult('deposit', 'error', err.message);
    }
  };

  // Test Withdraw - THE MAIN FOCUS
  const handleTestWithdraw = async () => {
    try {
      resetWithdraw();
      updateTestResult('withdraw', 'pending', 'Initiating withdraw...');
      
      const principalWei = parseUnits(withdrawPrincipal, 6); // USDC has 6 decimals
      const yieldWei = parseUnits(withdrawYield, 6);
      
      writeWithdraw({
        address: VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName: 'withdraw',
        args: [principalWei, yieldWei],
      });
    } catch (err) {
      updateTestResult('withdraw', 'error', err.message);
    }
  };

  // Test Mint YBT
  const handleTestMint = async () => {
    try {
      resetMint();
      updateTestResult('mint', 'pending', 'Initiating mint...');
      
      const amountWei = parseUnits(mintAmount, 18); // YBT has 18 decimals
      
      writeMint({
        address: YBT_TOKEN_ADDRESS,
        abi: YBT_ABI,
        functionName: 'mint',
        args: [address, amountWei],
      });
    } catch (err) {
      updateTestResult('mint', 'error', err.message);
    }
  };

  // Test YBT Transfer
  const handleTestTransfer = async () => {
    try {
      resetTransfer();
      updateTestResult('transfer', 'pending', 'Initiating transfer...');
      
      // Transfer 1 YBT to a test address (yourself for testing)
      const amountWei = parseUnits('1', 18);
      
      writeTransfer({
        address: YBT_TOKEN_ADDRESS,
        abi: YBT_ABI,
        functionName: 'transfer',
        args: [address, amountWei], // Transfer to self for testing
      });
    } catch (err) {
      updateTestResult('transfer', 'error', err.message);
    }
  };

  // Test Game Reward
  const handleTestReward = async () => {
    try {
      resetReward();
      updateTestResult('reward', 'pending', 'Initiating reward...');
      
      writeReward({
        address: GAME_CONTRACT_ADDRESS,
        abi: GAME_ABI,
        functionName: 'rewardWinner',
        args: [address],
      });
    } catch (err) {
      updateTestResult('reward', 'error', err.message);
    }
  };

  // Refresh all read data
  const handleRefreshData = () => {
    refetchYbtBalance();
    refetchTotalSupply();
    refetchPlayerStats();
    refetchGameBalance();
    updateTestResult('refresh', 'success', 'Data refreshed!');
  };

  // ============================================================
  // UPDATE TEST RESULTS ON TX CONFIRMATION
  // ============================================================

  React.useEffect(() => {
    if (depositError) updateTestResult('deposit', 'error', depositError.message);
    if (isDepositPending) updateTestResult('deposit', 'pending', 'Waiting for wallet...');
    if (isDepositConfirming) updateTestResult('deposit', 'pending', 'Confirming on chain...');
    if (isDepositConfirmed) updateTestResult('deposit', 'success', 'Deposit confirmed!', depositHash);
  }, [depositError, isDepositPending, isDepositConfirming, isDepositConfirmed, depositHash]);

  React.useEffect(() => {
    if (withdrawError) updateTestResult('withdraw', 'error', withdrawError.message);
    if (isWithdrawPending) updateTestResult('withdraw', 'pending', 'Waiting for wallet...');
    if (isWithdrawConfirming) updateTestResult('withdraw', 'pending', 'Confirming on chain...');
    if (isWithdrawConfirmed) updateTestResult('withdraw', 'success', 'Withdraw confirmed!', withdrawHash);
  }, [withdrawError, isWithdrawPending, isWithdrawConfirming, isWithdrawConfirmed, withdrawHash]);

  React.useEffect(() => {
    if (mintError) updateTestResult('mint', 'error', mintError.message);
    if (isMintPending) updateTestResult('mint', 'pending', 'Waiting for wallet...');
    if (isMintConfirming) updateTestResult('mint', 'pending', 'Confirming on chain...');
    if (isMintConfirmed) updateTestResult('mint', 'success', 'Mint confirmed!', mintHash);
  }, [mintError, isMintPending, isMintConfirming, isMintConfirmed, mintHash]);

  React.useEffect(() => {
    if (transferError) updateTestResult('transfer', 'error', transferError.message);
    if (isTransferPending) updateTestResult('transfer', 'pending', 'Waiting for wallet...');
    if (isTransferConfirming) updateTestResult('transfer', 'pending', 'Confirming on chain...');
    if (isTransferConfirmed) updateTestResult('transfer', 'success', 'Transfer confirmed!', transferHash);
  }, [transferError, isTransferPending, isTransferConfirming, isTransferConfirmed, transferHash]);

  React.useEffect(() => {
    if (rewardError) updateTestResult('reward', 'error', rewardError.message);
    if (isRewardPending) updateTestResult('reward', 'pending', 'Waiting for wallet...');
    if (isRewardConfirming) updateTestResult('reward', 'pending', 'Confirming on chain...');
    if (isRewardConfirmed) updateTestResult('reward', 'success', 'Reward confirmed!', rewardHash);
  }, [rewardError, isRewardPending, isRewardConfirming, isRewardConfirmed, rewardHash]);

  // ============================================================
  // RENDER
  // ============================================================

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <h1 className="text-3xl font-bold mb-4">🧪 YieldBall Contract Tester</h1>
        <p className="text-yellow-400">Please connect your wallet to test contracts.</p>
      </div>
    );
  }

  const isWrongNetwork = chainId !== TARGET_CHAIN_ID;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-2">🧪 YieldBall Contract Tester</h1>
      <p className="text-gray-400 mb-8">Test all contract functions on Base Sepolia</p>

      {/* Network Status */}
      <div className="mb-8 p-4 rounded-lg bg-gray-800 border border-gray-700">
        <h2 className="text-xl font-bold mb-4">🌐 Network Status</h2>
        <div className="flex items-center gap-4">
          <span className={isWrongNetwork ? 'text-red-400' : 'text-green-400'}>
            {isWrongNetwork ? '❌ Wrong Network' : '✅ Connected to Base Sepolia'}
          </span>
          <span className="text-gray-500">Chain ID: {chainId}</span>
          {isWrongNetwork && (
            <button
              onClick={handleSwitchNetwork}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-mono"
            >
              Switch to Base Sepolia
            </button>
          )}
        </div>
        {testResults.network && <TestResult {...testResults.network} />}
      </div>

      {/* Contract Addresses */}
      <div className="mb-8 p-4 rounded-lg bg-gray-800 border border-gray-700">
        <h2 className="text-xl font-bold mb-4">📋 Contract Addresses</h2>
        <div className="grid gap-2 font-mono text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Vault/Game:</span>
            <a 
              href={`https://sepolia.basescan.org/address/${VAULT_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              {VAULT_ADDRESS}
            </a>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">YBT Token:</span>
            <a 
              href={`https://sepolia.basescan.org/address/${YBT_TOKEN_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              {YBT_TOKEN_ADDRESS}
            </a>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Your Address:</span>
            <span className="text-green-400">{address}</span>
          </div>
        </div>
      </div>

      {/* Read Data */}
      <div className="mb-8 p-4 rounded-lg bg-gray-800 border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">📊 Current Data</h2>
          <button
            onClick={handleRefreshData}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-mono text-sm"
          >
            🔄 Refresh
          </button>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-3 bg-gray-900 rounded-lg">
            <span className="text-gray-400 text-sm">Your YBT Balance:</span>
            <p className="text-2xl font-bold text-yellow-400">
              {ybtBalance ? formatUnits(ybtBalance, 18) : '0'} YBT
            </p>
          </div>
          <div className="p-3 bg-gray-900 rounded-lg">
            <span className="text-gray-400 text-sm">YBT Total Supply:</span>
            <p className="text-2xl font-bold text-blue-400">
              {ybtTotalSupply ? formatUnits(ybtTotalSupply, 18) : '0'} YBT
            </p>
          </div>
          <div className="p-3 bg-gray-900 rounded-lg">
            <span className="text-gray-400 text-sm">Your Game Wins:</span>
            <p className="text-2xl font-bold text-green-400">
              {playerStats ? playerStats[0]?.toString() : '0'}
            </p>
          </div>
          <div className="p-3 bg-gray-900 rounded-lg">
            <span className="text-gray-400 text-sm">Your Total Rewards:</span>
            <p className="text-2xl font-bold text-purple-400">
              {playerStats ? formatUnits(playerStats[1] || 0n, 18) : '0'} YBT
            </p>
          </div>
        </div>
        {testResults.refresh && <div className="mt-2"><TestResult {...testResults.refresh} /></div>}
      </div>

      {/* VAULT TESTS */}
      <div className="mb-8 p-4 rounded-lg bg-gray-800 border border-purple-500">
        <h2 className="text-xl font-bold mb-4 text-purple-400">🏦 Vault Contract Tests</h2>
        
        {/* Deposit Test */}
        <div className="mb-6 p-4 bg-gray-900 rounded-lg">
          <h3 className="font-bold mb-2">deposit(amount)</h3>
          <p className="text-gray-400 text-sm mb-3">Deposits USDC into the Aave vault</p>
          <div className="flex gap-4 items-center mb-3">
            <input
              type="number"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg w-32 font-mono"
              placeholder="Amount"
            />
            <span className="text-gray-400">USDC</span>
            <button
              onClick={handleTestDeposit}
              disabled={isDepositPending || isDepositConfirming || isWrongNetwork}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-bold"
            >
              {isDepositPending || isDepositConfirming ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Testing...
                </span>
              ) : (
                'Test Deposit'
              )}
            </button>
          </div>
          {testResults.deposit && <TestResult {...testResults.deposit} />}
        </div>

        {/* Withdraw Test - MAIN FOCUS */}
        <div className="p-4 bg-gray-900 rounded-lg border-2 border-yellow-500">
          <h3 className="font-bold mb-2 text-yellow-400">⭐ withdraw(principal, yield) - MAIN TEST</h3>
          <p className="text-gray-400 text-sm mb-3">Withdraws principal + yield from the vault</p>
          <div className="grid md:grid-cols-2 gap-4 mb-3">
            <div>
              <label className="text-sm text-gray-400">Principal (USDC)</label>
              <input
                type="number"
                value={withdrawPrincipal}
                onChange={(e) => setWithdrawPrincipal(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg font-mono"
                placeholder="Principal"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400">Yield (USDC)</label>
              <input
                type="number"
                value={withdrawYield}
                onChange={(e) => setWithdrawYield(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg font-mono"
                placeholder="Yield"
              />
            </div>
          </div>
          <button
            onClick={handleTestWithdraw}
            disabled={isWithdrawPending || isWithdrawConfirming || isWrongNetwork}
            className="w-full px-6 py-3 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-bold text-lg"
          >
            {isWithdrawPending || isWithdrawConfirming ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" /> Testing Withdraw...
              </span>
            ) : (
              '🚀 Test Withdraw Function'
            )}
          </button>
          {testResults.withdraw && <div className="mt-3"><TestResult {...testResults.withdraw} /></div>}
        </div>
      </div>

      {/* YBT TOKEN TESTS */}
      <div className="mb-8 p-4 rounded-lg bg-gray-800 border border-yellow-500">
        <h2 className="text-xl font-bold mb-4 text-yellow-400">🪙 YBT Token Tests</h2>
        
        {/* Mint Test */}
        <div className="mb-6 p-4 bg-gray-900 rounded-lg">
          <h3 className="font-bold mb-2">mint(to, amount)</h3>
          <p className="text-gray-400 text-sm mb-3">Public mint function (hackathon demo)</p>
          <div className="flex gap-4 items-center mb-3">
            <input
              type="number"
              value={mintAmount}
              onChange={(e) => setMintAmount(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg w-32 font-mono"
              placeholder="Amount"
            />
            <span className="text-gray-400">YBT</span>
            <button
              onClick={handleTestMint}
              disabled={isMintPending || isMintConfirming || isWrongNetwork}
              className="px-6 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-bold"
            >
              {isMintPending || isMintConfirming ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Minting...
                </span>
              ) : (
                'Test Mint'
              )}
            </button>
          </div>
          {testResults.mint && <TestResult {...testResults.mint} />}
        </div>

        {/* Transfer Test */}
        <div className="p-4 bg-gray-900 rounded-lg">
          <h3 className="font-bold mb-2">transfer(to, amount)</h3>
          <p className="text-gray-400 text-sm mb-3">Transfer 1 YBT to yourself (test)</p>
          <button
            onClick={handleTestTransfer}
            disabled={isTransferPending || isTransferConfirming || isWrongNetwork}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-bold"
          >
            {isTransferPending || isTransferConfirming ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Transferring...
              </span>
            ) : (
              'Test Transfer'
            )}
          </button>
          {testResults.transfer && <div className="mt-3"><TestResult {...testResults.transfer} /></div>}
        </div>
      </div>

      {/* GAME CONTRACT TESTS */}
      <div className="mb-8 p-4 rounded-lg bg-gray-800 border border-green-500">
        <h2 className="text-xl font-bold mb-4 text-green-400">🎮 Game Contract Tests</h2>
        
        {/* Reward Winner Test */}
        <div className="p-4 bg-gray-900 rounded-lg">
          <h3 className="font-bold mb-2">rewardWinner(player)</h3>
          <p className="text-gray-400 text-sm mb-3">Mints 10 YBT reward tokens to the player</p>
          <button
            onClick={handleTestReward}
            disabled={isRewardPending || isRewardConfirming || isWrongNetwork}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-bold"
          >
            {isRewardPending || isRewardConfirming ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Rewarding...
              </span>
            ) : (
              'Test Reward Winner'
            )}
          </button>
          {testResults.reward && <div className="mt-3"><TestResult {...testResults.reward} /></div>}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4 rounded-lg bg-gray-800 border border-gray-700">
        <h2 className="text-xl font-bold mb-4">⚡ Quick Test Sequence</h2>
        <p className="text-gray-400 text-sm mb-4">
          Recommended test order: Mint → Transfer → Deposit → Withdraw
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleTestMint}
            disabled={isMintPending || isMintConfirming || isWrongNetwork}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 rounded-lg font-mono text-sm"
          >
            1. Mint YBT
          </button>
          <button
            onClick={handleTestTransfer}
            disabled={isTransferPending || isTransferConfirming || isWrongNetwork}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg font-mono text-sm"
          >
            2. Transfer YBT
          </button>
          <button
            onClick={handleTestDeposit}
            disabled={isDepositPending || isDepositConfirming || isWrongNetwork}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg font-mono text-sm"
          >
            3. Deposit USDC
          </button>
          <button
            onClick={handleTestWithdraw}
            disabled={isWithdrawPending || isWithdrawConfirming || isWrongNetwork}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 rounded-lg font-mono text-sm"
          >
            4. Withdraw
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-gray-500 text-sm">
        <p>Make sure you have Base Sepolia ETH for gas fees!</p>
        <p>Get testnet ETH from <a href="https://www.coinbase.com/faucets/base-ethereum-goerli-faucet" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Base Sepolia Faucet</a></p>
      </div>
    </div>
  );
}

export default ContractTester;

import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';
import { mainnet, sepolia, baseSepolia } from 'wagmi/chains';

// Get project ID from environment variable
// Create a .env file with: VITE_WALLETCONNECT_PROJECT_ID=your_project_id
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

if (!projectId) {
  console.warn('Missing VITE_WALLETCONNECT_PROJECT_ID in .env file');
}

export const config = getDefaultConfig({
  appName: 'YieldBall.eth',
  projectId: projectId || '',
  chains: [baseSepolia, sepolia, mainnet],
  transports: {
    [baseSepolia.id]: http(),
    [sepolia.id]: http(),
    [mainnet.id]: http(),
  },
});
// ============================================================
// MOCK TOKEN (for demo visuals only)
// ============================================================

// Mock USDC (can be same as vault for now if not used)
export const USDC_ADDRESS_BASE_SEPOLIA =
  '0x036CbD53842c5426634e7929541eC2318f3dCF7e';

// ============================================================
// YIELDBALL CONTRACTS (Base Sepolia)
// ============================================================

// YieldBall Vault / Game logic contract
export const VAULT_ADDRESS =
  '0x036CbD53842c5426634e7929541eC2318f3dCF7e';

// YieldBall Game Contract (same as vault if combined)
export const GAME_CONTRACT_ADDRESS =
  '0x036CbD53842c5426634e7929541eC2318f3dCF7e';

// ============================================================
// YIELDBALL ERC-20 TOKEN
// ============================================================

//  REAL ERC-20 Reward Token (YBT)
export const YBT_TOKEN_ADDRESS =
  '0x7e1D129EB01ED6fBe07689849F80e887D1Fb3871';

// Reward amount shown in UI
export const REWARD_AMOUNT_DISPLAY = '10';


// Chain ID for Base Sepolia
export const TARGET_CHAIN_ID = baseSepolia.id;

// USDC ABI (simplified for deposit/withdraw)
export const USDC_ABI = [
  {
    name: 'approve',
    type: 'function',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
];

// YieldBall Vault ABI - withdraw transfers principal + yield to msg.sender
export const VAULT_ABI = [
  {
    name: 'deposit',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'withdraw',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'principal', type: 'uint256' },
      { name: 'yield', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'finalizeSettlement',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'player', type: 'address' },
      { name: 'principal', type: 'uint256' },
      { name: 'yieldAmount', type: 'uint256' },
      { name: 'stateChannelSignature', type: 'bytes' },
    ],
    outputs: [],
  },
];

// ============================================================
// YIELDBALL GAME CONTRACT ABI
// ============================================================
export const GAME_ABI = [
  {
    name: 'rewardWinner',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'player', type: 'address' }],
    outputs: [{ name: 'success', type: 'bool' }],
  },
  {
    name: 'rewardFromBalance',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'player', type: 'address' }],
    outputs: [{ name: 'success', type: 'bool' }],
  },
  {
    name: 'getPlayerStats',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'player', type: 'address' }],
    outputs: [
      { name: 'wins', type: 'uint256' },
      { name: 'totalRewards', type: 'uint256' },
    ],
  },
  {
    name: 'getTokenBalance',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'REWARD_AMOUNT',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'yieldBallToken',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    name: 'GameWon',
    type: 'event',
    inputs: [
      { name: 'player', type: 'address', indexed: true },
      { name: 'reward', type: 'uint256', indexed: false },
      { name: 'totalWins', type: 'uint256', indexed: false },
    ],
  },
];

// ============================================================
// YIELDBALL TOKEN (YBT) ABI
// ============================================================
export const YBT_ABI = [
  {
    name: 'name',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    name: 'symbol',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'Transfer',
    type: 'event',
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: false },
    ],
  },
];

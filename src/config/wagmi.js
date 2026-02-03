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

// USDC contract address on Base Sepolia (mock for demo)
export const USDC_ADDRESS_BASE_SEPOLIA = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';

// YieldBall Vault contract address on Base Sepolia
// Deploy your own contract and replace this address
export const VAULT_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';

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

import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';

// Get project ID from environment variable
// Create a .env file with: VITE_WALLETCONNECT_PROJECT_ID=your_project_id
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

if (!projectId) {
  console.warn('Missing VITE_WALLETCONNECT_PROJECT_ID in .env file');
}

export const config = getDefaultConfig({
  appName: 'YieldBall.eth',
  projectId: projectId || '',
  chains: [mainnet, sepolia],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
});

// USDC contract address (mainnet)
export const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';

// Mock Vault contract address (for demo purposes)
export const VAULT_ADDRESS = '0x1234567890123456789012345678901234567890';

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

// Mock Vault ABI
export const VAULT_ABI = [
  {
    name: 'deposit',
    type: 'function',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'withdraw',
    type: 'function',
    inputs: [],
    outputs: [],
  },
];

/**
 * ENS Integration for YieldBall.eth
 * 
 * Uses Wagmi's useEnsText to fetch yieldball.class text record
 * Determines ball physics based on ENS identity
 */

import { useAccount, useEnsName, useEnsText, useEnsAvatar } from 'wagmi';
import { normalize } from 'viem/ens';

/**
 * Hook to get YieldBall class from ENS text record
 * Fetches the 'yieldball.class' text record from the user's ENS
 */
export function useYieldBallClass() {
  const { address, isConnected } = useAccount();
  
  // Get ENS name for connected address
  const { data: ensName, isLoading: nameLoading } = useEnsName({
    address,
    chainId: 1, // Mainnet for ENS
  });

  // Get ENS avatar
  const { data: ensAvatar, isLoading: avatarLoading } = useEnsAvatar({
    name: ensName ? normalize(ensName) : undefined,
    chainId: 1,
  });

  // Get yieldball.class text record
  const { data: yieldballClass, isLoading: classLoading } = useEnsText({
    name: ensName ? normalize(ensName) : undefined,
    key: 'yieldball.class',
    chainId: 1,
  });

  // Normalize the class value
  const normalizedClass = normalizeClass(yieldballClass);

  return {
    isConnected,
    address,
    ensName: ensName || null,
    ensAvatar: ensAvatar || null,
    yieldballClass: normalizedClass,
    isLoading: nameLoading || avatarLoading || classLoading,
    // Ball config based on class
    ballConfig: getBallConfig(normalizedClass),
  };
}

/**
 * Normalize ENS class value to valid game class
 */
function normalizeClass(classValue) {
  if (!classValue) return 'default';
  
  const normalized = classValue.toLowerCase().trim();
  
  if (normalized === 'whale') return 'whale';
  if (normalized === 'degen') return 'degen';
  
  return 'default';
}

/**
 * Get ball configuration based on class
 */
function getBallConfig(classType) {
  const configs = {
    whale: {
      scale: 1.5,
      mass: 3,
      restitution: 0.5,
      color: '#ffd700', // Gold
      label: '🐋 Whale',
      yieldMultiplier: 1.0,
      description: 'Heavy gold ball, harder to bounce',
    },
    degen: {
      scale: 0.7,
      mass: 1,
      restitution: 0.9,
      color: '#ff006e', // Neon Red
      label: '🔥 Degen',
      yieldMultiplier: 2.0,
      description: 'Small bouncy ball, 2x yield!',
    },
    default: {
      scale: 1.0,
      mass: 1,
      restitution: 0.5,
      color: '#c0c0c0', // Silver
      label: '⚡ Standard',
      yieldMultiplier: 1.0,
      description: 'Standard silver ball',
    },
  };

  return configs[classType] || configs.default;
}

/**
 * Format address for display
 */
export function formatAddress(address) {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Mock function for demo purposes when not connected
 * Randomly assigns a class for testing
 */
export function getMockClass(address) {
  if (!address) return 'default';
  
  // Use address hash to deterministically assign class
  const hash = address.toLowerCase();
  const lastChar = hash.charAt(hash.length - 1);
  
  if (['0', '1', '2'].includes(lastChar)) return 'whale';
  if (['3', '4', '5'].includes(lastChar)) return 'degen';
  return 'default';
}

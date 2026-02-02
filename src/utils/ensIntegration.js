import { usePublicClient } from 'wagmi';
import { normalize } from 'viem/ens';

/**
 * ENS Integration for YieldBall player classes
 * Checks the yieldball.class text record to determine player settings
 */

export const YIELDBALL_TEXT_RECORD = 'yieldball.class';

/**
 * Check ENS text record for yieldball.class
 * @param {string} ensName - The ENS name to check (e.g., "vitalik.eth")
 * @returns {Promise<string|null>} - Returns 'whale', 'degen', or null
 */
export async function checkYieldBallClass(publicClient, ensName) {
  if (!ensName || !publicClient) {
    return null;
  }

  try {
    // Normalize the ENS name
    const normalizedName = normalize(ensName);
    
    // Get the text record
    const textRecord = await publicClient.getEnsText({
      name: normalizedName,
      key: YIELDBALL_TEXT_RECORD,
    });

    console.log(`%c🔍 ENS Lookup: ${ensName}`, 'color: #8b5cf6; font-weight: bold;');
    console.log(`%c📋 yieldball.class: ${textRecord || 'not set'}`, 'color: #00f5ff;');

    // Validate the class value
    if (textRecord === 'whale' || textRecord === 'degen') {
      return textRecord;
    }

    return null;
  } catch (error) {
    console.error('ENS lookup failed:', error);
    return null;
  }
}

/**
 * Hook to get player class from ENS
 */
export function useYieldBallClass() {
  const publicClient = usePublicClient();

  const getPlayerClass = async (ensName) => {
    if (!ensName) return 'default';
    
    const classValue = await checkYieldBallClass(publicClient, ensName);
    return classValue || 'default';
  };

  return { getPlayerClass };
}

/**
 * Mock function for demo purposes
 * In production, this would read from the actual ENS resolver
 */
export function getMockPlayerClass(address) {
  // Demo addresses for testing different classes
  const mockClasses = {
    '0x1234...whale': 'whale',
    '0x5678...degen': 'degen',
  };

  // For demo, randomly assign a class 20% of the time
  const random = Math.random();
  if (random < 0.1) return 'whale';
  if (random < 0.2) return 'degen';
  
  return 'default';
}

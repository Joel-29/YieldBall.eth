import { usePublicClient } from 'wagmi';
import { normalize } from 'viem/ens';

/**
 * ENS Integration for YieldBall player classes
 * Checks the yieldball.class text record to determine player settings
 * 
 * Supported classes:
 * - whale: Large flippers, heavy ball, 0.5x yield
 * - degen: Small flippers, light ball, 2.0x yield
 * - sniper: No cooldown, fast ball, 1.2x yield
 */

export const YIELDBALL_TEXT_RECORD = 'yieldball.class';
export const VALID_CLASSES = ['whale', 'degen', 'sniper'];

/**
 * Check ENS text record for yieldball.class
 * @param {string} ensName - The ENS name to check (e.g., "vitalik.eth")
 * @returns {Promise<string|null>} - Returns 'whale', 'degen', 'sniper', or null
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
    if (VALID_CLASSES.includes(textRecord)) {
      return textRecord;
    }

    return null;
  } catch (error) {
    console.error('ENS lookup failed:', error);
    return null;
  }
}

/**
 * Resolve game physics based on ENS class
 * @param {string} ensName - The ENS name to check
 * @returns {Promise<object>} - Game physics settings
 */
export async function resolveGamePhysics(publicClient, ensName) {
  const playerClass = await checkYieldBallClass(publicClient, ensName);
  
  const physicsSettings = {
    whale: {
      flipperWidth: 160,
      ballDensity: 2.0,
      yieldMultiplier: 0.5,
      flipperCooldown: 100,
    },
    degen: {
      flipperWidth: 50,
      ballDensity: 0.5,
      yieldMultiplier: 2.0,
      flipperCooldown: 100,
    },
    sniper: {
      flipperWidth: 100,
      ballDensity: 0.8,
      yieldMultiplier: 1.2,
      flipperCooldown: 0,
      ballSpeed: 'fast',
    },
    default: {
      flipperWidth: 100,
      ballDensity: 1.0,
      yieldMultiplier: 1.0,
      flipperCooldown: 100,
    },
  };

  return {
    class: playerClass || 'default',
    physics: physicsSettings[playerClass] || physicsSettings.default,
  };
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
  // For demo, randomly assign a class 30% of the time
  const random = Math.random();
  if (random < 0.1) return 'whale';
  if (random < 0.2) return 'degen';
  if (random < 0.3) return 'sniper';
  
  return 'default';
}

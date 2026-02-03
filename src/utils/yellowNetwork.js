/**
 * Yellow Network State Channel Simulation
 * 
 * Simulates high-frequency micro-transactions for the Yellow Network prize
 * Every peg hit triggers a signed state update
 */

import { keccak256, toHex } from 'viem';

// Simulated state channel
let stateNonce = 0;
let channelBalance = 0;

/**
 * Sign a game event (Yellow Network simulation)
 * This simulates the state channel update that would occur on Yellow Network
 */
export function signGameEvent(eventData) {
  stateNonce++;
  
  // Create event payload
  const payload = {
    type: eventData.type,
    timestamp: Date.now(),
    nonce: stateNonce,
    data: eventData,
  };

  // Simulate hash generation
  const payloadString = JSON.stringify(payload);
  const hash = generateHash(payloadString);
  
  // Log Yellow Network style
  console.log(
    `%c📡 Yellow SDK: Signing State Update [${hash.slice(0, 18)}...]`,
    'color: #fbbf24; font-weight: bold;'
  );

  // Update channel balance
  if (eventData.yieldDelta) {
    channelBalance += eventData.yieldDelta;
  }

  return {
    hash,
    nonce: stateNonce,
    timestamp: payload.timestamp,
    channelBalance,
  };
}

/**
 * Sign a peg hit event
 */
export function signPegHit(pegId, hitCount, yieldAmount) {
  return signGameEvent({
    type: 'PEG_HIT',
    pegId,
    hitCount,
    yieldDelta: yieldAmount,
  });
}

/**
 * Sign a bucket landing event
 */
export function signBucketLand(bucketLabel, multiplier, finalYield) {
  return signGameEvent({
    type: 'BUCKET_LAND',
    bucket: bucketLabel,
    multiplier,
    yieldDelta: finalYield,
    isFinal: true,
  });
}

/**
 * Sign a ball drop event (session start)
 */
export function signBallDrop(ensClass) {
  stateNonce = 0; // Reset nonce for new session
  channelBalance = 0;
  
  return signGameEvent({
    type: 'SESSION_START',
    ensClass,
    principal: 100,
  });
}

/**
 * Generate a mock hash (simulates keccak256)
 */
function generateHash(data) {
  try {
    return keccak256(toHex(data));
  } catch {
    // Fallback for simple hash simulation
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return '0x' + Math.abs(hash).toString(16).padStart(64, '0');
  }
}

/**
 * Get current channel state
 */
export function getChannelState() {
  return {
    nonce: stateNonce,
    balance: channelBalance,
    isOpen: stateNonce > 0,
  };
}

/**
 * Close state channel (settlement)
 */
export function closeChannel(totalYield) {
  console.log(
    `%c📡 Yellow SDK: Closing State Channel...`,
    'color: #fbbf24; font-weight: bold;'
  );
  console.log(
    `%c✅ Final State: Nonce=${stateNonce}, Total Yield=$${totalYield.toFixed(6)}`,
    'color: #22c55e;'
  );
  
  const finalState = {
    nonce: stateNonce,
    totalYield,
    settled: true,
  };
  
  stateNonce = 0;
  channelBalance = 0;
  
  return finalState;
}

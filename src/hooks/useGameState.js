import { useState, useCallback, useEffect, useRef } from 'react';
import { PLAYER_CLASSES } from '../engine/PinballEngine.js';

/**
 * Custom hook to manage game state with Aave-style yield simulation
 */
export function useGameState() {
  const [gameState, setGameState] = useState({
    isPlaying: false,
    isDeposited: false,
    isGameOver: false,
    principal: 100,
    yieldEarned: 0,
    liveYield: 0,
    score: 0,
    bumperHits: 0,
    flashLoanHits: 0,
    playerClass: 'default',
    yieldMultiplier: 1,
    sessionStartTime: null,
    stateUpdates: [],
  });

  const animationFrameRef = useRef(null);
  const lastYieldTimeRef = useRef(0);

  // Yield accumulator using requestAnimationFrame - $0.00001 per 500ms while playing
  useEffect(() => {
    if (!gameState.isPlaying || gameState.isGameOver) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    const yieldPerInterval = 0.00001; // $0.00001 per 500ms
    const intervalMs = 500;

    const updateYield = (timestamp) => {
      if (!lastYieldTimeRef.current) {
        lastYieldTimeRef.current = timestamp;
      }

      const elapsed = timestamp - lastYieldTimeRef.current;
      
      if (elapsed >= intervalMs) {
        const intervals = Math.floor(elapsed / intervalMs);
        const yieldIncrease = yieldPerInterval * intervals * gameState.yieldMultiplier;
        
        setGameState(prev => ({
          ...prev,
          liveYield: prev.liveYield + yieldIncrease,
          yieldEarned: prev.yieldEarned + yieldIncrease,
        }));
        
        lastYieldTimeRef.current = timestamp - (elapsed % intervalMs);
      }

      animationFrameRef.current = requestAnimationFrame(updateYield);
    };

    animationFrameRef.current = requestAnimationFrame(updateYield);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState.isPlaying, gameState.isGameOver, gameState.yieldMultiplier]);

  const deposit = useCallback((playerClass = 'default') => {
    const classSettings = PLAYER_CLASSES[playerClass] || PLAYER_CLASSES.default;
    
    console.log('%c💰 Depositing 100 USDC into Aave V3 Vault...', 
      'color: #22c55e; font-weight: bold; font-size: 14px;');
    console.log('%c📡 Yellow Network: Opening state channel...', 
      'color: #fbbf24; font-size: 12px;');
    console.log(`%c🎮 Player Class: ${playerClass.toUpperCase()} (${classSettings.yieldMultiplier}x yield)`, 
      'color: #8b5cf6; font-size: 12px;');
    
    lastYieldTimeRef.current = 0;
    
    setGameState(prev => ({
      ...prev,
      isDeposited: true,
      isPlaying: true,
      isGameOver: false,
      yieldEarned: 0,
      liveYield: 0,
      score: 0,
      bumperHits: 0,
      flashLoanHits: 0,
      playerClass,
      yieldMultiplier: classSettings.yieldMultiplier,
      sessionStartTime: Date.now(),
      stateUpdates: [],
    }));
  }, []);

  const updateScore = useCallback((newScore) => {
    setGameState(prev => ({
      ...prev,
      score: newScore,
    }));
  }, []);

  const recordBumperHit = useCallback((bumperIndex, points, yieldMultiplier = 1) => {
    // Yield bonus for bumper hits based on class multiplier
    const yieldBonus = 0.0001 * yieldMultiplier;
    
    setGameState(prev => ({
      ...prev,
      bumperHits: prev.bumperHits + 1,
      yieldEarned: prev.yieldEarned + yieldBonus,
      liveYield: prev.liveYield + yieldBonus,
    }));
  }, []);

  const recordFlashLoanHit = useCallback((bonus) => {
    // Big yield bonus for flash loan ramp
    const yieldBonus = 0.001 * gameState.yieldMultiplier;
    
    setGameState(prev => ({
      ...prev,
      flashLoanHits: prev.flashLoanHits + 1,
      yieldEarned: prev.yieldEarned + yieldBonus,
      liveYield: prev.liveYield + yieldBonus,
    }));
  }, [gameState.yieldMultiplier]);

  const recordStateUpdate = useCallback((stateUpdate) => {
    setGameState(prev => ({
      ...prev,
      stateUpdates: [...prev.stateUpdates.slice(-9), stateUpdate], // Keep last 10
    }));
  }, []);

  const endGame = useCallback((finalScore) => {
    console.log('%c🏁 Game Over! Settling session...', 
      'color: #ff006e; font-weight: bold; font-size: 14px;');
    console.log('%c📡 Yellow Network: Closing state channel...', 
      'color: #fbbf24; font-size: 12px;');
    
    setGameState(prev => ({
      ...prev,
      isPlaying: false,
      isGameOver: true,
      score: finalScore,
    }));
  }, []);

  const withdraw = useCallback(() => {
    console.log('%c💸 Withdrawing from Aave V3 Vault...', 
      'color: #22c55e; font-weight: bold; font-size: 14px;');
    console.log(`%c✅ Principal Returned: $${gameState.principal.toFixed(2)}`, 
      'color: #00f5ff; font-size: 14px;');
    console.log(`%c✅ Yield Earned: $${gameState.yieldEarned.toFixed(6)}`, 
      'color: #22c55e; font-size: 14px;');
    
    setGameState({
      isPlaying: false,
      isDeposited: false,
      isGameOver: false,
      principal: 100,
      yieldEarned: 0,
      liveYield: 0,
      score: 0,
      bumperHits: 0,
      flashLoanHits: 0,
      playerClass: 'default',
      yieldMultiplier: 1,
      sessionStartTime: null,
      stateUpdates: [],
    });
  }, [gameState.principal, gameState.yieldEarned]);

  return {
    gameState,
    deposit,
    updateScore,
    recordBumperHit,
    recordFlashLoanHit,
    recordStateUpdate,
    endGame,
    withdraw,
  };
}

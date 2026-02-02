import { useState, useCallback, useEffect } from 'react';

/**
 * Custom hook to manage game state
 */
export function useGameState() {
  const [gameState, setGameState] = useState({
    isPlaying: false,
    isDeposited: false,
    isGameOver: false,
    principal: 100,
    yieldEarned: 0,
    score: 0,
    bumperHits: 0,
    playerClass: 'default',
    sessionStartTime: null,
  });

  // Yield accumulator - $0.0001 per second while playing
  useEffect(() => {
    let interval;
    
    if (gameState.isPlaying && !gameState.isGameOver) {
      interval = setInterval(() => {
        setGameState(prev => ({
          ...prev,
          yieldEarned: prev.yieldEarned + 0.0001,
        }));
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gameState.isPlaying, gameState.isGameOver]);

  const deposit = useCallback((playerClass = 'default') => {
    console.log('%c💰 Depositing 100 USDC into YieldBall Vault...', 
      'color: #22c55e; font-weight: bold; font-size: 14px;');
    console.log('%c📡 Yellow Network: Opening state channel...', 
      'color: #fbbf24; font-size: 12px;');
    
    setGameState(prev => ({
      ...prev,
      isDeposited: true,
      isPlaying: true,
      isGameOver: false,
      yieldEarned: 0,
      score: 0,
      bumperHits: 0,
      playerClass,
      sessionStartTime: Date.now(),
    }));
  }, []);

  const updateScore = useCallback((newScore) => {
    setGameState(prev => ({
      ...prev,
      score: newScore,
    }));
  }, []);

  const recordBumperHit = useCallback((bumperIndex, points) => {
    setGameState(prev => ({
      ...prev,
      bumperHits: prev.bumperHits + 1,
      // Bonus yield for bumper hits
      yieldEarned: prev.yieldEarned + 0.0005,
    }));
  }, []);

  const endGame = useCallback((finalScore) => {
    console.log('%c🏁 Game Over! Settling session...', 
      'color: #ff006e; font-weight: bold; font-size: 14px;');
    
    setGameState(prev => ({
      ...prev,
      isPlaying: false,
      isGameOver: true,
      score: finalScore,
    }));
  }, []);

  const withdraw = useCallback(() => {
    console.log('%c💸 Withdrawing funds from YieldBall Vault...', 
      'color: #22c55e; font-weight: bold; font-size: 14px;');
    console.log(`%c✅ Withdrawn: $${(gameState.principal + gameState.yieldEarned).toFixed(4)}`, 
      'color: #00f5ff; font-size: 14px;');
    
    setGameState({
      isPlaying: false,
      isDeposited: false,
      isGameOver: false,
      principal: 100,
      yieldEarned: 0,
      score: 0,
      bumperHits: 0,
      playerClass: 'default',
      sessionStartTime: null,
    });
  }, [gameState.principal, gameState.yieldEarned]);

  return {
    gameState,
    deposit,
    updateScore,
    recordBumperHit,
    endGame,
    withdraw,
  };
}

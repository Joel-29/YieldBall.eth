import React, { useRef, useEffect, useCallback } from 'react';
import { PinballEngine } from '../engine/PinballEngine.js';
import { GameHUD, ControlsHint } from './GameHUD.jsx';

export function PinballGame({ 
  playerClass = 'default',
  onBumperHit,
  onFlashLoanRamp,
  onDrain,
  onScoreUpdate,
  onStateUpdate,
  score,
  yieldEarned,
  principal,
  yieldMultiplier,
  isPlaying,
  engineRef,
}) {
  const containerRef = useRef(null);
  const gameEngineRef = useRef(null);

  const handleBumperHit = useCallback((bumperIndex, points, multiplier) => {
    if (onBumperHit) {
      onBumperHit(bumperIndex, points, multiplier);
    }
  }, [onBumperHit]);

  const handleFlashLoanRamp = useCallback((bonus) => {
    if (onFlashLoanRamp) {
      onFlashLoanRamp(bonus);
    }
  }, [onFlashLoanRamp]);

  const handleDrain = useCallback((finalScore) => {
    if (onDrain) {
      onDrain(finalScore);
    }
  }, [onDrain]);

  const handleScoreUpdate = useCallback((newScore) => {
    if (onScoreUpdate) {
      onScoreUpdate(newScore);
    }
  }, [onScoreUpdate]);

  const handleStateUpdate = useCallback((stateData) => {
    if (onStateUpdate) {
      onStateUpdate(stateData);
    }
  }, [onStateUpdate]);

  useEffect(() => {
    if (!containerRef.current || !isPlaying) return;

    // Clear any existing canvas
    containerRef.current.innerHTML = '';

    // Create new engine with 400x600 canvas
    gameEngineRef.current = new PinballEngine(containerRef.current, {
      width: 400,
      height: 600,
      playerClass,
      onBumperHit: handleBumperHit,
      onFlashLoanRamp: handleFlashLoanRamp,
      onDrain: handleDrain,
      onScoreUpdate: handleScoreUpdate,
      onStateUpdate: handleStateUpdate,
    });

    // Expose engine ref for external control
    if (engineRef) {
      engineRef.current = gameEngineRef.current;
    }

    // Cleanup
    return () => {
      if (gameEngineRef.current) {
        gameEngineRef.current.destroy();
        gameEngineRef.current = null;
      }
    };
  }, [isPlaying, playerClass, handleBumperHit, handleFlashLoanRamp, handleDrain, handleScoreUpdate, handleStateUpdate, engineRef]);

  if (!isPlaying) {
    return null;
  }

  return (
    <div className="relative">
      {/* Game HUD */}
      <GameHUD 
        score={score}
        yieldEarned={yieldEarned}
        principal={principal}
        playerClass={playerClass}
        yieldMultiplier={yieldMultiplier}
        isPlaying={isPlaying}
      />
      
      {/* Pinball Canvas Container - 400x600 as per spec */}
      <div 
        ref={containerRef}
        className="relative rounded-xl overflow-hidden border-4 border-neon-purple/50 shadow-neon-purple"
        style={{ 
          width: 400, 
          height: 600,
          background: 'linear-gradient(180deg, #020617 0%, #0f172a 100%)'
        }}
      />
      
      {/* Controls Hint */}
      <ControlsHint playerClass={playerClass} />
      
      {/* Mobile Flipper Buttons */}
      <div className="flex justify-between mt-4 md:hidden">
        <button 
          className="w-28 h-14 bg-neon-pink/30 border-2 border-neon-pink rounded-lg text-neon-pink font-arcade text-xs active:bg-neon-pink/50"
          onTouchStart={() => gameEngineRef.current?.flipLeft()}
        >
          LEFT
        </button>
        <button 
          className="w-28 h-14 bg-neon-cyan/30 border-2 border-neon-cyan rounded-lg text-neon-cyan font-arcade text-xs active:bg-neon-cyan/50"
          onTouchStart={() => gameEngineRef.current?.flipRight()}
        >
          RIGHT
        </button>
      </div>
    </div>
  );
}

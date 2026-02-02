import React, { useRef, useEffect, useCallback } from 'react';
import { PinballEngine } from '../engine/PinballEngine.js';
import { GameHUD, ControlsHint } from './GameHUD.jsx';

export function PinballGame({ 
  playerClass = 'default',
  onBumperHit,
  onDrain,
  onScoreUpdate,
  score,
  yieldEarned,
  principal,
  isPlaying,
  engineRef,
}) {
  const containerRef = useRef(null);
  const gameEngineRef = useRef(null);

  const handleBumperHit = useCallback((bumperIndex, points) => {
    if (onBumperHit) {
      onBumperHit(bumperIndex, points);
    }
  }, [onBumperHit]);

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

  useEffect(() => {
    if (!containerRef.current || !isPlaying) return;

    // Clear any existing canvas
    containerRef.current.innerHTML = '';

    // Create new engine
    gameEngineRef.current = new PinballEngine(containerRef.current, {
      width: 500,
      height: 700,
      playerClass,
      onBumperHit: handleBumperHit,
      onDrain: handleDrain,
      onScoreUpdate: handleScoreUpdate,
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
  }, [isPlaying, playerClass, handleBumperHit, handleDrain, handleScoreUpdate, engineRef]);

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
        isPlaying={isPlaying}
      />
      
      {/* Pinball Canvas Container */}
      <div 
        ref={containerRef}
        className="relative rounded-xl overflow-hidden border-4 border-neon-purple/50 shadow-neon-purple"
        style={{ 
          width: 500, 
          height: 700,
          background: 'linear-gradient(180deg, #0f172a 0%, #020617 100%)'
        }}
      />
      
      {/* Controls Hint */}
      <ControlsHint playerClass={playerClass} />
      
      {/* Mobile Flipper Buttons */}
      <div className="flex justify-between mt-4 md:hidden">
        <button 
          className="w-32 h-16 bg-neon-pink/30 border-2 border-neon-pink rounded-lg text-neon-pink font-arcade text-xs active:bg-neon-pink/50"
          onTouchStart={() => gameEngineRef.current?.flipLeft()}
        >
          LEFT
        </button>
        <button 
          className="w-32 h-16 bg-neon-cyan/30 border-2 border-neon-cyan rounded-lg text-neon-cyan font-arcade text-xs active:bg-neon-cyan/50"
          onTouchStart={() => gameEngineRef.current?.flipRight()}
        >
          RIGHT
        </button>
      </div>
    </div>
  );
}

import React, { useRef, useEffect, useCallback, useMemo } from 'react';
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
  const touchAreaRef = useRef(null);
  const initializedRef = useRef(false);

  // Store callbacks in refs to avoid re-creating the engine
  const callbacksRef = useRef({
    onBumperHit,
    onFlashLoanRamp,
    onDrain,
    onScoreUpdate,
    onStateUpdate,
  });

  // Update refs when callbacks change (without triggering re-render)
  useEffect(() => {
    callbacksRef.current = {
      onBumperHit,
      onFlashLoanRamp,
      onDrain,
      onScoreUpdate,
      onStateUpdate,
    };
  }, [onBumperHit, onFlashLoanRamp, onDrain, onScoreUpdate, onStateUpdate]);

  // Stable callback wrappers
  const handleBumperHit = useCallback((bumperIndex, points, multiplier) => {
    callbacksRef.current.onBumperHit?.(bumperIndex, points, multiplier);
  }, []);

  const handleFlashLoanRamp = useCallback((bonus) => {
    callbacksRef.current.onFlashLoanRamp?.(bonus);
  }, []);

  const handleDrain = useCallback((finalScore) => {
    callbacksRef.current.onDrain?.(finalScore);
  }, []);

  const handleScoreUpdate = useCallback((newScore) => {
    callbacksRef.current.onScoreUpdate?.(newScore);
  }, []);

  const handleStateUpdate = useCallback((stateData) => {
    callbacksRef.current.onStateUpdate?.(stateData);
  }, []);

  // Mobile touch handler - tap left/right half of screen
  const handleTouch = useCallback((e) => {
    if (!gameEngineRef.current || !touchAreaRef.current) return;
    
    const rect = touchAreaRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const midpoint = rect.width / 2;
    
    if (x < midpoint) {
      gameEngineRef.current.flipLeft();
    } else {
      gameEngineRef.current.flipRight();
    }
  }, []);

  // Double tap to launch
  const lastTapRef = useRef(0);
  const handleTouchEnd = useCallback((e) => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      // Double tap - launch ball
      if (gameEngineRef.current) {
        gameEngineRef.current.launchBall();
      }
    }
    lastTapRef.current = now;
  }, []);

  useEffect(() => {
    // Only initialize once when isPlaying becomes true
    if (!containerRef.current || !isPlaying || initializedRef.current) return;

    // Mark as initialized
    initializedRef.current = true;

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
      initializedRef.current = false;
    };
  }, [isPlaying]); // Only depend on isPlaying

  if (!isPlaying) {
    return null;
  }

  // Get class display info
  const classInfo = {
    whale: { label: '🐋 Whale Mode', color: 'neon-cyan', desc: '1.5x Flippers' },
    degen: { label: '🔥 Degen Mode', color: 'neon-pink', desc: '2x Yield!' },
    sniper: { label: '🎯 Sniper Mode', color: 'neon-green', desc: '1.2x Yield' },
    default: { label: '⚡ Standard Mode', color: 'neon-purple', desc: '1x Yield' },
  };
  const currentClass = classInfo[playerClass] || classInfo.default;

  return (
    <div className="relative">
      {/* ENS Class Badge - Top Center */}
      <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-20">
        <div className={`px-4 py-2 rounded-full border-2 border-${currentClass.color}/60 bg-cyber-darker/90 backdrop-blur-sm`}>
          <span className={`text-${currentClass.color} font-arcade text-xs`}>
            {currentClass.label}
          </span>
          <span className="text-gray-400 font-cyber text-xs ml-2">
            {currentClass.desc}
          </span>
        </div>
      </div>

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
      {/* Touch area for mobile - tap left/right to flip, double-tap to launch */}
      <div 
        ref={(el) => { containerRef.current = el; touchAreaRef.current = el; }}
        className="relative rounded-xl overflow-hidden border-4 border-neon-purple/50 shadow-neon-purple touch-none"
        style={{ 
          width: 400, 
          height: 600,
          background: 'linear-gradient(180deg, #020617 0%, #0f172a 100%)'
        }}
        onTouchStart={handleTouch}
        onTouchEnd={handleTouchEnd}
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

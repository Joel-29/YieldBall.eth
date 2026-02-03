import React, { useRef, useEffect, useState, useCallback } from 'react';
import { PachinkoEngine, BUCKETS } from '../engine/PachinkoEngine.js';
import { signPegHit, signBallDrop, signBucketLand, closeChannel } from '../utils/yellowNetwork.js';
import { Coins, Zap, TrendingUp, User } from 'lucide-react';

export function PachinkoGame({ 
  ensClass = 'default',
  ensName,
  ensAvatar,
  ballConfig,
  onSettlement,
}) {
  const containerRef = useRef(null);
  const engineRef = useRef(null);
  const yieldIntervalRef = useRef(null);
  const initializedRef = useRef(false);

  // Game state
  const [isPlaying, setIsPlaying] = useState(false);
  const [liveYield, setLiveYield] = useState(0);
  const [pegHits, setPegHits] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState(null);

  // Yield accumulation: $0.0001 per second while ball is in play
  useEffect(() => {
    if (!isPlaying) {
      if (yieldIntervalRef.current) {
        clearInterval(yieldIntervalRef.current);
        yieldIntervalRef.current = null;
      }
      return;
    }

    yieldIntervalRef.current = setInterval(() => {
      setLiveYield(prev => prev + 0.0001 * ballConfig.yieldMultiplier);
    }, 1000);

    return () => {
      if (yieldIntervalRef.current) {
        clearInterval(yieldIntervalRef.current);
      }
    };
  }, [isPlaying, ballConfig.yieldMultiplier]);

  // Handle peg hit - add $0.005 and sign state update
  const handlePegHit = useCallback((hitCount, pegId) => {
    const yieldAmount = 0.005 * ballConfig.yieldMultiplier;
    setLiveYield(prev => prev + yieldAmount);
    setPegHits(hitCount);
    
    // Yellow Network: Sign state update for each peg hit
    signPegHit(pegId, hitCount, yieldAmount);
  }, [ballConfig.yieldMultiplier]);

  // Handle bucket landing
  const handleBucketLand = useCallback((bucketData, totalPegHits) => {
    setIsPlaying(false);
    
    // Calculate final yield with bucket multiplier
    setLiveYield(prev => {
      const finalYield = prev * bucketData.multiplier;
      
      // Yellow Network: Sign final state and close channel
      signBucketLand(bucketData.label, bucketData.multiplier, finalYield);
      const channelState = closeChannel(finalYield);
      
      // Trigger settlement modal
      setTimeout(() => {
        onSettlement({
          bucket: bucketData,
          pegHits: totalPegHits,
          baseYield: prev,
          finalYield,
          multiplier: bucketData.multiplier,
          channelState,
          sessionDuration: sessionStartTime ? (Date.now() - sessionStartTime) / 1000 : 0,
        });
      }, 500);
      
      return finalYield;
    });
  }, [onSettlement, sessionStartTime]);

  // Handle ball drop
  const handleBallDrop = useCallback(() => {
    setIsPlaying(true);
    setLiveYield(0);
    setPegHits(0);
    setSessionStartTime(Date.now());
    
    // Yellow Network: Sign session start
    signBallDrop(ensClass);
  }, [ensClass]);

  // Initialize engine
  useEffect(() => {
    if (!containerRef.current || initializedRef.current) return;
    
    initializedRef.current = true;
    containerRef.current.innerHTML = '';

    engineRef.current = new PachinkoEngine(containerRef.current, {
      ensClass,
      onPegHit: handlePegHit,
      onBucketLand: handleBucketLand,
      onBallDrop: handleBallDrop,
    });

    return () => {
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
      initializedRef.current = false;
    };
  }, []);

  // Update engine when ENS class changes
  useEffect(() => {
    if (engineRef.current && ensClass) {
      engineRef.current.setEnsClass(ensClass);
    }
  }, [ensClass]);

  return (
    <div className="relative">
      {/* HUD - Top Bar */}
      <div className="absolute -top-16 left-0 right-0 flex justify-center z-20">
        <div className="bg-cyber-darker/95 backdrop-blur-md border-2 border-neon-purple/60 rounded-full px-6 py-3 shadow-lg shadow-neon-purple/20">
          <div className="flex items-center gap-6">
            {/* Principal */}
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-neon-cyan" />
              <span className="text-gray-400 font-cyber text-sm">Principal:</span>
              <span className="text-white font-arcade">100</span>
              <span className="text-gray-500 font-cyber text-xs">USDC</span>
              <span className="text-neon-green text-xs font-cyber">(Locked)</span>
            </div>
            
            <div className="w-px h-6 bg-neon-purple/40" />
            
            {/* Live Yield */}
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-neon-green" />
              <span className="text-gray-400 font-cyber text-sm">Yield:</span>
              <span className="text-neon-cyan font-arcade text-lg">
                ${liveYield.toFixed(6)}
              </span>
              {ballConfig.yieldMultiplier > 1 && (
                <span className="text-neon-pink text-xs font-cyber font-bold bg-neon-pink/20 px-2 py-0.5 rounded">
                  {ballConfig.yieldMultiplier}x
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ENS Identity Badge - Left */}
      <div className="absolute top-2 left-2 z-20">
        <div className="bg-cyber-darker/90 backdrop-blur-sm border border-neon-purple/50 rounded-lg p-3">
          <div className="flex items-center gap-3">
            {ensAvatar ? (
              <img 
                src={ensAvatar} 
                alt="ENS Avatar" 
                className="w-10 h-10 rounded-full border-2 border-neon-purple"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-neon-purple/20 flex items-center justify-center border-2 border-neon-purple/50">
                <User className="w-5 h-5 text-neon-purple" />
              </div>
            )}
            <div>
              <p className="text-xs text-gray-500 font-cyber">Player</p>
              <p className="text-neon-purple font-cyber text-sm">
                {ensName || 'Anonymous'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Ball Class Badge - Right */}
      <div className="absolute top-2 right-2 z-20">
        <div className="bg-cyber-darker/90 backdrop-blur-sm border border-neon-pink/50 rounded-lg p-3 text-right">
          <p className="text-xs text-gray-500 font-cyber">ENS Class</p>
          <p className="font-arcade text-sm" style={{ color: ballConfig.color }}>
            {ballConfig.label}
          </p>
          <p className="text-xs text-gray-400 font-cyber mt-1">
            {ballConfig.description}
          </p>
        </div>
      </div>

      {/* Peg Hit Counter */}
      {isPlaying && (
        <div className="absolute top-20 left-2 z-20">
          <div className="bg-cyber-darker/90 backdrop-blur-sm border border-neon-cyan/50 rounded-lg p-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-neon-yellow" />
              <span className="text-gray-400 font-cyber text-xs">Bounces:</span>
              <span className="text-neon-yellow font-arcade">{pegHits}</span>
            </div>
          </div>
        </div>
      )}

      {/* Game Canvas */}
      <div 
        ref={containerRef}
        className="rounded-xl overflow-hidden border-4 border-neon-purple/50 shadow-lg shadow-neon-purple/20"
        style={{ 
          width: 500, 
          height: 700,
          background: 'linear-gradient(180deg, #020617 0%, #0f172a 100%)',
          cursor: isPlaying ? 'default' : 'pointer',
        }}
      />

      {/* Bucket Labels */}
      <div className="flex mt-2">
        {BUCKETS.map((bucket, i) => (
          <div 
            key={i}
            className="flex-1 text-center py-2 rounded-lg mx-0.5"
            style={{ 
              backgroundColor: bucket.color + '20',
              borderColor: bucket.color,
              borderWidth: 1,
            }}
          >
            <p className="font-cyber text-xs" style={{ color: bucket.color }}>
              {bucket.label}
            </p>
            <p className="font-arcade text-sm text-white">{bucket.multiplier}x</p>
          </div>
        ))}
      </div>
    </div>
  );
}

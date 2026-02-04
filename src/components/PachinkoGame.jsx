import React, { useRef, useEffect, useState, useCallback } from 'react';
import { PachinkoEngine, BUCKETS } from '../engine/PachinkoEngine.js';
import { signPegHit, signBallDrop, signBucketLand, closeChannel } from '../utils/yellowNetwork.js';
import { Coins, Zap, TrendingUp, User, Rocket, Fish } from 'lucide-react';
import { ShinyText, ShinyBadge, GlassmorphicCard } from './ui/ShinyText.jsx';

// ENS Class icons
const CLASS_ICONS = {
  whale: '🐋',
  degen: '🚀',
  default: '⚡',
};

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
  const [isPegHitFlash, setIsPegHitFlash] = useState(false);

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

  // Handle peg hit - add $0.005 and sign state update + WARP EFFECT
  const handlePegHit = useCallback((hitCount, pegId) => {
    const yieldAmount = 0.005 * ballConfig.yieldMultiplier;
    setLiveYield(prev => prev + yieldAmount);
    setPegHits(hitCount);
    
    // Trigger Galaxy warp speed effect
    if (typeof window.triggerGalaxyWarp === 'function') {
      window.triggerGalaxyWarp();
    }
    
    // Flash effect for yield counter
    setIsPegHitFlash(true);
    setTimeout(() => setIsPegHitFlash(false), 200);
    
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
    <div className="relative z-10">
      {/* HUD - Top Bar with Glassmorphism */}
      <div className="absolute -top-16 left-0 right-0 flex justify-center z-20">
        <GlassmorphicCard 
          className="px-6 py-3 rounded-full"
          glowColor="#8b5cf6"
        >
          <div className="flex items-center gap-6">
            {/* Principal */}
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-neon-cyan" />
              <span className="text-gray-400 font-mono text-sm">Principal:</span>
              <ShinyText variant="silver" className="font-arcade">100</ShinyText>
              <span className="text-gray-500 font-mono text-xs">USDC</span>
              <span className="text-neon-green text-xs font-mono">(Locked)</span>
            </div>
            
            <div className="w-px h-6 bg-neon-purple/40" />
            
            {/* Live Yield with Shiny Gold Effect + Flash on hit */}
            <div className={`flex items-center gap-2 transition-all duration-200 ${isPegHitFlash ? 'scale-110' : 'scale-100'}`}>
              <TrendingUp className={`w-4 h-4 ${isPegHitFlash ? 'text-neon-yellow' : 'text-neon-green'}`} />
              <span className="text-gray-400 font-mono text-sm">Yield:</span>
              <ShinyText 
                variant="gold" 
                speed={isPegHitFlash ? 'fast' : 'normal'}
                className={`font-arcade text-lg ${isPegHitFlash ? 'animate-pulse-yield' : ''}`}
              >
                ${liveYield.toFixed(4)}
              </ShinyText>
              {ballConfig.yieldMultiplier > 1 && (
                <ShinyBadge variant="pink" glowColor="#ff006e">
                  {ballConfig.yieldMultiplier}x
                </ShinyBadge>
              )}
            </div>
          </div>
        </GlassmorphicCard>
      </div>

      {/* ENS Identity Badge - Left with Glassmorphism */}
      <div className="absolute top-2 left-2 z-20">
        <GlassmorphicCard className="p-3 backdrop-blur-lg bg-white/10" glowColor="#8b5cf6">
          <div className="flex items-center gap-3">
            {ensAvatar ? (
              <img 
                src={ensAvatar} 
                alt="ENS Avatar" 
                className="w-10 h-10 rounded-full border-2 border-neon-purple shadow-neon-purple"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-neon-purple/20 flex items-center justify-center border-2 border-neon-purple/50">
                <User className="w-5 h-5 text-neon-purple" />
              </div>
            )}
            <div>
              <p className="text-xs text-gray-500 font-mono uppercase tracking-wider">Player</p>
              <ShinyText variant="purple" className="font-mono text-sm">
                {ensName || 'Anonymous'}
              </ShinyText>
            </div>
          </div>
        </GlassmorphicCard>
      </div>

      {/* ENS Class Badge - Right with Shiny Neon Text & Icon */}
      <div className="absolute top-2 right-2 z-20">
        <GlassmorphicCard className="p-3 text-right backdrop-blur-lg bg-white/10" glowColor={ballConfig.color}>
          <div className="flex items-center justify-end gap-2">
            <span className="text-2xl">{CLASS_ICONS[ensClass] || CLASS_ICONS.default}</span>
            <div>
              <p className="text-xs text-gray-500 font-mono uppercase tracking-wider">ENS Class</p>
              <ShinyText 
                variant={ensClass === 'whale' ? 'gold' : ensClass === 'degen' ? 'pink' : 'cyan'}
                speed="fast"
                className="font-arcade text-sm block"
              >
                {ensClass.toUpperCase()}
              </ShinyText>
            </div>
          </div>
        </GlassmorphicCard>
      </div>

      {/* Peg Hit Counter */}
      {isPlaying && (
        <div className="absolute top-20 left-2 z-20">
          <GlassmorphicCard className="p-2" glowColor="#fbbf24">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-neon-yellow" />
              <span className="text-gray-400 font-mono text-xs">Bounces:</span>
              <ShinyText variant="gold" speed="fast" className="font-arcade">
                {pegHits}
              </ShinyText>
            </div>
          </GlassmorphicCard>
        </div>
      )}

      {/* Game Canvas with transparent background */}
      <div 
        ref={containerRef}
        className="rounded-xl overflow-hidden border-2 border-white/10 shadow-glass"
        style={{ 
          width: 500, 
          height: 700,
          background: 'linear-gradient(180deg, rgba(2,6,23,0.9) 0%, rgba(15,23,42,0.9) 100%)',
          cursor: isPlaying ? 'default' : 'pointer',
        }}
      />

      {/* Bucket Labels with Animated Glow */}
      <div className="flex mt-3 gap-1">
        {BUCKETS.map((bucket, i) => (
          <div 
            key={i}
            className="relative flex-1 text-center py-2 rounded-lg overflow-hidden"
            style={{ 
              backgroundColor: 'rgba(255,255,255,0.03)',
              border: `1px solid ${bucket.color}40`,
            }}
          >
            {/* Pulsing glow background */}
            <div 
              className="absolute inset-0 animate-bucket-glow"
              style={{ 
                background: `radial-gradient(ellipse at center, ${bucket.color}30 0%, transparent 70%)`,
              }}
            />
            
            {/* Bucket content */}
            <div className="relative z-10">
              <p className="font-mono text-xs uppercase tracking-wider" style={{ color: bucket.color }}>
                {bucket.label}
              </p>
              <ShinyText 
                variant={bucket.multiplier >= 5 ? 'pink' : bucket.multiplier >= 2 ? 'gold' : 'silver'}
                speed="normal"
                className="font-arcade text-sm"
              >
                {bucket.multiplier}x
              </ShinyText>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

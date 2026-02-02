import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { NeonText } from './ui/NeonElements.jsx';

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-cyber-dark/90 backdrop-blur-md border-b border-neon-purple/30">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-pink to-neon-purple flex items-center justify-center shadow-neon-pink">
              <span className="text-xl">🎱</span>
            </div>
            <div className="absolute -inset-1 rounded-full bg-neon-pink/30 blur-md -z-10 animate-pulse" />
          </div>
          <div>
            <h1 className="font-arcade text-xl tracking-wider">
              <NeonText color="pink">Yield</NeonText>
              <NeonText color="cyan">Ball</NeonText>
              <span className="text-neon-purple">.eth</span>
            </h1>
            <p className="text-gray-500 text-xs font-cyber">Web3 Pinball</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="#" className="text-gray-400 hover:text-neon-cyan font-cyber text-sm transition-colors">
            Leaderboard
          </a>
          <a href="#" className="text-gray-400 hover:text-neon-cyan font-cyber text-sm transition-colors">
            How It Works
          </a>
          <a href="#" className="text-gray-400 hover:text-neon-cyan font-cyber text-sm transition-colors">
            Docs
          </a>
        </nav>

        {/* Wallet Connect */}
        <div className="flex items-center gap-4">
          <ConnectButton 
            chainStatus="icon"
            accountStatus={{
              smallScreen: 'avatar',
              largeScreen: 'full',
            }}
            showBalance={{
              smallScreen: false,
              largeScreen: true,
            }}
          />
        </div>
      </div>
    </header>
  );
}

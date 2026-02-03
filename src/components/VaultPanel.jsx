import React, { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useEnsName, usePublicClient } from 'wagmi';
import { NeonButton, NeonCard, NeonText } from './ui/NeonElements.jsx';
import { checkYieldBallClass, getMockPlayerClass } from '../utils/ensIntegration.js';

export function VaultPanel({ onDeposit, isDeposited, isConnected }) {
  const { address } = useAccount();
  const { data: ensName } = useEnsName({ address });
  const publicClient = usePublicClient();
  const [isLoading, setIsLoading] = useState(false);
  const [detectedClass, setDetectedClass] = useState(null);

  const handleDeposit = async () => {
    setIsLoading(true);
    
    try {
      // Check ENS for player class
      let playerClass = 'default';
      
      if (ensName) {
        const ensClass = await checkYieldBallClass(publicClient, ensName);
        if (ensClass) {
          playerClass = ensClass;
          setDetectedClass(ensClass);
        }
      } else {
        // For demo: use mock class detection
        playerClass = getMockPlayerClass(address);
        if (playerClass !== 'default') {
          setDetectedClass(playerClass);
        }
      }

      // Simulate contract interaction delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log(`%c🎮 Player Class: ${playerClass.toUpperCase()}`, 
        'color: #8b5cf6; font-weight: bold; font-size: 16px;');
      
      onDeposit(playerClass);
    } catch (error) {
      console.error('Deposit failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <NeonCard glow="purple" className="max-w-md w-full">
      <div className="text-center mb-6">
        <h2 className="font-arcade text-lg mb-2">
          <NeonText color="cyan">THE VAULT</NeonText>
        </h2>
        <p className="text-gray-400 text-sm font-cyber">
          Deposit USDC to start playing and earning yield
        </p>
      </div>

      {/* Vault Info */}
      <div className="bg-cyber-dark rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center mb-3">
          <span className="text-gray-500 font-cyber text-sm">Deposit Amount</span>
          <span className="text-white font-cyber text-xl">100 USDC</span>
        </div>
        <div className="flex justify-between items-center mb-3">
          <span className="text-gray-500 font-cyber text-sm">APY</span>
          <NeonText color="cyan" className="font-cyber">~3.15%</NeonText>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500 font-cyber text-sm">Yield Rate</span>
          <span className="text-neon-green font-cyber">$0.0001/sec</span>
        </div>
      </div>

      {/* ENS Class Info */}
      {ensName && (
        <div className="bg-neon-purple/10 border border-neon-purple/30 rounded-lg p-3 mb-6">
          <p className="text-neon-purple text-xs font-cyber">
            🔗 Connected: {ensName}
          </p>
          <p className="text-gray-400 text-xs font-cyber mt-1">
            Checking yieldball.class text record...
          </p>
        </div>
      )}

      {detectedClass && detectedClass !== 'default' && (
        <div className={`border rounded-lg p-3 mb-6 ${
          detectedClass === 'whale' 
            ? 'bg-neon-cyan/10 border-neon-cyan/30' 
            : 'bg-neon-pink/10 border-neon-pink/30'
        }`}>
          <p className={`text-xs font-cyber font-bold ${
            detectedClass === 'whale' ? 'text-neon-cyan' : 'text-neon-pink'
          }`}>
            🎯 {detectedClass.toUpperCase()} CLASS DETECTED!
          </p>
          <p className="text-gray-400 text-xs font-cyber mt-1">
            {detectedClass === 'whale' 
              ? 'Large flippers, slow ball - Easy mode!' 
              : 'Small flippers, fast ball - 2x Multiplier!'}
          </p>
        </div>
      )}

      {/* Connect or Deposit Button */}
      {!isConnected ? (
        <div className="flex justify-center">
          <ConnectButton />
        </div>
      ) : (
        <NeonButton 
          onClick={handleDeposit}
          variant="pink"
          size="lg"
          className="w-full"
          disabled={isLoading || isDeposited}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">⚡</span>
              Processing...
            </span>
          ) : isDeposited ? (
            'Already Deposited'
          ) : (
            '🎮 Insert Coin (100 USDC)'
          )}
        </NeonButton>
      )}

      {/* Yellow Network Badge */}
      <div className="mt-6 pt-4 border-t border-gray-800 text-center">
        <p className="text-gray-600 text-xs font-cyber">
          Powered by
        </p>
        <p className="text-neon-yellow text-sm font-cyber font-bold">
          ⚡ Yellow Network State Channels
        </p>
      </div>
    </NeonCard>
  );
}

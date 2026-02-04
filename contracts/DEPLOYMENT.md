# YieldBall Demo Token System

## 🎮 Overview

This is a **hackathon demo** setup for rewarding players with ERC-20 tokens when they win the YieldBall game.

**Flow:** Win Game → Claim Reward → 10 YBT tokens sent to MetaMask

---

## 📦 Contracts

### 1. YieldBallToken (YBT)
- **File:** `contracts/YieldBallToken.sol`
- **Type:** Simple ERC-20 token
- **Name:** YieldBall Token
- **Symbol:** YBT
- **Decimals:** 18
- **Initial Supply:** 1,000,000 YBT (minted to deployer)

### 2. YieldBallGame
- **File:** `contracts/YieldBallGame.sol`
- **Type:** Game reward contract
- **Reward:** 10 YBT per win
- **Function:** `rewardWinner(address player)` - mints tokens to winner

---

## 🚀 Deployment Steps (Base Sepolia)

### Prerequisites
- MetaMask with Base Sepolia network
- Some Base Sepolia ETH for gas (get from [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet))
- [Remix IDE](https://remix.ethereum.org) for deployment

### Step 1: Deploy YieldBallToken

1. Open [Remix IDE](https://remix.ethereum.org)
2. Create new file: `YieldBallToken.sol`
3. Copy contents from `contracts/YieldBallToken.sol`
4. Compile with Solidity ^0.8.20
5. Deploy:
   - Environment: "Injected Provider - MetaMask"
   - Network: Base Sepolia (Chain ID: 84532)
   - Click "Deploy"
6. **Save the deployed contract address!** (e.g., `0xYBT_TOKEN_ADDRESS...`)

### Step 2: Deploy YieldBallGame

1. Create new file in Remix: `YieldBallGame.sol`
2. Copy contents from `contracts/YieldBallGame.sol`
3. Compile with Solidity ^0.8.20
4. Deploy with constructor argument:
   - `_tokenAddress`: The YBT token address from Step 1
5. **Save the deployed contract address!** (e.g., `0xGAME_ADDRESS...`)

### Step 3: Link Token to Game

1. In Remix, go to the deployed **YieldBallToken** contract
2. Call `setGameContract` with the **YieldBallGame** address
3. This allows the game contract to mint tokens

### Step 4: Update Frontend Config

Edit `src/config/wagmi.js`:

```javascript
// Replace null with your deployed addresses:
export const YBT_TOKEN_ADDRESS = '0xYOUR_TOKEN_ADDRESS_HERE';
export const GAME_CONTRACT_ADDRESS = '0xYOUR_GAME_ADDRESS_HERE';
```

---

## 🦊 Adding YBT to MetaMask

After deployment, players can add the token to MetaMask:

1. Open MetaMask
2. Click "Import tokens"
3. Select "Custom token"
4. Paste the **YBT Token Address** (from Step 1)
5. Symbol: YBT, Decimals: 18 (should auto-fill)
6. Click "Add Custom Token"

---

## 🎯 How It Works

### In the Game:
1. Player plays YieldBall and the ball lands in a bucket
2. Settlement modal shows with game results
3. **"Claim 10 YBT Tokens"** button appears
4. Player clicks → MetaMask popup → Confirm transaction
5. 10 YBT tokens minted to player's wallet
6. Visible in MetaMask under tokens

### On-Chain Flow:
```
Player Wallet → calls Game.rewardWinner(player)
                      ↓
              Game Contract → calls Token.mint(player, 10e18)
                                      ↓
                              10 YBT minted to player
                              Transfer event emitted
```

---

## 🔧 Contract Functions

### YieldBallToken
| Function | Description |
|----------|-------------|
| `transfer(to, amount)` | Standard ERC-20 transfer |
| `balanceOf(account)` | Get token balance |
| `mint(to, amount)` | Mint tokens (owner or game only) |
| `setGameContract(addr)` | Set authorized game contract |

### YieldBallGame
| Function | Description |
|----------|-------------|
| `rewardWinner(player)` | Mints 10 YBT to player |
| `getPlayerStats(player)` | Returns (wins, totalRewards) |
| `setTokenAddress(addr)` | Update token contract |

---

## ⚠️ Important Notes

1. **This is a DEMO** - Not production-ready!
2. **Minting is permissioned** - Only owner or game contract can mint
3. **Base Sepolia only** - Testnet tokens have no value
4. **Gas costs** - Players pay gas to claim rewards

---

## 🧪 Testing Locally

```bash
# Start the frontend
cd yieldball
npm install
npm run dev

# Play the game, win, click "Claim Tokens"
# Check MetaMask for YBT balance
```

---

## 📋 Deployed Addresses (Fill after deployment)

| Contract | Address |
|----------|---------|
| YieldBallToken (YBT) | `0x...` |
| YieldBallGame | `0x...` |

---

## 🏆 Hackathon Demo Checklist

- [ ] Deploy YieldBallToken to Base Sepolia
- [ ] Deploy YieldBallGame to Base Sepolia
- [ ] Call setGameContract on Token
- [ ] Update wagmi.js with addresses
- [ ] Import YBT token in MetaMask
- [ ] Play game → Win → Claim tokens
- [ ] Show token balance in MetaMask

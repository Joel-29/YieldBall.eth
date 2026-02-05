# YieldBall Demo Token System

## Overview

This is a **hackathon demo** setup for rewarding players with ERC-20 tokens when they win the YieldBall game.

**Flow:** Win Game → Click "Claim" → MetaMask Popup → 10 YBT minted to wallet

---

##  IMPORTANT: Why Reverts Were Happening

The original setup had this issue:
1. Frontend called `gameContract.rewardWinner(player)`
2. Game contract called `token.mint(player, amount)`
3. Token's `mint()` had `onlyGameOrOwner` modifier
4. **BUT** the `GAME_CONTRACT_ADDRESS` was set to wrong contract!

**Solution:** Use `YieldBallTokenPublic.sol` with **public mint** and call it directly from frontend.

---

##  Contracts

### Option 1: YieldBallTokenPublic (RECOMMENDED for Demo)
- **File:** `contracts/YieldBallTokenPublic.sol`
- **Type:** ERC-20 with PUBLIC mint (anyone can mint)
- **Name:** YieldBall Token
- **Symbol:** YBT  
- **Decimals:** 18
- **NO role checks** - perfect for hackathon demo

### Option 2: Original YieldBallToken (Requires Game Contract)
- **File:** `contracts/YieldBallToken.sol`
- Requires proper game contract setup
- More complex deployment

---

##  Quick Deployment (5 minutes)

### Step 1: Deploy YieldBallTokenPublic

1. Open [Remix IDE](https://remix.ethereum.org)
2. Create new file: `YieldBallTokenPublic.sol`
3. Copy contents from `contracts/YieldBallTokenPublic.sol`
4. Compile with Solidity ^0.8.20
5. Deploy:
   - Environment: "Injected Provider - MetaMask"
   - Network: **Base Sepolia** (Chain ID: 84532)
   - Click "Deploy"
6. **Copy the deployed contract address!**

### Step 2: Update Frontend Config

Edit `src/config/wagmi.js`:

```javascript
export const YBT_TOKEN_ADDRESS = '0xYOUR_NEW_TOKEN_ADDRESS';
```

### Step 3: Test It!

```bash
npm run dev
```

1. Connect MetaMask (Base Sepolia)
2. Play the game
3. Win → Click "Claim 10 YBT Tokens"
4. MetaMask pops up → Confirm
5. Tokens appear in wallet!

---

##  Adding YBT to MetaMask

1. Open MetaMask
2. Click "Import tokens"
3. Paste **YBT Token Address**
4. Symbol: YBT, Decimals: 18 (auto-fills)
5. Click "Add Custom Token"

---

##  Current Configuration

| Setting | Value |
|---------|-------|
| Network | Base Sepolia (84532) |
| Token Address | `0x7e1D129EB01ED6fBe07689849F80e887D1Fb3871` |
| Reward Amount | 10 YBT per win |
| Decimals | 18 |

---

##  How the Fix Works

**Before (broken):**
```
Frontend → gameContract.rewardWinner() → token.mint()  REVERTS
```

**After (fixed):**
```
Frontend → token.mint(userAddress, 10e18)  WORKS
```

The frontend now calls the token's `mint()` function directly with:
- `to`: Connected wallet address
- `amount`: 10 * 10^18 (10 YBT with 18 decimals)

---

##  Security Note

**YieldBallTokenPublic** has a public `mint()` function - anyone can mint tokens.

This is **INTENTIONAL** for the hackathon demo. 

For production, use proper access control (OpenZeppelin AccessControl, onlyOwner, etc.).

YieldBall.eth

A Web3 Pachinko Arcade where you earn real yield while you play

YieldBall.eth is an identity-driven, no-loss DeFi Pachinko game that turns passive yield farming into an interactive arcade experience. Your capital becomes the ball, your ENS identity shapes the physics, and your rewards are verified on-chain.

Features:

1.No-Loss DeFi Gameplay
Deposit USDC into an Aave V3 vault
Your principal is never at risk
Earn real yield while playing Pachinko-style games
2.ENS Identity-Based Mechanics
Game physics and multipliers adapt based on your ENS text record yieldball.class
Different ENS classes unlock unique play styles

2.Gas-Free Real-Time Gameplay:

Peg hits are signed off-chain using Yellow Network state channels
Sub-millisecond feedback with final on-chain settlement
No gas fees during active gameplay

3.On-Chain Rewards:

Bonus YieldBall Tokens (YBT) are minted on wins
Transparent ERC-20 minting visible on Base Sepolia

Quick Start
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

How to Play

Connect Wallet
Connect using RainbowKit. Your ENS name (if any) is resolved automatically.

Deposit
Deposit 100 USDC to enter the Pachinko arcade. Funds are routed to an Aave V3 vault.

Drop the Ball
Choose your drop position and release the Yield Ball into the board.

Bounce & Multiply
Each peg hit is signed via Yellow Network state channels.
Land in multiplier zones like Aave, GHO, Uniswap, or Degen.

Claim Rewards
Withdraw your original deposit plus earned yield.
Bonus YBT tokens are minted directly to your wallet.

ENS Player Classes

Set the yieldball.class text record in your ENS name to unlock special modes:

Class	Physics Style	Yield Multiplier
default	Balanced physics	1×
whale	High mass, stable bounces	1×
degen	Fast, high restitution	2×

Physics variables (mass, restitution, speed) are recalibrated dynamically at runtime.

Tech Stack
Frontend

React 18

Vite

Tailwind CSS

ReactBits Animations

Electric Border (Claim Page)

Galaxy Background

Shiny Text effects

Web3

Wagmi v2

RainbowKit

Viem

ENS Resolution (useEnsText, useEnsAvatar)

Game Engine

Matter.js for Pachinko physics

Custom anti-stuck and bounce correction logic

DeFi & Scaling

Aave V3 (Base Sepolia) – No-loss liquidity vault

Yellow Network – Off-chain state channel simulation

Optional GHO payout via Uniswap hooks (future-ready)

State Channel Simulation

Each peg hit triggers an off-chain signed update:

Signing State Update... Peg hit! +Yield
Yellow Network: State channel update pending...


The final game outcome is settled on-chain only when the session ends.

Project Structure
├── contracts/          # Vault & reward contracts (Base Sepolia)
├── src/
│   ├── components/    # ElectricBorder, GalaxyBackground, ShinyText
│   ├── engine/        # Pachinko physics & state channels
│   ├── hooks/         # ENS + Wagmi integrations
│   └── App.jsx        # Global state & layout

Environment Variables

Create a .env file:

VITE_WALLETCONNECT_PROJECT_ID=your_project_id
VITE_BASE_RPC_URL=your_base_sepolia_rpc

Contributing

Fork the repository

Create your branch

git checkout -b feature/amazing-feature


Commit changes

git commit -m "Add amazing feature"


Push and open a Pull Request

License

MIT License
Feel free to fork, build, and remix YieldBall.eth
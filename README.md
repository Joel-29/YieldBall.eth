# YieldBall.eth 

A Web3 Pinball game where you earn real yield while you play!

![YieldBall Banner](https://via.placeholder.com/800x400/0f172a/ff006e?text=YieldBall.eth)

##  Features

- **Web3 Integration**: Connect your wallet using RainbowKit/Wagmi
- **Real-time Yield**: Earn $0.0001/sec while playing, plus bonus yield on bumper hits
- **Matter.js Physics**: Realistic pinball physics with flippers, bumpers, and ball trails
- **ENS Classes**: Set `yieldball.class` in your ENS for special game modes
- **State Channels**: Simulated Yellow Network integration for gas-free gameplay
- **80s Neon Aesthetic**: Cyberpunk-inspired visuals with glowing effects

##  Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

##  How to Play

1. **Connect Wallet**: Click "Connect Wallet" to link your Ethereum wallet
2. **Deposit**: Click "Deposit 100 USDC" to enter the game
3. **Launch**: Press `SPACE` to launch the ball
4. **Flip**: Use `A`/`←` for left flipper, `D`/`→` for right flipper
5. **Score**: Hit bumpers to earn points and bonus yield
6. **Withdraw**: When the ball drains, withdraw your principal + earned yield

##  ENS Player Classes

Set the `yieldball.class` text record in your ENS name to unlock special modes:

| Class | Flipper Size | Ball Speed | Multiplier |
|-------|-------------|------------|------------|
| Default | 100px | Normal | 1x |
| `whale` | 150px | Slow | 1x |
| `degen` | 40px | Fast | 2x |

##  Tech Stack

- **React 18** - UI Framework
- **Vite** - Build Tool
- **Tailwind CSS** - Styling
- **Matter.js** - Physics Engine
- **Wagmi v2** - Ethereum Hooks
- **RainbowKit** - Wallet Connection
- **Viem** - Ethereum Library

##  State Channel Simulation

Every bumper hit triggers a console log simulating Yellow Network state channel updates:

```
 Signing State Update... Bumper 1 hit! +100 points
 Yellow Network: State channel update pending...
```

##  Customization

### Colors

The neon color palette is defined in `tailwind.config.js`:

- `neon-pink`: #ff006e
- `neon-cyan`: #00f5ff
- `neon-purple`: #8b5cf6
- `neon-yellow`: #fbbf24
- `neon-green`: #22c55e
- `cyber-dark`: #0f172a

### Physics

Adjust game physics in `src/engine/PinballEngine.js`:

- Gravity
- Ball restitution and friction
- Bumper bounce force
- Flipper angular velocity

##  Environment Variables

For production, replace the WalletConnect project ID in `src/config/wagmi.js`:

```javascript
projectId: 'your-walletconnect-project-id'
```

##  Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

##  License

MIT License - feel free to use this project however you'd like!

---



# EsusuChain 🔗

> **Decentralized Rotating Savings & Credit Association (ROSCA) on Ethereum**

[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.19-blue.svg)](https://soliditylang.org/)
[![Hardhat](https://img.shields.io/badge/Built%20with-Hardhat-yellow.svg)](https://hardhat.org/)
[![Tests](https://img.shields.io/badge/Tests-Passing-green.svg)](#testing)

EsusuChain brings the traditional **African Esusu savings model** to the blockchain — transparent, automated, and fully decentralized. No banks, no middlemen, just community.

---

## What is Esusu?

**Esusu** (also called *susu*, *tontine*, or *chama*) is a centuries-old African communal savings practice where a group of people contribute a fixed amount periodically, and each round one member collects the entire pot. Over time, every member receives the full pot once.

EsusuChain makes this **trustless and transparent** by encoding all the rules into a smart contract on Ethereum.

---

## Features

- 🏦 **Trustless ROSCA** — Smart contract enforces contribution rules, no admin can steal funds
- 🔄 **Automatic rotation** — Winner is selected in join order, fairly and transparently
- ⏱ **Cycle management** — Configurable round durations (days, weeks, months)
- 🏭 **Factory pattern** — One `EsusuFactory` deploys unlimited `EsusuPool` contracts
- 🔒 **Security** — ReentrancyGuard, Pausable, proper access control (OpenZeppelin)
- 💸 **Withdraw anytime** — Winners can withdraw their pot at any time after winning
- 🌐 **Full dApp** — React frontend with MetaMask integration
- 📦 **JavaScript SDK** — Import ABIs and helpers into your own dApp

---

## Architecture

```
EsusuFactory (deploy once)
    └── createPool() → EsusuPool (one per savings circle)
                           ├── join()
                           ├── contribute()  [payable]
                           ├── withdraw()
                           └── finalizeRound() [admin]
```

### Pool Lifecycle

```
Open → (all members join) → Active → (rounds complete) → Completed
                                                ↓ (emergency)
                                           Cancelled
```

---

## Quickstart

### Prerequisites

- Node.js v18+
- npm v9+
- MetaMask browser extension

### 1. Clone & Install

```bash
git clone https://github.com/Sayo-codes/EsusuChain.git
cd EsusuChain
npm install
```

### 2. Run Local Blockchain

```bash
npm run node
# Starts a local Hardhat node at http://127.0.0.1:8545
```

### 3. Deploy Contracts

```bash
# In a new terminal:
npm run deploy:local
# Outputs contract addresses and saves to deployments.json
```

### 4. Start the Frontend

```bash
npm run frontend:dev
# Opens at http://localhost:5173
```

### 5. Connect MetaMask

- Add network: `localhost:8545`, Chain ID `31337`
- Import a test account using a private key from the Hardhat node output

---

## Testing

```bash
npm test
```

The test suite covers:

| Category          | Tests |
|-------------------|-------|
| Deployment        | Parameter validation, invalid inputs |
| Joining           | Join flow, auto-start, double-join prevention |
| Contributing      | Correct amounts, double-contribution prevention |
| Round completion  | Pot calculation, winner assignment, round advancement |
| Withdrawal        | Balance transfer, double-withdrawal prevention |
| Full cycle        | 4-member, 4-round complete lifecycle |
| Admin actions     | `finalizeRound` after deadline |
| Factory           | Pool creation, tracking, events |

---

## Deployment (Testnet)

```bash
# 1. Copy and fill environment variables
cp .env.example .env

# 2. Deploy to Sepolia testnet
npm run deploy:sepolia

# 3. Update frontend/src/App.jsx with the new factory address
```

---

## SDK Usage

```javascript
import { EsusuChainSDK, ESUSU_FACTORY_ABI, ESUSU_POOL_ABI } from './sdk/index.js'
import { ethers } from 'ethers'

const provider = new ethers.BrowserProvider(window.ethereum)
const signer   = await provider.getSigner()

const sdk = new EsusuChainSDK(provider, FACTORY_ADDRESS)

// Create a pool
const poolAddress = await sdk.createPool(
  signer,
  "My Savings Circle",
  ethers.parseEther("0.1"),  // 0.1 ETH per round
  7,                          // 7-day cycles
  5                           // 5 members
)

// Get all pools
const pools = await sdk.getAllPools()

// Get pool info
const info = await sdk.getPoolInfo(poolAddress)
console.log(info)
// { name, contributionAmount, status, currentRound, ... }

// Join a pool
await sdk.joinPool(signer, poolAddress)

// Contribute
await sdk.contribute(signer, poolAddress, ethers.parseEther("0.1"))

// Withdraw winnings
await sdk.withdraw(signer, poolAddress)
```

---

## Project Structure

```
EsusuChain/
├── contracts/
│   ├── EsusuPool.sol         # Core ROSCA logic
│   └── EsusuFactory.sol      # Factory for deploying pools
├── scripts/
│   └── deploy.js             # Deployment script
├── test/
│   └── EsusuPool.test.js     # Full test suite
├── sdk/
│   └── index.js              # JavaScript SDK
├── frontend/                  # Vite + React dApp
│   └── src/
│       ├── App.jsx            # Main application
│       └── index.css          # Design system
├── FUNDING.json               # Drips funding config
├── .env.example               # Environment template
├── hardhat.config.js
└── README.md
```

---

## Smart Contract Reference

### EsusuFactory

| Function | Description |
|----------|-------------|
| `createPool(name, amount, duration, members)` | Deploy a new savings circle |
| `getAllPools()` | Returns all pool addresses |
| `getPoolsByCreator(addr)` | Returns pools created by address |
| `getTotalPools()` | Total pools deployed |

### EsusuPool

| Function | Description |
|----------|-------------|
| `join()` | Join the pool (when Open) |
| `contribute()` | Pay your contribution for this round (payable) |
| `withdraw()` | Withdraw pending winnings |
| `finalizeRound()` | Admin: close round after deadline |
| `cancelPool(reason)` | Admin: emergency cancel + refund |
| `getPoolInfo()` | Returns all pool state in one call |
| `getMemberStatus(addr)` | Returns member's contribution/win status |
| `getRoundInfo()` | Returns current round details |

---

## Contributing

Contributions are welcome! Please open an issue first to discuss what you'd like to change.

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## License

[MIT](LICENSE) © 2025 Sayo-codes

---

## Acknowledgements

- [OpenZeppelin](https://openzeppelin.com/) for battle-tested contract security primitives
- [Hardhat](https://hardhat.org/) for the development environment
- [ethers.js](https://ethers.org/) for Web3 interactions
- The African communities who developed Esusu long before blockchain existed 🌍

# EsusuStellar 🔗

> **Decentralized Rotating Savings & Credit Association (ROSCA) on Stellar Soroban**

[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)
[![Stellar](https://img.shields.io/badge/Stellar-Soroban-blue.svg)](https://stellar.org/soroban)
[![Rust](https://img.shields.io/badge/Smart%20Contracts-Rust%20%2F%20Soroban-orange.svg)](https://soroban.stellar.org/)
[![Freighter](https://img.shields.io/badge/Wallet-Freighter-blueviolet.svg)](https://freighter.app/)

EsusuStellar brings the traditional **African Esusu savings model** to the blockchain — transparent, automated, and fully decentralized. No banks, no middlemen, just community — powered by **Stellar Soroban smart contracts**.

---

## What is Esusu?

**Esusu** (also called *susu*, *tontine*, or *chama*) is a centuries-old African communal savings practice where a group of people contribute a fixed amount periodically, and each round one member collects the entire pot. Over time, every member receives the full pot once.

EsusuChain makes this **trustless and transparent** by encoding all the rules into a Soroban smart contract on Stellar — settling in seconds at fractions of a cent.

---

## Why Stellar?

| Feature | Stellar Advantage |
|---------|------------------|
| ⚡ Speed | 3–5 second finality vs. minutes on EVM chains |
| 💰 Cost | ~$0.00001 per transaction — ideal for micro-savings |
| 🪙 Native Assets | Built-in token primitives via the Stellar Asset Contract (SAC) |
| 🦀 Soroban | Rust smart contracts — memory safe, auditable, WASM-compiled |
| 🌍 Accessibility | Designed for the unbanked — low cost, mobile-first |

---

## Features

- 🏦 **Trustless ROSCA** — Soroban contract enforces contribution rules; no admin can steal funds
- 🔄 **Automatic rotation** — Winner selected in join order, deterministically and transparently
- ⏱ **Cycle management** — Configurable round durations (days, weeks, months)
- 🪙 **Stellar Asset Contract** — Contributions paid in any Stellar token (XLM, USDC, etc.)
- 🔒 **Auth-required actions** — Every sensitive function uses `require_auth()` (Soroban auth framework)
- 🌐 **Full dApp** — React frontend with **Freighter** wallet integration
- 📦 **JavaScript SDK** — `@stellar/stellar-sdk`-powered helpers for your own dApp

---

## Architecture

```
EsusuPool (Soroban contract)
    ├── initialize()   → Sets up pool parameters, admin, token
    ├── join()         → Member joins; auto-starts when full
    ├── contribute()   → Members pay SAC token for current round
    ├── finalize_round() → Admin distributes pot to round winner
    └── cancel_pool()  → Emergency admin cancel
```

### Pool Lifecycle

```
Open → (all members join, pool auto-starts) → Active → (all rounds complete) → Completed
                                                              ↓ (emergency)
                                                          Cancelled
```

---

## Quickstart

### Prerequisites

- [Rust](https://www.rust-lang.org/tools/install) + `wasm32-unknown-unknown` target
- [Stellar CLI](https://developers.stellar.org/docs/tools/stellar-cli) (`cargo install --locked stellar-cli`)
- [Freighter Wallet](https://freighter.app/) browser extension
- Node.js v18+ (for SDK & frontend)

### 1. Clone & Install

```bash
git clone https://github.com/Sayo-codes/EsusuStellar.git
cd EsusuStellar
npm install
```

### 2. Add Rust WASM Target

```bash
rustup target add wasm32-unknown-unknown
```

### 3. Build the Soroban Contract

```bash
stellar contract build
# Output: contracts/soroban/esusu_pool/target/wasm32-unknown-unknown/release/esusu_pool.wasm
```

### 4. Run Contract Tests

```bash
cd contracts/soroban/esusu_pool
cargo test
```

### 5. Deploy to Stellar Testnet

```bash
# Fund a testnet account
stellar keys generate --global deployer --network testnet

# Deploy the contract
stellar contract deploy \
  --wasm contracts/soroban/esusu_pool/target/wasm32-unknown-unknown/release/esusu_pool.wasm \
  --source deployer \
  --network testnet
# → Contract ID: C...
```

### 6. Start the Frontend

```bash
npm run frontend:dev
# Vite dev server at http://localhost:5173
# Connect Freighter to Stellar Testnet
```

---

## Testing

```bash
cd contracts/soroban/esusu_pool
cargo test
```

The test suite covers:

| Category | Tests |
|----------|-------|
| Initialization | Parameter validation, storage setup |
| Joining | Join flow, auto-start when full, double-join prevention |
| Contributing | Correct token transfer, round tracking |
| Round finalization | Pot calculation, winner payout, round advancement |
| Full cycle | 2-member, 2-round complete lifecycle |
| Admin actions | `finalize_round` authorization, `cancel_pool` |
| Access control | Non-admin action rejection |

---

## Deployment (Testnet)

```bash
# 1. Copy and fill environment variables
cp .env.example .env

# 2. Generate / fund a testnet keypair
stellar keys generate --global deployer --network testnet

# 3. Build the contract
stellar contract build

# 4. Deploy
stellar contract deploy \
  --wasm contracts/soroban/esusu_pool/target/wasm32-unknown-unknown/release/esusu_pool.wasm \
  --source deployer \
  --network testnet \
  --alias esusu_pool

# 5. Initialize the pool
stellar contract invoke \
  --id esusu_pool \
  --source deployer \
  --network testnet \
  -- initialize \
  --admin <YOUR_PUBLIC_KEY> \
  --token <SAC_TOKEN_ADDRESS> \
  --name "My Savings Circle" \
  --contribution_amt 100000000 \
  --cycle_duration 604800 \
  --max_members 5
```

---

## SDK Usage

```javascript
import { EsusuChainSDK } from './sdk/index.js'
import { SorobanRpc } from '@stellar/stellar-sdk'

const server = new SorobanRpc.Server('https://soroban-testnet.stellar.org')
const sdk = new EsusuChainSDK(server, 'C...YOUR_CONTRACT_ID...', 'testnet')

// Build a join transaction (sign with Freighter in the frontend)
const tx = await sdk.buildJoinTx('G...MEMBER_PUBLIC_KEY...')

// Sign with Freighter
const signedXdr = await window.freighter.signTransaction(tx.toXDR(), {
  network: 'TESTNET',
  networkPassphrase: 'Test SDF Network ; September 2015',
})

// Submit
const { Transaction } = await import('@stellar/stellar-sdk')
const signedTx = new Transaction(signedXdr, 'Test SDF Network ; September 2015')
await sdk.submitTransaction(signedTx)
```

---

## Project Structure

```
EsusuChain/
├── contracts/
│   └── soroban/
│       └── esusu_pool/
│           ├── Cargo.toml          # Soroban dependency config
│           └── src/
│               ├── lib.rs          # Core ROSCA contract logic (Rust)
│               └── test.rs         # Soroban unit tests
├── sdk/
│   └── index.js                   # JavaScript SDK (@stellar/stellar-sdk)
├── frontend/                       # Vite + React dApp
│   └── src/
│       ├── App.jsx                 # Main application (Freighter integration)
│       └── index.css               # Design system
├── Cargo.toml                      # Rust workspace
├── FUNDING.json                    # Drips funding config
├── .env.example                    # Environment template
└── README.md
```

---

## Smart Contract Reference

### EsusuPool — Function Reference

| Function | Auth Required | Description |
|----------|---------------|-------------|
| `initialize(admin, token, name, contribution_amt, cycle_duration, max_members)` | admin | Deploy and configure a savings pool |
| `join(member)` | member | Join the pool while status is Open |
| `contribute(member)` | member | Transfer token contribution for current round |
| `finalize_round(caller)` | admin | Pay out the round winner and advance round |
| `cancel_pool(caller)` | admin | Emergency cancel the pool |
| `get_status()` | — | Returns current PoolStatus enum |
| `get_members()` | — | Returns Vec of member addresses |
| `get_current_round()` | — | Returns current round index |
| `get_contribution_amount()` | — | Returns contribution amount (in stroops) |

---

## Contributing

Contributions are welcome! Please open an issue first to discuss what you'd like to change.

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'feat: describe your change'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for full guidelines.

---

## License

[MIT](LICENSE) © 2025 Sayo-codes

---

## Acknowledgements

- [Stellar Development Foundation](https://stellar.org/) for Soroban and the Stellar network
- [Soroban SDK](https://soroban.stellar.org/) for the Rust smart contract framework
- [Freighter](https://freighter.app/) for the Stellar wallet browser extension
- The African communities who developed Esusu long before blockchain existed 🌍

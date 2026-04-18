# Contributing to EsusuStellar 🔗

Thank you for your interest in contributing to **EsusuStellar** — a decentralized Rotating Savings & Credit Association (ROSCA) built on **Stellar Soroban**!

This project participates in the **[Drips Wave Program](https://www.drips.network/wave)**, which means contributors can earn rewards for their contributions.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Issue Complexity Levels](#issue-complexity-levels)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Project Structure](#project-structure)
- [Getting Help](#getting-help)

---

## Code of Conduct

Be respectful, inclusive, and constructive. We welcome contributors of all backgrounds and experience levels. Harassment of any kind will not be tolerated.

---

## Getting Started

### Prerequisites

- [Rust](https://www.rust-lang.org/tools/install) (stable toolchain)
- `wasm32-unknown-unknown` target: `rustup target add wasm32-unknown-unknown`
- [Stellar CLI](https://developers.stellar.org/docs/tools/stellar-cli): `cargo install --locked stellar-cli`
- [Freighter Wallet](https://freighter.app/) (for frontend testing)
- Node.js v18+ and npm v9+ (for SDK & frontend)
- Git

### Setup

```bash
# 1. Fork the repository on GitHub
# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/EsusuStellar.git
cd EsusuStellar

# 3. Install JS dependencies (SDK + frontend tooling)
npm install

# 4. Install frontend dependencies
cd frontend && npm install && cd ..

# 5. Copy environment file
cp .env.example .env

# 6. Add the WASM build target
rustup target add wasm32-unknown-unknown

# 7. Build the Soroban contract
stellar contract build

# 8. Run contract tests
cd contracts/soroban/esusu_pool
cargo test

# 9. Start the frontend dev server
npm run frontend:dev
```

---

## How to Contribute

### Finding Issues

1. Browse [open issues](https://github.com/Sayo-codes/EsusuStellar/issues) labelled `help wanted` or `good first issue`
2. Look for issues tagged with the **Drips Wave** label if you are participating through the Wave Program
3. Comment on an issue before starting work to avoid conflicts with other contributors
4. Wait for a maintainer to assign it to you before opening a PR

### Do NOT

- Open a PR for an issue that hasn't been assigned to you
- Submit AI-generated code that you don't understand or haven't tested
- Submit trivial changes (e.g., single typo fixes) as standalone PRs just for points
- Work on multiple issues simultaneously without prior discussion

---

## Issue Complexity Levels

Issues are tagged with a complexity level that determines Drips Wave point rewards:

| Label | Points | Description |
|-------|--------|-------------|
| `complexity: trivial` | 100 pts | Small UI fixes, copy changes, config updates |
| `complexity: medium` | 150 pts | New UI features, standard bug fixes, Rust test additions |
| `complexity: high` | 200 pts | New contract features, Freighter integration, refactors |

---

## Development Workflow

```
1. Create a branch off main
   git checkout -b feature/your-feature-name

2. Make your changes
   - Write clean, commented Rust or JavaScript
   - Add or update tests where applicable
   - Ensure existing Rust tests pass: cd contracts/soroban/esusu_pool && cargo test
   - Ensure frontend builds: npm run frontend:build

3. Commit with a descriptive message
   git commit -m "feat: add pool search filter to homepage"

4. Push and open a Pull Request
   git push origin feature/your-feature-name
```

### Branch Naming

| Type | Format | Example |
|------|--------|---------|
| Feature | `feature/description` | `feature/freighter-wallet-connect` |
| Bug fix | `fix/description` | `fix/contribute-auth-check` |
| Docs | `docs/description` | `docs/stellar-cli-setup` |
| Test | `test/description` | `test/cancel-pool-edge-cases` |

---

## Coding Standards

### Rust / Soroban

- Follow the existing NatSpec-style doc comments (`///`) on all public functions
- Always use `require_auth()` on any function that changes state on behalf of a user
- Use `panic_with_error!` with typed error enums — never raw `panic!`
- Run `cargo test` before submitting — all tests must pass
- Do not introduce new crate dependencies without prior discussion in an issue

### JavaScript / React

- Use functional components and hooks
- Keep components focused — one responsibility per component
- Use descriptive variable names
- Handle loading and error states for all async Soroban operations

### CSS

- Use the existing CSS variables defined in `frontend/src/index.css`
- Do not introduce Tailwind or other CSS frameworks
- Keep styles scoped and avoid global overrides

---

## Pull Request Guidelines

- **Link the issue**: Always reference the issue in your PR description (`Closes #123`)
- **Describe your changes**: Explain what you changed and why
- **Keep it focused**: One PR per issue — don't bundle unrelated changes
- **Add screenshots**: For UI changes, include before/after screenshots
- **Tests must pass**: `cargo test` must exit with 0 errors for contract changes
- **No merge commits**: Rebase onto main if your branch is out of date

### PR Description Template

```markdown
## Summary
Brief description of what this PR does.

## Related Issue
Closes #[issue number]

## Changes Made
- List of specific changes

## Testing
How did you test this? Include steps to reproduce.
For Rust changes: paste `cargo test` output.
For UI changes: describe Freighter interaction tested.

## Screenshots (if applicable)
Before / After
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
├── frontend/
│   └── src/
│       ├── App.jsx                 # Main React dApp (Freighter wallet)
│       └── index.css               # Design system & CSS variables
├── Cargo.toml                      # Rust workspace
├── CONTRIBUTING.md                 # This file
├── FUNDING.json                    # Drips Wave funding config
└── README.md
```

---

## Getting Help

- **Open a Discussion**: For questions about the codebase or architecture
- **Comment on the Issue**: For clarification on a specific task
- **Stellar Discord**: [discord.gg/stellar](https://discord.gg/stellar) — `#soroban` channel
- **Drips Wave Support**: [drips.network/wave/support](https://www.drips.network/wave/support)

We review PRs and issue applications within **48 hours**. Thanks for contributing to decentralized community finance! 🌍

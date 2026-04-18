# Contributing to EsusuChain 🔗

Thank you for your interest in contributing to **EsusuChain** — a decentralized Rotating Savings & Credit Association (ROSCA) built on Ethereum!

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

- Node.js v18+
- npm v9+
- Git
- MetaMask (for frontend testing)

### Setup

```bash
# 1. Fork the repository on GitHub
# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/EsusuChain.git
cd EsusuChain

# 3. Install dependencies
npm install

# 4. Install frontend dependencies
cd frontend && npm install && cd ..

# 5. Copy environment file
cp .env.example .env

# 6. Start a local blockchain (in one terminal)
npm run node

# 7. Deploy contracts (in another terminal)
npm run deploy:local

# 8. Start the frontend (in a third terminal)
npm run frontend:dev
```

---

## How to Contribute

### Finding Issues

1. Browse [open issues](https://github.com/Sayo-codes/EsusuChain/issues) labelled `help wanted` or `good first issue`
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
| `complexity: medium` | 150 pts | New UI features, standard bug fixes, test additions |
| `complexity: high` | 200 pts | New contract integrations, refactors, complex features |

---

## Development Workflow

```
1. Create a branch off main
   git checkout -b feature/your-feature-name

2. Make your changes
   - Write clean, commented code
   - Add or update tests where applicable
   - Ensure existing tests still pass: npm test

3. Commit with a descriptive message
   git commit -m "feat: add pool search filter to homepage"

4. Push and open a Pull Request
   git push origin feature/your-feature-name
```

### Branch Naming

| Type | Format | Example |
|------|--------|---------|
| Feature | `feature/description` | `feature/pool-search-filter` |
| Bug fix | `fix/description` | `fix/contribution-amount-validation` |
| Docs | `docs/description` | `docs/sdk-usage-examples` |
| Test | `test/description` | `test/factory-edge-cases` |

---

## Coding Standards

### Solidity

- Follow the existing NatSpec comment style (`@notice`, `@param`, `@return`)
- Use explicit visibility modifiers on all functions
- Run `npm test` before submitting — all tests must pass
- Do not introduce new external dependencies without discussion

### JavaScript / React

- Use functional components and hooks
- Keep components focused — one responsibility per component
- Use descriptive variable names
- Handle loading and error states for all async operations

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
- **Tests must pass**: `npm test` must exit with 0 errors
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

## Screenshots (if applicable)
Before / After
```

---

## Project Structure

```
EsusuChain/
├── contracts/
│   ├── EsusuPool.sol         # Core ROSCA logic — contribute, withdraw, rotate
│   └── EsusuFactory.sol      # Factory for deploying pools
├── scripts/
│   └── deploy.js             # Deployment script (local + Sepolia)
├── test/
│   └── EsusuPool.test.js     # Hardhat test suite
├── sdk/
│   └── index.js              # JavaScript SDK for external dApps
├── frontend/
│   └── src/
│       ├── App.jsx            # Main React dApp
│       └── index.css          # Design system & CSS variables
├── CONTRIBUTING.md            # This file
├── FUNDING.json               # Drips Wave funding config
└── README.md
```

---

## Getting Help

- **Open a Discussion**: For questions about the codebase or architecture
- **Comment on the Issue**: For clarification on a specific task
- **Drips Wave Support**: [drips.network/wave/support](https://www.drips.network/wave/support)

We review PRs and issue applications within **48 hours**. Thanks for contributing to decentralized community finance! 🌍

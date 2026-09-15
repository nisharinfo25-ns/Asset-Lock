# Blockchain-Based Decentralised Identity & Access Control
## for Secure Digital Asset Management

> **AssetLock** — Invisible Evidence. Immutable Trust.

A complete, production-ready web application implementing decentralized identity management and access control for secure digital assets, built with React, Node.js, Solidity, and IPFS.

---

## Architecture

```
User → Identity Verification → Authentication
  ↓
Upload Digital Asset
  ↓
AES-256-GCM Encryption + SHA-256 Hash
  ↓
┌──────────────┬──────────────┐
↓              ↓
IPFS           Blockchain
(Encrypted     (Hash + Owner-
File Store)    ship + Access)
└──────────────┴──────────────┘
  ↓
Access Control → Permissions → Audit Trail
```

---

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env — all external services are optional (auto-fallback)
```

### 3. Start Backend Server (Terminal 1)
```bash
npm run backend
```

### 4. Start Frontend Dev Server (Terminal 2)
```bash
npm run dev
```

### 5. Open Browser
Visit **http://localhost:5173**

The app **auto-seeds** 4 demo accounts and 2 encrypted assets on first run.

---

## Demo Accounts

| Role | Email | Password | Wallet |
|------|-------|----------|--------|
| **Owner** | alice@security.enclave | Password123! | 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 |
| **Authorized User** | bob@security.enclave | Password123! | 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 |
| **Viewer** | charlie@security.enclave | Password123! | 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC |
| **Admin** | admin@security.enclave | Password123! | 0x90F79bf6EB2c4f870365E785982E1f101E93b906 |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript + Tailwind CSS |
| Backend | Node.js + Express 5 |
| Database | MongoDB (+ JSON fallback) |
| Blockchain | Solidity 0.8.20 + Ethers.js 6 (+ simulation fallback) |
| IPFS | Pinata SDK (+ local content-addressed store fallback) |
| Encryption | AES-256-GCM (Web Crypto API + Node.js crypto) |
| Auth | JWT + RBAC |
| Wallet | MetaMask / EIP-1193 |

---

## Features

- ✅ **AES-256-GCM encryption** — every file encrypted before storage
- ✅ **SHA-256 integrity verification** — tamper detection on every download
- ✅ **IPFS storage** — decentralized, content-addressed file store
- ✅ **Smart contract access control** — on-chain permission registry
- ✅ **JWT authentication** — secure session management
- ✅ **Role-based access** — Owner / Authorized User / Viewer / Admin
- ✅ **Full audit trail** — immutable log of every operation
- ✅ **Tamper simulation lab** — real-time integrity testing
- ✅ **MetaMask integration** — connect Ethereum wallet
- ✅ **Graceful fallbacks** — works without MongoDB, Hardhat, or Pinata

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend dev server |
| `npm run backend` | Start backend API server |
| `npm run build` | Build frontend for production |
| `npm run seed` | Re-seed the database |
| `npm run compile-contract` | Compile Solidity contract |
| `npm run deploy-contract` | Deploy to local Hardhat node |

---

## Optional: Real Blockchain (Hardhat)

```bash
# Install Hardhat globally
npm install -g hardhat

# Start local node (Terminal 3)
npx hardhat node

# Deploy contract (Terminal 4)
npm run deploy-contract
```

## Optional: Real IPFS (Pinata)

1. Sign up at https://app.pinata.cloud
2. Generate API keys
3. Add to `.env`:
   ```
   PINATA_API_KEY=your_key
   PINATA_SECRET_API_KEY=your_secret
   PINATA_JWT=your_jwt
   ```

## Optional: Real Database (MongoDB)

```bash
# Install MongoDB Community Edition
# https://www.mongodb.com/try/download/community
# Then set in .env:
# MONGODB_URI=mongodb://localhost:27017/secure_assets
```

---

## Project Structure

```
AssetLock/
├── backend/                  # Node.js/Express API
│   ├── config/               # DB + Blockchain managers
│   ├── middleware/           # JWT + RBAC auth
│   ├── models/               # User, Asset, Permission, AuditLog
│   ├── routes/               # REST API endpoints
│   └── services/             # Crypto + IPFS services
├── contracts/                # Solidity smart contracts
├── database/                 # Seed script + local JSON store
├── scripts/                  # Compile + deploy scripts
├── src/                      # React frontend
│   ├── components/
│   │   ├── layout/           # Sidebar + TopBar
│   │   ├── modals/           # Grant/Request/Wallet/Switch modals
│   │   └── views/            # 14 page views
│   ├── services/             # API client (apiService.ts)
│   └── types/                # TypeScript interfaces
└── artifacts/                # Compiled contract ABI + bytecode
```

---

## License

MIT © 2026 AssetLock — Built for the Hackathon

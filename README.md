# ASSET-LOCK
> **Blockchain Based Decentralised Identity & Access Control for Secure Digital Asset Management**

---

## 1. Project Overview

**Asset-Lock** is an enterprise-grade digital asset security platform combining:
- **AES-256 military-grade file encryption** performed before transit/storage.
- **SHA-256 cryptographic hashing** generating immutable digital fingerprints.
- **IPFS / Pinata decentralized storage** storing solely the encrypted ciphertext (never plaintext files).
- **Ethereum / Solidity smart contracts** recording ownership, permissions, and access events on-chain.
- **Supabase PostgreSQL** storing structured relational metadata, access requests, and audit logs.
- **MetaMask Web3 wallet integration** binding decentralized identities to authenticated sessions.

---

## 2. Core Security & Storage Architecture

```
                       ASSET-LOCK PLATFORM
                                |
                                v
                       React Frontend (Vite)
                                |
                                v
                       Node.js + Express API
                       /        |         \
                      /         |          \
                     v          v           v
            Supabase DB     IPFS / Pinata    Blockchain
            (PostgreSQL)    (Decentralized)  (AssetLock.sol)
                 |                 |                |
             Metadata          Encrypted       File Hash
             Users             Ciphertext      Ownership
             Permissions       CID             Permissions
             Access Requests                   Access Events
             Audit Logs
```

### Encryption & Upload Pipeline:
1. **Original File** $\to$ Client sends file to API.
2. **AES-256-CBC Encryption** $\to$ Unique symmetric key and IV generated.
3. **SHA-256 Fingerprint** $\to$ Cryptographic hash generated from file buffer.
4. **IPFS / Pinata Upload** $\to$ Encrypted ciphertext is pinned to IPFS, returning a real CID.
5. **Smart Contract Registration** $\to$ `registerAsset(assetId, fileHash, ipfsCid)` registers ownership on-chain.
6. **Supabase Record** $\to$ Metadata, CID, file hash, and encryption metadata stored in PostgreSQL.
7. **Audit Event** $\to$ `ASSET_UPLOADED` recorded with transaction hash.

---

## 3. Technology Stack

- **Frontend:** React 18, Vite, Tailwind CSS (Dark Enterprise Security Aesthetic), React Router v6, Lucide Icons, React Hot Toast.
- **Backend:** Node.js, Express.js, Ethers.js v6, Supabase JS SDK, Multer, Bcrypt.js, JSON Web Tokens (JWT), Helmet, Express Rate Limit.
- **Database:** Supabase PostgreSQL with Row Level Security (RLS), Foreign Keys, Indexes.
- **Blockchain:** Solidity `^0.8.20`, Hardhat, OpenZeppelin Contracts (`Ownable`, `ReentrancyGuard`), Ethers.js.
- **Storage:** IPFS via Pinata Cloud API / Gateway.
- **Security:** AES-256-CBC, SHA-256, Bcrypt (12 rounds), JWT Authentication, RBAC (`admin`, `owner`, `authorized_user`, `viewer`).

---

## 4. Database Schema (Supabase PostgreSQL)

The database schema is defined in `database/schema.sql`:

- `users`: `id` (UUID), `name`, `email` (UNIQUE), `password_hash`, `wallet_address`, `role` (`admin`, `owner`, `authorized_user`, `viewer`), `created_at`.
- `assets`: `id` (UUID), `name`, `description`, `owner_id` (FK), `ipfs_cid`, `blockchain_asset_id`, `file_hash`, `encrypted_file_metadata` (JSONB), `file_size`, `file_type`, `created_at`.
- `permissions`: `id` (UUID), `asset_id` (FK), `user_id` (FK), `permission` (`read`, `download`), `status` (`active`, `revoked`), `granted_at`, `revoked_at`, `granted_by` (FK).
- `access_requests`: `id` (UUID), `asset_id` (FK), `requester_id` (FK), `owner_id` (FK), `status` (`pending`, `approved`, `rejected`), `message`, `requested_at`, `responded_at`.
- `audit_logs`: `id` (UUID), `asset_id` (FK), `user_id` (FK), `action`, `details` (JSONB), `timestamp`, `transaction_hash`, `status` (`success`, `failed`, `pending`).

---

## 5. Smart Contract (`blockchain/contracts/AssetLock.sol`)

The `AssetLock` smart contract inherits from OpenZeppelin `Ownable` and `ReentrancyGuard`.

### Key Functions:
- `registerAsset(string assetId, string fileHash, string ipfsCid)`: Registers a new asset with msg.sender as owner. Emits `AssetRegistered`.
- `grantAccess(string assetId, address user)`: Only callable by the asset owner. Grants access to `user`. Emits `AccessGranted`.
- `revokeAccess(string assetId, address user)`: Only callable by the asset owner. Revokes access. Emits `AccessRevoked`.
- `hasAccess(string assetId, address user) view returns (bool)`: Returns permission status.
- `getAsset(string assetId) view returns (address, string, string, uint256)`: Retrieves on-chain asset details.
- `recordAccess(string assetId, string action)`: Verifies caller has permission and appends access audit event on-chain. Emits `AssetAccessed`.

---

## 6. Environment Variables

Create `.env` in the root (and in `backend/` and `frontend/` as needed):

```env
# SERVER CONFIGURATION
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# SUPABASE POSTGRESQL
SUPABASE_URL=https://smmrucoztzigccunopqp.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT AUTHENTICATION
JWT_SECRET=your_jwt_secret_minimum_32_characters

# BLOCKCHAIN CONFIGURATION
BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545
DEPLOYER_PRIVATE_KEY=your_deployer_private_key
CONTRACT_ADDRESS=

# PINATA IPFS STORAGE
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_API_KEY=your_pinata_secret_api_key
PINATA_JWT=your_pinata_jwt_token
PINATA_GATEWAY=https://gateway.pinata.cloud/ipfs

# FRONTEND VARIABLES (in frontend/.env.local)
VITE_SUPABASE_URL=https://smmrucoztzigccunopqp.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:5000/api
VITE_CONTRACT_ADDRESS=
VITE_BLOCKCHAIN_NETWORK=localhost
```

---

## 7. Step-by-Step Startup Guide

Follow this exact startup order for local development:

### Step 1: Initialize Database
Execute `database/schema.sql` in your Supabase SQL Editor.

### Step 2: Start Blockchain Node & Deploy Contract
In terminal 1:
```bash
cd blockchain
npm install
npx hardhat node
```

In terminal 2 (deploy contract):
```bash
cd blockchain
npx hardhat run scripts/deploy.js --network localhost
```
*Copy the printed contract address into your `.env` as `CONTRACT_ADDRESS` and `VITE_CONTRACT_ADDRESS`.*

### Step 3: Start Backend API
In terminal 3:
```bash
cd backend
npm install
npm run backend
```
*Health check available at: `http://localhost:5000/health`*

### Step 4: Start Frontend Application
In terminal 4:
```bash
cd frontend
npm install
npm run dev
```
*Open `http://localhost:5173` in your browser.*

---

## 8. Verification & Automated Tests

### Run Backend Cryptography & Contract Tests:
```bash
npm run test
```
Verifies:
1. AES-256 file encryption & decryption byte-for-byte fidelity.
2. SHA-256 hash determinism and formatting.
3. Tampering detection (single-byte alteration detection).
4. Bcrypt password hashing and salt verification.
5. JWT token generation, payload validation, and expiration.
6. Email, password, and Ethereum wallet address validators.
7. Blockchain smart contract ABI signatures.

### Verify Frontend Production Build:
```bash
npm run build:frontend
```

---

## 9. End-to-End Demo Walkthrough

### Scenario 1: User A Uploads & Secures Asset
1. User A registers an account and signs in.
2. Connects MetaMask wallet on the **Wallet** tab.
3. Navigates to **Upload Asset**, drops a confidential file, enters name and description.
4. Clicks **Encrypt & Secure Asset**.
5. The pipeline performs:
   - Local AES-256 encryption.
   - SHA-256 cryptographic fingerprinting.
   - Pinned ciphertext upload to IPFS.
   - Smart contract asset registration on-chain.
   - Supabase metadata storage.
   - Real-time progress indicators display each stage.

### Scenario 2: User B Requests Access & User A Grants
1. User B signs in with a different account.
2. User B navigates to the asset, views "Access Required", and clicks **Request Access**.
3. User A receives the request in **Access Requests** $\to$ **Incoming Requests**.
4. User A clicks **Approve**.
5. Permission record is updated in Supabase, granted on the smart contract, and logged in **Audit Logs**.

### Scenario 3: Integrity Verification & Tampering Detection
1. Navigate to **Integrity Verification**.
2. Select any asset and click **Verify Integrity**.
3. The platform computes the current file SHA-256 hash and compares it against the immutable blockchain record.
4. When matching: displays **INTEGRITY VERIFIED**.
5. If any byte was modified: displays **WARNING: POSSIBLE MODIFICATION DETECTED**.

---

## 10. Security Highlights & Prohibitions Enforced

- **No file editing:** Pure asset storage, access control, and integrity verification.
- **No plaintext storage:** Plaintext files never hit database or IPFS.
- **No secrets in client:** Supabase Service Role Key remains strictly server-side.
- **Zero fake transactions / CIDs:** Real cryptographic hashes and live Web3 interactions.
- **Admin cannot decrypt user files:** Admin can inspect access metadata and security logs without accessing private file contents.

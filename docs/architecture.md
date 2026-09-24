# ASSET-LOCK Architecture Documentation

## 1. System Components

The Asset-Lock system consists of four primary tiers:

```
[ Client Browser ]
  ├── React 18 + Vite SPA
  ├── Tailwind CSS Cybersecurity Theme
  ├── Ethers.js Web3 Provider
  └── MetaMask Wallet Extension
          |
          | HTTPS / REST / JWT
          v
[ Backend API Layer ]
  ├── Node.js + Express.js API
  ├── AES-256-CBC Cryptography Engine
  ├── SHA-256 Hash Calculation
  ├── Pinata IPFS Gateway Client
  └── Ethers.js Contract Signer
      /       |        \
     /        |         \
    v         v          v
[ Supabase ] [ IPFS ] [ Hardhat / Ethereum ]
  Postgres     Pinata    AssetLock.sol
```

## 2. Threat Model & Security Invariants

1. **Confidentiality:** Original files are never transmitted to IPFS or database unencrypted. Encryption happens in memory before any external transmission.
2. **Integrity:** SHA-256 hash is computed on original file and committed to the Ethereum blockchain. Any byte tampering in IPFS is immediately detected during verification.
3. **Availability:** Encrypted content is stored on the decentralized IPFS network via Pinata pinning.
4. **Non-repudiation:** Access grant and revoke events are emitted and signed on the blockchain by asset owners.
5. **Least Privilege:** Admin roles have visibility into system metrics and audit logs but cannot decrypt user assets without owner permission.

## 3. Cryptographic Specification

- **Symmetric Cipher:** AES-256 in Cipher Block Chaining (CBC) mode with PKCS#7 padding.
- **Key Derivation:** Cryptographically secure 256-bit keys generated via Node.js `crypto.randomBytes(32)`.
- **Initialization Vector:** Unique 128-bit IV generated per file via `crypto.randomBytes(16)`.
- **Hashing Algorithm:** FIPS 180-4 compliant SHA-256 digest encoded as a 64-character lowercase hex string.
- **Password Storing:** Bcrypt with 12 salt rounds.
- **Session Tokens:** HMAC SHA-256 JWT tokens with 7-day expiration.

## 4. Smart Contract Permission Logic (`AssetLock.sol`)

- **Ownership Invariant:** Only the original registrar (`msg.sender` in `registerAsset`) is designated as asset owner.
- **Access Control:** `grantAccess` and `revokeAccess` enforce `onlyAssetOwner` modifier.
- **Reentrancy Protection:** All state-modifying functions utilize OpenZeppelin `ReentrancyGuard`.
- **Zero Address Checks:** Rejects operations with `address(0)`.

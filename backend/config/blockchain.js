'use strict';
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SIM_FILE = path.join(__dirname, '../../database/blockchain_sim.json');
const ABI_PATH = path.join(__dirname, '../../blockchain/artifacts/AssetAccessControl.json');

class BlockchainService {
  constructor() {
    this.isLive = false;
    this.provider = null;
    this.contract = null;
    this.signer = null;
    this.sim = this._loadSim();
    this._init();
  }

  _loadSim() {
    if (fs.existsSync(SIM_FILE)) {
      try { return JSON.parse(fs.readFileSync(SIM_FILE, 'utf8')); } catch (err) {}
    }
    return { blockNumber: 100, assets: {}, permissions: {}, events: [] };
  }

  _saveSim() {
    fs.mkdirSync(path.dirname(SIM_FILE), { recursive: true });
    fs.writeFileSync(SIM_FILE, JSON.stringify(this.sim, null, 2));
  }

  async _init() {
    const rpc = process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545';
    try {
      // Test if Hardhat node is actively accepting HTTP requests
      const res = await fetch(rpc, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 1 }),
        signal: AbortSignal.timeout(600),
      });
      if (!res.ok) throw new Error('RPC response not OK');

      const p = new ethers.JsonRpcProvider(rpc);
      const depFile = path.join(__dirname, '../../blockchain/artifacts/deployment.json');
      if (fs.existsSync(ABI_PATH) && fs.existsSync(depFile)) {
        const abi = JSON.parse(fs.readFileSync(ABI_PATH, 'utf8')).abi;
        const dep = JSON.parse(fs.readFileSync(depFile, 'utf8'));
        const pk = process.env.DEPLOYER_PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
        this.provider = p;
        this.signer = new ethers.Wallet(pk, this.provider);
        this.contract = new ethers.Contract(dep.address, abi, this.signer);
        this.isLive = true;
        console.log('[Blockchain] Connected to live Hardhat node. Contract:', dep.address);
      } else {
        console.log('[Blockchain] Hardhat node online. Contract not deployed yet (using simulation mode).');
      }
    } catch (err) {
      console.log('[Blockchain] Hardhat node offline. Using deterministic cryptographic simulation engine.');
    }
  }

  _txHash(data) {
    return '0x' + crypto.createHash('sha256').update(JSON.stringify(data) + Date.now()).digest('hex');
  }

  _block() {
    this.sim.blockNumber++;
    this._saveSim();
    return this.sim.blockNumber;
  }

  async registerAsset(assetId, fileHash, ipfsCID, ownerAddress) {
    if (this.isLive && this.contract) {
      try {
        const tx = await this.contract.registerAsset(assetId, fileHash, ipfsCID);
        const receipt = await tx.wait();
        return { txHash: receipt.hash, blockNumber: Number(receipt.blockNumber), mode: 'LIVE' };
      } catch (e) {
        console.warn('[Blockchain] Live call failed, falling back to sim:', e.message);
      }
    }
    const txHash = this._txHash({ assetId, fileHash, ipfsCID, ownerAddress });
    const blockNumber = this._block();
    if (!this.sim.assets) this.sim.assets = {};
    const normOwner = (ownerAddress || '0x0000000000000000000000000000000000000000').toLowerCase();
    this.sim.assets[assetId] = {
      fileHash,
      ipfsCID,
      owner: normOwner,
      createdAt: Date.now(),
      permissions: { [normOwner]: true },
    };
    this.sim.events.push({ event: 'AssetRegistered', assetId, fileHash, ipfsCID, owner: normOwner, txHash, blockNumber, ts: Date.now() });
    this._saveSim();
    return { txHash, blockNumber, mode: 'SIMULATION' };
  }

  async grantAccess(assetId, userAddress, ownerAddress) {
    const normUser = (userAddress || '').toLowerCase();
    const normOwner = (ownerAddress || '').toLowerCase();
    if (this.isLive && this.contract) {
      try {
        const tx = await this.contract.grantAccess(assetId, userAddress);
        const receipt = await tx.wait();
        return { txHash: receipt.hash, blockNumber: Number(receipt.blockNumber), mode: 'LIVE' };
      } catch (e) { console.warn('[Blockchain] grantAccess live fail:', e.message); }
    }
    const txHash = this._txHash({ assetId, userAddress: normUser, ownerAddress: normOwner, op: 'grant' });
    const blockNumber = this._block();
    if (this.sim.assets[assetId]) {
      if (!this.sim.assets[assetId].permissions) this.sim.assets[assetId].permissions = {};
      this.sim.assets[assetId].permissions[normUser] = true;
    }
    this.sim.events.push({ event: 'PermissionGranted', assetId, user: normUser, grantedBy: normOwner, txHash, blockNumber, ts: Date.now() });
    this._saveSim();
    return { txHash, blockNumber, mode: 'SIMULATION' };
  }

  async revokeAccess(assetId, userAddress, ownerAddress) {
    const normUser = (userAddress || '').toLowerCase();
    const normOwner = (ownerAddress || '').toLowerCase();
    if (this.isLive && this.contract) {
      try {
        const tx = await this.contract.revokeAccess(assetId, userAddress);
        const receipt = await tx.wait();
        return { txHash: receipt.hash, blockNumber: Number(receipt.blockNumber), mode: 'LIVE' };
      } catch (e) { console.warn('[Blockchain] revokeAccess live fail:', e.message); }
    }
    const txHash = this._txHash({ assetId, userAddress: normUser, ownerAddress: normOwner, op: 'revoke' });
    const blockNumber = this._block();
    if (this.sim.assets[assetId]?.permissions) {
      this.sim.assets[assetId].permissions[normUser] = false;
    }
    this.sim.events.push({ event: 'PermissionRevoked', assetId, user: normUser, revokedBy: normOwner, txHash, blockNumber, ts: Date.now() });
    this._saveSim();
    return { txHash, blockNumber, mode: 'SIMULATION' };
  }

  async hasAccess(assetId, userAddress) {
    const normUser = (userAddress || '').toLowerCase();
    if (this.isLive && this.contract) {
      try {
        const [granted, isOwner] = await this.contract.hasAccess(assetId, userAddress);
        return { granted, isOwner, mode: 'LIVE' };
      } catch (e) { console.warn('[Blockchain] hasAccess live fail:', e.message); }
    }
    const asset = this.sim.assets?.[assetId];
    if (!asset) return { granted: false, isOwner: false, mode: 'SIMULATION' };
    const isOwner = asset.owner?.toLowerCase() === normUser;
    const granted = isOwner || !!(asset.permissions?.[normUser]);
    return { granted, isOwner, mode: 'SIMULATION' };
  }

  async getAsset(assetId) {
    if (this.isLive && this.contract) {
      try {
        const [fileHash, ipfsCID, owner, createdAt] = await this.contract.getAsset(assetId);
        return { fileHash, ipfsCID, owner, createdAt: Number(createdAt), mode: 'LIVE' };
      } catch (e) { console.warn('[Blockchain] getAsset live fail:', e.message); }
    }
    const asset = this.sim.assets?.[assetId];
    if (!asset) return null;
    return { fileHash: asset.fileHash, ipfsCID: asset.ipfsCID, owner: asset.owner, createdAt: asset.createdAt, mode: 'SIMULATION' };
  }

  async recordAccess(assetId, userAddress, action, granted) {
    const normUser = (userAddress || '').toLowerCase();
    if (this.isLive && this.contract) {
      try {
        const tx = await this.contract.recordAccess(assetId, action, granted);
        await tx.wait();
        return;
      } catch (e) {}
    }
    const txHash = this._txHash({ assetId, userAddress: normUser, action, granted });
    const blockNumber = this._block();
    this.sim.events.push({ event: 'AccessAttempted', assetId, user: normUser, action, granted, txHash, blockNumber, ts: Date.now() });
    this._saveSim();
    return txHash;
  }

  async getStatus() {
    if (this.isLive) {
      try {
        const block = await this.provider.getBlockNumber();
        const net = await this.provider.getNetwork();
        return { mode: 'LIVE', connected: true, blockNumber: block, chainId: Number(net.chainId), rpcUrl: process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545' };
      } catch (e) {}
    }
    return { mode: 'SIMULATION', connected: false, blockNumber: this.sim.blockNumber, chainId: 31337, rpcUrl: 'Deterministic Local Simulation Engine' };
  }
}

module.exports = new BlockchainService();


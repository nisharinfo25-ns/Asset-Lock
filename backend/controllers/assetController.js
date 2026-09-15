'use strict';
const multer = require('multer');
const crypto = require('crypto');
const CryptoService = require('../services/cryptoService');
const IPFSService = require('../services/ipfsService');
const blockchain = require('../config/blockchain');
const AssetModel = require('../models/Asset');
const PermissionModel = require('../models/Permission');
const AuditLog = require('../models/AuditLog');
const UserModel = require('../models/User');

exports.upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

exports.uploadAsset = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });
    const { name, description } = req.body;
    const assetName = name || req.file.originalname;
    const originalBuffer = req.file.buffer;

    // Step 1: SHA-256 hash of ORIGINAL plaintext file
    const fileHash = CryptoService.sha256(originalBuffer);

    // Step 2: Encrypt file with AES-256-GCM
    const enc = CryptoService.encrypt(originalBuffer);

    // Step 3: Upload encrypted file to IPFS
    const ipfsResult = await IPFSService.upload(enc.ciphertext, req.file.originalname + '.enc');
    const ipfsCID = ipfsResult.cid;

    // Step 4: Register on blockchain (hash + CID + owner)
    const assetId = 'ASSET-' + Date.now() + '-' + crypto.randomBytes(3).toString('hex').toUpperCase();
    const txResult = await blockchain.registerAsset(assetId, fileHash, ipfsCID, req.user.walletAddress);

    // Step 5: Save to DB
    const asset = AssetModel.create({
      assetId, name: assetName, description: description || '',
      ownerId: req.user._id, ownerEmail: req.user.email, ownerWallet: req.user.walletAddress || '',
      fileHash, ipfsCID,
      fileType: req.file.mimetype || 'application/octet-stream',
      fileSize: originalBuffer.length,
      encryptedMeta: { iv: enc.iv, authTag: enc.authTag, salt: enc.salt },
      txHash: txResult.txHash, blockNumber: txResult.blockNumber,
      blockchainMode: txResult.mode,
    });

    // Step 6: Owner permission
    PermissionModel.create({
      assetId, userId: req.user._id, userEmail: req.user.email,
      userWallet: req.user.walletAddress || '', status: 'Active',
      grantedBy: req.user.email, txHash: txResult.txHash,
    });

    AuditLog.create({
      assetId, assetName, user: req.user.email, action: 'UPLOAD', result: 'SUCCESS',
      details: `SHA-256: ${fileHash} | IPFS CID: ${ipfsCID} | Block: ${txResult.blockNumber}`,
      txHash: txResult.txHash,
    });

    return res.status(201).json({ message: 'Asset uploaded, encrypted, and anchored to blockchain', asset, ipfs: ipfsResult, blockchain: txResult });
  } catch (e) { console.error('[Upload]', e); return res.status(500).json({ error: e.message }); }
};

exports.listAssets = async (req, res) => {
  try {
    const { scope } = req.query;
    let allAssets = AssetModel.findAll();
    if (scope === 'mine') allAssets = allAssets.filter(a => a.ownerEmail === req.user.email);
    else if (scope === 'shared') {
      const perms = PermissionModel.find({ userEmail: req.user.email, status: 'Active' }).map(p => p.assetId);
      const ownedIds = allAssets.filter(a => a.ownerEmail === req.user.email).map(a => a.assetId);
      allAssets = allAssets.filter(a => perms.includes(a.assetId) && !ownedIds.includes(a.assetId));
    }
    const result = allAssets.map(a => ({
      ...a, encryptedMeta: undefined,
      isOwner: a.ownerEmail === req.user.email,
    }));
    return res.json({ assets: result });
  } catch (e) { return res.status(500).json({ error: e.message }); }
};

exports.getAsset = async (req, res) => {
  try {
    const asset = AssetModel.findOne({ assetId: req.params.id });
    if (!asset) return res.status(404).json({ error: 'Asset not found' });
    const isOwner = asset.ownerEmail === req.user.email;
    const perm = PermissionModel.findOne({ assetId: req.params.id, userEmail: req.user.email, status: 'Active' });
    const hasAccess = isOwner || !!perm;
    const permissions = PermissionModel.find({ assetId: req.params.id });
    return res.json({ asset: { ...asset, encryptedMeta: undefined }, isOwner, hasAccess, permissions });
  } catch (e) { return res.status(500).json({ error: e.message }); }
};

exports.checkAccess = async (req, res) => {
  try {
    const { id } = req.params;
    const asset = AssetModel.findOne({ assetId: id });
    if (!asset) return res.status(404).json({ error: 'Asset not found' });

    // Check blockchain
    const bcAccess = await blockchain.hasAccess(id, req.user.walletAddress || '0x0000000000000000000000000000000000000000');
    // Also check DB (wallet might differ from owner email match)
    const isOwner = asset.ownerEmail === req.user.email;
    const perm = PermissionModel.findOne({ assetId: id, userEmail: req.user.email, status: 'Active' });
    const granted = isOwner || !!perm || bcAccess.granted;

    // Record access attempt on blockchain
    await blockchain.recordAccess(id, req.user.walletAddress || '0x0', 'ACCESS_CHECK', granted);

    AuditLog.create({
      assetId: id, assetName: asset.name, user: req.user.email,
      action: 'ACCESS', result: granted ? 'GRANTED' : 'DENIED',
      details: `Blockchain mode: ${bcAccess.mode}`, txHash: '',
    });

    if (!granted) return res.status(403).json({ status: 'ACCESS DENIED', granted: false });

    // Retrieve and decrypt file
    const encryptedBuffer = await IPFSService.retrieve(asset.ipfsCID);
    const decrypted = CryptoService.decrypt(
      encryptedBuffer,
      asset.encryptedMeta.iv,
      asset.encryptedMeta.authTag,
      asset.encryptedMeta.salt
    );

    res.setHeader('Content-Type', asset.fileType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${asset.name}"`);
    res.setHeader('X-Access-Status', 'GRANTED');
    res.setHeader('X-Blockchain-Mode', bcAccess.mode);
    return res.send(decrypted);
  } catch (e) { console.error('[Access]', e); return res.status(500).json({ error: e.message }); }
};

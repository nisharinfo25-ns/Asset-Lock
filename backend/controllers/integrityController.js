'use strict';
const CryptoService = require('../services/cryptoService');
const IPFSService = require('../services/ipfsService');
const blockchain = require('../config/blockchain');
const AssetModel = require('../models/Asset');
const PermissionModel = require('../models/Permission');
const AuditLog = require('../models/AuditLog');

exports.verifyIntegrity = async (req, res) => {
  try {
    const { id: assetId } = req.params;
    const asset = AssetModel.findOne({ assetId });
    if (!asset) return res.status(404).json({ error: 'Asset not found' });

    // Check user has access
    const isOwner = asset.ownerEmail === req.user.email;
    const perm = PermissionModel.findOne({ assetId, userEmail: req.user.email, status: 'Active' });
    if (!isOwner && !perm) return res.status(403).json({ error: 'Access denied' });

    // 1. Retrieve encrypted file from IPFS
    const encryptedBuffer = await IPFSService.retrieve(asset.ipfsCID);

    // 2. Decrypt the file
    const decryptedBuffer = CryptoService.decrypt(
      encryptedBuffer,
      asset.encryptedMeta.iv,
      asset.encryptedMeta.authTag,
      asset.encryptedMeta.salt
    );

    // 3. Recalculate SHA-256 of decrypted (original) content
    const currentHash = CryptoService.sha256(decryptedBuffer);

    // 4. Get original hash from blockchain
    const bcAsset = await blockchain.getAsset(assetId);
    const storedHash = bcAsset ? bcAsset.fileHash : asset.fileHash;

    // 5. Compare
    const verified = currentHash === storedHash;
    const status = verified ? 'INTEGRITY VERIFIED' : 'TAMPER DETECTED';

    AuditLog.create({
      assetId, assetName: asset.name, user: req.user.email,
      action: 'INTEGRITY_CHECK', result: verified ? 'VERIFIED' : 'TAMPER_DETECTED',
      details: `Current: ${currentHash} | Stored: ${storedHash}`,
      txHash: '',
    });

    return res.json({
      status,
      verified,
      currentHash,
      storedHash,
      match: verified,
      asset: { assetId, name: asset.name, ipfsCID: asset.ipfsCID },
    });
  } catch (e) { console.error('[Integrity]', e); return res.status(500).json({ error: e.message }); }
};

'use strict';
const blockchain = require('../config/blockchain');
const PermissionModel = require('../models/Permission');
const AssetModel = require('../models/Asset');
const AuditLog = require('../models/AuditLog');
const UserModel = require('../models/User');

exports.grantPermission = async (req, res) => {
  try {
    const { id: assetId } = req.params;
    const { userEmail, userWallet } = req.body;
    if (!userEmail && !userWallet) return res.status(400).json({ error: 'userEmail or userWallet required' });

    const asset = AssetModel.findOne({ assetId });
    if (!asset) return res.status(404).json({ error: 'Asset not found' });
    if (asset.ownerEmail !== req.user.email) return res.status(403).json({ error: 'Only the asset owner can grant permissions' });

    // Find target user
    let targetUser = userEmail ? UserModel.findByEmail(userEmail) : UserModel.findByWallet(userWallet);
    if (!targetUser) return res.status(404).json({ error: 'Target user not found' });

    // Check for duplicate
    const existing = PermissionModel.findOne({ assetId, userEmail: targetUser.email, status: 'Active' });
    if (existing) return res.status(409).json({ error: 'User already has access' });

    // Grant on blockchain
    const txResult = await blockchain.grantAccess(assetId, targetUser.walletAddress, req.user.walletAddress);

    // Save to DB
    const perm = PermissionModel.create({
      assetId, userId: targetUser._id, userEmail: targetUser.email,
      userWallet: targetUser.walletAddress, status: 'Active',
      grantedBy: req.user.email, txHash: txResult.txHash,
    });

    AuditLog.create({
      assetId, assetName: asset.name, user: req.user.email,
      action: 'PERMISSION_GRANTED', result: 'SUCCESS',
      details: `Granted to: ${targetUser.email} | Block: ${txResult.blockNumber}`,
      txHash: txResult.txHash,
    });

    return res.status(201).json({ message: 'Permission granted', permission: perm, blockchain: txResult });
  } catch (e) { return res.status(500).json({ error: e.message }); }
};

exports.revokePermission = async (req, res) => {
  try {
    const { id: assetId, wallet } = req.params;
    const asset = AssetModel.findOne({ assetId });
    if (!asset) return res.status(404).json({ error: 'Asset not found' });
    if (asset.ownerEmail !== req.user.email) return res.status(403).json({ error: 'Only the asset owner can revoke permissions' });

    const targetUser = UserModel.findByWallet(wallet);
    if (!targetUser) return res.status(404).json({ error: 'User not found for wallet: ' + wallet });

    PermissionModel.update({ assetId, userWallet: wallet.toLowerCase(), status: 'Active' }, { status: 'Revoked' });

    // Revoke on blockchain
    const txResult = await blockchain.revokeAccess(assetId, wallet, req.user.walletAddress);

    AuditLog.create({
      assetId, assetName: asset.name, user: req.user.email,
      action: 'PERMISSION_REVOKED', result: 'SUCCESS',
      details: `Revoked from: ${targetUser.email} | Block: ${txResult.blockNumber}`,
      txHash: txResult.txHash,
    });

    return res.json({ message: 'Permission revoked', blockchain: txResult });
  } catch (e) { return res.status(500).json({ error: e.message }); }
};

exports.listPermissions = (req, res) => {
  try {
    const perms = PermissionModel.find({ assetId: req.params.id });
    return res.json({ permissions: perms });
  } catch (e) { return res.status(500).json({ error: e.message }); }
};

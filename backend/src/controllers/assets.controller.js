const multer = require('multer');
const { supabase } = require('../config/supabase');
const { db } = require('../services/dbStore.service');
const { sendSuccess, sendError } = require('../utils/response');
const { encryptBuffer, generateHash } = require('../services/encryption.service');
const { uploadToIPFS, retrieveFromIPFS, isPinataConfigured } = require('../services/ipfs.service');
const { registerAsset: registerOnChain, verifyIntegrity: verifyOnChain, isBlockchainConfigured } = require('../services/blockchain.service');
const { createAuditLog } = require('../services/audit.service');

// Multer config - store in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    // Allow common file types
    cb(null, true);
  }
}).single('file');

const uploadAsset = async (req, res) => {
  upload(req, res, async (uploadErr) => {
    if (uploadErr) {
      if (uploadErr.code === 'LIMIT_FILE_SIZE') {
        return sendError(res, 400, 'File size exceeds 50MB limit');
      }
      return sendError(res, 400, `File upload error: ${uploadErr.message}`);
    }

    try {
      const { name, description } = req.body;
      const userId = req.user.id;
      const file = req.file;

      if (!file) return sendError(res, 400, 'No file provided');
      if (!name) return sendError(res, 400, 'Asset name is required');

      if (!isPinataConfigured()) {
        return sendError(res, 503, 'IPFS storage is not configured. Please set PINATA_JWT in environment variables.');
      }

      // Step 1: Encrypt
      const { encryptedData, iv, key } = encryptBuffer(file.buffer);

      // Step 2: Hash (of original file)
      const fileHash = generateHash(file.buffer);

      // Step 3: Upload encrypted file to IPFS
      const encryptedFileName = `encrypted_${Date.now()}_${file.originalname}`;
      let ipfsResult;
      try {
        ipfsResult = await uploadToIPFS(encryptedData, encryptedFileName, 'application/octet-stream');
      } catch (ipfsErr) {
        return sendError(res, 503, `IPFS upload failed: ${ipfsErr.message}`);
      }

      // Step 4: Save asset record (Supabase or in-memory fallback)
      let asset;
      try {
        asset = await db.assets.create({
          name: name.trim(),
          description: description?.trim() || '',
          owner_id: userId,
          ipfs_cid: ipfsResult.cid,
          file_hash: fileHash,
          file_size: file.size,
          file_type: file.mimetype,
          encrypted_file_metadata: {
            iv,
            key,
            originalName: file.originalname,
            originalSize: file.size,
            mimeType: file.mimetype
          }
        });
      } catch (dbErr) {
        console.error('Asset DB error:', dbErr);
        return sendError(res, 500, 'Failed to save asset metadata: ' + dbErr.message);
      }

      if (!asset) {
        return sendError(res, 500, 'Failed to save asset metadata');
      }

      // Step 5: Register on blockchain
      let blockchainResult = null;
      let blockchainAssetId = null;
      if (isBlockchainConfigured()) {
        try {
          blockchainResult = await registerOnChain(asset.id, fileHash, ipfsResult.cid);
          blockchainAssetId = asset.id;

          // Update with blockchain tx hash
          await supabase
            .from('assets')
            .update({ blockchain_asset_id: blockchainResult.transactionHash })
            .eq('id', asset.id);

          asset.blockchain_asset_id = blockchainResult.transactionHash;
        } catch (bcErr) {
          console.error('Blockchain registration warning:', bcErr.message);
          // Continue - blockchain is optional during development
        }
      }

      // Audit log
      await createAuditLog({
        assetId: asset.id,
        userId,
        action: 'ASSET_UPLOADED',
        details: { fileName: file.originalname, ipfsCid: ipfsResult.cid, fileHash },
        transactionHash: blockchainResult?.transactionHash,
        status: 'success'
      });

      return sendSuccess(res, {
        asset,
        ipfsCid: ipfsResult.cid,
        fileHash,
        blockchain: blockchainResult,
        gatewayUrl: ipfsResult.gatewayUrl
      }, 201, 'Asset uploaded and secured successfully');
    } catch (err) {
      console.error('Upload error:', err);
      return sendError(res, 500, err.message || 'Asset upload failed');
    }
  });
};

const getAssets = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    const data = await db.assets.getAll(userId, userRole);

    // Remove sensitive encryption key from response
    const safeAssets = data.map(asset => ({
      ...asset,
      encrypted_file_metadata: asset.encrypted_file_metadata
        ? { originalName: asset.encrypted_file_metadata.originalName, mimeType: asset.encrypted_file_metadata.mimeType, originalSize: asset.encrypted_file_metadata.originalSize }
        : null
    }));

    return sendSuccess(res, { assets: safeAssets });
  } catch (err) {
    return sendError(res, 500, 'Failed to fetch assets');
  }
};

const getAssetById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const asset = await db.assets.getById(id);
    if (!asset) return sendError(res, 404, 'Asset not found');

    // Access check: owner or admin
    if (userRole !== 'admin' && asset.owner_id !== userId) {
      // Check permission via supabase (graceful fallback: allow if no supabase)
      try {
        const { data: permission } = await supabase
          .from('permissions')
          .select('id, status')
          .eq('asset_id', id)
          .eq('user_id', userId)
          .eq('status', 'active')
          .single();
        if (!permission) return sendError(res, 403, 'Access denied. You do not have permission to view this asset.');
      } catch (_) {
        return sendError(res, 403, 'Access denied. You do not have permission to view this asset.');
      }
    }

    // Remove sensitive key
    if (asset.encrypted_file_metadata) {
      const { key, iv, ...safeMetadata } = asset.encrypted_file_metadata;
      asset.encrypted_file_metadata = safeMetadata;
    }

    return sendSuccess(res, { asset });
  } catch (err) {
    return sendError(res, 500, 'Failed to fetch asset');
  }
};


const getSharedAssets = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data, error } = await supabase
      .from('permissions')
      .select(`
        *,
        asset:assets(
          *,
          owner:users!assets_owner_id_fkey(id, name, email)
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active');

    if (error) return sendError(res, 500, 'Failed to fetch shared assets');

    return sendSuccess(res, { shared: data });
  } catch (err) {
    return sendError(res, 500, 'Failed to fetch shared assets');
  }
};

const grantAccess = async (req, res) => {
  try {
    const { id: assetId } = req.params;
    const { userId: targetUserId } = req.body;
    const requesterId = req.user.id;

    // Verify ownership
    const { data: asset } = await supabase
      .from('assets')
      .select('id, owner_id')
      .eq('id', assetId)
      .single();

    if (!asset) return sendError(res, 404, 'Asset not found');
    if (asset.owner_id !== requesterId && req.user.role !== 'admin') {
      return sendError(res, 403, 'Only the asset owner can grant access');
    }

    // Get target user
    const { data: targetUser } = await supabase
      .from('users')
      .select('id, wallet_address, name')
      .eq('id', targetUserId)
      .single();

    if (!targetUser) return sendError(res, 404, 'User not found');

    // Upsert permission
    const { data: permission, error: permError } = await supabase
      .from('permissions')
      .upsert({
        asset_id: assetId,
        user_id: targetUserId,
        permission: 'read',
        status: 'active',
        granted_at: new Date().toISOString(),
        granted_by: requesterId,
        revoked_at: null
      }, { onConflict: 'asset_id,user_id' })
      .select()
      .single();

    if (permError) return sendError(res, 500, 'Failed to grant permission');

    // Blockchain grant
    let blockchainResult = null;
    if (isBlockchainConfigured() && targetUser.wallet_address) {
      try {
        const { grantAccess: grantOnChain } = require('../services/blockchain.service');
        blockchainResult = await grantOnChain(assetId, targetUser.wallet_address);
      } catch (bcErr) {
        console.error('Blockchain grant warning:', bcErr.message);
      }
    }

    // Update access request if exists
    await supabase.from('access_requests')
      .update({ status: 'approved', responded_at: new Date().toISOString() })
      .eq('asset_id', assetId)
      .eq('requester_id', targetUserId)
      .eq('status', 'pending');

    await createAuditLog({
      assetId,
      userId: requesterId,
      action: 'ACCESS_GRANTED',
      details: { targetUserId, targetUser: targetUser.name },
      transactionHash: blockchainResult?.transactionHash
    });

    return sendSuccess(res, { permission, blockchain: blockchainResult }, 200, 'Access granted successfully');
  } catch (err) {
    return sendError(res, 500, err.message || 'Failed to grant access');
  }
};

const revokeAccess = async (req, res) => {
  try {
    const { id: assetId } = req.params;
    const { userId: targetUserId } = req.body;
    const requesterId = req.user.id;

    const { data: asset } = await supabase.from('assets').select('id, owner_id').eq('id', assetId).single();
    if (!asset) return sendError(res, 404, 'Asset not found');
    if (asset.owner_id !== requesterId && req.user.role !== 'admin') {
      return sendError(res, 403, 'Only the asset owner can revoke access');
    }

    const { data: targetUser } = await supabase.from('users').select('id, wallet_address, name').eq('id', targetUserId).single();
    if (!targetUser) return sendError(res, 404, 'User not found');

    const { error } = await supabase
      .from('permissions')
      .update({ status: 'revoked', revoked_at: new Date().toISOString() })
      .eq('asset_id', assetId)
      .eq('user_id', targetUserId);

    if (error) return sendError(res, 500, 'Failed to revoke permission');

    let blockchainResult = null;
    if (isBlockchainConfigured() && targetUser.wallet_address) {
      try {
        const { revokeAccess: revokeOnChain } = require('../services/blockchain.service');
        blockchainResult = await revokeOnChain(assetId, targetUser.wallet_address);
      } catch (bcErr) {
        console.error('Blockchain revoke warning:', bcErr.message);
      }
    }

    await createAuditLog({
      assetId,
      userId: requesterId,
      action: 'ACCESS_REVOKED',
      details: { targetUserId, targetUser: targetUser.name },
      transactionHash: blockchainResult?.transactionHash
    });

    return sendSuccess(res, { blockchain: blockchainResult }, 200, 'Access revoked successfully');
  } catch (err) {
    return sendError(res, 500, err.message || 'Failed to revoke access');
  }
};

const requestAccess = async (req, res) => {
  try {
    const { id: assetId } = req.params;
    const requesterId = req.user.id;
    const { message } = req.body;

    const { data: asset } = await supabase.from('assets').select('id, owner_id, name').eq('id', assetId).single();
    if (!asset) return sendError(res, 404, 'Asset not found');
    if (asset.owner_id === requesterId) return sendError(res, 400, 'You already own this asset');

    // Check if already has permission
    const { data: existingPerm } = await supabase
      .from('permissions').select('status').eq('asset_id', assetId).eq('user_id', requesterId).single();
    if (existingPerm?.status === 'active') return sendError(res, 400, 'You already have access to this asset');

    const { data: request, error } = await supabase
      .from('access_requests')
      .upsert({
        asset_id: assetId,
        requester_id: requesterId,
        owner_id: asset.owner_id,
        status: 'pending',
        message: message || '',
        requested_at: new Date().toISOString(),
        responded_at: null
      }, { onConflict: 'asset_id,requester_id' })
      .select()
      .single();

    if (error) return sendError(res, 500, 'Failed to submit access request');

    await createAuditLog({
      assetId,
      userId: requesterId,
      action: 'ACCESS_REQUESTED',
      details: { assetName: asset.name }
    });

    return sendSuccess(res, { request }, 201, 'Access request submitted');
  } catch (err) {
    return sendError(res, 500, 'Failed to request access');
  }
};

const verifyIntegrity = async (req, res) => {
  try {
    const { id: assetId } = req.params;
    const userId = req.user.id;

    const { data: asset } = await supabase
      .from('assets')
      .select('*')
      .eq('id', assetId)
      .single();

    if (!asset) return sendError(res, 404, 'Asset not found');

    // Check access
    if (asset.owner_id !== userId && req.user.role !== 'admin') {
      const { data: perm } = await supabase
        .from('permissions').select('status').eq('asset_id', assetId).eq('user_id', userId).eq('status', 'active').single();
      if (!perm) return sendError(res, 403, 'Access denied');
    }

    let verificationResult = {
      storedHash: asset.file_hash,
      currentHash: null,
      isMatch: null,
      verifiedAt: new Date().toISOString(),
      source: 'database'
    };

    // Try blockchain verification
    if (isBlockchainConfigured() && asset.ipfs_cid) {
      try {
        const { retrieveFromIPFS } = require('../services/ipfs.service');
        const fileBuffer = await retrieveFromIPFS(asset.ipfs_cid);
        const { generateHash } = require('../services/encryption.service');
        const currentHash = generateHash(fileBuffer);
        const blockchainVerify = await verifyOnChain(assetId, currentHash);
        verificationResult = {
          ...verificationResult,
          ...blockchainVerify,
          verifiedAt: new Date().toISOString(),
          source: 'blockchain'
        };
      } catch (err) {
        verificationResult.error = err.message;
      }
    }

    await createAuditLog({
      assetId,
      userId,
      action: 'INTEGRITY_VERIFIED',
      details: { isMatch: verificationResult.isMatch },
      status: verificationResult.isMatch === false ? 'failed' : 'success'
    });

    return sendSuccess(res, { verification: verificationResult });
  } catch (err) {
    return sendError(res, 500, err.message || 'Integrity verification failed');
  }
};

const getAuditLogs = async (req, res) => {
  try {
    const { id: assetId } = req.params;
    const userId = req.user.id;

    const { data: asset } = await supabase.from('assets').select('owner_id').eq('id', assetId).single();
    if (!asset) return sendError(res, 404, 'Asset not found');

    if (asset.owner_id !== userId && req.user.role !== 'admin') {
      return sendError(res, 403, 'Access denied');
    }

    const { data, error } = await supabase
      .from('audit_logs')
      .select(`*, user:users(name, email)`)
      .eq('asset_id', assetId)
      .order('timestamp', { ascending: false });

    if (error) return sendError(res, 500, 'Failed to fetch audit logs');
    return sendSuccess(res, { logs: data });
  } catch (err) {
    return sendError(res, 500, 'Failed to fetch audit logs');
  }
};

module.exports = { uploadAsset, getAssets, getAssetById, grantAccess, revokeAccess, requestAccess, verifyIntegrity, getAuditLogs, getSharedAssets };

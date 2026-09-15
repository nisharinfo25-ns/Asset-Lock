'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/assetController');
const permCtrl = require('../controllers/permissionController');
const intCtrl = require('../controllers/integrityController');
const auditCtrl = require('../controllers/auditController');
const { authenticate } = require('../middleware/auth');

// Asset CRUD
router.post('/upload', authenticate, ctrl.upload.single('file'), ctrl.uploadAsset);
router.get('/', authenticate, ctrl.listAssets);
router.get('/:id', authenticate, ctrl.getAsset);
router.get('/:id/access', authenticate, ctrl.checkAccess);

// Permissions
router.get('/:id/permissions', authenticate, permCtrl.listPermissions);
router.post('/:id/permissions', authenticate, permCtrl.grantPermission);
router.delete('/:id/permissions/:wallet', authenticate, permCtrl.revokePermission);

// Integrity
router.get('/:id/verify', authenticate, intCtrl.verifyIntegrity);

// Audit per asset
router.get('/:id/audit', authenticate, auditCtrl.getAssetAudit);

module.exports = router;

const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const {
  uploadAsset, getAssets, getAssetById, grantAccess, revokeAccess,
  requestAccess, verifyIntegrity, getAuditLogs, getSharedAssets
} = require('../controllers/assets.controller');

router.use(authenticate);
router.get('/shared', getSharedAssets);
router.post('/upload', uploadAsset);
router.get('/', getAssets);
router.get('/:id', getAssetById);
router.post('/:id/request-access', requestAccess);
router.post('/:id/grant-access', grantAccess);
router.post('/:id/revoke-access', revokeAccess);
router.post('/:id/verify-integrity', verifyIntegrity);
router.get('/:id/audit', getAuditLogs);

module.exports = router;

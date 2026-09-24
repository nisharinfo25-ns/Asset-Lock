const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { getAllAuditLogs } = require('../controllers/audit.controller');

router.use(authenticate);
router.get('/', getAllAuditLogs);

module.exports = router;

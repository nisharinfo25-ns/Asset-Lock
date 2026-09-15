'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/auditController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, ctrl.getAuditLogs);

module.exports = router;

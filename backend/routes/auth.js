'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.post('/register', ctrl.register);
router.post('/login', ctrl.login);
router.get('/me', authenticate, ctrl.me);
router.get('/users', authenticate, ctrl.users);

module.exports = router;

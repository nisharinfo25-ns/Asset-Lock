const router = require('express').Router();
const { register, login, updateWallet, getProfile, getMe, logout } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);
router.get('/profile', authenticate, getProfile);
router.put('/wallet', authenticate, updateWallet);

module.exports = router;

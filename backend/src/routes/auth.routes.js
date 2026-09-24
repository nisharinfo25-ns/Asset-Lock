const router = require('express').Router();
const { register, login, updateWallet, getProfile } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/profile', authenticate, getProfile);
router.put('/wallet', authenticate, updateWallet);

module.exports = router;

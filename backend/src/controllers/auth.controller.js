const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../services/dbStore.service');
const { sendSuccess, sendError } = require('../utils/response');
const { validateEmail, validatePassword } = require('../utils/validators');
const { createAuditLog } = require('../services/audit.service');

const JWT_SECRET = process.env.JWT_SECRET || 'asset_lock_default_jwt_secret_key_32bytes_security_fallback';

const register = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, walletAddress } = req.body;

    // Validation
    if (!name || !email || !password) {
      return sendError(res, 400, 'Name, email and password are required');
    }
    if (!validateEmail(email)) {
      return sendError(res, 400, 'Invalid email address');
    }
    if (!validatePassword(password)) {
      return sendError(res, 400, 'Password must be at least 8 characters');
    }
    if (confirmPassword && password !== confirmPassword) {
      return sendError(res, 400, 'Passwords do not match');
    }

    // Check duplicate
    const existing = await db.users.findByEmail(email);
    if (existing) {
      return sendError(res, 409, 'An account with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await db.users.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password_hash: passwordHash,
      wallet_address: walletAddress || null,
      role: 'owner'
    });

    if (!user) {
      return sendError(res, 500, 'Failed to create account');
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    await createAuditLog({ userId: user.id, action: 'USER_REGISTERED', details: { email: user.email } });

    const { password_hash, ...safeUser } = user;
    return sendSuccess(res, { user: safeUser, token }, 201, 'Account created successfully');
  } catch (err) {
    console.error('Register error:', err);
    return sendError(res, 500, 'Registration failed: ' + (err.message || 'Server error'));
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 400, 'Email and password are required');
    }

    const user = await db.users.findByEmail(email);
    if (!user) {
      return sendError(res, 401, 'Invalid email or password');
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return sendError(res, 401, 'Invalid email or password');
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    await createAuditLog({ userId: user.id, action: 'USER_LOGIN', details: { email: user.email } });

    const { password_hash, ...safeUser } = user;
    return sendSuccess(res, { user: safeUser, token }, 200, 'Login successful');
  } catch (err) {
    console.error('Login error:', err);
    return sendError(res, 500, 'Login failed');
  }
};

const updateWallet = async (req, res) => {
  try {
    const { walletAddress } = req.body;
    const userId = req.user.id;

    const user = await db.users.updateWallet(userId, walletAddress);
    if (!user) return sendError(res, 500, 'Failed to update wallet address');

    await createAuditLog({ userId, action: 'WALLET_CONNECTED', details: { wallet: walletAddress } });

    const { password_hash, ...safeUser } = user;
    return sendSuccess(res, { user: safeUser }, 200, 'Wallet address updated');
  } catch (err) {
    return sendError(res, 500, 'Failed to update wallet');
  }
};

const getProfile = async (req, res) => {
  return sendSuccess(res, { user: req.user });
};

module.exports = { register, login, updateWallet, getProfile };

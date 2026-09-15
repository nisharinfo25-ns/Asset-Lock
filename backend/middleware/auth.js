'use strict';
const jwt = require('jsonwebtoken');
const UserModel = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'AssetLock_JWT_SECRET_CHANGE_IN_PRODUCTION';

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: no token' });
  }
  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = UserModel.findById(decoded.id);
    if (!user) return res.status(401).json({ error: 'Unauthorized: user not found' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized: invalid token' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Forbidden: requires role ${roles.join(' or ')}` });
    }
    next();
  };
}

module.exports = { signToken, authenticate, requireRole };

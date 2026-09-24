const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/jwt');
const { db } = require('../services/dbStore.service');
const { sendError } = require('../utils/response');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 401, 'Authentication required');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    // Verify user still exists
    const user = await db.users.findById(decoded.userId);

    if (!user) {
      return sendError(res, 401, 'Invalid authentication token');
    }

    const { password_hash, ...safeUser } = user;
    req.user = safeUser;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, 401, 'Authentication token expired');
    }
    return sendError(res, 401, 'Invalid authentication token');
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return sendError(res, 403, 'Admin access required');
  }
  next();
};

module.exports = { authenticate, requireAdmin };

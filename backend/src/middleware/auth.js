const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabase');
const { sendError } = require('../utils/response');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 401, 'Authentication required');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verify user still exists
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, role, wallet_address')
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      return sendError(res, 401, 'Invalid authentication token');
    }

    req.user = user;
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

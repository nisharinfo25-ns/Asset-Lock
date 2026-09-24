const { supabase } = require('../config/supabase');
const { sendSuccess, sendError } = require('../utils/response');

const getAllAuditLogs = async (req, res) => {
  try {
    const { action, userId, assetId, status, limit = 100, offset = 0 } = req.query;

    let query = supabase
      .from('audit_logs')
      .select(`
        *,
        user:users(id, name, email),
        asset:assets(id, name)
      `)
      .order('timestamp', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (action) query = query.eq('action', action);
    if (userId) query = query.eq('user_id', userId);
    if (assetId) query = query.eq('asset_id', assetId);
    if (status) query = query.eq('status', status);

    // Non-admins see only their own logs
    if (req.user.role !== 'admin') {
      query = query.eq('user_id', req.user.id);
    }

    const { data, error, count } = await query;
    if (error) return sendError(res, 500, 'Failed to fetch audit logs');
    return sendSuccess(res, { logs: data, total: count });
  } catch (err) {
    return sendError(res, 500, 'Failed to fetch audit logs');
  }
};

module.exports = { getAllAuditLogs };

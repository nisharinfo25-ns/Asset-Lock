const { supabase } = require('../config/supabase');
const { sendSuccess, sendError } = require('../utils/response');

const getRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let query = supabase
      .from('access_requests')
      .select(`
        *,
        asset:assets(id, name, description),
        requester:users!access_requests_requester_id_fkey(id, name, email, wallet_address),
        owner:users!access_requests_owner_id_fkey(id, name, email)
      `)
      .order('requested_at', { ascending: false });

    if (userRole !== 'admin') {
      // Return both incoming (owner) and outgoing (requester)
      query = supabase
        .from('access_requests')
        .select(`
          *,
          asset:assets(id, name, description),
          requester:users!access_requests_requester_id_fkey(id, name, email, wallet_address),
          owner:users!access_requests_owner_id_fkey(id, name, email)
        `)
        .or(`owner_id.eq.${userId},requester_id.eq.${userId}`)
        .order('requested_at', { ascending: false });
    }

    const { data, error } = await query;
    if (error) return sendError(res, 500, 'Failed to fetch requests');
    return sendSuccess(res, { requests: data });
  } catch (err) {
    return sendError(res, 500, 'Failed to fetch requests');
  }
};

const respondToRequest = async (req, res) => {
  try {
    const { id: requestId } = req.params;
    const { action } = req.body; // 'approve' or 'reject'
    const userId = req.user.id;

    if (!['approve', 'reject'].includes(action)) {
      return sendError(res, 400, 'Action must be approve or reject');
    }

    const { data: request } = await supabase
      .from('access_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (!request) return sendError(res, 404, 'Request not found');
    if (request.owner_id !== userId) return sendError(res, 403, 'Only the asset owner can respond to requests');
    if (request.status !== 'pending') return sendError(res, 400, 'Request is no longer pending');

    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    await supabase.from('access_requests')
      .update({ status: newStatus, responded_at: new Date().toISOString() })
      .eq('id', requestId);

    if (action === 'approve') {
      // Grant permission
      const { grantAccess } = require('../controllers/assets.controller');
      // Direct DB grant
      await supabase.from('permissions').upsert({
        asset_id: request.asset_id,
        user_id: request.requester_id,
        permission: 'read',
        status: 'active',
        granted_at: new Date().toISOString(),
        granted_by: userId
      }, { onConflict: 'asset_id,user_id' });

      const { createAuditLog } = require('../services/audit.service');
      await createAuditLog({
        assetId: request.asset_id,
        userId,
        action: 'ACCESS_GRANTED',
        details: { requestId, targetUserId: request.requester_id }
      });
    }

    return sendSuccess(res, {}, 200, `Request ${newStatus} successfully`);
  } catch (err) {
    return sendError(res, 500, 'Failed to respond to request');
  }
};

module.exports = { getRequests, respondToRequest };

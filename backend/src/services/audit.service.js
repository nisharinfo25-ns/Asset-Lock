const { supabase } = require('../config/supabase');

const createAuditLog = async ({ assetId, userId, action, details = {}, transactionHash = null, status = 'success' }) => {
  try {
    const { error } = await supabase.from('audit_logs').insert({
      asset_id: assetId || null,
      user_id: userId || null,
      action,
      details,
      transaction_hash: transactionHash,
      status,
      timestamp: new Date().toISOString()
    });
    
    if (error) console.error('Audit log error:', error);
  } catch (err) {
    console.error('Failed to create audit log:', err.message);
  }
};

module.exports = { createAuditLog };

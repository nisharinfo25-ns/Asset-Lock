const { supabase } = require('../config/supabase');
const { sendSuccess, sendError } = require('../utils/response');

const getUsers = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role, wallet_address, created_at')
      .order('created_at', { ascending: false });

    if (error) return sendError(res, 500, 'Failed to fetch users');
    return sendSuccess(res, { users: data });
  } catch (err) {
    return sendError(res, 500, 'Failed to fetch users');
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const validRoles = ['admin', 'owner', 'authorized_user', 'viewer'];
    if (!validRoles.includes(role)) {
      return sendError(res, 400, 'Invalid role');
    }

    const { data, error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', id)
      .select('id, name, email, role')
      .single();

    if (error) return sendError(res, 500, 'Failed to update role');
    return sendSuccess(res, { user: data }, 200, 'Role updated successfully');
  } catch (err) {
    return sendError(res, 500, 'Failed to update role');
  }
};

module.exports = { getUsers, updateUserRole };

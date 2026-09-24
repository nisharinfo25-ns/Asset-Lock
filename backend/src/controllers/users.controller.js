const { db } = require('../services/dbStore.service');
const { sendSuccess, sendError } = require('../utils/response');

const getUsers = async (req, res) => {
  try {
    const users = await db.users.getAll();
    return sendSuccess(res, { users });
  } catch (err) {
    return sendError(res, 500, 'Failed to fetch users');
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const roleUpper = role ? String(role).toUpperCase().trim() : '';
    const validRoles = ['ADMIN', 'USER'];
    if (!validRoles.includes(roleUpper)) {
      return sendError(res, 400, 'Invalid role. Only ADMIN and USER are allowed.');
    }

    const updatedUser = await db.users.updateRole(id, roleUpper);
    if (!updatedUser) return sendError(res, 404, 'User not found');

    const { password_hash, ...safeUser } = updatedUser;
    return sendSuccess(res, { user: safeUser }, 200, 'Role updated successfully');
  } catch (err) {
    return sendError(res, 500, 'Failed to update role');
  }
};

module.exports = { getUsers, updateUserRole };

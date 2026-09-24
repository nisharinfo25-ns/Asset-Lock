const router = require('express').Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const { getUsers, updateUserRole } = require('../controllers/users.controller');

router.use(authenticate);
router.get('/', requireAdmin, getUsers);
router.put('/:id/role', requireAdmin, updateUserRole);

module.exports = router;

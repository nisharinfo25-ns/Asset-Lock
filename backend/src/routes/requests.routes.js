const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { getRequests, respondToRequest } = require('../controllers/requests.controller');

router.use(authenticate);
router.get('/', getRequests);
router.put('/:id/respond', respondToRequest);

module.exports = router;

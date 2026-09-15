'use strict';
const router = require('express').Router();
const blockchain = require('../config/blockchain');
const IPFSService = require('../services/ipfsService');
const { authenticate } = require('../middleware/auth');

router.get('/status', authenticate, async (req, res) => {
  try {
    const [bcStatus, ipfsStatus] = await Promise.all([blockchain.getStatus(), IPFSService.getStatus()]);
    return res.json({ blockchain: bcStatus, ipfs: ipfsStatus });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

module.exports = router;

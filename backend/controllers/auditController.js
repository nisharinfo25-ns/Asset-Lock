'use strict';
const AuditLog = require('../models/AuditLog');

exports.getAuditLogs = (req, res) => {
  try {
    const { assetId, action } = req.query;
    let logs = AuditLog.find();
    if (assetId) logs = logs.filter(l => l.assetId === assetId);
    if (action) logs = logs.filter(l => l.action === action);
    return res.json({ logs });
  } catch (e) { return res.status(500).json({ error: e.message }); }
};

exports.getAssetAudit = (req, res) => {
  try {
    const logs = AuditLog.find({ assetId: req.params.id });
    return res.json({ logs });
  } catch (e) { return res.status(500).json({ error: e.message }); }
};

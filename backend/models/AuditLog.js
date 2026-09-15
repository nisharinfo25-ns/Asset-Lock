'use strict';
const db = require('../config/db');
const col = () => db.col('auditLogs');
module.exports = {
  find: (q) => col().find(q || {}),
  create: (data) => col().insert(data),
  count: (q) => col().count(q || {}),
};

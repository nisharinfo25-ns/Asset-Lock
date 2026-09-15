'use strict';
const db = require('../config/db');
const users = () => db.col('users');
module.exports = {
  findById: (id) => users().findById(id),
  findByEmail: (email) => users().findOne({ email: (email || '').toLowerCase() }),
  findByWallet: (w) => users().findOne({ walletAddress: (w || '').toLowerCase() }),
  findAll: () => users().find(),
  create: (data) => users().insert({
    ...data,
    email: (data.email || '').toLowerCase(),
    walletAddress: (data.walletAddress || '').toLowerCase(),
  }),
  update: (q, changes) => users().update(q, changes),
  count: () => users().count(),
};

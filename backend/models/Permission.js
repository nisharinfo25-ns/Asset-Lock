'use strict';
const db = require('../config/db');
const col = () => db.col('permissions');
module.exports = {
  find: (q) => col().find(q || {}),
  findOne: (q) => col().findOne(q),
  create: (data) => col().insert(data),
  update: (q, changes) => col().update(q, changes),
  count: (q) => col().count(q || {}),
};

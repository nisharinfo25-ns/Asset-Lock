'use strict';
const db = require('../config/db');
const col = () => db.col('assets');
module.exports = {
  findAll: (q) => col().find(q || {}),
  findById: (id) => col().findById(id),
  findOne: (q) => col().findOne(q),
  create: (data) => col().insert(data),
  update: (q, changes) => col().update(q, changes),
  count: (q) => col().count(q || {}),
};

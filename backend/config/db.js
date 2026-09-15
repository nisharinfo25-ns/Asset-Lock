'use strict';
const fs = require('fs');
const path = require('path');

const os = require('os');

class JsonDb {
  constructor() {
    this.bundledFile = path.join(__dirname, '../../database/db.json');
    this.file = process.env.VERCEL
      ? path.join(os.tmpdir(), 'assetlock_db.json')
      : this.bundledFile;
    this.data = this._load();
  }
  _load() {
    // Try writable file first
    if (fs.existsSync(this.file)) {
      try { return JSON.parse(fs.readFileSync(this.file, 'utf8')); } catch (err) {}
    }
    // Fall back to bundled initial db.json if available
    if (this.bundledFile !== this.file && fs.existsSync(this.bundledFile)) {
      try {
        const initial = JSON.parse(fs.readFileSync(this.bundledFile, 'utf8'));
        this.save();
        return initial;
      } catch (err) {}
    }
    return { users: [], assets: [], permissions: [], auditLogs: [] };
  }
  save() {
    try {
      fs.mkdirSync(path.dirname(this.file), { recursive: true });
      fs.writeFileSync(this.file, JSON.stringify(this.data, null, 2));
    } catch (err) {
      // Keep in memory if filesystem cannot be written
    }
  }
  col(name) {
    if (!this.data[name]) this.data[name] = [];
    const col = this.data[name];
    const db = this;
    return {
      find(q = {}) {
        const keys = Object.keys(q);
        const res = col.filter(d => keys.every(k => d[k] === q[k]));
        return res.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      },
      findOne(q = {}) {
        const keys = Object.keys(q);
        return col.find(d => keys.every(k => d[k] === q[k])) || null;
      },
      findById(id) {
        return col.find(d => d._id === id || d.id === id) || null;
      },
      insert(doc) {
        const _id = 'id_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
        const now = new Date().toISOString();
        const newDoc = { ...doc, _id, createdAt: doc.createdAt || now, updatedAt: now };
        col.push(newDoc);
        db.save();
        return newDoc;
      },
      update(q, changes) {
        const keys = Object.keys(q);
        let count = 0;
        col.forEach(d => {
          if (keys.every(k => d[k] === q[k])) {
            Object.assign(d, changes, { updatedAt: new Date().toISOString() });
            count++;
          }
        });
        if (count) db.save();
        return count;
      },
      count(q = {}) {
        const keys = Object.keys(q);
        return col.filter(d => keys.every(k => d[k] === q[k])).length;
      },
    };
  }
}

const db = new JsonDb();
module.exports = db;

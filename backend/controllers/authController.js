'use strict';
const bcrypt = require('bcryptjs');
const UserModel = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { signToken } = require('../middleware/auth');

exports.register = async (req, res) => {
  try {
    const { name, email, password, walletAddress, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'name, email, password required' });
    if (UserModel.findByEmail(email)) return res.status(409).json({ error: 'Email already registered' });
    const allowed = ['Admin','Owner','Authorized User'];
    const userRole = allowed.includes(role) ? role : 'Owner';
    const passwordHash = bcrypt.hashSync(password, 12);
    const user = UserModel.create({ name, email, passwordHash, walletAddress: walletAddress || '', role: userRole, verified: true });
    AuditLog.create({ assetId: 'SYSTEM', user: email, action: 'REGISTER', result: 'SUCCESS', details: `Role: ${userRole}`, txHash: '' });
    const token = signToken({ id: user._id, email: user.email, role: user.role });
    return res.status(201).json({ token, user: _safe(user) });
  } catch (e) { return res.status(500).json({ error: e.message }); }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });
    const user = UserModel.findByEmail(email);
    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    AuditLog.create({ assetId: 'SYSTEM', user: email, action: 'LOGIN', result: 'SUCCESS', details: 'User authenticated', txHash: '' });
    const token = signToken({ id: user._id, email: user.email, role: user.role });
    return res.json({ token, user: _safe(user) });
  } catch (e) { return res.status(500).json({ error: e.message }); }
};

exports.me = (req, res) => res.json({ user: _safe(req.user) });

exports.users = (req, res) => {
  const users = UserModel.findAll().map(_safe);
  res.json({ users });
};

function _safe(u) {
  const { passwordHash, ...rest } = u;
  return rest;
}

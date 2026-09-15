'use strict';
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');

const UserModel = require('./models/User');
const IPFSService = require('./services/ipfsService');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ extended: true, limit: '60mb' }));

// IPFS direct gateway endpoint
app.get('/api/ipfs/:cid', async (req, res) => {
  try {
    const data = await IPFSService.retrieve(req.params.cid);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.send(data);
  } catch (err) {
    res.status(404).json({ error: 'CID not found in IPFS store: ' + err.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    project: 'Blockchain Based Decentralised Identity & Access Control For Secure Digital Asset Management',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/assets', require('./routes/assets'));
app.use('/api/blockchain', require('./routes/blockchain'));
app.use('/api/audit', require('./routes/audit'));

// Global Error Handler
app.use(errorHandler);

// Automatic seeder for demonstration
function seedDefaultAccounts() {
  if (UserModel.count() === 0) {
    console.log('[Seed] Seeding demo persona accounts...');
    const salt = 12;
    const defaultAccounts = [
      {
        name: 'Dr. Alice Vance',
        email: 'alice@security.enclave',
        passwordHash: bcrypt.hashSync('Password123!', salt),
        walletAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        role: 'Owner',
        verified: true,
      },
      {
        name: 'Agent Bob Miller',
        email: 'bob@security.enclave',
        passwordHash: bcrypt.hashSync('Password123!', salt),
        walletAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        role: 'Authorized User',
        verified: true,
      },
      {
        name: 'Charlie Audit',
        email: 'charlie@security.enclave',
        passwordHash: bcrypt.hashSync('Password123!', salt),
        walletAddress: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
        role: 'Authorized User',
        verified: true,
      },
      {
        name: 'SysAdmin Enclave',
        email: 'admin@security.enclave',
        passwordHash: bcrypt.hashSync('Password123!', salt),
        walletAddress: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
        role: 'Admin',
        verified: true,
      },
    ];

    defaultAccounts.forEach((acc) => UserModel.create(acc));
    console.log('[Seed] Successfully seeded 4 persona accounts (Password: Password123!).');
  }
}

seedDefaultAccounts();

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`================================================================`);
    console.log(` AssetLock DECENTRALIZED IAM & ACCESS CONTROL BACKEND ACTIVE`);
    console.log(` URL: http://localhost:${PORT}`);
    console.log(` Health: http://localhost:${PORT}/api/health`);
    console.log(`================================================================`);
  });
}

module.exports = app;


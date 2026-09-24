require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { generalLimiter } = require('./middleware/rateLimiter');
const { errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth.routes');
const assetsRoutes = require('./routes/assets.routes');
const requestsRoutes = require('./routes/requests.routes');
const usersRoutes = require('./routes/users.routes');
const auditRoutes = require('./routes/audit.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(generalLimiter);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Asset-Lock API',
    version: '1.0.0',
    description: 'Blockchain Based Decentralised Identity & Access Control for Secure Digital Asset Management',
    status: 'running',
    healthCheck: '/health',
    endpoints: {
      auth: '/api/auth',
      assets: '/api/assets',
      accessRequests: '/api/access-requests',
      users: '/api/users',
      audit: '/api/audit'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'Asset-Lock API' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/assets', assetsRoutes);
app.use('/api/access-requests', requestsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/audit', auditRoutes);

// Error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Asset-Lock API running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

module.exports = app;

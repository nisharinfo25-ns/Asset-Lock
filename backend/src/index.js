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

const fs = require('fs');
const path = require('path');

// Health check
app.get('/health', (req, res) => {
  res.json({ success: true, service: 'Asset-Lock API', status: 'healthy', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/assets', assetsRoutes);
app.use('/api/access-requests', requestsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/audit', auditRoutes);

// Root API Endpoint (when requested via /api or JSON header)
app.get('/api', (req, res) => {
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

// Single-Server Full-Stack Static Build Serving & SPA Fallback Routing
const frontendDist = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path === '/health') return next();
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.json({
      name: 'Asset-Lock Platform API',
      status: 'healthy',
      message: 'Single server running. Run npm run build to serve React SPA from this origin.'
    });
  });
}

// Error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Asset-Lock Unified Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

module.exports = app;

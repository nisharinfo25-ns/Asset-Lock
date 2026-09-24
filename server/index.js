const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ success: true, service: 'Asset-Lock API', status: 'healthy' });
});

// Mock routes for requested endpoints
app.use('/api/auth', (req, res) => res.json({ message: 'Auth endpoint' }));
app.use('/api/assets', (req, res) => res.json({ message: 'Assets endpoint' }));
app.use('/api/access-requests', (req, res) => res.json({ message: 'Access requests endpoint' }));
app.use('/api/users', (req, res) => res.json({ message: 'Users endpoint' }));
app.use('/api/audit-logs', (req, res) => res.json({ message: 'Audit logs endpoint' }));

// Serve frontend/dist static files
const distPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(distPath));

// Fallback for non-API routes to support React Router
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      res.status(500).send('Frontend not built yet. Run npm run build in frontend.');
    }
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
module.exports = app;
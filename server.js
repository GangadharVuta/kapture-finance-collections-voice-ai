require('dotenv').config();
const express = require('express');
const cors = require('cors');
const webhookRoutes = require('./routes/webhook');
const db = require('./services/mockDatabase');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// Static Web UI Middleware
app.use(express.static('public'));

// Root API Endpoint (if requested as JSON)
app.get('/api/status', (req, res) => {
  res.status(200).json({
    status: 'ONLINE',
    service: 'Maya Kapture Finance Collections Agent Webhook Server',
    webhookUrl: '/webhook',
    healthUrl: '/health',
    debugUrl: '/api/debug/database'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'Maya Kapture Finance Collections Agent Webhook Server',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Debug / Inspection Endpoint to view recorded database state
app.get('/api/debug/database', (req, res) => {
  res.status(200).json(db.getAllRecords());
});

// Mount Webhook Routes
app.use('/', webhookRoutes);
app.use('/api', webhookRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`  MAYA VOICE AI COLLECTIONS AGENT - WEBHOOK SERVER`);
  console.log(`  Client: Kapture Finance`);
  console.log(`  Server running on: http://localhost:${PORT}`);
  console.log(`  Webhook Endpoint:  http://localhost:${PORT}/webhook`);
  console.log(`  Health Endpoint:   http://localhost:${PORT}/health`);
  console.log(`  Debug Data View:   http://localhost:${PORT}/api/debug/database`);
  console.log(`=======================================================`);
});

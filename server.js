require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initPrisma } = require('./db');
const assistanceRoutes = require('./routes/assistance');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable Cross-Origin Resource Sharing
app.use(cors({
  origin: '*', // Allows requests from Vite dev server and production frontend
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// API Routes
app.use('/api/assistance', assistanceRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    system: 'MediFlow Core - QR Nurse Calling System',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.method} ${req.url} does not exist.`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    message: 'An internal server error occurred.',
    error: process.env.NODE_ENV === 'production' ? undefined : err.message,
  });
});

// Start server
async function start() {
  await initPrisma();
  app.listen(PORT, () => {
    console.log(`🚀 MediFlow Core Assistance Server running on port ${PORT}`);
    console.log(`📡 Base API endpoint: http://localhost:${PORT}/api/assistance`);
  });
}

start();

module.exports = app;


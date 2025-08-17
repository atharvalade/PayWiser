/**
 * PayWiser API Server
 * Combines Face Recognition, Circle Wallets, and Hyperlane Settlement
 */

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

// Import routes
const userRoutes = require('./routes/userRoutes');
const merchantRoutes = require('./routes/merchantRoutes');

// Import services
const DatabaseService = require('./services/databaseService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './temp_images/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'face-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Make upload middleware available globally
app.locals.upload = upload;

// Initialize database
DatabaseService.init();

// Routes
app.use('/api/user', userRoutes);
app.use('/api/merchant', merchantRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'PayWiser API Server is running',
    timestamp: new Date().toISOString(),
    services: {
      database: 'Connected',
      faceRecognition: 'Available',
      circleWallets: 'Available',
      hyperlaneSettlement: 'Available'
    }
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({
    success: false,
    message: error.message || 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 PayWiser API Server started successfully!');
  console.log(`📡 Server running on http://localhost:${PORT}`);
  console.log('🎭 Face Recognition: Ready');
  console.log('💰 Circle Wallets: Ready');
  console.log('🌉 Hyperlane Settlement: Ready');
  console.log('📊 Local Database: Ready');
  console.log('\n📋 Available Endpoints:');
  console.log('   GET  /api/health');
  console.log('   POST /api/user/register');
  console.log('   POST /api/user/create-wallet');
  console.log('   GET  /api/user/balance/:userId');
  console.log('   POST /api/merchant/identify');
  console.log('   POST /api/merchant/transfer');
  console.log('   GET  /api/merchant/balance');
  console.log('   POST /api/merchant/settle');
  console.log('\n🌐 Ready for Cloudflare Tunnel connection!');
});

module.exports = app;

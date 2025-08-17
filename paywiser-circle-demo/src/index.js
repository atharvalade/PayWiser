import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config.js';
import walletRoutes from './routes/walletRoutes.js';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = config.server.port;

// Middleware
app.use(cors({
  origin: config.frontend.url,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '..', 'public')));

// API Routes
app.use('/api/wallets', walletRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: config.server.environment,
    version: '1.0.0'
  });
});

// Root endpoint - serve demo frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'PayWiser Circle Wallet API',
    version: '1.0.0',
    description: 'Demo API for Circle wallet integration with gasless transactions',
    endpoints: {
      'POST /api/wallets/register': 'Register a new user and create Circle wallet',
      'GET /api/wallets/user/:userId': 'Get user and wallet information',
      'GET /api/wallets/balance/:userId': 'Get wallet balance',
      'POST /api/wallets/send': 'Send gasless payment between users',
      'GET /api/wallets/transactions/:userId': 'Get transaction history',
      'POST /api/wallets/payment-request': 'Create payment request for merchants',
      'GET /api/wallets/users': 'List all registered users',
      'GET /api/wallets/stats': 'Get system statistics'
    },
    examples: {
      register: {
        method: 'POST',
        url: '/api/wallets/register',
        body: {
          userId: 'user123',
          name: 'John Doe',
          email: 'john@example.com'
        }
      },
      send: {
        method: 'POST',
        url: '/api/wallets/send',
        body: {
          fromUserId: 'user123',
          toUserId: 'user456',
          amount: '10.00',
          memo: 'Payment for coffee'
        }
      }
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: config.server.environment === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 PayWiser Circle Demo Server running on port ${PORT}`);
  console.log(`📱 Frontend: http://localhost:${PORT}`);
  console.log(`🔗 API: http://localhost:${PORT}/api`);
  console.log(`❤️  Health: http://localhost:${PORT}/health`);
  console.log(`🌟 Environment: ${config.server.environment}`);
  console.log(`🔐 Circle Environment: ${config.circle.environment}`);
});

export default app;

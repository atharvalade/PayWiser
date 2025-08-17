import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { config } from '../config.js';
import { hyperlaneService } from './hyperlaneService.js';
import settlementRoutes from './routes/settlementRoutes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = config.server.port;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/settlement', settlementRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'PayWiser Hyperlane Settlement Service',
    version: '1.0.0',
    description: 'Cross-chain settlement service using Hyperlane Interchain Accounts',
    status: 'running',
    endpoints: {
      'GET /api/settlement/chains': 'Get supported chains',
      'POST /api/settlement/estimate': 'Estimate settlement gas cost',
      'POST /api/settlement/execute': 'Execute cross-chain settlement',
      'GET /api/settlement/status/:messageId': 'Get settlement status',
      'GET /api/settlement/interchain-account': 'Get interchain account address',
      'GET /api/settlement/health': 'Service health check'
    },
    documentation: {
      estimateSettlement: {
        method: 'POST',
        url: '/api/settlement/estimate',
        body: {
          fromChain: 'sepolia',
          toChain: 'arbitrumSepolia',
          amount: '100'
        }
      },
      executeSettlement: {
        method: 'POST',
        url: '/api/settlement/execute',
        body: {
          fromChain: 'sepolia',
          toChain: 'arbitrumSepolia',
          merchantAddress: '0x...',
          tokenAddress: '0x...',
          amount: '100',
          settlementAddress: '0x...'
        }
      }
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'PayWiser Hyperlane Settlement',
    timestamp: new Date().toISOString(),
    environment: config.server.environment,
    version: '1.0.0',
    hyperlaneInitialized: hyperlaneService.isInitialized()
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

// Initialize Hyperlane service and start server
async function startServer() {
  try {
    console.log('🚀 Starting PayWiser Hyperlane Settlement Service...');
    
    // Initialize Hyperlane service
    await hyperlaneService.initialize();
    
    // Start Express server
    app.listen(PORT, () => {
      console.log(`🌐 PayWiser Hyperlane Settlement Service running on port ${PORT}`);
      console.log(`📡 API: http://localhost:${PORT}/api/settlement`);
      console.log(`❤️  Health: http://localhost:${PORT}/health`);
      console.log(`🔗 Documentation: http://localhost:${PORT}`);
      console.log(`🌟 Environment: ${config.server.environment}`);
      console.log(`⚡ Hyperlane: ${hyperlaneService.isInitialized() ? 'Ready' : 'Not Ready'}`);
      
      // Log supported chains
      const chains = hyperlaneService.getSupportedChains();
      console.log(`🔗 Supported chains (${chains.length}):`);
      chains.forEach(chain => {
        console.log(`   - ${chain.displayName} (${chain.name})`);
      });
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down PayWiser Hyperlane Settlement Service...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down PayWiser Hyperlane Settlement Service...');
  process.exit(0);
});

// Start the server
startServer();

export default app;

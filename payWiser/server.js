const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const sagaEndpoints = require('./api/sagaEndpoints');

/**
 * PayWiser SAGA Chainlet Server
 * Dedicated server for SAGA blockchain vector embedding operations
 */

const app = express();
const PORT = process.env.SAGA_PORT || 3333;

// Middleware
app.use(helmet({
    crossOriginEmbedderPolicy: false
}));

app.use(cors({
    origin: [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'https://paywiser.app',
        /\.paywiser\.app$/,
        /\.sagarpc\.io$/
    ],
    credentials: true,
    optionsSuccessStatus: 200
}));

app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        success: false,
        error: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

app.use('/api/saga', limiter);

// Routes
app.use('/api/saga', sagaEndpoints);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        service: 'PayWiser SAGA Chainlet Service',
        version: '1.0.0',
        description: 'Vector embedding storage and retrieval on SAGA blockchain',
        chainlet: {
            id: 'paywiser_2755433340225000-1',
            name: 'paywiser',
            symbol: 'WISE',
            endpoints: {
                rpc: 'https://paywiser-2755433340225000-1.jsonrpc.sagarpc.io',
                websocket: 'https://paywiser-2755433340225000-1.ws.sagarpc.io',
                explorer: 'https://paywiser-2755433340225000-1.sagaexplorer.io'
            }
        },
        api: {
            docs: '/api/docs',
            health: '/api/saga/health',
            endpoints: [
                'POST /api/saga/initialize',
                'GET /api/saga/status',
                'POST /api/saga/embeddings/store',
                'GET /api/saga/embeddings/:id',
                'POST /api/saga/embeddings/verify',
                'GET /api/saga/users/:address/embeddings',
                'POST /api/saga/embeddings/batch',
                'POST /api/saga/embeddings/search',
                'GET /api/saga/analytics/embeddings'
            ]
        },
        timestamp: new Date().toISOString()
    });
});

// API Documentation
app.get('/api/docs', (req, res) => {
    res.json({
        title: 'PayWiser SAGA Chainlet API Documentation',
        version: '1.0.0',
        description: 'Complete API for storing and retrieving face recognition vector embeddings on SAGA blockchain',
        baseUrl: `http://localhost:${PORT}`,
        endpoints: {
            initialization: {
                'POST /api/saga/initialize': {
                    description: 'Initialize connection to SAGA chainlet',
                    body: {
                        privateKey: 'string (optional) - Private key for signing transactions'
                    },
                    response: {
                        success: 'boolean',
                        data: {
                            chainletId: 'string',
                            network: 'string'
                        }
                    }
                }
            },
            status: {
                'GET /api/saga/status': {
                    description: 'Get chainlet status and information',
                    response: {
                        success: 'boolean',
                        data: {
                            connected: 'boolean',
                            chainletId: 'string',
                            currentBlock: 'number',
                            status: 'string'
                        }
                    }
                }
            },
            embeddings: {
                'POST /api/saga/embeddings/store': {
                    description: 'Store face embedding vector on SAGA chainlet',
                    contentType: 'multipart/form-data or application/json',
                    body: {
                        embeddingFile: 'file (optional) - Embedding vector file',
                        embeddingData: 'string (optional) - Base64 encoded embedding data',
                        metadata: 'string - JSON metadata object'
                    },
                    response: {
                        success: 'boolean',
                        data: {
                            embeddingId: 'string',
                            transactionHash: 'string',
                            blockNumber: 'number'
                        }
                    }
                },
                'GET /api/saga/embeddings/:embeddingId': {
                    description: 'Retrieve embedding from SAGA chainlet',
                    parameters: {
                        embeddingId: 'string - Unique embedding identifier'
                    },
                    response: {
                        success: 'boolean',
                        data: {
                            embeddingId: 'string',
                            embeddingData: 'Buffer',
                            owner: 'string',
                            metadata: 'object'
                        }
                    }
                },
                'POST /api/saga/embeddings/verify': {
                    description: 'Verify face embedding against stored data',
                    contentType: 'multipart/form-data or application/json',
                    body: {
                        candidateFile: 'file (optional) - Candidate embedding file',
                        candidateData: 'string (optional) - Base64 encoded candidate data',
                        storedEmbeddingId: 'string - ID of stored embedding to compare'
                    },
                    response: {
                        success: 'boolean',
                        data: {
                            isMatch: 'boolean',
                            confidence: 'number',
                            transactionHash: 'string'
                        }
                    }
                },
                'POST /api/saga/embeddings/search': {
                    description: 'Search for similar embeddings',
                    contentType: 'multipart/form-data or application/json',
                    body: {
                        queryFile: 'file (optional) - Query embedding file',
                        queryData: 'string (optional) - Base64 encoded query data',
                        userAddress: 'string - User address to search within',
                        threshold: 'number (optional) - Minimum confidence threshold (default: 80)',
                        maxResults: 'number (optional) - Maximum results to return (default: 10)'
                    },
                    response: {
                        success: 'boolean',
                        data: {
                            matches: 'array - Array of matching embeddings with confidence scores',
                            totalChecked: 'number',
                            threshold: 'number'
                        }
                    }
                }
            },
            users: {
                'GET /api/saga/users/:address/embeddings': {
                    description: 'Get all embeddings for a user',
                    parameters: {
                        address: 'string - User wallet address'
                    },
                    response: {
                        success: 'boolean',
                        data: {
                            userAddress: 'string',
                            embeddingIds: 'array',
                            count: 'number'
                        }
                    }
                }
            },
            batch: {
                'POST /api/saga/embeddings/batch': {
                    description: 'Batch retrieve multiple embeddings',
                    body: {
                        embeddingIds: 'array - Array of embedding IDs to retrieve'
                    },
                    response: {
                        success: 'boolean',
                        data: {
                            results: 'array',
                            retrievedCount: 'number'
                        }
                    }
                }
            },
            analytics: {
                'GET /api/saga/analytics/embeddings': {
                    description: 'Get embedding analytics and statistics',
                    query: {
                        userAddress: 'string (optional) - User address for user-specific stats'
                    },
                    response: {
                        success: 'boolean',
                        data: {
                            chainlet: 'object - Chainlet status',
                            user: 'object - User statistics'
                        }
                    }
                }
            },
            health: {
                'GET /api/saga/health': {
                    description: 'Health check endpoint',
                    response: {
                        success: 'boolean',
                        data: {
                            service: 'string',
                            status: 'string',
                            chainletId: 'string'
                        }
                    }
                }
            }
        },
        examples: {
            storeEmbedding: {
                curl: `curl -X POST http://localhost:${PORT}/api/saga/embeddings/store \\
  -F "embeddingFile=@face_embedding.bin" \\
  -F "metadata={\\"userId\\": \\"user123\\", \\"timestamp\\": \\"2025-01-01T00:00:00Z\\"}"`,
                javascript: `
const formData = new FormData();
formData.append('embeddingFile', embeddingFile);
formData.append('metadata', JSON.stringify({userId: 'user123'}));

const response = await fetch('/api/saga/embeddings/store', {
  method: 'POST',
  body: formData
});`
            },
            verifyEmbedding: {
                curl: `curl -X POST http://localhost:${PORT}/api/saga/embeddings/verify \\
  -F "candidateFile=@candidate_embedding.bin" \\
  -F "storedEmbeddingId=0x1234567890abcdef..."`,
                javascript: `
const formData = new FormData();
formData.append('candidateFile', candidateFile);
formData.append('storedEmbeddingId', embeddingId);

const response = await fetch('/api/saga/embeddings/verify', {
  method: 'POST',
  body: formData
});`
            }
        }
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    
    res.status(error.status || 500).json({
        success: false,
        error: error.message || 'Internal Server Error',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        message: 'The requested endpoint does not exist',
        availableEndpoints: [
            'GET /',
            'GET /api/docs',
            'GET /api/saga/health',
            'POST /api/saga/initialize',
            'GET /api/saga/status',
            'POST /api/saga/embeddings/store',
            'GET /api/saga/embeddings/:id',
            'POST /api/saga/embeddings/verify',
            'POST /api/saga/embeddings/search',
            'GET /api/saga/users/:address/embeddings',
            'POST /api/saga/embeddings/batch',
            'GET /api/saga/analytics/embeddings'
        ]
    });
});

// Start server
const server = app.listen(PORT, () => {
    console.log('\n🚀 PayWiser SAGA Chainlet Service Started');
    console.log('═══════════════════════════════════════════');
    console.log(`🌐 Server: http://localhost:${PORT}`);
    console.log(`📚 API Docs: http://localhost:${PORT}/api/docs`);
    console.log(`💚 Health Check: http://localhost:${PORT}/api/saga/health`);
    console.log('');
    console.log('🔗 SAGA Chainlet Details:');
    console.log('   ID: paywiser_2755433340225000-1');
    console.log('   Name: paywiser');
    console.log('   Symbol: WISE');
    console.log('   RPC: https://paywiser-2755433340225000-1.jsonrpc.sagarpc.io');
    console.log('   Explorer: https://paywiser-2755433340225000-1.sagaexplorer.io');
    console.log('');
    console.log('📡 Available Endpoints:');
    console.log('   POST /api/saga/initialize');
    console.log('   POST /api/saga/embeddings/store');
    console.log('   POST /api/saga/embeddings/verify');
    console.log('   GET  /api/saga/embeddings/:id');
    console.log('   POST /api/saga/embeddings/search');
    console.log('   GET  /api/saga/users/:address/embeddings');
    console.log('');
    console.log('🎯 Ready to store and retrieve vector embeddings on SAGA blockchain!');
    console.log('═══════════════════════════════════════════\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('\n🛑 SIGINT received, shutting down gracefully');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

module.exports = app;

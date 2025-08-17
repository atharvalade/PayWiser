const express = require('express');
const multer = require('multer');
const SagaChainletService = require('../services/sagaChainletService');

const router = express.Router();
const sagaService = new SagaChainletService();

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

/**
 * Initialize SAGA Chainlet connection
 */
router.post('/initialize', async (req, res) => {
    try {
        const { privateKey } = req.body;
        
        const result = await sagaService.initialize(privateKey);
        
        res.json({
            success: true,
            message: 'SAGA Chainlet initialized successfully',
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Get chainlet status and information
 */
router.get('/status', async (req, res) => {
    try {
        const status = await sagaService.getChainletStatus();
        
        res.json({
            success: true,
            data: status
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Store face embedding vector on SAGA chainlet
 */
router.post('/embeddings/store', upload.single('embeddingFile'), async (req, res) => {
    try {
        const { metadata } = req.body;
        let embeddingData;
        
        if (req.file) {
            // File upload
            embeddingData = req.file.buffer;
        } else if (req.body.embeddingData) {
            // Direct data
            embeddingData = Buffer.from(req.body.embeddingData, 'base64');
        } else {
            return res.status(400).json({
                success: false,
                error: 'No embedding data provided'
            });
        }
        
        const parsedMetadata = metadata ? JSON.parse(metadata) : {};
        
        const result = await sagaService.storeEmbedding(embeddingData, parsedMetadata);
        
        res.json({
            success: true,
            message: 'Embedding stored successfully on SAGA chainlet',
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Retrieve embedding from SAGA chainlet
 */
router.get('/embeddings/:embeddingId', async (req, res) => {
    try {
        const { embeddingId } = req.params;
        
        const result = await sagaService.retrieveEmbedding(embeddingId);
        
        res.json({
            success: true,
            message: 'Embedding retrieved successfully',
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Verify face embedding against stored data
 */
router.post('/embeddings/verify', upload.single('candidateFile'), async (req, res) => {
    try {
        const { storedEmbeddingId } = req.body;
        let candidateData;
        
        if (req.file) {
            candidateData = req.file.buffer;
        } else if (req.body.candidateData) {
            candidateData = Buffer.from(req.body.candidateData, 'base64');
        } else {
            return res.status(400).json({
                success: false,
                error: 'No candidate embedding data provided'
            });
        }
        
        if (!storedEmbeddingId) {
            return res.status(400).json({
                success: false,
                error: 'Stored embedding ID required'
            });
        }
        
        const result = await sagaService.verifyEmbedding(candidateData, storedEmbeddingId);
        
        res.json({
            success: true,
            message: 'Embedding verification completed',
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Get all embeddings for a user
 */
router.get('/users/:address/embeddings', async (req, res) => {
    try {
        const { address } = req.params;
        
        const result = await sagaService.getUserEmbeddings(address);
        
        res.json({
            success: true,
            message: 'User embeddings retrieved successfully',
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Batch retrieve multiple embeddings
 */
router.post('/embeddings/batch', async (req, res) => {
    try {
        const { embeddingIds } = req.body;
        
        if (!Array.isArray(embeddingIds) || embeddingIds.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Array of embedding IDs required'
            });
        }
        
        const result = await sagaService.batchRetrieveEmbeddings(embeddingIds);
        
        res.json({
            success: true,
            message: 'Batch retrieval completed',
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Advanced search for similar embeddings
 */
router.post('/embeddings/search', upload.single('queryFile'), async (req, res) => {
    try {
        const { threshold = 80, maxResults = 10 } = req.body;
        let queryData;
        
        if (req.file) {
            queryData = req.file.buffer;
        } else if (req.body.queryData) {
            queryData = Buffer.from(req.body.queryData, 'base64');
        } else {
            return res.status(400).json({
                success: false,
                error: 'No query embedding data provided'
            });
        }
        
        // Get user's embeddings for comparison
        const userAddress = req.body.userAddress;
        if (!userAddress) {
            return res.status(400).json({
                success: false,
                error: 'User address required for search'
            });
        }
        
        const userEmbeddings = await sagaService.getUserEmbeddings(userAddress);
        
        if (userEmbeddings.count === 0) {
            return res.json({
                success: true,
                message: 'No embeddings found for user',
                data: {
                    matches: [],
                    totalChecked: 0
                }
            });
        }
        
        // Verify against each embedding and collect results
        const matches = [];
        
        for (const embeddingId of userEmbeddings.embeddingIds.slice(0, maxResults)) {
            try {
                const verification = await sagaService.verifyEmbedding(queryData, embeddingId);
                
                if (verification.confidence >= threshold) {
                    matches.push({
                        embeddingId,
                        confidence: verification.confidence,
                        isMatch: verification.isMatch
                    });
                }
            } catch (error) {
                console.warn('Failed to verify embedding', embeddingId, ':', error.message);
            }
        }
        
        // Sort by confidence
        matches.sort((a, b) => b.confidence - a.confidence);
        
        res.json({
            success: true,
            message: 'Embedding search completed',
            data: {
                matches: matches.slice(0, maxResults),
                totalChecked: userEmbeddings.embeddingIds.length,
                threshold,
                queryMetadata: {
                    userAddress,
                    timestamp: Date.now()
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Get embedding analytics
 */
router.get('/analytics/embeddings', async (req, res) => {
    try {
        const { userAddress } = req.query;
        
        const status = await sagaService.getChainletStatus();
        
        let userStats = null;
        if (userAddress) {
            userStats = await sagaService.getUserEmbeddings(userAddress);
        }
        
        res.json({
            success: true,
            message: 'Analytics retrieved successfully',
            data: {
                chainlet: {
                    status: status.status,
                    currentBlock: status.currentBlock,
                    chainletId: status.chainletId
                },
                user: userStats ? {
                    address: userAddress,
                    embeddingCount: userStats.count,
                    embeddingIds: userStats.embeddingIds
                } : null,
                timestamp: Date.now()
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Health check endpoint
 */
router.get('/health', async (req, res) => {
    try {
        const status = await sagaService.getChainletStatus();
        
        res.json({
            success: true,
            message: 'SAGA Chainlet service is healthy',
            data: {
                service: 'PayWiser SAGA Chainlet',
                version: '1.0.0',
                status: status.connected ? 'Connected' : 'Disconnected',
                chainletId: status.chainletId,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        res.status(503).json({
            success: false,
            error: error.message,
            service: 'PayWiser SAGA Chainlet',
            status: 'Unhealthy'
        });
    }
});

module.exports = router;

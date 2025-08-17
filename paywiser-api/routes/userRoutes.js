/**
 * User Routes for PayWiser API
 * Handles user registration, wallet creation, and balance queries
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Services
const FaceRecognitionService = require('../services/faceRecognitionService');
const CircleService = require('../services/circleService');
const DatabaseService = require('../services/databaseService');

// Multer configuration for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './temp_images/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'user-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

/**
 * POST /api/user/register
 * Register a new user with face recognition
 */
router.post('/register', upload.single('faceImage'), async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Face image is required'
      });
    }

    // Validate face in image
    const faceValidation = await FaceRecognitionService.extractFaces(req.file.path);
    if (!faceValidation.valid) {
      await FaceRecognitionService.cleanupImage(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'No valid face detected in image'
      });
    }

    // Generate face embedding
    const embedding = await FaceRecognitionService.generateEmbedding(req.file.path);
    
    // Check if user already exists with similar face
    const existingUser = DatabaseService.getUserByFaceEmbedding(embedding);
    if (existingUser) {
      await FaceRecognitionService.cleanupImage(req.file.path);
      return res.status(409).json({
        success: false,
        message: 'User with similar face already exists',
        existingUser: {
          name: existingUser.user.name,
          distance: existingUser.distance
        }
      });
    }

    // Create user in database
    const userData = {
      name: name,
      faceEmbedding: embedding,
      wallets: []
    };

    const user = DatabaseService.createUser(userData);

    // Cleanup temporary image
    await FaceRecognitionService.cleanupImage(req.file.path);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user.id,
        name: user.name,
        created: user.created,
        wallets: user.wallets
      }
    });

  } catch (error) {
    console.error('User registration error:', error);
    
    // Cleanup image on error
    if (req.file) {
      await FaceRecognitionService.cleanupImage(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: 'Failed to register user',
      error: error.message
    });
  }
});

/**
 * POST /api/user/create-wallet
 * Create a new wallet for a user on specified chain
 */
router.post('/create-wallet', async (req, res) => {
  try {
    const { userId, chain } = req.body;

    if (!userId || !chain) {
      return res.status(400).json({
        success: false,
        message: 'User ID and chain are required'
      });
    }

    // Validate user exists
    const user = DatabaseService.getUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Validate chain
    if (!CircleService.isValidChain(chain)) {
      return res.status(400).json({
        success: false,
        message: 'Unsupported blockchain',
        supportedChains: CircleService.getSupportedChains()
      });
    }

    // Check if user already has wallet on this chain
    const existingWallet = user.wallets?.find(w => w.chain === chain);
    if (existingWallet) {
      return res.status(409).json({
        success: false,
        message: 'User already has a wallet on this chain',
        existingWallet: existingWallet
      });
    }

    // Create wallet via Circle
    const walletResult = await CircleService.createWallet(chain, userId);
    
    if (!walletResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create wallet',
        error: walletResult.error
      });
    }

    // Add wallet to user in database
    const walletData = {
      id: walletResult.wallet.id,
      address: walletResult.wallet.address,
      chain: chain
    };

    DatabaseService.addWalletToUser(userId, walletData);

    res.status(201).json({
      success: true,
      message: 'Wallet created successfully',
      wallet: {
        id: walletResult.wallet.id,
        address: walletResult.wallet.address,
        chain: chain,
        custodyType: walletResult.wallet.custodyType
      }
    });

  } catch (error) {
    console.error('Wallet creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create wallet',
      error: error.message
    });
  }
});

/**
 * GET /api/user/balance/:userId
 * Get user's wallet balances across all chains
 */
router.get('/balance/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate user exists
    const user = DatabaseService.getUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.wallets || user.wallets.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No wallets found for user',
        balances: []
      });
    }

    // Get balances for all user wallets
    const balancePromises = user.wallets.map(async (wallet) => {
      try {
        const balanceResult = await CircleService.getWalletBalance(wallet.id);
        if (balanceResult.success) {
          return {
            chain: wallet.chain,
            address: wallet.address,
            tokens: balanceResult.balance.tokens,
            walletId: wallet.id
          };
        } else {
          return {
            chain: wallet.chain,
            address: wallet.address,
            tokens: [],
            error: balanceResult.error
          };
        }
      } catch (error) {
        return {
          chain: wallet.chain,
          address: wallet.address,
          tokens: [],
          error: error.message
        };
      }
    });

    const balances = await Promise.all(balancePromises);

    res.status(200).json({
      success: true,
      message: 'Balances retrieved successfully',
      user: {
        id: user.id,
        name: user.name
      },
      balances: balances
    });

  } catch (error) {
    console.error('Balance query error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user balances',
      error: error.message
    });
  }
});

/**
 * GET /api/user/chains/supported
 * Get supported blockchain chains
 */
router.get('/chains/supported', (req, res) => {
  try {
    const chains = CircleService.getSupportedChains();
    
    res.status(200).json({
      success: true,
      supportedChains: chains,
      chainDetails: {
        'ETH-SEPOLIA': {
          name: 'Ethereum Sepolia',
          symbol: 'ETH',
          testnet: true
        },
        'ARB-SEPOLIA': {
          name: 'Arbitrum Sepolia',
          symbol: 'ETH',
          testnet: true
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get supported chains',
      error: error.message
    });
  }
});

/**
 * GET /api/user/:userId
 * Get user details
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = DatabaseService.getUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        wallets: user.wallets || [],
        created: user.created,
        lastLogin: user.lastLogin
      }
    });

  } catch (error) {
    console.error('User query error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user details',
      error: error.message
    });
  }
});

module.exports = router;

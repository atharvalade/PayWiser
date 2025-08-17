/**
 * Merchant Routes for PayWiser API
 * Handles merchant operations: user identification, transfers, and settlement
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Services
const FaceRecognitionService = require('../services/faceRecognitionService');
const CircleService = require('../services/circleService');
const HyperlaneService = require('../services/hyperlaneService');
const DatabaseService = require('../services/databaseService');

// Multer configuration for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './temp_images/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'merchant-scan-' + uniqueSuffix + path.extname(file.originalname));
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
 * POST /api/merchant/identify
 * Identify user from merchant's camera scan
 */
router.post('/identify', upload.single('userImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'User image is required'
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

    // Generate face embedding for identification
    const embedding = await FaceRecognitionService.generateEmbedding(req.file.path);
    
    // Find matching user
    const matchResult = DatabaseService.getUserByFaceEmbedding(embedding);
    
    // Cleanup temporary image
    await FaceRecognitionService.cleanupImage(req.file.path);

    if (!matchResult) {
      return res.status(404).json({
        success: false,
        message: 'No matching user found',
        threshold: FaceRecognitionService.threshold
      });
    }

    const { user, distance } = matchResult;

    // Update user's last login
    DatabaseService.updateUser(user.id, { lastLogin: new Date().toISOString() });

    res.status(200).json({
      success: true,
      message: 'User identified successfully',
      user: {
        id: user.id,
        name: user.name,
        wallets: user.wallets || []
      },
      verification: {
        distance: distance,
        threshold: FaceRecognitionService.threshold,
        confidence: Math.max(0, (1 - distance / FaceRecognitionService.threshold) * 100).toFixed(2)
      }
    });

  } catch (error) {
    console.error('User identification error:', error);
    
    // Cleanup image on error
    if (req.file) {
      await FaceRecognitionService.cleanupImage(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: 'Failed to identify user',
      error: error.message
    });
  }
});

/**
 * POST /api/merchant/transfer
 * Transfer assets from user to merchant
 */
router.post('/transfer', async (req, res) => {
  try {
    const { 
      userId, 
      amount, 
      chain, 
      merchantAddress,
      tokenSymbol = 'USDC'
    } = req.body;

    if (!userId || !amount || !chain || !merchantAddress) {
      return res.status(400).json({
        success: false,
        message: 'User ID, amount, chain, and merchant address are required'
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

    // Find user's wallet on the specified chain
    const userWallet = user.wallets?.find(w => w.chain === chain);
    if (!userWallet) {
      return res.status(404).json({
        success: false,
        message: `User does not have a wallet on ${chain}`,
        availableChains: user.wallets?.map(w => w.chain) || []
      });
    }

    // Check user's balance
    const balanceResult = await CircleService.getWalletBalance(userWallet.id);
    if (!balanceResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to check user balance',
        error: balanceResult.error
      });
    }

    // Validate sufficient balance
    const tokens = balanceResult.balance.tokens || [];
    const targetToken = tokens.find(t => 
      t.token && t.token.symbol && t.token.symbol.toUpperCase() === tokenSymbol.toUpperCase()
    );

    if (!targetToken || parseFloat(targetToken.amount) < parseFloat(amount)) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance',
        available: targetToken ? targetToken.amount : '0',
        requested: amount,
        token: tokenSymbol
      });
    }

    // Execute transfer
    const transferData = {
      fromWalletId: userWallet.id,
      toAddress: merchantAddress,
      amount: amount,
      tokenSymbol: tokenSymbol
    };

    const transferResult = await CircleService.createTransfer(transferData);
    
    if (!transferResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Transfer failed',
        error: transferResult.error
      });
    }

    // Record transaction in database
    const transactionData = {
      fromUserId: userId,
      toMerchantId: 'hardcoded-merchant', // As per requirement
      amount: amount,
      token: tokenSymbol,
      chain: chain,
      txHash: transferResult.transaction.txHash,
      status: transferResult.transaction.state
    };

    const transaction = DatabaseService.createTransaction(transactionData);

    res.status(200).json({
      success: true,
      message: 'Transfer completed successfully',
      transaction: {
        id: transaction.id,
        txHash: transferResult.transaction.txHash,
        amount: amount,
        token: tokenSymbol,
        chain: chain,
        status: transferResult.transaction.state,
        fromUser: user.name,
        toMerchant: merchantAddress
      }
    });

  } catch (error) {
    console.error('Transfer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process transfer',
      error: error.message
    });
  }
});

/**
 * GET /api/merchant/balance
 * Get merchant's real-time balance across all chains
 */
router.get('/balance', async (req, res) => {
  try {
    const { merchantAddress } = req.query;

    if (!merchantAddress) {
      return res.status(400).json({
        success: false,
        message: 'Merchant address is required'
      });
    }

    // Get balances across all supported chains
    const supportedChains = HyperlaneService.getSupportedSettlementChains();
    
    const balancePromises = supportedChains.map(async (chain) => {
      try {
        const balanceResult = await HyperlaneService.getBalance(chain, merchantAddress);
        if (balanceResult.success) {
          return {
            chain: chain,
            ...balanceResult.balance
          };
        } else {
          return {
            chain: chain,
            error: balanceResult.error,
            formatted: '0',
            symbol: 'USDC'
          };
        }
      } catch (error) {
        return {
          chain: chain,
          error: error.message,
          formatted: '0',
          symbol: 'USDC'
        };
      }
    });

    const balances = await Promise.all(balancePromises);

    // Calculate total balance across all chains
    const totalBalance = balances.reduce((sum, balance) => {
      if (!balance.error && balance.formatted) {
        return sum + parseFloat(balance.formatted);
      }
      return sum;
    }, 0);

    res.status(200).json({
      success: true,
      message: 'Merchant balances retrieved successfully',
      merchantAddress: merchantAddress,
      balances: balances,
      totalBalance: totalBalance.toFixed(6),
      supportedChains: supportedChains
    });

  } catch (error) {
    console.error('Merchant balance query error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get merchant balance',
      error: error.message
    });
  }
});

/**
 * POST /api/merchant/settle
 * Settle merchant funds to selected chain using Hyperlane
 */
router.post('/settle', async (req, res) => {
  try {
    const {
      merchantAddress,
      originChain,
      destinationChain,
      amount,
      privateKey // In production, this should be handled more securely
    } = req.body;

    if (!merchantAddress || !originChain || !destinationChain || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Merchant address, origin chain, destination chain, and amount are required'
      });
    }

    // Validate chains
    if (!HyperlaneService.isValidChain(originChain) || !HyperlaneService.isValidChain(destinationChain)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid chain specified',
        supportedChains: HyperlaneService.getSupportedSettlementChains()
      });
    }

    // Check merchant balance on origin chain
    const balanceResult = await HyperlaneService.getBalance(originChain, merchantAddress);
    if (!balanceResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to check merchant balance',
        error: balanceResult.error
      });
    }

    const availableBalance = parseFloat(balanceResult.balance.formatted);
    const requestedAmount = parseFloat(amount);

    if (availableBalance < requestedAmount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance for settlement',
        available: availableBalance.toString(),
        requested: amount,
        chain: originChain
      });
    }

    // Estimate gas cost
    const gasEstimate = await HyperlaneService.estimateSettlementGas(
      originChain, 
      destinationChain, 
      amount
    );

    if (!gasEstimate.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to estimate gas cost',
        error: gasEstimate.error
      });
    }

    // For demo purposes, use mock settlement
    // In production with real private keys, use: HyperlaneService.executeSettlement
    const settlementData = {
      originChain,
      destinationChain,
      merchantAddress,
      amount,
      privateKey
    };

    const settlementResult = await HyperlaneService.mockSettlement(settlementData);

    if (!settlementResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Settlement failed',
        error: settlementResult.error
      });
    }

    res.status(200).json({
      success: true,
      message: 'Settlement completed successfully',
      settlement: settlementResult.settlement,
      gasEstimate: gasEstimate.gasEstimate
    });

  } catch (error) {
    console.error('Settlement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to execute settlement',
      error: error.message
    });
  }
});

/**
 * GET /api/merchant/chains/settlement
 * Get supported settlement chains
 */
router.get('/chains/settlement', (req, res) => {
  try {
    const chains = HyperlaneService.getSupportedSettlementChains();
    
    const chainDetails = {
      'ETH-SEPOLIA': { name: 'Ethereum Sepolia', symbol: 'ETH' },
      'ARB-SEPOLIA': { name: 'Arbitrum Sepolia', symbol: 'ETH' },
      'POLYGON-AMOY': { name: 'Polygon Amoy', symbol: 'MATIC' },
      'BASE-SEPOLIA': { name: 'Base Sepolia', symbol: 'ETH' }
    };

    res.status(200).json({
      success: true,
      supportedChains: chains,
      chainDetails: chainDetails
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get settlement chains',
      error: error.message
    });
  }
});

/**
 * GET /api/merchant/transactions
 * Get merchant transaction history
 */
router.get('/transactions', async (req, res) => {
  try {
    const { merchantId = 'hardcoded-merchant', limit = 50 } = req.query;

    const transactions = DatabaseService.getTransactionsByMerchant(merchantId);
    
    // Limit results and sort by most recent
    const sortedTransactions = transactions
      .sort((a, b) => new Date(b.created) - new Date(a.created))
      .slice(0, parseInt(limit));

    res.status(200).json({
      success: true,
      message: 'Transactions retrieved successfully',
      transactions: sortedTransactions,
      totalCount: transactions.length
    });

  } catch (error) {
    console.error('Transaction history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get transaction history',
      error: error.message
    });
  }
});

module.exports = router;

import express from 'express';
import { walletService } from '../services/walletService.js';

const router = express.Router();

/**
 * POST /api/wallets/register
 * Register a new user and create their Circle wallet
 */
router.post('/register', async (req, res) => {
  try {
    const { userId, name, email } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const userProfile = { name, email };
    const result = await walletService.registerUser(userId, userProfile);

    res.json(result);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/wallets/user/:userId
 * Get user information and wallet details
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await walletService.getUser(userId);

    res.json({
      success: true,
      user: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/wallets/balance/:userId
 * Get wallet balance for a user
 */
router.get('/balance/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const balance = await walletService.getUserBalance(userId);

    res.json({
      success: true,
      balance: balance
    });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/wallets/send
 * Send gasless payment between users
 */
router.post('/send', async (req, res) => {
  try {
    const { fromUserId, toUserId, amount, memo } = req.body;

    if (!fromUserId || !toUserId || !amount) {
      return res.status(400).json({
        success: false,
        error: 'fromUserId, toUserId, and amount are required'
      });
    }

    const result = await walletService.sendPayment(fromUserId, toUserId, amount, memo);

    res.json(result);
  } catch (error) {
    console.error('Send payment error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/wallets/transactions/:userId
 * Get transaction history for a user
 */
router.get('/transactions/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10 } = req.query;

    const transactions = await walletService.getUserTransactions(userId, parseInt(limit));

    res.json({
      success: true,
      transactions: transactions
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/wallets/payment-request
 * Create a payment request (for merchants)
 */
router.post('/payment-request', async (req, res) => {
  try {
    const { merchantUserId, amount, description } = req.body;

    if (!merchantUserId || !amount) {
      return res.status(400).json({
        success: false,
        error: 'merchantUserId and amount are required'
      });
    }

    const result = await walletService.createPaymentRequest(merchantUserId, amount, description);

    res.json(result);
  } catch (error) {
    console.error('Create payment request error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/wallets/users
 * List all registered users (for demo purposes)
 */
router.get('/users', async (req, res) => {
  try {
    const users = walletService.getAllUsers();

    res.json({
      success: true,
      users: users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/wallets/stats
 * Get system statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = walletService.getSystemStats();

    res.json({
      success: true,
      stats: stats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;

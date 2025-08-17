import { circleClient } from './circleClient.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Wallet Management Service
 * High-level service for managing user wallets and transactions
 */
class WalletService {
  constructor() {
    // In-memory storage for demo purposes
    // In production, this would be a proper database
    this.users = new Map();
    this.wallets = new Map();
    this.transactions = new Map();
  }

  /**
   * Register a new user and create their Circle wallet
   * @param {string} userId - Unique user identifier (can be email, username, etc.)
   * @param {Object} userProfile - User profile information
   * @returns {Promise<Object>} User registration result with wallet info
   */
  async registerUser(userId, userProfile = {}) {
    try {
      console.log(`Registering user: ${userId}`);

      // Check if user already exists
      if (this.users.has(userId)) {
        throw new Error('User already exists');
      }

      // Create Circle wallet for the user
      const walletResponse = await circleClient.createWallet(userId);
      const wallet = walletResponse.wallets?.[0] || walletResponse;

      // Store user and wallet information
      const user = {
        id: userId,
        profile: userProfile,
        walletId: wallet.id,
        walletAddress: wallet.address,
        createdAt: new Date().toISOString(),
        ...userProfile
      };

      this.users.set(userId, user);
      this.wallets.set(wallet.id, {
        ...wallet,
        userId: userId,
        createdAt: new Date().toISOString()
      });

      console.log(`User ${userId} registered successfully with wallet ${wallet.id}`);
      
      return {
        success: true,
        user: user,
        wallet: {
          id: wallet.id,
          address: wallet.address,
          blockchain: wallet.blockchain
        }
      };
    } catch (error) {
      console.error('Error registering user:', error);
      throw new Error(`Failed to register user: ${error.message}`);
    }
  }

  /**
   * Get user information including wallet details
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User and wallet information
   */
  async getUser(userId) {
    try {
      const user = this.users.get(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Get latest wallet balance
      const balance = await circleClient.getWalletBalance(user.walletId);
      
      return {
        ...user,
        balance: balance
      };
    } catch (error) {
      console.error('Error fetching user:', error);
      throw new Error(`Failed to fetch user: ${error.message}`);
    }
  }

  /**
   * Get wallet balance for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Wallet balance information
   */
  async getUserBalance(userId) {
    try {
      const user = this.users.get(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const balance = await circleClient.getWalletBalance(user.walletId);
      return balance;
    } catch (error) {
      console.error('Error fetching user balance:', error);
      throw new Error(`Failed to fetch user balance: ${error.message}`);
    }
  }

  /**
   * Send payment between users
   * @param {string} fromUserId - Sender user ID
   * @param {string} toUserId - Recipient user ID
   * @param {string} amount - Amount to send
   * @param {string} memo - Optional transaction memo
   * @returns {Promise<Object>} Transaction result
   */
  async sendPayment(fromUserId, toUserId, amount, memo = '') {
    try {
      console.log(`💰 Processing payment: ${fromUserId} -> ${toUserId}, amount: ${amount}`);

      const fromUser = this.users.get(fromUserId);
      const toUser = this.users.get(toUserId);

      if (!fromUser) {
        throw new Error('Sender not found');
      }
      if (!toUser) {
        throw new Error('Recipient not found');
      }

      // Create wallet transfer using Circle
      const transaction = await circleClient.createWalletTransfer(
        fromUser.walletId,
        toUser.walletAddress,
        amount
      );

      // Store transaction record
      const transactionRecord = {
        id: transaction.id,
        fromUserId: fromUserId,
        toUserId: toUserId,
        fromWalletId: fromUser.walletId,
        toWalletAddress: toUser.walletAddress,
        amount: amount,
        memo: memo,
        status: transaction.state,
        transactionHash: transaction.transactionHash,
        createdAt: new Date().toISOString(),
        circleTransaction: transaction
      };

      this.transactions.set(transaction.id, transactionRecord);

      console.log(`✅ Payment processed successfully: ${transaction.id}`);
      
      return {
        success: true,
        transaction: transactionRecord
      };
    } catch (error) {
      console.error('❌ Error processing payment:', error);
      throw new Error(`Failed to process payment: ${error.message}`);
    }
  }

  /**
   * Get transaction history for a user
   * @param {string} userId - User ID
   * @param {number} limit - Number of transactions to fetch
   * @returns {Promise<Array>} List of user transactions
   */
  async getUserTransactions(userId, limit = 10) {
    try {
      const user = this.users.get(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Get transactions from Circle
      const circleTransactions = await circleClient.getWalletTransactions(user.walletId, limit);
      
      // Combine with local transaction records
      const userTransactions = Array.from(this.transactions.values())
        .filter(tx => tx.fromUserId === userId || tx.toUserId === userId)
        .slice(0, limit);

      return {
        circleTransactions: circleTransactions,
        localTransactions: userTransactions
      };
    } catch (error) {
      console.error('Error fetching user transactions:', error);
      throw new Error(`Failed to fetch user transactions: ${error.message}`);
    }
  }

  /**
   * Create a payment request (for merchant functionality)
   * @param {string} merchantUserId - Merchant user ID
   * @param {string} amount - Payment amount
   * @param {string} description - Payment description
   * @returns {Promise<Object>} Payment request details
   */
  async createPaymentRequest(merchantUserId, amount, description = '') {
    try {
      const merchant = this.users.get(merchantUserId);
      if (!merchant) {
        throw new Error('Merchant not found');
      }

      // Create Circle payment intent
      const paymentIntent = await circleClient.createPaymentIntent(amount, 'USD');
      
      const paymentRequest = {
        id: paymentIntent.id,
        merchantUserId: merchantUserId,
        merchantWalletAddress: merchant.walletAddress,
        amount: amount,
        description: description,
        status: 'pending',
        paymentIntent: paymentIntent,
        createdAt: new Date().toISOString()
      };

      return {
        success: true,
        paymentRequest: paymentRequest
      };
    } catch (error) {
      console.error('Error creating payment request:', error);
      throw new Error(`Failed to create payment request: ${error.message}`);
    }
  }

  /**
   * List all registered users (for demo purposes)
   * @returns {Array} List of all users
   */
  getAllUsers() {
    return Array.from(this.users.values()).map(user => ({
      id: user.id,
      profile: user.profile,
      walletAddress: user.walletAddress,
      createdAt: user.createdAt
    }));
  }

  /**
   * Get system statistics (for demo dashboard)
   * @returns {Object} System statistics
   */
  getSystemStats() {
    return {
      totalUsers: this.users.size,
      totalWallets: this.wallets.size,
      totalTransactions: this.transactions.size,
      lastActivity: new Date().toISOString()
    };
  }
}

// Export singleton instance
export const walletService = new WalletService();
export default walletService;

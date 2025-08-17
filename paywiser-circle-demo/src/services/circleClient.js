import { initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets';
import { config } from '../../config.js';

/**
 * Circle Developer-Controlled Wallets Client Service
 * Handles all interactions with Circle's Developer-Controlled Wallets APIs
 */
class CircleClientService {
  constructor() {
    try {
      this.client = initiateDeveloperControlledWalletsClient({
        apiKey: config.circle.apiKey,
        entitySecret: config.circle.entitySecret,
      });
      console.log('✅ Circle Developer-Controlled Wallets Client initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Circle client:', error);
      throw error;
    }
  }

  /**
   * Create a new developer-controlled wallet for a user
   * @param {string} userId - Unique identifier for the user
   * @param {Array} blockchains - Array of blockchain networks to support
   * @returns {Promise<Object>} Wallet creation response
   */
  async createWallet(userId, blockchains = ['ETH-SEPOLIA']) {
    try {
      console.log(`🏦 Creating wallet for user: ${userId}`);
      
      const walletResponse = await this.client.createWallets({
        walletSetId: config.circle.walletSetId,
        accountType: 'SCA',
        blockchains: blockchains,
        count: 1,
        metadata: [{
          name: `PayWiser Wallet - ${userId}`,
          refId: userId,
        }],
      });

      console.log('✅ Wallet created successfully:', walletResponse.data);
      return walletResponse.data;
    } catch (error) {
      console.error('❌ Error creating wallet:', error);
      throw new Error(`Failed to create wallet: ${error.message}`);
    }
  }

  /**
   * Get wallet details by wallet ID
   * @param {string} walletId - Circle wallet ID
   * @returns {Promise<Object>} Wallet details
   */
  async getWallet(walletId) {
    try {
      const response = await this.client.getWallet({ id: walletId });
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching wallet:', error);
      throw new Error(`Failed to fetch wallet: ${error.message}`);
    }
  }

  /**
   * Get wallet balance
   * @param {string} walletId - Circle wallet ID
   * @returns {Promise<Object>} Wallet balance information
   */
  async getWalletBalance(walletId) {
    try {
      const response = await this.client.getWalletTokenBalance({
        id: walletId
      });
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching wallet balance:', error);
      throw new Error(`Failed to fetch wallet balance: ${error.message}`);
    }
  }

  /**
   * Create a wallet-to-wallet transfer
   * @param {string} sourceWalletId - Source wallet ID
   * @param {string} destinationAddress - Destination wallet address
   * @param {string} amount - Amount to transfer
   * @param {string} tokenId - Token ID (will use native MATIC if not provided)
   * @returns {Promise<Object>} Transaction response
   */
  async createWalletTransfer(sourceWalletId, destinationAddress, amount, tokenId = null) {
    try {
      console.log(`💸 Creating transfer from wallet ${sourceWalletId} to ${destinationAddress}, amount: ${amount}`);
      
      // If no tokenId provided, we need to get a token ID from wallet balance
      if (!tokenId) {
        console.log('🔍 Getting wallet balance to find available tokens...');
        const balance = await this.getWalletBalance(sourceWalletId);
        
        if (balance.tokenBalances.length === 0) {
          throw new Error('No tokens found in wallet. Wallet is empty.');
        }
        
        // First try to find native token, otherwise use the first available token
        let selectedToken = balance.tokenBalances.find(token => token.token.isNative);
        if (!selectedToken) {
          selectedToken = balance.tokenBalances[0]; // Use first available token (e.g., USDC)
          console.log('💡 No native token found, using first available token for transfer');
        }
        
        tokenId = selectedToken.token.id;
        console.log(`📝 Using token: ${selectedToken.token.symbol} (ID: ${tokenId})`);
        console.log(`💰 Available amount: ${selectedToken.amount}`);
      }

      const transferRequest = {
        walletId: sourceWalletId,
        tokenId: tokenId,
        destinationAddress: destinationAddress,
        amounts: [amount], // Circle API expects an array
        fee: {
          type: 'level',
          config: {
            feeLevel: 'MEDIUM'
          }
        }
      };

      const transactionResponse = await this.client.createTransaction(transferRequest);

      console.log('✅ Transfer created successfully:', transactionResponse.data);
      return transactionResponse.data;
    } catch (error) {
      console.error('❌ Error creating transfer:', error);
      throw new Error(`Failed to create transfer: ${error.message}`);
    }
  }

  /**
   * Create a payment intent for receiving payments
   * @param {string} amount - Payment amount
   * @param {string} currency - Currency (USD, USDC, etc.)
   * @param {Array} paymentMethods - Supported payment methods
   * @returns {Promise<Object>} Payment intent response
   */
  async createPaymentIntent(amount, currency = 'USD', paymentMethods = [{ chain: 'ETH', type: 'blockchain' }]) {
    try {
      console.log(`Creating payment intent for ${amount} ${currency}`);
      
      const paymentIntentResponse = await this.client.paymentIntents.createPaymentIntent({
        idempotencyKey: `payment-${Date.now()}`,
        amount: {
          amount: amount,
          currency: currency
        },
        settlementCurrency: currency,
        paymentMethods: paymentMethods
      });

      console.log('Payment intent created:', paymentIntentResponse.data);
      return paymentIntentResponse.data;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw new Error(`Failed to create payment intent: ${error.message}`);
    }
  }

  /**
   * Get transaction details
   * @param {string} transactionId - Transaction ID
   * @returns {Promise<Object>} Transaction details
   */
  async getTransaction(transactionId) {
    try {
      const response = await this.client.getTransaction({ id: transactionId });
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching transaction:', error);
      throw new Error(`Failed to fetch transaction: ${error.message}`);
    }
  }

  /**
   * List all transactions for a wallet
   * @param {string} walletId - Wallet ID
   * @param {number} limit - Number of transactions to fetch
   * @returns {Promise<Object>} List of transactions
   */
  async getWalletTransactions(walletId, limit = 10) {
    try {
      const response = await this.client.transactions.listTransactions({
        walletId: walletId,
        limit: limit,
        orderBy: 'createDate',
        orderDirection: 'DESC'
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching wallet transactions:', error);
      throw new Error(`Failed to fetch wallet transactions: ${error.message}`);
    }
  }
}

// Export singleton instance
export const circleClient = new CircleClientService();
export default circleClient;

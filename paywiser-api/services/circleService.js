/**
 * Circle Wallet Service for PayWiser
 * Handles wallet creation, transfers, and balance queries
 */

const { initiateDeveloperControlledWalletsClient } = require('@circle-fin/developer-controlled-wallets');

class CircleService {
  constructor() {
    this.client = null;
    this.apiKey = process.env.CIRCLE_API_KEY;
    this.entitySecret = process.env.CIRCLE_ENTITY_SECRET;
    this.walletSetId = process.env.CIRCLE_WALLET_SET_ID;
    this.init();
  }

  async init() {
    try {
      this.client = initiateDeveloperControlledWalletsClient({
        apiKey: this.apiKey,
        entitySecret: this.entitySecret
      });
      console.log('💰 Circle Wallet Service initialized');
    } catch (error) {
      console.error('❌ Circle initialization error:', error);
      throw error;
    }
  }

  /**
   * Create a new wallet for a user
   * @param {string} chain - Blockchain (ETH-SEPOLIA, ARB-SEPOLIA)
   * @param {string} userId - User ID for reference
   * @returns {Promise<Object>} Wallet creation result
   */
  async createWallet(chain = 'ETH-SEPOLIA', userId) {
    try {
      const response = await this.client.createWallets({
        accountType: 'SCA',
        blockchains: [chain],
        count: 1,
        walletSetId: this.walletSetId
      });

      const wallet = response.data.wallets[0];
      
      return {
        success: true,
        wallet: {
          id: wallet.id,
          address: wallet.address,
          blockchain: wallet.blockchain,
          custodyType: wallet.custodyType,
          userId: userId
        }
      };
    } catch (error) {
      console.error('❌ Wallet creation error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create wallet'
      };
    }
  }

  /**
   * Get wallet balance
   * @param {string} walletId - Wallet ID
   * @returns {Promise<Object>} Balance information
   */
  async getWalletBalance(walletId) {
    try {
      const response = await this.client.getWallet({ id: walletId });
      
      return {
        success: true,
        balance: {
          walletId: response.data.wallet.id,
          address: response.data.wallet.address,
          blockchain: response.data.wallet.blockchain,
          tokens: response.data.wallet.balances || []
        }
      };
    } catch (error) {
      console.error('❌ Balance query error:', error);
      return {
        success: false,
        error: error.message || 'Failed to get wallet balance'
      };
    }
  }

  /**
   * Transfer tokens between wallets
   * @param {Object} transferData - Transfer parameters
   * @returns {Promise<Object>} Transfer result
   */
  async createTransfer(transferData) {
    try {
      const { fromWalletId, toAddress, amount, tokenSymbol } = transferData;

      // Get wallet details to find appropriate token
      const walletResponse = await this.client.getWallet({ id: fromWalletId });
      const wallet = walletResponse.data.wallet;
      
      if (!wallet.balances || wallet.balances.length === 0) {
        return {
          success: false,
          error: 'Insufficient balance - no tokens found in wallet'
        };
      }

      // Find the token to transfer
      let tokenId = null;
      
      if (tokenSymbol) {
        // Look for specific token
        const token = wallet.balances.find(b => 
          b.token && b.token.symbol && b.token.symbol.toUpperCase() === tokenSymbol.toUpperCase()
        );
        if (token) {
          tokenId = token.token.id;
        }
      }
      
      // Fallback: use first available ERC-20 token (like USDC)
      if (!tokenId) {
        const erc20Token = wallet.balances.find(b => b.token && b.token.id);
        if (erc20Token) {
          tokenId = erc20Token.token.id;
        }
      }

      // Last resort: use native token
      if (!tokenId) {
        const nativeToken = wallet.balances.find(b => !b.token);
        if (nativeToken) {
          tokenId = null; // Native token doesn't have an ID
        }
      }

      if (!tokenId && !wallet.balances.find(b => !b.token)) {
        return {
          success: false,
          error: 'No suitable token found for transfer'
        };
      }

      // Create the transfer
      const transferPayload = {
        walletId: fromWalletId,
        destinationAddress: toAddress,
        amounts: [amount],
        fee: {
          type: 'level',
          config: {
            feeLevel: 'MEDIUM'
          }
        }
      };

      if (tokenId) {
        transferPayload.tokenId = tokenId;
      }

      const response = await this.client.createTransaction(transferPayload);

      return {
        success: true,
        transaction: {
          id: response.data.id,
          state: response.data.state,
          txHash: response.data.txHash,
          amount: amount,
          toAddress: toAddress,
          fromWalletId: fromWalletId
        }
      };
    } catch (error) {
      console.error('❌ Transfer error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create transfer'
      };
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
      
      return {
        success: true,
        transaction: response.data
      };
    } catch (error) {
      console.error('❌ Transaction query error:', error);
      return {
        success: false,
        error: error.message || 'Failed to get transaction details'
      };
    }
  }

  /**
   * List all wallets for the wallet set
   * @returns {Promise<Object>} Wallets list
   */
  async listWallets() {
    try {
      const response = await this.client.listWallets({
        walletSetId: this.walletSetId
      });

      return {
        success: true,
        wallets: response.data.wallets
      };
    } catch (error) {
      console.error('❌ Wallet list error:', error);
      return {
        success: false,
        error: error.message || 'Failed to list wallets'
      };
    }
  }

  /**
   * Get supported blockchains
   * @returns {Array} Supported blockchain list
   */
  getSupportedChains() {
    return ['ETH-SEPOLIA', 'ARB-SEPOLIA'];
  }

  /**
   * Validate blockchain name
   * @param {string} chain - Blockchain name
   * @returns {boolean} Is valid
   */
  isValidChain(chain) {
    return this.getSupportedChains().includes(chain);
  }
}

module.exports = new CircleService();

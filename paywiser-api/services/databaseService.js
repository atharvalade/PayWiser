/**
 * Local JSON Database Service for PayWiser
 * Handles user and merchant data storage
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class DatabaseService {
  constructor() {
    this.dbPath = path.join(__dirname, '../data/paywiser.json');
    this.data = {
      users: [],
      merchants: [],
      transactions: [],
      metadata: {
        created: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        version: '1.0.0'
      }
    };
  }

  init() {
    try {
      // Create data directory if it doesn't exist
      const dataDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // Load existing data or create new
      if (fs.existsSync(this.dbPath)) {
        const rawData = fs.readFileSync(this.dbPath, 'utf8');
        this.data = JSON.parse(rawData);
        console.log('📊 Database loaded:', this.dbPath);
      } else {
        this.save();
        console.log('📊 New database created:', this.dbPath);
      }
    } catch (error) {
      console.error('❌ Database initialization error:', error);
      throw error;
    }
  }

  save() {
    try {
      this.data.metadata.lastUpdated = new Date().toISOString();
      fs.writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2));
    } catch (error) {
      console.error('❌ Database save error:', error);
      throw error;
    }
  }

  // User operations
  createUser(userData) {
    const user = {
      id: uuidv4(),
      name: userData.name,
      faceEmbedding: userData.faceEmbedding,
      wallets: userData.wallets || [],
      created: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };
    
    this.data.users.push(user);
    this.save();
    return user;
  }

  getUserById(userId) {
    return this.data.users.find(user => user.id === userId);
  }

  getUserByFaceEmbedding(embedding, threshold = 0.68) {
    // Find user with most similar face embedding
    let bestMatch = null;
    let bestDistance = Infinity;

    for (const user of this.data.users) {
      const distance = this.calculateDistance(embedding, user.faceEmbedding);
      if (distance < threshold && distance < bestDistance) {
        bestDistance = distance;
        bestMatch = user;
      }
    }

    return bestMatch ? { user: bestMatch, distance: bestDistance } : null;
  }

  updateUser(userId, updates) {
    const userIndex = this.data.users.findIndex(user => user.id === userId);
    if (userIndex !== -1) {
      this.data.users[userIndex] = { ...this.data.users[userIndex], ...updates };
      this.save();
      return this.data.users[userIndex];
    }
    return null;
  }

  addWalletToUser(userId, walletData) {
    const user = this.getUserById(userId);
    if (user) {
      if (!user.wallets) user.wallets = [];
      user.wallets.push({
        id: walletData.id,
        address: walletData.address,
        chain: walletData.chain,
        created: new Date().toISOString()
      });
      this.save();
      return user;
    }
    return null;
  }

  // Merchant operations
  createMerchant(merchantData) {
    const merchant = {
      id: uuidv4(),
      name: merchantData.name,
      walletAddress: merchantData.walletAddress,
      icaAddress: merchantData.icaAddress,
      settlementChain: merchantData.settlementChain,
      created: new Date().toISOString()
    };
    
    this.data.merchants.push(merchant);
    this.save();
    return merchant;
  }

  getMerchantById(merchantId) {
    return this.data.merchants.find(merchant => merchant.id === merchantId);
  }

  // Transaction operations
  createTransaction(transactionData) {
    const transaction = {
      id: uuidv4(),
      fromUserId: transactionData.fromUserId,
      toMerchantId: transactionData.toMerchantId,
      amount: transactionData.amount,
      token: transactionData.token,
      chain: transactionData.chain,
      txHash: transactionData.txHash,
      status: transactionData.status || 'pending',
      created: new Date().toISOString()
    };
    
    this.data.transactions.push(transaction);
    this.save();
    return transaction;
  }

  getTransactionsByUser(userId) {
    return this.data.transactions.filter(tx => tx.fromUserId === userId);
  }

  getTransactionsByMerchant(merchantId) {
    return this.data.transactions.filter(tx => tx.toMerchantId === merchantId);
  }

  updateTransaction(transactionId, updates) {
    const txIndex = this.data.transactions.findIndex(tx => tx.id === transactionId);
    if (txIndex !== -1) {
      this.data.transactions[txIndex] = { ...this.data.transactions[txIndex], ...updates };
      this.save();
      return this.data.transactions[txIndex];
    }
    return null;
  }

  // Utility functions
  calculateDistance(embedding1, embedding2) {
    if (!embedding1 || !embedding2 || embedding1.length !== embedding2.length) {
      return Infinity;
    }

    let sum = 0;
    for (let i = 0; i < embedding1.length; i++) {
      sum += Math.pow(embedding1[i] - embedding2[i], 2);
    }
    return Math.sqrt(sum);
  }

  getAllUsers() {
    return this.data.users;
  }

  getAllMerchants() {
    return this.data.merchants;
  }

  getAllTransactions() {
    return this.data.transactions;
  }

  // Database stats
  getStats() {
    return {
      users: this.data.users.length,
      merchants: this.data.merchants.length,
      transactions: this.data.transactions.length,
      metadata: this.data.metadata
    };
  }
}

// Export singleton instance
module.exports = new DatabaseService();

/**
 * Hyperlane Settlement Service for PayWiser
 * Handles cross-chain settlement using Interchain Accounts
 */

const { ethers } = require('ethers');

class HyperlaneService {
  constructor() {
    this.providers = {};
    this.chainConfigs = {
      'ETH-SEPOLIA': {
        name: 'sepolia',
        rpc: process.env.HYPERLANE_SEPOLIA_RPC || 'https://ethereum-sepolia.publicnode.com',
        domainId: 11155111,
        routerAddress: '0x7E7c8e61Ab59cAa11b0ad63F7d47fe5cC89d1a0E',
        usdcAddress: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'
      },
      'ARB-SEPOLIA': {
        name: 'arbitrumsepolia',
        rpc: process.env.HYPERLANE_ARBITRUM_RPC || 'https://sepolia-rollup.arbitrum.io/rpc',
        domainId: 421614,
        routerAddress: '0x7E7c8e61Ab59cAa11b0ad63F7d47fe5cC89d1a0E',
        usdcAddress: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d'
      },
      'POLYGON-AMOY': {
        name: 'polygonamoy',
        rpc: process.env.HYPERLANE_POLYGON_RPC || 'https://rpc-amoy.polygon.technology',
        domainId: 80002,
        routerAddress: '0x7E7c8e61Ab59cAa11b0ad63F7d47fe5cC89d1a0E',
        usdcAddress: '0x41e94eb019c0762f9bfcf9fb1e58725bfb0e7582'
      },
      'BASE-SEPOLIA': {
        name: 'basesepolia',
        rpc: process.env.HYPERLANE_BASE_RPC || 'https://sepolia.base.org',
        domainId: 84532,
        routerAddress: '0x7E7c8e61Ab59cAa11b0ad63F7d47fe5cC89d1a0E',
        usdcAddress: '0x036CbD53842c5426634e7929541eC2318f3dCF7e'
      }
    };
    
    this.init();
  }

  async init() {
    try {
      // Initialize providers for each chain
      for (const [chainName, config] of Object.entries(this.chainConfigs)) {
        this.providers[chainName] = new ethers.JsonRpcProvider(config.rpc);
      }
      console.log('🌉 Hyperlane Service initialized');
    } catch (error) {
      console.error('❌ Hyperlane initialization error:', error);
      throw error;
    }
  }

  /**
   * Calculate Interchain Account address for a given owner
   * @param {string} originChain - Origin blockchain
   * @param {string} destinationChain - Destination blockchain
   * @param {string} ownerAddress - Owner address
   * @returns {Object} ICA calculation result
   */
  async calculateICA(originChain, destinationChain, ownerAddress) {
    try {
      const originConfig = this.chainConfigs[originChain];
      const destConfig = this.chainConfigs[destinationChain];

      if (!originConfig || !destConfig) {
        throw new Error('Unsupported chain configuration');
      }

      // Simplified ICA calculation (in real implementation, this would use CREATE2)
      const salt = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ['uint32', 'address', 'address'],
          [originConfig.domainId, ownerAddress, originConfig.routerAddress]
        )
      );

      // This is a simplified calculation - real ICA uses CREATE2 with specific bytecode
      const icaAddress = ethers.getCreate2Address(
        destConfig.routerAddress,
        salt,
        ethers.keccak256('0x') // Placeholder bytecode hash
      );

      return {
        success: true,
        icaAddress: icaAddress,
        originChain: originChain,
        destinationChain: destinationChain,
        ownerAddress: ownerAddress,
        originDomain: originConfig.domainId,
        destinationDomain: destConfig.domainId
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to calculate ICA address'
      };
    }
  }

  /**
   * Get balance of USDC on a specific chain
   * @param {string} chain - Blockchain name
   * @param {string} address - Wallet address
   * @returns {Promise<Object>} Balance result
   */
  async getBalance(chain, address) {
    try {
      const config = this.chainConfigs[chain];
      if (!config) {
        throw new Error('Unsupported chain');
      }

      const provider = this.providers[chain];
      
      // USDC contract ABI (minimal)
      const usdcAbi = [
        'function balanceOf(address owner) view returns (uint256)',
        'function decimals() view returns (uint8)',
        'function symbol() view returns (string)'
      ];

      const usdcContract = new ethers.Contract(config.usdcAddress, usdcAbi, provider);
      
      const balance = await usdcContract.balanceOf(address);
      const decimals = await usdcContract.decimals();
      const symbol = await usdcContract.symbol();

      return {
        success: true,
        balance: {
          raw: balance.toString(),
          formatted: ethers.formatUnits(balance, decimals),
          decimals: decimals.toString(),
          symbol: symbol,
          chain: chain,
          address: address
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to get balance'
      };
    }
  }

  /**
   * Estimate gas cost for settlement transaction
   * @param {string} originChain - Origin chain
   * @param {string} destinationChain - Destination chain
   * @param {string} amount - Amount to settle
   * @returns {Promise<Object>} Gas estimation
   */
  async estimateSettlementGas(originChain, destinationChain, amount) {
    try {
      const originConfig = this.chainConfigs[originChain];
      if (!originConfig) {
        throw new Error('Unsupported origin chain');
      }

      const provider = this.providers[originChain];
      const gasPrice = await provider.getFeeData();

      // Simplified gas estimation (real implementation would simulate the transaction)
      const estimatedGas = ethers.parseUnits('200000', 'wei'); // ~200k gas
      const gasCost = estimatedGas * gasPrice.gasPrice;

      return {
        success: true,
        gasEstimate: {
          gasLimit: estimatedGas.toString(),
          gasPrice: gasPrice.gasPrice ? gasPrice.gasPrice.toString() : "0",
          gasCost: gasCost.toString(),
          gasCostFormatted: ethers.formatEther(gasCost),
          originChain: originChain,
          destinationChain: destinationChain
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to estimate gas'
      };
    }
  }

  /**
   * Execute settlement to destination chain
   * @param {Object} settlementData - Settlement parameters
   * @returns {Promise<Object>} Settlement result
   */
  async executeSettlement(settlementData) {
    try {
      const {
        originChain,
        destinationChain,
        merchantAddress,
        amount,
        privateKey
      } = settlementData;

      const originConfig = this.chainConfigs[originChain];
      const destConfig = this.chainConfigs[destinationChain];

      if (!originConfig || !destConfig) {
        throw new Error('Unsupported chain configuration');
      }

      const provider = this.providers[originChain];
      const wallet = new ethers.Wallet(privateKey, provider);

      // Router ABI (minimal for callRemote)
      const routerAbi = [
        'function callRemote(uint32 destinationDomain, tuple(bytes32 to, uint256 value, bytes data)[] calls) external returns (bytes32)'
      ];

      const routerContract = new ethers.Contract(originConfig.routerAddress, routerAbi, wallet);

      // USDC transfer call data
      const usdcAbi = ['function transfer(address to, uint256 amount) external returns (bool)'];
      const usdcInterface = new ethers.Interface(usdcAbi);
      const transferCallData = usdcInterface.encodeFunctionData('transfer', [
        merchantAddress,
        ethers.parseUnits(amount, 6) // USDC has 6 decimals
      ]);

      // Prepare the call for remote execution
      const call = {
        to: ethers.zeroPadValue(destConfig.usdcAddress, 32),
        value: 0,
        data: transferCallData
      };

      // Execute the settlement
      const tx = await routerContract.callRemote(destConfig.domainId, [call]);
      const receipt = await tx.wait();

      return {
        success: true,
        settlement: {
          txHash: receipt.hash,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString(),
          originChain: originChain,
          destinationChain: destinationChain,
          amount: amount,
          merchantAddress: merchantAddress,
          status: 'completed'
        }
      };
    } catch (error) {
      console.error('❌ Settlement execution error:', error);
      return {
        success: false,
        error: error.message || 'Failed to execute settlement'
      };
    }
  }

  /**
   * Get supported settlement chains
   * @returns {Array} Supported chains for settlement
   */
  getSupportedSettlementChains() {
    return Object.keys(this.chainConfigs);
  }

  /**
   * Validate chain name
   * @param {string} chain - Chain name
   * @returns {boolean} Is valid
   */
  isValidChain(chain) {
    return this.chainConfigs.hasOwnProperty(chain);
  }

  /**
   * Get chain configuration
   * @param {string} chain - Chain name
   * @returns {Object} Chain config
   */
  getChainConfig(chain) {
    return this.chainConfigs[chain];
  }

  /**
   * Create a mock settlement for demo purposes
   * @param {Object} settlementData - Settlement parameters
   * @returns {Object} Mock settlement result
   */
  async mockSettlement(settlementData) {
    const {
      originChain,
      destinationChain,
      merchantAddress,
      amount
    } = settlementData;

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    return {
      success: true,
      settlement: {
        txHash: '0x' + Math.random().toString(16).substring(2, 66),
        blockNumber: Math.floor(Math.random() * 1000000) + 5000000,
        gasUsed: (Math.floor(Math.random() * 50000) + 150000).toString(),
        originChain: originChain,
        destinationChain: destinationChain,
        amount: amount,
        merchantAddress: merchantAddress,
        status: 'completed',
        note: 'Mock settlement for demo purposes'
      }
    };
  }
}

module.exports = new HyperlaneService();

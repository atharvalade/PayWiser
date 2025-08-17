import { ethers } from 'ethers';
import { HyperlaneCore, MultiProvider } from '@hyperlane-xyz/sdk';
import { config, HYPERLANE_CHAINS } from '../config.js';

/**
 * Hyperlane Service for PayWiser Cross-Chain Settlements
 * Handles Interchain Account operations and cross-chain messaging
 */
export class HyperlaneService {
  constructor() {
    this.multiProvider = null;
    this.core = null;
    this.initialized = false;
  }

  /**
   * Initialize Hyperlane SDK with multi-chain configuration
   */
  async initialize() {
    try {
      console.log('🌐 Initializing Hyperlane Service...');

      // For now, let's initialize without the full SDK to avoid configuration issues
      // We'll use basic ethers providers for the core functionality
      this.providers = {};
      
      for (const [chainName, chainConfig] of Object.entries(HYPERLANE_CHAINS)) {
        try {
          this.providers[chainName] = new ethers.JsonRpcProvider(chainConfig.rpcUrl);
          console.log(`✅ Provider initialized for ${chainName}`);
        } catch (error) {
          console.log(`⚠️  Failed to initialize provider for ${chainName}:`, error.message);
        }
      }

      // Add signers if private key is available
      if (config.wallet.privateKey) {
        this.signers = {};
        for (const [chainName, provider] of Object.entries(this.providers)) {
          try {
            this.signers[chainName] = new ethers.Wallet(config.wallet.privateKey, provider);
            console.log(`✅ Signer initialized for ${chainName}`);
          } catch (error) {
            console.log(`⚠️  Failed to initialize signer for ${chainName}:`, error.message);
          }
        }
      }

      this.initialized = true;
      console.log('✅ Hyperlane Service initialized successfully (basic mode)');
      console.log('📝 Note: Using basic ethers providers. Full Hyperlane SDK integration can be added later.');
      
    } catch (error) {
      console.error('❌ Failed to initialize Hyperlane Service:', error);
      throw error;
    }
  }

  /**
   * Get InterchainAccountRouter address for a chain
   */
  getInterchainAccountRouter(chainName) {
    const chainConfig = HYPERLANE_CHAINS[chainName];
    if (!chainConfig) {
      throw new Error(`Unsupported chain: ${chainName}`);
    }
    return chainConfig.interchainAccountRouter;
  }

  /**
   * Get USDC token address for a chain
   */
  getUSDCAddress(chainName) {
    const chainConfig = HYPERLANE_CHAINS[chainName];
    if (!chainConfig) {
      throw new Error(`Unsupported chain: ${chainName}`);
    }
    return chainConfig.usdc;
  }

  /**
   * Estimate gas cost for cross-chain settlement
   */
  async estimateSettlementGas(fromChain, toChain, amount) {
    try {
      if (!this.initialized) await this.initialize();

      console.log(`💰 Estimating gas for settlement: ${fromChain} -> ${toChain}, amount: ${amount}`);

      const fromProvider = this.providers[fromChain];
      const fromChainConfig = HYPERLANE_CHAINS[fromChain];
      const toChainConfig = HYPERLANE_CHAINS[toChain];

      if (!fromProvider) {
        throw new Error(`Provider not available for ${fromChain}`);
      }

      // For now, return a mock estimate since we don't have deployed router addresses
      if (fromChainConfig.interchainAccountRouter === '0x@TODO') {
        console.log('⚠️  Using mock gas estimate - Hyperlane router not configured');
        return {
          estimatedGas: '500000',
          estimatedGasETH: '0.01',
          fromChain,
          toChain,
          amount,
          isMockEstimate: true
        };
      }

      // Create InterchainAccountRouter contract instance
      const routerAddress = fromChainConfig.interchainAccountRouter;
      const routerAbi = [
        "function quoteGasPayment(uint32 destination) external view returns (uint256)",
        "function callRemote(uint32 destination, tuple(bytes32 to, uint256 value, bytes data)[] calls) external payable returns (bytes32)"
      ];

      const router = new ethers.Contract(routerAddress, routerAbi, fromProvider);

      // Get gas quote for destination chain
      const gasQuote = await router.quoteGasPayment(toChainConfig.domain);

      return {
        estimatedGas: gasQuote.toString(),
        estimatedGasETH: ethers.formatEther(gasQuote),
        fromChain,
        toChain,
        amount
      };

    } catch (error) {
      console.error('❌ Error estimating settlement gas:', error);
      throw error;
    }
  }

  /**
   * Execute cross-chain settlement
   */
  async executeSettlement(fromChain, toChain, merchantAddress, tokenAddress, amount, settlementAddress) {
    try {
      if (!this.initialized) await this.initialize();

      console.log(`🚀 Executing cross-chain settlement: ${fromChain} -> ${toChain}`);
      console.log(`📍 Merchant: ${merchantAddress}, Amount: ${amount}`);

      const fromSigner = this.multiProvider.getSigner(fromChain);
      const fromChainConfig = HYPERLANE_CHAINS[fromChain];
      const toChainConfig = HYPERLANE_CHAINS[toChain];

      // Create PayWiserSettlement contract instance
      const payWiserAbi = [
        "function initiateSettlement(address token, uint256 amount) external payable",
        "function getSettlementQuote(uint32 destinationChain) external view returns (uint256)"
      ];

      // Note: This would be the deployed PayWiserSettlement contract address
      const payWiserAddress = fromChainConfig.payWiserContract; // To be set after deployment
      const payWiserContract = new ethers.Contract(payWiserAddress, payWiserAbi, fromSigner);

      // Get gas quote
      const gasQuote = await payWiserContract.getSettlementQuote(toChainConfig.domain);

      // Execute settlement
      const tx = await payWiserContract.initiateSettlement(tokenAddress, amount, {
        value: gasQuote,
        gasLimit: 500000 // Reasonable gas limit for cross-chain calls
      });

      console.log(`📨 Settlement transaction sent: ${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`✅ Settlement transaction confirmed: ${receipt.transactionHash}`);

      // Extract Hyperlane message ID from events
      const settlementEvent = receipt.logs.find(log => 
        log.topics[0] === ethers.id("SettlementInitiated(address,uint32,address,uint256,bytes32)")
      );

      let hyperlaneMessageId = null;
      if (settlementEvent) {
        const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
          ['address', 'uint32', 'address', 'uint256', 'bytes32'],
          settlementEvent.data
        );
        hyperlaneMessageId = decoded[4];
      }

      return {
        success: true,
        transactionHash: receipt.transactionHash,
        hyperlaneMessageId,
        fromChain,
        toChain,
        amount,
        gasUsed: receipt.gasUsed.toString(),
        effectiveGasPrice: receipt.effectiveGasPrice.toString()
      };

    } catch (error) {
      console.error('❌ Error executing settlement:', error);
      throw error;
    }
  }

  /**
   * Get settlement status by tracking Hyperlane message
   */
  async getSettlementStatus(messageId, fromChain, toChain) {
    try {
      if (!this.initialized) await this.initialize();

      console.log(`🔍 Checking settlement status for message: ${messageId}`);

      // Use Hyperlane SDK to check message status
      const message = await this.core.getDispatchedMessage(fromChain, messageId);
      
      if (!message) {
        return {
          status: 'not_found',
          messageId
        };
      }

      // Check if message has been delivered on destination chain
      const isDelivered = await this.core.isDelivered(toChain, messageId);

      return {
        status: isDelivered ? 'delivered' : 'pending',
        messageId,
        fromChain,
        toChain,
        message: {
          sender: message.sender,
          recipient: message.recipient,
          body: message.body
        }
      };

    } catch (error) {
      console.error('❌ Error checking settlement status:', error);
      return {
        status: 'error',
        messageId,
        error: error.message
      };
    }
  }

  /**
   * Get interchain account address for a merchant on destination chain
   */
  async getInterchainAccountAddress(merchantAddress, fromChain, toChain) {
    try {
      if (!this.initialized) await this.initialize();

      const fromProvider = this.multiProvider.getProvider(fromChain);
      const fromChainConfig = HYPERLANE_CHAINS[fromChain];
      const toChainConfig = HYPERLANE_CHAINS[toChain];

      const routerAbi = [
        "function getRemoteInterchainAccount(uint32 destination, address owner) external view returns (address)"
      ];

      const router = new ethers.Contract(
        fromChainConfig.interchainAccountRouter,
        routerAbi,
        fromProvider
      );

      const icaAddress = await router.getRemoteInterchainAccount(
        toChainConfig.domain,
        merchantAddress
      );

      return {
        interchainAccountAddress: icaAddress,
        merchantAddress,
        fromChain,
        toChain
      };

    } catch (error) {
      console.error('❌ Error getting interchain account address:', error);
      throw error;
    }
  }

  /**
   * Get supported chains for settlements
   */
  getSupportedChains() {
    return Object.keys(HYPERLANE_CHAINS).map(chainName => ({
      name: chainName,
      chainId: HYPERLANE_CHAINS[chainName].chainId,
      domain: HYPERLANE_CHAINS[chainName].domain,
      displayName: this.getChainDisplayName(chainName)
    }));
  }

  /**
   * Helper function to get chain display name
   */
  getChainDisplayName(chainName) {
    const displayNames = {
      sepolia: 'Ethereum Sepolia',
      arbitrumSepolia: 'Arbitrum Sepolia',
      polygonAmoy: 'Polygon Amoy',
      baseSepolia: 'Base Sepolia'
    };
    return displayNames[chainName] || chainName;
  }

  /**
   * Helper function to get block explorer URL
   */
  getBlockExplorerUrl(chainId) {
    const explorers = {
      11155111: 'https://sepolia.etherscan.io',
      421614: 'https://sepolia.arbiscan.io',
      80002: 'https://amoy.polygonscan.com',
      84532: 'https://sepolia.basescan.org'
    };
    return explorers[chainId] || 'https://etherscan.io';
  }

  /**
   * Get chain configuration by name
   */
  getChainConfig(chainName) {
    const config = HYPERLANE_CHAINS[chainName];
    if (!config) {
      throw new Error(`Unsupported chain: ${chainName}`);
    }
    return config;
  }

  /**
   * Check if service is initialized
   */
  isInitialized() {
    return this.initialized;
  }
}

// Export singleton instance
export const hyperlaneService = new HyperlaneService();
export default hyperlaneService;

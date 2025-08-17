import express from 'express';
import { hyperlaneService } from '../hyperlaneService.js';
import { ethers } from 'ethers';

const router = express.Router();

/**
 * GET /api/settlement/chains
 * Get supported chains for settlement
 */
router.get('/chains', async (req, res) => {
  try {
    const chains = hyperlaneService.getSupportedChains();
    
    res.json({
      success: true,
      chains
    });
  } catch (error) {
    console.error('Get chains error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/settlement/estimate
 * Estimate gas cost for cross-chain settlement
 */
router.post('/estimate', async (req, res) => {
  try {
    const { fromChain, toChain, amount } = req.body;

    if (!fromChain || !toChain || !amount) {
      return res.status(400).json({
        success: false,
        error: 'fromChain, toChain, and amount are required'
      });
    }

    const estimate = await hyperlaneService.estimateSettlementGas(fromChain, toChain, amount);

    res.json({
      success: true,
      estimate
    });
  } catch (error) {
    console.error('Settlement estimate error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/settlement/execute
 * Execute cross-chain settlement
 */
router.post('/execute', async (req, res) => {
  try {
    const {
      fromChain,
      toChain,
      merchantAddress,
      tokenAddress,
      amount,
      settlementAddress
    } = req.body;

    // Validate required fields
    if (!fromChain || !toChain || !merchantAddress || !tokenAddress || !amount || !settlementAddress) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required: fromChain, toChain, merchantAddress, tokenAddress, amount, settlementAddress'
      });
    }

    // Validate Ethereum addresses
    if (!ethers.isAddress(merchantAddress) || !ethers.isAddress(tokenAddress) || !ethers.isAddress(settlementAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Ethereum address provided'
      });
    }

    // Validate amount
    if (isNaN(amount) || parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amount'
      });
    }

    const result = await hyperlaneService.executeSettlement(
      fromChain,
      toChain,
      merchantAddress,
      tokenAddress,
      amount,
      settlementAddress
    );

    res.json({
      success: true,
      settlement: result
    });
  } catch (error) {
    console.error('Settlement execution error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/settlement/status/:messageId
 * Get settlement status by Hyperlane message ID
 */
router.get('/status/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { fromChain, toChain } = req.query;

    if (!messageId) {
      return res.status(400).json({
        success: false,
        error: 'Message ID is required'
      });
    }

    if (!fromChain || !toChain) {
      return res.status(400).json({
        success: false,
        error: 'fromChain and toChain query parameters are required'
      });
    }

    const status = await hyperlaneService.getSettlementStatus(messageId, fromChain, toChain);

    res.json({
      success: true,
      status
    });
  } catch (error) {
    console.error('Settlement status error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/settlement/interchain-account
 * Get interchain account address for merchant
 */
router.get('/interchain-account', async (req, res) => {
  try {
    const { merchantAddress, fromChain, toChain } = req.query;

    if (!merchantAddress || !fromChain || !toChain) {
      return res.status(400).json({
        success: false,
        error: 'merchantAddress, fromChain, and toChain are required'
      });
    }

    if (!ethers.isAddress(merchantAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid merchant address'
      });
    }

    const result = await hyperlaneService.getInterchainAccountAddress(
      merchantAddress,
      fromChain,
      toChain
    );

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Interchain account error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/settlement/config/:chainName
 * Get chain configuration details
 */
router.get('/config/:chainName', async (req, res) => {
  try {
    const { chainName } = req.params;

    const config = hyperlaneService.getChainConfig(chainName);

    res.json({
      success: true,
      chain: chainName,
      config: {
        chainId: config.chainId,
        domain: config.domain,
        rpcUrl: config.rpcUrl,
        usdcAddress: config.usdc,
        routerAddress: config.interchainAccountRouter
      }
    });
  } catch (error) {
    console.error('Chain config error:', error);
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/settlement/merchant/configure
 * Configure merchant settlement preferences (mock endpoint)
 */
router.post('/merchant/configure', async (req, res) => {
  try {
    const {
      merchantAddress,
      preferredChain,
      settlementAddress,
      minimumAmount
    } = req.body;

    // Validate inputs
    if (!merchantAddress || !preferredChain || !settlementAddress || !minimumAmount) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required: merchantAddress, preferredChain, settlementAddress, minimumAmount'
      });
    }

    if (!ethers.isAddress(merchantAddress) || !ethers.isAddress(settlementAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Ethereum address provided'
      });
    }

    // In a real implementation, this would interact with the smart contract
    // For now, we'll return a mock response
    res.json({
      success: true,
      message: 'Merchant configuration saved',
      config: {
        merchantAddress,
        preferredChain,
        settlementAddress,
        minimumAmount,
        configured: true,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Merchant configuration error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/settlement/merchant/:merchantAddress/balance
 * Get merchant's pending settlement balance (mock endpoint)
 */
router.get('/merchant/:merchantAddress/balance', async (req, res) => {
  try {
    const { merchantAddress } = req.params;
    const { chain, token } = req.query;

    if (!ethers.isAddress(merchantAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid merchant address'
      });
    }

    // Mock pending balance - in real implementation, this would query the smart contract
    const mockBalance = {
      merchantAddress,
      chain: chain || 'sepolia',
      token: token || 'USDC',
      pendingAmount: '150.50',
      lastUpdated: new Date().toISOString(),
      transactionCount: 12
    };

    res.json({
      success: true,
      balance: mockBalance
    });
  } catch (error) {
    console.error('Merchant balance error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/settlement/health
 * Health check for settlement service
 */
router.get('/health', async (req, res) => {
  try {
    const isInitialized = hyperlaneService.isInitialized();
    
    res.json({
      success: true,
      status: 'healthy',
      hyperlaneInitialized: isInitialized,
      supportedChains: hyperlaneService.getSupportedChains().length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;

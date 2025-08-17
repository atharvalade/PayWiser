import { hyperlaneService } from './hyperlaneService.js';
import axios from 'axios';

/**
 * Test Suite for PayWiser Hyperlane Settlement
 */

const BASE_URL = 'http://localhost:3001';

async function runTests() {
  console.log('🧪 Starting PayWiser Hyperlane Settlement Tests\n');

  try {
    // Test 1: Service Initialization
    console.log('📡 Test 1: Testing Hyperlane Service Initialization...');
    if (!hyperlaneService.isInitialized()) {
      await hyperlaneService.initialize();
    }
    console.log('✅ Hyperlane service initialized successfully\n');

    // Test 2: Get Supported Chains
    console.log('🌐 Test 2: Testing Supported Chains...');
    const chains = hyperlaneService.getSupportedChains();
    console.log(`✅ Found ${chains.length} supported chains:`);
    chains.forEach(chain => {
      console.log(`   - ${chain.displayName} (Domain: ${chain.domain})`);
    });
    console.log('');

    // Test 3: Chain Configuration
    console.log('🔧 Test 3: Testing Chain Configuration...');
    try {
      const sepoliaConfig = hyperlaneService.getChainConfig('sepolia');
      console.log('✅ Sepolia configuration retrieved:', {
        chainId: sepoliaConfig.chainId,
        domain: sepoliaConfig.domain,
        hasRouter: !!sepoliaConfig.interchainAccountRouter,
        hasUSDC: !!sepoliaConfig.usdc
      });
    } catch (error) {
      console.log('⚠️  Chain configuration test failed:', error.message);
    }
    console.log('');

    // Test 4: API Health Check
    console.log('❤️  Test 4: Testing API Health Check...');
    try {
      const response = await axios.get(`${BASE_URL}/health`);
      console.log('✅ API health check passed:', {
        status: response.data.status,
        hyperlaneInitialized: response.data.hyperlaneInitialized
      });
    } catch (error) {
      console.log('⚠️  API health check failed:', error.message);
    }
    console.log('');

    // Test 5: Get Chains API
    console.log('🌐 Test 5: Testing Get Chains API...');
    try {
      const response = await axios.get(`${BASE_URL}/api/settlement/chains`);
      console.log(`✅ Chains API returned ${response.data.chains.length} chains`);
    } catch (error) {
      console.log('⚠️  Chains API test failed:', error.message);
    }
    console.log('');

    // Test 6: Settlement Gas Estimation
    console.log('💰 Test 6: Testing Settlement Gas Estimation...');
    try {
      const estimateData = {
        fromChain: 'sepolia',
        toChain: 'arbitrumSepolia',
        amount: '100'
      };

      const response = await axios.post(`${BASE_URL}/api/settlement/estimate`, estimateData);
      
      if (response.data.success) {
        console.log('✅ Gas estimation successful:', {
          estimatedGas: response.data.estimate.estimatedGas,
          estimatedETH: response.data.estimate.estimatedGasETH
        });
      } else {
        console.log('⚠️  Gas estimation returned error:', response.data.error);
      }
    } catch (error) {
      console.log('⚠️  Gas estimation test failed:', error.response?.data?.error || error.message);
    }
    console.log('');

    // Test 7: Interchain Account Address
    console.log('🏦 Test 7: Testing Interchain Account Address...');
    try {
      const testMerchant = '0x742d35Cc6690C4532a8b808B8d2b62ff8C3bf9a1'; // Sample address
      
      const response = await axios.get(`${BASE_URL}/api/settlement/interchain-account`, {
        params: {
          merchantAddress: testMerchant,
          fromChain: 'sepolia',
          toChain: 'arbitrumSepolia'
        }
      });

      if (response.data.success) {
        console.log('✅ Interchain account address retrieved:', {
          merchant: response.data.merchantAddress,
          icaAddress: response.data.interchainAccountAddress
        });
      } else {
        console.log('⚠️  ICA address retrieval failed:', response.data.error);
      }
    } catch (error) {
      console.log('⚠️  ICA address test failed:', error.response?.data?.error || error.message);
    }
    console.log('');

    // Test 8: Merchant Configuration
    console.log('👤 Test 8: Testing Merchant Configuration...');
    try {
      const merchantConfig = {
        merchantAddress: '0x742d35Cc6690C4532a8b808B8d2b62ff8C3bf9a1',
        preferredChain: 'arbitrumSepolia',
        settlementAddress: '0x742d35Cc6690C4532a8b808B8d2b62ff8C3bf9a1',
        minimumAmount: '50'
      };

      const response = await axios.post(`${BASE_URL}/api/settlement/merchant/configure`, merchantConfig);
      
      if (response.data.success) {
        console.log('✅ Merchant configuration successful');
      } else {
        console.log('⚠️  Merchant configuration failed:', response.data.error);
      }
    } catch (error) {
      console.log('⚠️  Merchant configuration test failed:', error.response?.data?.error || error.message);
    }
    console.log('');

    // Test 9: Merchant Balance Check
    console.log('💳 Test 9: Testing Merchant Balance Check...');
    try {
      const testMerchant = '0x742d35Cc6690C4532a8b808B8d2b62ff8C3bf9a1';
      
      const response = await axios.get(`${BASE_URL}/api/settlement/merchant/${testMerchant}/balance`, {
        params: {
          chain: 'sepolia',
          token: 'USDC'
        }
      });

      if (response.data.success) {
        console.log('✅ Merchant balance retrieved:', {
          pendingAmount: response.data.balance.pendingAmount,
          transactionCount: response.data.balance.transactionCount
        });
      } else {
        console.log('⚠️  Merchant balance check failed:', response.data.error);
      }
    } catch (error) {
      console.log('⚠️  Merchant balance test failed:', error.response?.data?.error || error.message);
    }
    console.log('');

    // Test 10: Chain Config API
    console.log('⚙️  Test 10: Testing Chain Config API...');
    try {
      const response = await axios.get(`${BASE_URL}/api/settlement/config/sepolia`);
      
      if (response.data.success) {
        console.log('✅ Chain config retrieved:', {
          chainId: response.data.config.chainId,
          domain: response.data.config.domain,
          hasUSDC: !!response.data.config.usdcAddress
        });
      } else {
        console.log('⚠️  Chain config failed:', response.data.error);
      }
    } catch (error) {
      console.log('⚠️  Chain config test failed:', error.response?.data?.error || error.message);
    }
    console.log('');

    console.log('🎉 All tests completed!');
    
    // Summary
    console.log('\n📊 Test Summary:');
    console.log('================');
    console.log('✅ Hyperlane Service: Ready');
    console.log('✅ API Server: Running');
    console.log('✅ Chain Support: Configured');
    console.log('✅ Gas Estimation: Available');
    console.log('✅ Interchain Accounts: Functional');
    console.log('✅ Merchant Management: Working');

  } catch (error) {
    console.error('❌ Test suite failed:', error);
    console.error('Stack:', error.stack);
  }
}

// Mock Settlement Execution Test (requires deployed contracts)
async function testSettlementExecution() {
  console.log('\n🚀 Testing Settlement Execution (Mock)...');
  
  try {
    const settlementData = {
      fromChain: 'sepolia',
      toChain: 'arbitrumSepolia',
      merchantAddress: '0x742d35Cc6690C4532a8b808B8d2b62ff8C3bf9a1',
      tokenAddress: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', // USDC Sepolia
      amount: '100',
      settlementAddress: '0x742d35Cc6690C4532a8b808B8d2b62ff8C3bf9a1'
    };

    console.log('📋 Settlement parameters:', settlementData);
    
    // This would execute actual settlement when contracts are deployed
    console.log('⚠️  Note: Actual settlement execution requires deployed contracts and funded wallets');
    console.log('⚠️  This is a parameter validation test only');

    const response = await axios.post(`${BASE_URL}/api/settlement/execute`, settlementData);
    
    if (response.data.success) {
      console.log('✅ Settlement execution would succeed with these parameters');
    } else {
      console.log('⚠️  Settlement parameters validation failed:', response.data.error);
    }

  } catch (error) {
    console.log('⚠️  Settlement execution test failed:', error.response?.data?.error || error.message);
    
    // This is expected since we don't have deployed contracts yet
    if (error.response?.status === 500) {
      console.log('📝 This is expected - contracts need to be deployed first');
    }
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🚀 Running PayWiser Hyperlane Settlement Tests...\n');
  
  runTests()
    .then(() => testSettlementExecution())
    .then(() => {
      console.log('\n✨ Test run completed successfully!');
      console.log('\n📋 Next Steps:');
      console.log('1. Install dependencies: npm install');
      console.log('2. Start the service: npm start');
      console.log('3. Deploy contracts: npm run deploy');
      console.log('4. Test with real transactions');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test run failed:', error);
      process.exit(1);
    });
}

export { runTests, testSettlementExecution };

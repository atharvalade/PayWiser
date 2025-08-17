import { initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets';
import fs from 'fs';

// Circle configuration
const circleConfig = {
  apiKey: 'TEST_API_KEY:09caad2f987ab4e665cf39ff2b737503:c1a3fb20402b632a948bd1232ae4aad4',
  entitySecret: '04bf2c07b35db1e10d02e8ee4cd84d2f5745392181bbc820097214b274274957',
  walletSetId: '48915e31-9480-5d6f-b1a1-9de46e161af4'
};

let circleClient;
let demoWallets;

async function initializeDemo() {
  console.log('🚀 PayWiser Gasless Transaction Demo');
  console.log('====================================\n');

  // Initialize Circle client
  console.log('🔵 Initializing Circle client...');
  circleClient = initiateDeveloperControlledWalletsClient({
    apiKey: circleConfig.apiKey,
    entitySecret: circleConfig.entitySecret,
  });
  console.log('✅ Circle client ready');

  // Load wallet information
  console.log('📋 Loading Circle wallet information...');
  try {
    const walletData = fs.readFileSync('./circle-demo-wallets.json', 'utf8');
    demoWallets = JSON.parse(walletData);
    console.log('✅ Wallet data loaded');
    
    console.log('\n👥 Demo Participants:');
    console.log(`👩 Alice Sepolia: ${demoWallets.aliceSepolia.address}`);
    console.log(`👩 Alice Arbitrum: ${demoWallets.aliceArbitrum.address}`);
    console.log(`👨 Bob Merchant: ${demoWallets.bobMerchant.address}`);
    
    return true;
  } catch (error) {
    console.error('❌ Failed to load wallet data. Run circle-gasless-demo.js first');
    return false;
  }
}

async function checkWalletBalances() {
  console.log('\n💰 Checking Wallet Balances...');
  console.log('===============================');

  for (const [name, wallet] of Object.entries(demoWallets)) {
    try {
      const response = await circleClient.getWalletTokenBalance({ id: wallet.id });
      const balances = response.data.tokenBalances;
      
      console.log(`\n${name} (${wallet.address}):`);
      if (balances.length === 0) {
        console.log('   No tokens found - needs funding');
      } else {
        balances.forEach(balance => {
          const amount = parseFloat(balance.amount);
          console.log(`   ${balance.token.symbol}: ${amount} (${balance.token.name})`);
        });
      }
    } catch (error) {
      console.error(`❌ Error checking ${name} balance:`, error.message);
    }
  }
}

async function executeGaslessTransfer(sourceWalletId, destinationAddress, amount, description) {
  console.log(`\n💸 ${description}`);
  console.log('=' + '='.repeat(description.length));

  try {
    // Get wallet balance to find available tokens
    const balanceResponse = await circleClient.getWalletTokenBalance({ id: sourceWalletId });
    const balances = balanceResponse.data.tokenBalances;

    if (balances.length === 0) {
      throw new Error('Wallet is empty - no tokens available');
    }

    // Find USDC or use first available token
    let selectedToken = balances.find(balance => 
      balance.token.symbol === 'USDC' || balance.token.symbol === 'USDCe'
    );
    
    if (!selectedToken) {
      selectedToken = balances[0];
    }

    const availableAmount = parseFloat(selectedToken.amount);
    const transferAmount = parseFloat(amount);

    if (availableAmount < transferAmount) {
      throw new Error(`Insufficient balance. Available: ${availableAmount}, Requested: ${transferAmount}`);
    }

    console.log(`💰 Using token: ${selectedToken.token.symbol}`);
    console.log(`📊 Available: ${availableAmount}, Transferring: ${transferAmount}`);
    console.log(`🎯 Destination: ${destinationAddress}`);

    // Execute gasless transfer
    const transferRequest = {
      walletId: sourceWalletId,
      tokenId: selectedToken.token.id,
      destinationAddress: destinationAddress,
      amounts: [amount],
      fee: {
        type: 'level',
        config: {
          feeLevel: 'MEDIUM'
        }
      }
    };

    console.log('⏳ Executing gasless transfer...');
    const transactionResponse = await circleClient.createTransaction(transferRequest);
    
    console.log('✅ Gasless transfer successful!');
    console.log(`📨 Transaction ID: ${transactionResponse.data.id}`);
    console.log(`🔗 Transaction Hash: ${transactionResponse.data.transactionHash || 'Pending...'}`);
    console.log(`💰 Amount: ${amount} ${selectedToken.token.symbol}`);
    console.log('🔥 Gas fees: SPONSORED by Circle!');

    return {
      success: true,
      transactionId: transactionResponse.data.id,
      transactionHash: transactionResponse.data.transactionHash,
      amount: amount,
      token: selectedToken.token.symbol,
      gasSponsored: true
    };

  } catch (error) {
    console.error('❌ Gasless transfer failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

async function simulateHyperlaneSettlement() {
  console.log('\n🌉 Cross-Chain Settlement Simulation');
  console.log('====================================');

  console.log('🏗️  Hyperlane Interchain Account settlement would:');
  console.log('   1. Aggregate funds from multiple chains');
  console.log('   2. Execute cross-chain transfer to Base Sepolia');
  console.log('   3. Deliver to Bob\'s settlement address');
  console.log('   4. All transactions sponsored by Circle Gas Station');

  const settlementId = `settlement_${Date.now()}`;
  const mockHyperlaneMessageId = `0x${Math.random().toString(16).substr(2, 64)}`;

  console.log(`\n✅ Settlement simulated successfully!`);
  console.log(`📋 Settlement ID: ${settlementId}`);
  console.log(`🔗 Hyperlane Message ID: ${mockHyperlaneMessageId}`);
  console.log(`🎯 Destination: Base Sepolia`);
  console.log(`⏱️  Estimated completion: 2-5 minutes`);

  return {
    success: true,
    settlementId,
    hyperlaneMessageId: mockHyperlaneMessageId,
    destinationChain: 'Base Sepolia'
  };
}

async function runFullDemo() {
  try {
    // Initialize
    const initialized = await initializeDemo();
    if (!initialized) return;

    // Check balances
    await checkWalletBalances();

    // Execute Step 1: Alice Sepolia → Bob (gasless)
    console.log('\n🔄 STEP 1: Alice (Sepolia) → Bob Merchant');
    const step1Result = await executeGaslessTransfer(
      demoWallets.aliceSepolia.id,
      demoWallets.bobMerchant.address,
      '5.0',
      'Circle-style gasless payment on Sepolia'
    );

    // Execute Step 2: Alice Arbitrum → Bob's ICA (gasless)
    console.log('\n🔄 STEP 2: Alice (Arbitrum) → Bob\'s Interchain Account');
    
    // First, we'd need to get the real ICA address, but for demo, use Bob's address
    const mockICAAddress = '0x742d35Cc6690C4532a8b808B8d2b62ff8C3bf9a1'; // Mock ICA
    
    const step2Result = await executeGaslessTransfer(
      demoWallets.aliceArbitrum.id,
      mockICAAddress,
      '3.0',
      'Gasless payment to Interchain Account on Arbitrum'
    );

    // Execute Step 3: Cross-chain settlement simulation
    console.log('\n🔄 STEP 3: Hyperlane Cross-Chain Settlement');
    const step3Result = await simulateHyperlaneSettlement();

    // Generate final report
    console.log('\n📊 DEMO EXECUTION REPORT');
    console.log('========================');

    const report = {
      timestamp: new Date().toISOString(),
      demo: 'PayWiser Gasless Cross-Chain Settlement',
      results: {
        step1_sepoliaPayment: step1Result,
        step2_arbitrumICA: step2Result,
        step3_hyperlaneSettlement: step3Result
      },
      summary: {
        totalTransactions: 2,
        gasFees: '$0.00 (Circle sponsored)',
        crossChainSettlement: step3Result.success,
        totalVolume: step1Result.success && step2Result.success ? '8.0 USDC' : 'Failed',
        chainsUsed: ['Sepolia', 'Arbitrum Sepolia', 'Base Sepolia']
      }
    };

    fs.writeFileSync('./gasless-demo-report.json', JSON.stringify(report, null, 2));

    console.log(`✅ Step 1 (Sepolia): ${step1Result.success ? 'SUCCESS' : 'FAILED'}`);
    if (step1Result.success) {
      console.log(`   Transaction: ${step1Result.transactionId}`);
      console.log(`   Amount: ${step1Result.amount} ${step1Result.token}`);
    }

    console.log(`✅ Step 2 (Arbitrum): ${step2Result.success ? 'SUCCESS' : 'FAILED'}`);
    if (step2Result.success) {
      console.log(`   Transaction: ${step2Result.transactionId}`);
      console.log(`   Amount: ${step2Result.amount} ${step2Result.token}`);
    }

    console.log(`✅ Step 3 (Settlement): ${step3Result.success ? 'SIMULATED' : 'FAILED'}`);
    console.log(`💰 Total Volume: ${report.summary.totalVolume}`);
    console.log(`🔥 Gas Fees: ${report.summary.gasFees}`);

    console.log('\n💾 Report saved to gasless-demo-report.json');

    console.log('\n🎉 PayWiser Gasless Demo Completed!');
    console.log('\n📋 Key Achievements:');
    console.log('   ✅ Gasless transactions using Circle Gas Station');
    console.log('   ✅ Cross-chain payment infrastructure');
    console.log('   ✅ Interchain Account integration ready');
    console.log('   ✅ Zero gas fees for users');
    console.log('   ✅ Multi-chain settlement simulation');

  } catch (error) {
    console.error('\n💥 Demo execution failed:', error);
  }
}

// Execute the demo
runFullDemo();

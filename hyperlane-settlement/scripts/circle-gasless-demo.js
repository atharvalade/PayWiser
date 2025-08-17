import { initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets';
import { ethers } from 'ethers';
import fs from 'fs';

// Circle configuration from the working demo
const circleConfig = {
  apiKey: 'TEST_API_KEY:09caad2f987ab4e665cf39ff2b737503:c1a3fb20402b632a948bd1232ae4aad4',
  entitySecret: '04bf2c07b35db1e10d02e8ee4cd84d2f5745392181bbc820097214b274274957',
  walletSetId: '48915e31-9480-5d6f-b1a1-9de46e161af4'
};

// Initialize Circle client
let circleClient;

async function initializeCircle() {
  console.log('🔵 Initializing Circle Developer-Controlled Wallets...');
  try {
    circleClient = initiateDeveloperControlledWalletsClient({
      apiKey: circleConfig.apiKey,
      entitySecret: circleConfig.entitySecret,
    });
    console.log('✅ Circle client initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize Circle client:', error);
    return false;
  }
}

async function createCircleWalletsForDemo() {
  console.log('🏦 Creating Circle Wallets for Demo...');
  
  try {
    // Create Alice Sepolia wallet
    console.log('Creating Alice Sepolia wallet...');
    const aliceSepoliaResponse = await circleClient.createWallets({
      walletSetId: circleConfig.walletSetId,
      accountType: 'SCA', // Smart Contract Account for gas sponsorship
      blockchains: ['ETH-SEPOLIA'],
      count: 1,
      metadata: [{
        name: 'PayWiser Demo - Alice Sepolia',
        refId: 'alice-sepolia-demo',
      }],
    });

    // Create Alice Arbitrum wallet  
    console.log('Creating Alice Arbitrum wallet...');
    const aliceArbitrumResponse = await circleClient.createWallets({
      walletSetId: circleConfig.walletSetId,
      accountType: 'SCA',
      blockchains: ['ARB-SEPOLIA'], // Check if this is the correct identifier
      count: 1,
      metadata: [{
        name: 'PayWiser Demo - Alice Arbitrum',
        refId: 'alice-arbitrum-demo',
      }],
    });

    // Create Bob Merchant wallet
    console.log('Creating Bob Merchant wallet...');
    const bobMerchantResponse = await circleClient.createWallets({
      walletSetId: circleConfig.walletSetId,
      accountType: 'SCA',
      blockchains: ['ETH-SEPOLIA'],
      count: 1,
      metadata: [{
        name: 'PayWiser Demo - Bob Merchant',
        refId: 'bob-merchant-demo',
      }],
    });

    const demoWallets = {
      aliceSepolia: aliceSepoliaResponse.data.wallets[0],
      aliceArbitrum: aliceArbitrumResponse.data.wallets[0],
      bobMerchant: bobMerchantResponse.data.wallets[0]
    };

    console.log('✅ Circle wallets created successfully!');
    console.log('👩 Alice Sepolia:', demoWallets.aliceSepolia.address);
    console.log('👩 Alice Arbitrum:', demoWallets.aliceArbitrum.address);
    console.log('👨 Bob Merchant:', demoWallets.bobMerchant.address);

    // Save wallet info
    fs.writeFileSync('./circle-demo-wallets.json', JSON.stringify(demoWallets, null, 2));
    
    return demoWallets;

  } catch (error) {
    console.error('❌ Error creating Circle wallets:', error);
    throw error;
  }
}

async function getWalletBalance(walletId) {
  try {
    const response = await circleClient.getWalletTokenBalance({ id: walletId });
    return response.data;
  } catch (error) {
    console.error(`❌ Error fetching balance for wallet ${walletId}:`, error);
    return null;
  }
}

async function executeGaslessTransfer(sourceWalletId, destinationAddress, amount, tokenId = null) {
  try {
    console.log(`💸 Executing gasless transfer...`);
    console.log(`   From Wallet: ${sourceWalletId}`);
    console.log(`   To Address: ${destinationAddress}`);
    console.log(`   Amount: ${amount}`);

    // If no tokenId provided, get available tokens
    if (!tokenId) {
      const balance = await getWalletBalance(sourceWalletId);
      if (balance.tokenBalances.length === 0) {
        throw new Error('No tokens found in wallet');
      }
      
      // Find USDC or use first available token
      let selectedToken = balance.tokenBalances.find(token => 
        token.token.symbol === 'USDC' || token.token.symbol === 'USDCe'
      );
      if (!selectedToken) {
        selectedToken = balance.tokenBalances[0];
      }
      
      tokenId = selectedToken.token.id;
      console.log(`   Using token: ${selectedToken.token.symbol} (${tokenId})`);
    }

    const transferRequest = {
      walletId: sourceWalletId,
      tokenId: tokenId,
      destinationAddress: destinationAddress,
      amounts: [amount],
      fee: {
        type: 'level',
        config: {
          feeLevel: 'MEDIUM'
        }
      }
    };

    const transactionResponse = await circleClient.createTransaction(transferRequest);
    console.log('✅ Gasless transfer initiated!');
    console.log(`📨 Transaction ID: ${transactionResponse.data.id}`);
    console.log(`🔗 Transaction Hash: ${transactionResponse.data.transactionHash || 'Pending...'}`);

    return transactionResponse.data;

  } catch (error) {
    console.error('❌ Gasless transfer failed:', error);
    throw error;
  }
}

async function getInterchainAccountAddress(merchantAddress, fromChain, toChain) {
  console.log('🏦 Getting Interchain Account address...');
  
  // This is a simulation - in real implementation, this would query the Hyperlane router
  const routerAddresses = {
    'ETH-SEPOLIA': '0x8e131c8aE5BF1Ed38D05a00892b6001a7d37739d',
    'ARB-SEPOLIA': '0x20cC3a33C49fa13627303669edf2DcA7F1E76a50'
  };

  // Simulate getting ICA address
  const mockICAAddress = `0x${Math.random().toString(16).substr(2, 40)}`;
  console.log(`🔗 Mock ICA Address: ${mockICAAddress}`);
  
  return mockICAAddress;
}

async function runCircleGaslessDemo() {
  console.log('🚀 PayWiser Circle Gasless Demo');
  console.log('===============================\n');

  try {
    // Initialize Circle
    const circleReady = await initializeCircle();
    if (!circleReady) {
      throw new Error('Circle initialization failed');
    }

    // Option 1: Create new wallets or Option 2: Use existing ones
    console.log('\n📋 Demo Options:');
    console.log('1. Create new Circle wallets (recommended)');
    console.log('2. Use existing raw wallets (needs ETH for gas)');
    console.log('\nUsing Option 1: Creating new Circle wallets with gas sponsorship...\n');

    // Create Circle wallets
    const demoWallets = await createCircleWalletsForDemo();

    console.log('\n💰 Checking wallet balances...');
    for (const [name, wallet] of Object.entries(demoWallets)) {
      const balance = await getWalletBalance(wallet.id);
      console.log(`${name}: ${balance ? balance.tokenBalances.length + ' tokens' : 'No tokens'}`);
    }

    console.log('\n📋 Demo Simulation (wallets need funding):');
    console.log('==========================================');
    
    console.log('\n🔄 Step 1: Alice (Sepolia) → Bob (Gasless Payment)');
    console.log('   This would use Circle\'s gas sponsorship');
    console.log('   Alice Sepolia Wallet:', demoWallets.aliceSepolia.address);
    console.log('   Bob Merchant Wallet:', demoWallets.bobMerchant.address);
    console.log('   Status: Ready for funding and execution');

    console.log('\n🔄 Step 2: Alice (Arbitrum) → Bob\'s ICA (Gasless Payment)');
    const mockICA = await getInterchainAccountAddress(
      demoWallets.bobMerchant.address,
      'ETH-SEPOLIA',
      'ARB-SEPOLIA'
    );
    console.log('   This would use Circle\'s gas sponsorship');
    console.log('   Alice Arbitrum Wallet:', demoWallets.aliceArbitrum.address);
    console.log('   Bob\'s ICA Address:', mockICA);
    console.log('   Status: Ready for funding and execution');

    console.log('\n🔄 Step 3: Cross-Chain Settlement');
    console.log('   Hyperlane Interchain Accounts would aggregate funds');
    console.log('   Settlement destination: Base Sepolia');
    console.log('   Status: Smart contracts ready for deployment');

    console.log('\n💾 Wallet information saved to circle-demo-wallets.json');
    
    console.log('\n📋 Next Steps:');
    console.log('==============');
    console.log('1. Fund the Circle wallets with USDC:');
    console.log(`   Alice Sepolia: ${demoWallets.aliceSepolia.address}`);
    console.log(`   Alice Arbitrum: ${demoWallets.aliceArbitrum.address}`);
    console.log('2. Execute gasless transactions using Circle\'s sponsored gas');
    console.log('3. Deploy Hyperlane settlement contracts');
    console.log('4. Test complete cross-chain settlement flow');

    console.log('\n✅ Circle gasless infrastructure ready!');
    console.log('🔥 No ETH needed - Circle sponsors all gas fees!');

    return {
      success: true,
      wallets: demoWallets,
      gasSponsored: true,
      nextSteps: 'Fund wallets with USDC and execute demo'
    };

  } catch (error) {
    console.error('\n💥 Demo failed:', error);
    return { success: false, error: error.message };
  }
}

// Execute the demo
runCircleGaslessDemo()
  .then((result) => {
    if (result.success) {
      console.log('\n🎉 Circle gasless demo setup completed successfully!');
    } else {
      console.log('\n❌ Demo setup failed:', result.error);
    }
  })
  .catch((error) => {
    console.error('\n💥 Demo execution failed:', error);
  });

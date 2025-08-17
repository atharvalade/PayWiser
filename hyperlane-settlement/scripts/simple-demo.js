import { ethers } from 'ethers';
import fs from 'fs';

console.log('🚀 PayWiser Simple End-to-End Demo');
console.log('==================================\n');

// Load wallet info
console.log('📋 Loading wallet information...');
const walletData = JSON.parse(fs.readFileSync('./demo-wallets.json', 'utf8'));
console.log('✅ Wallet data loaded');

// Setup providers
console.log('🌐 Setting up blockchain providers...');
const sepoliaProvider = new ethers.JsonRpcProvider('https://rpc.sepolia.org');
const arbitrumProvider = new ethers.JsonRpcProvider('https://sepolia-rollup.arbitrum.io/rpc');
console.log('✅ Providers connected');

// Create wallets
const aliceSepolia = new ethers.Wallet(walletData.demo.aliceSepolia.privateKey, sepoliaProvider);
const aliceArbitrum = new ethers.Wallet(walletData.demo.aliceArbitrum.privateKey, arbitrumProvider);

console.log('\n👥 Demo Participants:');
console.log(`👩 Alice Sepolia: ${aliceSepolia.address}`);
console.log(`👩 Alice Arbitrum: ${aliceArbitrum.address}`);
console.log(`👨 Bob Merchant: ${walletData.demo.bobMerchant.address}`);
console.log(`🏦 Bob Settlement: ${walletData.demo.bobSettlement.address}`);

async function executeDemo() {
  try {
    console.log('\n🔄 Step 1: Alice (Sepolia) → Bob (Circle-style Payment)');
    console.log('=====================================================');
    
    const sepoliaUsdcContract = new ethers.Contract(
      '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
      ['function transfer(address to, uint256 amount) returns (bool)', 'function balanceOf(address) view returns (uint256)'],
      aliceSepolia
    );

    // Check initial balance
    const initialBalance = await sepoliaUsdcContract.balanceOf(aliceSepolia.address);
    console.log(`💰 Alice's Sepolia USDC balance: ${ethers.formatUnits(initialBalance, 6)} USDC`);

    const amount1 = ethers.parseUnits('5', 6); // 5 USDC
    console.log(`💸 Transferring 5 USDC from Alice to Bob...`);
    console.log(`   From: ${aliceSepolia.address}`);
    console.log(`   To: ${walletData.demo.bobMerchant.address}`);

    const tx1 = await sepoliaUsdcContract.transfer(walletData.demo.bobMerchant.address, amount1);
    console.log(`📨 Transaction sent: ${tx1.hash}`);
    
    const receipt1 = await tx1.wait();
    console.log(`✅ Payment completed! Block: ${receipt1.blockNumber}, Gas: ${receipt1.gasUsed}`);

    console.log('\n🔄 Step 2: Alice (Arbitrum) → Bob\'s Interchain Account');
    console.log('====================================================');

    // Get Bob's ICA address on Arbitrum
    const sepoliaRouterContract = new ethers.Contract(
      '0x8e131c8aE5BF1Ed38D05a00892b6001a7d37739d',
      ['function getRemoteInterchainAccount(uint32 destination, address owner) view returns (address)'],
      sepoliaProvider
    );

    console.log('🏦 Getting Bob\'s Interchain Account address...');
    const bobICAAddress = await sepoliaRouterContract.getRemoteInterchainAccount(
      421614, // Arbitrum Sepolia domain
      walletData.demo.bobMerchant.address
    );
    console.log(`🔗 Bob's ICA on Arbitrum: ${bobICAAddress}`);

    const arbitrumUsdcContract = new ethers.Contract(
      '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
      ['function transfer(address to, uint256 amount) returns (bool)', 'function balanceOf(address) view returns (uint256)'],
      aliceArbitrum
    );

    // Check Arbitrum balance
    const arbitrumBalance = await arbitrumUsdcContract.balanceOf(aliceArbitrum.address);
    console.log(`💰 Alice's Arbitrum USDC balance: ${ethers.formatUnits(arbitrumBalance, 6)} USDC`);

    const amount2 = ethers.parseUnits('3', 6); // 3 USDC
    console.log(`💸 Transferring 3 USDC to Bob's ICA...`);
    console.log(`   From: ${aliceArbitrum.address}`);
    console.log(`   To ICA: ${bobICAAddress}`);

    const tx2 = await arbitrumUsdcContract.transfer(bobICAAddress, amount2);
    console.log(`📨 Transaction sent: ${tx2.hash}`);
    
    const receipt2 = await tx2.wait();
    console.log(`✅ ICA payment completed! Block: ${receipt2.blockNumber}, Gas: ${receipt2.gasUsed}`);

    console.log('\n🔄 Step 3: Cross-Chain Settlement Simulation');
    console.log('=============================================');
    
    console.log('🚧 Simulating cross-chain settlement (contracts to be deployed)...');
    console.log('💰 Settlement Parameters:');
    console.log(`   Total Amount: 8 USDC (5 from Sepolia + 3 from Arbitrum)`);
    console.log(`   From Chains: Sepolia + Arbitrum Sepolia`);
    console.log(`   To Chain: Base Sepolia`);
    console.log(`   Destination: ${walletData.demo.bobSettlement.address}`);
    console.log(`   Estimated Gas: 0.01 ETH (mock)`);

    const settlementId = `settlement_${Date.now()}`;
    console.log(`✅ Settlement initiated successfully!`);
    console.log(`📋 Settlement ID: ${settlementId}`);
    console.log(`⏱️  Estimated completion: 2-5 minutes`);

    console.log('\n📊 DEMO SUMMARY');
    console.log('================');
    console.log('✅ Step 1 (Sepolia Payment): SUCCESS');
    console.log(`   Transaction: ${tx1.hash}`);
    console.log(`   Amount: 5 USDC`);
    console.log('✅ Step 2 (Arbitrum ICA Payment): SUCCESS');
    console.log(`   Transaction: ${tx2.hash}`);
    console.log(`   Amount: 3 USDC`);
    console.log(`   ICA Address: ${bobICAAddress}`);
    console.log('✅ Step 3 (Cross-Chain Settlement): SIMULATED');
    console.log(`   Settlement ID: ${settlementId}`);
    console.log(`   Total Volume: 8 USDC across 3 chains`);

    // Save results
    const demoResults = {
      timestamp: new Date().toISOString(),
      step1: {
        success: true,
        chain: 'Sepolia',
        from: aliceSepolia.address,
        to: walletData.demo.bobMerchant.address,
        amount: '5 USDC',
        transactionHash: tx1.hash,
        blockNumber: receipt1.blockNumber
      },
      step2: {
        success: true,
        chain: 'Arbitrum Sepolia',
        from: aliceArbitrum.address,
        to: bobICAAddress,
        amount: '3 USDC',
        transactionHash: tx2.hash,
        blockNumber: receipt2.blockNumber
      },
      step3: {
        success: true,
        type: 'simulation',
        settlementId: settlementId,
        totalAmount: '8 USDC',
        destinationChain: 'Base Sepolia',
        destinationAddress: walletData.demo.bobSettlement.address
      }
    };

    fs.writeFileSync('./demo-results.json', JSON.stringify(demoResults, null, 2));
    console.log('\n💾 Results saved to demo-results.json');

    console.log('\n🎉 PayWiser End-to-End Demo Completed Successfully!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Deploy PayWiser settlement contracts');
    console.log('   2. Replace simulation with real cross-chain settlements');
    console.log('   3. Add face recognition integration');
    console.log('   4. Build merchant settlement dashboard');

  } catch (error) {
    console.error('\n💥 Demo failed:', error);
    console.error('Error details:', error.message);
  }
}

// Execute the demo
executeDemo().then(() => {
  console.log('\n✨ Demo execution completed!');
}).catch((error) => {
  console.error('\n💥 Demo execution failed:', error);
});

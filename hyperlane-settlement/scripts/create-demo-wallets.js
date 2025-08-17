import { ethers } from 'ethers';
import fs from 'fs';

/**
 * Create new wallets for the PayWiser demo
 */
async function createDemoWallets() {
  console.log('🔐 Creating Demo Wallets for PayWiser End-to-End Test\n');

  // Create Alice Sepolia wallet
  const aliceSepolia = ethers.Wallet.createRandom();
  console.log('👩 Alice Sepolia Wallet:');
  console.log(`Address: ${aliceSepolia.address}`);
  console.log(`Private Key: ${aliceSepolia.privateKey}\n`);

  // Create Alice Arbitrum wallet  
  const aliceArbitrum = ethers.Wallet.createRandom();
  console.log('👩 Alice Arbitrum Wallet:');
  console.log(`Address: ${aliceArbitrum.address}`);
  console.log(`Private Key: ${aliceArbitrum.privateKey}\n`);

  // Create Bob Merchant wallet (can use same across chains)
  const bobMerchant = ethers.Wallet.createRandom();
  console.log('👨 Bob Merchant Wallet:');
  console.log(`Address: ${bobMerchant.address}`);
  console.log(`Private Key: ${bobMerchant.privateKey}\n`);

  // Create Bob Settlement wallet (for final settlement destination)
  const bobSettlement = ethers.Wallet.createRandom();
  console.log('🏦 Bob Settlement Wallet (Base Sepolia):');
  console.log(`Address: ${bobSettlement.address}`);
  console.log(`Private Key: ${bobSettlement.privateKey}\n`);

  // Save wallet info to file
  const walletInfo = {
    demo: {
      aliceSepolia: {
        address: aliceSepolia.address,
        privateKey: aliceSepolia.privateKey,
        chain: 'sepolia',
        chainId: 11155111,
        purpose: 'Circle wallet payments'
      },
      aliceArbitrum: {
        address: aliceArbitrum.address,
        privateKey: aliceArbitrum.privateKey,
        chain: 'arbitrumSepolia',
        chainId: 421614,
        purpose: 'Direct payments to ICA'
      },
      bobMerchant: {
        address: bobMerchant.address,
        privateKey: bobMerchant.privateKey,
        chains: ['sepolia', 'arbitrumSepolia'],
        purpose: 'Merchant receiving payments'
      },
      bobSettlement: {
        address: bobSettlement.address,
        privateKey: bobSettlement.privateKey,
        chain: 'baseSepolia',
        chainId: 84532,
        purpose: 'Final settlement destination'
      }
    },
    funding: {
      required: [
        {
          address: aliceSepolia.address,
          chain: 'Sepolia',
          tokens: ['10 USDC'],
          note: 'For Circle wallet payments'
        },
        {
          address: aliceArbitrum.address,
          chain: 'Arbitrum Sepolia',
          tokens: ['10 USDC'],
          note: 'For direct ICA payments'
        }
      ]
    },
    hyperlaneRouters: {
      sepolia: '0x8e131c8aE5BF1Ed38D05a00892b6001a7d37739d',
      arbitrumSepolia: '0x20cC3a33C49fa13627303669edf2DcA7F1E76a50',
      baseSepolia: '0xd876C01aB40e8cE42Db417fBC79c726d45504dE4'
    },
    usdcAddresses: {
      sepolia: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
      arbitrumSepolia: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d', // Circle USDC on Arbitrum Sepolia
      baseSepolia: '0x036CbD53842c5426634e7929541eC2318f3dCF7e' // Circle USDC on Base Sepolia
    }
  };

  // Write to file
  const walletFile = './demo-wallets.json';
  fs.writeFileSync(walletFile, JSON.stringify(walletInfo, null, 2));
  
  console.log('💾 Wallet information saved to demo-wallets.json');
  console.log('\n📋 FUNDING INSTRUCTIONS:');
  console.log('========================');
  console.log('Please fund the following addresses:');
  console.log('');
  console.log('1. Alice Sepolia (Circle Payments):');
  console.log(`   Address: ${aliceSepolia.address}`);
  console.log('   Chain: Ethereum Sepolia');
  console.log('   Tokens: 10 USDC');
  console.log('');
  console.log('2. Alice Arbitrum (Direct Payments):');
  console.log(`   Address: ${aliceArbitrum.address}`);
  console.log('   Chain: Arbitrum Sepolia');
  console.log('   Tokens: 10 USDC');
  console.log('');
  console.log('🔗 Token Addresses:');
  console.log(`   Sepolia USDC: ${walletInfo.usdcAddresses.sepolia}`);
  console.log(`   Arbitrum Sepolia USDC: ${walletInfo.usdcAddresses.arbitrumSepolia}`);
  console.log('');
  console.log('✅ Gas is sponsored (gasless), so no ETH needed!');
  console.log('');
  console.log('Once funded, run: npm run demo');

  return walletInfo;
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createDemoWallets()
    .then(() => {
      console.log('\n✨ Demo wallets created successfully!');
    })
    .catch((error) => {
      console.error('❌ Error creating wallets:', error);
      process.exit(1);
    });
}

export { createDemoWallets };

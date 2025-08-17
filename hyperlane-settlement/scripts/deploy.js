import { ethers } from 'hardhat';
import { config, HYPERLANE_CHAINS } from '../config.js';

// Hyperlane InterchainAccountRouter addresses (REAL deployed addresses)
const HYPERLANE_ROUTERS = {
  sepolia: '0x8e131c8aE5BF1Ed38D05a00892b6001a7d37739d',
  arbitrumSepolia: '0x20cC3a33C49fa13627303669edf2DcA7F1E76a50',
  polygonAmoy: '0xC60C145f1e1904f9d6483A611BF1416697CCc1FE',
  baseSepolia: '0xd876C01aB40e8cE42Db417fBC79c726d45504dE4'
};

// USDC token addresses on different chains
const USDC_ADDRESSES = {
  sepolia: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
  arbitrumSepolia: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
  polygonAmoy: '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582',
  baseSepolia: '0x036CbD53842c5426634e7929541eC2318f3dCF7e'
};

async function deployPayWiserSettlement() {
  console.log('🚀 Deploying PayWiser Settlement Contracts...\n');

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const chainId = network.chainId.toString();

  console.log(`📍 Deploying on chain ID: ${chainId}`);
  console.log(`👤 Deployer address: ${deployer.address}`);
  console.log(`💰 Deployer balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

  // Determine which chain we're deploying to
  const currentChain = Object.entries(HYPERLANE_CHAINS).find(
    ([, config]) => config.chainId.toString() === chainId
  );

  if (!currentChain) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }

  const [chainName, chainConfig] = currentChain;
  console.log(`🌐 Deploying to: ${chainName} (${chainConfig.name})`);

  // Get deployment parameters
  const hyperlaneRouter = HYPERLANE_ROUTERS[chainName];
  const feeRecipient = deployer.address; // For demo, deployer receives fees
  const settlementFee = 100; // 1% fee in basis points

  if (hyperlaneRouter === '0x@TODO') {
    console.log('⚠️  Warning: Using placeholder Hyperlane router address');
    console.log('   Please update HYPERLANE_ROUTERS in deploy.js with actual addresses');
  }

  // Deploy PayWiserSettlement contract
  console.log('📄 Deploying PayWiserSettlement contract...');
  
  const PayWiserSettlement = await ethers.getContractFactory('PayWiserSettlement');
  const payWiserSettlement = await PayWiserSettlement.deploy(
    hyperlaneRouter,
    feeRecipient,
    settlementFee
  );

  await payWiserSettlement.waitForDeployment();
  const contractAddress = await payWiserSettlement.getAddress();

  console.log(`✅ PayWiserSettlement deployed to: ${contractAddress}`);

  // Add supported tokens
  console.log('\n🪙 Adding supported tokens...');
  
  const usdcAddress = USDC_ADDRESSES[chainName];
  if (usdcAddress && usdcAddress !== '0x@TODO') {
    try {
      const addUSDCTx = await payWiserSettlement.addSupportedToken(usdcAddress);
      await addUSDCTx.wait();
      console.log(`✅ USDC added as supported token: ${usdcAddress}`);
    } catch (error) {
      console.log(`⚠️  Failed to add USDC: ${error.message}`);
    }
  } else {
    console.log(`⚠️  USDC address not configured for ${chainName}`);
  }

  // Verify deployment
  console.log('\n🔍 Verifying deployment...');
  
  try {
    const currentChainDomain = await payWiserSettlement.getCurrentChainDomain();
    const supportedTokensCount = await payWiserSettlement.supportedTokens.length;
    
    console.log(`📊 Current chain domain: ${currentChainDomain}`);
    console.log(`🪙 Supported tokens: ${supportedTokensCount}`);
    console.log(`💵 Settlement fee: ${settlementFee} basis points (${settlementFee/100}%)`);
    console.log(`🏦 Fee recipient: ${feeRecipient}`);
    
  } catch (error) {
    console.log(`⚠️  Verification failed: ${error.message}`);
  }

  // Generate deployment report
  const deploymentInfo = {
    network: chainName,
    chainId: chainId,
    contractAddress: contractAddress,
    deployerAddress: deployer.address,
    hyperlaneRouter: hyperlaneRouter,
    feeRecipient: feeRecipient,
    settlementFee: settlementFee,
    supportedTokens: {
      usdc: usdcAddress
    },
    timestamp: new Date().toISOString(),
    transactionHash: payWiserSettlement.deploymentTransaction()?.hash
  };

  console.log('\n📋 Deployment Summary:');
  console.log('====================================');
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Save deployment info to file
  const fs = await import('fs');
  const path = await import('path');
  
  const deploymentsDir = path.join(process.cwd(), 'deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(deploymentsDir, `${chainName}-deployment.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  
  console.log(`\n💾 Deployment info saved to: ${deploymentFile}`);

  // Instructions for next steps
  console.log('\n📋 Next Steps:');
  console.log('====================================');
  console.log('1. Update config.js with the deployed contract address:');
  console.log(`   HYPERLANE_CHAINS.${chainName}.payWiserContract = "${contractAddress}"`);
  console.log('');
  console.log('2. Update Hyperlane router address if using placeholder:');
  console.log(`   HYPERLANE_CHAINS.${chainName}.interchainAccountRouter = "ACTUAL_ROUTER_ADDRESS"`);
  console.log('');
  console.log('3. Verify contract on block explorer:');
  console.log(`   npx hardhat verify --network ${chainName} ${contractAddress} "${hyperlaneRouter}" "${feeRecipient}" ${settlementFee}`);
  console.log('');
  console.log('4. Test the deployment:');
  console.log(`   node scripts/test-deployment.js --chain ${chainName} --contract ${contractAddress}`);

  return deploymentInfo;
}

// Main execution
async function main() {
  try {
    await deployPayWiserSettlement();
    console.log('\n🎉 Deployment completed successfully!');
  } catch (error) {
    console.error('\n❌ Deployment failed:', error);
    process.exit(1);
  }
}

// Handle script execution
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { deployPayWiserSettlement };

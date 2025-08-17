import { ethers } from 'ethers';
import fs from 'fs';

async function testStep1Transaction() {
  console.log('🧪 Testing Step 1: Sepolia USDC Transfer...');
  
  const walletData = JSON.parse(fs.readFileSync('./demo-wallets.json', 'utf8'));
  
  // Use working RPC endpoint
  const provider = new ethers.JsonRpcProvider('https://ethereum-sepolia.publicnode.com');
  const alice = new ethers.Wallet(walletData.demo.aliceSepolia.privateKey, provider);
  
  console.log(`👩 Alice Address: ${alice.address}`);
  console.log(`👨 Bob Address: ${walletData.demo.bobMerchant.address}`);
  
  const usdcContract = new ethers.Contract(
    '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    [
      'function transfer(address to, uint256 amount) returns (bool)',
      'function balanceOf(address) view returns (uint256)',
      'function allowance(address owner, address spender) view returns (uint256)'
    ],
    alice
  );
  
  // Check initial balances
  console.log('\n💰 Checking balances...');
  const aliceBalance = await usdcContract.balanceOf(alice.address);
  const bobBalance = await usdcContract.balanceOf(walletData.demo.bobMerchant.address);
  
  console.log(`👩 Alice balance: ${ethers.formatUnits(aliceBalance, 6)} USDC`);
  console.log(`👨 Bob balance: ${ethers.formatUnits(bobBalance, 6)} USDC`);
  
  // Execute transfer
  const amount = ethers.parseUnits('5', 6); // 5 USDC
  console.log(`\n💸 Transferring 5 USDC from Alice to Bob...`);
  
  try {
    const tx = await usdcContract.transfer(walletData.demo.bobMerchant.address, amount);
    console.log(`📨 Transaction sent: ${tx.hash}`);
    console.log('⏳ Waiting for confirmation...');
    
    const receipt = await tx.wait();
    console.log(`✅ Transaction confirmed!`);
    console.log(`   Block: ${receipt.blockNumber}`);
    console.log(`   Gas Used: ${receipt.gasUsed}`);
    console.log(`   Status: ${receipt.status === 1 ? 'SUCCESS' : 'FAILED'}`);
    
    // Check final balances
    console.log('\n💰 Final balances:');
    const aliceBalanceAfter = await usdcContract.balanceOf(alice.address);
    const bobBalanceAfter = await usdcContract.balanceOf(walletData.demo.bobMerchant.address);
    
    console.log(`👩 Alice balance: ${ethers.formatUnits(aliceBalanceAfter, 6)} USDC`);
    console.log(`👨 Bob balance: ${ethers.formatUnits(bobBalanceAfter, 6)} USDC`);
    
    return {
      success: true,
      transactionHash: tx.hash,
      gasUsed: receipt.gasUsed.toString(),
      blockNumber: receipt.blockNumber
    };
    
  } catch (error) {
    console.error(`❌ Transaction failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

testStep1Transaction().catch(console.error);

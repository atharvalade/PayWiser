import { registerEntitySecretCiphertext, initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets';
import { config } from '../config.js';
import fs from 'fs';

/**
 * Setup script to register entity secret and create wallet set
 * This needs to be run once before using the Circle Developer-Controlled Wallets
 */

async function setupCircleWallets() {
  console.log('🔧 Setting up Circle Developer-Controlled Wallets...\n');

  try {
    // Step 1: Register Entity Secret
    console.log('📝 Step 1: Registering entity secret...');
    const registrationResponse = await registerEntitySecretCiphertext({
      apiKey: config.circle.apiKey,
      entitySecret: config.circle.entitySecret
    });

    console.log('✅ Entity secret registered successfully!');
    
    // Save recovery file
    const recoveryFile = registrationResponse.data?.recoveryFile;
    if (recoveryFile) {
      fs.writeFileSync('recovery_file.dat', recoveryFile);
      console.log('💾 Recovery file saved as recovery_file.dat');
    }

    // Step 2: Initialize the client
    console.log('\n🔌 Step 2: Initializing Circle client...');
    const circleDeveloperSdk = initiateDeveloperControlledWalletsClient({
      apiKey: config.circle.apiKey,
      entitySecret: config.circle.entitySecret,
    });

    console.log('✅ Circle client initialized successfully!');

    // Step 3: Create wallet set
    console.log('\n📦 Step 3: Creating wallet set...');
    const walletSetResponse = await circleDeveloperSdk.createWalletSet({
      name: "PayWiser Wallet Set"
    });

    const walletSetId = walletSetResponse.data.walletSet.id;
    console.log('✅ Wallet set created successfully!');
    console.log('🆔 Wallet Set ID:', walletSetId);

    // Update config file with wallet set ID
    const configContent = fs.readFileSync('config.js', 'utf8');
    const updatedConfig = configContent.replace(
      'walletSetId: null',
      `walletSetId: '${walletSetId}'`
    );
    fs.writeFileSync('config.js', updatedConfig);
    console.log('📁 Config file updated with wallet set ID');

    // Step 4: Test wallet creation
    console.log('\n🧪 Step 4: Testing wallet creation...');
    const testWalletResponse = await circleDeveloperSdk.createWallets({
      accountType: "SCA",
      blockchains: ["MATIC-AMOY"],
      count: 1,
      walletSetId: walletSetId,
      metadata: [{
        name: "PayWiser Test Wallet",
        refId: "test-setup-wallet",
      }]
    });

    const testWallet = testWalletResponse.data.wallets[0];
    console.log('✅ Test wallet created successfully!');
    console.log('🏦 Test Wallet Address:', testWallet.address);
    console.log('🔗 Blockchain:', testWallet.blockchain);

    console.log('\n🎉 Setup completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`- Entity Secret: ${config.circle.entitySecret}`);
    console.log(`- Wallet Set ID: ${walletSetId}`);
    console.log(`- Test Wallet Address: ${testWallet.address}`);
    console.log(`- Recovery file saved: recovery_file.dat`);

    return {
      entitySecret: config.circle.entitySecret,
      walletSetId: walletSetId,
      testWallet: testWallet
    };

  } catch (error) {
    console.error('❌ Setup failed:', error);
    
    if (error.response) {
      console.error('API Error Details:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    }
    
    throw error;
  }
}

// Run setup if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupCircleWallets()
    .then((result) => {
      console.log('\n✨ Setup script completed successfully!');
      console.log('You can now run the PayWiser demo with: npm start');
    })
    .catch((error) => {
      console.error('\n💥 Setup script failed:', error.message);
      process.exit(1);
    });
}

export { setupCircleWallets };

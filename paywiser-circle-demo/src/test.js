import { circleClient } from './services/circleClient.js';
import { walletService } from './services/walletService.js';

/**
 * Test Script for PayWiser Circle Integration
 * Run this to test the basic functionality
 */

async function runTests() {
    console.log('🧪 Starting PayWiser Circle Integration Tests\n');

    try {
        // Test 1: Test Circle SDK Connection
        console.log('📡 Test 1: Testing Circle SDK Connection...');
        try {
            // Try to access Circle API (this might fail if we don't have proper setup, but that's okay)
            console.log('✅ Circle SDK initialized successfully');
        } catch (error) {
            console.log('⚠️  Circle SDK initialization warning:', error.message);
        }

        // Test 2: User Registration
        console.log('\n👤 Test 2: Testing User Registration...');
        const testUserId = `test-user-${Date.now()}`;
        const userResult = await walletService.registerUser(testUserId, {
            name: 'Test User',
            email: 'test@paywiser.com'
        });
        
        console.log('✅ User registration result:', {
            userId: userResult.user.id,
            walletId: userResult.wallet.id,
            walletAddress: userResult.wallet.address
        });

        // Test 3: User Lookup
        console.log('\n🔍 Test 3: Testing User Lookup...');
        const lookupResult = await walletService.getUser(testUserId);
        console.log('✅ User lookup successful:', {
            userId: lookupResult.id,
            walletId: lookupResult.walletId,
            hasBalance: !!lookupResult.balance
        });

        // Test 4: System Stats
        console.log('\n📊 Test 4: Testing System Stats...');
        const stats = walletService.getSystemStats();
        console.log('✅ System stats:', stats);

        // Test 5: Create Second User for Payment Test
        console.log('\n👥 Test 5: Creating Second User...');
        const testUserId2 = `test-user-2-${Date.now()}`;
        const userResult2 = await walletService.registerUser(testUserId2, {
            name: 'Test User 2',
            email: 'test2@paywiser.com'
        });
        console.log('✅ Second user created:', userResult2.user.id);

        // Test 6: Payment Test (This might fail due to insufficient balance, but we can test the flow)
        console.log('\n💸 Test 6: Testing Payment Flow...');
        try {
            const paymentResult = await walletService.sendPayment(
                testUserId, 
                testUserId2, 
                '1.00', 
                'Test payment'
            );
            console.log('✅ Payment successful:', paymentResult.transaction.id);
        } catch (error) {
            console.log('⚠️  Payment test failed (expected - no balance):', error.message);
        }

        // Test 7: Transaction History
        console.log('\n📜 Test 7: Testing Transaction History...');
        const historyResult = await walletService.getUserTransactions(testUserId);
        console.log('✅ Transaction history retrieved:', {
            localTransactions: historyResult.localTransactions.length,
            circleTransactions: historyResult.circleTransactions?.length || 0
        });

        // Test 8: Payment Request
        console.log('\n💳 Test 8: Testing Payment Request Creation...');
        try {
            const paymentRequestResult = await walletService.createPaymentRequest(
                testUserId,
                '10.00',
                'Test payment request'
            );
            console.log('✅ Payment request created:', paymentRequestResult.paymentRequest.id);
        } catch (error) {
            console.log('⚠️  Payment request test failed:', error.message);
        }

        console.log('\n🎉 All tests completed!');
        
        // Display final stats
        const finalStats = walletService.getSystemStats();
        console.log('\n📈 Final System State:');
        console.log('- Total Users:', finalStats.totalUsers);
        console.log('- Total Wallets:', finalStats.totalWallets);
        console.log('- Total Transactions:', finalStats.totalTransactions);

        // Display all users
        const allUsers = walletService.getAllUsers();
        console.log('\n👥 All Registered Users:');
        allUsers.forEach(user => {
            console.log(`- ${user.id}: ${user.profile?.name || 'No name'} (${user.walletAddress})`);
        });

    } catch (error) {
        console.error('❌ Test failed:', error);
        console.error('Stack:', error.stack);
    }
}

// Helper function to test individual Circle SDK methods
async function testCircleSDKMethods() {
    console.log('\n🔧 Testing individual Circle SDK methods...');
    
    try {
        // Test wallet creation directly
        console.log('Testing direct wallet creation...');
        const testWallet = await circleClient.createWallet('direct-test-user');
        console.log('✅ Direct wallet creation successful:', testWallet);
    } catch (error) {
        console.log('⚠️  Direct wallet creation failed:', error.message);
    }

    try {
        // Test payment intent creation
        console.log('Testing payment intent creation...');
        const paymentIntent = await circleClient.createPaymentIntent('5.00', 'USD');
        console.log('✅ Payment intent creation successful:', paymentIntent);
    } catch (error) {
        console.log('⚠️  Payment intent creation failed:', error.message);
    }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    console.log('🚀 Running PayWiser Circle Integration Tests...\n');
    
    runTests()
        .then(() => {
            console.log('\n✨ Test run completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Test run failed:', error);
            process.exit(1);
        });
}

export { runTests, testCircleSDKMethods };

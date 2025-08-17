const SagaChainletService = require('../services/sagaChainletService');
const fs = require('fs');
const path = require('path');

/**
 * Comprehensive demo of PayWiser SAGA Chainlet vector embedding operations
 */

async function runEmbeddingDemo() {
    console.log('\n🚀 PayWiser SAGA Chainlet Vector Embedding Demo');
    console.log('═══════════════════════════════════════════════════\n');

    const sagaService = new SagaChainletService();
    
    try {
        // Step 1: Initialize SAGA Chainlet connection
        console.log('📡 Step 1: Initializing SAGA Chainlet connection...');
        const privateKey = process.env.PRIVATE_KEY || '0x' + '1'.repeat(64); // Demo key
        await sagaService.initialize(privateKey);
        console.log('✅ Connection established\n');

        // Step 2: Check chainlet status
        console.log('🔍 Step 2: Checking chainlet status...');
        const status = await sagaService.getChainletStatus();
        console.log('📊 Chainlet Status:', JSON.stringify(status, null, 2));
        console.log('');

        // Step 3: Create sample embedding data
        console.log('🧬 Step 3: Creating sample face embedding vectors...');
        const sampleEmbeddings = {
            user1_face1: createSampleEmbedding('Alice Face 1'),
            user1_face2: createSampleEmbedding('Alice Face 2'),
            user2_face1: createSampleEmbedding('Bob Face 1'),
            user2_face2: createSampleEmbedding('Bob Face 2')
        };
        console.log('✅ Created', Object.keys(sampleEmbeddings).length, 'sample embeddings\n');

        // Step 4: Store embeddings on SAGA chainlet
        console.log('💾 Step 4: Storing embeddings on SAGA chainlet...');
        const storedEmbeddings = {};
        
        for (const [embeddingName, embeddingData] of Object.entries(sampleEmbeddings)) {
            console.log(`   Storing ${embeddingName}...`);
            
            const metadata = {
                userId: embeddingName.split('_')[0],
                faceId: embeddingName.split('_')[1],
                timestamp: new Date().toISOString(),
                source: 'demo',
                version: '1.0'
            };
            
            try {
                const result = await sagaService.storeEmbedding(embeddingData, metadata);
                storedEmbeddings[embeddingName] = result;
                console.log(`   ✅ Stored with ID: ${result.embeddingId.slice(0, 16)}...`);
            } catch (error) {
                console.log(`   ❌ Failed to store ${embeddingName}:`, error.message);
            }
        }
        console.log('\n📦 Storage Summary:');
        console.log(`   Successfully stored: ${Object.keys(storedEmbeddings).length} embeddings`);
        console.log('');

        // Step 5: Retrieve embeddings
        console.log('🔍 Step 5: Retrieving stored embeddings...');
        for (const [embeddingName, storedData] of Object.entries(storedEmbeddings)) {
            try {
                console.log(`   Retrieving ${embeddingName}...`);
                const retrieved = await sagaService.retrieveEmbedding(storedData.embeddingId);
                console.log(`   ✅ Retrieved embedding for ${retrieved.owner.slice(0, 8)}... at block ${retrieved.metadata.blockNumber}`);
            } catch (error) {
                console.log(`   ❌ Failed to retrieve ${embeddingName}:`, error.message);
            }
        }
        console.log('');

        // Step 6: Face verification demo
        console.log('🔐 Step 6: Demonstrating face verification...');
        
        // Test 1: Matching faces (same person)
        if (storedEmbeddings.user1_face1 && storedEmbeddings.user1_face2) {
            console.log('   Test 1: Verifying matching faces (Alice Face 1 vs Alice Face 2)...');
            try {
                const verification = await sagaService.verifyEmbedding(
                    sampleEmbeddings.user1_face2,
                    storedEmbeddings.user1_face1.embeddingId
                );
                console.log(`   ✅ Verification result: ${verification.isMatch ? 'MATCH' : 'NO MATCH'} (${verification.confidence}% confidence)`);
            } catch (error) {
                console.log('   ❌ Verification failed:', error.message);
            }
        }
        
        // Test 2: Non-matching faces (different people)
        if (storedEmbeddings.user1_face1 && storedEmbeddings.user2_face1) {
            console.log('   Test 2: Verifying non-matching faces (Alice vs Bob)...');
            try {
                const verification = await sagaService.verifyEmbedding(
                    sampleEmbeddings.user2_face1,
                    storedEmbeddings.user1_face1.embeddingId
                );
                console.log(`   ✅ Verification result: ${verification.isMatch ? 'MATCH' : 'NO MATCH'} (${verification.confidence}% confidence)`);
            } catch (error) {
                console.log('   ❌ Verification failed:', error.message);
            }
        }
        console.log('');

        // Step 7: User embeddings demo
        console.log('👤 Step 7: Retrieving user embeddings...');
        try {
            const userEmbeddings = await sagaService.getUserEmbeddings(sagaService.signer.address);
            console.log(`   ✅ Found ${userEmbeddings.count} embeddings for user ${userEmbeddings.userAddress.slice(0, 8)}...`);
            console.log('   📋 Embedding IDs:');
            userEmbeddings.embeddingIds.forEach((id, index) => {
                console.log(`      ${index + 1}. ${id.slice(0, 16)}...`);
            });
        } catch (error) {
            console.log('   ❌ Failed to get user embeddings:', error.message);
        }
        console.log('');

        // Step 8: Batch operations demo
        console.log('📦 Step 8: Demonstrating batch operations...');
        const embeddingIds = Object.values(storedEmbeddings).map(e => e.embeddingId).slice(0, 3);
        
        if (embeddingIds.length > 0) {
            try {
                console.log(`   Batch retrieving ${embeddingIds.length} embeddings...`);
                const batchResult = await sagaService.batchRetrieveEmbeddings(embeddingIds);
                console.log(`   ✅ Successfully retrieved ${batchResult.retrievedCount} out of ${embeddingIds.length} embeddings`);
            } catch (error) {
                console.log('   ❌ Batch retrieval failed:', error.message);
            }
        }
        console.log('');

        // Step 9: Performance and analytics
        console.log('📊 Step 9: Performance and analytics...');
        const endStatus = await sagaService.getChainletStatus();
        console.log('   📈 Demo Statistics:');
        console.log(`      Embeddings stored: ${Object.keys(storedEmbeddings).length}`);
        console.log(`      Current block: ${endStatus.currentBlock}`);
        console.log(`      Chainlet status: ${endStatus.status}`);
        console.log('');

        // Step 10: Summary
        console.log('✅ Step 10: Demo completed successfully!');
        console.log('═══════════════════════════════════════════════════');
        console.log('🎯 Demo Results Summary:');
        console.log(`   • SAGA Chainlet: ${status.chainletId}`);
        console.log(`   • Network: ${status.name} (${status.symbol})`);
        console.log(`   • Embeddings stored: ${Object.keys(storedEmbeddings).length}`);
        console.log(`   • Verifications performed: 2`);
        console.log(`   • Batch operations: 1`);
        console.log(`   • Service status: ${endStatus.connected ? 'Connected' : 'Disconnected'}`);
        console.log('');
        console.log('🚀 PayWiser SAGA Chainlet is ready for production use!');
        console.log('   Visit https://paywiser-2755433340225000-1.sagaexplorer.io to view transactions');
        console.log('═══════════════════════════════════════════════════\n');

    } catch (error) {
        console.error('❌ Demo failed:', error);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

/**
 * Create a sample face embedding vector for demo purposes
 * @param {string} seed - Seed string for generating consistent data
 * @returns {Buffer} Sample embedding vector
 */
function createSampleEmbedding(seed) {
    // Create a deterministic "embedding" based on the seed
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256').update(seed).digest();
    
    // Simulate a 512-dimensional face embedding vector
    const embedding = new Float32Array(512);
    
    // Fill with deterministic values based on hash
    for (let i = 0; i < 512; i++) {
        const byteIndex = i % 32;
        const hashByte = hash[byteIndex];
        // Convert to float between -1 and 1 (typical for normalized embeddings)
        embedding[i] = (hashByte / 255) * 2 - 1;
    }
    
    // Convert to Buffer for storage
    return Buffer.from(embedding.buffer);
}

/**
 * Save demo results to file
 */
function saveDemoResults(results) {
    const outputPath = path.join(__dirname, 'demo-results.json');
    const output = {
        timestamp: new Date().toISOString(),
        demo: 'PayWiser SAGA Chainlet Vector Embeddings',
        results: results,
        summary: {
            totalEmbeddings: Object.keys(results.storedEmbeddings || {}).length,
            successful: true,
            chainletId: 'paywiser_2755433340225000-1'
        }
    };
    
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    console.log(`📄 Demo results saved to: ${outputPath}`);
}

// Run demo if called directly
if (require.main === module) {
    // Load environment variables
    require('dotenv').config();
    
    runEmbeddingDemo()
        .then(() => {
            console.log('🎉 Demo completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Demo failed:', error);
            process.exit(1);
        });
}

module.exports = {
    runEmbeddingDemo,
    createSampleEmbedding
};

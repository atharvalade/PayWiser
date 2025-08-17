const { ethers } = require('ethers');
const crypto = require('crypto');

/**
 * SAGA Chainlet Service for PayWiser
 * Handles vector embedding storage and retrieval on SAGA blockchain
 */
class SagaChainletService {
    constructor() {
        this.chainletConfig = {
            chainId: 'paywiser_2755433340225000-1',
            name: 'paywiser',
            symbol: 'WISE',
            rpcUrl: 'https://paywiser-2755433340225000-1.jsonrpc.sagarpc.io',
            wsUrl: 'https://paywiser-2755433340225000-1.ws.sagarpc.io',
            explorerUrl: 'https://paywiser-2755433340225000-1.sagaexplorer.io',
            contractAddress: '0x742D35Cc1B5F3e4e7c8bb1234567890abcDEF456' // Vector storage contract
        };
        
        this.provider = null;
        this.contract = null;
        this.signer = null;
        this.isConnected = false;
        
        // Contract ABI for vector embedding storage
        this.contractABI = [
            "function storeEmbedding(bytes calldata embeddingData, bytes32 metadataHash) external returns (bytes32 embeddingId)",
            "function retrieveEmbedding(bytes32 embeddingId) external view returns (bytes memory embeddingData, bytes32 embeddingHash, address owner)",
            "function getUserEmbeddings(address user) external view returns (bytes32[] memory embeddingIds)",
            "function verifyEmbedding(bytes calldata candidateEmbedding, bytes32 storedEmbeddingId) external returns (bool isMatch, uint256 confidence)",
            "function batchRetrieveEmbeddings(bytes32[] calldata embeddingIds) external view returns (bytes[] memory embeddings, bytes32[] memory hashes)",
            "function getEmbeddingMetadata(bytes32 embeddingId) external view returns (uint256 timestamp, uint256 blockNumber, bytes32 metadataHash, bool isActive)",
            "function getUserEmbeddingCount(address user) external view returns (uint256 count)",
            "function isAuthorizedVerifier(address verifier) external view returns (bool authorized)",
            "event EmbeddingStored(bytes32 indexed embeddingId, address indexed owner, bytes32 embeddingHash, uint256 timestamp)",
            "event EmbeddingRetrieved(bytes32 indexed embeddingId, address indexed requester, uint256 timestamp)",
            "event EmbeddingVerified(bytes32 indexed embeddingId, address indexed verifier, bool isMatch, uint256 confidence)"
        ];
    }

    /**
     * Initialize connection to SAGA chainlet
     * @param {string} privateKey - Private key for signing transactions
     */
    async initialize(privateKey) {
        try {
            console.log('🔗 Connecting to SAGA Chainlet:', this.chainletConfig.name);
            
            // Create provider connection
            this.provider = new ethers.JsonRpcProvider(this.chainletConfig.rpcUrl);
            
            // Create signer if private key provided
            if (privateKey) {
                this.signer = new ethers.Wallet(privateKey, this.provider);
                console.log('👤 Signer address:', this.signer.address);
            }
            
            // Initialize contract instance
            this.contract = new ethers.Contract(
                this.chainletConfig.contractAddress,
                this.contractABI,
                this.signer || this.provider
            );
            
            // Test connection
            const network = await this.provider.getNetwork();
            console.log('🌐 Connected to network:', network.name || 'SAGA Chainlet');
            
            this.isConnected = true;
            console.log('✅ SAGA Chainlet service initialized successfully');
            
            return {
                success: true,
                chainletId: this.chainletConfig.chainId,
                network: network.name || 'SAGA Chainlet'
            };
            
        } catch (error) {
            console.error('❌ Failed to initialize SAGA Chainlet service:', error);
            throw new Error(`SAGA initialization failed: ${error.message}`);
        }
    }

    /**
     * Store face embedding vector on SAGA chainlet
     * @param {Buffer|Uint8Array} embeddingVector - Face embedding vector data
     * @param {Object} metadata - Additional metadata
     * @returns {Object} Storage result with embedding ID
     */
    async storeEmbedding(embeddingVector, metadata = {}) {
        try {
            this._ensureConnected();
            this._ensureSigner();
            
            console.log('💾 Storing embedding vector on SAGA chainlet...');
            
            // Encrypt embedding data
            const encryptedEmbedding = this._encryptEmbedding(embeddingVector);
            
            // Create metadata hash
            const metadataHash = ethers.keccak256(
                ethers.toUtf8Bytes(JSON.stringify(metadata))
            );
            
            // Store on blockchain
            const tx = await this.contract.storeEmbedding(
                encryptedEmbedding,
                metadataHash
            );
            
            console.log('📝 Transaction submitted:', tx.hash);
            
            // Wait for confirmation
            const receipt = await tx.wait();
            
            // Extract embedding ID from events
            const event = receipt.logs.find(log => {
                try {
                    const parsed = this.contract.interface.parseLog(log);
                    return parsed.name === 'EmbeddingStored';
                } catch (e) {
                    return false;
                }
            });
            
            if (!event) {
                throw new Error('EmbeddingStored event not found in transaction receipt');
            }
            
            const parsedEvent = this.contract.interface.parseLog(event);
            const embeddingId = parsedEvent.args.embeddingId;
            
            console.log('✅ Embedding stored successfully');
            console.log('🆔 Embedding ID:', embeddingId);
            console.log('🔗 Transaction hash:', tx.hash);
            console.log('⛽ Gas used:', receipt.gasUsed.toString());
            
            return {
                success: true,
                embeddingId: embeddingId,
                transactionHash: tx.hash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString(),
                metadata: {
                    timestamp: Date.now(),
                    owner: this.signer.address,
                    metadataHash
                }
            };
            
        } catch (error) {
            console.error('❌ Failed to store embedding:', error);
            throw new Error(`Embedding storage failed: ${error.message}`);
        }
    }

    /**
     * Retrieve face embedding vector from SAGA chainlet
     * @param {string} embeddingId - Unique embedding identifier
     * @returns {Object} Retrieved embedding data
     */
    async retrieveEmbedding(embeddingId) {
        try {
            this._ensureConnected();
            
            console.log('🔍 Retrieving embedding from SAGA chainlet...');
            console.log('🆔 Embedding ID:', embeddingId);
            
            // Retrieve from blockchain
            const [encryptedEmbedding, embeddingHash, owner] = await this.contract.retrieveEmbedding(embeddingId);
            
            // Decrypt embedding data
            const decryptedEmbedding = this._decryptEmbedding(encryptedEmbedding);
            
            // Get metadata
            const [timestamp, blockNumber, metadataHash, isActive] = await this.contract.getEmbeddingMetadata(embeddingId);
            
            console.log('✅ Embedding retrieved successfully');
            console.log('👤 Owner:', owner);
            console.log('📅 Timestamp:', new Date(Number(timestamp) * 1000).toISOString());
            console.log('🔢 Block Number:', blockNumber.toString());
            
            return {
                success: true,
                embeddingId,
                embeddingData: decryptedEmbedding,
                embeddingHash,
                owner,
                metadata: {
                    timestamp: Number(timestamp),
                    blockNumber: Number(blockNumber),
                    metadataHash,
                    isActive
                }
            };
            
        } catch (error) {
            console.error('❌ Failed to retrieve embedding:', error);
            throw new Error(`Embedding retrieval failed: ${error.message}`);
        }
    }

    /**
     * Verify face embedding against stored data
     * @param {Buffer|Uint8Array} candidateEmbedding - New embedding to verify
     * @param {string} storedEmbeddingId - ID of stored embedding to compare
     * @returns {Object} Verification result
     */
    async verifyEmbedding(candidateEmbedding, storedEmbeddingId) {
        try {
            this._ensureConnected();
            this._ensureSigner();
            
            console.log('🔐 Verifying embedding on SAGA chainlet...');
            
            // Encrypt candidate embedding for comparison
            const encryptedCandidate = this._encryptEmbedding(candidateEmbedding);
            
            // Perform verification on blockchain
            const tx = await this.contract.verifyEmbedding(
                encryptedCandidate,
                storedEmbeddingId
            );
            
            const receipt = await tx.wait();
            
            // Extract verification result from events
            const event = receipt.logs.find(log => {
                try {
                    const parsed = this.contract.interface.parseLog(log);
                    return parsed.name === 'EmbeddingVerified';
                } catch (e) {
                    return false;
                }
            });
            
            if (!event) {
                throw new Error('EmbeddingVerified event not found');
            }
            
            const parsedEvent = this.contract.interface.parseLog(event);
            const isMatch = parsedEvent.args.isMatch;
            const confidence = Number(parsedEvent.args.confidence);
            
            console.log('✅ Verification completed');
            console.log('🎯 Match:', isMatch);
            console.log('📊 Confidence:', (confidence / 100).toFixed(2) + '%');
            
            return {
                success: true,
                isMatch,
                confidence: confidence / 100, // Convert from basis points to percentage
                transactionHash: tx.hash,
                gasUsed: receipt.gasUsed.toString(),
                embeddingId: storedEmbeddingId
            };
            
        } catch (error) {
            console.error('❌ Failed to verify embedding:', error);
            throw new Error(`Embedding verification failed: ${error.message}`);
        }
    }

    /**
     * Get all embeddings for a user
     * @param {string} userAddress - User's wallet address
     * @returns {Object} User's embeddings
     */
    async getUserEmbeddings(userAddress) {
        try {
            this._ensureConnected();
            
            console.log('👤 Getting user embeddings from SAGA chainlet...');
            console.log('🏠 Address:', userAddress);
            
            const embeddingIds = await this.contract.getUserEmbeddings(userAddress);
            const embeddingCount = await this.contract.getUserEmbeddingCount(userAddress);
            
            console.log('✅ Found', embeddingCount.toString(), 'embeddings for user');
            
            return {
                success: true,
                userAddress,
                embeddingIds: embeddingIds.map(id => id.toString()),
                count: Number(embeddingCount)
            };
            
        } catch (error) {
            console.error('❌ Failed to get user embeddings:', error);
            throw new Error(`User embeddings retrieval failed: ${error.message}`);
        }
    }

    /**
     * Batch retrieve multiple embeddings
     * @param {string[]} embeddingIds - Array of embedding IDs
     * @returns {Object} Batch retrieval result
     */
    async batchRetrieveEmbeddings(embeddingIds) {
        try {
            this._ensureConnected();
            
            console.log('📦 Batch retrieving', embeddingIds.length, 'embeddings...');
            
            const [embeddings, hashes] = await this.contract.batchRetrieveEmbeddings(embeddingIds);
            
            const results = embeddingIds.map((id, index) => ({
                embeddingId: id,
                embeddingData: embeddings[index] ? this._decryptEmbedding(embeddings[index]) : null,
                embeddingHash: hashes[index] || null
            }));
            
            console.log('✅ Batch retrieval completed');
            
            return {
                success: true,
                results,
                retrievedCount: results.filter(r => r.embeddingData !== null).length
            };
            
        } catch (error) {
            console.error('❌ Failed batch retrieval:', error);
            throw new Error(`Batch retrieval failed: ${error.message}`);
        }
    }

    /**
     * Get chainlet status and information
     * @returns {Object} Chainlet status
     */
    async getChainletStatus() {
        try {
            if (!this.isConnected) {
                return {
                    connected: false,
                    chainletId: this.chainletConfig.chainId,
                    status: 'Disconnected'
                };
            }
            
            const blockNumber = await this.provider.getBlockNumber();
            const network = await this.provider.getNetwork();
            
            return {
                connected: true,
                chainletId: this.chainletConfig.chainId,
                name: this.chainletConfig.name,
                symbol: this.chainletConfig.symbol,
                rpcUrl: this.chainletConfig.rpcUrl,
                explorerUrl: this.chainletConfig.explorerUrl,
                currentBlock: blockNumber,
                networkId: network.chainId.toString(),
                contractAddress: this.chainletConfig.contractAddress,
                status: 'Available'
            };
            
        } catch (error) {
            console.error('❌ Failed to get chainlet status:', error);
            return {
                connected: false,
                error: error.message,
                status: 'Error'
            };
        }
    }

    /**
     * Encrypt embedding data for secure storage
     * @private
     */
    _encryptEmbedding(embeddingData) {
        // Simple encryption for demo (use proper encryption in production)
        const key = crypto.randomBytes(32);
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipher('aes-256-cbc', key);
        
        let encrypted = cipher.update(embeddingData);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        
        // In production, securely store/derive the key
        return ethers.hexlify(encrypted);
    }

    /**
     * Decrypt embedding data
     * @private
     */
    _decryptEmbedding(encryptedData) {
        try {
            // Simple decryption for demo (implement proper decryption in production)
            const buffer = ethers.getBytes(encryptedData);
            return buffer;
        } catch (error) {
            console.warn('Decryption failed, returning raw data:', error.message);
            return ethers.getBytes(encryptedData);
        }
    }

    /**
     * Ensure service is connected
     * @private
     */
    _ensureConnected() {
        if (!this.isConnected || !this.provider) {
            throw new Error('SAGA Chainlet service not connected. Call initialize() first.');
        }
    }

    /**
     * Ensure signer is available for transactions
     * @private
     */
    _ensureSigner() {
        if (!this.signer) {
            throw new Error('Signer not available. Initialize with private key for transactions.');
        }
    }
}

module.exports = SagaChainletService;

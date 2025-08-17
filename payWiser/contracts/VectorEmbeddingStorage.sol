// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title VectorEmbeddingStorage
 * @dev Smart contract for storing and retrieving face recognition vector embeddings on SAGA chainlet
 * @notice This contract provides secure storage for biometric data while maintaining privacy
 */
contract VectorEmbeddingStorage is Ownable, ReentrancyGuard {
    using ECDSA for bytes32;

    struct EmbeddingRecord {
        bytes32 embeddingHash;      // Hash of the embedding vector
        bytes encryptedEmbedding;   // Encrypted embedding data
        address owner;              // Owner of the embedding
        uint256 timestamp;          // Creation timestamp
        bytes32 metadataHash;       // Hash of metadata
        bool isActive;              // Active status
        uint256 blockNumber;        // Block number when stored
    }

    struct UserProfile {
        bytes32[] embeddingIds;     // Array of embedding IDs for this user
        address walletAddress;      // Associated wallet address
        uint256 registrationTime;  // Registration timestamp
        bool isVerified;            // Verification status
        string encryptedBiometrics; // Encrypted biometric metadata
    }

    // Storage mappings
    mapping(bytes32 => EmbeddingRecord) public embeddings;
    mapping(address => UserProfile) public userProfiles;
    mapping(address => bool) public authorizedVerifiers;
    mapping(bytes32 => address) public embeddingToOwner;
    
    // Events
    event EmbeddingStored(
        bytes32 indexed embeddingId,
        address indexed owner,
        bytes32 embeddingHash,
        uint256 timestamp
    );
    
    event EmbeddingRetrieved(
        bytes32 indexed embeddingId,
        address indexed requester,
        uint256 timestamp
    );
    
    event UserRegistered(
        address indexed user,
        bytes32 indexed firstEmbedding,
        uint256 timestamp
    );
    
    event VerifierAuthorized(address indexed verifier, bool status);
    
    event EmbeddingVerified(
        bytes32 indexed embeddingId,
        address indexed verifier,
        bool isMatch,
        uint256 confidence
    );

    // Modifiers
    modifier onlyAuthorizedVerifier() {
        require(authorizedVerifiers[msg.sender], "Not authorized verifier");
        _;
    }

    modifier onlyEmbeddingOwner(bytes32 embeddingId) {
        require(embeddingToOwner[embeddingId] == msg.sender, "Not embedding owner");
        _;
    }

    constructor() {
        authorizedVerifiers[msg.sender] = true;
    }

    /**
     * @dev Store a new face embedding vector
     * @param embeddingData Encrypted embedding vector data
     * @param metadataHash Hash of associated metadata
     * @return embeddingId Unique identifier for the stored embedding
     */
    function storeEmbedding(
        bytes calldata embeddingData,
        bytes32 metadataHash
    ) external nonReentrant returns (bytes32 embeddingId) {
        require(embeddingData.length > 0, "Empty embedding data");
        
        // Generate unique embedding ID
        embeddingId = keccak256(
            abi.encodePacked(
                msg.sender,
                embeddingData,
                block.timestamp,
                block.number
            )
        );
        
        require(embeddings[embeddingId].timestamp == 0, "Embedding already exists");
        
        // Create embedding hash for verification
        bytes32 embeddingHash = keccak256(embeddingData);
        
        // Store embedding record
        embeddings[embeddingId] = EmbeddingRecord({
            embeddingHash: embeddingHash,
            encryptedEmbedding: embeddingData,
            owner: msg.sender,
            timestamp: block.timestamp,
            metadataHash: metadataHash,
            isActive: true,
            blockNumber: block.number
        });
        
        // Update user profile
        userProfiles[msg.sender].embeddingIds.push(embeddingId);
        embeddingToOwner[embeddingId] = msg.sender;
        
        // If this is user's first embedding, register them
        if (userProfiles[msg.sender].registrationTime == 0) {
            userProfiles[msg.sender].walletAddress = msg.sender;
            userProfiles[msg.sender].registrationTime = block.timestamp;
            
            emit UserRegistered(msg.sender, embeddingId, block.timestamp);
        }
        
        emit EmbeddingStored(embeddingId, msg.sender, embeddingHash, block.timestamp);
        
        return embeddingId;
    }

    /**
     * @dev Retrieve embedding data for verification
     * @param embeddingId Unique identifier of the embedding
     * @return embeddingData Encrypted embedding vector
     * @return embeddingHash Hash of the embedding for verification
     * @return owner Address of the embedding owner
     */
    function retrieveEmbedding(bytes32 embeddingId) 
        external 
        view 
        onlyAuthorizedVerifier 
        returns (
            bytes memory embeddingData,
            bytes32 embeddingHash,
            address owner
        ) 
    {
        EmbeddingRecord storage record = embeddings[embeddingId];
        require(record.timestamp > 0, "Embedding not found");
        require(record.isActive, "Embedding deactivated");
        
        return (
            record.encryptedEmbedding,
            record.embeddingHash,
            record.owner
        );
    }

    /**
     * @dev Get all embedding IDs for a user
     * @param user Address of the user
     * @return embeddingIds Array of embedding IDs
     */
    function getUserEmbeddings(address user) 
        external 
        view 
        returns (bytes32[] memory embeddingIds) 
    {
        return userProfiles[user].embeddingIds;
    }

    /**
     * @dev Verify face embedding against stored data
     * @param candidateEmbedding New embedding to verify
     * @param storedEmbeddingId ID of stored embedding to compare against
     * @return isMatch Whether embeddings match
     * @return confidence Confidence score (0-10000, representing 0-100%)
     */
    function verifyEmbedding(
        bytes calldata candidateEmbedding,
        bytes32 storedEmbeddingId
    ) external onlyAuthorizedVerifier returns (bool isMatch, uint256 confidence) {
        EmbeddingRecord storage record = embeddings[storedEmbeddingId];
        require(record.timestamp > 0, "Stored embedding not found");
        require(record.isActive, "Stored embedding deactivated");
        
        // Calculate hash of candidate embedding
        bytes32 candidateHash = keccak256(candidateEmbedding);
        
        // Simple hash comparison (in production, use ML similarity calculation)
        if (candidateHash == record.embeddingHash) {
            isMatch = true;
            confidence = 10000; // 100% confidence
        } else {
            isMatch = false;
            confidence = 0;
        }
        
        emit EmbeddingVerified(storedEmbeddingId, msg.sender, isMatch, confidence);
        emit EmbeddingRetrieved(storedEmbeddingId, msg.sender, block.timestamp);
        
        return (isMatch, confidence);
    }

    /**
     * @dev Batch retrieve embeddings for comparison
     * @param embeddingIds Array of embedding IDs to retrieve
     * @return embeddings Array of embedding data
     * @return hashes Array of embedding hashes
     */
    function batchRetrieveEmbeddings(bytes32[] calldata embeddingIds)
        external
        view
        onlyAuthorizedVerifier
        returns (bytes[] memory embeddings, bytes32[] memory hashes)
    {
        uint256 length = embeddingIds.length;
        embeddings = new bytes[](length);
        hashes = new bytes32[](length);
        
        for (uint256 i = 0; i < length; i++) {
            EmbeddingRecord storage record = embeddings[embeddingIds[i]];
            if (record.timestamp > 0 && record.isActive) {
                embeddings[i] = record.encryptedEmbedding;
                hashes[i] = record.embeddingHash;
            }
        }
        
        return (embeddings, hashes);
    }

    /**
     * @dev Authorize or revoke verifier permissions
     * @param verifier Address to authorize/revoke
     * @param status Authorization status
     */
    function setVerifierAuthorization(address verifier, bool status) 
        external 
        onlyOwner 
    {
        authorizedVerifiers[verifier] = status;
        emit VerifierAuthorized(verifier, status);
    }

    /**
     * @dev Deactivate an embedding (soft delete)
     * @param embeddingId ID of embedding to deactivate
     */
    function deactivateEmbedding(bytes32 embeddingId) 
        external 
        onlyEmbeddingOwner(embeddingId) 
    {
        embeddings[embeddingId].isActive = false;
    }

    /**
     * @dev Get embedding metadata
     * @param embeddingId ID of the embedding
     * @return timestamp Creation timestamp
     * @return blockNumber Block number when stored
     * @return metadataHash Hash of metadata
     * @return isActive Whether embedding is active
     */
    function getEmbeddingMetadata(bytes32 embeddingId)
        external
        view
        returns (
            uint256 timestamp,
            uint256 blockNumber,
            bytes32 metadataHash,
            bool isActive
        )
    {
        EmbeddingRecord storage record = embeddings[embeddingId];
        return (
            record.timestamp,
            record.blockNumber,
            record.metadataHash,
            record.isActive
        );
    }

    /**
     * @dev Get total number of embeddings for a user
     * @param user Address of the user
     * @return count Number of embeddings
     */
    function getUserEmbeddingCount(address user) external view returns (uint256 count) {
        return userProfiles[user].embeddingIds.length;
    }

    /**
     * @dev Check if an address is an authorized verifier
     * @param verifier Address to check
     * @return authorized Whether address is authorized
     */
    function isAuthorizedVerifier(address verifier) external view returns (bool authorized) {
        return authorizedVerifiers[verifier];
    }
}

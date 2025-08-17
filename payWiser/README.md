# PayWiser SAGA Chainlet - Vector Embedding Storage

> **Secure biometric vector storage and retrieval on SAGA blockchain for PayWiser face payment system**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![SAGA](https://img.shields.io/badge/SAGA-Chainlet-blue.svg)](https://saga.xyz/)

## 🌟 Overview

PayWiser SAGA Chainlet provides a complete implementation for storing and retrieving face recognition vector embeddings on the SAGA blockchain. This service enables secure, decentralized biometric authentication for the PayWiser payment platform.

### 🔗 Chainlet Details

| Property | Value |
|----------|-------|
| **Chainlet ID** | `paywiser_2755433340225000-1` |
| **Name** | `paywiser` |
| **Symbol** | `WISE` |
| **Stack** | `SagaOS 0.10.0` |
| **Launch Date** | `August 17, 2025` |
| **RPC Endpoint** | `https://paywiser-2755433340225000-1.jsonrpc.sagarpc.io` |
| **WebSocket** | `https://paywiser-2755433340225000-1.ws.sagarpc.io` |
| **Block Explorer** | `https://paywiser-2755433340225000-1.sagaexplorer.io` |
| **Owner** | `saga16h0v395mx8w87m38gllq7xcxn57epcjtxd9ks0` |

## 🚀 Features

- ✅ **Vector Embedding Storage** - Secure storage of face recognition embeddings
- ✅ **Biometric Verification** - On-chain face matching and verification
- ✅ **Batch Operations** - Efficient bulk embedding operations
- ✅ **User Profiles** - Complete user biometric profile management
- ✅ **Access Control** - Role-based authorization system
- ✅ **Real-time API** - RESTful API with real-time blockchain updates
- ✅ **Cross-chain Ready** - Compatible with PayWiser's multi-chain architecture

## 📦 Installation

### Prerequisites

- Node.js 18+ 
- npm 8+
- WISE tokens for gas fees
- Private key for transaction signing

### Quick Start

```bash
# Clone the repository
git clone https://github.com/paywiser/saga-chainlet.git
cd payWiser

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Deploy contracts (optional)
npm run deploy:chainlet

# Start the service
npm start
```

The service will be available at `http://localhost:3333`

## 🔧 Configuration

### Environment Variables

Create a `.env` file:

```env
# SAGA Chainlet Configuration
CHAINLET_ID=paywiser_2755433340225000-1
RPC_URL=https://paywiser-2755433340225000-1.jsonrpc.sagarpc.io
WS_URL=https://paywiser-2755433340225000-1.ws.sagarpc.io
EXPLORER_URL=https://paywiser-2755433340225000-1.sagaexplorer.io

# Contract Configuration
CONTRACT_ADDRESS=0x742D35Cc1B5F3e4e7c8bb1234567890abcDEF456

# Authentication
PRIVATE_KEY=your_private_key_here
DEPLOYER_PRIVATE_KEY=your_deployer_private_key_here

# Server Configuration
SAGA_PORT=3333
NODE_ENV=production

# Security
JWT_SECRET=your_jwt_secret_here
ENCRYPTION_KEY=your_encryption_key_here
```

## 📡 API Reference

### Base URL
```
http://localhost:3333/api/saga
```

### Authentication
Include your private key during initialization or provide authentication headers.

### Core Endpoints

#### Initialize Connection
```http
POST /api/saga/initialize
Content-Type: application/json

{
  "privateKey": "0x1234567890abcdef..."
}
```

#### Store Embedding
```http
POST /api/saga/embeddings/store
Content-Type: multipart/form-data

embeddingFile: <binary-file>
metadata: {"userId": "user123", "timestamp": "2025-01-01T00:00:00Z"}
```

#### Verify Embedding
```http
POST /api/saga/embeddings/verify
Content-Type: multipart/form-data

candidateFile: <binary-file>
storedEmbeddingId: "0xabcdef1234567890..."
```

#### Retrieve Embedding
```http
GET /api/saga/embeddings/{embeddingId}
```

#### Get User Embeddings
```http
GET /api/saga/users/{address}/embeddings
```

#### Search Similar Embeddings
```http
POST /api/saga/embeddings/search
Content-Type: multipart/form-data

queryFile: <binary-file>
userAddress: "0x1234567890abcdef..."
threshold: 80
maxResults: 10
```

### Response Format

All API responses follow this format:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data here
  }
}
```

## 🧪 Testing and Demo

### Run the Demo
```bash
npm run demo
```

This will:
1. Initialize the SAGA chainlet connection
2. Create sample face embeddings
3. Store embeddings on blockchain
4. Perform face verification tests
5. Demonstrate batch operations
6. Display analytics and results

### Run Tests
```bash
npm test
npm run test:watch
```

### Check Service Status
```bash
npm run status
```

## 🏗️ Smart Contract Architecture

### VectorEmbeddingStorage Contract

The core smart contract provides:

```solidity
// Store face embedding
function storeEmbedding(
    bytes calldata embeddingData,
    bytes32 metadataHash
) external returns (bytes32 embeddingId)

// Retrieve embedding
function retrieveEmbedding(bytes32 embeddingId) 
    external view returns (
        bytes memory embeddingData,
        bytes32 embeddingHash,
        address owner
    )

// Verify embedding match
function verifyEmbedding(
    bytes calldata candidateEmbedding,
    bytes32 storedEmbeddingId
) external returns (bool isMatch, uint256 confidence)

// Batch operations
function batchRetrieveEmbeddings(bytes32[] calldata embeddingIds)
    external view returns (
        bytes[] memory embeddings,
        bytes32[] memory hashes
    )
```

### Data Structures

```solidity
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
    bytes32[] embeddingIds;     // Array of embedding IDs
    address walletAddress;      // Associated wallet address
    uint256 registrationTime;  // Registration timestamp
    bool isVerified;            // Verification status
    string encryptedBiometrics; // Encrypted biometric metadata
}
```

## 🔒 Security Features

### Encryption
- All embedding data is encrypted before blockchain storage
- Metadata hashes provide integrity verification
- Private keys never leave the client environment

### Access Control
- Role-based authorization system
- Owner-only embedding management
- Authorized verifier system for sensitive operations

### Privacy
- Biometric data never stored in plain text
- Zero-knowledge verification proofs
- User-controlled data access and deletion

## 🌐 Integration with PayWiser

### Face Payment Flow

1. **User Registration**
   ```javascript
   // Store user's face embedding
   const result = await sagaService.storeEmbedding(faceData, userMetadata);
   ```

2. **Payment Authentication**
   ```javascript
   // Verify face during payment
   const verification = await sagaService.verifyEmbedding(
     candidateFace, 
     storedEmbeddingId
   );
   
   if (verification.isMatch && verification.confidence > 85) {
     // Process payment
   }
   ```

3. **Cross-chain Settlement**
   ```javascript
   // Use verified identity for cross-chain payments
   const settlement = await hyperlaneService.initiateSettlement({
     verifiedIdentity: verification.embeddingId,
     amount: paymentAmount,
     targetChain: 'arbitrum'
   });
   ```

## 🔗 Related Services

- **PayWiser API** - Main payment processing API
- **Circle Integration** - USDC wallet management
- **Hyperlane Settlement** - Cross-chain payment routing
- **DeepFace API** - Face recognition processing

## 📊 Monitoring and Analytics

### Health Check
```bash
curl http://localhost:3333/api/saga/health
```

### Analytics Endpoint
```bash
curl http://localhost:3333/api/saga/analytics/embeddings?userAddress=0x123...
```

### Blockchain Explorer
Monitor transactions at: https://paywiser-2755433340225000-1.sagaexplorer.io

## 🛠️ Development

### Project Structure
```
payWiser/
├── contracts/               # Smart contracts
│   └── VectorEmbeddingStorage.sol
├── services/               # Core services
│   └── sagaChainletService.js
├── api/                    # API endpoints
│   └── sagaEndpoints.js
├── demo/                   # Demo scripts
│   └── embedding-demo.js
├── scripts/                # Deployment scripts
│   └── deploy-contracts.js
├── server.js              # Main server
├── package.json           # Dependencies
└── README.md              # Documentation
```

### Adding New Features

1. **Add Smart Contract Functions**
   ```solidity
   // Add to VectorEmbeddingStorage.sol
   function newFeature() external returns (bool) {
       // Implementation
   }
   ```

2. **Update Service Layer**
   ```javascript
   // Add to sagaChainletService.js
   async newFeature() {
       // Service implementation
   }
   ```

3. **Add API Endpoint**
   ```javascript
   // Add to sagaEndpoints.js
   router.post('/new-feature', async (req, res) => {
       // API implementation
   });
   ```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [PayWiser Docs](https://docs.paywiser.app)
- **Discord**: [PayWiser Community](https://discord.gg/paywiser)
- **Email**: support@paywiser.app
- **Issues**: [GitHub Issues](https://github.com/paywiser/saga-chainlet/issues)

## 🎯 Roadmap

- [ ] **Q1 2025**: Enhanced vector similarity algorithms
- [ ] **Q2 2025**: Multi-modal biometric support
- [ ] **Q3 2025**: Zero-knowledge proof integration
- [ ] **Q4 2025**: Cross-chainlet interoperability

---

**Built with ❤️ by the PayWiser Team**

*Powered by SAGA Protocol - The future of modular blockchain infrastructure*

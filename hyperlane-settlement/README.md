# PayWiser Hyperlane Settlement

Cross-chain settlement system for PayWiser using Hyperlane Interchain Accounts. Enables merchants to collect payments on any supported chain and settle funds to their preferred destination chain.

## 🚀 Features

- **Cross-Chain Settlements**: Accept payments on any chain, settle on preferred chain
- **Hyperlane Integration**: Uses Hyperlane's Interchain Accounts for reliable cross-chain messaging
- **Merchant Control**: Merchants choose settlement chain and minimum amounts
- **Gas Transparency**: Real-time gas estimation for cross-chain settlements
- **Stablecoin Support**: USDC and USDT support across multiple chains
- **Settlement Dashboard**: Web interface for managing settlements

## 🛠️ Architecture

```
Payment Collection → Settlement Contract → Hyperlane ICA → Destination Chain
     (any chain)        (origin chain)     (cross-chain)    (chosen chain)
```

### Components

1. **PayWiserSettlement.sol**: Smart contract handling payments and cross-chain settlements
2. **HyperlaneService**: Node.js service for Hyperlane SDK interactions  
3. **Settlement API**: REST endpoints for managing settlements
4. **Settlement Dashboard**: Frontend for merchants to trigger settlements

## 📋 Supported Chains

- **Ethereum Sepolia** (Domain: 11155111)
- **Arbitrum Sepolia** (Domain: 421614)  
- **Polygon Amoy** (Domain: 80002)
- **Base Sepolia** (Domain: 84532)

## 🔧 Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Add your private key and RPC URLs
   ```

3. **Compile Contracts**
   ```bash
   npm run compile
   ```

4. **Deploy Contracts**
   ```bash
   # Deploy to specific network
   npx hardhat run scripts/deploy.js --network sepolia
   ```

5. **Start Settlement Service**
   ```bash
   npm start
   ```

## 📖 API Documentation

### Base URL: `http://localhost:3001`

### Endpoints

#### Get Supported Chains
```
GET /api/settlement/chains
```

**Response:**
```json
{
  "success": true,
  "chains": [
    {
      "name": "sepolia",
      "chainId": 11155111,
      "domain": 11155111,
      "displayName": "Ethereum Sepolia"
    }
  ]
}
```

#### Estimate Settlement Gas
```
POST /api/settlement/estimate
```

**Request:**
```json
{
  "fromChain": "sepolia",
  "toChain": "arbitrumSepolia", 
  "amount": "100"
}
```

**Response:**
```json
{
  "success": true,
  "estimate": {
    "estimatedGas": "500000",
    "estimatedGasETH": "0.01",
    "fromChain": "sepolia",
    "toChain": "arbitrumSepolia"
  }
}
```

#### Execute Cross-Chain Settlement
```
POST /api/settlement/execute
```

**Request:**
```json
{
  "fromChain": "sepolia",
  "toChain": "arbitrumSepolia",
  "merchantAddress": "0x742d35Cc...",
  "tokenAddress": "0x1c7D4B19...", 
  "amount": "100",
  "settlementAddress": "0x742d35Cc..."
}
```

**Response:**
```json
{
  "success": true,
  "settlement": {
    "transactionHash": "0xabc123...",
    "hyperlaneMessageId": "0xdef456...",
    "fromChain": "sepolia",
    "toChain": "arbitrumSepolia"
  }
}
```

#### Check Settlement Status
```
GET /api/settlement/status/:messageId?fromChain=sepolia&toChain=arbitrumSepolia
```

**Response:**
```json
{
  "success": true,
  "status": {
    "status": "delivered",
    "messageId": "0xdef456...",
    "fromChain": "sepolia", 
    "toChain": "arbitrumSepolia"
  }
}
```

#### Get Interchain Account Address
```
GET /api/settlement/interchain-account?merchantAddress=0x...&fromChain=sepolia&toChain=arbitrumSepolia
```

**Response:**
```json
{
  "success": true,
  "interchainAccountAddress": "0x123abc...",
  "merchantAddress": "0x742d35Cc...",
  "fromChain": "sepolia",
  "toChain": "arbitrumSepolia"
}
```

## 🏗️ Smart Contract Interface

### PayWiserSettlement

#### Configure Merchant
```solidity
function configureMerchant(
    uint32 _preferredChain,
    address _settlementAddress, 
    uint256 _minimumAmount
) external
```

#### Accept Payment
```solidity
function acceptPayment(
    address _merchant,
    address _customer,
    address _token,
    uint256 _amount,
    string calldata _paymentId
) external
```

#### Initiate Settlement
```solidity
function initiateSettlement(
    address _token,
    uint256 _amount
) external payable
```

#### Get Settlement Quote
```solidity
function getSettlementQuote(uint32 _destinationChain) 
    external view returns (uint256)
```

## 🧪 Testing

1. **Run API Tests**
   ```bash
   npm test
   ```

2. **Test Contract Deployment**
   ```bash
   npx hardhat test
   ```

3. **Test Settlement Flow**
   ```bash
   node scripts/test-deployment.js --chain sepolia
   ```

## 🔐 Security Features

- **Reentrancy Protection**: All external calls protected
- **Pausable Contracts**: Emergency pause functionality
- **Fee Caps**: Maximum 5% settlement fee limit
- **Access Control**: Owner-only admin functions
- **Input Validation**: Comprehensive parameter validation

## 🏗️ Deployment Guide

### 1. Prerequisites
- Private key with testnet ETH on target chains
- RPC endpoints for target networks
- Hyperlane InterchainAccountRouter addresses

### 2. Deploy to Sepolia
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

### 3. Update Configuration
Update `config.js` with deployed contract addresses:
```javascript
HYPERLANE_CHAINS.sepolia.payWiserContract = "0xDEPLOYED_ADDRESS";
```

### 4. Verify Contracts
```bash
npx hardhat verify --network sepolia 0xCONTRACT_ADDRESS "0xROUTER" "0xFEE_RECIPIENT" 100
```

## 🔗 Integration with PayWiser

### 1. Circle Wallet Integration
```javascript
// Accept payment from Circle wallet
await payWiserContract.acceptPayment(
  merchantAddress,
  customerAddress, 
  usdcAddress,
  amount,
  paymentId
);
```

### 2. Settlement Trigger
```javascript
// Merchant initiates settlement
await payWiserContract.initiateSettlement(
  usdcAddress,
  amount,
  { value: gasQuote }
);
```

### 3. Status Monitoring
```javascript
// Check settlement status
const status = await hyperlaneService.getSettlementStatus(
  messageId,
  fromChain,
  toChain
);
```

## 🌐 Frontend Integration

### Settlement Dashboard Component
```javascript
// Example React component for settlement dashboard
function SettlementDashboard({ merchantAddress }) {
  const [pendingBalance, setPendingBalance] = useState('0');
  const [gasEstimate, setGasEstimate] = useState('0');
  
  const triggerSettlement = async () => {
    const estimate = await axios.post('/api/settlement/estimate', {
      fromChain: 'sepolia',
      toChain: preferredChain,
      amount: pendingBalance
    });
    
    const settlement = await axios.post('/api/settlement/execute', {
      fromChain: 'sepolia',
      toChain: preferredChain,
      merchantAddress,
      tokenAddress: usdcAddress,
      amount: pendingBalance,
      settlementAddress: merchantWallet
    });
  };
}
```

## 📊 Monitoring & Analytics

- **Settlement Volume**: Track total cross-chain settlement volume
- **Gas Costs**: Monitor gas usage and optimization opportunities  
- **Settlement Times**: Measure average settlement completion time
- **Chain Distribution**: Analyze payment vs settlement chain preferences

## 🛠️ Development

### Project Structure
```
hyperlane-settlement/
├── contracts/              # Solidity smart contracts
├── src/                    # Node.js service code
│   ├── hyperlaneService.js # Hyperlane SDK integration
│   ├── routes/            # API route handlers
│   └── index.js           # Express server
├── scripts/               # Deployment scripts
├── test/                  # Contract tests
└── deployments/           # Deployment artifacts
```

### Contributing
1. Fork the repository
2. Create feature branch
3. Add tests for new functionality
4. Submit pull request

## 🆘 Troubleshooting

### Common Issues

1. **"Unsupported chain" Error**
   - Update `HYPERLANE_CHAINS` configuration
   - Ensure chain ID matches Hyperlane domain

2. **Gas Estimation Failures**
   - Check Hyperlane router addresses
   - Verify RPC endpoints are accessible

3. **Settlement Timeouts**
   - Monitor Hyperlane message delivery
   - Check destination chain finality

4. **Contract Deployment Fails**
   - Ensure sufficient ETH for gas
   - Verify constructor parameters

### Debug Mode
Set `NODE_ENV=development` for detailed logging.

## 📞 Support

- **Documentation**: See `/docs` folder for detailed guides
- **API Reference**: Available at `http://localhost:3001`
- **Issues**: GitHub issues for bug reports and feature requests

---

**Built for ETHGlobal NYC 2024 - PayWiser Project**

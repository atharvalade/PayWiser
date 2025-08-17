# PayWiser API Documentation

**Base URL**: `https://edited-injection-volt-sara.trycloudflare.com`  
**Version**: 1.0.0  
**Protocol**: HTTPS  

## Overview

PayWiser API provides face recognition-based payment services with Circle Wallets and Hyperlane cross-chain settlement. Users can register with face biometrics, create gasless wallets, and merchants can accept payments through face verification.

## Authentication

Currently, no authentication is required for API endpoints. All endpoints are publicly accessible.

## Content Types

- **Request**: `application/json` (except file uploads which use `multipart/form-data`)
- **Response**: `application/json`

---

## 🏥 Health & Status

### GET /api/health

Check API server status and service availability.

**Response:**
```json
{
  "status": "OK",
  "message": "PayWiser API Server is running", 
  "timestamp": "2025-08-17T11:44:45.791Z",
  "services": {
    "database": "Connected",
    "faceRecognition": "Available", 
    "circleWallets": "Available",
    "hyperlaneSettlement": "Available"
  }
}
```

---

## 👤 User Endpoints

### POST /api/user/register

Register a new user with face recognition biometrics.

**Content-Type**: `multipart/form-data`

**Parameters:**
- `name` (string, required): User's full name
- `faceImage` (file, required): Clear face photo (JPG/PNG, max 5MB)

**Request Example:**
```bash
curl -X POST https://edited-injection-volt-sara.trycloudflare.com/api/user/register \
  -F "name=John Doe" \
  -F "faceImage=@user_face.jpg"
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "ec0c784c-6eb6-4b9b-a9fc-29ded1676e18",
    "name": "John Doe", 
    "created": "2025-08-17T11:45:16.120Z",
    "wallets": []
  }
}
```

**Error Responses:**
- `400`: Missing name or face image
- `400`: No valid face detected in image
- `409`: User with similar face already exists

---

### POST /api/user/create-wallet

Create a new Circle wallet for a user on specified blockchain.

**Content-Type**: `application/json`

**Parameters:**
- `userId` (string, required): User ID from registration
- `chain` (string, required): Blockchain name (`ETH-SEPOLIA` or `ARB-SEPOLIA`)

**Request Example:**
```json
{
  "userId": "ec0c784c-6eb6-4b9b-a9fc-29ded1676e18",
  "chain": "ETH-SEPOLIA"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Wallet created successfully",
  "wallet": {
    "id": "49d6b515-e7e1-5f03-a082-1b3d02099e3d",
    "address": "0xf43c629cbeed8134b8365bda0e69b4b51fd20584",
    "chain": "ETH-SEPOLIA",
    "custodyType": "DEVELOPER"
  }
}
```

**Error Responses:**
- `400`: Missing userId or chain
- `404`: User not found
- `409`: User already has wallet on this chain

---

### GET /api/user/balance/{userId}

Get user's wallet balances across all chains.

**Path Parameters:**
- `userId` (string, required): User ID

**Request Example:**
```bash
curl https://edited-injection-volt-sara.trycloudflare.com/api/user/balance/ec0c784c-6eb6-4b9b-a9fc-29ded1676e18
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Balances retrieved successfully",
  "user": {
    "id": "ec0c784c-6eb6-4b9b-a9fc-29ded1676e18",
    "name": "John Doe"
  },
  "balances": [
    {
      "chain": "ETH-SEPOLIA",
      "address": "0xf43c629cbeed8134b8365bda0e69b4b51fd20584",
      "tokens": [
        {
          "amount": "100.0",
          "token": {
            "id": "usdc-token-id",
            "symbol": "USDC",
            "decimals": 6
          }
        }
      ],
      "walletId": "49d6b515-e7e1-5f03-a082-1b3d02099e3d"
    }
  ]
}
```

---

### GET /api/user/{userId}

Get user details and wallet information.

**Path Parameters:**
- `userId` (string, required): User ID

**Success Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "ec0c784c-6eb6-4b9b-a9fc-29ded1676e18",
    "name": "John Doe",
    "wallets": [
      {
        "id": "49d6b515-e7e1-5f03-a082-1b3d02099e3d",
        "address": "0xf43c629cbeed8134b8365bda0e69b4b51fd20584",
        "chain": "ETH-SEPOLIA",
        "created": "2025-08-17T11:48:05.839Z"
      }
    ],
    "created": "2025-08-17T11:45:16.120Z",
    "lastLogin": "2025-08-17T11:45:16.120Z"
  }
}
```

---

### GET /api/user/chains/supported

Get list of supported blockchain networks for wallet creation.

**Success Response (200):**
```json
{
  "success": true,
  "supportedChains": ["ETH-SEPOLIA", "ARB-SEPOLIA"],
  "chainDetails": {
    "ETH-SEPOLIA": {
      "name": "Ethereum Sepolia",
      "symbol": "ETH",
      "testnet": true
    },
    "ARB-SEPOLIA": {
      "name": "Arbitrum Sepolia", 
      "symbol": "ETH",
      "testnet": true
    }
  }
}
```

---

## 🏪 Merchant Endpoints

### POST /api/merchant/identify

Identify a user through face recognition scan.

**Content-Type**: `multipart/form-data`

**Parameters:**
- `userImage` (file, required): Photo of user's face (JPG/PNG, max 5MB)

**Request Example:**
```bash
curl -X POST https://edited-injection-volt-sara.trycloudflare.com/api/merchant/identify \
  -F "userImage=@customer_face.jpg"
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "User identified successfully",
  "user": {
    "id": "ec0c784c-6eb6-4b9b-a9fc-29ded1676e18",
    "name": "John Doe",
    "wallets": [
      {
        "id": "49d6b515-e7e1-5f03-a082-1b3d02099e3d",
        "address": "0xf43c629cbeed8134b8365bda0e69b4b51fd20584",
        "chain": "ETH-SEPOLIA",
        "created": "2025-08-17T11:48:05.839Z"
      }
    ]
  },
  "verification": {
    "distance": 0.12,
    "threshold": 0.68,
    "confidence": "82.35"
  }
}
```

**Error Responses:**
- `400`: No image provided or no face detected
- `404`: No matching user found

---

### POST /api/merchant/transfer

Transfer assets from user to merchant.

**Content-Type**: `application/json`

**Parameters:**
- `userId` (string, required): User ID from identification
- `amount` (string, required): Transfer amount (e.g., "10.0")
- `chain` (string, required): Blockchain for transfer
- `merchantAddress` (string, required): Merchant's wallet address
- `tokenSymbol` (string, optional): Token symbol (default: "USDC")

**Request Example:**
```json
{
  "userId": "ec0c784c-6eb6-4b9b-a9fc-29ded1676e18",
  "amount": "25.50",
  "chain": "ETH-SEPOLIA", 
  "merchantAddress": "0x851ca80Bd4029382d470081f90Eb0dD40B430dfd",
  "tokenSymbol": "USDC"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Transfer completed successfully",
  "transaction": {
    "id": "tx-uuid-12345",
    "txHash": "0xabc123...",
    "amount": "25.50",
    "token": "USDC",
    "chain": "ETH-SEPOLIA",
    "status": "CONFIRMED",
    "fromUser": "John Doe",
    "toMerchant": "0x851ca80Bd4029382d470081f90Eb0dD40B430dfd"
  }
}
```

**Error Responses:**
- `400`: Missing required parameters or insufficient balance
- `404`: User not found or no wallet on specified chain

---

### GET /api/merchant/balance

Get merchant's real-time balance across all supported chains.

**Query Parameters:**
- `merchantAddress` (string, required): Merchant's wallet address

**Request Example:**
```bash
curl "https://edited-injection-volt-sara.trycloudflare.com/api/merchant/balance?merchantAddress=0x851ca80Bd4029382d470081f90Eb0dD40B430dfd"
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Merchant balances retrieved successfully",
  "merchantAddress": "0x851ca80Bd4029382d470081f90Eb0dD40B430dfd",
  "balances": [
    {
      "chain": "ETH-SEPOLIA",
      "raw": "10000000",
      "formatted": "10.0",
      "decimals": "6", 
      "symbol": "USDC",
      "address": "0x851ca80Bd4029382d470081f90Eb0dD40B430dfd"
    },
    {
      "chain": "ARB-SEPOLIA",
      "raw": "5000000",
      "formatted": "5.0",
      "decimals": "6",
      "symbol": "USDC", 
      "address": "0x851ca80Bd4029382d470081f90Eb0dD40B430dfd"
    }
  ],
  "totalBalance": "15.000000",
  "supportedChains": ["ETH-SEPOLIA", "ARB-SEPOLIA", "POLYGON-AMOY", "BASE-SEPOLIA"]
}
```

---

### POST /api/merchant/settle

Settle merchant funds to a different chain using Hyperlane.

**Content-Type**: `application/json`

**Parameters:**
- `merchantAddress` (string, required): Merchant's wallet address
- `originChain` (string, required): Source blockchain
- `destinationChain` (string, required): Target blockchain
- `amount` (string, required): Amount to settle
- `privateKey` (string, required): Private key for signing (demo only)

**Request Example:**
```json
{
  "merchantAddress": "0x851ca80Bd4029382d470081f90Eb0dD40B430dfd",
  "originChain": "ETH-SEPOLIA",
  "destinationChain": "BASE-SEPOLIA", 
  "amount": "5.0",
  "privateKey": "mock-key-for-demo"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Settlement completed successfully",
  "settlement": {
    "txHash": "0x46664fb7d404f",
    "blockNumber": 5578857,
    "gasUsed": "194689",
    "originChain": "ETH-SEPOLIA", 
    "destinationChain": "BASE-SEPOLIA",
    "amount": "5.0",
    "merchantAddress": "0x851ca80Bd4029382d470081f90Eb0dD40B430dfd",
    "status": "completed",
    "note": "Mock settlement for demo purposes"
  },
  "gasEstimate": {
    "gasLimit": "200000",
    "gasPrice": "103973350", 
    "gasCost": "20794670000000",
    "gasCostFormatted": "0.00002079467",
    "originChain": "ETH-SEPOLIA",
    "destinationChain": "BASE-SEPOLIA"
  }
}
```

**Error Responses:**
- `400`: Invalid chains or insufficient balance
- `500`: Settlement execution failed

---

### GET /api/merchant/transactions

Get merchant's transaction history.

**Query Parameters:**
- `merchantId` (string, optional): Merchant ID (default: "hardcoded-merchant")
- `limit` (number, optional): Maximum results (default: 50)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Transactions retrieved successfully",
  "transactions": [
    {
      "id": "tx-uuid-123",
      "fromUserId": "ec0c784c-6eb6-4b9b-a9fc-29ded1676e18",
      "toMerchantId": "hardcoded-merchant",
      "amount": "25.50",
      "token": "USDC",
      "chain": "ETH-SEPOLIA",
      "txHash": "0xabc123...",
      "status": "CONFIRMED",
      "created": "2025-08-17T12:00:00.000Z"
    }
  ],
  "totalCount": 1
}
```

---

### GET /api/merchant/chains/settlement

Get supported chains for cross-chain settlement.

**Success Response (200):**
```json
{
  "success": true,
  "supportedChains": ["ETH-SEPOLIA", "ARB-SEPOLIA", "POLYGON-AMOY", "BASE-SEPOLIA"],
  "chainDetails": {
    "ETH-SEPOLIA": {"name": "Ethereum Sepolia", "symbol": "ETH"},
    "ARB-SEPOLIA": {"name": "Arbitrum Sepolia", "symbol": "ETH"},
    "POLYGON-AMOY": {"name": "Polygon Amoy", "symbol": "MATIC"},
    "BASE-SEPOLIA": {"name": "Base Sepolia", "symbol": "ETH"}
  }
}
```

---

## 📱 iOS App Integration Guidelines

### Image Upload Best Practices

1. **Face Images**: 
   - Use front-facing camera
   - Ensure good lighting
   - Face should be clearly visible and centered
   - Supported formats: JPG, PNG
   - Max file size: 5MB
   - Recommended resolution: 1080x1080 or higher

2. **Image Processing**:
   - Compress images before upload to reduce bandwidth
   - Add loading indicators for face recognition operations
   - Handle camera permissions properly

### Error Handling

All API responses include a `success` boolean field. Handle errors gracefully:

```swift
if response.success == false {
    // Show error message from response.message
    showAlert(message: response.message)
}
```

### Face Recognition Flow

1. **User Registration**:
   ```
   Capture Face → POST /api/user/register → Store User ID
   ```

2. **Wallet Creation**:
   ```
   Select Chain → POST /api/user/create-wallet → Display Address
   ```

3. **Merchant Payment**:
   ```
   Capture Face → POST /api/merchant/identify → GET User Info
   Enter Amount → POST /api/merchant/transfer → Show Success
   ```

4. **Settlement**:
   ```
   Check Balance → Select Destination → POST /api/merchant/settle
   ```

### Real-time Updates

For balance updates, implement polling or refresh mechanisms:
- Poll `/api/user/balance/{userId}` every 10-30 seconds on balance screen
- Poll `/api/merchant/balance` during merchant screens
- Refresh after successful transactions

### Security Considerations

- Always use HTTPS endpoints
- Validate image data before upload
- Handle biometric data with privacy in mind
- Consider implementing request timeouts
- Add retry logic for network failures

---

## 🔧 Testing

You can test all endpoints using the provided curl examples. The API server is running at:
**https://edited-injection-volt-sara.trycloudflare.com**

All endpoints are fully functional and ready for iOS app integration!

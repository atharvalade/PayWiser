# FacePay API Documentation

Complete API reference for the FacePay system's face recognition and blockchain payment services.

## 📋 Table of Contents

1. [DeepFace API](#deepface-api)
2. [Blockchain API](#blockchain-api)
3. [Error Handling](#error-handling)
4. [Authentication](#authentication)
5. [Rate Limits](#rate-limits)

---

## 🤖 DeepFace API

**Base URL:** `http://10.8.216.42:8000`

The DeepFace API handles face recognition, registration, and user management using advanced machine learning models.

### Technology Stack
- **Framework:** FastAPI
- **ML Model:** VGG-Face with OpenCV detector
- **Database:** Supabase PostgreSQL
- **Confidence Threshold:** 0.4

---

### 1. Health Check

**Endpoint:** `GET /`  
**Description:** Check if the API service is running

#### Request
```http
GET http://10.8.216.42:8000/
```

#### Response
```json
{
  "status": "running",
  "service": "FacePay DeepFace API",
  "version": "1.0.0"
}
```

#### Status Codes
- `200 OK` - Service is running normally
- `502 Bad Gateway` - Service is down or starting up

---

### 2. Health Endpoint

**Endpoint:** `GET /health`  
**Description:** Detailed health status with system information

#### Request
```http
GET http://10.8.216.42:8000/health
```

#### Response
```json
{
  "status": "healthy",
  "timestamp": "2025-01-23T20:10:08Z",
  "version": "1.0.0",
  "environment": "development"
}
```

---

### 3. Register Face

**Endpoint:** `POST /register-face`  
**Description:** Register a user's face for future recognition

#### Request
```http
POST http://10.8.216.42:8000/register-face
Content-Type: multipart/form-data
```

#### Form Data Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | string | Yes | Unique identifier for the user |
| `walletAddress` | string | Yes | Ethereum wallet address (0x...) |
| `images` | file[] | Yes | 1-3 face images (JPEG/PNG) |
| `userType` | string | No | "consumer" or "merchant" (default: "consumer") |

#### Example Request (cURL)
```bash
curl -X POST "http://10.8.216.42:8000/register-face" \
  -F "userId=user1" \
  -F "walletAddress=0x9f93EebD463d4B7c991986a082d974E77b5a02Dc" \
  -F "images=@photo1.jpg" \
  -F "images=@photo2.jpg" \
  -F "images=@photo3.jpg" \
  -F "userType=consumer"
```

#### Success Response
```json
{
  "message": "Face registered successfully for user1",
  "userId": "user1",
  "walletAddress": "0x9f93EebD463d4B7c991986a082d974E77b5a02Dc",
  "imagesProcessed": 3,
  "model": "VGG-Face",
  "threshold": 0.4
}
```

#### Error Response
```json
{
  "message": "Registration failed: No face detected in image",
  "error": "FACE_NOT_DETECTED"
}
```

#### Status Codes
- `200 OK` - Registration successful
- `400 Bad Request` - Invalid input data
- `422 Unprocessable Entity` - Face detection failed
- `500 Internal Server Error` - Database or processing error

---

### 4. Recognize Face

**Endpoint:** `POST /recognize-face`  
**Description:** Identify a user from a face image

#### Request
```http
POST http://10.8.216.42:8000/recognize-face
Content-Type: multipart/form-data
```

#### Form Data Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `image` | file | Yes | Face image to recognize (JPEG/PNG) |

#### Example Request (cURL)
```bash
curl -X POST "http://10.8.216.42:8000/recognize-face" \
  -F "image=@test_photo.jpg"
```

#### Success Response (Face Recognized)
```json
{
  "userId": "user1",
  "walletAddress": "0x9f93EebD463d4B7c991986a082d974E77b5a02Dc",
  "confidence": 0.2866,
  "model": "VGG-Face",
  "threshold": 0.4,
  "verified": true
}
```

#### Error Response (Face Not Recognized)
```json
{
  "message": "No matching face found in database",
  "error": "FACE_NOT_RECOGNIZED",
  "confidence": null
}
```

#### Status Codes
- `200 OK` - Recognition completed (check `verified` field)
- `400 Bad Request` - Invalid image format
- `422 Unprocessable Entity` - No face detected in image
- `500 Internal Server Error` - Processing error

---

## ⛓️ Blockchain API

**Base URL:** `https://face-pay-py-usd-node-api-blockchain.vercel.app`

The Blockchain API handles PyUSD token transactions on the Sepolia testnet.

### Technology Stack
- **Framework:** Node.js/Express
- **Network:** Ethereum Sepolia Testnet
- **Token:** PyUSD (0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9)
- **Deployment:** Vercel

---

### 1. Get Balance

**Endpoint:** `GET /balance/{address}`  
**Description:** Get PyUSD balance for a wallet address

#### Request
```http
GET https://face-pay-py-usd-node-api-blockchain.vercel.app/balance/0x9f93EebD463d4B7c991986a082d974E77b5a02Dc
```

#### URL Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `address` | string | Yes | Ethereum wallet address (0x...) |

#### Example Request (cURL)
```bash
curl -X GET "https://face-pay-py-usd-node-api-blockchain.vercel.app/balance/0x9f93EebD463d4B7c991986a082d974E77b5a02Dc"
```

#### Success Response
```json
{
  "balance": "108.40",
  "address": "0x9f93EebD463d4B7c991986a082d974E77b5a02Dc",
  "token": "PyUSD",
  "network": "Sepolia"
}
```

#### Error Response
```json
{
  "error": "Invalid wallet address",
  "message": "Address must be a valid Ethereum address"
}
```

#### Status Codes
- `200 OK` - Balance retrieved successfully
- `400 Bad Request` - Invalid wallet address
- `500 Internal Server Error` - Network or contract error

---

### 2. Send Payment

**Endpoint:** `POST /send-payment`  
**Description:** Transfer PyUSD tokens between wallets

#### Request
```http
POST https://face-pay-py-usd-node-api-blockchain.vercel.app/send-payment
Content-Type: application/json
```

#### Request Body
```json
{
  "fromPrivateKey": "15953296e322c945eaa0c215f8740fcdb1cb18231d19e477efa91ae4310becdf",
  "toAddress": "0x27A7A44250C6Eb3C84d1d894c8A601742827C7C7",
  "amount": "5.00"
}
```

#### Body Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `fromPrivateKey` | string | Yes | Private key of sender wallet (64 chars) |
| `toAddress` | string | Yes | Recipient wallet address (0x...) |
| `amount` | string | Yes | Amount to transfer (decimal string) |

#### Example Request (cURL)
```bash
curl -X POST "https://face-pay-py-usd-node-api-blockchain.vercel.app/send-payment" \
  -H "Content-Type: application/json" \
  -d '{
    "fromPrivateKey": "15953296e322c945eaa0c215f8740fcdb1cb18231d19e477efa91ae4310becdf",
    "toAddress": "0x27A7A44250C6Eb3C84d1d894c8A601742827C7C7",
    "amount": "5.00"
  }'
```

#### Success Response
```json
{
  "transactionHash": "0x047857335bb3c1b682f3f51cba40ed6edeb243d68e6911bc932e61ee3dadd6eb",
  "from": "0x9f93EebD463d4B7c991986a082d974E77b5a02Dc",
  "to": "0x27A7A44250C6Eb3C84d1d894c8A601742827C7C7",
  "amount": "5.00",
  "token": "PyUSD",
  "network": "Sepolia",
  "gasUsed": "65000",
  "status": "success"
}
```

#### Error Response
```json
{
  "error": "Insufficient balance",
  "message": "Account balance (1.50 PyUSD) is less than transfer amount (5.00 PyUSD)",
  "currentBalance": "1.50"
}
```

#### Status Codes
- `200 OK` - Transaction successful
- `400 Bad Request` - Invalid parameters
- `402 Payment Required` - Insufficient balance
- `500 Internal Server Error` - Network or contract error

---

### 3. Transaction Status

**Endpoint:** `GET /transaction/{hash}`  
**Description:** Get transaction status and details

#### Request
```http
GET https://face-pay-py-usd-node-api-blockchain.vercel.app/transaction/0x047857335bb3c1b682f3f51cba40ed6edeb243d68e6911bc932e61ee3dadd6eb
```

#### URL Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `hash` | string | Yes | Transaction hash (0x...) |

#### Success Response
```json
{
  "hash": "0x047857335bb3c1b682f3f51cba40ed6edeb243d68e6911bc932e61ee3dadd6eb",
  "status": "confirmed",
  "blockNumber": 4521367,
  "from": "0x9f93EebD463d4B7c991986a082d974E77b5a02Dc",
  "to": "0x27A7A44250C6Eb3C84d1d894c8A601742827C7C7",
  "amount": "5.00",
  "gasUsed": "65000",
  "timestamp": "2025-01-23T20:15:30Z"
}
```

---

## ⚠️ Error Handling

### Common Error Codes

| HTTP Code | Error Type | Description |
|-----------|------------|-------------|
| `400` | Bad Request | Invalid request parameters |
| `401` | Unauthorized | Authentication required |
| `402` | Payment Required | Insufficient funds |
| `422` | Unprocessable Entity | Data validation failed |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Internal Server Error | Server processing error |
| `502` | Bad Gateway | Service temporarily unavailable |

### Error Response Format

All APIs return errors in this format:

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable error description",
  "timestamp": "2025-01-23T20:10:08Z",
  "path": "/api/endpoint"
}
```

---

## 🔐 Authentication

### DeepFace API
- **Type:** None (Local development)
- **Production:** Should implement API keys

### Blockchain API
- **Type:** Private Key Authentication
- **Method:** Include private key in request body
- **Security:** Use HTTPS for all requests

---

## 🚦 Rate Limits

### DeepFace API (Local)
- **Limit:** No enforced limits
- **Recommendation:** Max 10 requests/minute for face recognition

### Blockchain API (Vercel)
- **Limit:** 100 requests/hour per IP
- **Headers:** Rate limit info in response headers
  - `X-RateLimit-Limit: 100`
  - `X-RateLimit-Remaining: 95`
  - `X-RateLimit-Reset: 1642946400`

---

## 🔗 Integration Examples

### iOS Swift Integration

```swift
// Face Registration
func registerFace(images: [UIImage]) async throws -> String {
    let url = URL(string: "http://10.8.216.42:8000/register-face")!
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    
    // Create multipart form data
    let boundary = UUID().uuidString
    request.setValue("multipart/form-data; boundary=\(boundary)", 
                     forHTTPHeaderField: "Content-Type")
    
    // Add form fields and images...
    let (data, _) = try await URLSession.shared.data(for: request)
    return try JSONDecoder().decode(RegisterResponse.self, from: data).message
}

// Blockchain Payment
func sendPayment(amount: String) async throws -> String {
    let url = URL(string: "https://face-pay-py-usd-node-api-blockchain.vercel.app/send-payment")!
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    
    let payment = PaymentRequest(
        fromPrivateKey: "your_private_key",
        toAddress: "0x...",
        amount: amount
    )
    request.httpBody = try JSONEncoder().encode(payment)
    
    let (data, _) = try await URLSession.shared.data(for: request)
    return try JSONDecoder().decode(PaymentResponse.self, from: data).transactionHash
}
```

### JavaScript Integration

```javascript
// Face Recognition
async function recognizeFace(imageFile) {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    const response = await fetch('http://10.8.216.42:8000/recognize-face', {
        method: 'POST',
        body: formData
    });
    
    return await response.json();
}

// Get Balance
async function getBalance(address) {
    const response = await fetch(
        `https://face-pay-py-usd-node-api-blockchain.vercel.app/balance/${address}`
    );
    return await response.json();
}
```

---

## 📞 Support

### DeepFace API Issues
- **Logs:** Check local server console output
- **Common Issues:** Face detection failures, image format problems

### Blockchain API Issues
- **Network:** Verify Sepolia testnet connectivity
- **Gas Fees:** Ensure sufficient ETH for gas
- **Token Balance:** Verify PyUSD token balance

---

## 🔄 API Versions

### Current Versions
- **DeepFace API:** v1.0.0
- **Blockchain API:** v1.0.0

### Changelog
- **v1.0.0** - Initial release with face recognition and PyUSD payments

---

*This documentation is for the FacePay demo system. For production use, implement proper authentication, rate limiting, and error handling.* 
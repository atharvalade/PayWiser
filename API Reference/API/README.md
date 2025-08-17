# FacePay API Backend

Face recognition and blockchain backend for FacePay iOS app.

## 🚀 Features

- **Face Recognition**: Register and recognize faces using face-api.js
- **Blockchain Integration**: PyUSD payments on Sepolia testnet
- **Database**: Supabase for storing face embeddings and user data
- **PayPal Integration**: Sandbox authentication
- **Real-time Balance Checking**: Live PYUSD balance queries

## 📋 API Endpoints

### Health Check
```
GET /health
```

### Face Recognition
```
POST /register-face
Content-Type: multipart/form-data
Body: {
  userId: string,
  walletAddress: string,
  images: File[] (up to 3 images)
}

POST /recognize-face  
Content-Type: multipart/form-data
Body: {
  image: File
}
```

### Blockchain
```
GET /balance/:address
Returns PYUSD balance for wallet address

POST /charge
Body: {
  customerAddress: string,
  amount: number
}
Returns transaction hash and details

GET /transactions/:address
Returns transaction history (placeholder)
```

## 🛠 Setup

### 1. Database Setup
Execute the SQL in `database-setup.sql` in your Supabase SQL Editor:
```sql
-- Creates tables: face_embeddings, user_sessions, payment_history
-- Sets up RLS policies and indexes
```

### 2. Install Dependencies
```bash
cd API
npm install
```

### 3. Configure Environment
All credentials are already configured in `config.js`.

### 4. Run Locally
```bash
npm run dev
```

### 5. Deploy to Vercel
```bash
vercel --prod
```

## 🔧 Configuration

The API uses these key configurations:

### Wallets
- **User 1**: `0x9f93EebD463d4B7c991986a082d974E77b5a02Dc` (117.89 PYUSD)
- **User 2**: `0xa999F0CB16b55516BD82fd77Dc19f495b41f0770` (94.01 PYUSD)  
- **Merchant**: `0x27A7A44250C6Eb3C84d1d894c8A601742827C7C7` (188.10 PYUSD)

### Smart Contracts
- **PaymentHub**: `0x728d0f06Bf6D63B4bC9ca7C879D042DDAC66e8A3`
- **PYUSD**: `0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9`

### Database
- **Supabase**: `https://nugfkvafpxuaspphxxmd.supabase.co`

## 📱 iOS Integration

### Face Registration Flow
1. User signs in with PayPal
2. Take 3 photos of user's face
3. POST to `/register-face` with userId and walletAddress
4. Face embeddings stored in database

### Payment Flow  
1. Merchant enters amount
2. Take photo of customer
3. POST to `/recognize-face` to identify user
4. POST to `/charge` with customerAddress and amount
5. Transaction executed on blockchain

### Balance Checking
```swift
let url = "https://your-api.vercel.app/balance/\(walletAddress)"
// Returns current PYUSD balance
```

## 🧪 Testing

Test the blockchain functionality:
```bash
cd ../contracts
npx hardhat check-balances --network sepolia
npx hardhat simulate-payment --customer user1 --amount 5.99 --network sepolia
```

Test the API:
```bash
curl http://localhost:3000/health
curl http://localhost:3000/balance/0x9f93EebD463d4B7c991986a082d974E77b5a02Dc
```

## 🏗 Architecture

```
iOS App
    ↓
FacePay API (Node.js/Express)
    ↓
├── Face-API.js (Face Recognition)
├── Supabase (Database)
├── Ethers.js (Blockchain)
└── PayPal SDK (Authentication)
```

## 🚨 Security Note

This is a hackathon project. Private keys are hardcoded for demo purposes. 
In production, use proper key management and environment variables.

## 📊 Status

- ✅ **Blockchain**: Deployed and tested
- ✅ **Face Recognition**: API ready
- ✅ **Database**: Schema created
- 🔄 **iOS App**: Next step
- 🔄 **PayPal Integration**: Next step

---

Ready for iOS app development! 🎉 
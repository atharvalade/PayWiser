# PayWiser Circle Wallet Demo

A demonstration of Circle's programmable wallets and gasless transactions integration for the PayWiser project.

## 🚀 Features

- **Programmable Wallets**: Create Circle wallets programmatically for users
- **Gasless Transactions**: Send payments without users needing to hold native tokens for gas
- **Multi-Chain Support**: Support for Ethereum, Polygon, and other EVM chains
- **Real-time Dashboard**: Web interface for testing wallet creation and transactions
- **Transaction History**: View and track all user transactions
- **Payment Requests**: Create payment requests for merchant functionality

## 🛠️ Technologies Used

- **Backend**: Node.js, Express.js
- **Frontend**: Vanilla JavaScript, Tailwind CSS
- **Blockchain**: Circle SDK, Programmable Wallets
- **APIs**: Circle REST APIs

## 📋 Prerequisites

- Node.js 18+ 
- Circle API Key (Sandbox)
- NPM or Yarn

## 🔧 Installation

1. **Clone the repository**
   ```bash
   cd "PayWiser - ETHGlobal NYC"
   cd paywiser-circle-demo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure API Key**
   
   The Circle API key is already configured in `config.js`:
   ```javascript
   apiKey: 'TEST_API_KEY:09caad2f987ab4e665cf39ff2b737503:c1a3fb20402b632a948bd1232ae4aad4'
   ```

4. **Start the server**
   ```bash
   npm start
   ```

5. **Open the demo**
   
   Navigate to `http://localhost:3000` in your browser

## 🧪 Testing

Run the test suite to verify functionality:

```bash
npm test
```

This will test:
- Circle SDK connection
- User registration and wallet creation
- Payment flows
- Transaction history
- System statistics

## 📖 API Documentation

### Endpoints

- `POST /api/wallets/register` - Register new user and create wallet
- `GET /api/wallets/user/:userId` - Get user and wallet information
- `GET /api/wallets/balance/:userId` - Get wallet balance
- `POST /api/wallets/send` - Send gasless payment
- `GET /api/wallets/transactions/:userId` - Get transaction history
- `POST /api/wallets/payment-request` - Create payment request
- `GET /api/wallets/users` - List all users
- `GET /api/wallets/stats` - Get system statistics

### Example Usage

**Register a new user:**
```bash
curl -X POST http://localhost:3000/api/wallets/register \\
  -H "Content-Type: application/json" \\
  -d '{
    "userId": "alice123",
    "name": "Alice Johnson",
    "email": "alice@example.com"
  }'
```

**Send a gasless payment:**
```bash
curl -X POST http://localhost:3000/api/wallets/send \\
  -H "Content-Type: application/json" \\
  -d '{
    "fromUserId": "alice123",
    "toUserId": "bob456",
    "amount": "10.00",
    "memo": "Coffee payment"
  }'
```

## 🌐 Web Interface

The demo includes a comprehensive web interface with:

### User Management
- **Register Users**: Create new users with Circle wallets
- **User Lookup**: Search and view user details and balances
- **User Directory**: Browse all registered users

### Payment Features
- **Send Payments**: Transfer funds between users (gasless)
- **Transaction History**: View transaction records
- **Payment Requests**: Create merchant payment requests

### Dashboard
- **Real-time Stats**: View system statistics
- **User Analytics**: Track user registration and activity
- **Transaction Monitoring**: Monitor payment flows

## 🔗 Circle Integration Details

### Wallet Creation
- Uses Circle's Programmable Wallets API
- Creates Smart Contract Accounts (SCA) for gasless transactions
- Supports multiple blockchain networks (ETH, MATIC)

### Gasless Transactions
- Leverages Circle's Gas Station feature
- No need for users to hold native tokens
- Automatic gas fee sponsorship

### Security Features
- API key authentication
- Secure wallet management
- Transaction verification

## 🏗️ Architecture

```
PayWiser Circle Demo
├── src/
│   ├── services/
│   │   ├── circleClient.js     # Circle SDK integration
│   │   └── walletService.js    # High-level wallet management
│   ├── routes/
│   │   └── walletRoutes.js     # API endpoints
│   ├── index.js                # Express server
│   └── test.js                 # Test suite
├── public/
│   ├── index.html              # Demo interface
│   └── app.js                  # Frontend JavaScript
├── config.js                   # Configuration
└── package.json                # Dependencies
```

## 🚦 Current Status

✅ **Completed Features:**
- Circle SDK integration
- Wallet creation API
- Gasless transaction setup
- Web demo interface
- Transaction history
- User management
- Payment requests

⏳ **Next Steps for Full PayWiser:**
- Face recognition integration
- SAGA chain integration for face embeddings
- Bluetooth geofencing for proximity payments
- Hyperlane interchain accounts
- Mobile app development
- Advanced security features

## 🔐 Security Considerations

- API keys are configured for sandbox environment
- In production, implement proper environment variable management
- Add rate limiting and input validation
- Implement user authentication and authorization
- Add transaction monitoring and fraud detection

## 📚 Resources

- [Circle Developer Documentation](https://developers.circle.com/)
- [Circle Programmable Wallets](https://developers.circle.com/w3s/programmable-wallets)
- [Circle SDK Documentation](https://developers.circle.com/circle-mint/circle-sdks)
- [Gas Station Documentation](https://developers.circle.com/w3s/gas-station)

## 🆘 Troubleshooting

**Common Issues:**

1. **API Key Errors**: Ensure the Circle API key is correctly configured
2. **Network Issues**: Check internet connection and Circle service status
3. **Transaction Failures**: Verify user wallet balances and transaction parameters
4. **CORS Errors**: Ensure frontend URL is properly configured

**Debug Mode:**

Enable debug logging by setting `NODE_ENV=development` in your environment.

## 📄 License

This demo is part of the PayWiser project for ETHGlobal NYC hackathon.

---

**Built with ❤️ for ETHGlobal NYC 2024**

import express from 'express';
import cors from 'cors';
import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Blockchain configuration
const SEPOLIA_RPC = "https://sepolia.infura.io/v3/40f21c9a3e114c7d880efefc7d9b04be";
const PYUSD_ADDRESS = "0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9";
const PAYMENT_HUB_ADDRESS = "0x728d0f06Bf6D63B4bC9ca7C879D042DDAC66e8A3";

// ERC20 ABI for balance checking
const ERC20_ABI = [
    "function balanceOf(address account) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)"
];

// PaymentHub ABI
const PAYMENT_HUB_ABI = [
    "function charge(address customer, uint256 amount) external",
    "function hasApproval(address customer, uint256 amount) external view returns (bool)",
    "function getBalance(address customer) external view returns (uint256)",
    "function getAllowance(address customer) external view returns (uint256)",
    "event Charged(address indexed customer, address indexed merchant, uint256 amount, uint256 timestamp)"
];

// Demo wallet credentials
const WALLET_CREDENTIALS = {
    "0x9f93EebD463d4B7c991986a082d974E77b5a02Dc": "15953296e322c945eaa0c215f8740fcdb1cb18231d19e477efa91ae4310becdf", // User 1
    "0xa999F0CB16b55516BD82fd77Dc19f495b41f0770": "dcf06adcd2d997d57bfb5275ae3493d8afdb606d7c51c66eafbb7c5abff04d2c", // User 2
    "0x27A7A44250C6Eb3C84d1d894c8A601742827C7C7": "ffc39a39c2d5436985f83336fe8710c38a50ab49171e19ea5ca9968e7fff2492"  // Merchant
};

// Initialize provider
const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'FacePay Blockchain API'
    });
});

// Get PYUSD balance for wallet address
app.get('/balance/:address', async (req, res) => {
    try {
        const { address } = req.params;
        
        if (!ethers.isAddress(address)) {
            return res.status(400).json({
                error: 'Invalid address format'
            });
        }

        // Connect to PYUSD contract
        const pyusdContract = new ethers.Contract(PYUSD_ADDRESS, ERC20_ABI, provider);
        
        // Get balance and decimals
        const [balance, decimals] = await Promise.all([
            pyusdContract.balanceOf(address),
            pyusdContract.decimals()
        ]);
        
        // Format balance to human readable
        const formattedBalance = ethers.formatUnits(balance, decimals);
        
        res.json({
            balance: formattedBalance,
            address: address,
            token: "PyUSD",
            network: "Sepolia"
        });
        
    } catch (error) {
        console.error('Balance check error:', error);
        res.status(500).json({
            error: 'Failed to fetch balance',
            message: error.message
        });
    }
});

// Send PYUSD payment
app.post('/send-payment', async (req, res) => {
    try {
        const { fromPrivateKey, toAddress, amount } = req.body;
        
        if (!fromPrivateKey || !toAddress || !amount) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['fromPrivateKey', 'toAddress', 'amount']
            });
        }
        
        if (!ethers.isAddress(toAddress)) {
            return res.status(400).json({
                error: 'Invalid toAddress format'
            });
        }
        
        // Create wallet from private key
        const wallet = new ethers.Wallet(fromPrivateKey, provider);
        const fromAddress = wallet.address;
        
        // Connect to PYUSD contract
        const pyusdContract = new ethers.Contract(PYUSD_ADDRESS, ERC20_ABI, wallet);
        
        // Get decimals and convert amount
        const decimals = await pyusdContract.decimals();
        const amountWei = ethers.parseUnits(amount.toString(), decimals);
        
        // Check balance
        const balance = await pyusdContract.balanceOf(fromAddress);
        if (balance < amountWei) {
            const balanceFormatted = ethers.formatUnits(balance, decimals);
            return res.status(402).json({
                error: 'Insufficient balance',
                message: `Account balance (${balanceFormatted} PyUSD) is less than transfer amount (${amount} PyUSD)`,
                currentBalance: balanceFormatted
            });
        }
        
        // Execute transfer
        const tx = await pyusdContract.transfer(toAddress, amountWei, {
            gasLimit: 90000
        });
        
        // Wait for confirmation
        const receipt = await tx.wait();
        
        res.json({
            transactionHash: tx.hash,
            from: fromAddress,
            to: toAddress,
            amount: amount.toString(),
            token: "PyUSD",
            network: "Sepolia",
            gasUsed: receipt.gasUsed.toString(),
            status: "success"
        });
        
    } catch (error) {
        console.error('Payment error:', error);
        
        let statusCode = 500;
        let errorMessage = error.message;
        
        if (error.code === 'INSUFFICIENT_FUNDS') {
            statusCode = 402;
            errorMessage = 'Insufficient funds for gas fees';
        } else if (error.code === 'NETWORK_ERROR') {
            statusCode = 503;
            errorMessage = 'Network connection error';
        }
        
        res.status(statusCode).json({
            error: 'Transaction failed',
            message: errorMessage
        });
    }
});

// Charge payment using PaymentHub contract
app.post('/charge', async (req, res) => {
    try {
        const { merchantPrivateKey, customerAddress, amount } = req.body;
        
        if (!merchantPrivateKey || !customerAddress || !amount) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['merchantPrivateKey', 'customerAddress', 'amount']
            });
        }
        
        if (!ethers.isAddress(customerAddress)) {
            return res.status(400).json({
                error: 'Invalid customerAddress format'
            });
        }
        
        // Create merchant wallet from private key
        const merchantWallet = new ethers.Wallet(merchantPrivateKey, provider);
        const merchantAddress = merchantWallet.address;
        
        // Connect to PaymentHub contract
        const paymentHub = new ethers.Contract(PAYMENT_HUB_ADDRESS, PAYMENT_HUB_ABI, merchantWallet);
        const pyusdContract = new ethers.Contract(PYUSD_ADDRESS, ERC20_ABI, provider);
        
        // Get decimals and convert amount
        const decimals = await pyusdContract.decimals();
        const amountWei = ethers.parseUnits(amount.toString(), decimals);
        
        // Check customer balance
        const customerBalance = await pyusdContract.balanceOf(customerAddress);
        if (customerBalance < amountWei) {
            const balanceFormatted = ethers.formatUnits(customerBalance, decimals);
            return res.status(402).json({
                error: 'Insufficient customer balance',
                message: `Customer balance (${balanceFormatted} PyUSD) is less than charge amount (${amount} PyUSD)`,
                customerBalance: balanceFormatted
            });
        }
        
        // Check customer allowance for PaymentHub
        const allowance = await pyusdContract.allowance(customerAddress, PAYMENT_HUB_ADDRESS);
        if (allowance < amountWei) {
            const allowanceFormatted = ethers.formatUnits(allowance, decimals);
            return res.status(402).json({
                error: 'Insufficient allowance',
                message: `Customer must approve PaymentHub to spend ${amount} PyUSD. Current allowance: ${allowanceFormatted} PyUSD`,
                currentAllowance: allowanceFormatted,
                requiredAmount: amount.toString(),
                paymentHubAddress: PAYMENT_HUB_ADDRESS
            });
        }
        
        // Execute charge through PaymentHub
        const tx = await paymentHub.charge(customerAddress, amountWei, {
            gasLimit: 150000
        });
        
        // Wait for confirmation
        const receipt = await tx.wait();
        
        res.json({
            transactionHash: tx.hash,
            customer: customerAddress,
            merchant: merchantAddress,
            amount: amount.toString(),
            token: "PyUSD",
            network: "Sepolia",
            paymentHub: PAYMENT_HUB_ADDRESS,
            gasUsed: receipt.gasUsed.toString(),
            status: "success"
        });
        
    } catch (error) {
        console.error('PaymentHub charge error:', error);
        
        let statusCode = 500;
        let errorMessage = error.message;
        
        if (error.code === 'INSUFFICIENT_FUNDS') {
            statusCode = 402;
            errorMessage = 'Insufficient funds for gas fees';
        } else if (error.code === 'NETWORK_ERROR') {
            statusCode = 503;
            errorMessage = 'Network connection error';
        } else if (errorMessage.includes('InsufficientBalance')) {
            statusCode = 402;
            errorMessage = 'Customer has insufficient PyUSD balance';
        } else if (errorMessage.includes('InsufficientAllowance')) {
            statusCode = 402;
            errorMessage = 'Customer has not approved PaymentHub to spend PyUSD';
        }
        
        res.status(statusCode).json({
            error: 'PaymentHub charge failed',
            message: errorMessage
        });
    }
});

// Approve PaymentHub to spend PyUSD
app.post('/approve', async (req, res) => {
    try {
        const { userPrivateKey, amount } = req.body;
        
        if (!userPrivateKey) {
            return res.status(400).json({
                error: 'Missing required field: userPrivateKey'
            });
        }
        
        // Create user wallet from private key
        const userWallet = new ethers.Wallet(userPrivateKey, provider);
        const userAddress = userWallet.address;
        
        // Connect to PYUSD contract
        const pyusdContract = new ethers.Contract(PYUSD_ADDRESS, ERC20_ABI, userWallet);
        
        // Get decimals and convert amount (default to max approval)
        const decimals = await pyusdContract.decimals();
        const approvalAmount = amount ? 
            ethers.parseUnits(amount.toString(), decimals) : 
            ethers.MaxUint256; // Max approval if no amount specified
        
        // Execute approval
        const tx = await pyusdContract.approve(PAYMENT_HUB_ADDRESS, approvalAmount, {
            gasLimit: 80000
        });
        
        // Wait for confirmation
        const receipt = await tx.wait();
        
        const approvalAmountFormatted = amount ? amount.toString() : "unlimited";
        
        res.json({
            transactionHash: tx.hash,
            user: userAddress,
            spender: PAYMENT_HUB_ADDRESS,
            approvedAmount: approvalAmountFormatted,
            token: "PyUSD",
            network: "Sepolia",
            gasUsed: receipt.gasUsed.toString(),
            status: "success"
        });
        
    } catch (error) {
        console.error('Approval error:', error);
        res.status(500).json({
            error: 'Approval failed',
            message: error.message
        });
    }
});

// Get transaction details (placeholder)
app.get('/transaction/:hash', async (req, res) => {
    try {
        const { hash } = req.params;
        
        const receipt = await provider.getTransactionReceipt(hash);
        
        if (!receipt) {
            return res.status(404).json({
                error: 'Transaction not found'
            });
        }
        
        res.json({
            hash: receipt.hash,
            blockNumber: receipt.blockNumber,
            status: receipt.status === 1 ? 'success' : 'failed',
            gasUsed: receipt.gasUsed.toString(),
            explorerUrl: `https://sepolia.etherscan.io/tx/${hash}`
        });
        
    } catch (error) {
        console.error('Transaction lookup error:', error);
        res.status(500).json({
            error: 'Failed to fetch transaction',
            message: error.message
        });
    }
});

// Get transaction history (placeholder)
app.get('/transactions/:address', async (req, res) => {
    // This would require indexing blockchain events or using a third-party service
    // For now, return empty array
    res.json({
        address: req.params.address,
        transactions: [],
        message: 'Transaction history not implemented yet'
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'FacePay Blockchain API',
        version: '1.0.0',
        endpoints: {
            health: 'GET /health',
            balance: 'GET /balance/:address',
            sendPayment: 'POST /send-payment',
            charge: 'POST /charge (PaymentHub)',
            approve: 'POST /approve (PaymentHub)',
            transaction: 'GET /transaction/:hash',
            transactions: 'GET /transactions/:address'
        }
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: error.message
    });
});

// Start server
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 FacePay Blockchain API running on port ${PORT}`);
        console.log(`📊 Health check: http://localhost:${PORT}/health`);
        console.log(`🌐 Network access: http://10.8.216.42:${PORT}/health`);
    });
}

export default app; 
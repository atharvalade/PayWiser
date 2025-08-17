import dotenv from 'dotenv';
dotenv.config();

// Hyperlane chain configurations with REAL deployed addresses
export const HYPERLANE_CHAINS = {
  sepolia: {
    chainId: 11155111,
    domain: 11155111,
    name: 'sepolia',
    rpcUrl: process.env.SEPOLIA_RPC_URL || 'https://rpc.sepolia.org',
    interchainAccountRouter: '0x8e131c8aE5BF1Ed38D05a00892b6001a7d37739d', // Real Hyperlane router
    usdc: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'
  },
  arbitrumSepolia: {
    chainId: 421614,
    domain: 421614,
    name: 'arbitrumsepolia',
    rpcUrl: process.env.ARBITRUM_SEPOLIA_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc',
    interchainAccountRouter: '0x20cC3a33C49fa13627303669edf2DcA7F1E76a50', // Real Hyperlane router
    usdc: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d' // Circle USDC on Arbitrum Sepolia
  },
  polygonAmoy: {
    chainId: 80002,
    domain: 80002,
    name: 'polygonamoy',
    rpcUrl: process.env.POLYGON_AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology',
    interchainAccountRouter: '0xC60C145f1e1904f9d6483A611BF1416697CCc1FE', // Real Hyperlane router
    usdc: '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582' // Mock USDC on Polygon Amoy
  },
  baseSepolia: {
    chainId: 84532,
    domain: 84532,
    name: 'basesepolia',
    rpcUrl: process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org',
    interchainAccountRouter: '0xd876C01aB40e8cE42Db417fBC79c726d45504dE4', // Real Hyperlane router
    usdc: '0x036CbD53842c5426634e7929541eC2318f3dCF7e' // Circle USDC on Base Sepolia
  }
};

// PayWiser configuration
export const config = {
  hyperlane: {
    chains: HYPERLANE_CHAINS
  },
  server: {
    port: process.env.PORT || 3001,
    environment: process.env.NODE_ENV || 'development'
  },
  wallet: {
    privateKey: process.env.PRIVATE_KEY
  },
  tokens: {
    supportedTokens: ['USDC', 'USDT']
  }
};

export default config;

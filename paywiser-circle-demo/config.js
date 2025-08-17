// Configuration for Circle API and application settings
export const config = {
  circle: {
    apiKey: 'TEST_API_KEY:09caad2f987ab4e665cf39ff2b737503:c1a3fb20402b632a948bd1232ae4aad4',
    entitySecret: '04bf2c07b35db1e10d02e8ee4cd84d2f5745392181bbc820097214b274274957',
    environment: 'sandbox', // 'sandbox' or 'production'
    baseUrl: 'https://api-sandbox.circle.com',
    walletSetId: '48915e31-9480-5d6f-b1a1-9de46e161af4'
  },
  server: {
    port: process.env.PORT || 3000,
    environment: process.env.NODE_ENV || 'development'
  },
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3000'
  }
};

export default config;

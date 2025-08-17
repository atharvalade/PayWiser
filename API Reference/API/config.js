// Configuration constants for FacePay API
export const CONFIG = {
  // Database
  supabase: {
    url: 'https://nugfkvafpxuaspphxxmd.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51Z2ZrdmFmcHh1YXNwcGh4eG1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2ODY1NDksImV4cCI6MjA2NjI2MjU0OX0.rGssg1k9zAPHG_aoe2MHc4LpevdQUh8uxlbaGOq6hCM',
    serviceKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51Z2ZrdmFmcHh1YXNwcGh4eG1kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDY4NjU0OSwiZXhwIjoyMDY2MjYyNTQ5fQ.tzrT15xxjelJo_W3vU_urtDH7c2gtgzAvAUEzI-Eh3U'
  },

  // Blockchain
  blockchain: {
    rpcUrl: 'https://ethereum-sepolia-rpc.publicnode.com',
    chainId: 11155111,
    paymentHubAddress: '0x728d0f06Bf6D63B4bC9ca7C879D042DDAC66e8A3',
    pyusdAddress: '0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9'
  },

  // Wallets
  wallets: {
    user1: {
      address: '0x9f93EebD463d4B7c991986a082d974E77b5a02Dc',
      privateKey: '15953296e322c945eaa0c215f8740fcdb1cb18231d19e477efa91ae4310becdf'
    },
    user2: {
      address: '0xa999F0CB16b55516BD82fd77Dc19f495b41f0770',
      privateKey: 'dcf06adcd2d997d57bfb5275ae3493d8afdb606d7c51c66eafbb7c5abff04d2c'
    },
    merchant: {
      address: '0x27A7A44250C6Eb3C84d1d894c8A601742827C7C7',
      privateKey: 'ffc39a39c2d5436985f83336fe8710c38a50ab49171e19ea5ca9968e7fff2492'
    }
  },

  // PayPal
  paypal: {
    clientId: 'AflhgYo-nF7EpxGO_JYjADDHabPPhegssyt3JPILIDs5bwOTryriWevfAUGUcj5imYtKWqH6FJf73Bsc',
    secret: 'EBGerYC-X6fbBTuV6R_7M9D5CGqzzoZoNe-3oFRJQ8Z6AyxfE-n4Gb7Ga0kpOmrshIsXM4NoZXbAuVDo'
  },

  // App
  app: {
    jwtSecret: 'z93bmYcj8jhN+vhpumJHMiteYeoKeK6Cd+bPzZp4YAMi9W3uHTNBzNZuEwkYtHPVLlcpGJJZo7cIZFvNAWEwnw==',
    port: process.env.PORT || 3000
  },

  // Face Recognition
  faceApi: {
    confidenceThreshold: 0.5,
    descriptorThreshold: 0.6,
    models: ['ssd_mobilenetv1', 'face_landmark_68', 'face_recognition', 'face_expression']
  }
}; 
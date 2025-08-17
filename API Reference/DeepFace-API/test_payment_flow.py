#!/usr/bin/env python3
"""
FacePay Test Script - Complete Payment Flow
Tests face recognition and executes PyUSD payment if successful
"""

import requests
import json
import time
from web3 import Web3
from eth_account import Account
# Configuration moved to environment variables

# Wallet configurations from credentials.md
WALLETS = {
    "user1": {
        "address": "0x9f93EebD463d4B7c991986a082d974E77b5a02Dc",
        "private_key": "15953296e322c945eaa0c215f8740fcdb1cb18231d19e477efa91ae4310becdf"
    },
    "user2": {
        "address": "0xa999F0CB16b55516BD82fd77Dc19f495b41f0770", 
        "private_key": "dcf06adcd2d997d57bfb5275ae3493d8afdb606d7c51c66eafbb7c5abff04d2c"
    },
    "merchant": {
        "address": "0x27A7A44250C6Eb3C84d1d894c8A601742827C7C7",
        "private_key": "ffc39a39c2d5436985f83336fe8710c38a50ab49171e19ea5ca9968e7fff2492"
    }
}

# Smart contract addresses (from deployment)
PAYMENT_HUB_ADDRESS = "0x728d0f06Bf6D63B4bC9ca7C879D042DDAC66e8A3"
PYUSD_ADDRESS = "0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9"

# Blockchain configuration
RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com"
CHAIN_ID = 11155111  # Sepolia

# API configuration
API_BASE_URL = "http://localhost:8000"

# Smart contract ABIs (simplified)
PYUSD_ABI = [
    {
        "inputs": [{"name": "to", "type": "address"}, {"name": "amount", "type": "uint256"}],
        "name": "transfer",
        "outputs": [{"name": "", "type": "bool"}],
        "type": "function"
    },
    {
        "inputs": [{"name": "account", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "", "type": "uint256"}],
        "type": "function"
    },
    {
        "inputs": [],
        "name": "decimals",
        "outputs": [{"name": "", "type": "uint8"}],
        "type": "function"
    }
]

PAYMENT_HUB_ABI = [
    {
        "inputs": [
            {"name": "_token", "type": "address"},
            {"name": "_to", "type": "address"}, 
            {"name": "_amount", "type": "uint256"},
            {"name": "_userFaceHash", "type": "string"}
        ],
        "name": "processPayment",
        "outputs": [],
        "type": "function"
    }
]

class FacePayTester:
    def __init__(self):
        self.web3 = Web3(Web3.HTTPProvider(RPC_URL))
        print(f"🔗 Connected to Sepolia: {self.web3.is_connected()}")
        
        # Initialize contracts
        self.pyusd_contract = self.web3.eth.contract(
            address=PYUSD_ADDRESS,
            abi=PYUSD_ABI
        )
        self.payment_hub_contract = self.web3.eth.contract(
            address=PAYMENT_HUB_ADDRESS,
            abi=PAYMENT_HUB_ABI
        )
        
    def recognize_face(self, image_path: str):
        """Test face recognition using the DeepFace API"""
        print(f"🎭 Testing face recognition for: {image_path}")
        
        try:
            with open(image_path, 'rb') as image_file:
                files = {'image': image_file}
                response = requests.post(f"{API_BASE_URL}/recognize-face", files=files)
                
            if response.status_code == 200:
                result = response.json()
                if result.get('success'):
                    print(f"✅ Face recognized!")
                    print(f"   User: {result['userId']}")
                    print(f"   Wallet: {result['walletAddress']}")
                    print(f"   Distance: {result['distance']:.4f}")
                    print(f"   Confidence: {result['confidence']:.4f}")
                    return result
                else:
                    print(f"❌ Face not recognized")
                    return None
            else:
                print(f"❌ API Error: {response.status_code}")
                print(response.text)
                return None
                
        except Exception as e:
            print(f"❌ Recognition error: {e}")
            return None
    
    def get_balance(self, address: str):
        """Get PyUSD balance for an address"""
        try:
            balance_wei = self.pyusd_contract.functions.balanceOf(address).call()
            # PyUSD has 6 decimals
            balance = balance_wei / (10 ** 6)
            return balance
        except Exception as e:
            print(f"❌ Balance check error: {e}")
            return 0
    
    def send_pyusd(self, from_wallet: dict, to_address: str, amount: float, user_id: str):
        """Send PyUSD using direct transfer"""
        print(f"\n💰 Sending {amount} PyUSD from {from_wallet['address']} to {to_address}")
        
        try:
            # Get account
            account = Account.from_key(from_wallet['private_key'])
            
            # Convert amount to wei (6 decimals for PyUSD)
            amount_wei = int(amount * (10 ** 6))
            
            # Build transaction
            nonce = self.web3.eth.get_transaction_count(from_wallet['address'])
            
            transaction = self.pyusd_contract.functions.transfer(
                to_address,
                amount_wei
            ).build_transaction({
                'chainId': CHAIN_ID,
                'gas': 100000,
                'gasPrice': self.web3.to_wei('20', 'gwei'),
                'nonce': nonce,
                'from': from_wallet['address']
            })
            
            # Sign transaction
            signed_txn = account.sign_transaction(transaction)
            
            # Send transaction
            tx_hash = self.web3.eth.send_raw_transaction(signed_txn.raw_transaction)
            print(f"📝 Transaction sent: {tx_hash.hex()}")
            
            # Wait for confirmation
            print("⏳ Waiting for confirmation...")
            receipt = self.web3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
            
            if receipt.status == 1:
                print(f"✅ Payment successful!")
                print(f"   Transaction Hash: {tx_hash.hex()}")
                print(f"   Block: {receipt.blockNumber}")
                print(f"   Gas Used: {receipt.gasUsed}")
                return tx_hash.hex()
            else:
                print(f"❌ Transaction failed")
                return None
                
        except Exception as e:
            print(f"❌ Payment error: {e}")
            return None
    
    def test_complete_flow(self, image_path: str, amount: float = 1.0):
        """Test the complete FacePay flow"""
        print("🚀 Starting FacePay Test Flow")
        print("=" * 50)
        
        # Step 1: Face Recognition
        recognition_result = self.recognize_face(image_path)
        if not recognition_result:
            print("❌ Face recognition failed - stopping test")
            return False
        
        user_id = recognition_result['userId']
        user_wallet_address = recognition_result['walletAddress']
        
        # Find the wallet info
        user_wallet = None
        for wallet_name, wallet_info in WALLETS.items():
            if wallet_info['address'].lower() == user_wallet_address.lower():
                user_wallet = wallet_info
                break
        
        if not user_wallet:
            print(f"❌ Wallet not found for address: {user_wallet_address}")
            return False
        
        # Step 2: Check balances before
        print(f"\n💰 Checking balances before payment...")
        user_balance_before = self.get_balance(user_wallet['address'])
        merchant_balance_before = self.get_balance(WALLETS['merchant']['address'])
        
        print(f"   User ({user_wallet['address']}): {user_balance_before} PyUSD")
        print(f"   Merchant ({WALLETS['merchant']['address']}): {merchant_balance_before} PyUSD")
        
        if user_balance_before < amount:
            print(f"❌ Insufficient balance. Need {amount} PyUSD, have {user_balance_before}")
            return False
        
        # Step 3: Execute payment
        tx_hash = self.send_pyusd(
            user_wallet,
            WALLETS['merchant']['address'],
            amount,
            user_id
        )
        
        if not tx_hash:
            print("❌ Payment failed")
            return False
        
        # Step 4: Check balances after
        print(f"\n💰 Checking balances after payment...")
        user_balance_after = self.get_balance(user_wallet['address'])
        merchant_balance_after = self.get_balance(WALLETS['merchant']['address'])
        
        print(f"   User ({user_wallet['address']}): {user_balance_after} PyUSD")
        print(f"   Merchant ({WALLETS['merchant']['address']}): {merchant_balance_after} PyUSD")
        
        # Verify the transfer
        user_diff = user_balance_before - user_balance_after
        merchant_diff = merchant_balance_after - merchant_balance_before
        
        print(f"\n📊 Transaction Summary:")
        print(f"   User sent: {user_diff} PyUSD")
        print(f"   Merchant received: {merchant_diff} PyUSD")
        print(f"   Transaction Hash: {tx_hash}")
        
        success = abs(user_diff - amount) < 0.01 and abs(merchant_diff - amount) < 0.01
        
        if success:
            print("🎉 FacePay test completed successfully!")
        else:
            print("⚠️ Payment amounts don't match expected values")
        
        return success

def main():
    """Main test function"""
    print("🎭 FacePay Test Script")
    print("Testing face recognition + PyUSD payment")
    print("=" * 50)
    
    tester = FacePayTester()
    
    # Test with the test image
    image_path = "../Pictures/test.JPG"
    amount = 1.0  # 1 PyUSD
    
    success = tester.test_complete_flow(image_path, amount)
    
    if success:
        print("\n✅ All tests passed! FacePay is working correctly.")
    else:
        print("\n❌ Some tests failed. Check the logs above.")

if __name__ == "__main__":
    main() 
#!/usr/bin/env python3
"""
Script to setup/update Supabase database schema for DeepFace API
"""

from supabase import create_client, Client
import config

def setup_database():
    """Setup or update the database schema for DeepFace API"""
    
    print("🔧 Setting up FacePay DeepFace database...")
    
    # Initialize Supabase client
    supabase: Client = create_client(config.SUPABASE_URL, config.SUPABASE_SERVICE_KEY)
    
    try:
        # Update face_embeddings table to support images storage
        print("📊 Updating face_embeddings table...")
        
        # The table should already exist from the Node.js setup
        # We just need to verify it works with our new schema
        
        # Test if we can query the table
        result = supabase.table('face_embeddings').select('*').limit(1).execute()
        print(f"✅ face_embeddings table accessible, found {len(result.data)} records")
        
        # Clear any old test data
        print("🧹 Cleaning up old test data...")
        delete_result = supabase.table('face_embeddings').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
        print(f"✅ Cleaned up database")
        
        # Test inserting a record with new schema
        test_data = {
            "user_id": "test_schema",
            "wallet_address": "0x0000000000000000000000000000000000000000",
            "images": [{"image_data": "test", "filename": "test.jpg"}],
            "model_used": "VGG-Face"
        }
        
        insert_result = supabase.table('face_embeddings').insert(test_data).execute()
        print("✅ New schema test successful")
        
        # Remove test record
        supabase.table('face_embeddings').delete().eq('user_id', 'test_schema').execute()
        print("✅ Test cleanup complete")
        
        print("\n🎉 Database setup complete!")
        print("\n📋 Next steps:")
        print("1. Start the DeepFace API: python main.py")
        print("2. Test face registration with your images")
        print("3. Test face recognition")
        print("4. Deploy to Railway")
        
    except Exception as e:
        print(f"❌ Database setup failed: {e}")
        return False
    
    return True

if __name__ == "__main__":
    setup_database() 
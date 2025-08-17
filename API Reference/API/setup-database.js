import { createClient } from '@supabase/supabase-js';
import { CONFIG } from './config.js';

// Initialize Supabase client with service key for admin operations
const supabase = createClient(CONFIG.supabase.url, CONFIG.supabase.serviceKey);

async function setupDatabase() {
  console.log('🔧 Setting up FacePay database...');
  
  try {
    // Create face_embeddings table
    console.log('Creating face_embeddings table...');
    const { error: tableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS face_embeddings (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          user_id VARCHAR(50) NOT NULL UNIQUE,
          wallet_address VARCHAR(42) NOT NULL,
          descriptor FLOAT8[] NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_face_embeddings_user_id ON face_embeddings(user_id);
        CREATE INDEX IF NOT EXISTS idx_face_embeddings_wallet ON face_embeddings(wallet_address);
      `
    });

    if (tableError && !tableError.message.includes('already exists')) {
      console.error('Table creation error:', tableError);
    } else {
      console.log('✅ face_embeddings table ready');
    }

    // Insert test users
    console.log('Setting up test users...');
    const { error: insertError } = await supabase
      .from('face_embeddings')
      .upsert([
        {
          user_id: 'user1',
          wallet_address: '0x9f93EebD463d4B7c991986a082d974E77b5a02Dc',
          descriptor: [] // Empty array, will be populated during face registration
        },
        {
          user_id: 'user2', 
          wallet_address: '0xa999F0CB16b55516BD82fd77Dc19f495b41f0770',
          descriptor: [] // Empty array, will be populated during face registration
        }
      ], { 
        onConflict: 'user_id',
        ignoreDuplicates: true 
      });

    if (insertError) {
      console.error('Insert error:', insertError);
    } else {
      console.log('✅ Test users created');
    }

    // Test database connection
    console.log('Testing database connection...');
    const { data, error: selectError } = await supabase
      .from('face_embeddings')
      .select('user_id, wallet_address')
      .limit(5);

    if (selectError) {
      console.error('Connection test failed:', selectError);
    } else {
      console.log('✅ Database connection successful');
      console.log('Users in database:', data);
    }

    console.log('\n🎉 Database setup complete!');
    console.log('\nNext steps:');
    console.log('1. Test face registration: POST /register-face');
    console.log('2. Test face recognition: POST /recognize-face'); 
    console.log('3. Test payment flow: POST /charge');

  } catch (error) {
    console.error('❌ Database setup failed:', error);
  }
}

// Run setup
setupDatabase(); 
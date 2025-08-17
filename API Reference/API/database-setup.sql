-- FacePay Database Schema
-- Execute this in Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Face embeddings table
CREATE TABLE IF NOT EXISTS face_embeddings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL UNIQUE,
    wallet_address VARCHAR(42) NOT NULL,
    descriptor FLOAT8[] NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_face_embeddings_user_id ON face_embeddings(user_id);
CREATE INDEX IF NOT EXISTS idx_face_embeddings_wallet ON face_embeddings(wallet_address);

-- User sessions table (for PayPal integration)
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    paypal_id VARCHAR(100),
    wallet_address VARCHAR(42) NOT NULL,
    session_token VARCHAR(500),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment history table (for tracking transactions)
CREATE TABLE IF NOT EXISTS payment_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    transaction_hash VARCHAR(66) NOT NULL,
    customer_address VARCHAR(42) NOT NULL,
    merchant_address VARCHAR(42) NOT NULL,
    amount_pyusd DECIMAL(18,6) NOT NULL,
    block_number BIGINT,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for payment history
CREATE INDEX IF NOT EXISTS idx_payment_history_tx_hash ON payment_history(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_payment_history_customer ON payment_history(customer_address);
CREATE INDEX IF NOT EXISTS idx_payment_history_merchant ON payment_history(merchant_address);

-- RLS (Row Level Security) policies
ALTER TABLE face_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

-- Allow service role to access everything
CREATE POLICY "Service role can access all face_embeddings" ON face_embeddings
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can access all user_sessions" ON user_sessions
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can access all payment_history" ON payment_history
    FOR ALL USING (auth.role() = 'service_role');

-- Insert sample data for testing
INSERT INTO face_embeddings (user_id, wallet_address, descriptor) VALUES
('user1', '0x9f93EebD463d4B7c991986a082d974E77b5a02Dc', '{}') -- Empty array, will be populated by face registration
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO face_embeddings (user_id, wallet_address, descriptor) VALUES
('user2', '0xa999F0CB16b55516BD82fd77Dc19f495b41f0770', '{}') -- Empty array, will be populated by face registration
ON CONFLICT (user_id) DO NOTHING;

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for face_embeddings
DROP TRIGGER IF EXISTS update_face_embeddings_updated_at ON face_embeddings;
CREATE TRIGGER update_face_embeddings_updated_at
    BEFORE UPDATE ON face_embeddings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON face_embeddings TO service_role;
GRANT ALL ON user_sessions TO service_role;
GRANT ALL ON payment_history TO service_role; 
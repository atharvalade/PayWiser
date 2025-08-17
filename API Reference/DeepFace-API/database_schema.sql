-- FacePay DeepFace API Database Schema
-- Run this in Supabase SQL editor after deleting existing tables

-- Drop existing tables if they exist
DROP TABLE IF EXISTS face_embeddings;
DROP TABLE IF EXISTS payment_logs;

-- Create face_embeddings table for storing user face data
CREATE TABLE face_embeddings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    wallet_address TEXT NOT NULL,
    face_data TEXT NOT NULL, -- Base64 encoded face image
    user_type TEXT DEFAULT 'consumer' CHECK (user_type IN ('consumer', 'merchant')),
    model_used TEXT DEFAULT 'VGG-Face',
    confidence_threshold FLOAT DEFAULT 0.4,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payment_logs table for transaction history (optional)
CREATE TABLE payment_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    from_user_id TEXT NOT NULL,
    to_user_id TEXT NOT NULL,
    from_wallet TEXT NOT NULL,
    to_wallet TEXT NOT NULL,
    amount DECIMAL(18,6) NOT NULL,
    currency TEXT DEFAULT 'PYUSD',
    transaction_hash TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
    face_confidence FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_face_embeddings_user_id ON face_embeddings(user_id);
CREATE INDEX idx_face_embeddings_wallet ON face_embeddings(wallet_address);
CREATE INDEX idx_face_embeddings_type ON face_embeddings(user_type);
CREATE INDEX idx_payment_logs_from_user ON payment_logs(from_user_id);
CREATE INDEX idx_payment_logs_to_user ON payment_logs(to_user_id);
CREATE INDEX idx_payment_logs_status ON payment_logs(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to auto-update updated_at
CREATE TRIGGER update_face_embeddings_updated_at 
    BEFORE UPDATE ON face_embeddings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) - optional but recommended
ALTER TABLE face_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for service role access (adjust as needed)
CREATE POLICY "Service role can manage face_embeddings" ON face_embeddings
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage payment_logs" ON payment_logs
    FOR ALL USING (auth.role() = 'service_role');

-- Insert sample data for testing (optional)
INSERT INTO face_embeddings (user_id, wallet_address, face_data, user_type) VALUES
('sample_user', '0x0000000000000000000000000000000000000000', 'sample_base64_data', 'consumer');

-- Verify the setup
SELECT 'face_embeddings table created successfully' as status;
SELECT 'payment_logs table created successfully' as status; 
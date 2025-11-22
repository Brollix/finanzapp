-- Create receipts table
CREATE TABLE IF NOT EXISTS receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  supermarket TEXT,
  datetime TEXT,
  total NUMERIC(10,2),
  items JSONB,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_receipts_user_id ON receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_receipts_created_at ON receipts(created_at DESC);

-- Add RLS (Row Level Security) policies if needed
-- ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

-- Example policy: Users can only see their own receipts
-- CREATE POLICY "Users can view own receipts" ON receipts
--   FOR SELECT USING (auth.uid()::text = user_id);

-- Example policy: Users can insert their own receipts
-- CREATE POLICY "Users can insert own receipts" ON receipts
--   FOR INSERT WITH CHECK (auth.uid()::text = user_id);

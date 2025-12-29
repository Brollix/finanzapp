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

-- Create receipt_cache table for caching OCR/AI results
CREATE TABLE IF NOT EXISTS receipt_cache (
  image_hash TEXT PRIMARY KEY,
  result JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  access_count INTEGER DEFAULT 1
);

-- Create index for cache cleanup
CREATE INDEX IF NOT EXISTS idx_receipt_cache_created ON receipt_cache(created_at);
CREATE INDEX IF NOT EXISTS idx_receipt_cache_accessed ON receipt_cache(accessed_at);

-- Create rate_limits table for distributed rate limiting
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  points INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create index for rate limit cleanup
CREATE INDEX IF NOT EXISTS idx_rate_limits_expires ON rate_limits(expires_at);

-- Add RLS (Row Level Security) policies if needed
-- ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

-- Example policy: Users can only see their own receipts
-- CREATE POLICY "Users can view own receipts" ON receipts
--   FOR SELECT USING (auth.uid()::text = user_id);

-- Example policy: Users can insert their own receipts
-- CREATE POLICY "Users can insert own receipts" ON receipts
--   FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Optional: Function to auto-cleanup old cache entries (run as cron job)
CREATE OR REPLACE FUNCTION cleanup_old_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM receipt_cache 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  DELETE FROM rate_limits 
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Optional: Create a scheduled job to run cleanup daily
-- SELECT cron.schedule('cleanup-cache', '0 2 * * *', 'SELECT cleanup_old_cache()');


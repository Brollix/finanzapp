-- Check if RLS is enabled
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

-- Create or replace the DELETE policy
-- This ensures users can only delete receipts where the user_id matches their authenticated ID
DROP POLICY IF EXISTS "Users can delete their own receipts" ON receipts;

CREATE POLICY "Users can delete their own receipts"
ON receipts FOR DELETE
USING (auth.uid()::text = user_id);

-- Verify SELECT policy exists (users should already be able to see their receipts)
-- If this is missing, they wouldn't see the cards at all, but good to ensure consistency
DROP POLICY IF EXISTS "Users can view their own receipts" ON receipts;

CREATE POLICY "Users can view their own receipts"
ON receipts FOR SELECT
USING (auth.uid()::text = user_id);

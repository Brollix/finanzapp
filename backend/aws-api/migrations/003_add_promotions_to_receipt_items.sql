ALTER TABLE receipt_items ADD COLUMN IF NOT EXISTS discount numeric DEFAULT 0;
ALTER TABLE receipt_items ADD COLUMN IF NOT EXISTS promotion text;

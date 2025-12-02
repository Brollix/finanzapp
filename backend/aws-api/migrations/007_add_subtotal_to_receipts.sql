-- Migration 007: Add subtotal and fix discount calculations
-- This migration:
-- 1. Adds subtotal column to receipts table
-- 2. Recalculates total_saved from items for all receipts (fixing data inconsistencies)
-- 3. Calculates subtotal as total + total_saved

-- Step 1: Add subtotal column if it doesn't exist
ALTER TABLE receipts 
ADD COLUMN IF NOT EXISTS subtotal NUMERIC;

-- Step 2: Recalculate total_saved from items for ALL receipts
-- This fixes receipts where total_saved is 0 or NULL but items have discounts
UPDATE receipts r
SET total_saved = (
    SELECT COALESCE(SUM(
        CASE 
            WHEN jsonb_typeof(item->'discount') = 'number' 
            THEN (item->>'discount')::NUMERIC 
            ELSE 0 
        END
    ), 0)
    FROM jsonb_array_elements(r.items) AS item
);

-- Step 3: Rebuild discounts array from items for receipts with empty/null discounts
-- This ensures the discounts array matches the item-level discounts
UPDATE receipts r
SET discounts = (
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'description', 
                COALESCE(item->>'promotion', 'Descuento'),
                'amount', 
                (item->>'discount')::NUMERIC
            )
        ) FILTER (WHERE jsonb_typeof(item->'discount') = 'number' AND (item->>'discount')::NUMERIC > 0),
        '[]'::jsonb
    )
    FROM jsonb_array_elements(r.items) AS item
)
WHERE (discounts IS NULL OR discounts = '[]'::jsonb)
  AND EXISTS (
      SELECT 1 
      FROM jsonb_array_elements(r.items) AS item 
      WHERE jsonb_typeof(item->'discount') = 'number' 
        AND (item->>'discount')::NUMERIC > 0
  );

-- Step 4: Calculate subtotal from items (sum of prices)
-- This is more reliable than total + total_saved, as it doesn't depend on the potentially incorrect total
UPDATE receipts r
SET subtotal = (
    SELECT COALESCE(SUM(
        CASE 
            WHEN jsonb_typeof(item->'price') = 'number' 
            THEN (item->>'price')::NUMERIC 
            ELSE 0 
        END
    ), 0)
    FROM jsonb_array_elements(r.items) AS item
);

-- Step 5: Recalculate total to ensure consistency
-- total = subtotal - total_saved
UPDATE receipts 
SET total = subtotal - COALESCE(total_saved, 0);

-- Verification query (commented out, uncomment to check results):
-- SELECT 
--     id,
--     supermarket,
--     total,
--     total_saved,
--     subtotal,
--     (SELECT COUNT(*) FROM jsonb_array_elements(items) AS item WHERE jsonb_typeof(item->'discount') = 'number') as items_with_discount
-- FROM receipts
-- ORDER BY created_at DESC
-- LIMIT 10;

-- Add discounts and total_saved columns to receipts table
ALTER TABLE receipts 
ADD COLUMN IF NOT EXISTS discounts jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS total_saved numeric DEFAULT 0;

-- Update the view to use the new total_saved column for better accuracy
CREATE OR REPLACE VIEW supermarket_discount_analytics AS
SELECT 
    r.supermarket,
    COUNT(DISTINCT r.id) as visit_count,
    SUM(r.total) as total_spent,
    SUM(r.total_saved) as total_saved,
    COUNT(ri.id) FILTER (WHERE ri.discount > 0) as discounted_items_count,
    CASE 
        WHEN SUM(r.total) + SUM(r.total_saved) = 0 THEN 0
        ELSE ROUND((SUM(r.total_saved) / (SUM(r.total) + SUM(r.total_saved)) * 100), 2)
    END as savings_percentage
FROM 
    receipts r
LEFT JOIN 
    receipt_items ri ON r.id = ri.receipt_id
GROUP BY 
    r.supermarket
ORDER BY 
    savings_percentage DESC;

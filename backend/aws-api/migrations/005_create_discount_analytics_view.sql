-- Create a view to analyze discounts by supermarket
CREATE OR REPLACE VIEW supermarket_discount_analytics AS
SELECT 
    r.supermarket,
    COUNT(DISTINCT r.id) as visit_count,
    SUM(ri.total) as total_spent,
    SUM(ri.discount) as total_saved,
    COUNT(ri.id) FILTER (WHERE ri.discount > 0) as discounted_items_count,
    CASE 
        WHEN SUM(ri.total) + SUM(ri.discount) = 0 THEN 0
        ELSE ROUND((SUM(ri.discount) / (SUM(ri.total) + SUM(ri.discount)) * 100), 2)
    END as savings_percentage
FROM 
    receipts r
JOIN 
    receipt_items ri ON r.id = ri.receipt_id
GROUP BY 
    r.supermarket
ORDER BY 
    savings_percentage DESC;

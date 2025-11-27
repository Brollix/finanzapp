-- Add category and embedding columns to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS category text,
ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Create an HNSW index for fast similarity search
CREATE INDEX IF NOT EXISTS products_embedding_idx 
ON products 
USING hnsw (embedding vector_cosine_ops);

-- Create a function to match similar products
CREATE OR REPLACE FUNCTION match_products (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  name text,
  category text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    products.id,
    products.name,
    products.category,
    1 - (products.embedding <=> query_embedding) AS similarity
  FROM products
  WHERE 1 - (products.embedding <=> query_embedding) > match_threshold
  AND products.category IS NOT NULL
  ORDER BY products.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

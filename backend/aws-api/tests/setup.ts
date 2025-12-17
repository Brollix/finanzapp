// Set env vars before any other imports
process.env.PORT = "8080";
process.env.NODE_ENV = "test";
process.env.SUPABASE_URL = "https://mock.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "mock-service-key";
process.env.AWS_REGION = "us-east-1";
process.env.AWS_ACCESS_KEY_ID = "mock-key";
process.env.AWS_SECRET_ACCESS_KEY = "mock-secret";
process.env.BEDROCK_MODEL_ID = "anthropic.claude-v2";

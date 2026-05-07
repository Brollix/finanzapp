import dotenv from "dotenv";

// Load environment variables from .env file if it exists
dotenv.config();

// Set env vars before any other imports, but use existing values if present
process.env.PORT = process.env.PORT || "8080";
process.env.NODE_ENV = process.env.NODE_ENV || "test";
process.env.SUPABASE_URL =
	process.env.SUPABASE_URL || "https://mock.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY =
	process.env.SUPABASE_SERVICE_ROLE_KEY || "mock-service-key";
process.env.AWS_REGION = process.env.AWS_REGION || "us-east-1";
process.env.AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || "mock-key";
process.env.AWS_SECRET_ACCESS_KEY =
	process.env.AWS_SECRET_ACCESS_KEY || "mock-secret";
process.env.BEDROCK_MODEL_ID =
	process.env.BEDROCK_MODEL_ID || "us.anthropic.claude-3-5-haiku-20241022-v1:0";

// Mock p-retry to avoid ES module import issues
// We use a plain function instead of jest.fn() because resetMocks: true in jest.config.js
// would clear the implementation of a jest.fn(), causing it to return undefined.
jest.mock("p-retry", () => {
	return {
		__esModule: true,
		default: async (fn: any) => fn(),
	};
});

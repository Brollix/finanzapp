// Set env vars before any other imports
process.env.PORT = "8080";
process.env.NODE_ENV = "test";
process.env.SUPABASE_URL = "https://mock.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "mock-service-key";
process.env.AWS_REGION = "us-east-1";
process.env.AWS_ACCESS_KEY_ID = "mock-key";
process.env.AWS_SECRET_ACCESS_KEY = "mock-secret";
process.env.BEDROCK_MODEL_ID = "anthropic.claude-v2";

// Mock p-retry to avoid ES module import issues
jest.mock("p-retry", () => {
	const mockRetry = jest.fn((fn) => fn());
	mockRetry.FailedAttemptError = class FailedAttemptError extends Error {
		constructor(error: Error) {
			super(error.message);
			this.name = "FailedAttemptError";
		}
	};
	return {
		__esModule: true,
		default: mockRetry,
		FailedAttemptError: mockRetry.FailedAttemptError,
	};
});
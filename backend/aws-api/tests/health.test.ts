import request from "supertest";
import "./setup.js";

// Mock validateEnv to avoid process.exit(1) if env vars are missing
jest.mock("../src/utils/validateEnv.js", () => ({
	validateEnv: () => ({
		PORT: "8080",
		NODE_ENV: "test",
		AWS_REGION: "us-east-1",
		AWS_ACCESS_KEY_ID: "mock-key",
		AWS_SECRET_ACCESS_KEY: "mock-secret",
		BEDROCK_MODEL_ID: "anthropic.claude-v2",
		SUPABASE_URL: "https://mock.supabase.co",
		SUPABASE_ANON_KEY: "mock-anon-key",
		SUPABASE_SERVICE_ROLE_KEY: "mock-service-key",
	}),
}));

import app from "../src/app.js";

describe("Health Check Endpoint", () => {
	it("should return 200 and healthy status", async () => {
		const res = await request(app).get("/health");

		expect(res.status).toBe(200);
		expect(res.body).toHaveProperty("status", "healthy");
		expect(res.body).toHaveProperty("service", "finanzapp-aws-api");
	});
});

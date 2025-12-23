import { Request, Response, NextFunction } from "express";
import { authenticate, AuthenticatedRequest } from "../src/middleware/auth.js";
import { supabase } from "../src/config/supabase.js";

// Mock Supabase
jest.mock("../src/config/supabase.js", () => ({
	supabase: {
		auth: {
			getUser: jest.fn(),
		},
	},
}));

// Mock logger to avoid console output in tests
jest.mock("../src/utils/logger.js", () => {
	const mockLogger = {
		error: jest.fn(),
		warn: jest.fn(),
		info: jest.fn(),
		debug: jest.fn(),
	};
	return {
		__esModule: true,
		default: mockLogger,
	};
});

describe("authenticate middleware", () => {
	let mockRequest: Partial<AuthenticatedRequest>;
	let mockResponse: Partial<Response>;
	let nextFunction: NextFunction;

	beforeEach(() => {
		mockRequest = {
			headers: {},
		};
		mockResponse = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn().mockReturnThis(),
		};
		nextFunction = jest.fn();
		jest.clearAllMocks();
	});

	it("should return 401 if authorization header is missing", async () => {
		await authenticate(
			mockRequest as AuthenticatedRequest,
			mockResponse as Response,
			nextFunction
		);

		expect(mockResponse.status).toHaveBeenCalledWith(401);
		expect(mockResponse.json).toHaveBeenCalledWith({
			error: "Missing authorization header",
		});
		expect(nextFunction).not.toHaveBeenCalled();
	});

	it("should return 401 if bearer token is missing", async () => {
		mockRequest.headers = {
			authorization: "InvalidFormat",
		};

		await authenticate(
			mockRequest as AuthenticatedRequest,
			mockResponse as Response,
			nextFunction
		);

		expect(mockResponse.status).toHaveBeenCalledWith(401);
		expect(mockResponse.json).toHaveBeenCalledWith({
			error: "Missing bearer token",
		});
		expect(nextFunction).not.toHaveBeenCalled();
	});

	it("should return 401 if token is invalid", async () => {
		mockRequest.headers = {
			authorization: "Bearer invalid-token",
		};

		(supabase.auth.getUser as jest.Mock).mockResolvedValue({
			data: { user: null },
			error: { message: "Invalid token" },
		});

		await authenticate(
			mockRequest as AuthenticatedRequest,
			mockResponse as Response,
			nextFunction
		);

		expect(mockResponse.status).toHaveBeenCalledWith(401);
		expect(mockResponse.json).toHaveBeenCalledWith({
			error: "Invalid or expired token",
		});
		expect(nextFunction).not.toHaveBeenCalled();
	});

	it("should call next() if token is valid", async () => {
		const mockUser = {
			id: "user-123",
			email: "test@example.com",
		};

		mockRequest.headers = {
			authorization: "Bearer valid-token",
		};

		(supabase.auth.getUser as jest.Mock).mockResolvedValue({
			data: { user: mockUser },
			error: null,
		});

		await authenticate(
			mockRequest as AuthenticatedRequest,
			mockResponse as Response,
			nextFunction
		);

		expect(mockRequest.user).toEqual({
			id: "user-123",
			email: "test@example.com",
		});
		expect(nextFunction).toHaveBeenCalled();
		expect(mockResponse.status).not.toHaveBeenCalled();
	});

	it("should handle errors gracefully", async () => {
		mockRequest.headers = {
			authorization: "Bearer token",
		};

		(supabase.auth.getUser as jest.Mock).mockRejectedValue(
			new Error("Network error")
		);

		await authenticate(
			mockRequest as AuthenticatedRequest,
			mockResponse as Response,
			nextFunction
		);

		expect(mockResponse.status).toHaveBeenCalledWith(500);
		expect(mockResponse.json).toHaveBeenCalledWith({
			error: "Internal server error during authentication",
		});
		expect(nextFunction).not.toHaveBeenCalled();
	});
});


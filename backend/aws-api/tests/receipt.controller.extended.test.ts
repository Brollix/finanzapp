// Mock logger using manual mock
jest.mock("../src/utils/logger.js");

// Mock services
jest.mock("../src/services/receipt-optimized.service.js", () => ({
	receiptServiceOptimized: {
		processReceiptFromImage: jest.fn(),
	},
}));

jest.mock("../src/services/receipt.service.js", () => ({
	receiptService: {
		createManualReceipt: jest.fn(),
		updateReceipt: jest.fn(),
	},
}));

jest.mock("../src/services/database.service.js", () => ({
	getReceiptById: jest.fn(),
	getReceiptsByUserId: jest.fn(),
}));

jest.mock("../src/services/progress-tracker.service.js", () => ({
	progressTracker: {
		createJob: jest.fn(),
		getProgress: jest.fn(),
		errorJob: jest.fn(),
	},
}));

import { Request, Response } from "express";
import { AuthenticatedRequest } from "../src/middleware/auth.js";
import {
	processReceipt,
	getProcessingStatus,
	createManualReceipt,
	getReceiptById,
	getUserReceipts,
} from "../src/controllers/receipt.controller.js";
import { progressTracker } from "../src/services/progress-tracker.service.js";

describe("Receipt Controller - Additional Tests", () => {
	let mockReq: Partial<AuthenticatedRequest>;
	let mockRes: Partial<Response>;
	let jsonMock: jest.Mock;
	let statusMock: jest.Mock;

	beforeEach(() => {
		jsonMock = jest.fn();
		statusMock = jest.fn().mockReturnValue({ json: jsonMock });

		mockReq = {
			user: { id: "test-user-id", token: "mock-token" },
			params: {},
			query: {},
			body: {},
		};

		mockRes = {
			status: statusMock,
			json: jsonMock,
		};

		jest.clearAllMocks();
	});

	describe("processReceipt", () => {
		it("should return 500 on validation error when no file provided", async () => {
			mockReq.file = undefined;

			await processReceipt(
				mockReq as AuthenticatedRequest,
				mockRes as Response
			);

			expect(statusMock).toHaveBeenCalledWith(500);
			expect(jsonMock).toHaveBeenCalledWith(
				expect.objectContaining({
					error: "Failed to process receipt",
				})
			);
		});
	});

	describe("getProcessingStatus", () => {
		it("should return 400 when jobId is missing", async () => {
			mockReq.params = {};

			await getProcessingStatus(
				mockReq as AuthenticatedRequest,
				mockRes as Response
			);

			expect(statusMock).toHaveBeenCalledWith(400);
			expect(jsonMock).toHaveBeenCalledWith(
				expect.objectContaining({
					error: "Job ID is required",
				})
			);
		});

		it("should return 404 when job not found", async () => {
			mockReq.params = { jobId: "non-existent-job" };
			(progressTracker.getProgress as jest.Mock).mockReturnValue(null);

			await getProcessingStatus(
				mockReq as AuthenticatedRequest,
				mockRes as Response
			);

			expect(statusMock).toHaveBeenCalledWith(404);
			expect(jsonMock).toHaveBeenCalledWith(
				expect.objectContaining({
					error: "Job not found",
				})
			);
		});

		it("should return progress when job exists", async () => {
			const mockProgress = {
				status: "processing",
				progress: 50,
				stage: "extracting",
			};
			mockReq.params = { jobId: "test-job-id" };
			(progressTracker.getProgress as jest.Mock).mockReturnValue(mockProgress);

			await getProcessingStatus(
				mockReq as AuthenticatedRequest,
				mockRes as Response
			);

			expect(statusMock).toHaveBeenCalledWith(200);
			expect(jsonMock).toHaveBeenCalledWith({
				success: true,
				data: mockProgress,
			});
		});
	});

	describe("getUserReceipts", () => {
		it("should handle limit query parameter", async () => {
			const {
				getReceiptsByUserId,
			} = require("../src/services/database.service.js");
			mockReq.query = { limit: "10" };
			getReceiptsByUserId.mockResolvedValue([]);

			await getUserReceipts(
				mockReq as AuthenticatedRequest,
				mockRes as Response
			);

			expect(getReceiptsByUserId).toHaveBeenCalledWith("test-user-id", 10, "mock-token");
		});

		it("should use default limit when not provided", async () => {
			const {
				getReceiptsByUserId,
			} = require("../src/services/database.service.js");
			mockReq.query = {};
			getReceiptsByUserId.mockResolvedValue([]);

			await getUserReceipts(
				mockReq as AuthenticatedRequest,
				mockRes as Response
			);

			expect(getReceiptsByUserId).toHaveBeenCalledWith("test-user-id", 50, "mock-token");
		});
	});

	describe("getReceiptById", () => {
		it("should return 404 when receipt not found", async () => {
			const {
				getReceiptById: getReceiptByIdService,
			} = require("../src/services/database.service.js");
			mockReq.params = { id: "non-existent-id" };
			getReceiptByIdService.mockResolvedValue(null);

			await getReceiptById(
				mockReq as AuthenticatedRequest,
				mockRes as Response
			);

			expect(statusMock).toHaveBeenCalledWith(404);
			expect(jsonMock).toHaveBeenCalledWith(
				expect.objectContaining({
					error: "Receipt not found",
				})
			);
		});

		it("should return 403 when user is not owner", async () => {
			const {
				getReceiptById: getReceiptByIdService,
			} = require("../src/services/database.service.js");
			mockReq.params = { id: "test-receipt-id" };
			getReceiptByIdService.mockResolvedValue({
				id: "test-receipt-id",
				user_id: "different-user-id",
			});

			await getReceiptById(
				mockReq as AuthenticatedRequest,
				mockRes as Response
			);

			expect(statusMock).toHaveBeenCalledWith(403);
			expect(jsonMock).toHaveBeenCalledWith(
				expect.objectContaining({
					error: "Unauthorized",
				})
			);
		});

		it("should return receipt when user is owner", async () => {
			const {
				getReceiptById: getReceiptByIdService,
			} = require("../src/services/database.service.js");
			const mockReceipt = {
				id: "test-receipt-id",
				user_id: "test-user-id",
				data: {},
			};
			mockReq.params = { id: "test-receipt-id" };
			getReceiptByIdService.mockResolvedValue(mockReceipt);

			await getReceiptById(
				mockReq as AuthenticatedRequest,
				mockRes as Response
			);

			expect(statusMock).toHaveBeenCalledWith(200);
			expect(jsonMock).toHaveBeenCalledWith({
				success: true,
				data: mockReceipt,
			});
		});
	});
});

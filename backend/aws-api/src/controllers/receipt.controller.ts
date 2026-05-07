import { Response } from "express";
import { z } from "zod";
import { AuthenticatedRequest } from "../middleware/auth.js";
import {
	getReceiptById as getReceiptByIdService,
	getReceiptsByUserId,
} from "../services/database.service.js";
import { receiptService } from "../services/receipt.service.js";
import { receiptServiceOptimized } from "../services/receipt-optimized.service.js";
import { progressTracker } from "../services/progress-tracker.service.js";
import logger from "../utils/logger.js";
import { ValidationError } from "../utils/errors.js";

// Validation Schemas
const ReceiptItemSchema = z.object({
	product: z.string(),
	quantity: z.number(),
	price: z.number(),
	unit_price: z.number().optional(),
	discount: z.number().optional(),
	promotion: z.string().optional().nullable(),
	is_weight: z.boolean().optional(),
	brand: z.string().optional().nullable(),
});

export const ReceiptDataSchema = z.object({
	supermarket: z.string(),
	datetime: z.string(),
	total: z.number().optional(), // Can be calculated
	subtotal: z.number().optional(), // Price before discounts
	items: z.array(ReceiptItemSchema).min(1),
	discounts: z.array(z.any()).optional(),
	total_saved: z.number().optional(),
});

export const processReceipt = async (
	req: AuthenticatedRequest,
	res: Response
): Promise<void> => {
	logger.info("\n===== NEW RECEIPT PROCESSING REQUEST =====");

	let jobId: string | undefined;

	try {
		// Validate image file
		if (!req.file) {
			throw new ValidationError("No image file provided");
		}

		// LOGGING DEBUG
		const bodyKeys = Object.keys(req.body as Record<string, unknown>).join(", ");
		logger.info(`[Controller] Req Body Keys: ${bodyKeys}`);
		
		const bodyPreview = (req.body as { preview?: unknown }).preview;
		logger.info(
			`[Controller] Req Body Preview: '${String(bodyPreview)}' (${typeof bodyPreview})`
		);
		
		const queryKeys = Object.keys(req.query as Record<string, unknown>).join(", ");
		logger.info(`[Controller] Req Query Keys: ${queryKeys}`);
		
		const queryPreview = (req.query as { preview?: unknown }).preview;
		logger.info(
			`[Controller] Req Query Preview: '${String(queryPreview)}' (${typeof queryPreview})`
		);

		// Get user ID from authenticated request
		const userId = req.user!.id;
		logger.info(`User ID: ${userId}`);

		// Create job ID for progress tracking
		jobId = progressTracker.createJob();

		// Process receipt with progress tracking
		// Check HEADER or QUERY first to avoid body ordering issues
		const isPreview =
			req.query.preview === "true" ||
			req.body.preview === "true" ||
			req.body.preview === true;

		logger.info(`[Controller] isPreview calculated: ${isPreview}`);

		const savedReceipt = await receiptServiceOptimized.processReceiptFromImage(
			userId,
			req.file.buffer,
			{
				size: req.file.size,
				mimetype: req.file.mimetype,
				originalname: req.file.originalname,
			},
			jobId,
			{ preview: isPreview, token: req.user!.token }
		);

		res.status(200).json({
			success: true,
			data: savedReceipt,
			jobId, // Include jobId so client can track progress
		});
	} catch (error) {
		logger.error("\n===== UNEXPECTED ERROR =====");
		logger.error(`Error: ${error}`);
		logger.error("================================\n");

		// Mark job as error if we created one
		if (jobId) {
			progressTracker.errorJob(
				jobId,
				error instanceof Error ? error.message : "Unknown error"
			);
		}

		res.status(500).json({
			error: "Failed to process receipt",
			errorType: "unknown_error",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
};

/**
 * Get processing status for a job
 */
export const getProcessingStatus = async (
	req: AuthenticatedRequest,
	res: Response
): Promise<void> => {
	try {
		const { jobId } = req.params;

		if (!jobId) {
			res.status(400).json({
				error: "Job ID is required",
			});
			return;
		}

		const progress = progressTracker.getProgress(jobId);

		if (!progress) {
			res.status(404).json({
				error: "Job not found",
			});
			return;
		}

		res.status(200).json({
			success: true,
			data: progress,
		});
	} catch (error) {
		logger.error(`Error getting processing status: ${error}`);
		res.status(500).json({
			error: "Failed to get processing status",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
};

export const createManualReceipt = async (
	req: AuthenticatedRequest,
	res: Response
): Promise<void> => {
	try {
		const { receiptData } = req.body;
		const userId = req.user!.id;

		// Validation with Zod
		const validationResult = ReceiptDataSchema.safeParse(receiptData);
		if (!validationResult.success) {
			throw new ValidationError(
				"Invalid receipt data",
				validationResult.error.issues
			);
		}

		const validatedData = validationResult.data;

		// Delegate to service
		const savedReceipt = await receiptService.createManualReceipt(
			userId,
			validatedData as any, // Still need any here if the service type doesn't match perfectly, but we can try to fix it later
			req.user!.token
		);

		res.status(201).json({
			success: true,
			data: savedReceipt,
		});
	} catch (error) {
		logger.error(`Error creating manual receipt: ${error}`);
		res.status(500).json({
			error: "Failed to create manual receipt",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
};

export const updateReceipt = async (
	req: AuthenticatedRequest,
	res: Response
): Promise<void> => {
	try {
		const { id } = req.params;
		const { receiptData } = req.body;
		const userId = req.user!.id;

		// Validation with Zod
		const validationResult = ReceiptDataSchema.safeParse(receiptData);
		if (!validationResult.success) {
			throw new ValidationError(
				"Invalid receipt data",
				validationResult.error.issues
			);
		}

		const validatedData = validationResult.data;

		const updatedReceipt = await receiptService.updateReceipt(
			id,
			userId,
			validatedData as any,
			req.user!.token
		);

		res.status(200).json({
			success: true,
			data: updatedReceipt,
		});
	} catch (error) {
		logger.error(`Error updating receipt: ${error}`);

		// Handle specific errors
		if (error instanceof Error) {
			if (error.message.includes("not found")) {
				res.status(404).json({
					error: "Receipt not found",
					message: error.message,
				});
				return;
			}
			if (error.message.includes("Unauthorized")) {
				res.status(403).json({
					error: "Forbidden",
					message: error.message,
				});
				return;
			}
		}

		res.status(500).json({
			error: "Failed to update receipt",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
};

export const getReceiptById = async (
	req: AuthenticatedRequest,
	res: Response
): Promise<void> => {
	try {
		const { id } = req.params;

		const receipt = await getReceiptByIdService(id, req.user!.token);

		if (!receipt) {
			res.status(404).json({ error: "Receipt not found" });
			return;
		}

		// Verify ownership
		if (receipt.user_id !== req.user!.id) {
			res.status(403).json({ error: "Unauthorized" });
			return;
		}

		res.status(200).json({
			success: true,
			data: receipt,
		});
	} catch (error) {
		logger.error(`Error getting receipt: ${error}`);
		res.status(500).json({
			error: "Failed to get receipt",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
};

export const getUserReceipts = async (
	req: AuthenticatedRequest,
	res: Response
): Promise<void> => {
	try {
		const userId = req.user!.id;
		logger.info(`Fetching receipts for user: ${userId}`);
		const limit = req.query.limit
			? parseInt(req.query.limit as string, 10)
			: 50;

		const receipts = await getReceiptsByUserId(userId, limit, req.user!.token);

		res.status(200).json({
			success: true,
			data: receipts,
			count: receipts.length,
		});
	} catch (error) {
		logger.error(`Error getting receipts: ${error}`);
		res.status(500).json({
			error: "Failed to get receipts",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
};

import { Response } from "express";
import { z } from "zod";
import { AuthenticatedRequest } from "../middleware/auth.js";
import {
	getReceiptById as getReceiptByIdService,
	getReceiptsByUserId,
} from "../services/database.service.js";
import { receiptService } from "../services/receipt.service.js";
import logger from "../utils/logger.js";

// Validation Schemas
const ReceiptItemSchema = z.object({
	product: z.string(),
	quantity: z.number(),
	price: z.number(),
	discount: z.number().optional(),
	promotion: z.string().optional().nullable(),
	is_weight: z.boolean().optional(),
	brand: z.string().optional().nullable(),
});

const ReceiptDataSchema = z.object({
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

	try {
		// Validate image file
		if (!req.file) {
			logger.warn("No image file provided");
			res.status(400).json({
				error: "No image file provided",
				errorType: "validation_error",
			});
			return;
		}

		// Get user ID from authenticated request
		const userId = req.user!.id;
		logger.info(`User ID: ${userId}`);

		const savedReceipt = await receiptService.processReceiptFromImage(
			userId,
			req.file.buffer,
			{
				size: req.file.size,
				mimetype: req.file.mimetype,
				originalname: req.file.originalname,
			}
		);

		res.status(200).json({
			success: true,
			data: savedReceipt,
		});
	} catch (error) {
		logger.error("\n===== UNEXPECTED ERROR =====");
		logger.error(`Error: ${error}`);
		logger.error("================================\n");
		res.status(500).json({
			error: "Failed to process receipt",
			errorType: "unknown_error",
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
			res.status(400).json({
				error: "Invalid receipt data",
				details: validationResult.error.issues,
			});
			return;
		}

		const validatedData = validationResult.data;

		// Delegate to service
		// We cast validatedData to any because our service expects the full type
		const savedReceipt = await receiptService.createManualReceipt(
			userId,
			validatedData as any
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
			res.status(400).json({
				error: "Invalid receipt data",
				details: validationResult.error.issues,
			});
			return;
		}

		const validatedData = validationResult.data;

		// Delegate to service
		const updatedReceipt = await receiptService.updateReceipt(
			id,
			userId,
			validatedData as any
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

		const receipt = await getReceiptByIdService(id);

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

		const receipts = await getReceiptsByUserId(userId, limit);

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

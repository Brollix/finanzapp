import { Response } from "express";
import { z } from "zod";
import fs from "fs/promises";
import { AuthenticatedRequest } from "../middleware/auth.js";
import {
	saveReceipt,
	getReceiptById as getReceiptByIdService,
	getReceiptsByUserId,
	updateReceipt as updateReceiptService,
} from "../services/database.service.js";
import { extractTextFromImage } from "../services/textract.service.js";
import { formatReceiptWithBedrock } from "../services/bedrock.service.js";

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
	items: z.array(ReceiptItemSchema).min(1),
	discounts: z.array(z.any()).optional(),
	total_saved: z.number().optional(),
});

export const processReceipt = async (
	req: AuthenticatedRequest,
	res: Response
): Promise<void> => {
	const startTime = Date.now();
	console.log("\n===== NEW RECEIPT PROCESSING REQUEST =====");

	try {
		// Validate image file
		if (!req.file) {
			console.log("No image file provided");
			res.status(400).json({
				error: "No image file provided",
				errorType: "validation_error",
			});
			return;
		}

		// Log image details
		console.log("Image received:");
		console.log("  - Size:", (req.file.size / 1024).toFixed(2), "KB");
		console.log("  - Mimetype:", req.file.mimetype);
		console.log("  - Original name:", req.file.originalname);

		// Get user ID from authenticated request
		const userId = req.user!.id;
		console.log("User ID:", userId);

		// Step 1: Extract text with Textract
		console.log("\nStep 1: Extracting text with Textract...");
		const textractStart = Date.now();
		let ocrText: string;
		try {
			// Read file from disk
			const imageBuffer = await fs.readFile(req.file.path);
			ocrText = await extractTextFromImage(imageBuffer);
			console.log("Textract successful");
			console.log("  - Time taken:", Date.now() - textractStart, "ms");
			console.log("  - Text length:", ocrText.length, "characters");
			console.log("  - Preview:", ocrText.substring(0, 100) + "...");
		} catch (error) {
			console.error("Textract failed:", error);
			res.status(500).json({
				error: "Failed to extract text from image",
				errorType: "textract_error",
				message: error instanceof Error ? error.message : "Unknown error",
			});
			return;
		}

		// Step 2: Format with Bedrock
		console.log("\nStep 2: Formatting receipt with Bedrock...");
		const bedrockStart = Date.now();
		let receiptData;
		try {
			receiptData = await formatReceiptWithBedrock(ocrText);
			console.log("Bedrock successful");
			console.log("  - Time taken:", Date.now() - bedrockStart, "ms");
			console.log("  - Supermarket:", receiptData.supermarket);
			console.log("  - Items count:", receiptData.items?.length || 0);
			console.log("  - Total:", receiptData.total);
		} catch (error) {
			console.error("Bedrock failed:", error);
			res.status(500).json({
				error: "Failed to format receipt data",
				errorType: "bedrock_error",
				message: error instanceof Error ? error.message : "Unknown error",
			});
			return;
		}

		// Step 3: Save to Supabase
		console.log("\nStep 3: Saving receipt to database...");
		const dbStart = Date.now();
		let savedReceipt;
		try {
			savedReceipt = await saveReceipt(userId, receiptData);
			console.log("Database save successful");
			console.log("  - Time taken:", Date.now() - dbStart, "ms");
			console.log("  - Receipt ID:", savedReceipt.id);
		} catch (error) {
			console.error("Database save failed:", error);
			res.status(500).json({
				error: "Failed to save receipt to database",
				errorType: "database_error",
				message: error instanceof Error ? error.message : "Unknown error",
			});
			return;
		}

		const totalTime = Date.now() - startTime;
		console.log("\n===== RECEIPT PROCESSING COMPLETED =====");
		console.log("Total time:", totalTime, "ms");
		console.log("===========================================\n");

		res.status(200).json({
			success: true,
			data: savedReceipt,
		});
	} catch (error) {
		console.error("\n===== UNEXPECTED ERROR =====");
		console.error("Error:", error);
		console.error("================================\n");
		res.status(500).json({
			error: "Failed to process receipt",
			errorType: "unknown_error",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	} finally {
		// Cleanup uploaded file
		if (req.file && req.file.path) {
			try {
				await fs.unlink(req.file.path);
				console.log("Uploaded file cleaned up:", req.file.path);
			} catch (cleanupError) {
				console.error("Failed to cleanup file:", cleanupError);
			}
		}
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

		// Calculate total if not provided
		if (validatedData.total === undefined) {
			validatedData.total = validatedData.items.reduce(
				(sum, item) => sum + item.price,
				0
			);
		}

		// Save to database
		console.log("Saving manual receipt to database...");
		// We cast validatedData to any because our service expects the full type,
		// and Zod schema might be slightly different (optional fields)
		const savedReceipt = await saveReceipt(userId, validatedData as any);
		console.log("Manual receipt saved successfully");

		res.status(201).json({
			success: true,
			data: savedReceipt,
		});
	} catch (error) {
		console.error("Error creating manual receipt:", error);
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

		// Calculate total if not provided
		if (validatedData.total === undefined) {
			validatedData.total = validatedData.items.reduce(
				(sum, item) => sum + item.price,
				0
			);
		}

		// Update in database
		console.log("Updating receipt in database...");
		const updatedReceipt = await updateReceiptService(
			id,
			userId,
			validatedData as any
		);
		console.log("Receipt updated successfully");

		res.status(200).json({
			success: true,
			data: updatedReceipt,
		});
	} catch (error) {
		console.error("Error updating receipt:", error);

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
		console.error("Error getting receipt:", error);
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
		console.log(`Fetching receipts for user: ${userId}`);
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
		console.error("Error getting receipts:", error);
		res.status(500).json({
			error: "Failed to get receipts",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
};

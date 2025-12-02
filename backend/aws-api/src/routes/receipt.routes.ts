import { Router, Request, Response } from "express";
import multer from "multer";
import fs from "fs/promises";
import { upload } from "../middleware/upload.js";
import { extractTextFromImage } from "../services/textract.service.js";
import { formatReceiptWithBedrock } from "../services/bedrock.service.js";
import {
	saveReceipt,
	getReceiptById,
	getReceiptsByUserId,
	updateReceipt,
} from "../services/database.service.js";
import { scanLimiter } from "../middleware/rateLimit.js";

const router = Router();

// Configure multer for memory storage
// Upload middleware is now imported from ../middleware/upload.js

// POST /api/receipt/process - Process a receipt image
router.post(
	"/process",
	scanLimiter,
	upload.single("image"),
	async (req: Request, res: Response): Promise<void> => {
		const startTime = Date.now();
		console.log("\n🔄 ===== NEW RECEIPT PROCESSING REQUEST =====");

		try {
			// Validate image file
			if (!req.file) {
				console.log("❌ No image file provided");
				res.status(400).json({
					error: "No image file provided",
					errorType: "validation_error",
				});
				return;
			}

			// Log image details
			console.log("📷 Image received:");
			console.log("  - Size:", (req.file.size / 1024).toFixed(2), "KB");
			console.log("  - Mimetype:", req.file.mimetype);
			console.log("  - Original name:", req.file.originalname);

			// Validate user ID
			const userId = req.body.userId || req.headers["x-user-id"];
			if (!userId) {
				console.log("❌ No user ID provided");
				res.status(400).json({
					error: "User ID is required",
					errorType: "validation_error",
				});
				return;
			}
			console.log("👤 User ID:", userId);

			// Step 1: Extract text with Textract
			console.log("\n📝 Step 1: Extracting text with Textract...");
			const textractStart = Date.now();
			let ocrText: string;
			try {
				// Read file from disk
				const imageBuffer = await fs.readFile(req.file.path);
				ocrText = await extractTextFromImage(imageBuffer);
				console.log("✅ Textract successful");
				console.log("  - Time taken:", Date.now() - textractStart, "ms");
				console.log("  - Text length:", ocrText.length, "characters");
				console.log("  - Preview:", ocrText.substring(0, 100) + "...");
			} catch (error) {
				console.error("❌ Textract failed:", error);
				res.status(500).json({
					error: "Failed to extract text from image",
					errorType: "textract_error",
					message: error instanceof Error ? error.message : "Unknown error",
				});
				return;
			}

			// Step 2: Format with Bedrock
			console.log("\n🤖 Step 2: Formatting receipt with Bedrock...");
			const bedrockStart = Date.now();
			let receiptData;
			try {
				receiptData = await formatReceiptWithBedrock(ocrText);
				console.log("✅ Bedrock successful");
				console.log("  - Time taken:", Date.now() - bedrockStart, "ms");
				console.log("  - Supermarket:", receiptData.supermarket);
				console.log("  - Items count:", receiptData.items?.length || 0);
				console.log("  - Total:", receiptData.total);
			} catch (error) {
				console.error("❌ Bedrock failed:", error);
				res.status(500).json({
					error: "Failed to format receipt data",
					errorType: "bedrock_error",
					message: error instanceof Error ? error.message : "Unknown error",
				});
				return;
			}

			// Step 3: Save to Supabase
			console.log("\n💾 Step 3: Saving receipt to database...");
			const dbStart = Date.now();
			let savedReceipt;
			try {
				savedReceipt = await saveReceipt(userId as string, receiptData);
				console.log("✅ Database save successful");
				console.log("  - Time taken:", Date.now() - dbStart, "ms");
				console.log("  - Receipt ID:", savedReceipt.id);
			} catch (error) {
				console.error("❌ Database save failed:", error);
				res.status(500).json({
					error: "Failed to save receipt to database",
					errorType: "database_error",
					message: error instanceof Error ? error.message : "Unknown error",
				});
				return;
			}

			const totalTime = Date.now() - startTime;
			console.log("\n✅ ===== RECEIPT PROCESSING COMPLETED =====");
			console.log("⏱️  Total time:", totalTime, "ms");
			console.log("===========================================\n");

			res.status(200).json({
				success: true,
				data: savedReceipt,
			});
		} catch (error) {
			console.error("\n❌ ===== UNEXPECTED ERROR =====");
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
					console.log("🧹 Uploaded file cleaned up:", req.file.path);
				} catch (cleanupError) {
					console.error("❌ Failed to cleanup file:", cleanupError);
				}
			}
		}
	}
);

// POST /api/receipt/manual - Create a receipt manually
router.post("/manual", async (req: Request, res: Response): Promise<void> => {
	try {
		const { userId, receiptData } = req.body;

		// Validate required fields
		if (!userId) {
			res.status(400).json({ error: "User ID is required" });
			return;
		}

		if (!receiptData) {
			res.status(400).json({ error: "Receipt data is required" });
			return;
		}

		// Validate receipt data structure
		if (
			!receiptData.supermarket ||
			!receiptData.datetime ||
			!receiptData.items ||
			!Array.isArray(receiptData.items)
		) {
			res.status(400).json({
				error:
					"Invalid receipt data. Required fields: supermarket, datetime, items (array)",
			});
			return;
		}

		// Validate items
		if (receiptData.items.length === 0) {
			res.status(400).json({ error: "Receipt must have at least one item" });
			return;
		}

		for (const item of receiptData.items) {
			if (
				!item.product ||
				typeof item.quantity !== "number" ||
				typeof item.price !== "number"
			) {
				res.status(400).json({
					error:
						"Invalid item data. Each item must have: product (string), quantity (number), price (number)",
				});
				return;
			}
		}

		// Calculate total if not provided
		if (typeof receiptData.total !== "number") {
			receiptData.total = receiptData.items.reduce(
				(sum: number, item: any) => sum + item.price,
				0
			);
		}

		// Save to database
		console.log("Saving manual receipt to database...");
		const savedReceipt = await saveReceipt(userId, receiptData);
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
});

// PUT /api/receipt/:id - Update a receipt
router.put("/:id", async (req: Request, res: Response): Promise<void> => {
	try {
		const { id } = req.params;
		const { userId, receiptData } = req.body;

		// Validate required fields
		if (!userId) {
			res.status(400).json({ error: "User ID is required" });
			return;
		}

		if (!receiptData) {
			res.status(400).json({ error: "Receipt data is required" });
			return;
		}

		// Validate receipt data structure
		if (
			!receiptData.supermarket ||
			!receiptData.datetime ||
			!receiptData.items ||
			!Array.isArray(receiptData.items)
		) {
			res.status(400).json({
				error:
					"Invalid receipt data. Required fields: supermarket, datetime, items (array)",
			});
			return;
		}

		// Validate items
		if (receiptData.items.length === 0) {
			res.status(400).json({ error: "Receipt must have at least one item" });
			return;
		}

		for (const item of receiptData.items) {
			if (
				!item.product ||
				typeof item.quantity !== "number" ||
				typeof item.price !== "number"
			) {
				res.status(400).json({
					error:
						"Invalid item data. Each item must have: product (string), quantity (number), price (number)",
				});
				return;
			}
		}

		// Calculate total if not provided
		if (typeof receiptData.total !== "number") {
			receiptData.total = receiptData.items.reduce(
				(sum: number, item: any) => sum + item.price,
				0
			);
		}

		// Update in database
		console.log("Updating receipt in database...");
		const updatedReceipt = await updateReceipt(id, userId, receiptData);
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
});

// GET /api/receipt/:id - Get a receipt by ID
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
	try {
		const { id } = req.params;

		const receipt = await getReceiptById(id);

		if (!receipt) {
			res.status(404).json({ error: "Receipt not found" });
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
});

// GET /api/receipt/user/:userId - Get all receipts for a user
router.get(
	"/user/:userId",
	async (req: Request, res: Response): Promise<void> => {
		try {
			const { userId } = req.params;
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
	}
);

export default router;

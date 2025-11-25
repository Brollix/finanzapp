import { Router, Request, Response } from "express";
import multer from "multer";
import { extractTextFromImage } from "../services/textract.service.js";
import { formatReceiptWithBedrock } from "../services/bedrock.service.js";
import {
	saveReceipt,
	getReceiptById,
	getReceiptsByUserId,
} from "../services/database.service.js";

const router = Router();

// Configure multer for memory storage
const upload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: 10 * 1024 * 1024, // 10MB limit
	},
	fileFilter: (req, file, cb) => {
		// Accept images only
		if (!file.mimetype.startsWith("image/")) {
			cb(new Error("Only image files are allowed"));
			return;
		}
		cb(null, true);
	},
});

// POST /api/receipt/process - Process a receipt image
router.post(
	"/process",
	upload.single("image"),
	async (req: Request, res: Response): Promise<void> => {
		try {
			if (!req.file) {
				res.status(400).json({ error: "No image file provided" });
				return;
			}

			const userId = req.body.userId || req.headers["x-user-id"];
			if (!userId) {
				res.status(400).json({ error: "User ID is required" });
				return;
			}

			// Step 1: Extract text with Textract
			console.log("Extracting text from image...");
			const ocrText = await extractTextFromImage(req.file.buffer);
			console.log("Text extracted successfully");

			// Step 2: Format with Bedrock
			console.log("Formatting receipt with Bedrock...");
			const receiptData = await formatReceiptWithBedrock(ocrText);
			console.log("Receipt formatted successfully");

			// Step 3: Save to Supabase
			console.log("Saving receipt to database...");
			const savedReceipt = await saveReceipt(userId as string, receiptData);
			console.log("Receipt saved successfully");

			res.status(200).json({
				success: true,
				data: savedReceipt,
			});
		} catch (error) {
			console.error("Error processing receipt:", error);
			res.status(500).json({
				error: "Failed to process receipt",
				message: error instanceof Error ? error.message : "Unknown error",
			});
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

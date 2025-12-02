import { Router, Request, Response } from "express";
import multer from "multer";
import { extractTextFromImage } from "../services/textract.service.js";
import { formatReceiptWithBedrock } from "../services/bedrock.service.js";
import { scanLimiter } from "../middleware/rateLimit.js";

const router = Router();

// Configure multer for memory storage
const upload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: 10 * 1024 * 1024, // 10MB limit
	},
	fileFilter: (req, file, cb) => {
		if (!file.mimetype.startsWith("image/")) {
			cb(new Error("Only image files are allowed"));
			return;
		}
		cb(null, true);
	},
});

// POST /api/test/process - Test endpoint without Supabase
router.post(
	"/process",
	scanLimiter,
	upload.single("image"),
	async (req: Request, res: Response): Promise<void> => {
		try {
			if (!req.file) {
				res.status(400).json({ error: "No image file provided" });
				return;
			}

			console.log("Step 1: Extracting text with Textract...");
			const startTextract = Date.now();
			const ocrText = await extractTextFromImage(req.file.buffer);
			const textractTime = Date.now() - startTextract;
			console.log(`Textract completed in ${textractTime}ms`);
			console.log(
				`Extracted text (${ocrText.length} chars):\n${ocrText.substring(
					0,
					200
				)}...`
			);

			console.log("\nStep 2: Formatting with Bedrock...");
			const startBedrock = Date.now();
			const receiptData = await formatReceiptWithBedrock(ocrText);
			const bedrockTime = Date.now() - startBedrock;
			console.log(`Bedrock completed in ${bedrockTime}ms`);

			const totalTime = Date.now() - startTextract;

			res.status(200).json({
				success: true,
				message: "Receipt processed successfully (test mode - not saved)",
				data: receiptData,
				metadata: {
					textractTimeMs: textractTime,
					bedrockTimeMs: bedrockTime,
					totalTimeMs: totalTime,
					ocrTextLength: ocrText.length,
					extractedText: ocrText,
				},
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

// POST /api/test/bedrock-only - Test Bedrock formatting with text input
router.post(
	"/bedrock-only",
	scanLimiter,
	async (req: Request, res: Response): Promise<void> => {
		try {
			const { text } = req.body;

			if (!text || typeof text !== "string") {
				res.status(400).json({ error: "Text is required in request body" });
				return;
			}

			console.log("Testing Bedrock with provided text...");
			console.log(
				`Input text (${text.length} chars):\n${text.substring(0, 200)}...`
			);

			const startBedrock = Date.now();
			const receiptData = await formatReceiptWithBedrock(text);
			const bedrockTime = Date.now() - startBedrock;

			console.log(`Bedrock completed in ${bedrockTime}ms`);

			res.status(200).json({
				success: true,
				message: "Text formatted successfully with Bedrock",
				data: receiptData,
				metadata: {
					bedrockTimeMs: bedrockTime,
					inputTextLength: text.length,
				},
			});
		} catch (error) {
			console.error("Error formatting with Bedrock:", error);
			res.status(500).json({
				error: "Failed to format text with Bedrock",
				message: error instanceof Error ? error.message : "Unknown error",
			});
		}
	}
);

export default router;

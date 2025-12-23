import { extractTextFromImageOptimized } from "./textract-optimized.service.js";
import { formatReceiptWithBedrockParallel } from "./bedrock.service.js";
import {
	saveReceiptFast,
	processReceiptItemsInBackground,
} from "./database.service.js";
import { ReceiptData, Receipt } from "../types/receipt.types.js";
import logger from "../utils/logger.js";
import { progressTracker } from "./progress-tracker.service.js";

/**
 * Optimized receipt service with early return
 * - Uses optimized Textract (image optimization)
 * - Saves receipt fast (items as JSON)
 * - Processes products in background
 * - Returns response in ~6-8s instead of 30s
 */
export const receiptServiceOptimized = {
	/**
	 * Process an image buffer with optimizations for faster response
	 * @param jobId Optional job ID for progress tracking
	 */
	async processReceiptFromImage(
		userId: string,
		imageBuffer: Buffer,
		fileDetails?: { size: number; mimetype: string; originalname: string },
		jobId?: string
	): Promise<Receipt> {
		const startTime = Date.now();

		// Update progress if jobId provided
		if (jobId) {
			progressTracker.updateProgress(jobId, {
				status: "extracting_text",
				progress: 10,
				message: "Extrayendo texto de la imagen...",
			});
		}

		// Log image details if provided
		if (fileDetails) {
			logger.info("Image received:");
			logger.info(`  - Size: ${(fileDetails.size / 1024).toFixed(2)} KB`);
			logger.info(`  - Mimetype: ${fileDetails.mimetype}`);
			logger.info(`  - Original name: ${fileDetails.originalname}`);
		}

		// Step 1: Extract text with optimized Textract
		logger.info("\nStep 1: Extracting text with optimized Textract...");
		const textractStart = Date.now();
		const ocrText = await extractTextFromImageOptimized(imageBuffer);

		logger.info("Textract optimized successful");
		logger.info(`  - Time taken: ${Date.now() - textractStart} ms`);
		logger.info(`  - Text length: ${ocrText.length} characters`);
		logger.debug(`  - Preview: ${ocrText.substring(0, 100)}...`);

		// Update progress
		if (jobId) {
			progressTracker.updateProgress(jobId, {
				status: "processing_ai",
				progress: 40,
				message: "Procesando con Inteligencia Artificial...",
			});
		}

		// Step 2: Format with Bedrock (parallel processing)
		logger.info("\nStep 2: Formatting receipt with Bedrock (parallel)...");
		const bedrockStart = Date.now();
		const receiptData = await formatReceiptWithBedrockParallel(ocrText);

		logger.info("Bedrock successful");
		logger.info(`  - Time taken: ${Date.now() - bedrockStart} ms`);
		logger.info(`  - Supermarket: ${receiptData.supermarket}`);
		logger.info(`  - Items count: ${receiptData.items?.length || 0}`);
		logger.info(`  - Total: ${receiptData.total}`);

		// Update progress
		if (jobId) {
			progressTracker.updateProgress(jobId, {
				status: "saving",
				progress: 70,
				message: "Guardando ticket...",
			});
		}

		// Step 3: Save receipt fast (with items as JSON, no product processing)
		logger.info("\nStep 3: Saving receipt (fast mode)...");
		const dbStart = Date.now();
		const savedReceipt = await saveReceiptFast(userId, receiptData);

		logger.info("Database save (fast) successful");
		logger.info(`  - Time taken: ${Date.now() - dbStart} ms`);
		logger.info(`  - Receipt ID: ${savedReceipt.id}`);

		// Update progress to completed
		if (jobId) {
			progressTracker.completeJob(jobId, savedReceipt.id);
		}

		// Step 4: Process products in background (non-blocking)
		logger.info("\nStep 4: Starting background processing of products...");
		processReceiptItemsInBackground(savedReceipt.id, receiptData.items).catch(
			(error) => {
				logger.error(`Background processing failed (non-critical): ${error}`);
				// Don't throw - receipt is already saved
			}
		);

		const totalTime = Date.now() - startTime;
		logger.info("\n===== RECEIPT PROCESSING COMPLETED (OPTIMIZED) =====");
		logger.info(`Total time: ${totalTime} ms`);
		logger.info(
			`Response returned in ${totalTime}ms (products processing in background)`
		);

		return savedReceipt;
	},
};

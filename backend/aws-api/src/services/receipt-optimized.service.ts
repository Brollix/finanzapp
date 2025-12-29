import { extractTextFromImageOptimized } from "./textract-optimized.service.js";
import { formatReceiptWithBedrockParallel } from "./bedrock.service.js";
import {
	saveReceiptFast,
	processReceiptItemsInBackground,
} from "./database.service.js";
import { ReceiptData, Receipt } from "../types/receipt.types.js";
import logger, { logPerformance } from "../utils/logger.js";
import { progressTracker } from "./progress-tracker.service.js";
import { cacheService } from "./cache.service.js";
import { imageOptimizer } from "./image-optimizer.service.js";

/**
 * Optimized receipt service with early return
 * - Uses caching to avoid duplicate processing
 * - Uses optimized Textract (image optimization)
 * - Saves receipt fast (items as JSON)
 * - Processes products in background
 * - Returns response in ~6-8s instead of 30s (or 50ms if cached)
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
				status: "checking_cache",
				progress: 5,
				message: "Verificando caché...",
			});
		}

		// Log image details if provided
		if (fileDetails) {
			logger.info("Image received:", {
				size_kb: (fileDetails.size / 1024).toFixed(2),
				mimetype: fileDetails.mimetype,
				originalname: fileDetails.originalname,
			});
		}

		// Step 0: Check cache first
		logger.info("Step 0: Checking cache...");
		const cachedResult = await cacheService.get(imageBuffer);

		if (cachedResult) {
			logger.info("Cache hit! Returning cached result", {
				cache_stats: cacheService.getStats(),
			});

			// Save cached result for this user
			const savedReceipt = await saveReceiptFast(userId, cachedResult);

			if (jobId) {
				progressTracker.completeJob(jobId, savedReceipt.id);
			}

			logPerformance("receipt_processing_cached", Date.now() - startTime, {
				receipt_id: savedReceipt.id,
				from_cache: true,
			});

			return savedReceipt;
		}

		logger.info("Cache miss, processing receipt...");

		// Step 0.5: Validate and optimize image
		if (jobId) {
			progressTracker.updateProgress(jobId, {
				status: "optimizing_image",
				progress: 10,
				message: "Optimizando imagen...",
			});
		}

		logger.info("Step 0.5: Validating and optimizing image...");
		const validation = await imageOptimizer.validateImage(imageBuffer);

		if (!validation.valid) {
			throw new Error(`Invalid image: ${validation.error}`);
		}

		const optimizationResult = await imageOptimizer.optimizeForOCR(imageBuffer);

		logger.info("Image optimized", {
			original_size_kb: Math.round(optimizationResult.originalSize / 1024),
			optimized_size_kb: Math.round(optimizationResult.optimizedSize / 1024),
			compression_ratio: optimizationResult.compressionRatio,
			saved_percentage: Math.round(
				((optimizationResult.originalSize - optimizationResult.optimizedSize) /
					optimizationResult.originalSize) *
					100
			),
		});

		// Use optimized image for processing
		const processBuffer = optimizationResult.buffer;

		// Update progress
		if (jobId) {
			progressTracker.updateProgress(jobId, {
				status: "extracting_text",
				progress: 20,
				message: "Extrayendo texto de la imagen...",
			});
		}

		// Step 1: Extract text with optimized Textract
		logger.info("Step 1: Extracting text with optimized Textract...");
		const textractStart = Date.now();
		const ocrText = await extractTextFromImageOptimized(processBuffer);

		logPerformance("textract_extraction", Date.now() - textractStart, {
			text_length: ocrText.length,
			optimized_image: true,
		});

		logger.info("Textract optimized successful", {
			time_ms: Date.now() - textractStart,
			text_length: ocrText.length,
			preview: ocrText.substring(0, 100) + "...",
		});

		// Update progress
		if (jobId) {
			progressTracker.updateProgress(jobId, {
				status: "processing_ai",
				progress: 50,
				message: "Procesando con Inteligencia Artificial...",
			});
		}

		// Step 2: Format with Bedrock (parallel processing)
		logger.info("Step 2: Formatting receipt with Bedrock (parallel)...");
		const bedrockStart = Date.now();
		const receiptData = await formatReceiptWithBedrockParallel(ocrText);

		logPerformance("bedrock_processing", Date.now() - bedrockStart, {
			supermarket: receiptData.supermarket,
			items_count: receiptData.items?.length || 0,
			total: receiptData.total,
		});

		logger.info("Bedrock successful", {
			time_ms: Date.now() - bedrockStart,
			supermarket: receiptData.supermarket,
			items_count: receiptData.items?.length || 0,
			total: receiptData.total,
		});

		// Update progress
		if (jobId) {
			progressTracker.updateProgress(jobId, {
				status: "saving",
				progress: 80,
				message: "Guardando ticket...",
			});
		}

		// Step 3: Save receipt fast (with items as JSON, no product processing)
		logger.info("Step 3: Saving receipt (fast mode)...");
		const dbStart = Date.now();
		const savedReceipt = await saveReceiptFast(userId, receiptData);

		logPerformance("database_save", Date.now() - dbStart, {
			receipt_id: savedReceipt.id,
		});

		logger.info("Database save (fast) successful", {
			time_ms: Date.now() - dbStart,
			receipt_id: savedReceipt.id,
		});

		// Step 4: Cache the result for future requests
		logger.info("Step 4: Caching result...");
		await cacheService.set(imageBuffer, receiptData);

		// Update progress to completed
		if (jobId) {
			progressTracker.completeJob(jobId, savedReceipt.id);
		}

		// Step 5: Process products in background (non-blocking)
		logger.info("Step 5: Starting background processing of products...");
		processReceiptItemsInBackground(savedReceipt.id, receiptData.items).catch(
			(error) => {
				logger.error("Background processing failed (non-critical)", {
					error: error instanceof Error ? error.message : String(error),
					receipt_id: savedReceipt.id,
				});
				// Don't throw - receipt is already saved
			}
		);

		const totalTime = Date.now() - startTime;

		logPerformance("receipt_processing_complete", totalTime, {
			receipt_id: savedReceipt.id,
			from_cache: false,
			cache_stats: cacheService.getStats(),
		});

		logger.info("===== RECEIPT PROCESSING COMPLETED (OPTIMIZED) =====", {
			total_time_ms: totalTime,
			receipt_id: savedReceipt.id,
			background_processing: true,
		});

		return savedReceipt;
	},
};

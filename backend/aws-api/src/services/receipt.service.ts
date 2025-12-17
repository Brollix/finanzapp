import { extractTextFromImage } from "./textract.service.js";
import { formatReceiptWithBedrock } from "./bedrock.service.js";
import {
	saveReceipt,
	updateReceipt as updateReceiptInDb,
} from "./database.service.js";
import { ReceiptData, Receipt } from "../types/receipt.types.js";
import logger from "../utils/logger.js";

/**
 * Service to handle receipt processing orchestration
 */
export const receiptService = {
	/**
	 * Process an image buffer to extract text, format it, and save to DB
	 */
	async processReceiptFromImage(
		userId: string,
		imageBuffer: Buffer,
		fileDetails?: { size: number; mimetype: string; originalname: string }
	): Promise<Receipt> {
		const startTime = Date.now();

		// Log image details if provided
		if (fileDetails) {
			logger.info("Image received:");
			logger.info(`  - Size: ${(fileDetails.size / 1024).toFixed(2)} KB`);
			logger.info(`  - Mimetype: ${fileDetails.mimetype}`);
			logger.info(`  - Original name: ${fileDetails.originalname}`);
		}

		// Step 1: Extract text with Textract
		logger.info("\nStep 1: Extracting text with Textract...");
		const textractStart = Date.now();
		const ocrText = await extractTextFromImage(imageBuffer);

		logger.info("Textract successful");
		logger.info(`  - Time taken: ${Date.now() - textractStart} ms`);
		logger.info(`  - Text length: ${ocrText.length} characters`);
		logger.debug(`  - Preview: ${ocrText.substring(0, 100)}...`);

		// Step 2: Format with Bedrock
		logger.info("\nStep 2: Formatting receipt with Bedrock...");
		const bedrockStart = Date.now();
		const receiptData = await formatReceiptWithBedrock(ocrText);

		logger.info("Bedrock successful");
		logger.info(`  - Time taken: ${Date.now() - bedrockStart} ms`);
		logger.info(`  - Supermarket: ${receiptData.supermarket}`);
		logger.info(`  - Items count: ${receiptData.items?.length || 0}`);
		logger.info(`  - Total: ${receiptData.total}`);

		// Step 3: Save to Supabase
		logger.info("\nStep 3: Saving receipt to database...");
		const dbStart = Date.now();
		const savedReceipt = await saveReceipt(userId, receiptData);

		logger.info("Database save successful");
		logger.info(`  - Time taken: ${Date.now() - dbStart} ms`);
		logger.info(`  - Receipt ID: ${savedReceipt.id}`);

		const totalTime = Date.now() - startTime;
		logger.info("\n===== RECEIPT PROCESSING COMPLETED =====");
		logger.info(`Total time: ${totalTime} ms`);

		return savedReceipt;
	},

	/**
	 * Create a receipt manually
	 */
	async createManualReceipt(
		userId: string,
		receiptData: ReceiptData
	): Promise<Receipt> {
		// Note: Totals calculation logic is handled inside saveReceipt in database.service
		logger.info("Saving manual receipt to database...");
		const savedReceipt = await saveReceipt(userId, receiptData);
		logger.info("Manual receipt saved successfully");
		return savedReceipt;
	},

	/**
	 * Update an existing receipt
	 */
	async updateReceipt(
		receiptId: string,
		userId: string,
		receiptData: ReceiptData
	): Promise<Receipt> {
		logger.info("Updating receipt in database...");
		const updatedReceipt = await updateReceiptInDb(
			receiptId,
			userId,
			receiptData
		);
		logger.info("Receipt updated successfully");
		return updatedReceipt;
	},
};

import {
	saveReceipt,
	updateReceipt as updateReceiptInDb,
} from "./database.service.js";
import { ReceiptData, Receipt } from "../types/receipt.types.js";
import logger from "../utils/logger.js";
import { receiptServiceOptimized } from "./receipt-optimized.service.js";

/**
 * Service to handle receipt processing orchestration
 * Now uses optimized service for faster processing
 */
export const receiptService = {
	/**
	 * Process an image buffer to extract text, format it, and save to DB
	 * Uses optimized service with early return for faster response
	 */
	async processReceiptFromImage(
		userId: string,
		imageBuffer: Buffer,
		fileDetails?: { size: number; mimetype: string; originalname: string }
	): Promise<Receipt> {
		// Use optimized service for faster processing
		return receiptServiceOptimized.processReceiptFromImage(
			userId,
			imageBuffer,
			fileDetails
		);
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

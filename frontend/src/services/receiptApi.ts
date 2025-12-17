import { ReceiptData, Receipt } from "../types/receipt.types";
import { apiClient } from "./api";

/**
 * Service to upload a receipt image and obtain the formatted receipt data.
 */
export const receiptApi = {
	/**
	 * Get all receipts for a specific user.
	 * @param userId Current authenticated user ID
	 */
	async getUserReceipts(): Promise<Receipt[]> {
		return apiClient.get<Receipt[]>("/api/receipt/user/me");
	},

	/**
	 * Sends a receipt image to the backend and returns the formatted receipt data.
	 * @param imageUri Local URI of the captured photo (e.g., expo file URI)
	 * @param userId Current authenticated user ID
	 */
	async processReceipt(imageUri: string): Promise<Receipt> {
		const form = new FormData();
		// Append the image; the backend expects field name "image"
		form.append("image", {
			uri: imageUri,
			name: "ticket.jpg", // Force filename to ticket.jpg for AWS compatibility
			type: "image/jpeg", // Force mime type to image/jpeg
		} as any);

		return apiClient.post<Receipt>("/api/receipt/process", form);
	},

	/**
	 * Creates a receipt manually without image processing.
	 * @param receiptData The receipt data to save
	 * @param userId Current authenticated user ID
	 */
	async createManualReceipt(receiptData: ReceiptData): Promise<Receipt> {
		return apiClient.post<Receipt>("/api/receipt/manual", { receiptData });
	},

	/**
	 * Updates an existing receipt.
	 * @param receiptId ID of the receipt to update
	 * @param receiptData The updated receipt data
	 * @param userId Current authenticated user ID
	 */
	async updateReceipt(
		receiptId: string,
		receiptData: ReceiptData
	): Promise<Receipt> {
		return apiClient.put<Receipt>(`/api/receipt/${receiptId}`, {
			receiptData,
		});
	},
};

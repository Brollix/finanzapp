import { ReceiptData, Receipt } from "../types/receipt.types";
import { apiClient } from "./api";

export interface ProcessingProgress {
	status:
		| "extracting_text"
		| "processing_ai"
		| "saving"
		| "completed"
		| "error";
	progress: number; // 0-100
	message: string;
	receiptId?: string;
	error?: string;
}

export interface ProcessReceiptResponse {
	success: boolean;
	data: Receipt;
	jobId?: string;
}

/**
 * Service to upload a receipt image and obtain the formatted receipt data.
 */
export const receiptApi = {
	/**
	 * Get all receipts for a specific user.
	 * @param userId Current authenticated user ID
	 */
	async getUserReceipts(): Promise<Receipt[]> {
		const response = await apiClient.get<{ data: Receipt[]; count: number }>(
			"/api/receipt/user/me"
		);
		// Backend returns { success: true, data: [...], count: N }
		// apiClient returns full response when additional fields present
		return Array.isArray(response) ? response : response.data;
	},

	/**
	 * Sends a receipt image to the backend and returns the formatted receipt data.
	 * @param imageUri Local URI of the captured photo (e.g., expo file URI)
	 * @returns Receipt data and optional jobId for progress tracking
	 */
	async processReceipt(
		imageUri: string,
		options: { preview?: boolean } = { preview: true }
	): Promise<ProcessReceiptResponse> {
		console.log("[ReceiptAPI] Processing receipt with URI:", imageUri);

		const form = new FormData();
		// Append the image; the backend expects field name "image"
		const imageData = {
			uri: imageUri,
			name: "ticket.jpg", // Force filename to ticket.jpg for AWS compatibility
			type: "image/jpeg", // Force mime type to image/jpeg
		} as any;

		console.log("[ReceiptAPI] Image data to append:", imageData);

		console.log("[ReceiptAPI] FormData created, sending request...");

		// Use query param on URL for preview flag availability before body parsing
		const url = options.preview
			? "/api/receipt/process?preview=true"
			: "/api/receipt/process";

		try {
			const response = await apiClient.post<ProcessReceiptResponse>(url, form);
			console.log("[ReceiptAPI] Response received:", response);
			return response;
		} catch (error) {
			console.error("[ReceiptAPI] Error in processReceipt:", error);
			throw error;
		}
	},

	/**
	 * Get processing status for a job
	 * @param jobId Job ID returned from processReceipt
	 */
	async getProcessingStatus(jobId: string): Promise<ProcessingProgress> {
		const response = await apiClient.get<ProcessingProgress>(
			`/api/receipt/process/${jobId}/status`
		);
		// apiClient already unpacks the data property, so response is ProcessingProgress
		return response;
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

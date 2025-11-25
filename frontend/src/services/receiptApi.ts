import { ReceiptData, Receipt } from "../types/receipt.types";
import { resolveBackendUrl } from "../utils/getBackendUrl";
import Constants from "expo-constants";

/**
 * Service to upload a receipt image and obtain the formatted receipt data.
 */
export const receiptApi = {
	/**
	 * Get all receipts for a specific user.
	 * @param userId Current authenticated user ID
	 */
	async getUserReceipts(userId: string): Promise<Receipt[]> {
		const backendUrl =
			process.env.EXPO_PUBLIC_BACKEND_URL ||
			Constants.expoConfig?.extra?.backendUrl ||
			resolveBackendUrl(undefined, 8080);
		const url = `${backendUrl}/api/receipt/user/${userId}`;

		const response = await fetch(url, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
		});

		if (!response.ok) {
			const errText = await response.text();
			throw new Error(`Receipt API error ${response.status}: ${errText}`);
		}

		const json = await response.json();
		return json.data as Receipt[];
	},
	/**
	 * Sends a receipt image to the backend and returns the formatted receipt data.
	 * @param imageUri Local URI of the captured photo (e.g., expo file URI)
	 * @param userId Current authenticated user ID
	 */
	async processReceipt(imageUri: string, userId: string): Promise<ReceiptData> {
		// Use env variable if set, otherwise resolve dynamically
		const backendUrl =
			process.env.EXPO_PUBLIC_BACKEND_URL ||
			Constants.expoConfig?.extra?.backendUrl ||
			resolveBackendUrl(undefined, 8080);
		const url = `${backendUrl}/api/receipt/process`;
		const form = new FormData();
		// Append the image; the backend expects field name "image"
		form.append("image", {
			uri: imageUri,
			name: "receipt.jpg",
			type: "image/jpeg",
		} as any);
		// Include userId in the form data
		form.append("userId", userId);

		const response = await fetch(url, {
			method: "POST",
			body: form,
		});
		if (!response.ok) {
			const errText = await response.text();
			throw new Error(`Receipt API error ${response.status}: ${errText}`);
		}
		const json = await response.json();
		// Backend returns { success: true, data: receipt }
		return json.data as ReceiptData;
	},

	/**
	 * Creates a receipt manually without image processing.
	 * @param receiptData The receipt data to save
	 * @param userId Current authenticated user ID
	 */
	async createManualReceipt(
		receiptData: ReceiptData,
		userId: string
	): Promise<ReceiptData> {
		const backendUrl =
			process.env.EXPO_PUBLIC_BACKEND_URL ||
			Constants.expoConfig?.extra?.backendUrl ||
			resolveBackendUrl(undefined, 8080);
		const url = `${backendUrl}/api/receipt/manual`;

		const response = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				userId,
				receiptData,
			}),
		});

		if (!response.ok) {
			const errText = await response.text();
			throw new Error(`Receipt API error ${response.status}: ${errText}`);
		}

		const json = await response.json();
		return json.data as ReceiptData;
	},

	/**
	 * Updates an existing receipt.
	 * @param receiptId ID of the receipt to update
	 * @param receiptData The updated receipt data
	 * @param userId Current authenticated user ID
	 */
	async updateReceipt(
		receiptId: string,
		receiptData: ReceiptData,
		userId: string
	): Promise<ReceiptData> {
		const backendUrl =
			process.env.EXPO_PUBLIC_BACKEND_URL ||
			Constants.expoConfig?.extra?.backendUrl ||
			resolveBackendUrl(undefined, 8080);
		const url = `${backendUrl}/api/receipt/${receiptId}`;

		const response = await fetch(url, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				userId,
				receiptData,
			}),
		});

		if (!response.ok) {
			const errText = await response.text();
			throw new Error(`Receipt API error ${response.status}: ${errText}`);
		}

		const json = await response.json();
		return json.data as ReceiptData;
	},
};

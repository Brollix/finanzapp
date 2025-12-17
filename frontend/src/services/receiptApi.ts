import { ReceiptData, Receipt } from "../types/receipt.types";
import { resolveBackendUrl } from "../utils/getBackendUrl";
import Constants from "expo-constants";
import { supabase } from "../lib/supabase";

/**
 * Service to upload a receipt image and obtain the formatted receipt data.
 */
export const receiptApi = {
	/**
	 * Get all receipts for a specific user.
	 * @param userId Current authenticated user ID
	 */
	async getUserReceipts(): Promise<Receipt[]> {
		const backendUrl =
			process.env.EXPO_PUBLIC_BACKEND_URL ||
			Constants.expoConfig?.extra?.backendUrl ||
			resolveBackendUrl(undefined, 8080);
		const url = `${backendUrl}/api/receipt/user/me`;

		const {
			data: { session },
		} = await supabase.auth.getSession();
		const token = session?.access_token;

		const response = await fetch(url, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
		});

		if (!response.ok) {
			const errText = await response.text();
			// Try to parse error as JSON to extract errorType
			let errorType: string | undefined;
			let errorMessage: string = errText;
			
			try {
				const errorJson = JSON.parse(errText);
				if (errorJson.errorType) {
					errorType = errorJson.errorType;
				}
				if (errorJson.message) {
					errorMessage = errorJson.message;
				} else if (errorJson.error) {
					errorMessage = errorJson.error;
				}
			} catch {
				// If parsing fails, use errText as-is (plain text error)
			}
			
			// Include errorType in error message for easier detection
			const errorMsg = errorType
				? `Receipt API error ${response.status}: errorType: ${errorType} | ${errorMessage}`
				: `Receipt API error ${response.status}: ${errorMessage}`;
			
			throw new Error(errorMsg);
		}

		const json = await response.json();
		return json.data as Receipt[];
	},
	/**
	 * Sends a receipt image to the backend and returns the formatted receipt data.
	 * @param imageUri Local URI of the captured photo (e.g., expo file URI)
	 * @param userId Current authenticated user ID
	 */
	async processReceipt(imageUri: string): Promise<Receipt> {
		// Use env variable if set, otherwise resolve dynamically
		const backendUrl =
			process.env.EXPO_PUBLIC_BACKEND_URL ||
			Constants.expoConfig?.extra?.backendUrl ||
			resolveBackendUrl(undefined, 8080);
		const url = `${backendUrl}/api/receipt/process`;

		const {
			data: { session },
		} = await supabase.auth.getSession();
		const token = session?.access_token;

		const form = new FormData();
		// Append the image; the backend expects field name "image"
		form.append("image", {
			uri: imageUri,
			name: "ticket.jpg", // Force filename to ticket.jpg for AWS compatibility
			type: "image/jpeg", // Force mime type to image/jpeg
		} as any);

		const response = await fetch(url, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${token}`,
			},
			body: form,
		});
		if (!response.ok) {
			const errText = await response.text();
			// Try to parse error as JSON to extract errorType
			let errorType: string | undefined;
			let errorMessage: string = errText;
			
			try {
				const errorJson = JSON.parse(errText);
				if (errorJson.errorType) {
					errorType = errorJson.errorType;
				}
				if (errorJson.message) {
					errorMessage = errorJson.message;
				} else if (errorJson.error) {
					errorMessage = errorJson.error;
				}
			} catch {
				// If parsing fails, use errText as-is (plain text error)
			}
			
			// Include errorType in error message for easier detection
			const errorMsg = errorType
				? `Receipt API error ${response.status}: errorType: ${errorType} | ${errorMessage}`
				: `Receipt API error ${response.status}: ${errorMessage}`;
			
			throw new Error(errorMsg);
		}
		const json = await response.json();
		// Backend returns { success: true, data: receipt }
		return json.data as Receipt;
	},

	/**
	 * Creates a receipt manually without image processing.
	 * @param receiptData The receipt data to save
	 * @param userId Current authenticated user ID
	 */
	async createManualReceipt(receiptData: ReceiptData): Promise<Receipt> {
		const backendUrl =
			process.env.EXPO_PUBLIC_BACKEND_URL ||
			Constants.expoConfig?.extra?.backendUrl ||
			resolveBackendUrl(undefined, 8080);
		const url = `${backendUrl}/api/receipt/manual`;

		const {
			data: { session },
		} = await supabase.auth.getSession();
		const token = session?.access_token;

		const response = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({
				receiptData,
			}),
		});

		if (!response.ok) {
			const errText = await response.text();
			// Try to parse error as JSON to extract errorType
			let errorType: string | undefined;
			let errorMessage: string = errText;
			
			try {
				const errorJson = JSON.parse(errText);
				if (errorJson.errorType) {
					errorType = errorJson.errorType;
				}
				if (errorJson.message) {
					errorMessage = errorJson.message;
				} else if (errorJson.error) {
					errorMessage = errorJson.error;
				}
			} catch {
				// If parsing fails, use errText as-is (plain text error)
			}
			
			// Include errorType in error message for easier detection
			const errorMsg = errorType
				? `Receipt API error ${response.status}: errorType: ${errorType} | ${errorMessage}`
				: `Receipt API error ${response.status}: ${errorMessage}`;
			
			throw new Error(errorMsg);
		}

		const json = await response.json();
		return json.data as Receipt;
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
		const backendUrl =
			process.env.EXPO_PUBLIC_BACKEND_URL ||
			Constants.expoConfig?.extra?.backendUrl ||
			resolveBackendUrl(undefined, 8080);
		const url = `${backendUrl}/api/receipt/${receiptId}`;

		const {
			data: { session },
		} = await supabase.auth.getSession();
		const token = session?.access_token;

		const response = await fetch(url, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({
				receiptData,
			}),
		});

		if (!response.ok) {
			const errText = await response.text();
			// Try to parse error as JSON to extract errorType
			let errorType: string | undefined;
			let errorMessage: string = errText;
			
			try {
				const errorJson = JSON.parse(errText);
				if (errorJson.errorType) {
					errorType = errorJson.errorType;
				}
				if (errorJson.message) {
					errorMessage = errorJson.message;
				} else if (errorJson.error) {
					errorMessage = errorJson.error;
				}
			} catch {
				// If parsing fails, use errText as-is (plain text error)
			}
			
			// Include errorType in error message for easier detection
			const errorMsg = errorType
				? `Receipt API error ${response.status}: errorType: ${errorType} | ${errorMessage}`
				: `Receipt API error ${response.status}: ${errorMessage}`;
			
			throw new Error(errorMsg);
		}

		const json = await response.json();
		return json.data as Receipt;
	},
};

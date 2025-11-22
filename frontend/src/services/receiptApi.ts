import { ReceiptData } from "../types/receipt.types";
import { resolveBackendUrl } from "../utils/getBackendUrl";

/**
 * Service to upload a receipt image and obtain the formatted receipt data.
 */
export const receiptApi = {
	/**
	 * Sends a receipt image to the backend and returns the formatted receipt data.
	 * @param imageUri Local URI of the captured photo (e.g., expo file URI)
	 * @param userId Current authenticated user ID
	 */
	async processReceipt(imageUri: string, userId: string): Promise<ReceiptData> {
		// Use env variable if set, otherwise resolve dynamically
		const backendUrl =
			process.env.EXPO_PUBLIC_BACKEND_URL || resolveBackendUrl(undefined, 8080);
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
};

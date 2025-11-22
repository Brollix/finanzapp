import { ReceiptData, Receipt } from "../types/receipt.types.js";
import { supabase } from "../config/supabase.js";

export async function saveReceipt(
	userId: string,
	receiptData: ReceiptData,
	imageUrl?: string
): Promise<Receipt> {
	try {
		const newReceipt = {
			user_id: userId,
			supermarket: receiptData.supermarket,
			datetime: receiptData.datetime,
			total: receiptData.total,
			items: receiptData.items,
			image_url: imageUrl,
		};

		const { data, error } = await supabase
			.from("receipts")
			.insert(newReceipt)
			.select()
			.single();

		if (error) {
			throw error;
		}

		return data as Receipt;
	} catch (error) {
		console.error("Database error:", error);
		throw new Error(
			`Failed to save receipt: ${
				error instanceof Error ? error.message : "Unknown error"
			}`
		);
	}
}

export async function getReceiptById(
	receiptId: string
): Promise<Receipt | null> {
	try {
		const { data, error } = await supabase
			.from("receipts")
			.select("*")
			.eq("id", receiptId)
			.single();

		if (error) {
			if (error.code === "PGRST116") {
				// Not found
				return null;
			}
			throw error;
		}

		return data as Receipt;
	} catch (error) {
		console.error("Database error:", error);
		throw new Error(
			`Failed to get receipt: ${
				error instanceof Error ? error.message : "Unknown error"
			}`
		);
	}
}

export async function getReceiptsByUserId(
	userId: string,
	limit = 50
): Promise<Receipt[]> {
	try {
		const { data, error } = await supabase
			.from("receipts")
			.select("*")
			.eq("user_id", userId)
			.order("created_at", { ascending: false })
			.limit(limit);

		if (error) {
			throw error;
		}

		return (data as Receipt[]) || [];
	} catch (error) {
		console.error("Database error:", error);
		throw new Error(
			`Failed to get receipts: ${
				error instanceof Error ? error.message : "Unknown error"
			}`
		);
	}
}

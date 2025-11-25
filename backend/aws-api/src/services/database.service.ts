import { ReceiptData, Receipt, ReceiptItem } from "../types/receipt.types.js";
import { supabase } from "../config/supabase.js";

async function getOrCreateProduct(item: ReceiptItem): Promise<string> {
	let query = supabase.from("products").select("id").eq("name", item.product);

	if (item.brand) {
		query = query.eq("brand", item.brand);
	} else {
		query = query.is("brand", null);
	}

	const { data: existing } = await query.single();

	if (existing) {
		return existing.id;
	}

	const { data: newProduct, error } = await supabase
		.from("products")
		.insert({
			name: item.product,
			brand: item.brand || null,
			is_weight: item.is_weight || false,
		})
		.select("id")
		.single();

	if (error) {
		// Handle race condition where product was created between check and insert
		if (error.code === "23505") {
			// Unique violation
			const { data: retry } = await query.single();
			if (retry) return retry.id;
		}
		throw error;
	}

	return newProduct.id;
}

export async function saveReceipt(
	userId: string,
	receiptData: ReceiptData,
	imageUrl?: string
): Promise<Receipt> {
	try {
		// 1. Process items to get/create products
		const receiptItemsForDb = [];

		for (const item of receiptData.items) {
			const productId = await getOrCreateProduct(item);
			item.product_id = productId; // Update the item with the ID

			receiptItemsForDb.push({
				product_id: productId,
				quantity: item.quantity,
				price: item.quantity ? item.price / item.quantity : 0, // Unit price
				total: item.price,
			});
		}

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

		// 2. Save receipt items
		if (data && data.id) {
			const itemsWithReceiptId = receiptItemsForDb.map((item) => ({
				...item,
				receipt_id: data.id,
			}));

			const { error: itemsError } = await supabase
				.from("receipt_items")
				.insert(itemsWithReceiptId);

			if (itemsError) {
				console.error("Error saving receipt items:", itemsError);
				// We log but don't fail the whole request as the receipt is saved
			}
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

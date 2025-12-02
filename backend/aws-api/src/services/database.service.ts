import { ReceiptData, Receipt, ReceiptItem } from "../types/receipt.types.js";
import { supabase } from "../config/supabase.js";
import { generateEmbedding, suggestCategory } from "./bedrock.service.js";
import logger from "../utils/logger.js";

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

	// Product doesn't exist, let's categorize it
	let category = "Otros";
	let embedding: number[] | null = null;

	try {
		// 1. Generate embedding
		embedding = await generateEmbedding(item.product);

		// 2. Search for similar products to reuse category
		const { data: similarProducts } = await supabase.rpc("match_products", {
			query_embedding: embedding,
			match_threshold: 0.85, // High similarity threshold
			match_count: 1,
		});

		if (similarProducts && similarProducts.length > 0) {
			category = similarProducts[0].category;
			logger.debug(
				`Matched product "${item.product}" with "${similarProducts[0].name}" (Category: ${category})`
			);
		} else {
			// 3. If no match, ask Claude
			category = await suggestCategory(item.product);
			logger.debug(`Suggested category for "${item.product}": ${category}`);
		}
	} catch (error) {
		logger.error(`Error in product categorization: ${error}`);
		// Fallback to default category if anything fails
	}

	const { data: newProduct, error } = await supabase
		.from("products")
		.insert({
			name: item.product,
			brand: item.brand || null,
			is_weight: item.is_weight || false,
			category: category,
			embedding: embedding,
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
				discount: item.discount || 0,
				promotion: item.promotion || null,
			});
		}

		// 2. VALIDATE AND CORRECT TOTALS FROM ITEMS
		// Calculate subtotal from items (sum of all item prices)
		const calculatedSubtotal = receiptData.items.reduce(
			(sum, item) => sum + (item.price || 0),
			0
		);

		// Calculate total_saved from items (sum of all item discounts)
		const calculatedTotalSaved = receiptData.items.reduce(
			(sum, item) => sum + (item.discount || 0),
			0
		);

		// Calculate correct total (subtotal - discounts)
		const calculatedTotal = calculatedSubtotal - calculatedTotalSaved;

		// Check if AI-provided total matches our calculation
		const totalDifference = Math.abs(receiptData.total - calculatedTotal);
		const TOLERANCE = 0.01; // Allow 1 cent difference due to rounding

		if (totalDifference > TOLERANCE) {
			logger.warn(
				`Total mismatch! AI: ${receiptData.total}, Calculated: ${calculatedTotal}. Using calculated.`
			);
		}

		// Use calculated values (they are always correct based on items)
		const finalTotal = calculatedTotal;
		const finalSubtotal = calculatedSubtotal;
		const finalTotalSaved = calculatedTotalSaved;

		// Build discounts array from items if not provided or empty
		let finalDiscounts = receiptData.discounts || [];
		if (finalDiscounts.length === 0 && calculatedTotalSaved > 0) {
			finalDiscounts = receiptData.items
				.filter((item) => (item.discount || 0) > 0)
				.map((item) => ({
					description: item.promotion || "Descuento",
					amount: item.discount || 0,
				}));
		}

		logger.info(
			`Receipt totals - Subtotal: ${finalSubtotal.toFixed(
				2
			)}, Total: ${finalTotal.toFixed(2)}, Saved: ${finalTotalSaved.toFixed(2)}`
		);

		const newReceipt = {
			user_id: userId,
			supermarket: receiptData.supermarket,
			datetime: receiptData.datetime,
			total: finalTotal,
			subtotal: finalSubtotal,
			items: receiptData.items,
			image_url: imageUrl,
			discounts: finalDiscounts,
			total_saved: finalTotalSaved,
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
				logger.error(`Error saving receipt items: ${itemsError}`);
				// We log but don't fail the whole request as the receipt is saved
			}
		}

		return data as Receipt;
	} catch (error) {
		logger.error(`Database error: ${error}`);
		throw new Error(
			`Failed to save receipt: ${
				error instanceof Error ? error.message : "Unknown error"
			}`
		);
	}
}

export async function updateReceipt(
	receiptId: string,
	userId: string,
	receiptData: ReceiptData
): Promise<Receipt> {
	try {
		// 1. Verify the receipt exists and belongs to the user
		const existingReceipt = await getReceiptById(receiptId);
		if (!existingReceipt) {
			throw new Error("Receipt not found");
		}
		if (existingReceipt.user_id !== userId) {
			throw new Error("Unauthorized: Receipt does not belong to user");
		}

		// 2. Process items to get/create products
		const receiptItemsForDb = [];

		for (const item of receiptData.items) {
			const productId = await getOrCreateProduct(item);
			item.product_id = productId; // Update the item with the ID

			receiptItemsForDb.push({
				product_id: productId,
				quantity: item.quantity,
				price: item.quantity ? item.price / item.quantity : 0, // Unit price
				total: item.price,
				discount: item.discount || 0,
				promotion: item.promotion || null,
			});
		}

		// 3. VALIDATE AND CORRECT TOTALS FROM ITEMS
		// Calculate subtotal from items (sum of all item prices)
		const calculatedSubtotal = receiptData.items.reduce(
			(sum, item) => sum + (item.price || 0),
			0
		);

		// Calculate total_saved from items (sum of all item discounts)
		const calculatedTotalSaved = receiptData.items.reduce(
			(sum, item) => sum + (item.discount || 0),
			0
		);

		// Calculate correct total (subtotal - discounts)
		const calculatedTotal = calculatedSubtotal - calculatedTotalSaved;

		// Check if provided total matches our calculation
		const totalDifference = Math.abs(receiptData.total - calculatedTotal);
		const TOLERANCE = 0.01; // Allow 1 cent difference due to rounding

		if (totalDifference > TOLERANCE) {
			logger.warn(
				`Total mismatch! Provided: ${receiptData.total}, Calculated: ${calculatedTotal}. Using calculated.`
			);
		}

		// Use calculated values (they are always correct based on items)
		const finalTotal = calculatedTotal;
		const finalSubtotal = calculatedSubtotal;
		const finalTotalSaved = calculatedTotalSaved;

		// Build discounts array from items if not provided or empty
		let finalDiscounts = receiptData.discounts || [];
		if (finalDiscounts.length === 0 && calculatedTotalSaved > 0) {
			finalDiscounts = receiptData.items
				.filter((item) => (item.discount || 0) > 0)
				.map((item) => ({
					description: item.promotion || "Descuento",
					amount: item.discount || 0,
				}));
		}

		logger.info(
			`Receipt totals - Subtotal: ${finalSubtotal.toFixed(
				2
			)}, Total: ${finalTotal.toFixed(2)}, Saved: ${finalTotalSaved.toFixed(2)}`
		);

		// 4. Update the receipt
		const updatedReceipt = {
			supermarket: receiptData.supermarket,
			datetime: receiptData.datetime,
			total: finalTotal,
			subtotal: finalSubtotal,
			items: receiptData.items,
			discounts: finalDiscounts,
			total_saved: finalTotalSaved,
		};

		const { data, error } = await supabase
			.from("receipts")
			.update(updatedReceipt)
			.eq("id", receiptId)
			.eq("user_id", userId) // Extra safety check
			.select()
			.single();

		if (error) {
			throw error;
		}

		// 4. Delete old receipt items
		const { error: deleteError } = await supabase
			.from("receipt_items")
			.delete()
			.eq("receipt_id", receiptId);

		if (deleteError) {
			console.error("Error deleting old receipt items:", deleteError);
			// Continue anyway - we'll insert new items
		}

		// 5. Insert new receipt items
		if (data && data.id) {
			const itemsWithReceiptId = receiptItemsForDb.map((item) => ({
				...item,
				receipt_id: data.id,
			}));

			const { error: itemsError } = await supabase
				.from("receipt_items")
				.insert(itemsWithReceiptId);

			if (itemsError) {
				logger.error(`Error saving receipt items: ${itemsError}`);
				// We log but don't fail the whole request as the receipt is updated
			}
		}

		return data as Receipt;
	} catch (error) {
		logger.error(`Database error: ${error}`);
		throw new Error(
			`Failed to update receipt: ${
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
		logger.error(`Database error: ${error}`);
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
		logger.error(`Database error: ${error}`);
		throw new Error(
			`Failed to get receipts: ${
				error instanceof Error ? error.message : "Unknown error"
			}`
		);
	}
}

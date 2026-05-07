import { ReceiptData, Receipt, ReceiptItem } from "../types/receipt.types.js";
import { supabase, createAuthClient } from "../config/supabase.js";
import logger from "../utils/logger.js";

/**
 * Batch version: Get or create multiple products in a single operation
 * Much faster than individual queries for receipts with many items
 */
async function getOrCreateProductsBatch(
	items: ReceiptItem[],
	dbClient = supabase
): Promise<Map<string, string>> {
	const productMap = new Map<string, string>();

	// Extract unique product names
	const productNames = [...new Set(items.map((item) => item.product))];

	if (productNames.length === 0) {
		return productMap;
	}

	try {
		// 1. Search for all existing products in a single query
		const { data: existingProducts, error: searchError } = await dbClient
			.from("products")
			.select("id, name, brand")
			.in("name", productNames);

		if (searchError) {
			logger.error(`Error searching products: ${searchError}`);
			throw searchError;
		}

		// 2. Create a fast lookup map
		existingProducts?.forEach((p) => {
			const key = `${p.name}|${p.brand || ""}`;
			productMap.set(key, p.id);
		});

		// 3. Identify missing products
		const missingItems = items.filter((item) => {
			const key = `${item.product}|${item.brand || ""}`;
			return !productMap.has(key);
		});

		// 4. Create missing products in batch (if any)
		if (missingItems.length > 0) {
			// Get unique missing items (by name+brand combination)
			const uniqueMissing = Array.from(
				new Map(
					missingItems.map((item) => [
						`${item.product}|${item.brand || ""}`,
						item,
					])
				).values()
			);

			const newProducts = uniqueMissing.map((item) => ({
				name: item.product,
				brand: item.brand || null,
				is_weight: item.is_weight || false,
				category: "Otros", // Default category, can be updated later
				embedding: null,
			}));

			const { data: created, error: insertError } = await dbClient
				.from("products")
				.insert(newProducts)
				.select("id, name, brand");

			if (insertError) {
				// Handle race condition: products might have been created between check and insert
				if (insertError.code === "23505") {
					// Unique violation - retry search for the conflicting products
					logger.warn(
						`Race condition detected, retrying search for ${newProducts.length} products`
					);
					const retryNames = newProducts.map((p) => p.name);
					const { data: retryProducts } = await dbClient
						.from("products")
						.select("id, name, brand")
						.in("name", retryNames);

					retryProducts?.forEach((p) => {
						const key = `${p.name}|${p.brand || ""}`;
						if (!productMap.has(key)) {
							productMap.set(key, p.id);
						}
					});
				} else {
					logger.error(`Error creating products: ${insertError}`);
					throw insertError;
				}
			} else {
				// Add created products to map
				created?.forEach((p) => {
					const key = `${p.name}|${p.brand || ""}`;
					productMap.set(key, p.id);
				});
			}
		}

		logger.info(
			`Batch product lookup: ${items.length} items, ${productMap.size} products found/created`
		);

		return productMap;
	} catch (error) {
		logger.error(`Error in batch product lookup: ${error}`);
		throw error;
	}
}



export async function saveReceipt(
	userId: string,
	receiptData: ReceiptData,
	imageUrl?: string,
	token?: string
): Promise<Receipt> {
	const dbClient = token ? createAuthClient(token) : supabase;
	try {
		// 1. Process items to get/create products in BATCH
		const productMap = await getOrCreateProductsBatch(receiptData.items, dbClient);
		
		const receiptItemsForDb = receiptData.items.map((item) => {
			const key = `${item.product}|${item.brand || ""}`;
			const productId = productMap.get(key) || "";
			item.product_id = productId; // Update the item with the ID

			return {
				product_id: productId,
				quantity: item.quantity,
				price: item.quantity ? item.price / item.quantity : 0, // Unit price
				total: item.price,
				discount: item.discount || 0,
				promotion: item.promotion || null,
			};
		});

		// 2. VALIDATE AND CORRECT TOTALS FROM ITEMS
		// Calculate subtotal from items (sum of all item prices)
		const calculatedSubtotal = receiptData.items.reduce(
			(sum, item) => sum + (item.price || 0),
			0
		);

		// Calculate explicit savings from items (sum of all item discounts)
		const explicitItemSavings = receiptData.items.reduce(
			(sum, item) => sum + (item.discount || 0),
			0
		);

		let finalTotal = 0;
		const finalSubtotal = calculatedSubtotal;
		let finalTotalSaved = 0;

		// Priority: Trust the OCR-detected total if it exists and is positive
		if (receiptData.total && receiptData.total > 0) {
			// Use the OCR total as the final total
			finalTotal = receiptData.total;

			// Calculate total saved as the difference between subtotal and total
			finalTotalSaved = Math.max(0, calculatedSubtotal - finalTotal);

			logger.info(
				`Using OCR Total: ${finalTotal}, Subtotal: ${calculatedSubtotal}, Savings: ${finalTotalSaved.toFixed(2)}`
			);
		} else {
			// Fallback: No valid OCR total, calculate from items
			finalTotal = calculatedSubtotal - explicitItemSavings;
			finalTotalSaved = explicitItemSavings;

			logger.warn(
				`OCR Total missing or invalid, calculated from items: ${finalTotal}, Savings: ${finalTotalSaved.toFixed(2)}`
			);
		}

		// Build discounts array
		const finalDiscounts = receiptData.discounts || [];

		// If we have savings but no discount entries, try to populate them
		if (finalTotalSaved > 0) {
			const existingSavings = finalDiscounts.reduce(
				(sum: number, d: any) => sum + (d.amount || 0),
				0
			);

			// If explicit discounts don't match total saved, add a general discount entry
			if (Math.abs(finalTotalSaved - existingSavings) > 1.0) {
				const diff = finalTotalSaved - existingSavings;
				if (diff > 0) {
					finalDiscounts.push({
						description: "Descuentos Varios / Generales",
						amount: parseFloat(diff.toFixed(2)),
					});
				}
			}
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

		const { data, error } = await dbClient
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

			const { error: itemsError } = await dbClient
				.from("receipt_items")
				.insert(itemsWithReceiptId);

			if (itemsError) {
				logger.error(`Error saving receipt items: ${itemsError}`);
				// We log but don't fail the whole request as the receipt is saved
			}
		}

		const receipt = data as Receipt;
		// Ensure all items have unit_price for backwards compatibility
		if (receipt && receipt.items) {
			receipt.items = ensureUnitPrice(receipt.items);
		}

		return receipt;
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
	receiptData: ReceiptData,
	token?: string
): Promise<Receipt> {
	const dbClient = token ? createAuthClient(token) : supabase;
	try {
		// 1. Verify the receipt exists and belongs to the user
		const existingReceipt = await getReceiptById(receiptId, token);
		if (!existingReceipt) {
			throw new Error("Receipt not found");
		}
		if (existingReceipt.user_id !== userId) {
			throw new Error("Unauthorized: Receipt does not belong to user");
		}

		// 1. Process items to get/create products in BATCH
		const productMap = await getOrCreateProductsBatch(receiptData.items, dbClient);
		
		const receiptItemsForDb = receiptData.items.map((item) => {
			const key = `${item.product}|${item.brand || ""}`;
			const productId = productMap.get(key) || "";
			item.product_id = productId; // Update the item with the ID

			return {
				product_id: productId,
				quantity: item.quantity,
				price: item.quantity ? item.price / item.quantity : 0, // Unit price
				total: item.price,
				discount: item.discount || 0,
				promotion: item.promotion || null,
			};
		});

		// 2. VALIDATE AND CORRECT TOTALS FROM ITEMS
		// Calculate subtotal from items (sum of all item prices)
		const calculatedSubtotal = receiptData.items.reduce(
			(sum, item) => sum + (item.price || 0),
			0
		);

		// Calculate explicit savings from items (sum of all item discounts)
		const explicitItemSavings = receiptData.items.reduce(
			(sum, item) => sum + (item.discount || 0),
			0
		);

		let finalTotal = 0;
		const finalSubtotal = calculatedSubtotal;
		let finalTotalSaved = 0;

		// Priority: Trust the OCR-detected total if it exists and is positive
		if (receiptData.total && receiptData.total > 0) {
			finalTotal = receiptData.total;
			finalTotalSaved = Math.max(0, calculatedSubtotal - finalTotal);
		} else {
			finalTotal = calculatedSubtotal - explicitItemSavings;
			finalTotalSaved = explicitItemSavings;
		}

		// Build discounts array
		const finalDiscounts = receiptData.discounts || [];

		// If we have savings but no discount entries, try to populate them
		if (finalTotalSaved > 0) {
			const existingSavings = finalDiscounts.reduce(
				(sum: number, d: any) => sum + (d.amount || 0),
				0
			);

			if (Math.abs(finalTotalSaved - existingSavings) > 1.0) {
				const diff = finalTotalSaved - existingSavings;
				if (diff > 0) {
					finalDiscounts.push({
						description: "Descuentos Varios / Generales",
						amount: parseFloat(diff.toFixed(2)),
					});
				}
			}
		}

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

		const { data, error } = await dbClient
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
		const { error: deleteError } = await dbClient
			.from("receipt_items")
			.delete()
			.eq("receipt_id", receiptId);

		if (deleteError) {
			logger.error(`Error deleting old receipt items: ${deleteError.message}`);
			// Continue anyway - we'll insert new items
		}

		// 5. Insert new receipt items
		if (data && data.id) {
			const itemsWithReceiptId = receiptItemsForDb.map((item) => ({
				...item,
				receipt_id: data.id,
			}));

			const { error: itemsError } = await dbClient
				.from("receipt_items")
				.insert(itemsWithReceiptId);

			if (itemsError) {
				logger.error(`Error saving receipt items: ${itemsError}`);
				// We log but don't fail the whole request as the receipt is updated
			}
		}

		const receipt = data as Receipt;
		// Ensure all items have unit_price for backwards compatibility
		if (receipt && receipt.items) {
			receipt.items = ensureUnitPrice(receipt.items);
		}

		return receipt;
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
	receiptId: string,
	token?: string
): Promise<Receipt | null> {
	const dbClient = token ? createAuthClient(token) : supabase;
	try {
		const { data, error } = await dbClient
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

		const receipt = data as Receipt;
		// Ensure all items have unit_price for backwards compatibility
		if (receipt && receipt.items) {
			receipt.items = ensureUnitPrice(receipt.items);
		}

		return receipt;
	} catch (error) {
		logger.error(`Database error: ${error}`);
		throw new Error(
			`Failed to get receipt: ${
				error instanceof Error ? error.message : "Unknown error"
			}`
		);
	}
}

/**
 * Ensure all items have unit_price field
 * For backwards compatibility with old receipts
 */
function ensureUnitPrice(items: ReceiptItem[]): ReceiptItem[] {
	return items.map((item) => {
		// If unit_price is missing or 0, calculate it
		if (!item.unit_price || item.unit_price === 0) {
			item.unit_price = item.quantity > 0 ? item.price / item.quantity : 0;
		}
		return item;
	});
}

export async function getReceiptsByUserId(
	userId: string,
	limit = 50,
	token?: string
): Promise<Receipt[]> {
	const dbClient = token ? createAuthClient(token) : supabase;
	try {
		const { data, error } = await dbClient
			.from("receipts")
			.select("*")
			.eq("user_id", userId)
			.order("created_at", { ascending: false })
			.limit(limit);

		if (error) {
			throw error;
		}

		// Ensure all items have unit_price for backwards compatibility
		const receipts = (data as Receipt[]) || [];
		return receipts.map((receipt) => ({
			...receipt,
			items: ensureUnitPrice(receipt.items),
		}));
	} catch (error) {
		logger.error(`Database error: ${error}`);
		throw new Error(
			`Failed to get receipts: ${
				error instanceof Error ? error.message : "Unknown error"
			}`
		);
	}
}

/**
 * Fast version: Save receipt with items as JSON, without processing products
 * Used for early return optimization
 */
export async function saveReceiptFast(
	userId: string,
	receiptData: ReceiptData,
	imageUrl?: string,
	options: { dryRun?: boolean; token?: string } = {}
): Promise<Receipt> {
	const dbClient = options.token ? createAuthClient(options.token) : supabase;
	try {
		// Calculate subtotal from items (sum of all item prices)
		const calculatedSubtotal = receiptData.items.reduce(
			(sum, item) => sum + (item.price || 0),
			0
		);

		// Calculate explicit item-level savings
		const explicitItemSavings = receiptData.items.reduce(
			(sum, item) => sum + (item.discount || 0),
			0
		);

		let finalTotal = 0;
		const finalSubtotal = calculatedSubtotal;
		let finalTotalSaved = 0;

		// Priority: Trust the OCR-detected total if it exists and is positive
		if (receiptData.total && receiptData.total > 0) {
			// Use the OCR total as the final total
			finalTotal = receiptData.total;

			// Calculate total saved as the difference between subtotal and total
			finalTotalSaved = Math.max(0, calculatedSubtotal - finalTotal);

			logger.info(
				`Using OCR Total: ${finalTotal}, Subtotal: ${calculatedSubtotal}, Savings: ${finalTotalSaved.toFixed(2)}`
			);
		} else {
			// Fallback: No valid OCR total, calculate from items
			finalTotal = calculatedSubtotal - explicitItemSavings;
			finalTotalSaved = explicitItemSavings;

			logger.warn(
				`OCR Total missing or invalid, calculated from items: ${finalTotal}, Savings: ${finalTotalSaved.toFixed(2)}`
			);
		}

		// Build discounts array
		const finalDiscounts = receiptData.discounts || [];
		if (finalTotalSaved > 0) {
			const existingSavings = finalDiscounts.reduce(
				(sum: number, d: any) => sum + (d.amount || 0),
				0
			);
			if (Math.abs(finalTotalSaved - existingSavings) > 1.0) {
				const diff = finalTotalSaved - existingSavings;
				if (diff > 0) {
					finalDiscounts.push({
						description: "Descuentos Varios / Generales",
						amount: parseFloat(diff.toFixed(2)),
					});
				}
			}
		}

		const newReceipt = {
			user_id: userId,
			supermarket: receiptData.supermarket,
			datetime: receiptData.datetime,
			total: finalTotal,
			subtotal: finalSubtotal,
			items: receiptData.items, // Store as JSON for now
			image_url: imageUrl,
			discounts: finalDiscounts,
			total_saved: finalTotalSaved,
		};

		if (options.dryRun) {
			logger.info("Dry run enabled: skipping database insert", {
				user_id: userId,
				supermarket: receiptData.supermarket,
				total: finalTotal,
			});

			// Return receipt object without saving
			const now = new Date().toISOString();
			return {
				id: `preview_${Date.now()}`, // Temporary ID for preview
				user_id: userId,
				supermarket: receiptData.supermarket,
				datetime: receiptData.datetime,
				total: finalTotal,
				subtotal: finalSubtotal,
				items: receiptData.items,
				image_url: imageUrl,
				discounts: finalDiscounts,
				total_saved: finalTotalSaved,
				created_at: now,
			};
		}

		const { data, error } = await dbClient
			.from("receipts")
			.insert(newReceipt)
			.select()
			.single();

		if (error) {
			throw error;
		}

		const receipt = data as Receipt;
		// Ensure all items have unit_price for backwards compatibility
		if (receipt && receipt.items) {
			receipt.items = ensureUnitPrice(receipt.items);
		}

		return receipt;
	} catch (error) {
		logger.error(`Database error (fast save): ${error}`);
		throw new Error(
			`Failed to save receipt: ${
				error instanceof Error ? error.message : "Unknown error"
			}`
		);
	}
}

/**
 * Background processing: Create receipt_items from receipt data
 * This runs after the receipt is saved for fast response
 */
export async function processReceiptItemsInBackground(
	receiptId: string,
	items: ReceiptItem[]
): Promise<void> {
	try {
		// Use batch lookup for products
		const productMap = await getOrCreateProductsBatch(items);

		// Create receipt_items
		const receiptItems = items
			.map((item) => {
				const key = `${item.product}|${item.brand || ""}`;
				const productId = productMap.get(key);

				if (!productId) {
					logger.warn(
						`Product not found for item: ${item.product} (brand: ${item.brand})`
					);
					return null;
				}

				return {
					receipt_id: receiptId,
					product_id: productId,
					quantity: item.quantity,
					price: item.quantity ? item.price / item.quantity : 0, // Unit price
					total: item.price,
					discount: item.discount || 0,
					promotion: item.promotion || null,
				};
			})
			.filter((item) => item !== null) as Array<{
			receipt_id: string;
			product_id: string;
			quantity: number;
			price: number;
			total: number;
			discount: number;
			promotion: string | null;
		}>;

		if (receiptItems.length > 0) {
			const { error: itemsError } = await supabase
				.from("receipt_items")
				.insert(receiptItems);

			if (itemsError) {
				logger.error(`Error saving receipt items in background: ${itemsError}`);
				// Don't throw - this is background processing
			} else {
				logger.info(
					`Background processing complete: ${receiptItems.length} receipt_items created for receipt ${receiptId}`
				);
			}
		}
	} catch (error) {
		logger.error(`Error in background receipt items processing: ${error}`);
		// Don't throw - this is background processing
	}
}

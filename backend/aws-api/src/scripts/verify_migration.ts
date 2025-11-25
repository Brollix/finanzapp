import "dotenv/config";
import { saveReceipt } from "../services/database.service";
import { supabase } from "../config/supabase";
import { ReceiptData } from "../types/receipt.types";

async function verifyMigration() {
	console.log("Starting verification...");

	const testUserId = "test-user-verification";
	const testProduct = "Test Product " + Date.now();
	const testBrand = "Test Brand";

	const mockReceiptData: ReceiptData = {
		supermarket: "Test Supermarket",
		datetime: new Date().toISOString(),
		total: 100,
		items: [
			{
				product: testProduct,
				brand: testBrand,
				quantity: 1,
				price: 100,
				is_weight: false,
			},
		],
	};

	try {
		console.log("Saving receipt...");
		const receipt = await saveReceipt(testUserId, mockReceiptData);
		console.log("Receipt saved with ID:", receipt.id);

		// Verify product creation
		console.log("Verifying product creation...");
		const { data: product, error: productError } = await supabase
			.from("products")
			.select("*")
			.eq("name", testProduct)
			.eq("brand", testBrand)
			.single();

		if (productError || !product) {
			console.error("FAILED: Product not found in database.", productError);
			process.exit(1);
		}
		console.log("SUCCESS: Product found:", product.id);

		// Verify receipt item creation
		console.log("Verifying receipt item creation...");
		const { data: receiptItem, error: itemError } = await supabase
			.from("receipt_items")
			.select("*")
			.eq("receipt_id", receipt.id)
			.eq("product_id", product.id)
			.single();

		if (itemError || !receiptItem) {
			console.error("FAILED: Receipt item not found in database.", itemError);
			process.exit(1);
		}
		console.log("SUCCESS: Receipt item found:", receiptItem.id);

		// Cleanup
		console.log("Cleaning up test data...");
		await supabase.from("receipt_items").delete().eq("receipt_id", receipt.id);
		await supabase.from("receipts").delete().eq("id", receipt.id);
		await supabase.from("products").delete().eq("id", product.id);
		console.log("Cleanup complete.");
	} catch (error) {
		console.error("Verification failed with error:", error);
		process.exit(1);
	}
}

verifyMigration();

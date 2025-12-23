import fs from "fs/promises";
import path from "path";
import { extractTextFromImage } from "../services/textract.service.js";
import { formatReceiptWithBedrock } from "../services/bedrock.service.js";
import logger from "../utils/logger.js";

/**
 * Test script to verify discount extraction and mapping
 */
async function testDiscounts() {
	console.log("🧪 Testing Discount Extraction & Mapping\n");
	console.log("=".repeat(80));

	const samplesDir = path.join(process.cwd(), "../../samples");
	const sampleFile = "ticket1.jpeg";
	const filePath = path.join(samplesDir, sampleFile);

	try {
		console.log(`\n📄 Processing: ${sampleFile}`);
		console.log("-".repeat(80));

		// Read image
		const imageBuffer = await fs.readFile(filePath);
		console.log(
			`✓ Image loaded (${(imageBuffer.length / 1024).toFixed(2)} KB)\n`
		);

		// Extract text with Textract
		console.log("Step 1: OCR with Textract...");
		const ocrText = await extractTextFromImage(imageBuffer);
		console.log(`✓ Extracted ${ocrText.length} characters\n`);

		// Format with Bedrock (Haiku + Sonnet)
		console.log("Step 2: AI Processing (Haiku + Sonnet)...");
		const receiptData = await formatReceiptWithBedrock(ocrText);
		console.log("✓ AI Processing complete\n");

		// Display results
		console.log("=".repeat(80));
		console.log("📊 RECEIPT DATA SUMMARY");
		console.log("=".repeat(80));
		console.log(`\n🏪 Supermarket: ${receiptData.supermarket}`);
		console.log(`📅 Date/Time: ${receiptData.datetime}`);
		console.log(`💰 Total: $${receiptData.total.toFixed(2)}`);
		console.log(`📦 Items Count: ${receiptData.items.length}`);

		// Show items with discounts
		console.log("\n" + "=".repeat(80));
		console.log("🎁 ITEMS WITH DISCOUNTS");
		console.log("=".repeat(80));

		const itemsWithDiscounts = receiptData.items.filter(
			(item) => item.discount && item.discount > 0
		);

		if (itemsWithDiscounts.length > 0) {
			itemsWithDiscounts.forEach((item, index) => {
				console.log(
					`\n${index + 1}. ${item.product}${item.brand ? ` (${item.brand})` : ""}`
				);
				console.log(
					`   Quantity: ${item.quantity}${item.is_weight ? "kg" : ""}`
				);
				console.log(`   Price: $${item.price.toFixed(2)}`);
				console.log(`   💸 Discount: $${(item.discount || 0).toFixed(2)}`);
				if (item.promotion) {
					console.log(`   🎉 Promotion: ${item.promotion}`);
				}
			});

			const totalItemDiscounts = itemsWithDiscounts.reduce(
				(sum, item) => sum + ((item.discount ?? 0) as number),
				0
			);
			console.log(
				`\n✅ Total item-level discounts: $${totalItemDiscounts.toFixed(2)}`
			);
		} else {
			console.log("\n❌ No items with discounts found!");
		}

		// Show unassigned discounts
		console.log("\n" + "=".repeat(80));
		console.log("🎯 UNASSIGNED DISCOUNTS");
		console.log("=".repeat(80));

		if (receiptData.discounts && receiptData.discounts.length > 0) {
			receiptData.discounts.forEach((discount, index) => {
				console.log(`\n${index + 1}. ${discount.description}`);
				console.log(`   Amount: $${discount.amount.toFixed(2)}`);
			});

			const totalUnassignedDiscounts = receiptData.discounts.reduce(
				(sum, d) => sum + d.amount,
				0
			);
			console.log(
				`\n✅ Total unassigned discounts: $${totalUnassignedDiscounts.toFixed(2)}`
			);
		} else {
			console.log("\nℹ️  No unassigned discounts (all linked to items)");
		}

		// Calculate total savings
		const itemDiscountTotal = receiptData.items.reduce(
			(sum, item) => sum + (item.discount || 0),
			0
		);
		const unassignedDiscountTotal =
			receiptData.discounts?.reduce((sum, d) => sum + d.amount, 0) || 0;
		const totalSavings = itemDiscountTotal + unassignedDiscountTotal;

		console.log("\n" + "=".repeat(80));
		console.log("💰 SAVINGS SUMMARY");
		console.log("=".repeat(80));
		console.log(`Item-level discounts:    $${itemDiscountTotal.toFixed(2)}`);
		console.log(
			`Unassigned discounts:    $${unassignedDiscountTotal.toFixed(2)}`
		);
		console.log(`─────────────────────────────────────`);
		console.log(`TOTAL SAVINGS:           $${totalSavings.toFixed(2)}`);

		console.log("\n" + "=".repeat(80));
		console.log("✅ DISCOUNT TEST COMPLETE!");
		console.log("=".repeat(80));
	} catch (error) {
		console.error(`\n❌ Error processing ${sampleFile}:`, error);
		if (error instanceof Error) {
			console.error(`   ${error.message}`);
			console.error(`\n   Stack trace:`);
			console.error(error.stack);
		}
		process.exit(1);
	}
}

// Run the test
testDiscounts().catch((error) => {
	console.error("Fatal error:", error);
	process.exit(1);
});

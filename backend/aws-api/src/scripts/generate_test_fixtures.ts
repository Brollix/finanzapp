import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { extractTextFromImage } from "../services/textract.service.js";
import { formatReceiptWithBedrock } from "../services/bedrock.service.js";
import logger from "../utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Script to generate test fixtures from ticket1.jpeg
 * This processes the ticket through Textract and Bedrock, then saves the outputs
 * as fixtures for use in tests.
 */
async function generateTestFixtures() {
	console.log("🔧 Generating Test Fixtures from ticket1.jpeg\n");
	console.log("=".repeat(80));

	// Paths - samples is at project root, script is in backend/aws-api/src/scripts
	// So we need to go up 4 levels: scripts -> src -> aws-api -> backend -> root
	const projectRoot = path.join(__dirname, "../../../../");
	const samplesDir = path.join(projectRoot, "samples");
	const ticketFile = "ticket1.jpeg";
	const ticketPath = path.join(samplesDir, ticketFile);

	const fixturesDir = path.join(__dirname, "../../tests/fixtures/ticket1");
	const ocrTextPath = path.join(fixturesDir, "ocr-text.txt");
	const receiptDataPath = path.join(fixturesDir, "receipt-data.json");
	const metadataPath = path.join(fixturesDir, "metadata.json");

	try {
		// Ensure fixtures directory exists
		await fs.mkdir(fixturesDir, { recursive: true });
		console.log(`✓ Fixtures directory: ${fixturesDir}\n`);

		// Step 1: Read image
		console.log("Step 1: Loading image...");
		const imageBuffer = await fs.readFile(ticketPath);
		console.log(
			`✓ Image loaded (${(imageBuffer.length / 1024).toFixed(2)} KB)\n`
		);

		// Step 2: Extract text with Textract
		console.log("Step 2: Extracting text with Textract...");
		const ocrText = await extractTextFromImage(imageBuffer);
		console.log(`✓ OCR complete (${ocrText.length} characters)\n`);

		// Save OCR text
		await fs.writeFile(ocrTextPath, ocrText, "utf-8");
		console.log(`✓ Saved OCR text to: ${ocrTextPath}\n`);

		// Step 3: Format with Bedrock
		console.log("Step 3: Processing with Bedrock (Haiku + Sonnet)...");
		const receiptData = await formatReceiptWithBedrock(ocrText);
		console.log(`✓ Bedrock processing complete\n`);

		// Save receipt data (pretty formatted)
		await fs.writeFile(
			receiptDataPath,
			JSON.stringify(receiptData, null, 2),
			"utf-8"
		);
		console.log(`✓ Saved receipt data to: ${receiptDataPath}\n`);

		// Step 4: Save metadata
		const metadata = {
			generated_at: new Date().toISOString(),
			source_image: ticketFile,
			ocr_text_length: ocrText.length,
			receipt_data: {
				supermarket: receiptData.supermarket,
				datetime: receiptData.datetime,
				total: receiptData.total,
				items_count: receiptData.items.length,
				discounts_count: receiptData.discounts?.length || 0,
				has_subtotal: !!receiptData.subtotal,
				has_total_saved: !!receiptData.total_saved,
			},
			model_info: {
				bedrock_model:
					process.env.BEDROCK_MODEL_ID ||
					"anthropic.claude-3-5-haiku-20241022-v1:0",
				bedrock_sonnet_model: "global.anthropic.claude-sonnet-4-20250514-v1:0",
			},
		};

		await fs.writeFile(
			metadataPath,
			JSON.stringify(metadata, null, 2),
			"utf-8"
		);
		console.log(`✓ Saved metadata to: ${metadataPath}\n`);

		// Summary
		console.log("=".repeat(80));
		console.log("📊 FIXTURE GENERATION SUMMARY");
		console.log("=".repeat(80));
		console.log(`\n🏪 Supermarket: ${receiptData.supermarket}`);
		console.log(`📅 Date/Time: ${receiptData.datetime}`);
		console.log(`💰 Total: $${receiptData.total.toFixed(2)}`);
		console.log(`📦 Items: ${receiptData.items.length}`);
		console.log(`🎁 Discounts: ${receiptData.discounts?.length || 0}`);

		if (receiptData.subtotal) {
			console.log(`📊 Subtotal: $${receiptData.subtotal.toFixed(2)}`);
		}
		if (receiptData.total_saved) {
			console.log(`💸 Total Saved: $${receiptData.total_saved.toFixed(2)}`);
		}

		// Show discount details
		if (receiptData.discounts && receiptData.discounts.length > 0) {
			console.log(`\n🎯 Discount Details:`);
			receiptData.discounts.forEach((discount, index) => {
				console.log(
					`   ${index + 1}. ${discount.description}: $${discount.amount.toFixed(2)}`
				);
			});
		}

		// Show items with discounts
		const itemsWithDiscounts = receiptData.items.filter(
			(item) => item.discount && item.discount > 0
		);
		if (itemsWithDiscounts.length > 0) {
			console.log(`\n🛒 Items with Discounts: ${itemsWithDiscounts.length}`);
			itemsWithDiscounts.slice(0, 5).forEach((item, index) => {
				console.log(
					`   ${index + 1}. ${item.product}${item.brand ? ` (${item.brand})` : ""}: -$${(item.discount || 0).toFixed(2)}`
				);
			});
			if (itemsWithDiscounts.length > 5) {
				console.log(`   ... and ${itemsWithDiscounts.length - 5} more`);
			}
		}

		console.log("\n" + "=".repeat(80));
		console.log("✅ FIXTURE GENERATION COMPLETE!");
		console.log("=".repeat(80));
		console.log(`\n📁 Fixtures saved to: ${fixturesDir}`);
		console.log(`   - OCR Text: ocr-text.txt`);
		console.log(`   - Receipt Data: receipt-data.json`);
		console.log(`   - Metadata: metadata.json\n`);
	} catch (error) {
		console.error(`\n❌ Error generating fixtures:`, error);
		if (error instanceof Error) {
			console.error(`   ${error.message}`);
			console.error(`\n   Stack trace:`);
			console.error(error.stack);
		}
		process.exit(1);
	}
}

// Run the script
generateTestFixtures().catch((error) => {
	console.error("Fatal error:", error);
	process.exit(1);
});

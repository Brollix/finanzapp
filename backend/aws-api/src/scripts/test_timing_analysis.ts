import fs from "fs/promises";
import path from "path";
import { extractTextFromImage } from "../services/textract.service.js";
import { formatReceiptWithBedrock } from "../services/bedrock.service.js";
import logger from "../utils/logger.js";

interface TimingResult {
	testDate: string;
	fileName: string;
	fileSizeKB: number;
	timings: {
		textractMs: number;
		haikuMs: number;
		sonnetMs: number;
		totalMs: number;
		textractSeconds: number;
		haikuSeconds: number;
		sonnetSeconds: number;
		totalSeconds: number;
	};
	receipt: {
		supermarket: string;
		datetime: string;
		total: number;
		itemsCount: number;
		itemsWithDiscounts: number;
		items: Array<{
			product: string;
			brand?: string;
			quantity: number;
			price: number;
			discount?: number;
			promotion?: string;
			is_weight?: boolean;
		}>;
		discounts: Array<{
			description: string;
			amount: number;
		}>;
	};
	savings: {
		itemLevelDiscounts: number;
		unassignedDiscounts: number;
		totalSavings: number;
	};
	ocr: {
		charactersExtracted: number;
		rawText: string;
	};
	performance: {
		skippedSonnet: boolean;
		needsRefinement: boolean;
		complexity: string;
	};
}

/**
 * Test script with timing analysis - saves results to JSON
 */
async function testTimingAnalysis() {
	console.log("🧪 Testing Receipt Processing with Timing Analysis\n");
	console.log("=".repeat(80));

	const samplesDir = path.join(process.cwd(), "../../samples");
	const sampleFile = "ticket1.jpeg";
	const filePath = path.join(samplesDir, sampleFile);

	try {
		console.log(`\n📄 Processing: ${sampleFile}`);
		console.log("-".repeat(80));

		// Read image
		const imageBuffer = await fs.readFile(filePath);
		const fileSizeKB = imageBuffer.length / 1024;
		console.log(`✓ Image loaded (${fileSizeKB.toFixed(2)} KB)\n`);

		// Step 1: Textract OCR
		console.log("Step 1: OCR with AWS Textract...");
		const textractStart = Date.now();
		const ocrText = await extractTextFromImage(imageBuffer);
		const textractMs = Date.now() - textractStart;
		console.log(`✓ Textract completed in ${textractMs}ms (${(textractMs / 1000).toFixed(2)}s)`);
		console.log(`✓ Extracted ${ocrText.length} characters\n`);

		// Step 2: Bedrock AI Processing
		console.log("Step 2: AI Processing with Bedrock...");
		const bedrockStart = Date.now();
		const receiptData = await formatReceiptWithBedrock(ocrText);
		const bedrockMs = Date.now() - bedrockStart;

		// Estimate Haiku vs Sonnet time
		// Heuristic: If total time < 3s, likely Sonnet was skipped
		const skippedSonnet = bedrockMs < 3000;
		const haikuMs = skippedSonnet ? bedrockMs : Math.floor(bedrockMs * 0.45);
		const sonnetMs = skippedSonnet ? 0 : bedrockMs - haikuMs;

		console.log(`✓ Haiku: ${haikuMs}ms (${(haikuMs / 1000).toFixed(2)}s)`);
		console.log(`✓ Sonnet: ${skippedSonnet ? "SKIPPED" : `${sonnetMs}ms (${(sonnetMs / 1000).toFixed(2)}s)`}`);
		console.log(`✓ Total AI: ${bedrockMs}ms (${(bedrockMs / 1000).toFixed(2)}s)\n`);

		const totalMs = textractMs + bedrockMs;
		console.log(`⏱️  TOTAL PROCESSING TIME: ${totalMs}ms (${(totalMs / 1000).toFixed(2)}s)\n`);

		// Calculate discount metrics
		const itemsWithDiscounts = receiptData.items.filter(
			(item) => item.discount && item.discount > 0
		);
		const itemLevelDiscounts = receiptData.items.reduce(
			(sum, item) => sum + (item.discount || 0),
			0
		);
		const unassignedDiscounts =
			receiptData.discounts?.reduce((sum, d) => sum + d.amount, 0) || 0;
		const totalSavings = itemLevelDiscounts + unassignedDiscounts;

		// Determine complexity
		const hasUnassignedDiscounts = receiptData.discounts && receiptData.discounts.length > 0;
		const isComplex = receiptData.items.length > 10;
		const hasWeirdChars = receiptData.items.some((item) =>
			/[^a-zA-Z0-9\s\.\,\-áéíóúñÁÉÍÓÚÑüÜ]/.test(item.product)
		);
		const hasAllCaps = receiptData.items.some(
			(item) =>
				item.product === item.product.toUpperCase() && item.product.length > 3
		);
		const needsRefinement =
			hasUnassignedDiscounts || isComplex || hasWeirdChars || hasAllCaps;

		let complexity = "Simple";
		if (isComplex || hasUnassignedDiscounts) {
			complexity = "Complex";
		} else if (hasWeirdChars || hasAllCaps) {
			complexity = "Medium";
		}

		// Build result object
		const result: TimingResult = {
			testDate: new Date().toISOString(),
			fileName: sampleFile,
			fileSizeKB: parseFloat(fileSizeKB.toFixed(2)),
			timings: {
				textractMs,
				haikuMs,
				sonnetMs,
				totalMs,
				textractSeconds: parseFloat((textractMs / 1000).toFixed(2)),
				haikuSeconds: parseFloat((haikuMs / 1000).toFixed(2)),
				sonnetSeconds: parseFloat((sonnetMs / 1000).toFixed(2)),
				totalSeconds: parseFloat((totalMs / 1000).toFixed(2)),
			},
			receipt: {
				supermarket: receiptData.supermarket,
				datetime: receiptData.datetime,
				total: receiptData.total,
				itemsCount: receiptData.items.length,
				itemsWithDiscounts: itemsWithDiscounts.length,
				items: receiptData.items.map((item) => ({
					product: item.product,
					brand: item.brand,
					quantity: item.quantity,
					price: item.price,
					discount: item.discount,
					promotion: item.promotion,
					is_weight: item.is_weight,
				})),
				discounts: receiptData.discounts || [],
			},
			savings: {
				itemLevelDiscounts: parseFloat(itemLevelDiscounts.toFixed(2)),
				unassignedDiscounts: parseFloat(unassignedDiscounts.toFixed(2)),
				totalSavings: parseFloat(totalSavings.toFixed(2)),
			},
			ocr: {
				charactersExtracted: ocrText.length,
				rawText: ocrText,
			},
			performance: {
				skippedSonnet,
				needsRefinement,
				complexity,
			},
		};

		// Save to JSON file
		const outputDir = path.join(process.cwd(), "../../test-results");
		await fs.mkdir(outputDir, { recursive: true });

		const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
		const outputFile = path.join(
			outputDir,
			`timing-analysis-${timestamp}.json`
		);

		await fs.writeFile(outputFile, JSON.stringify(result, null, 2), "utf-8");

		console.log("=".repeat(80));
		console.log("📊 SUMMARY");
		console.log("=".repeat(80));
		console.log(`\n🏪 Supermarket: ${receiptData.supermarket}`);
		console.log(`📅 Date: ${receiptData.datetime}`);
		console.log(`💰 Total: $${receiptData.total.toFixed(2)}`);
		console.log(`📦 Items: ${receiptData.items.length}`);
		console.log(`🎁 Items with discounts: ${itemsWithDiscounts.length}`);
		console.log(`💸 Total savings: $${totalSavings.toFixed(2)}`);
		console.log(`\n⚡ Performance:`);
		console.log(`   - Complexity: ${complexity}`);
		console.log(`   - Sonnet refinement: ${skippedSonnet ? "Skipped ✓" : "Applied"}`);
		console.log(`   - Processing time: ${(totalMs / 1000).toFixed(2)}s`);

		console.log("\n" + "=".repeat(80));
		console.log("✅ RESULTS SAVED TO JSON");
		console.log("=".repeat(80));
		console.log(`\nFile: ${outputFile}\n`);

		// Print timing breakdown
		console.log("⏱️  Timing Breakdown:");
		console.log(`   - Textract OCR:     ${textractMs}ms (${((textractMs / totalMs) * 100).toFixed(1)}%)`);
		console.log(`   - Haiku Extract:    ${haikuMs}ms (${((haikuMs / totalMs) * 100).toFixed(1)}%)`);
		console.log(`   - Sonnet Refine:    ${sonnetMs}ms (${((sonnetMs / totalMs) * 100).toFixed(1)}%)`);
		console.log(`   ${"─".repeat(50)}`);
		console.log(`   - TOTAL:            ${totalMs}ms (100%)`);

		console.log("\n" + "=".repeat(80));
		console.log("✅ TEST COMPLETE!");
		console.log("=".repeat(80));

		return result;
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
testTimingAnalysis().catch((error) => {
	console.error("Fatal error:", error);
	process.exit(1);
});

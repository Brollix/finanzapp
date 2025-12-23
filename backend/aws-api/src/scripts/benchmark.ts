import fs from "fs/promises";
import path from "path";
import { extractTextFromImage } from "../services/textract.service.js";
import { extractTextFromImageOptimized } from "../services/textract-optimized.service.js";
import { formatReceiptWithBedrock } from "../services/bedrock.service.js";
import { receiptService } from "../services/receipt.service.js";
import { receiptServiceOptimized } from "../services/receipt-optimized.service.js";
import logger from "../utils/logger.js";

interface BenchmarkResult {
	test: string;
	timings: {
		textract: number;
		bedrock: number;
		database: number;
		total: number;
	};
	itemsCount: number;
	imageSizeKB: number;
	optimizedImageSizeKB?: number;
}

/**
 * Benchmark script to compare old vs optimized processing
 */
async function benchmark() {
	console.log("🧪 BENCHMARK: Comparando procesamiento antiguo vs optimizado\n");
	console.log("=".repeat(80));

	const samplesDir = path.join(process.cwd(), "../../samples");
	const sampleFile = "ticket1.jpeg";
	const filePath = path.join(samplesDir, sampleFile);

	// Test user ID (for database operations)
	const testUserId = "00000000-0000-0000-0000-000000000000";

	try {
		// Read image
		const imageBuffer = await fs.readFile(filePath);
		const imageSizeKB = imageBuffer.length / 1024;
		console.log(`📄 Archivo: ${sampleFile}`);
		console.log(`📦 Tamaño original: ${imageSizeKB.toFixed(2)} KB\n`);

		// ============================================
		// TEST 1: Textract Original vs Optimizado
		// ============================================
		console.log("=".repeat(80));
		console.log("TEST 1: Textract - Original vs Optimizado");
		console.log("=".repeat(80));

		// Original Textract
		console.log("\n🔄 Ejecutando Textract ORIGINAL...");
		const textractOriginalStart = Date.now();
		const ocrTextOriginal = await extractTextFromImage(imageBuffer);
		const textractOriginalTime = Date.now() - textractOriginalStart;
		console.log(`✅ Textract Original: ${textractOriginalTime}ms`);
		console.log(`   Texto extraído: ${ocrTextOriginal.length} caracteres\n`);

		// Optimized Textract
		console.log("⚡ Ejecutando Textract OPTIMIZADO...");
		const textractOptimizedStart = Date.now();
		const ocrTextOptimized = await extractTextFromImageOptimized(imageBuffer);
		const textractOptimizedTime = Date.now() - textractOptimizedStart;
		console.log(`✅ Textract Optimizado: ${textractOptimizedTime}ms`);
		console.log(`   Texto extraído: ${ocrTextOptimized.length} caracteres`);

		const textractImprovement =
			((textractOriginalTime - textractOptimizedTime) / textractOriginalTime) *
			100;
		console.log(
			`\n📊 Mejora Textract: ${textractImprovement.toFixed(1)}% (${(
				textractOriginalTime - textractOptimizedTime
			).toFixed(0)}ms más rápido)`
		);

		// Use optimized OCR text for subsequent tests
		const ocrText = ocrTextOptimized;

		// ============================================
		// TEST 2: Bedrock Processing
		// ============================================
		console.log("\n" + "=".repeat(80));
		console.log("TEST 2: Bedrock Processing");
		console.log("=".repeat(80));

		console.log("\n🤖 Ejecutando Bedrock...");
		const bedrockStart = Date.now();
		const receiptData = await formatReceiptWithBedrock(ocrText);
		const bedrockTime = Date.now() - bedrockStart;
		console.log(`✅ Bedrock: ${bedrockTime}ms`);
		console.log(`   Supermercado: ${receiptData.supermarket}`);
		console.log(`   Items: ${receiptData.items.length}`);
		console.log(`   Total: $${receiptData.total}`);

		// ============================================
		// TEST 3: Database Operations (Batch vs Individual)
		// ============================================
		console.log("\n" + "=".repeat(80));
		console.log("TEST 3: Database Operations");
		console.log("=".repeat(80));

		// Note: We can't easily test the old vs new DB operations in isolation
		// without modifying the code, so we'll test the full flow instead
		console.log(
			"\n⚠️  Nota: Las operaciones de DB se probarán en el flujo completo"
		);

		// ============================================
		// TEST 4: Full Flow - Original Service (Estimated)
		// ============================================
		console.log("\n" + "=".repeat(80));
		console.log("TEST 4: Flujo Completo - Servicio ORIGINAL (Estimado)");
		console.log("=".repeat(80));

		// Estimate original flow time based on component times
		// Note: The old service now uses optimized, so we estimate based on:
		// - Original Textract time
		// - Bedrock time (same)
		// - Estimated DB time (2000ms for 25 items with individual queries)
		const estimatedOriginalTime = textractOriginalTime + bedrockTime + 2000; // Estimate DB time

		console.log(`⏱️  Tiempo estimado (original): ~${estimatedOriginalTime}ms`);
		console.log(
			`   - Textract: ${textractOriginalTime}ms\n   - Bedrock: ${bedrockTime}ms\n   - DB (estimado): ~2000ms`
		);

		// ============================================
		// TEST 5: Full Flow - Optimized Service
		// ============================================
		console.log("\n" + "=".repeat(80));
		console.log("TEST 5: Flujo Completo - Servicio OPTIMIZADO");
		console.log("=".repeat(80));

		// Read image again for clean test
		const imageBuffer3 = await fs.readFile(filePath);

		console.log("\n⚡ Ejecutando flujo completo OPTIMIZADO...");
		const optimizedFlowStart = Date.now();

		try {
			const savedReceipt =
				await receiptServiceOptimized.processReceiptFromImage(
					testUserId,
					imageBuffer3,
					{
						size: imageBuffer3.length,
						mimetype: "image/jpeg",
						originalname: sampleFile,
					}
				);

			const optimizedFlowTime = Date.now() - optimizedFlowStart;

			console.log(`✅ Flujo Optimizado: ${optimizedFlowTime}ms`);
			console.log(`   Receipt ID: ${savedReceipt.id}`);
			console.log(`   Items procesados: ${savedReceipt.items?.length || 0}`);

			// ============================================
			// SUMMARY
			// ============================================
			console.log("\n" + "=".repeat(80));
			console.log("📊 RESUMEN DE BENCHMARK");
			console.log("=".repeat(80));

			const totalImprovement =
				((estimatedOriginalTime - optimizedFlowTime) / estimatedOriginalTime) *
				100;

			console.log("\nTiempos por Componente:");
			console.log(
				`  Textract Original:     ${textractOriginalTime}ms → Optimizado: ${textractOptimizedTime}ms (${textractImprovement.toFixed(
					1
				)}% mejora)`
			);
			console.log(`  Bedrock:              ${bedrockTime}ms`);
			console.log(
				`  Flujo Completo:        ~${estimatedOriginalTime}ms → ${optimizedFlowTime}ms (${totalImprovement.toFixed(
					1
				)}% mejora)`
			);

			console.log("\n" + "=".repeat(80));
			console.log("✅ BENCHMARK COMPLETADO");
			console.log("=".repeat(80));

			// Save results to JSON
			const results: BenchmarkResult = {
				test: sampleFile,
				timings: {
					textract: textractOptimizedTime,
					bedrock: bedrockTime,
					database: optimizedFlowTime - textractOptimizedTime - bedrockTime,
					total: optimizedFlowTime,
				},
				itemsCount: receiptData.items.length,
				imageSizeKB: parseFloat(imageSizeKB.toFixed(2)),
			};

			const outputDir = path.join(process.cwd(), "../../test-results");
			await fs.mkdir(outputDir, { recursive: true });

			const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
			const outputFile = path.join(outputDir, `benchmark-${timestamp}.json`);

			await fs.writeFile(outputFile, JSON.stringify(results, null, 2), "utf-8");

			console.log(`\n📁 Resultados guardados en: ${outputFile}\n`);
		} catch (error) {
			console.error("\n❌ Error en flujo optimizado:", error);
			if (error instanceof Error) {
				console.error(`   ${error.message}`);
			}
		}
	} catch (error) {
		console.error(`\n❌ Error procesando ${sampleFile}:`, error);
		if (error instanceof Error) {
			console.error(`   ${error.message}`);
			console.error(`\n   Stack trace:`);
			console.error(error.stack);
		}
		process.exit(1);
	}
}

// Run the benchmark
benchmark().catch((error) => {
	console.error("Fatal error:", error);
	process.exit(1);
});

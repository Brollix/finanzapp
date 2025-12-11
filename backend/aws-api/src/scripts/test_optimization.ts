import fs from "fs/promises";
import path from "path";
import { extractTextFromImage } from "../services/textract.service.js";
import { formatReceiptWithBedrock } from "../services/bedrock.service.js";
import logger from "../utils/logger.js";

/**
 * Test script to verify optimization improvements
 * Processes sample tickets and measures latency
 */
async function testOptimization() {
    console.log("🧪 Testing AI Pipeline Optimization\n");
    console.log("=".repeat(60));

    // Use relative path from project root
    const samplesDir = path.join(process.cwd(), "../../samples");
    const sampleFiles = [
        "ticket1.jpeg",
    ];

    const results: Array<{
        file: string;
        textractTime: number;
        haikuTime: number;
        sonnetTime: number;
        totalTime: number;
        itemsCount: number;
        skippedSonnet: boolean;
    }> = [];

    for (const file of sampleFiles) {
        const filePath = path.join(samplesDir, file);

        try {
            console.log(`\n📄 Processing: ${file}`);
            console.log("-".repeat(60));

            // Check if file exists
            await fs.access(filePath);

            // Read image
            const imageBuffer = await fs.readFile(filePath);
            console.log(`✓ Image loaded (${(imageBuffer.length / 1024).toFixed(2)} KB)`);

            // Step 1: Textract
            const textractStart = Date.now();
            const ocrText = await extractTextFromImage(imageBuffer);
            const textractTime = Date.now() - textractStart;
            console.log(`✓ Textract: ${textractTime}ms (${ocrText.length} chars)`);

            // Step 2: Bedrock (Haiku + optional Sonnet)
            const bedrockStart = Date.now();
            const receiptData = await formatReceiptWithBedrock(ocrText);
            const bedrockTime = Date.now() - bedrockStart;

            // Estimate Haiku vs Sonnet time (rough approximation)
            // If Sonnet was skipped, all time is Haiku
            const skippedSonnet = bedrockTime < 3000; // Heuristic: <3s likely means no Sonnet
            const haikuTime = skippedSonnet ? bedrockTime : Math.floor(bedrockTime * 0.4);
            const sonnetTime = skippedSonnet ? 0 : bedrockTime - haikuTime;

            const totalTime = textractTime + bedrockTime;

            console.log(`✓ Haiku: ~${haikuTime}ms`);
            console.log(
                `✓ Sonnet: ${skippedSonnet ? "SKIPPED ⚡" : `~${sonnetTime}ms`}`
            );
            console.log(`✓ Total: ${totalTime}ms`);
            console.log(`✓ Items extracted: ${receiptData.items.length}`);
            console.log(`✓ Supermarket: ${receiptData.supermarket}`);
            console.log(`✓ Total: $${receiptData.total}`);

            results.push({
                file,
                textractTime,
                haikuTime,
                sonnetTime,
                totalTime,
                itemsCount: receiptData.items.length,
                skippedSonnet,
            });
        } catch (error) {
            console.error(`❌ Error processing ${file}:`, error);
            if (error instanceof Error) {
                console.error(`   ${error.message}`);
            }
        }
    }

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 OPTIMIZATION SUMMARY");
    console.log("=".repeat(60));

    if (results.length === 0) {
        console.log("❌ No results to display");
        return;
    }

    const avgTextract =
        results.reduce((sum, r) => sum + r.textractTime, 0) / results.length;
    const avgHaiku =
        results.reduce((sum, r) => sum + r.haikuTime, 0) / results.length;
    const avgSonnet =
        results.reduce((sum, r) => sum + r.sonnetTime, 0) / results.length;
    const avgTotal =
        results.reduce((sum, r) => sum + r.totalTime, 0) / results.length;
    const sonnetSkipRate =
        (results.filter((r) => r.skippedSonnet).length / results.length) * 100;

    console.log(`\n✓ Tickets processed: ${results.length}`);
    console.log(`\n⏱️  Average Latency:`);
    console.log(`   - Textract: ${avgTextract.toFixed(0)}ms`);
    console.log(`   - Haiku: ${avgHaiku.toFixed(0)}ms`);
    console.log(`   - Sonnet: ${avgSonnet.toFixed(0)}ms`);
    console.log(`   - Total: ${avgTotal.toFixed(0)}ms`);
    console.log(`\n⚡ Sonnet Skip Rate: ${sonnetSkipRate.toFixed(0)}%`);

    console.log(`\n📋 Individual Results:`);
    results.forEach((r) => {
        console.log(
            `   ${r.file}: ${r.totalTime}ms (${r.itemsCount} items)${r.skippedSonnet ? " ⚡" : ""}`
        );
    });

    console.log("\n" + "=".repeat(60));
    console.log("✅ Testing complete!");
    console.log(
        "\n💡 Expected improvements vs baseline (8-10s):"
    );
    console.log(`   - Current avg: ${avgTotal.toFixed(0)}ms (~${(avgTotal / 1000).toFixed(1)}s)`);
    console.log(
        `   - Improvement: ~${(((10000 - avgTotal) / 10000) * 100).toFixed(0)}%`
    );
}

// Run the test
testOptimization().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});


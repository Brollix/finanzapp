import fs from "fs/promises";
import path from "path";
import { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";

// Note: p-retry is mocked in tests/setup.ts

import { extractTextFromImage } from "../src/services/textract.service.js";
import { formatReceiptWithBedrock } from "../src/services/bedrock.service.js";

const testFilename = path.resolve(process.cwd(), "tests/token-usage.test.ts");
const testDirname = path.dirname(testFilename);

/**
 * Token Usage Test
 *
 * This test processes a real ticket and captures token usage information
 * from AWS Bedrock to help estimate costs.
 *
 * Run with: npm test -- token-usage.test.ts
 */
describe("Token Usage Analysis", () => {
	const samplesDir = path.join(testDirname, "../../../samples");
	const ticketFile = "ticket1.jpeg";
	const ticketPath = path.join(samplesDir, ticketFile);
	const metadataPath = path.join(testDirname, "fixtures/ticket1/metadata.json");

	beforeAll(() => {
		// Log credential status for debugging
		if (
			process.env.AWS_ACCESS_KEY_ID?.startsWith("mock") ||
			!process.env.AWS_ACCESS_KEY_ID
		) {
			console.warn(
				"⚠️  Running with MOCK or MISSING credentials. Expect failure if hitting real AWS."
			);
		} else {
			console.log("✅ Running with REAL AWS credentials loaded from .env");
		}
	});

	it("should measure token usage for ticket processing", async () => {
		console.log("\n" + "=".repeat(80));
		console.log("📊 TOKEN USAGE ANALYSIS - TICKET PROCESSING");
		console.log("=".repeat(80) + "\n");

		// Read image
		const imageBuffer = await fs.readFile(ticketPath);
		console.log(`📄 Processing ticket: ${ticketFile}`);
		console.log(
			`📦 Image size: ${(imageBuffer.length / 1024).toFixed(2)} KB\n`
		);

		// Step 1: Extract text with Textract
		console.log("🔍 Step 1: Extracting text with AWS Textract...");
		const textractStart = Date.now();
		const ocrText = await extractTextFromImage(imageBuffer);
		const textractTime = Date.now() - textractStart;

		console.log(`✅ Textract completed in ${textractTime}ms`);
		console.log(`📝 OCR Text length: ${ocrText.length} characters`);
		console.log(`📝 OCR Text lines: ${ocrText.split("\n").length}\n`);

		// Step 2: Format with Bedrock
		console.log("🤖 Step 2: Formatting with AWS Bedrock...");
		const bedrockStart = Date.now();

		// Intercept the Bedrock response to capture token usage
		// We use dynamic import for the client since it might be mocked/reset in other contexts,
		// but here we just need to patch the prototype of the loaded class.

		const originalSend = BedrockRuntimeClient.prototype.send;

		let inputTokens = 0;
		let outputTokens = 0;
		let modelId = "";

		// Patch send method to capture usage
		BedrockRuntimeClient.prototype.send = async function (
			command: any,
			...args: any[]
		) {
			// @ts-ignore
			const response = (await originalSend.call(this, command, ...args)) as any;

			if (response && response.body) {
				// Clone body to avoid consuming the stream for the actual service
				// Note: AWS SDK v3 streams are often one-time use.
				// However, response.body here is usually a Uint8Array or similar in Node for Bedrock Runtime if not streaming.
				// If it is a stream, this might break. Assuming standard InvokeModel (not stream).
				try {
					const textDecoder = new TextDecoder();
					const bodyString = textDecoder.decode(response.body);
					const responseBody = JSON.parse(bodyString);

					if (responseBody.usage) {
						inputTokens += responseBody.usage.input_tokens || 0;
						outputTokens += responseBody.usage.output_tokens || 0;
					}

					// We don't modify response, just read it.
				} catch (e) {
					console.warn("Could not parse response body for token usage:", e);
				}

				if (command.input?.modelId) {
					modelId = command.input.modelId;
				}
			}

			return response;
		} as any;

		const receiptData = await formatReceiptWithBedrock(ocrText);
		const bedrockTime = Date.now() - bedrockStart;

		// Restore original send
		BedrockRuntimeClient.prototype.send = originalSend;

		console.log(`✅ Bedrock completed in ${bedrockTime}ms\n`);

		const totalTime = textractTime + bedrockTime;

		// Display results
		console.log("=".repeat(80));
		console.log("📊 TOKEN USAGE RESULTS");
		console.log("=".repeat(80));
		console.log(`\n🤖 Model: ${modelId}`);
		console.log(`⏱️  Textract Time: ${textractTime}ms`);
		console.log(`⏱️  Bedrock Time: ${bedrockTime}ms`);
		console.log(`⏱️  Total Execution Time: ${totalTime}ms`);
		console.log(`📥 Input Tokens: ${inputTokens.toLocaleString()}`);
		console.log(`📤 Output Tokens: ${outputTokens.toLocaleString()}`);
		console.log(
			`📊 Total Tokens: ${(inputTokens + outputTokens).toLocaleString()}\n`
		);

		// Calculate costs
		const HAIKU_INPUT_COST = 0.25 / 1_000_000; // $0.25 per million
		const HAIKU_OUTPUT_COST = 1.25 / 1_000_000; // $1.25 per million
		const SONNET_INPUT_COST = 3.0 / 1_000_000; // $3.00 per million
		const SONNET_OUTPUT_COST = 15.0 / 1_000_000; // $15.00 per million

		const isHaiku = modelId.includes("haiku");
		const inputCostPerToken = isHaiku ? HAIKU_INPUT_COST : SONNET_INPUT_COST;
		const outputCostPerToken = isHaiku ? HAIKU_OUTPUT_COST : SONNET_OUTPUT_COST;

		const inputCost = inputTokens * inputCostPerToken;
		const outputCost = outputTokens * outputCostPerToken;
		const totalCost = inputCost + outputCost;

		console.log("=".repeat(80));
		console.log("💰 COST BREAKDOWN");
		console.log("=".repeat(80));
		console.log(
			`\n📥 Input Cost: USD ${inputCost.toFixed(6)} (${inputTokens.toLocaleString()} tokens × $${(inputCostPerToken * 1_000_000).toFixed(2)}/M)`
		);
		console.log(
			`📤 Output Cost: USD ${outputCost.toFixed(6)} (${outputTokens.toLocaleString()} tokens × $${(outputCostPerToken * 1_000_000).toFixed(2)}/M)`
		);
		console.log(`💵 Total Cost: USD ${totalCost.toFixed(6)}\n`);

		// Update Metadata JSON
		try {
			console.log(`💾 Updating metadata at: ${metadataPath}`);
			const metadataContent = await fs.readFile(metadataPath, "utf-8");
			const metadata = JSON.parse(metadataContent);

			// Add execution time
			metadata.execution_time_ms = totalTime;

			// Write back
			await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
			console.log("✅ Metadata updated with execution time.");
		} catch (error) {
			console.error("⚠️ Failed to update metadata.json:", error);
		}

		// Assertions
		expect(receiptData).toBeDefined();
		expect(receiptData.items.length).toBeGreaterThan(0);
		expect(inputTokens).toBeGreaterThan(0);
		expect(outputTokens).toBeGreaterThan(0);
		expect(totalCost).toBeGreaterThan(0);
	}, 120000); // 2 minute timeout
});

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// Mock p-retry to avoid ES module import issues
jest.mock("p-retry", () =&gt; {
	const mockRetry = jest.fn((fn) =&gt; fn());
	return {
		__esModule: true,
		default: mockRetry,
	};
});

import { extractTextFromImage } from "../src/services/textract.service.js";
import { formatReceiptWithBedrock } from "../src/services/bedrock.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Token Usage Test
 * 
 * This test processes a real ticket and captures token usage information
 * from AWS Bedrock to help estimate costs.
 * 
 * Run with: npm test -- token-usage.test.ts
 */
describe("Token Usage Analysis", () =&gt; {
	const samplesDir = path.join(__dirname, "../../../samples");
	const ticketFile = "ticket1.jpeg";
	const ticketPath = path.join(samplesDir, ticketFile);

	beforeAll(() =&gt; {
		// Skip if AWS credentials are not configured
		if (
			!process.env.AWS_ACCESS_KEY_ID ||
			!process.env.AWS_SECRET_ACCESS_KEY
		) {
			console.warn(
				"⚠️  AWS credentials not configured. Skipping token usage test."
			);
		}
	});

	it("should measure token usage for ticket processing", async () =&gt; {
		console.log("\n" + "=".repeat(80));
		console.log("📊 TOKEN USAGE ANALYSIS - TICKET PROCESSING");
		console.log("=".repeat(80) + "\n");

		// Read image
		const imageBuffer = await fs.readFile(ticketPath);
		console.log(`📄 Processing ticket: ${ticketFile}`);
		console.log(`📦 Image size: ${(imageBuffer.length / 1024).toFixed(2)} KB\n`);

		// Step 1: Extract text with Textract
		console.log("🔍 Step 1: Extracting text with AWS Textract...");
		const textractStart = Date.now();
		const ocrText = await extractTextFromImage(imageBuffer);
		const textractTime = Date.now() - textractStart;
		
		console.log(`✅ Textract completed in ${textractTime}ms`);
		console.log(`📝 OCR Text length: ${ocrText.length} characters`);
		console.log(`📝 OCR Text lines: ${ocrText.split('\n').length}\n`);

		// Step 2: Format with Bedrock
		console.log("🤖 Step 2: Formatting with AWS Bedrock...");
		const bedrockStart = Date.now();
		
		// Intercept the Bedrock response to capture token usage
		const originalSend = (await import("@aws-sdk/client-bedrock-runtime")).BedrockRuntimeClient.prototype.send;
		let inputTokens = 0;
		let outputTokens = 0;
		let modelId = "";
		
		(await import("@aws-sdk/client-bedrock-runtime")).BedrockRuntimeClient.prototype.send = async function(command: any) {
			const response = await originalSend.call(this, command);
			
			if (response.body) {
				const responseBody = JSON.parse(new TextDecoder().decode(response.body));
				
				// Capture token usage from response
				if (responseBody.usage) {
					inputTokens += responseBody.usage.input_tokens || 0;
					outputTokens += responseBody.usage.output_tokens || 0;
				}
				
				// Capture model ID from command
				if (command.input?.modelId) {
					modelId = command.input.modelId;
				}
			}
			
			return response;
		};
		
		const receiptData = await formatReceiptWithBedrock(ocrText);
		const bedrockTime = Date.now() - bedrockStart;

		console.log(`✅ Bedrock completed in ${bedrockTime}ms\n`);

		// Display results
		console.log("=".repeat(80));
		console.log("📊 TOKEN USAGE RESULTS");
		console.log("=".repeat(80));
		console.log(`\n🤖 Model: ${modelId}`);
		console.log(`📥 Input Tokens: ${inputTokens.toLocaleString()}`);
		console.log(`📤 Output Tokens: ${outputTokens.toLocaleString()}`);
		console.log(`📊 Total Tokens: ${(inputTokens + outputTokens).toLocaleString()}\n`);

		// Calculate costs
		const HAIKU_INPUT_COST = 0.25 / 1_000_000; // $0.25 per million
		const HAIKU_OUTPUT_COST = 1.25 / 1_000_000; // $1.25 per million
		const SONNET_INPUT_COST = 3.00 / 1_000_000; // $3.00 per million
		const SONNET_OUTPUT_COST = 15.00 / 1_000_000; // $15.00 per million

		const isHaiku = modelId.includes("haiku");
		const inputCostPerToken = isHaiku ? HAIKU_INPUT_COST : SONNET_INPUT_COST;
		const outputCostPerToken = isHaiku ? HAIKU_OUTPUT_COST : SONNET_OUTPUT_COST;

		const inputCost = inputTokens * inputCostPerToken;
		const outputCost = outputTokens * outputCostPerToken;
		const totalCost = inputCost + outputCost;

		console.log("=".repeat(80));
		console.log("💰 COST BREAKDOWN");
		console.log("=".repeat(80));
		console.log(`\n📥 Input Cost: USD ${inputCost.toFixed(6)} (${inputTokens.toLocaleString()} tokens × $${(inputCostPerToken * 1_000_000).toFixed(2)}/M)`);
		console.log(`📤 Output Cost: USD ${outputCost.toFixed(6)} (${outputTokens.toLocaleString()} tokens × $${(outputCostPerToken * 1_000_000).toFixed(2)}/M)`);
		console.log(`💵 Total Cost: USD ${totalCost.toFixed(6)}\n`);

		// Projections
		console.log("=".repeat(80));
		console.log("📈 COST PROJECTIONS");
		console.log("=".repeat(80));
		console.log(`\n📊 Cost per ticket: USD ${totalCost.toFixed(6)}`);
		console.log(`📊 Cost per 100 tickets: USD ${(totalCost * 100).toFixed(4)}`);
		console.log(`📊 Cost per 1,000 tickets: USD ${(totalCost * 1000).toFixed(2)}`);
		console.log(`📊 Cost per 10,000 tickets: USD ${(totalCost * 10000).toFixed(2)}\n`);

		// Receipt data summary
		console.log("=".repeat(80));
		console.log("📄 RECEIPT DATA SUMMARY");
		console.log("=".repeat(80));
		console.log(`\n🏪 Supermarket: ${receiptData.supermarket}`);
		console.log(`📅 Date/Time: ${receiptData.datetime}`);
		console.log(`🛒 Items extracted: ${receiptData.items.length}`);
		console.log(`💰 Total: $${receiptData.total.toFixed(2)}`);
		if (receiptData.discounts &amp;&amp; receiptData.discounts.length &gt; 0) {
			console.log(`🎫 Discounts: ${receiptData.discounts.length}`);
		}
		console.log("\n" + "=".repeat(80) + "\n");

		// Assertions
		expect(receiptData).toBeDefined();
		expect(receiptData.items.length).toBeGreaterThan(0);
		expect(inputTokens).toBeGreaterThan(0);
		expect(outputTokens).toBeGreaterThan(0);
		expect(totalCost).toBeGreaterThan(0);
	}, 120000); // 2 minute timeout
});

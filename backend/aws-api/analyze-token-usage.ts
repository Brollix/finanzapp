import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { extractTextFromImage } from "./src/services/textract.service.js";
import { InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { bedrockClient } from "./src/config/aws.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BEDROCK_MODEL_ID =
	process.env.BEDROCK_MODEL_ID || "us.anthropic.claude-3-5-haiku-20241022-v1:0";

// Optimized compact system prompt for Haiku
const HAIKU_SYSTEM_PROMPT = `Extract receipt data to JSON. Numbers: Argentine format "5.850,00"→5850.00.

Structure: {supermarket, datetime "DD/MM/YYYY HH:MM:SS", total, items: [{product, brand?, quantity, price, discount?, promotion?, is_weight?}], discounts: [{description, amount}]}

Rules: Group duplicates. Title Case products. Extract brands if clear. Link discounts to items. Exclude totals/taxes. is_weight=true for kg/peso items.

Return JSON only.`;

async function analyzeTokenUsage() {
	console.log("\n" + "=".repeat(80));
	console.log("📊 TOKEN USAGE ANALYSIS - TICKET PROCESSING");
	console.log("=".repeat(80) + "\n");

	// Read image
	const samplesDir = path.join(__dirname, "../../samples");
	const ticketFile = "ticket1.jpeg";
	const ticketPath = path.join(samplesDir, ticketFile);

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
	console.log(`📝 OCR Text lines: ${ocrText.split("\n").length}\n`);

	// Step 2: Format with Bedrock and capture token usage
	console.log("🤖 Step 2: Formatting with AWS Bedrock...");
	const bedrockStart = Date.now();

	const payload = {
		anthropic_version: "bedrock-2023-05-31",
		max_tokens: 4096,
		temperature: 0.0,
		system: [
			{
				type: "text",
				text: HAIKU_SYSTEM_PROMPT,
			},
		],
		messages: [
			{
				role: "user",
				content: `OCR Text:\n---\n${ocrText}\n---`,
			},
		],
	};

	const command = new InvokeModelCommand({
		modelId: BEDROCK_MODEL_ID,
		contentType: "application/json",
		accept: "application/json",
		body: JSON.stringify(payload),
	});

	const response = await bedrockClient.send(command);
	const bedrockTime = Date.now() - bedrockStart;

	if (!response.body) {
		throw new Error("No response body from Bedrock");
	}

	const responseBody = JSON.parse(new TextDecoder().decode(response.body));
	const contentText = responseBody.content?.[0]?.text;

	// Extract token usage
	const inputTokens = responseBody.usage?.input_tokens || 0;
	const outputTokens = responseBody.usage?.output_tokens || 0;

	console.log(`✅ Bedrock completed in ${bedrockTime}ms\n`);

	// Parse receipt data
	let jsonText = contentText.trim();
	const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
	if (jsonMatch) {
		jsonText = jsonMatch[0];
	}
	const receiptData = JSON.parse(jsonText);

	// Display results
	console.log("=".repeat(80));
	console.log("📊 TOKEN USAGE RESULTS");
	console.log("=".repeat(80));
	console.log(`\n🤖 Model: ${BEDROCK_MODEL_ID}`);
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

	const isHaiku = BEDROCK_MODEL_ID.includes("haiku");
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

	// Projections
	console.log("=".repeat(80));
	console.log("📈 COST PROJECTIONS");
	console.log("=".repeat(80));
	console.log(`\n📊 Cost per ticket: USD ${totalCost.toFixed(6)}`);
	console.log(`📊 Cost per 10 tickets: USD ${(totalCost * 10).toFixed(5)}`);
	console.log(`📊 Cost per 100 tickets: USD ${(totalCost * 100).toFixed(4)}`);
	console.log(
		`📊 Cost per 1,000 tickets: USD ${(totalCost * 1000).toFixed(2)}`
	);
	console.log(
		`📊 Cost per 10,000 tickets: USD ${(totalCost * 10000).toFixed(2)}\n`
	);

	// Receipt data summary
	console.log("=".repeat(80));
	console.log("📄 RECEIPT DATA SUMMARY");
	console.log("=".repeat(80));
	console.log(`\n🏪 Supermarket: ${receiptData.supermarket}`);
	console.log(`📅 Date/Time: ${receiptData.datetime}`);
	console.log(`🛒 Items extracted: ${receiptData.items?.length || 0}`);
	console.log(`💰 Total: $${receiptData.total}`);
	if (receiptData.discounts && receiptData.discounts.length > 0) {
		console.log(`🎫 Discounts: ${receiptData.discounts.length}`);
	}
	console.log("\n" + "=".repeat(80) + "\n");

	// Return data for further processing
	return {
		inputTokens,
		outputTokens,
		totalTokens: inputTokens + outputTokens,
		inputCost,
		outputCost,
		totalCost,
		modelId: BEDROCK_MODEL_ID,
		receiptData,
	};
}

// Run the analysis
analyzeTokenUsage()
	.then(() => {
		console.log("✅ Analysis complete!");
		process.exit(0);
	})
	.catch((error) => {
		console.error("❌ Error:", error);
		process.exit(1);
	});

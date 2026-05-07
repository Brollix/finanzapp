import { InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { bedrockClient } from "../config/aws.js";
import { ReceiptData } from "../types/receipt.types.js";
import logger from "../utils/logger.js";
import { retryBedrockCall } from "../utils/retry.js";

const BEDROCK_MODEL_ID =
	process.env.BEDROCK_MODEL_ID || "us.anthropic.claude-3-5-haiku-20241022-v1:0";

// Optimized compact system prompt for Haiku
const HAIKU_SYSTEM_PROMPT = `Extract receipt data to JSON. Numbers: Argentine format "5.850,00"→5850.00.

Structure: {supermarket, datetime "DD/MM/YYYY HH:MM:SS", total, items: [{product, brand?, quantity, price, discount?, promotion?, is_weight?}], discounts: [{description, amount}]}

Rules: Group duplicates. Title Case products. Extract brands if clear. Link discounts to items. Exclude totals/taxes. is_weight=true for kg/peso items.

Return JSON only.`;

export async function formatReceiptWithBedrock(
	ocrText: string
): Promise<ReceiptData> {
	try {
		logger.info("Haiku: Extracting data from OCR...");
		console.log("ACTUAL BEDROCK MODEL ID IN USE:", BEDROCK_MODEL_ID);

		// Prepare the request payload for Claude
		// Note: performanceConfig.latency="optimized" only available in US East (Ohio) region
		const payload = {
			anthropic_version: "bedrock-2023-05-31",
			max_tokens: 4096, // Increased to handle complex receipts with many items and discounts
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

		if (!response.body) {
			throw new Error("No response body from Bedrock");
		}

		// Parse the response
		const responseBody = JSON.parse(new TextDecoder().decode(response.body));

		// Extract the text content from Claude's response
		const contentText = responseBody.content?.[0]?.text;
		if (!contentText) {
			throw new Error("No text content in Bedrock response");
		}

		// Clean and parse JSON
		let jsonText = contentText.trim();

		// 1. Try to extract JSON block if wrapped in markdown or text
		const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
		if (jsonMatch) {
			jsonText = jsonMatch[0];
		}

		let rawData;
		try {
			rawData = JSON.parse(jsonText);
		} catch (parseError) {
			logger.error(
				`Failed to parse Bedrock JSON response. Raw text length: ${jsonText.length}`
			);
			logger.error(`First 200 chars: ${jsonText.substring(0, 200)}`);
			logger.error(
				`Last 200 chars: ${jsonText.substring(jsonText.length - 200)}`
			);
			throw new Error(
				`Invalid JSON from Bedrock: ${
					parseError instanceof Error ? parseError.message : String(parseError)
				}`
			);
		}

	// Post-process numbers (Argentine format -> Float)
	const receiptData: ReceiptData = {
		supermarket: rawData.supermarket,
		datetime: rawData.datetime,
		total: parseArgentineNumber(rawData.total),
		items: rawData.items.map((item: any) => {
			const quantity = parseArgentineNumber(item.quantity);
			const price = parseArgentineNumber(item.price);
			const discount = item.discount ? parseArgentineNumber(item.discount) : 0;
			const unit_price = quantity > 0 ? price / quantity : 0;
			
			return {
				...item,
				quantity,
				price,
				unit_price,
				discount,
			};
		}),
		// Pass discounts to Sonnet if needed, or handle them there
		discounts: rawData.discounts?.map((d: any) => ({
			description: d.description,
			amount: Math.abs(parseArgentineNumber(d.amount)),
		})),
	};

		// Validate the structure
		if (
			!receiptData.supermarket ||
			!receiptData.datetime ||
			typeof receiptData.total !== "number" ||
			!Array.isArray(receiptData.items)
		) {
			throw new Error("Invalid receipt data structure from Bedrock");
		}

		logger.info(
			`✅ Haiku: Extracted ${receiptData.items.length} items.`
		);

		return receiptData;
	} catch (error) {
		logger.error(`Bedrock error: ${error}`);
		throw new Error(
			`Failed to format receipt with Bedrock: ${
				error instanceof Error ? error.message : "Unknown error"
			}`
		);
	}
}

/**
 * Helper to parse Argentine number format (1.234,56) to JS float (1234.56)
 * If the input is already a number, it returns it as is.
 */
export function parseArgentineNumber(value: string | number): number {
	if (typeof value === "number") {
		return value;
	}
	if (!value) {
		return 0;
	}
	// Remove thousands separator (.) and replace decimal separator (,) with (.)
	const cleanValue = value.replace(/\./g, "").replace(",", ".");
	const parsed = parseFloat(cleanValue);
	return isNaN(parsed) ? 0 : parsed;
}

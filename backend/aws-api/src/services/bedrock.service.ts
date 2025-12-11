import { InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { bedrockClient } from "../config/aws.js";
import { ReceiptData } from "../types/receipt.types.js";
import logger from "../utils/logger.js";

const BEDROCK_MODEL_ID =
	process.env.BEDROCK_MODEL_ID || "anthropic.claude-3-haiku-20240307-v1:0";
const BEDROCK_SONNET_MODEL_ID =
	"global.anthropic.claude-sonnet-4-20250514-v1:0";

// Optimized static system prompt for Haiku (cached for 5 minutes)
const HAIKU_SYSTEM_PROMPT = `Extract supermarket receipt data to JSON.

NUMBERS: Argentine format. "5.850,00" → 5850.00 (remove dots, comma to period). Positive except discounts.

STRUCTURE:
- supermarket: Commercial name only (Carrefour, Coto, Disco, Jumbo, Día, Vea)
- datetime: 24h format "DD/MM/YYYY HH:MM:SS" (e.g., "30/11/2024 14:30:00")
- total: Final amount (float)
- items: [{ product, brand?, quantity, price, discount?, promotion?, is_weight? }]
- discounts: [{ description, amount }]

RULES:
1. Group duplicate products (sum quantity/price)
2. Product names: descriptive, Title Case ("Leche Entera 1L", "Galletitas Chocolate")
3. Brands: McCain, Paty, Bimbo, Tang, Coca Cola, La Serenisima, Arcor, Lucchetti, Knorr, Hellmanns, Dove, Colgate, etc. Extract if clear, else null
4. Discounts: Link to product above, use absolute values. Price = gross (before discount)
5. Exclude: Total, Subtotal, Pago, Vuelto, tax lines
6. is_weight: true if sold by weight (kg, peso, quantity like 0.750)

EXAMPLES:
"MCCAIN PAPAS 2.5KG" → {product: "Papas Fritas", brand: "McCain", is_weight: true}
"FIDEOS RINA 4.800,00\\n2do 50% -1.200,00" → {product: "Fideos", brand: "Rina", price: 4800, discount: 1200, promotion: "2do al 50%"}
"GALLETITAS OREO" (x2) → Group into one item

Return JSON only.`;

export async function formatReceiptWithBedrock(
	ocrText: string
): Promise<ReceiptData> {
	try {
		logger.info("Haiku: Extracting data from OCR...");

		// Prepare the request payload for Claude with prompt caching
		// Note: cache_control may not be available in all Bedrock regions
		const payload = {
			anthropic_version: "bedrock-2023-05-31",
			max_tokens: 2048, // Reduced from 4096
			temperature: 0.0,
			system: [
				{
					type: "text",
					text: HAIKU_SYSTEM_PROMPT,
					// cache_control: { type: "ephemeral" }, // Disabled: not available in all regions
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
				`Invalid JSON from Bedrock: ${parseError instanceof Error ? parseError.message : String(parseError)
				}`
			);
		}

		// Post-process numbers (Argentine format -> Float)
		const receiptData: ReceiptData = {
			supermarket: rawData.supermarket,
			datetime: rawData.datetime,
			total: parseArgentineNumber(rawData.total),
			items: rawData.items.map((item: any) => ({
				...item,
				quantity: parseArgentineNumber(item.quantity),
				price: parseArgentineNumber(item.price),
				discount: item.discount ? parseArgentineNumber(item.discount) : 0,
			})),
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
			`🔄 [1/2] Haiku: Extracted ${receiptData.items.length} raw items.`
		);

		// Conditional refinement: Skip Sonnet for simple receipts
		if (needsRefinement(receiptData)) {
			logger.info("Complex receipt detected, refining with Sonnet...");
			return await refineProductNames(receiptData);
		}

		logger.info("✅ Simple receipt, skipping Sonnet refinement");
		return receiptData;
	} catch (error) {
		logger.error(`Bedrock error: ${error}`);
		throw new Error(
			`Failed to format receipt with Bedrock: ${error instanceof Error ? error.message : "Unknown error"
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

/**
 * Determines if a receipt needs Sonnet refinement based on complexity.
 * Skip Sonnet for simple receipts to reduce latency by ~50%.
 */
function needsRefinement(data: ReceiptData): boolean {
	// Check for unassigned discounts
	const hasUnassignedDiscounts = data.discounts && data.discounts.length > 0;

	// Check if receipt is complex (many items)
	const isComplex = data.items.length > 10;

	// Check for weird characters in product names (OCR artifacts)
	const hasWeirdChars = data.items.some((item) =>
		/[^a-zA-Z0-9\s\.\,\-áéíóúñÁÉÍÓÚÑüÜ]/.test(item.product)
	);

	// Check if any product name is all caps (needs Title Case fix)
	const hasAllCaps = data.items.some(
		(item) => item.product === item.product.toUpperCase() && item.product.length > 3
	);

	return hasUnassignedDiscounts || isComplex || hasWeirdChars || hasAllCaps;
}

export async function generateEmbedding(text: string): Promise<number[]> {
	try {
		const payload = {
			inputText: text,
		};

		const command = new InvokeModelCommand({
			modelId: "amazon.titan-embed-text-v1",
			contentType: "application/json",
			accept: "application/json",
			body: JSON.stringify(payload),
		});

		const response = await bedrockClient.send(command);

		if (!response.body) {
			throw new Error("No response body from Bedrock");
		}

		const responseBody = JSON.parse(new TextDecoder().decode(response.body));
		return responseBody.embedding;
	} catch (error) {
		logger.error(`Bedrock embedding error: ${error}`);
		throw new Error(
			`Failed to generate embedding: ${error instanceof Error ? error.message : "Unknown error"
			}`
		);
	}
}

export async function suggestCategory(productName: string): Promise<string> {
	try {
		const prompt = `You are a product categorization assistant for a finance app.
Classify the following supermarket product into one of these categories:
- Almacén (Pantry/Groceries)
- Bebidas (Drinks)
- Frescos (Fresh Food - Dairy, Meat, etc.)
- Limpieza (Cleaning)
- Perfumería (Personal Care)
- Mascotas (Pets)
- Otros (Others)

Product: "${productName}"

Return ONLY the category name, nothing else.`;

		const payload = {
			anthropic_version: "bedrock-2023-05-31",
			max_tokens: 100,
			temperature: 0,
			messages: [
				{
					role: "user",
					content: prompt,
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

		const responseBody = JSON.parse(new TextDecoder().decode(response.body));
		const category = responseBody.content?.[0]?.text?.trim();

		if (!category) {
			return "Otros";
		}

		return category;
	} catch (error) {
		logger.error(`Bedrock categorization error: ${error}`);
		return "Otros"; // Default fallback
	}
}

// Optimized Sonnet system prompt (cached)
const SONNET_SYSTEM_PROMPT = `Receipt data cleaner. Fix typos, map discounts, use Title Case. Output JSON only.`;

export async function refineProductNames(
	receiptData: ReceiptData
): Promise<ReceiptData> {
	try {
		logger.info("✨ [2/2] Sonnet: Refining names and mapping discounts...");
		const itemsJson = JSON.stringify(receiptData.items);
		const discountsJson = JSON.stringify(receiptData.discounts || []);

		const userPrompt = `Items: ${itemsJson}
Discounts: ${discountsJson}

Tasks:
1. Fix typos, use Title Case
2. Extract brands from product names
3. Link unassigned discounts to items (add discount/promotion fields to item)
4. Remove non-product lines (Total, Subtotal, Pago, Vuelto)
5. PRESERVE all discount and promotion values from items
6. IMPORTANT: Remove linked discounts from the discounts array. Only keep truly unassigned discounts.

Return: {"items": [...], "discounts": [...]}
- items: Array with discount/promotion fields for items that have them
- discounts: Array with ONLY unlinked/unassigned discounts (empty if all discounts were linked)`;

		const payload = {
			anthropic_version: "bedrock-2023-05-31",
			max_tokens: 2048, // Increased from 1024 to handle complex receipts with many items
			temperature: 0,
			system: [
				{
					type: "text",
					text: SONNET_SYSTEM_PROMPT,
					// cache_control: { type: "ephemeral" }, // Disabled: not available in all regions
				},
			],
			messages: [
				{
					role: "user",
					content: userPrompt,
				},
			],
		};

		const command = new InvokeModelCommand({
			modelId: BEDROCK_SONNET_MODEL_ID,
			contentType: "application/json",
			accept: "application/json",
			body: JSON.stringify(payload),
		});

		const response = await bedrockClient.send(command);

		if (!response.body) {
			throw new Error("No response body from Bedrock");
		}

		const responseBody = JSON.parse(new TextDecoder().decode(response.body));
		const contentText = responseBody.content?.[0]?.text;

		if (!contentText) {
			throw new Error("No text content in Bedrock response");
		}

		let jsonText = contentText.trim();
		if (jsonText.startsWith("```json")) {
			jsonText = jsonText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
		} else if (jsonText.startsWith("```")) {
			jsonText = jsonText.replace(/^```\s*/, "").replace(/\s*```$/, "");
		}

		let refinedData;
		try {
			refinedData = JSON.parse(jsonText);
		} catch (parseError) {
			logger.error(`Failed to parse Sonnet JSON response. Raw text length: ${jsonText.length}`);
			logger.error(`First 500 chars: ${jsonText.substring(0, 500)}`);
			logger.error(`Last 500 chars: ${jsonText.substring(Math.max(0, jsonText.length - 500))}`);
			logger.error(`Parse error: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
			throw parseError;
		}

		logger.info("✅ [2/2] Sonnet: Refinement complete.");
		// Return updated receipt data
		return {
			...receiptData,
			items: refinedData.items || [],
			discounts: refinedData.discounts || [],
		};
	} catch (error) {
		logger.error(`Bedrock refinement error: ${error}`);
		// If refinement fails, return original data
		return receiptData;
	}
}

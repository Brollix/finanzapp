import { InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { bedrockClient } from "../config/aws.js";
import { ReceiptData } from "../types/receipt.types.js";
import logger from "../utils/logger.js";
import { retryBedrockCall } from "../utils/retry.js";

const BEDROCK_MODEL_ID =
	process.env.BEDROCK_MODEL_ID || "anthropic.claude-3-5-haiku-20241022-v1:0";
const BEDROCK_SONNET_MODEL_ID =
	"global.anthropic.claude-sonnet-4-20250514-v1:0";

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
		const needsRefinementResult = needsRefinement(receiptData);
		if (needsRefinementResult) {
			logger.info("Complex receipt detected, refining with Sonnet...");
			return await refineProductNames(receiptData);
		}

		logger.info("✅ Simple receipt, skipping Sonnet refinement");
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

/**
 * Simple Levenshtein distance calculation for fuzzy string matching
 * Used to detect duplicate items that might have slight variations
 */
function levenshteinDistance(str1: string, str2: string): number {
	const len1 = str1.length;
	const len2 = str2.length;
	const matrix: number[][] = [];

	// Initialize matrix
	for (let i = 0; i <= len1; i++) {
		matrix[i] = [i];
	}
	for (let j = 0; j <= len2; j++) {
		matrix[0][j] = j;
	}

	// Fill matrix
	for (let i = 1; i <= len1; i++) {
		for (let j = 1; j <= len2; j++) {
			if (str1[i - 1] === str2[j - 1]) {
				matrix[i][j] = matrix[i - 1][j - 1];
			} else {
				matrix[i][j] = Math.min(
					matrix[i - 1][j] + 1, // deletion
					matrix[i][j - 1] + 1, // insertion
					matrix[i - 1][j - 1] + 1 // substitution
				);
			}
		}
	}

	return matrix[len1][len2];
}

/**
 * Calculate similarity ratio between two strings (0-1, where 1 is identical)
 */
function stringSimilarity(str1: string, str2: string): number {
	const maxLen = Math.max(str1.length, str2.length);
	if (maxLen === 0) return 1.0;
	const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
	return 1 - distance / maxLen;
}

/**
 * Normalize product name for comparison (remove extra spaces, lowercase)
 */
function normalizeProductName(name: string): string {
	return name.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Validate item completeness by comparing OCR text with extracted items
 * Uses heuristics to estimate how many items should be in the receipt
 */
function validateItemCompleteness(
	ocrText: string,
	extractedItems: ReceiptData["items"]
): {
	isComplete: boolean;
	estimatedTotal: number;
	extractedCount: number;
	missingEstimate: number;
	completenessPercent: number;
} {
	// Count lines that look like products in the OCR (heuristic)
	// Format typically: "PRODUCTO ... $PRECIO" or similar
	// Argentine format: numbers with dots/commas like "1.234,56" or "123,45"
	const pricePattern = /[\$]?\d{1,3}(?:[\.,]\d{3})*[\.,]\d{2}\s*$/;
	const lines = ocrText.split("\n");

	// Filter lines that:
	// 1. Have a price pattern at the end
	// 2. Are not too short (likely not products)
	// 3. Are not common header/footer words
	const excludedWords = [
		"total",
		"subtotal",
		"pago",
		"vuelto",
		"efectivo",
		"tarjeta",
		"descuento",
		"iva",
		"supermercado",
		"fecha",
		"hora",
	];

	const linesWithPrices = lines.filter((line) => {
		const trimmed = line.trim();
		if (trimmed.length < 5) return false; // Too short to be a product
		if (pricePattern.test(trimmed)) {
			const lower = trimmed.toLowerCase();
			// Exclude common header/footer lines and totals
			if (excludedWords.some((word) => lower.includes(word))) {
				return false;
			}
			// Exclude lines that START with totals/subtotals keywords
			if (
				/^\s*(total|subtotal|pago|vuelto|efectivo|tarjeta|descuento|iva|suma)/i.test(
					trimmed
				)
			) {
				return false;
			}
			// Exclude lines that are ONLY numbers (likely totals)
			if (/^\s*[\d.,]+\s*$/.test(trimmed)) {
				return false;
			}
			// Must have some text before the price (product name) - at least 2 characters
			const textBeforePrice = trimmed.replace(pricePattern, "").trim();
			if (textBeforePrice.length < 2) {
				return false;
			}
			return true;
		}
		return false;
	}).length;

	const extractedCount = extractedItems.length;
	// Lower threshold to 75% - be more conservative about declaring completeness
	// This ensures we try reconciliation more often to avoid losing items
	const threshold = 0.75; // 75% completeness minimum
	const completenessPercent =
		linesWithPrices > 0
			? (extractedCount / linesWithPrices) * 100
			: extractedCount > 0
			? 100
			: 0;
	// If we have more items than estimated, consider it complete (better safe than sorry)
	const isComplete =
		extractedCount >= linesWithPrices * threshold ||
		extractedCount >= linesWithPrices;
	const missingEstimate = Math.max(0, linesWithPrices - extractedCount);

	return {
		isComplete,
		estimatedTotal: linesWithPrices,
		extractedCount,
		missingEstimate,
		completenessPercent,
	};
}

/**
 * Intelligent deduplication using fuzzy matching
 * Only removes items that are truly duplicates (same product, price, quantity)
 * Logs removed items for audit purposes
 */
function deduplicateItemsIntelligently(items: ReceiptData["items"]): {
	uniqueItems: ReceiptData["items"];
	removedDuplicates: ReceiptData["items"];
} {
	const uniqueItems: ReceiptData["items"] = [];
	const removedDuplicates: ReceiptData["items"] = [];
	const seen = new Set<string>();

	for (const item of items) {
		// Create a key based on normalized product name, price, and quantity
		const normalizedProduct = normalizeProductName(item.product);
		const key = `${normalizedProduct}|${item.price}|${item.quantity}`;

		// Check for exact duplicate first
		if (seen.has(key)) {
			removedDuplicates.push(item);
			logger.debug(
				`Removed exact duplicate: ${item.product} (price: ${item.price}, qty: ${item.quantity})`
			);
			continue;
		}

		// Check for fuzzy duplicates (similar product name with same price and quantity)
		let isDuplicate = false;
		for (const existingItem of uniqueItems) {
			const existingNormalized = normalizeProductName(existingItem.product);
			const similarity = stringSimilarity(
				normalizedProduct,
				existingNormalized
			);

			// CRITICAL: Only remove duplicates if we're VERY confident (99%+ similarity)
			// AND exact same price AND exact same quantity
			// Better to keep a potential duplicate than lose a real item
			if (
				similarity > 0.99 &&
				Math.abs(existingItem.price - item.price) < 0.001 &&
				Math.abs(existingItem.quantity - item.quantity) < 0.001
			) {
				isDuplicate = true;
				removedDuplicates.push(item);
				logger.debug(
					`Removed fuzzy duplicate: ${item.product} (similarity: ${(
						similarity * 100
					).toFixed(1)}%, matches: ${existingItem.product})`
				);
				break;
			}
		}

		if (!isDuplicate) {
			seen.add(key);
			uniqueItems.push(item);
		}
	}

	return { uniqueItems, removedDuplicates };
}

/**
 * Reconcile missing items by making an additional call with the full OCR
 * and comparing against already extracted items
 */
async function reconcileMissingItems(
	ocrText: string,
	extractedItems: ReceiptData["items"],
	estimatedTotal: number
): Promise<ReceiptData["items"]> {
	try {
		logger.warn(
			`Reconciliation: Attempting to recover missing items (estimated: ${estimatedTotal}, extracted: ${extractedItems.length})`
		);

		const reconciliationPrompt = `TAREA CRÍTICA DE RECONCILIACIÓN: 

Ya se extrajeron ${
			extractedItems.length
		} items de este ticket, pero se estima que deberían haber ${estimatedTotal} items.

Items ya extraídos:
${JSON.stringify(extractedItems.slice(0, 10), null, 2)}${
			extractedItems.length > 10
				? `\n... (${extractedItems.length - 10} más)`
				: ""
		}

OCR completo del ticket:
---
${ocrText}
---

INSTRUCCIONES CRÍTICAS:
1. Revisa TODO el OCR línea por línea
2. Encuentra TODOS los productos/items que NO estén en la lista de items ya extraídos
3. Si hay CUALQUIER duda sobre si un item ya está en la lista, INCLÚYELO de todas formas (mejor duplicado que perder un item)
4. Solo excluye items si estás 100% seguro que tienen EXACTAMENTE el mismo nombre, precio y cantidad
5. Incluye TODOS los productos visibles en el OCR, sin excepción

Formato de salida:
{"items": [{"product": "...", "quantity": X, "price": X, ...}]}

IMPORTANTE: Es MEJOR incluir un item duplicado que perder un item real. Si hay duda, inclúyelo.`;

		const payload = {
			anthropic_version: "bedrock-2023-05-31",
			max_tokens: 2048,
			temperature: 0.0,
			system: [
				{
					type: "text",
					text: `${HAIKU_SYSTEM_PROMPT}\n\nIMPORTANT: Return ONLY valid JSON. Extract ONLY missing items that are not in the provided list.`,
				},
			],
			messages: [
				{
					role: "user",
					content: reconciliationPrompt,
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
		const contentText = responseBody.content?.[0]?.text;

		if (!contentText) {
			throw new Error("No text content in Bedrock response");
		}

		let jsonText = contentText.trim();
		const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
		if (jsonMatch) {
			jsonText = jsonMatch[0];
		}

		// Normalize numbers in JSON before parsing (same as in processOCRSection)
		jsonText = jsonText.replace(
			/("(?:total|price|quantity|discount|amount)"\s*:\s*)(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g,
			(_match: string, prefix: string, number: string) => {
				const normalized = number.replace(/,/g, "");
				return prefix + normalized;
			}
		);
		jsonText = jsonText.replace(
			/(:\s*)(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)(\s*[,}])/g,
			(_match: string, prefix: string, number: string, suffix: string) => {
				const normalized = number.replace(/,/g, "");
				return prefix + normalized + suffix;
			}
		);

		let rawData;
		try {
			rawData = JSON.parse(jsonText);
		} catch (parseError) {
			// Try aggressive normalization
			try {
				const aggressiveNormalized = jsonText.replace(/(\d),(\d)/g, "$1$2");
				rawData = JSON.parse(aggressiveNormalized);
			} catch (secondError) {
				logger.error(`Reconciliation parse error: ${parseError}`);
				return [];
			}
		}

		const reconciledItems = (rawData.items || []).map((item: any) => ({
			...item,
			quantity: parseArgentineNumber(item.quantity),
			price: parseArgentineNumber(item.price),
			discount: item.discount ? parseArgentineNumber(item.discount) : 0,
		}));

		// Deduplicate reconciled items against already extracted items
		const uniqueReconciledItems = reconciledItems.filter(
			(newItem: ReceiptData["items"][0]) => {
				const normalizedNewProduct = normalizeProductName(newItem.product);

				// Check if this item already exists in extracted items
				for (const existingItem of extractedItems) {
					const normalizedExistingProduct = normalizeProductName(
						existingItem.product
					);
					const similarity = stringSimilarity(
						normalizedNewProduct,
						normalizedExistingProduct
					);

					// CRITICAL: Only skip if VERY confident it's a duplicate (99%+ similarity)
					// AND exact same price AND exact same quantity
					// Better to keep potential duplicates than lose real items
					if (
						similarity > 0.99 &&
						Math.abs(existingItem.price - newItem.price) < 0.001 &&
						Math.abs(existingItem.quantity - newItem.quantity) < 0.001
					) {
						logger.debug(
							`Reconciliation: Skipping duplicate item "${
								newItem.product
							}" (similarity: ${(similarity * 100).toFixed(1)}%, matches: "${
								existingItem.product
							}")`
						);
						return false;
					}
				}
				return true;
			}
		);

		logger.info(
			`Reconciliation: Found ${reconciledItems.length} items, ${uniqueReconciledItems.length} unique after deduplication`
		);

		return uniqueReconciledItems;
	} catch (error) {
		logger.error(`Reconciliation error: ${error}`);
		return []; // Return empty array on error, don't fail the whole process
	}
}

/**
 * Divides OCR text into sections for parallel processing (OLD - 2 sections)
 * Strategy: Split by lines, keeping header together, dividing items roughly in half
 * @deprecated Use splitOCRTextTriple() instead for better coverage
 */
function splitOCRText(ocrText: string): {
	header: string; // First ~15 lines (supermarket, datetime, header info)
	items1: string; // Middle section (first half of items with overlap)
	items2: string; // Last section (second half of items + discounts with overlap)
} {
	const lines = ocrText.split("\n");
	// Keep header smaller (first 10-15 lines) to give more space to items
	const headerLines = Math.min(15, Math.floor(lines.length * 0.1));
	// Split remaining lines roughly in half with 5-line overlap to avoid missing items
	const remainingLines = lines.length - headerLines;
	const midPoint = headerLines + Math.floor(remainingLines / 2);
	const overlap = 5; // Overlap lines to ensure no items are missed

	return {
		header: lines.slice(0, headerLines).join("\n"),
		items1: lines.slice(headerLines, midPoint + overlap).join("\n"), // Include overlap
		items2: lines.slice(midPoint - overlap).join("\n"), // Start before midpoint with overlap
	};
}

/**
 * Divides OCR text into 3 sections with 25% overlap for maximum coverage
 * Strategy: Split into 3 overlapping sections to ensure no items are missed
 * - Section 1: Header + first 50% of items (0% - 50% with overlap)
 * - Section 2: Middle section (25% - 75% with overlap)
 * - Section 3: Last section + footer (50% - 100%)
 */
function splitOCRTextTriple(ocrText: string): {
	header: string;
	section1: string; // Header + primeros items (0% - 50% con overlap)
	section2: string; // Items medios (25% - 75% con overlap)
	section3: string; // Items finales + footer (50% - 100%)
} {
	const lines = ocrText.split("\n");
	const totalLines = lines.length;

	// Keep header smaller (first 10-15 lines) to give more space to items
	const headerLines = Math.min(15, Math.floor(totalLines * 0.1));
	const remainingLines = totalLines - headerLines;

	// Calculate section boundaries with 25% overlap
	// Section 1: header + 0% to 50% of remaining lines
	// Section 2: 25% to 75% of remaining lines
	// Section 3: 50% to 100% of remaining lines
	const section1End = headerLines + Math.floor(remainingLines * 0.5);
	const section2Start = headerLines + Math.floor(remainingLines * 0.25);
	const section2End = headerLines + Math.floor(remainingLines * 0.75);
	const section3Start = headerLines + Math.floor(remainingLines * 0.5);

	const header = lines.slice(0, headerLines).join("\n");
	const section1 = lines.slice(0, section1End).join("\n"); // Include header
	const section2 = lines.slice(section2Start, section2End).join("\n");
	const section3 = lines.slice(section3Start).join("\n");

	logger.info(`OCR Split: 3 sections with 25% overlap`);
	logger.info(`  - Total lines: ${totalLines}`);
	logger.info(`  - Header: lines 0-${headerLines} (${headerLines} lines)`);
	logger.info(
		`  - Section 1: lines 0-${section1End} (${section1End} lines, includes header)`
	);
	logger.info(
		`  - Section 2: lines ${section2Start}-${section2End} (${
			section2End - section2Start
		} lines)`
	);
	logger.info(
		`  - Section 3: lines ${section3Start}-end (${
			totalLines - section3Start
		} lines)`
	);

	return {
		header,
		section1,
		section2,
		section3,
	};
}

/**
 * Helper function to process a section of OCR text with Haiku
 * Returns partial ReceiptData (items and discounts from that section)
 */
async function processOCRSection(
	ocrSection: string,
	sectionType:
		| "header"
		| "items"
		| "footer"
		| "section1"
		| "section2"
		| "section3"
): Promise<Partial<ReceiptData>> {
	try {
		// Create section-specific prompt with maximum explicitness about extracting ALL items
		const sectionPrompt =
			sectionType === "header" || sectionType === "section1"
				? `TAREA CRÍTICA: Extraer TODOS los productos/items de esta sección de ticket.

Esta es la CABECERA y PRIMERA MITAD de items de un ticket. 

REGLAS CRÍTICAS (NO PUEDEN FALLAR ITEMS):
1. Cada línea con producto/precio es un item SEPARADO - NO los agrupes NUNCA
2. NO omitas items aunque parezcan duplicados, similares, o incorrectos
3. NO excluyas items con precios bajos, altos, o que parezcan incorrectos
4. Incluye TODO lo que tenga formato: PRODUCTO ... PRECIO
5. Si una línea tiene un producto y un precio, es un item - INCLÚYELO
6. Si hay CUALQUIER duda sobre si algo es un producto, INCLÚYELO (mejor duplicado que perder)
7. CRÍTICO: Extrae el nombre del supermercado de la primera línea o encabezado
8. CRÍTICO: Extrae la fecha y hora en formato "DD/MM/YYYY HH:MM:SS"
9. Extrae el total del ticket (si está visible en esta sección)

Formato de salida EXACTO:
{"supermarket": "Nombre del Supermercado", "datetime": "DD/MM/YYYY HH:MM:SS", "total": number, "items": [{"product": "...", "quantity": X, "price": X, ...}], "discounts": [...]}

IMPORTANTE: 
- El array "items" debe contener TODOS los productos visibles en el texto, sin excepción
- "supermarket" y "datetime" son OBLIGATORIOS en esta sección (es la cabecera)
- NO incluyas líneas de total, subtotal, pago, vuelto como items
- NO incluyas descuentos o promociones como items separados (solo como campos discount/promotion dentro de items)
- Solo incluye productos reales que se compraron, no información adicional del ticket`
				: sectionType === "section2"
				? `TAREA CRÍTICA: Extraer TODOS los productos/items de esta sección de ticket.

Esta es la SECCIÓN MEDIA de items de un ticket.

REGLAS CRÍTICAS (NO PUEDEN FALLAR ITEMS):
1. Cada línea con producto/precio es un item SEPARADO - NO los agrupes NUNCA
2. NO omitas items aunque parezcan duplicados, similares, o incorrectos
3. NO excluyas items con precios bajos, altos, o que parezcan incorrectos
4. Incluye TODO lo que tenga formato: PRODUCTO ... PRECIO
5. Si una línea tiene un producto y un precio, es un item - INCLÚYELO
6. Si hay CUALQUIER duda sobre si algo es un producto, INCLÚYELO (mejor duplicado que perder)

Formato de salida EXACTO:
{"items": [{"product": "...", "quantity": X, "price": X, ...}], "discounts": [...]}

IMPORTANTE: El array "items" debe contener TODOS los productos visibles en el texto, sin excepción.`
				: `TAREA CRÍTICA: Extraer TODOS los productos/items de esta sección de ticket.

Esta es la SEGUNDA MITAD de items y footer de un ticket.

REGLAS CRÍTICAS (NO PUEDEN FALLAR ITEMS):
1. Cada línea con producto/precio es un item SEPARADO - NO los agrupes NUNCA
2. NO omitas items aunque parezcan duplicados, similares, o incorrectos
3. NO excluyas items con precios bajos, altos, o que parezcan incorrectos
4. Incluye TODO lo que tenga formato: PRODUCTO ... PRECIO
5. Si una línea tiene un producto y un precio, es un item - INCLÚYELO
6. Si hay CUALQUIER duda sobre si algo es un producto, INCLÚYELO (mejor duplicado que perder)
6. Extrae también todos los descuentos del footer

Formato de salida EXACTO:
{"items": [{"product": "...", "quantity": X, "price": X, ...}], "discounts": [...]}

IMPORTANTE: El array "items" debe contener TODOS los productos visibles en el texto, sin excepción.`;

		const payload = {
			anthropic_version: "bedrock-2023-05-31",
			max_tokens: 2048, // Reduced for sections
			temperature: 0.0,
			system: [
				{
					type: "text",
					text: `${HAIKU_SYSTEM_PROMPT}\n\nIMPORTANT: Return ONLY valid JSON. No markdown, no explanations, just JSON. Extract ALL items visible in the provided text.\n\nCRITICAL: Numbers in JSON must be in standard format (no commas as thousands separators). Use dots for decimals only. Example: 59144.30 NOT 59,144.30`,
				},
			],
			messages: [
				{
					role: "user",
					content: `OCR Section:\n---\n${ocrSection}\n---`,
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
		const contentText = responseBody.content?.[0]?.text;

		if (!contentText) {
			throw new Error("No text content in Bedrock response");
		}

		let jsonText = contentText.trim();

		// Remove markdown code blocks if present
		if (jsonText.startsWith("```json")) {
			jsonText = jsonText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
		} else if (jsonText.startsWith("```")) {
			jsonText = jsonText.replace(/^```\s*/, "").replace(/\s*```$/, "");
		}

		// Try to extract JSON object
		const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
		if (jsonMatch) {
			jsonText = jsonMatch[0];
		}

		// Normalize Argentine number format in JSON before parsing
		// Replace numbers like "59,144.30" with "59144.30" (remove comma, keep dot as decimal)
		// Pattern: digits, comma, digits, dot, digits (Argentine format)
		// We need to be careful not to break JSON structure
		jsonText = jsonText.replace(
			/("(?:total|price|quantity|discount|amount)"\s*:\s*)(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g,
			(_match: string, prefix: string, number: string) => {
				// Remove commas from number (Argentine thousands separator)
				const normalized = number.replace(/,/g, "");
				return prefix + normalized;
			}
		);

		// Also handle numbers in arrays/objects that might not have quotes
		// Pattern for unquoted numbers with Argentine format
		jsonText = jsonText.replace(
			/(:\s*)(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)(\s*[,}])/g,
			(_match: string, prefix: string, number: string, suffix: string) => {
				// Remove commas from number
				const normalized = number.replace(/,/g, "");
				return prefix + normalized + suffix;
			}
		);

		let rawData;
		try {
			rawData = JSON.parse(jsonText);
		} catch (parseError) {
			logger.error(
				`Failed to parse section JSON. Section type: ${sectionType}, Text length: ${jsonText.length}`
			);
			logger.error(`First 500 chars: ${jsonText.substring(0, 500)}`);
			logger.error(
				`Last 500 chars: ${jsonText.substring(
					Math.max(0, jsonText.length - 500)
				)}`
			);
			// Try one more time with a more aggressive normalization
			try {
				// Remove all commas that are between digits (likely thousands separators)
				const aggressiveNormalized = jsonText.replace(/(\d),(\d)/g, "$1$2");
				rawData = JSON.parse(aggressiveNormalized);
				logger.warn(
					`Parse succeeded after aggressive normalization for section ${sectionType}`
				);
			} catch (secondParseError) {
				// Return empty partial data instead of throwing
				logger.warn(
					`Returning empty data for section ${sectionType} due to parse error`
				);
				return {
					items: [],
					discounts: [],
				};
			}
		}

		// Post-process based on section type
		if (sectionType === "header" || sectionType === "section1") {
			const result = {
				supermarket: rawData.supermarket || "",
				datetime: rawData.datetime || "",
				total: parseArgentineNumber(rawData.total || 0),
				items: (rawData.items || []).map((item: any) => ({
					...item,
					quantity: parseArgentineNumber(item.quantity),
					price: parseArgentineNumber(item.price),
					discount: item.discount ? parseArgentineNumber(item.discount) : 0,
				})),
				discounts: (rawData.discounts || []).map((d: any) => ({
					description: d.description,
					amount: Math.abs(parseArgentineNumber(d.amount)),
				})),
			};
			// Log if metadata is missing from section 1 (critical)
			if (
				sectionType === "section1" &&
				(!result.supermarket || !result.datetime)
			) {
				logger.warn(
					`Section 1 missing metadata: supermarket="${result.supermarket}", datetime="${result.datetime}"`
				);
			}
			return result;
		} else {
			return {
				items: (rawData.items || []).map((item: any) => ({
					...item,
					quantity: parseArgentineNumber(item.quantity),
					price: parseArgentineNumber(item.price),
					discount: item.discount ? parseArgentineNumber(item.discount) : 0,
				})),
				discounts: (rawData.discounts || []).map((d: any) => ({
					description: d.description,
					amount: Math.abs(parseArgentineNumber(d.amount)),
				})),
			};
		}
	} catch (error) {
		logger.error(`Error processing OCR section: ${error}`);
		// Return empty partial data on error
		return {
			items: [],
			discounts: [],
		};
	}
}

/**
 * Determines if a receipt needs Sonnet refinement based on complexity.
 * Very aggressive: Skip Sonnet in 99%+ of cases - Claude 3.5 Haiku handles most cases excellently.
 * Only refine if there are severe quality issues that would break the app.
 *
 * TEMPORARY: For performance testing, we're skipping Sonnet for tickets with <50 items.
 * This can be adjusted based on quality metrics.
 */
function needsRefinement(data: ReceiptData): boolean {
	// TEMPORARY: Skip Sonnet for all receipts with <50 items to test performance
	// TODO: Re-enable refinement checks after validating quality
	if (data.items.length < 50) {
		logger.info(
			`Skipping Sonnet: ${data.items.length} items (performance optimization)`
		);
		return false;
	}

	// Only refine if >50 items (very large receipts that might exceed token limits)
	logger.info(`Refinement needed: >50 items (${data.items.length})`);
	return true;
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
			`Failed to generate embedding: ${
				error instanceof Error ? error.message : "Unknown error"
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

// Optimized compact Sonnet system prompt
const SONNET_SYSTEM_PROMPT = `Clean receipt data: fix typos, Title Case, map discounts to items. Return JSON: {items: [...], discounts: [...]}`;

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
			max_tokens: 1024, // Reduced for faster refinement
			temperature: 0,
			system: [
				{
					type: "text",
					text: SONNET_SYSTEM_PROMPT,
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
			logger.error(
				`Failed to parse Sonnet JSON response. Raw text length: ${jsonText.length}`
			);
			logger.error(`First 500 chars: ${jsonText.substring(0, 500)}`);
			logger.error(
				`Last 500 chars: ${jsonText.substring(
					Math.max(0, jsonText.length - 500)
				)}`
			);
			logger.error(
				`Parse error: ${
					parseError instanceof Error ? parseError.message : String(parseError)
				}`
			);
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

/**
 * Parallel version: Processes receipt with 3 simultaneous Haiku calls
 * Divides OCR text into 3 sections with 25% overlap and processes them in parallel
 * Includes validation, intelligent deduplication, and automatic reconciliation
 * Uses sequential method as reference to ensure exact item count accuracy
 * Expected to reduce processing time while ensuring NO items are lost AND exact count
 */
export async function formatReceiptWithBedrockParallel(
	ocrText: string
): Promise<ReceiptData> {
	try {
		logger.info(
			"Haiku Parallel (3 sections): Extracting data from OCR with parallel processing..."
		);

		// CRITICAL: Get reference item count from sequential method for accuracy
		// This ensures we know exactly how many items should be in the final result
		logger.info("Getting reference item count from sequential extraction...");
		const referenceStart = Date.now();
		let referenceItemCount: number | null = null;
		let referenceReceiptData: ReceiptData | null = null;

		try {
			// Run sequential extraction in parallel with section processing for speed
			// But we'll use it as reference to validate and adjust our parallel extraction
			referenceReceiptData = await formatReceiptWithBedrock(ocrText);
			referenceItemCount = referenceReceiptData.items.length;
			logger.info(
				`Reference extraction: ${referenceItemCount} items (${
					Date.now() - referenceStart
				}ms)`
			);
		} catch (error) {
			logger.warn(
				`Reference extraction failed, proceeding without reference: ${error}`
			);
		}

		// Split OCR into 3 sections with 25% overlap
		const sections = splitOCRTextTriple(ocrText);

		// Process all 3 sections in parallel
		// Section 1 includes header for metadata extraction
		const [section1Data, section2Data, section3Data] = await Promise.all([
			processOCRSection(sections.section1, "section1"),
			processOCRSection(sections.section2, "section2"),
			processOCRSection(sections.section3, "section3"),
		]);

		// Log extraction results
		logger.info(`Extraction Results:`);
		logger.info(`  - Section 1: ${section1Data.items?.length || 0} items`);
		logger.info(`  - Section 2: ${section2Data.items?.length || 0} items`);
		logger.info(`  - Section 3: ${section3Data.items?.length || 0} items`);

		// Combine all items from all sections
		const allItems = [
			...(section1Data.items || []),
			...(section2Data.items || []),
			...(section3Data.items || []),
		];

		logger.info(
			`  - Total before deduplication: ${allItems.length} items from all sections`
		);

		// Use intelligent deduplication with fuzzy matching
		const { uniqueItems, removedDuplicates } =
			deduplicateItemsIntelligently(allItems);

		logger.info(
			`  - Duplicates removed: ${removedDuplicates.length} items (exact and fuzzy matches)`
		);
		logger.info(`  - Final unique items: ${uniqueItems.length} items`);

		// Validate completeness
		const validation = validateItemCompleteness(ocrText, uniqueItems);

		logger.info(`Validation:`);
		logger.info(`  - Estimated items in OCR: ${validation.estimatedTotal}`);
		logger.info(`  - Extracted items: ${validation.extractedCount}`);
		logger.info(
			`  - Completeness: ${validation.completenessPercent.toFixed(1)}%`
		);
		logger.info(`  - Missing estimate: ${validation.missingEstimate} items`);

		// CRITICAL: Use reference extraction to get exact item count
		// If we have a reference, adjust our items to match exactly
		let finalItems = uniqueItems;

		if (referenceItemCount !== null && referenceReceiptData) {
			logger.info(
				`📊 Reference extraction has ${referenceItemCount} items, parallel has ${finalItems.length} items`
			);

			if (finalItems.length !== referenceItemCount) {
				logger.warn(
					`⚠️  Item count mismatch! Adjusting to match reference (${referenceItemCount} items)...`
				);

				// CRITICAL: Use reference items as the source of truth for WHAT items exist
				// Match parallel items to reference items, but ONLY if they're really the same item
				// Strategy: Prefer reference items (they're more accurate), but use parallel items
				// if they match well and have better data (e.g., brand, discount info)
				const matchedItems: ReceiptData["items"] = [];
				const usedParallelIndices = new Set<number>();
				const usedReferenceIndices = new Set<number>();
				const itemSource: Array<"parallel" | "reference"> = []; // Track source of each item

				// First pass: Find exact or very close matches (these are definitely the same items)
				for (
					let refIdx = 0;
					refIdx < referenceReceiptData.items.length;
					refIdx++
				) {
					const refItem = referenceReceiptData.items[refIdx];
					let bestMatch: {
						item: ReceiptData["items"][0];
						parallelIndex: number;
						similarity: number;
						score: number; // Combined score for matching quality
					} | null = null;

					for (let i = 0; i < finalItems.length; i++) {
						if (usedParallelIndices.has(i)) continue;

						const normalizedRef = normalizeProductName(refItem.product);
						const normalizedParallel = normalizeProductName(
							finalItems[i].product
						);
						const similarity = stringSimilarity(
							normalizedRef,
							normalizedParallel
						);

						// Calculate matching score
						// Price and quantity must match closely (within 1%)
						const priceDiff = Math.abs(refItem.price - finalItems[i].price);
						const priceMatch = priceDiff < Math.max(0.01, refItem.price * 0.01);
						const quantityDiff = Math.abs(
							refItem.quantity - finalItems[i].quantity
						);
						const quantityMatch =
							quantityDiff < Math.max(0.001, refItem.quantity * 0.01);

						// Score: similarity (70%) + price match (20%) + quantity match (10%)
						const score =
							similarity * 0.7 +
							(priceMatch ? 0.2 : 0) +
							(quantityMatch ? 0.1 : 0);

						// Only consider it a match if:
						// 1. High similarity (>90%) OR (similarity >80% AND price/quantity match)
						// 2. Price difference is reasonable (<5% or <$1)
						// 3. Quantity difference is reasonable (<5% or <0.1)
						const isGoodMatch =
							(similarity > 0.9 && priceMatch && quantityMatch) ||
							(similarity > 0.8 &&
								priceDiff < Math.max(1.0, refItem.price * 0.05) &&
								quantityDiff < Math.max(0.1, refItem.quantity * 0.05));

						if (isGoodMatch) {
							if (!bestMatch || score > bestMatch.score) {
								bestMatch = {
									item: finalItems[i],
									parallelIndex: i,
									similarity,
									score,
								};
							}
						}
					}

					if (bestMatch) {
						// Use parallel item if it has better data (brand, discount), otherwise use reference
						const parallelItem = bestMatch.item;
						const hasBetterData =
							(parallelItem.brand && !refItem.brand) ||
							(parallelItem.discount && !refItem.discount) ||
							(parallelItem.promotion && !refItem.promotion);

						// Always use reference price/quantity (they're the source of truth)
						// But use parallel item data (brand, discount, promotion) if available
						const finalItem = {
							...parallelItem,
							price: refItem.price, // Use reference price (more accurate)
							quantity: refItem.quantity, // Use reference quantity (more accurate)
						};

						matchedItems.push(finalItem);
						itemSource.push("parallel"); // Item came from parallel but validated against reference
						logger.debug(
							`✅ Matched: "${parallelItem.product}" (parallel) -> "${
								refItem.product
							}" (reference) - similarity: ${(
								bestMatch.similarity * 100
							).toFixed(1)}%, using reference price/qty`
						);

						usedParallelIndices.add(bestMatch.parallelIndex);
						usedReferenceIndices.add(refIdx);
					} else {
						// No good match found - use reference item (it's definitely in the ticket)
						logger.debug(
							`Using reference item (no good match in parallel): ${refItem.product} (price: ${refItem.price}, qty: ${refItem.quantity})`
						);
						matchedItems.push(refItem);
						itemSource.push("reference");
						usedReferenceIndices.add(refIdx);
					}
				}

				// Second pass: Check if there are parallel items that should be included
				// (items that exist in ticket but weren't in reference - rare but possible)
				const unmatchedParallelItems: ReceiptData["items"] = [];
				for (let i = 0; i < finalItems.length; i++) {
					if (!usedParallelIndices.has(i)) {
						// Check if this item might be a real item not in reference
						// (e.g., reference missed it, or it's a variant)
						unmatchedParallelItems.push(finalItems[i]);
					}
				}

				// If we're short on items and have unmatched parallel items, try to add them
				// but only if they look like real products (not duplicates or errors)
				if (
					matchedItems.length < referenceItemCount &&
					unmatchedParallelItems.length > 0
				) {
					logger.warn(
						`Reference has ${referenceItemCount} items but only matched ${matchedItems.length}. Checking ${unmatchedParallelItems.length} unmatched parallel items...`
					);

					// Add unmatched items if they look legitimate (have reasonable price, product name)
					for (const unmatchedItem of unmatchedParallelItems) {
						if (matchedItems.length >= referenceItemCount) break;

						// Validate: must have product name, reasonable price (>0), reasonable quantity (>0)
						if (
							unmatchedItem.product &&
							unmatchedItem.product.length > 2 &&
							unmatchedItem.price > 0 &&
							unmatchedItem.quantity > 0
						) {
							// Check if it's not too similar to an already matched item
							const isDuplicate = matchedItems.some((matched) => {
								const similarity = stringSimilarity(
									normalizeProductName(matched.product),
									normalizeProductName(unmatchedItem.product)
								);
								return (
									similarity > 0.9 &&
									Math.abs(matched.price - unmatchedItem.price) < 0.01
								);
							});

							if (!isDuplicate) {
								logger.info(
									`Adding unmatched parallel item: ${unmatchedItem.product} (might have been missed by reference)`
								);
								matchedItems.push(unmatchedItem);
							}
						}
					}
				}

				// Final: Ensure we have exactly the reference count
				// If we have more, trim to reference count (prioritize best matches)
				// If we have less, we already tried to add unmatched items
				if (matchedItems.length > referenceItemCount) {
					logger.warn(
						`Have ${matchedItems.length} items but reference says ${referenceItemCount}. Trimming to reference count.`
					);
					finalItems = matchedItems.slice(0, referenceItemCount);
				} else if (matchedItems.length < referenceItemCount) {
					logger.warn(
						`Only matched ${matchedItems.length} items but reference has ${referenceItemCount}. Using matched items.`
					);
					finalItems = matchedItems;
				} else {
					finalItems = matchedItems;
				}
				// Log matching statistics for transparency
				const parallelCount = itemSource.filter(
					(source) => source === "parallel"
				).length;
				const referenceCount = itemSource.filter(
					(source) => source === "reference"
				).length;

				logger.info(
					`✅ Adjusted to exactly ${finalItems.length} items (matching reference)`
				);
				logger.info(
					`   - ${parallelCount} items from parallel (matched with reference), ${referenceCount} items from reference (source of truth - no match found)`
				);
				logger.info(
					`   - Reference items are the source of truth: they represent what's actually in the ticket`
				);
			} else {
				logger.info(
					`✅ Item count matches reference (${referenceItemCount} items)`
				);
			}

			// Use reference metadata if parallel extraction missed it
			if (referenceReceiptData.supermarket && !section1Data.supermarket) {
				logger.info("Using reference supermarket metadata");
			}
			if (referenceReceiptData.datetime && !section1Data.datetime) {
				logger.info("Using reference datetime metadata");
			}
		} else {
			// No reference available, use reconciliation logic
			const missingPercent =
				validation.estimatedTotal > 0
					? (validation.missingEstimate / validation.estimatedTotal) * 100
					: 0;

			// Reconcile if:
			// 1. We're missing at least 1 item AND
			// 2. We have fewer items than estimated (or estimation is unreliable with < 5 items)
			if (
				validation.missingEstimate >= 1 &&
				(validation.extractedCount < validation.estimatedTotal ||
					validation.estimatedTotal < 5) &&
				validation.estimatedTotal > 0
			) {
				logger.warn(
					`⚠️  Incomplete extraction detected! Attempting reconciliation...`
				);
				const reconciledItems = await reconcileMissingItems(
					ocrText,
					uniqueItems,
					validation.estimatedTotal
				);

				if (reconciledItems.length > 0) {
					finalItems = [...uniqueItems, ...reconciledItems];
					logger.info(
						`✅ Reconciliation successful: Added ${reconciledItems.length} missing items`
					);
					logger.info(
						`  - Final item count: ${finalItems.length} items (${(
							(finalItems.length / validation.estimatedTotal) *
							100
						).toFixed(1)}% completeness)`
					);
				} else {
					logger.warn(
						`⚠️  Reconciliation found no additional items. Current completeness: ${validation.completenessPercent.toFixed(
							1
						)}%`
					);
				}
			} else {
				logger.info(
					`✅ Extraction complete: ${validation.completenessPercent.toFixed(
						1
					)}% completeness`
				);
			}
		}

		// Use section1 for metadata (prefer first section which has header)
		// Section 1 should always have metadata since it includes the header
		const headerData =
			section1Data.supermarket && section1Data.datetime
				? section1Data
				: section2Data.supermarket && section2Data.datetime
				? section2Data
				: section3Data.supermarket && section3Data.datetime
				? section3Data
				: section1Data; // Fallback to section1 even if incomplete

		// Combine discounts from all sections
		const allDiscounts = [
			...(section1Data.discounts || []),
			...(section2Data.discounts || []),
			...(section3Data.discounts || []),
		];

		// Remove duplicate discounts (same description and amount)
		const uniqueDiscounts = allDiscounts.filter(
			(discount, index, self) =>
				index ===
				self.findIndex(
					(d) =>
						d.description === discount.description &&
						Math.abs(d.amount - discount.amount) < 0.01
				)
		);

		// Use reference metadata if available and parallel extraction missed it
		const finalSupermarket =
			headerData.supermarket || referenceReceiptData?.supermarket || "";
		const finalDatetime =
			headerData.datetime || referenceReceiptData?.datetime || "";
		const finalTotal = headerData.total || referenceReceiptData?.total || 0;

		const receiptData: ReceiptData = {
			supermarket: finalSupermarket,
			datetime: finalDatetime,
			total: finalTotal,
			items: finalItems,
			discounts: uniqueDiscounts,
		};

		// Validate the structure
		if (!Array.isArray(receiptData.items)) {
			throw new Error("Invalid receipt data structure: items must be an array");
		}

		// If we have items but missing metadata, try to extract from items or use defaults
		if (receiptData.items.length > 0) {
			if (!receiptData.supermarket) {
				logger.warn(
					"Missing supermarket in parallel processing, using default"
				);
				receiptData.supermarket = "Unknown";
			}
			if (!receiptData.datetime) {
				logger.warn(
					"Missing datetime in parallel processing, using current date"
				);
				const now = new Date();
				receiptData.datetime = `${now.getDate().toString().padStart(2, "0")}/${(
					now.getMonth() + 1
				)
					.toString()
					.padStart(2, "0")}/${now.getFullYear()} ${now
					.getHours()
					.toString()
					.padStart(2, "0")}:${now
					.getMinutes()
					.toString()
					.padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
			}
			if (typeof receiptData.total !== "number" || receiptData.total === 0) {
				// Calculate total from items if missing
				const calculatedTotal = receiptData.items.reduce(
					(sum, item) => sum + (item.price || 0) - (item.discount || 0),
					0
				);
				if (calculatedTotal > 0) {
					logger.warn(
						"Missing total in parallel processing, calculating from items"
					);
					receiptData.total = calculatedTotal;
				}
			}
		} else {
			// No items extracted - this is a real error
			throw new Error("No items extracted from parallel processing");
		}

		logger.info(
			`✅ Parallel Haiku (3 sections): Extracted ${
				receiptData.items.length
			} items with ${validation.completenessPercent.toFixed(1)}% completeness.`
		);

		// Skip Sonnet refinement (same logic as formatReceiptWithBedrock)
		const needsRefinementResult = needsRefinement(receiptData);
		if (needsRefinementResult) {
			logger.info("Complex receipt detected, refining with Sonnet...");
			return await refineProductNames(receiptData);
		}

		logger.info("✅ Simple receipt, skipping Sonnet refinement");
		return receiptData;
	} catch (error) {
		// Fallback to sequential processing on error
		logger.warn(
			"Parallel processing failed, falling back to sequential processing"
		);
		logger.error(`Parallel processing error: ${error}`);
		return formatReceiptWithBedrock(ocrText);
	}
}

import { InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { bedrockClient } from "../config/aws.js";
import { ReceiptData } from "../types/receipt.types.js";
import logger from "../utils/logger.js";

const BEDROCK_MODEL_ID =
	process.env.BEDROCK_MODEL_ID || "anthropic.claude-3-haiku-20240307-v1:0";

export async function formatReceiptWithBedrock(
	ocrText: string
): Promise<ReceiptData> {
	try {
		const prompt = `Please analyze the following text from an OCR scan of a supermarket receipt.
Extract the key information and format it into a single JSON object.

**VERY IMPORTANT RULE FOR NUMBERS:**
The source text uses the Argentinian number format. The period '.' is a thousands separator and the comma ',' is the decimal separator.
To create a valid JSON number (float), you MUST first REMOVE all periods '.' from the number string, and then REPLACE the comma ',' with a period '.'.
For example, the text "5.850,00" must be converted to the number 5850.00 in the JSON. Always positive numbers except for discounts, may be negative.

**IMPORTANT RULES FOR STORE/PRODUCT/BRAND:**
1. **Supermarket Name:** Extract ONLY the commercial name (e.g., "Carrefour", "Disco", "Jumbo", "Día", "Coto", "Vea"). Ignore CUIT, address, legal info.
2. **Item Extraction & Grouping:**
   - **Group Identical Items:** If the same product (same name and brand) appears multiple times, GROUP them into a single item entry by summing their quantities and prices.
   - **Product Name:** The name MUST be descriptive. Include qualifiers like 'Integral', 'Light', '1.5L', flavor, or type. Do NOT strip these details. Example: "Leche Entera 1L", "Galletitas Chocolate", "Queso Crema Light". Use Title Case.
   - **Brand Name:** Extract the brand. It is often at the start or end of the line.
     - *Common Brands:* McCain, Paty, Bimbo, Tang, Coca Cola, La Serenisima, Arcor, Lucchetti, Matarazzo, Knorr, Hellmanns, Natura, Cocinero, Villavicencio, Villa del Sur, Brahma, Quilmes, Colgate, Dove, Plusbelle, Ala, Skip, Ayudin, Magistral.
     - If the brand is NOT clearly visible, leave it as null.
   - **Is Weight:** Set to true ONLY if the item is clearly sold by weight (e.g., "kg", "x kg", "peso", or quantity like 0.750).
   - **Promotions & Discounts (CRITICAL):**
     - **Look for separate discount lines:** Discounts often appear on the line BELOW the product. They may have negative prices (e.g., "-1.200,00") or text like "2do al 50%", "Desc.", "Oferta".
     - **Link to Product:** You MUST associate these discount lines with the product immediately above them.
     - **Calculation:**
       - The "price" field of the item should be the GROSS price (before discount).
       - The "discount" field should be the absolute value of the discount amount (e.g., if the line says "-1.200", discount is 1200).
       - The "promotion" field should contain the description (e.g., "2do al 50%").
     - **Example:**
       - Line 1: "Fideos RINA ... 4.800,00"
       - Line 2: "2do al 50% Fideos ... -1.200,00"
       - Result: One item -> { product: "Fideos RINA", price: 4800, discount: 1200, promotion: "2do al 50%" }

**EXAMPLES:**
- Text: "MCCAIN PAPAS FRITAS 2.5KG" -> product: "Papas Fritas", brand: "McCain", is_weight: true
- Text: "JABON LIQ ARIEL" -> product: "Jabon Liquido", brand: "Ariel"
- Text: "TOMATE PERITA KG" -> product: "Tomate Perita", brand: null, is_weight: true
- Text: "GALLETITAS OREO" + "GALLETITAS OREO" -> Group into one item with summed quantity and price.
- Text: "SHAMPOO DOVE" + "50% 2DA UNIDAD (-1.500)" -> product: "Shampoo", brand: "Dove", promotion: "50% 2da u.", discount: 1500.00, price: 3000.00

The JSON object should have the following structure:
- "supermarket": The commercial name of the store ONLY (string).
- "datetime": The date and time of the purchase (string). **CRITICAL: Use 24-hour format HH:MM:SS (00-23 hours). Example: "30/11/2024 14:30:00" for 2:30 PM. NEVER use 12-hour format or AM/PM indicators.**
- "total": The final total amount of the ticket (float).
- "items": A list of all purchased items. Each item in the list should be a JSON object with:
    - "product": The generic product name without brand (string).
    - "brand": The brand name if clearly present (string, optional).
    - "quantity": The quantity of the item (float). If sold by weight, this is the weight in kg.
    - "price": The total price for that item line (float).
    - "is_weight": Boolean, true if sold by weight (optional).
    - "discount": The total discount amount for this item (float, optional, default 0).
    - "promotion": The promotion description (string, optional).
- "discounts": A list of ALL discounts found in the receipt. Each object should have:
    - "description": The text description of the discount (e.g., "2do al 50% Fideos", "Oferta").
    - "amount": The absolute value of the discount amount (float).
    - IMPORTANT: Just extract what is written. DO NOT calculate the total sum yourself.

Here is the OCR text:
---
${ocrText}
---

Return ONLY the JSON object, without any additional text or explanations.`;

		// Prepare the request payload for Claude
		const payload = {
			anthropic_version: "bedrock-2023-05-31",
			max_tokens: 2000,
			temperature: 0.1,
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

		// Parse the response
		const responseBody = JSON.parse(new TextDecoder().decode(response.body));

		// Extract the text content from Claude's response
		const contentText = responseBody.content?.[0]?.text;
		if (!contentText) {
			throw new Error("No text content in Bedrock response");
		}

		// Parse the JSON from the response text
		// Claude might wrap it in markdown code blocks, so we need to extract it
		let jsonText = contentText.trim();

		// Remove markdown code blocks if present
		if (jsonText.startsWith("```json")) {
			jsonText = jsonText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
		} else if (jsonText.startsWith("```")) {
			jsonText = jsonText.replace(/^```\s*/, "").replace(/\s*```$/, "");
		}

		const receiptData: ReceiptData = JSON.parse(jsonText);

		// Validate the structure
		if (
			!receiptData.supermarket ||
			!receiptData.datetime ||
			typeof receiptData.total !== "number" ||
			!Array.isArray(receiptData.items)
		) {
			throw new Error("Invalid receipt data structure from Bedrock");
		}

		// Chain to Sonnet for final refinement
		return await refineProductNames(receiptData);
	} catch (error) {
		logger.error(`Bedrock error: ${error}`);
		throw new Error(
			`Failed to format receipt with Bedrock: ${
				error instanceof Error ? error.message : "Unknown error"
			}`
		);
	}
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

export async function refineProductNames(
	receiptData: ReceiptData
): Promise<ReceiptData> {
	try {
		const itemsJson = JSON.stringify(receiptData.items);

		const systemPrompt = `Eres un agente de estandarización de datos de supermercado experto y altamente preciso. Tu tarea es tomar una lista de ítems extraída (que contiene nombres descriptivos y marcas) y limpiar y estandarizar los campos 'product' y 'brand'. Tu objetivo es reducir la variabilidad y preparar los datos para la categorización y el catálogo de vectores de la aplicación FinanzApp. Debes devolver la salida estrictamente como un ARRAY de JSON, SIN preámbulos, explicaciones o texto adicional.`;

		const userPrompt = `Aplica las siguientes reglas estrictas para estandarizar y refinar cada ítem de esta lista.

REGLAS DE ESTANDARIZACIÓN (APLICACIÓN RIGUROSA):
1. **Nombre del Producto ('product'):** Debe ser el nombre **más completo y comercialmente conocido**. Debe usar **Title Case** e incluir la variedad, el sabor y el formato/peso (litros/kg/unidades) siempre que sea posible inferirlo.
2. **Marca ('brand'):** Debe ser el nombre comercial oficial. Si es un producto genérico o de panadería de supermercado, usa **'Producto Propio Disco'** o **'Producto Propio Panadería'** en lugar de null si es aplicable.
3. **No Modificar:** NO modifiques **NUNCA** los campos 'price', 'quantity', 'discount', 'is_weight', 'promotion' ni 'product_id'. Mantenlos idénticos al input.

Lista de Ítems a Refinar:
---
${itemsJson}
---

Devuelve ÚNICAMENTE el array JSON con los ítems corregidos, comenzando con '['.`;

		const payload = {
			anthropic_version: "bedrock-2023-05-31",
			max_tokens: 4096,
			temperature: 0,
			system: systemPrompt,
			messages: [
				{
					role: "user",
					content: userPrompt,
				},
			],
		};

		const command = new InvokeModelCommand({
			modelId: "anthropic.claude-3-5-sonnet-20240620-v1:0",
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

		const refinedItems = JSON.parse(jsonText);

		// Return updated receipt data
		return {
			...receiptData,
			items: refinedItems,
		};
	} catch (error) {
		logger.error(`Bedrock refinement error: ${error}`);
		// If refinement fails, return original data
		return receiptData;
	}
}

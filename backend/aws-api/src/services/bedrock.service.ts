import { InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { bedrockClient } from "../config/aws.js";
import { ReceiptData } from "../types/receipt.types.js";

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
   - **Product Name:** The generic name (e.g., "Papas Fritas", "Leche", "Galletitas"). MUST NOT include the brand. Use Title Case.
   - **Brand Name:** Extract the brand. It is often at the start or end of the line.
     - *Common Brands:* McCain, Paty, Bimbo, Tang, Coca Cola, La Serenisima, Arcor, Lucchetti, Matarazzo, Knorr, Hellmanns, Natura, Cocinero, Villavicencio, Villa del Sur, Brahma, Quilmes, Colgate, Dove, Plusbelle, Ala, Skip, Ayudin, Magistral.
     - If the brand is NOT clearly visible, leave it as null.
   - **Is Weight:** Set to true ONLY if the item is clearly sold by weight (e.g., "kg", "x kg", "peso", or quantity like 0.750).

**EXAMPLES:**
- Text: "MCCAIN PAPAS FRITAS 2.5KG" -> product: "Papas Fritas", brand: "McCain", is_weight: true
- Text: "JABON LIQ ARIEL" -> product: "Jabon Liquido", brand: "Ariel"
- Text: "TOMATE PERITA KG" -> product: "Tomate Perita", brand: null, is_weight: true
- Text: "GALLETITAS OREO" + "GALLETITAS OREO" -> Group into one item with summed quantity and price.

The JSON object should have the following structure:
- "supermarket": The commercial name of the store ONLY (string).
- "datetime": The date and time of the purchase (string). Format: DD/MM/YYYY HH:MM:SS.
- "total": The final total amount of the ticket (float).
- "items": A list of all purchased items. Each item in the list should be a JSON object with:
    - "product": The generic product name without brand (string).
    - "brand": The brand name if clearly present (string, optional).
    - "quantity": The quantity of the item (float). If sold by weight, this is the weight in kg.
    - "price": The total price for that item line (float).
    - "is_weight": Boolean, true if sold by weight (optional).

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

		return receiptData;
	} catch (error) {
		console.error("Bedrock error:", error);
		throw new Error(
			`Failed to format receipt with Bedrock: ${
				error instanceof Error ? error.message : "Unknown error"
			}`
		);
	}
}

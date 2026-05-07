import { InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { bedrockClient } from "../../config/aws.js";
import logger from "../../utils/logger.js";
import { retryBedrockCall } from "../../utils/retry.js";

const TITAN_EMBEDDING_MODEL_ID = "amazon.titan-embed-text-v1";

/**
 * Generate embedding vector for a text using AWS Titan Embeddings
 */
export async function generateEmbedding(text: string): Promise<number[]> {
	try {
		const command = new InvokeModelCommand({
			modelId: TITAN_EMBEDDING_MODEL_ID,
			contentType: "application/json",
			accept: "application/json",
			body: JSON.stringify({
				inputText: text,
			}),
		});

		const response = await retryBedrockCall(() => bedrockClient.send(command));

		if (!response.body) {
			throw new Error("No response body from Bedrock");
		}

		const responseBody = JSON.parse(new TextDecoder().decode(response.body));
		const embedding = responseBody.embedding;

		if (!Array.isArray(embedding) || embedding.length === 0) {
			throw new Error("Invalid embedding format from Bedrock");
		}

		return embedding;
	} catch (error) {
		logger.error(`Error generating embedding: ${error}`);
		throw new Error(
			`Failed to generate embedding: ${
				error instanceof Error ? error.message : "Unknown error"
			}`
		);
	}
}

/**
 * Suggest a category for a product using Claude
 */
export async function suggestCategory(productName: string): Promise<string> {
	try {
		const command = new InvokeModelCommand({
			modelId:
				process.env.BEDROCK_MODEL_ID ||
				"us.anthropic.claude-3-5-haiku-20241022-v1:0",
			contentType: "application/json",
			accept: "application/json",
			body: JSON.stringify({
				anthropic_version: "bedrock-2023-05-31",
				max_tokens: 50,
				temperature: 0.0,
				messages: [
					{
						role: "user",
						content: `Categoriza este producto en una sola palabra (español): "${productName}". Opciones: Almacén, Bebidas, Carnes, Frutas, Verduras, Lácteos, Panadería, Limpieza, Perfumería, Otros. Responde solo con la categoría.`,
					},
				],
			}),
		});

		const response = await retryBedrockCall(() => bedrockClient.send(command));

		if (!response.body) {
			throw new Error("No response body from Bedrock");
		}

		const responseBody = JSON.parse(new TextDecoder().decode(response.body));
		const category = responseBody.content?.[0]?.text?.trim() || "Otros";

		// Validate category
		const validCategories = [
			"Almacén",
			"Bebidas",
			"Carnes",
			"Frutas",
			"Verduras",
			"Lácteos",
			"Panadería",
			"Limpieza",
			"Perfumería",
			"Otros",
		];

		return validCategories.includes(category) ? category : "Otros";
	} catch (error) {
		logger.error(`Error suggesting category: ${error}`);
		return "Otros"; // Default category on error
	}
}

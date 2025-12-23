import { DetectDocumentTextCommand } from "@aws-sdk/client-textract";
import { textractClient } from "../config/aws.js";
import logger from "../utils/logger.js";
import sharp from "sharp";
import { retryTextractCall } from "../utils/retry.js";

/**
 * Optimized version of extractTextFromImage that reduces image size
 * before sending to Textract for faster processing
 */
export async function extractTextFromImageOptimized(
	imageBuffer: Buffer
): Promise<string> {
	try {
		const originalSizeMB = imageBuffer.length / (1024 * 1024);
		let optimizedBuffer = imageBuffer;

		// Optimize image if it's larger than 2MB
		if (originalSizeMB > 2) {
			logger.info(
				`Image too large (${originalSizeMB.toFixed(2)}MB), optimizing...`
			);

			const optimizationStart = Date.now();
			optimizedBuffer = await sharp(imageBuffer)
				.resize(2000, null, {
					withoutEnlargement: true,
					fit: "inside",
				})
				.jpeg({ quality: 85 })
				.toBuffer();

			const optimizedSizeMB = optimizedBuffer.length / (1024 * 1024);
			const optimizationTime = Date.now() - optimizationStart;

			logger.info(
				`Image optimized: ${originalSizeMB.toFixed(
					2
				)}MB → ${optimizedSizeMB.toFixed(2)}MB (${optimizationTime}ms)`
			);
		}

		const command = new DetectDocumentTextCommand({
			Document: {
				Bytes: optimizedBuffer,
			},
		});

		const response = await retryTextractCall(() =>
			textractClient.send(command)
		);

		if (!response.Blocks) {
			throw new Error("No text detected in image");
		}

		// Extract only LINE blocks to get the text content
		const textLines = response.Blocks.filter(
			(block) => block.BlockType === "LINE"
		)
			.map((block) => block.Text || "")
			.filter((text) => text.trim().length > 0);

		if (textLines.length === 0) {
			throw new Error("No text lines found in image");
		}

		// Join lines with newlines to preserve structure
		return textLines.join("\n");
	} catch (error) {
		logger.error(`Textract optimized error: ${error}`);
		throw new Error(
			`Failed to extract text from image: ${
				error instanceof Error ? error.message : "Unknown error"
			}`
		);
	}
}

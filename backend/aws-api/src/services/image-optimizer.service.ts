import sharp from "sharp";
import logger from "../utils/logger.js";

interface OptimizationResult {
	buffer: Buffer;
	originalSize: number;
	optimizedSize: number;
	compressionRatio: number;
	width: number;
	height: number;
}

interface OptimizationOptions {
	maxWidth?: number;
	maxHeight?: number;
	quality?: number;
	grayscale?: boolean;
}

/**
 * Image optimization service for OCR processing
 * Optimizes images before sending to AWS Textract to reduce costs and improve accuracy
 */
class ImageOptimizerService {
	private readonly DEFAULT_MAX_WIDTH = 2048;
	private readonly DEFAULT_MAX_HEIGHT = 2048;
	private readonly DEFAULT_QUALITY = 85;

	/**
	 * Optimize image for OCR processing
	 * - Resize to optimal dimensions
	 * - Convert to grayscale (better for OCR)
	 * - Normalize contrast
	 * - Compress to JPEG
	 */
	async optimizeForOCR(
		imageBuffer: Buffer,
		options: OptimizationOptions = {}
	): Promise<OptimizationResult> {
		const startTime = Date.now();
		const originalSize = imageBuffer.length;

		try {
			// Get image metadata
			const metadata = await sharp(imageBuffer).metadata();
			logger.info("Original image metadata", {
				format: metadata.format,
				width: metadata.width,
				height: metadata.height,
				size: originalSize,
			});

			// Build optimization pipeline
			let pipeline = sharp(imageBuffer);

			// Resize if needed
			const maxWidth = options.maxWidth || this.DEFAULT_MAX_WIDTH;
			const maxHeight = options.maxHeight || this.DEFAULT_MAX_HEIGHT;

			if (metadata.width! > maxWidth || metadata.height! > maxHeight) {
				pipeline = pipeline.resize(maxWidth, maxHeight, {
					fit: "inside",
					withoutEnlargement: true,
				});
			}

			// Convert to grayscale for better OCR (optional)
			if (options.grayscale !== false) {
				pipeline = pipeline.grayscale();
			}

			// Normalize contrast for better text detection
			pipeline = pipeline.normalize();

			// Sharpen to enhance text edges
			pipeline = pipeline.sharpen();

			// Convert to JPEG with specified quality
			const quality = options.quality || this.DEFAULT_QUALITY;
			pipeline = pipeline.jpeg({ quality, mozjpeg: true });

			// Execute pipeline
			const optimizedBuffer = await pipeline.toBuffer();
			const optimizedMetadata = await sharp(optimizedBuffer).metadata();

			const result: OptimizationResult = {
				buffer: optimizedBuffer,
				originalSize,
				optimizedSize: optimizedBuffer.length,
				compressionRatio:
					Math.round((originalSize / optimizedBuffer.length) * 100) / 100,
				width: optimizedMetadata.width!,
				height: optimizedMetadata.height!,
			};

			const processingTime = Date.now() - startTime;

			logger.info("Image optimized for OCR", {
				originalSize: `${Math.round(originalSize / 1024)}KB`,
				optimizedSize: `${Math.round(result.optimizedSize / 1024)}KB`,
				compressionRatio: result.compressionRatio,
				savedBytes: originalSize - result.optimizedSize,
				savedPercentage: `${Math.round(((originalSize - result.optimizedSize) / originalSize) * 100)}%`,
				dimensions: `${result.width}x${result.height}`,
				processingTime: `${processingTime}ms`,
			});

			return result;
		} catch (error) {
			logger.error("Error optimizing image", { error });
			throw new Error(
				`Failed to optimize image: ${error instanceof Error ? error.message : "Unknown error"}`
			);
		}
	}

	/**
	 * Preprocess image for better text detection
	 * More aggressive optimization for difficult receipts
	 */
	async preprocessForTextract(imageBuffer: Buffer): Promise<Buffer> {
		try {
			logger.info("Preprocessing image for Textract");

			const processed = await sharp(imageBuffer)
				.resize(2048, 2048, {
					fit: "inside",
					withoutEnlargement: true,
				})
				.grayscale()
				.normalize()
				.sharpen({ sigma: 1.5 })
				.threshold(128) // Binarization for better text detection
				.jpeg({ quality: 90 })
				.toBuffer();

			logger.info("Image preprocessed", {
				originalSize: imageBuffer.length,
				processedSize: processed.length,
			});

			return processed;
		} catch (error) {
			logger.error("Error preprocessing image", { error });
			throw new Error(
				`Failed to preprocess image: ${error instanceof Error ? error.message : "Unknown error"}`
			);
		}
	}

	/**
	 * Validate image format and size
	 */
	async validateImage(imageBuffer: Buffer): Promise<{
		valid: boolean;
		error?: string;
		metadata?: sharp.Metadata;
	}> {
		try {
			const metadata = await sharp(imageBuffer).metadata();

			// Check format
			const validFormats = ["jpeg", "jpg", "png", "webp"];
			if (!metadata.format || !validFormats.includes(metadata.format)) {
				return {
					valid: false,
					error: `Invalid image format: ${metadata.format}. Supported formats: ${validFormats.join(", ")}`,
				};
			}

			// Check dimensions
			if (!metadata.width || !metadata.height) {
				return {
					valid: false,
					error: "Could not determine image dimensions",
				};
			}

			// Check minimum size (too small = poor OCR)
			if (metadata.width < 200 || metadata.height < 200) {
				return {
					valid: false,
					error: "Image too small. Minimum size: 200x200 pixels",
				};
			}

			return {
				valid: true,
				metadata,
			};
		} catch (error) {
			return {
				valid: false,
				error: `Invalid image: ${error instanceof Error ? error.message : "Unknown error"}`,
			};
		}
	}

	/**
	 * Get image information without processing
	 */
	async getImageInfo(imageBuffer: Buffer): Promise<{
		format: string;
		width: number;
		height: number;
		size: number;
		sizeKB: number;
	}> {
		const metadata = await sharp(imageBuffer).metadata();

		return {
			format: metadata.format || "unknown",
			width: metadata.width || 0,
			height: metadata.height || 0,
			size: imageBuffer.length,
			sizeKB: Math.round(imageBuffer.length / 1024),
		};
	}
}

export const imageOptimizer = new ImageOptimizerService();

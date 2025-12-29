import { Request, Response, NextFunction } from "express";
import { z, ZodSchema } from "zod";
import { ValidationError } from "../utils/errors.js";
import logger from "../utils/logger.js";

/**
 * File upload validation schema
 */
const fileUploadSchema = z.object({
	mimetype: z
		.enum(["image/jpeg", "image/jpg", "image/png", "image/webp"])
		.describe("Only image files are allowed"),
	size: z
		.number()
		.max(10 * 1024 * 1024, "File size must be less than 10MB")
		.positive("File size must be positive"),
	originalname: z.string().min(1, "Filename is required"),
});

/**
 * Validate file upload
 */
export function validateFileUpload(
	req: Request,
	res: Response,
	next: NextFunction
): void {
	try {
		if (!req.file) {
			throw new ValidationError("No file uploaded");
		}

		// Validate file properties
		const validation = fileUploadSchema.safeParse(req.file);

		if (!validation.success) {
			const errors = validation.error.issues.map((issue) => ({
				field: issue.path.join("."),
				message: issue.message,
			}));

			logger.warn("File validation failed", {
				errors,
				file: {
					mimetype: req.file.mimetype,
					size: req.file.size,
					originalname: req.file.originalname,
				},
			});

			throw new ValidationError("Invalid file upload", errors);
		}

		logger.info("File validation passed", {
			mimetype: req.file.mimetype,
			size: req.file.size,
			sizeKB: Math.round(req.file.size / 1024),
			originalname: req.file.originalname,
		});

		next();
	} catch (error) {
		if (error instanceof ValidationError) {
			res.status(400).json({
				error: "Validation Error",
				message: error.message,
				details: error.details,
			});
		} else {
			res.status(400).json({
				error: "Invalid file upload",
				message: error instanceof Error ? error.message : "Unknown error",
			});
		}
	}
}

/**
 * Generic request body validation middleware factory
 */
export function validateBody<T>(schema: ZodSchema<T>) {
	return (req: Request, res: Response, next: NextFunction): void => {
		try {
			const validation = schema.safeParse(req.body);

			if (!validation.success) {
				const errors = validation.error.issues.map((issue) => ({
					field: issue.path.join("."),
					message: issue.message,
				}));

				logger.warn("Request body validation failed", { errors });

				throw new ValidationError("Invalid request body", errors);
			}

			// Replace body with validated data
			req.body = validation.data;
			next();
		} catch (error) {
			if (error instanceof ValidationError) {
				res.status(400).json({
					error: "Validation Error",
					message: error.message,
					details: error.details,
				});
			} else {
				res.status(400).json({
					error: "Invalid request",
					message: error instanceof Error ? error.message : "Unknown error",
				});
			}
		}
	};
}

/**
 * Query parameters validation middleware factory
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
	return (req: Request, res: Response, next: NextFunction): void => {
		try {
			const validation = schema.safeParse(req.query);

			if (!validation.success) {
				const errors = validation.error.issues.map((issue) => ({
					field: issue.path.join("."),
					message: issue.message,
				}));

				logger.warn("Query parameters validation failed", { errors });

				throw new ValidationError("Invalid query parameters", errors);
			}

			// Replace query with validated data
			req.query = validation.data as any;
			next();
		} catch (error) {
			if (error instanceof ValidationError) {
				res.status(400).json({
					error: "Validation Error",
					message: error.message,
					details: error.details,
				});
			} else {
				res.status(400).json({
					error: "Invalid query parameters",
					message: error instanceof Error ? error.message : "Unknown error",
				});
			}
		}
	};
}

/**
 * Sanitize user input to prevent injection attacks
 */
export function sanitizeInput(
	req: Request,
	res: Response,
	next: NextFunction
): void {
	// Remove any potential script tags or dangerous characters
	const sanitize = (obj: any): any => {
		if (typeof obj === "string") {
			return obj
				.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
				.replace(/javascript:/gi, "")
				.trim();
		}
		if (typeof obj === "object" && obj !== null) {
			for (const key in obj) {
				obj[key] = sanitize(obj[key]);
			}
		}
		return obj;
	};

	if (req.body) {
		req.body = sanitize(req.body);
	}
	if (req.query) {
		req.query = sanitize(req.query);
	}

	next();
}

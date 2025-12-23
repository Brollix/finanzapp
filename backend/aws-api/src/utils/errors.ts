/**
 * Custom error classes for better error handling and type safety
 */

export class OCRProcessingError extends Error {
	code = "OCR_FAILED";
	constructor(message: string, public cause?: Error) {
		super(message);
		this.name = "OCRProcessingError";
		Error.captureStackTrace(this, this.constructor);
	}
}

export class RateLimitError extends Error {
	code = "RATE_LIMIT";
	constructor(message: string = "Rate limit exceeded") {
		super(message);
		this.name = "RateLimitError";
		Error.captureStackTrace(this, this.constructor);
	}
}

export class AuthenticationError extends Error {
	code = "AUTH_ERROR";
	constructor(message: string = "Authentication failed") {
		super(message);
		this.name = "AuthenticationError";
		Error.captureStackTrace(this, this.constructor);
	}
}

export class ValidationError extends Error {
	code = "VALIDATION_ERROR";
	constructor(message: string, public details?: any) {
		super(message);
		this.name = "ValidationError";
		Error.captureStackTrace(this, this.constructor);
	}
}

export class DatabaseError extends Error {
	code = "DATABASE_ERROR";
	constructor(message: string, public cause?: Error) {
		super(message);
		this.name = "DatabaseError";
		Error.captureStackTrace(this, this.constructor);
	}
}

export class BedrockError extends Error {
	code = "BEDROCK_ERROR";
	constructor(message: string, public cause?: Error) {
		super(message);
		this.name = "BedrockError";
		Error.captureStackTrace(this, this.constructor);
	}
}

export class TextractError extends Error {
	code = "TEXTRACT_ERROR";
	constructor(message: string, public cause?: Error) {
		super(message);
		this.name = "TextractError";
		Error.captureStackTrace(this, this.constructor);
	}
}

/**
 * Type guard to check if error has a code property
 */
export function isErrorWithCode(
	error: unknown
): error is Error & { code: string } {
	return (
		error instanceof Error &&
		"code" in error &&
		typeof (error as any).code === "string"
	);
}


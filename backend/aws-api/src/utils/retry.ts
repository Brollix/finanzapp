import pRetry, { FailedAttemptError } from "p-retry";
import logger from "./logger.js";
import { BedrockError, TextractError, DatabaseError } from "./errors.js";

export interface RetryOptions {
	retries?: number;
	minTimeout?: number;
	maxTimeout?: number;
	factor?: number;
	onFailedAttempt?: (error: FailedAttemptError) => void;
}

const defaultOptions: RetryOptions = {
	retries: 3,
	minTimeout: 1000, // 1 second
	maxTimeout: 10000, // 10 seconds
	factor: 2, // Exponential backoff
};

/**
 * Retry wrapper for AWS Bedrock calls
 */
export async function retryBedrockCall<T>(
	fn: () => Promise<T>,
	options: RetryOptions = {}
): Promise<T> {
	const opts = { ...defaultOptions, ...options };
	opts.onFailedAttempt = (error) => {
		logger.warn(
			`Bedrock retry attempt ${error.attemptNumber}/${opts.retries}: ${error.message}`
		);
	};

	try {
		return await pRetry(fn, opts);
	} catch (error) {
		if (error instanceof FailedAttemptError) {
			throw new BedrockError(
				`Bedrock call failed after ${opts.retries} retries: ${error.message}`,
				error
			);
		}
		throw error;
	}
}

/**
 * Retry wrapper for AWS Textract calls
 */
export async function retryTextractCall<T>(
	fn: () => Promise<T>,
	options: RetryOptions = {}
): Promise<T> {
	const opts = { ...defaultOptions, ...options };
	opts.onFailedAttempt = (error) => {
		logger.warn(
			`Textract retry attempt ${error.attemptNumber}/${opts.retries}: ${error.message}`
		);
	};

	try {
		return await pRetry(fn, opts);
	} catch (error) {
		if (error instanceof FailedAttemptError) {
			throw new TextractError(
				`Textract call failed after ${opts.retries} retries: ${error.message}`,
				error
			);
		}
		throw error;
	}
}

/**
 * Retry wrapper for Supabase/Database calls
 */
export async function retryDatabaseCall<T>(
	fn: () => Promise<T>,
	options: RetryOptions = {}
): Promise<T> {
	const opts = { ...defaultOptions, ...options };
	opts.onFailedAttempt = (error) => {
		logger.warn(
			`Database retry attempt ${error.attemptNumber}/${opts.retries}: ${error.message}`
		);
	};

	try {
		return await pRetry(fn, opts);
	} catch (error) {
		if (error instanceof FailedAttemptError) {
			throw new DatabaseError(
				`Database call failed after ${opts.retries} retries: ${error.message}`,
				error
			);
		}
		throw error;
	}
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
	if (!(error instanceof Error)) {
		return false;
	}

	// Network errors
	if (
		error.message.includes("ECONNRESET") ||
		error.message.includes("ETIMEDOUT") ||
		error.message.includes("ENOTFOUND") ||
		error.message.includes("timeout")
	) {
		return true;
	}

	// AWS service errors that are retryable
	if (
		error.message.includes("ThrottlingException") ||
		error.message.includes("ServiceUnavailable") ||
		error.message.includes("InternalServerError") ||
		error.message.includes("TooManyRequests")
	) {
		return true;
	}

	// Database connection errors
	if (
		error.message.includes("connection") ||
		error.message.includes("ConnectionError") ||
		error.message.includes("PGRST")
	) {
		return true;
	}

	return false;
}


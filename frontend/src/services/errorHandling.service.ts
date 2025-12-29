import { Alert } from "react-native";
import * as Sentry from "@sentry/react-native";

interface RetryOptions {
	maxRetries?: number;
	delayMs?: number;
	backoffMultiplier?: number;
	onRetry?: (attempt: number, error: Error) => void;
}

/**
 * Enhanced error handling service for mobile app
 * Provides user-friendly error messages and retry mechanisms
 */
export const errorHandlingService = {
	/**
	 * Handle API errors with user-friendly messages
	 */
	handleApiError(error: any, context?: string): void {
		console.error(`[ErrorHandler] ${context || "API Error"}:`, error);

		// Log to Sentry if available
		if (Sentry) {
			Sentry.captureException(error, {
				tags: { context: context || "api_error" },
			});
		}

		let title = "Error";
		let message = "An unexpected error occurred. Please try again.";

		// Handle specific error types
		if (error.message) {
			if (error.message.includes("Network request failed")) {
				title = "Connection Error";
				message =
					"Unable to connect to the server. Please check your internet connection and try again.";
			} else if (error.message.includes("429")) {
				title = "Too Many Requests";
				message =
					"You've made too many requests. Please wait a moment and try again.";
			} else if (error.message.includes("401")) {
				title = "Authentication Error";
				message = "Your session has expired. Please log in again.";
			} else if (error.message.includes("400")) {
				title = "Invalid Request";
				message =
					"The image could not be processed. Please try with a different photo.";
			} else if (error.message.includes("500")) {
				title = "Server Error";
				message = "The server encountered an error. Please try again later.";
			} else {
				// Use the error message if it's user-friendly
				message = error.message;
			}
		}

		// Show alert to user
		Alert.alert(title, message, [{ text: "OK", style: "default" }]);
	},

	/**
	 * Handle errors with retry option
	 */
	handleErrorWithRetry(
		error: any,
		retryFn: () => Promise<void>,
		context?: string
	): void {
		console.error(`[ErrorHandler] ${context || "Error with retry"}:`, error);

		// Log to Sentry
		if (Sentry) {
			Sentry.captureException(error, {
				tags: { context: context || "error_with_retry" },
			});
		}

		let title = "Error";
		let message = "An error occurred. Would you like to try again?";

		// Customize message based on error
		if (error.message?.includes("Network request failed")) {
			title = "Connection Error";
			message = "Unable to connect to the server. Would you like to retry?";
		}

		Alert.alert(title, message, [
			{ text: "Cancel", style: "cancel" },
			{
				text: "Retry",
				onPress: async () => {
					try {
						await retryFn();
					} catch (retryError) {
						// If retry fails, show error without retry option
						this.handleApiError(retryError, "Retry failed");
					}
				},
			},
		]);
	},

	/**
	 * Retry a function with exponential backoff
	 */
	async retryWithBackoff<T>(
		fn: () => Promise<T>,
		options: RetryOptions = {}
	): Promise<T> {
		const {
			maxRetries = 3,
			delayMs = 1000,
			backoffMultiplier = 2,
			onRetry,
		} = options;

		let lastError: Error;

		for (let attempt = 0; attempt <= maxRetries; attempt++) {
			try {
				return await fn();
			} catch (error) {
				lastError = error instanceof Error ? error : new Error(String(error));

				// If this was the last attempt, throw
				if (attempt === maxRetries) {
					throw lastError;
				}

				// Calculate delay with exponential backoff
				const delay = delayMs * Math.pow(backoffMultiplier, attempt);

				console.log(
					`[ErrorHandler] Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`
				);

				// Call onRetry callback if provided
				if (onRetry) {
					onRetry(attempt + 1, lastError);
				}

				// Wait before retrying
				await new Promise((resolve) => setTimeout(resolve, delay));
			}
		}

		// This should never be reached, but TypeScript needs it
		throw lastError!;
	},

	/**
	 * Show success message
	 */
	showSuccess(message: string, title: string = "Success"): void {
		Alert.alert(title, message, [{ text: "OK", style: "default" }]);
	},

	/**
	 * Show confirmation dialog
	 */
	async showConfirmation(
		message: string,
		title: string = "Confirm"
	): Promise<boolean> {
		return new Promise((resolve) => {
			Alert.alert(title, message, [
				{
					text: "Cancel",
					style: "cancel",
					onPress: () => resolve(false),
				},
				{
					text: "OK",
					onPress: () => resolve(true),
				},
			]);
		});
	},

	/**
	 * Log error to console and Sentry
	 */
	logError(error: any, context?: string, metadata?: Record<string, any>): void {
		console.error(`[ErrorHandler] ${context || "Error"}:`, error);

		if (Sentry) {
			Sentry.captureException(error, {
				tags: { context: context || "unknown" },
				extra: metadata,
			});
		}
	},
};

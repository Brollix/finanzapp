import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import logger from "../utils/logger.js";

/**
 * Initialize Sentry for error tracking and performance monitoring
 */
export function initSentry(): void {
	const dsn = process.env.SENTRY_DSN;
	if (typeof dsn !== "string" || dsn.length === 0) {
		logger.warn("Sentry DSN not configured, skipping Sentry initialization");
		return;
	}

	const env = process.env.NODE_ENV;

	Sentry.init({
		dsn: dsn,
		environment: (typeof env === "string" && env.length > 0) ? env : "development",
		integrations: [nodeProfilingIntegration()],
		// Performance Monitoring
		tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0, // 10% in prod, 100% in dev
		// Profiling
		profilesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
		// Release tracking
		release: (typeof process.env.npm_package_version === "string" && process.env.npm_package_version.length > 0) 
			? process.env.npm_package_version 
			: "unknown",
		// Filter out health checks from traces
		beforeSend(event, _hint) {
			// Don't send events for health checks
			const url = event.request?.url;
			if (typeof url === "string" && url.includes("/api/health")) {
				return null;
			}
			return event;
		},
	});
}

/**
 * Capture exception manually
 */
export function captureException(
	error: Error,
	context?: Record<string, unknown>
): void {
	if (context) {
		Sentry.setContext("additional", context);
	}
	Sentry.captureException(error);
}

/**
 * Capture message
 */
export function captureMessage(
	message: string,
	level: Sentry.SeverityLevel = "info"
): void {
	Sentry.captureMessage(message, level);
}

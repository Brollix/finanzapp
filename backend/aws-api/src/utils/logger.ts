import winston from "winston";
import { randomUUID } from "crypto";

const levels = {
	error: 0,
	warn: 1,
	info: 2,
	http: 3,
	debug: 4,
};

const level = () => {
	const env = process.env.NODE_ENV || "development";
	const isDevelopment = env === "development";
	return isDevelopment ? "debug" : "info";
};

const colors = {
	error: "red",
	warn: "yellow",
	info: "green",
	http: "magenta",
	debug: "white",
};

winston.addColors(colors);

// Console format (colorized for development)
const consoleFormat = winston.format.combine(
	winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
	winston.format.colorize({ all: true }),
	winston.format.printf((info) => {
		const { timestamp, level, message, ...meta } = info;
		const metaStr = Object.keys(meta).length
			? `\n${JSON.stringify(meta, null, 2)}`
			: "";
		return `${timestamp} ${level}: ${message}${metaStr}`;
	})
);

// File format (JSON for parsing)
const fileFormat = winston.format.combine(
	winston.format.timestamp(),
	winston.format.errors({ stack: true }),
	winston.format.json()
);

const transports: winston.transport[] = [
	new winston.transports.Console({
		format: consoleFormat,
	}),
];

// Add file transports in production
if (process.env.NODE_ENV === "production") {
	transports.push(
		new winston.transports.File({
			filename: "logs/error.log",
			level: "error",
			format: fileFormat,
			maxsize: 10485760, // 10MB
			maxFiles: 5,
		}),
		new winston.transports.File({
			filename: "logs/combined.log",
			format: fileFormat,
			maxsize: 10485760, // 10MB
			maxFiles: 5,
		})
	);
}

const logger = winston.createLogger({
	level: level(),
	levels,
	defaultMeta: {
		service: "finanzapp-api",
		environment: process.env.NODE_ENV || "development",
		version: process.env.npm_package_version,
	},
	transports,
});

/**
 * Generate a unique trace ID for request tracking
 */
export function generateTraceId(): string {
	return randomUUID();
}

/**
 * Log with additional context
 */
export function logWithContext(
	level: keyof typeof levels,
	message: string,
	context?: Record<string, any>
) {
	logger.log(level, message, {
		...context,
		timestamp: new Date().toISOString(),
	});
}

/**
 * Log performance metrics
 */
export function logPerformance(
	operation: string,
	durationMs: number,
	metadata?: Record<string, any>
) {
	logger.info(`Performance: ${operation}`, {
		operation,
		duration_ms: durationMs,
		duration_s: (durationMs / 1000).toFixed(2),
		...metadata,
	});
}

/**
 * Log with trace ID for request tracking
 */
export function logWithTrace(
	level: keyof typeof levels,
	message: string,
	traceId: string,
	context?: Record<string, any>
) {
	logger.log(level, message, {
		traceId,
		...context,
	});
}

export default logger;

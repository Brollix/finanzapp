import dotenv from "dotenv";

// Load environment variables FIRST before any other imports
dotenv.config();

import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import receiptRoutes from "./routes/receipt.routes.js";
import testRoutes from "./routes/test.routes.js";
import { apiLimiter } from "./middleware/rateLimit.js";
import logger from "./utils/logger.js";
import { validateEnv } from "./utils/validateEnv.js";
import {
	isErrorWithCode,
	RateLimitError,
	ValidationError,
	AuthenticationError,
} from "./utils/errors.js";
import { captureException } from "./config/sentry.js";

// Validate environment variables
validateEnv();

const app: Application = express();

// Trust proxy for AWS/Load Balancer
app.set("trust proxy", 1);

// Security & Performance Middleware
app.use(helmet());
app.use(compression());

// Logging Middleware
const morganFormat = ":method :url :status :response-time ms";
app.use(
	morgan(morganFormat, {
		stream: {
			write: (message) => {
				const logObject = {
					method: message.split(" ")[0],
					url: message.split(" ")[1],
					status: message.split(" ")[2],
					responseTime: message.split(" ")[3],
				};
				logger.http(JSON.stringify(logObject));
			},
		},
	})
);

// Middleware
app.use(
	cors({
		origin: true, // Allow all origins in development (Expo uses dynamic IPs)
		credentials: true,
	})
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global rate limiter
app.use(apiLimiter);

// Health check endpoints
app.get("/health", (req: Request, res: Response) => {
	res.status(200).json({
		status: "healthy",
		timestamp: new Date().toISOString(),
		service: "finanzapp-aws-api",
	});
});

// Liveness probe - simple check if app is running
app.get("/health/live", (req: Request, res: Response) => {
	res.status(200).json({ status: "alive" });
});

// Readiness probe - check if app can serve requests (AWS + Supabase connectivity)
app.get("/health/ready", async (req: Request, res: Response) => {
	try {
		// Check Supabase connection
		const { supabase } = await import("./config/supabase.js");
		const { error } = await supabase.from("receipts").select("id").limit(1);

		if (error && error.code !== "PGRST116") {
			// PGRST116 is "no rows returned" which is fine for health check
			return res.status(503).json({
				status: "not ready",
				reason: "Database connection failed",
			});
		}

		// AWS connectivity is checked implicitly when services are called
		res.status(200).json({
			status: "ready",
			checks: {
				database: "ok",
			},
		});
	} catch (error) {
		logger.error(`Readiness check failed: ${error}`);
		res.status(503).json({
			status: "not ready",
			reason: "Health check failed",
		});
	}
});

// API Routes
app.use("/api/receipt", receiptRoutes);
app.use("/api/test", testRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
	res.status(404).json({
		error: "Not Found",
		message: `Route ${req.method} ${req.path} not found`,
	});
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
	// Log error with stack trace in development
	if (process.env.NODE_ENV === "development") {
		logger.error(`Unhandled error: ${err.message}`, { stack: err.stack });
	} else {
		logger.error(`Unhandled error: ${err.message}`);
	}

	// Capture error in Sentry (only for non-validation errors)
	if (!(err instanceof ValidationError)) {
		captureException(err, {
			url: req.url,
			method: req.method,
			user: (req as any).user?.id,
		});
	}

	// Handle custom error types
	if (isErrorWithCode(err)) {
		const statusCode =
			err instanceof RateLimitError
				? 429
				: err instanceof ValidationError
					? 400
					: err instanceof AuthenticationError
						? 401
						: 500;

		return res.status(statusCode).json({
			error: err.code,
			message: err.message,
			...(err instanceof ValidationError && err.details
				? { details: err.details }
				: {}),
		});
	}

	// Default error response
	res.status(500).json({
		error: "Internal Server Error",
		message:
			process.env.NODE_ENV === "development"
				? err.message
				: "An unexpected error occurred",
	});
});

export default app;

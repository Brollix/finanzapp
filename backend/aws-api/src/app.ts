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

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
	res.status(200).json({
		status: "healthy",
		timestamp: new Date().toISOString(),
		service: "finanzapp-aws-api",
	});
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
	logger.error(`Unhandled error: ${err.message}`);
	res.status(500).json({
		error: "Internal Server Error",
		message: err.message || "An unexpected error occurred",
	});
});

export default app;

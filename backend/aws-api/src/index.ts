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
const PORT = process.env.PORT || 8080;

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

// Start server
const server = app.listen(PORT, () => {
	logger.info(`FinanzApp AWS API running on port ${PORT}`);
	logger.info(`Health check: http://localhost:${PORT}/health`);
	logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
});

// Graceful Shutdown
const gracefulShutdown = () => {
	logger.info("Received kill signal, shutting down gracefully");
	server.close(() => {
		logger.info("Closed out remaining connections");
		process.exit(0);
	});

	// Force close after 10s
	setTimeout(() => {
		logger.error(
			"Could not close connections in time, forcefully shutting down"
		);
		process.exit(1);
	}, 10000);
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

export default app;

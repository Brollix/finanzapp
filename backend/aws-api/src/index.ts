import dotenv from "dotenv";

// Load environment variables FIRST before any other imports
dotenv.config();

import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import receiptRoutes from "./routes/receipt.routes.js";
import testRoutes from "./routes/test.routes.js";
import { apiLimiter } from "./middleware/rateLimit.js";

const app: Application = express();
const PORT = process.env.PORT || 8080;

// Trust proxy for AWS/Load Balancer
app.set("trust proxy", 1);

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
	console.error("Unhandled error:", err);
	res.status(500).json({
		error: "Internal Server Error",
		message: err.message || "An unexpected error occurred",
	});
});

// Start server
app.listen(PORT, () => {
	console.log(`FinanzApp AWS API running on port ${PORT}`);
	console.log(`Health check: http://localhost:${PORT}/health`);
	console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});

export default app;

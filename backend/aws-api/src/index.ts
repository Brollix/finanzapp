import app from "./app.js";
import logger from "./utils/logger.js";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 8080;

// Start server
const server = app.listen(Number(PORT), "0.0.0.0", () => {
	logger.info(`FinanzApp AWS API running on port ${PORT}`);
	logger.info(`Health check: http://localhost:${PORT}/api/health`);
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

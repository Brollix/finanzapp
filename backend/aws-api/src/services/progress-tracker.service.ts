import { v4 as uuidv4 } from "uuid";
import logger from "../utils/logger.js";

export interface ProcessingProgress {
	status:
		| "extracting_text"
		| "checking_cache"
		| "optimizing_image"
		| "processing_ai"
		| "saving"
		| "completed"
		| "error";
	progress: number; // 0-100
	message: string;
	receiptId?: string;
	error?: string;
}

// In-memory storage for processing jobs
// In production, consider using Redis for distributed systems
const processingJobs = new Map<string, ProcessingProgress>();

// Clean up old jobs (older than 5 minutes)
// Store interval reference so it can be cleared
let cleanupInterval: NodeJS.Timeout | null = null;

// Only start cleanup interval in non-test environments
if (process.env.NODE_ENV !== "test") {
	cleanupInterval = setInterval(() => {
		const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
		for (const [jobId, progress] of processingJobs.entries()) {
			if (progress.status === "completed" || progress.status === "error") {
				// Keep completed/error jobs for a bit longer for debugging
				const jobTimestamp = parseInt(jobId.split("-")[0] || "0");
				if (jobTimestamp && jobTimestamp < fiveMinutesAgo) {
					processingJobs.delete(jobId);
				}
			}
		}
	}, 60000); // Run cleanup every minute

	// Allow Node.js to exit even if this interval is active
	cleanupInterval.unref();
}

/**
 * Cleanup function to clear the interval
 * Useful for testing and graceful shutdown
 */
export const cleanup = (): void => {
	if (cleanupInterval) {
		clearInterval(cleanupInterval);
		cleanupInterval = null;
	}
};

export const progressTracker = {
	/**
	 * Create a new processing job and return its ID
	 */
	createJob(): string {
		const jobId = `${Date.now()}-${uuidv4()}`;
		processingJobs.set(jobId, {
			status: "extracting_text",
			progress: 0,
			message: "Iniciando procesamiento...",
		});
		logger.debug(`Created processing job: ${jobId}`);
		return jobId;
	},

	/**
	 * Update progress for a job
	 */
	updateProgress(jobId: string, progress: Partial<ProcessingProgress>): void {
		const current = processingJobs.get(jobId);
		if (current) {
			const updated = { ...current, ...progress };
			processingJobs.set(jobId, updated);
			logger.debug(
				`Job ${jobId} progress: ${updated.progress}% - ${updated.message}`
			);
		}
	},

	/**
	 * Get current progress for a job
	 */
	getProgress(jobId: string): ProcessingProgress | null {
		return processingJobs.get(jobId) || null;
	},

	/**
	 * Mark job as completed
	 */
	completeJob(jobId: string, receiptId: string): void {
		processingJobs.set(jobId, {
			status: "completed",
			progress: 100,
			message: "Procesamiento completado",
			receiptId,
		});
		logger.debug(`Job ${jobId} completed with receipt ${receiptId}`);
	},

	/**
	 * Mark job as error
	 */
	errorJob(jobId: string, error: string): void {
		processingJobs.set(jobId, {
			status: "error",
			progress: 0,
			message: "Error en el procesamiento",
			error,
		});
		logger.error(`Job ${jobId} failed: ${error}`);
	},
};

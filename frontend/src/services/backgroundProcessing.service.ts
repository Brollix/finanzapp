import { receiptApi } from "./receiptApi";
import { notificationService } from "./inAppNotification.service";

interface BackgroundJob {
	id: string;
	imageUri: string;
	status: "pending" | "processing" | "completed" | "failed";
	receiptId?: string;
	backendJobId?: string;
	error?: string;
	startedAt: number;
}

/**
 * Background processing service for receipts
 * Allows users to upload and continue using the app while processing happens in background
 */
class BackgroundProcessingService {
	private jobs: Map<string, BackgroundJob> = new Map();
	private processingQueue: string[] = [];
	private isProcessing = false;

	/**
	 * Start processing a receipt in the background
	 */
	async startProcessing(
		imageUri: string,
		onComplete?: (receiptId: string) => void
	): Promise<string> {
		const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

		const job: BackgroundJob = {
			id: jobId,
			imageUri,
			status: "pending",
			startedAt: Date.now(),
		};

		this.jobs.set(jobId, job);
		this.processingQueue.push(jobId);

		// Show processing notification
		const notificationId = notificationService.processing(
			"Procesando ticket",
			"Tu ticket se está procesando en segundo plano..."
		);

		// Start processing queue
		this.processQueue();

		// Poll for completion
		this.pollJob(jobId, notificationId, onComplete);

		return jobId;
	}

	/**
	 * Process jobs in the queue
	 */
	private async processQueue() {
		if (this.isProcessing || this.processingQueue.length === 0) {
			return;
		}

		this.isProcessing = true;

		while (this.processingQueue.length > 0) {
			const jobId = this.processingQueue.shift();
			if (!jobId) continue;

			const job = this.jobs.get(jobId);
			if (!job) continue;

			try {
				job.status = "processing";

				// Process receipt - Default to preview mode for user confirmation
				const response = await receiptApi.processReceipt(job.imageUri, {
					preview: true,
				});

				// If we have jobId from backend, poll for status
				if (response.jobId) {
					// Backend will handle async processing
					// Store backend Job ID for polling
					// We'll poll in pollJob method
					job.backendJobId = response.jobId;
					continue;
				}

				// If we have immediate response
				if (response.data) {
					job.status = "completed";
					job.receiptId = response.data.id;
				}
			} catch (error) {
				job.status = "failed";
				job.error = error instanceof Error ? error.message : "Unknown error";
				console.error("[BackgroundProcessing] Job failed:", error);
			}
		}

		this.isProcessing = false;
	}

	/**
	 * Poll for job completion
	 */
	private async pollJob(
		jobId: string,
		notificationId: string,
		onComplete?: (receiptId: string) => void
	) {
		let attempts = 0;
		const maxAttempts = 60; // 60 seconds max
		const pollInterval = 2000; // 2 seconds

		const poll = async () => {
			attempts++;

			if (attempts > maxAttempts) {
				// Timeout
				const job = this.jobs.get(jobId);
				if (job) {
					job.status = "failed";
					job.error = "Processing timeout";
				}

				notificationService.remove(notificationId);
				notificationService.error(
					"Tiempo agotado",
					"El procesamiento tomó demasiado tiempo. Intenta nuevamente."
				);
				return;
			}

			const currentJob = this.jobs.get(jobId);
			if (!currentJob) return;

			// If we have a backendJobId and still processing, check status with API
			if (currentJob.status === "processing" && currentJob.backendJobId) {
				try {
					const backendStatus = await receiptApi.getProcessingStatus(
						currentJob.backendJobId
					);
					console.log(
						`[BackgroundProcessing] Polling backend job ${currentJob.backendJobId}:`,
						backendStatus.status
					);

					if (backendStatus.status === "completed" && backendStatus.receiptId) {
						currentJob.status = "completed";
						currentJob.receiptId = backendStatus.receiptId;
					} else if (backendStatus.status === "error") {
						currentJob.status = "failed";
						currentJob.error =
							backendStatus.error || "Error en el procesamiento del backend";
					}
					// If extracting_text or processing_ai, just continue polling
				} catch (err) {
					console.warn("[BackgroundProcessing] Error polling backend:", err);
					// Don't fail immediately on network error, just retry
				}
			}

			// Check if completed
			if (currentJob.status === "completed" && currentJob.receiptId) {
				// Remove processing notification
				notificationService.remove(notificationId);

				// Show success notification
				notificationService.success(
					"✅ Ticket procesado",
					"Tu ticket ha sido procesado exitosamente",
					{
						label: "Ver",
						onPress: () => {
							if (onComplete && currentJob.receiptId) {
								onComplete(currentJob.receiptId);
							}
						},
					}
				);

				// Clean up job after 5 minutes
				setTimeout(
					() => {
						this.jobs.delete(jobId);
					},
					5 * 60 * 1000
				);

				return;
			}

			// Check if failed
			if (currentJob.status === "failed") {
				notificationService.remove(notificationId);
				notificationService.error(
					"Error procesando ticket",
					currentJob.error || "Ocurrió un error desconocido"
				);
				return;
			}

			// Continue polling
			setTimeout(poll, pollInterval);
		};

		// Start polling after initial delay
		setTimeout(poll, pollInterval);
	}

	/**
	 * Get job status
	 */
	getJob(jobId: string): BackgroundJob | undefined {
		return this.jobs.get(jobId);
	}

	/**
	 * Get all jobs
	 */
	getAllJobs(): BackgroundJob[] {
		return Array.from(this.jobs.values());
	}

	/**
	 * Clear completed jobs
	 */
	clearCompleted() {
		for (const [jobId, job] of this.jobs.entries()) {
			if (job.status === "completed" || job.status === "failed") {
				this.jobs.delete(jobId);
			}
		}
	}
}

export const backgroundProcessingService = new BackgroundProcessingService();

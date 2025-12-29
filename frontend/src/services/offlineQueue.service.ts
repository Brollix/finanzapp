import AsyncStorage from "@react-native-async-storage/async-storage";
import { receiptApi } from "./receiptApi";

interface QueuedUpload {
	id: string;
	imageUri: string;
	timestamp: number;
	status: "pending" | "uploading" | "completed" | "failed";
	retryCount: number;
	error?: string;
}

const QUEUE_KEY = "@finanzapp_upload_queue";
const MAX_RETRIES = 3;

/**
 * Offline queue service for receipt uploads
 * Stores failed uploads and retries them when online
 */
export const offlineQueueService = {
	/**
	 * Add upload to queue
	 */
	async queueUpload(imageUri: string): Promise<string> {
		const upload: QueuedUpload = {
			id: `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
			imageUri,
			timestamp: Date.now(),
			status: "pending",
			retryCount: 0,
		};

		const queue = await this.getQueue();
		queue.push(upload);
		await this.saveQueue(queue);

		console.log("[OfflineQueue] Upload queued:", upload.id);
		return upload.id;
	},

	/**
	 * Get all queued uploads
	 */
	async getQueue(): Promise<QueuedUpload[]> {
		try {
			const queueJson = await AsyncStorage.getItem(QUEUE_KEY);
			return queueJson ? JSON.parse(queueJson) : [];
		} catch (error) {
			console.error("[OfflineQueue] Error getting queue:", error);
			return [];
		}
	},

	/**
	 * Save queue to storage
	 */
	async saveQueue(queue: QueuedUpload[]): Promise<void> {
		try {
			await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
		} catch (error) {
			console.error("[OfflineQueue] Error saving queue:", error);
		}
	},

	/**
	 * Process all pending uploads
	 */
	async processQueue(): Promise<{
		processed: number;
		succeeded: number;
		failed: number;
	}> {
		const queue = await this.getQueue();
		const pendingUploads = queue.filter(
			(u) => u.status === "pending" || u.status === "failed"
		);

		if (pendingUploads.length === 0) {
			console.log("[OfflineQueue] No pending uploads");
			return { processed: 0, succeeded: 0, failed: 0 };
		}

		console.log(
			`[OfflineQueue] Processing ${pendingUploads.length} pending uploads`
		);

		let succeeded = 0;
		let failed = 0;

		for (const upload of pendingUploads) {
			// Skip if max retries reached
			if (upload.retryCount >= MAX_RETRIES) {
				console.log(`[OfflineQueue] Max retries reached for ${upload.id}`);
				failed++;
				continue;
			}

			try {
				// Update status to uploading
				upload.status = "uploading";
				upload.retryCount++;
				await this.saveQueue(queue);

				// Attempt upload
				console.log(
					`[OfflineQueue] Uploading ${upload.id} (attempt ${upload.retryCount})`
				);
				await receiptApi.processReceipt(upload.imageUri);

				// Mark as completed
				upload.status = "completed";
				succeeded++;

				console.log(`[OfflineQueue] Upload ${upload.id} succeeded`);
			} catch (error) {
				console.error(`[OfflineQueue] Upload ${upload.id} failed:`, error);
				upload.status = "failed";
				upload.error = error instanceof Error ? error.message : "Unknown error";
				failed++;
			}

			await this.saveQueue(queue);
		}

		// Clean up completed uploads (older than 24 hours)
		await this.cleanupOldUploads();

		return {
			processed: pendingUploads.length,
			succeeded,
			failed,
		};
	},

	/**
	 * Remove upload from queue
	 */
	async removeUpload(uploadId: string): Promise<void> {
		const queue = await this.getQueue();
		const filtered = queue.filter((u) => u.id !== uploadId);
		await this.saveQueue(filtered);
		console.log("[OfflineQueue] Upload removed:", uploadId);
	},

	/**
	 * Clear all completed uploads
	 */
	async clearCompleted(): Promise<void> {
		const queue = await this.getQueue();
		const filtered = queue.filter((u) => u.status !== "completed");
		await this.saveQueue(filtered);
		console.log("[OfflineQueue] Completed uploads cleared");
	},

	/**
	 * Clean up old uploads (completed or failed > 24 hours ago)
	 */
	async cleanupOldUploads(): Promise<void> {
		const queue = await this.getQueue();
		const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

		const filtered = queue.filter((upload) => {
			// Keep pending and uploading
			if (upload.status === "pending" || upload.status === "uploading") {
				return true;
			}

			// Remove old completed/failed
			return upload.timestamp > oneDayAgo;
		});

		if (filtered.length < queue.length) {
			await this.saveQueue(filtered);
			console.log(
				`[OfflineQueue] Cleaned up ${queue.length - filtered.length} old uploads`
			);
		}
	},

	/**
	 * Get queue statistics
	 */
	async getStats(): Promise<{
		total: number;
		pending: number;
		uploading: number;
		completed: number;
		failed: number;
	}> {
		const queue = await this.getQueue();

		return {
			total: queue.length,
			pending: queue.filter((u) => u.status === "pending").length,
			uploading: queue.filter((u) => u.status === "uploading").length,
			completed: queue.filter((u) => u.status === "completed").length,
			failed: queue.filter((u) => u.status === "failed").length,
		};
	},
};

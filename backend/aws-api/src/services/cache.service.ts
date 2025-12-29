import { supabase } from "../config/supabase.js";
import logger from "../utils/logger.js";
import crypto from "crypto";

interface CacheEntry {
	data: any;
	expires: number;
}

interface CacheStats {
	memoryHits: number;
	memoryMisses: number;
	supabaseHits: number;
	supabaseMisses: number;
}

/**
 * Two-layer caching service
 * Layer 1: In-memory cache (fast, volatile)
 * Layer 2: Supabase table (persistent, slower)
 */
class CacheService {
	private memoryCache = new Map<string, CacheEntry>();
	private stats: CacheStats = {
		memoryHits: 0,
		memoryMisses: 0,
		supabaseHits: 0,
		supabaseMisses: 0,
	};

	/**
	 * Generate hash from image buffer for cache key
	 */
	generateImageHash(imageBuffer: Buffer): string {
		return crypto.createHash("sha256").update(imageBuffer).digest("hex");
	}

	/**
	 * Get from memory cache (Layer 1)
	 */
	private async getFromMemory(key: string): Promise<any | null> {
		const cached = this.memoryCache.get(key);

		if (!cached) {
			this.stats.memoryMisses++;
			return null;
		}

		// Check if expired
		if (Date.now() > cached.expires) {
			this.memoryCache.delete(key);
			this.stats.memoryMisses++;
			return null;
		}

		this.stats.memoryHits++;
		logger.info("Cache hit (memory)", { key: key.substring(0, 8) });
		return cached.data;
	}

	/**
	 * Set in memory cache (Layer 1)
	 */
	private async setInMemory(
		key: string,
		data: any,
		ttlSeconds: number
	): Promise<void> {
		this.memoryCache.set(key, {
			data,
			expires: Date.now() + ttlSeconds * 1000,
		});
	}

	/**
	 * Get from Supabase cache (Layer 2)
	 */
	private async getFromSupabase(imageHash: string): Promise<any | null> {
		try {
			const { data, error } = await supabase
				.from("receipt_cache")
				.select("result, created_at")
				.eq("image_hash", imageHash)
				.single();

			if (error || !data) {
				this.stats.supabaseMisses++;
				return null;
			}

			// Check if cache is older than 30 days
			const cacheAge = Date.now() - new Date(data.created_at).getTime();
			const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days

			if (cacheAge > maxAge) {
				// Delete old cache
				await supabase
					.from("receipt_cache")
					.delete()
					.eq("image_hash", imageHash);
				this.stats.supabaseMisses++;
				return null;
			}

			// Update access count and timestamp
			await supabase
				.from("receipt_cache")
				.update({
					accessed_at: new Date().toISOString(),
					access_count: supabase.rpc("increment", { x: 1 }),
				})
				.eq("image_hash", imageHash);

			this.stats.supabaseHits++;
			logger.info("Cache hit (Supabase)", {
				imageHash: imageHash.substring(0, 8),
			});
			return data.result;
		} catch (error) {
			logger.error("Error getting from Supabase cache", { error });
			this.stats.supabaseMisses++;
			return null;
		}
	}

	/**
	 * Set in Supabase cache (Layer 2)
	 */
	private async setInSupabase(imageHash: string, result: any): Promise<void> {
		try {
			await supabase.from("receipt_cache").upsert(
				{
					image_hash: imageHash,
					result,
					created_at: new Date().toISOString(),
					accessed_at: new Date().toISOString(),
					access_count: 1,
				},
				{ onConflict: "image_hash" }
			);

			logger.info("Cached in Supabase", {
				imageHash: imageHash.substring(0, 8),
			});
		} catch (error) {
			logger.error("Error setting Supabase cache", { error });
		}
	}

	/**
	 * Get cached receipt processing result
	 * Checks memory first, then Supabase
	 */
	async get(imageBuffer: Buffer): Promise<any | null> {
		const imageHash = this.generateImageHash(imageBuffer);

		// Try memory cache first
		let cached = await this.getFromMemory(imageHash);
		if (cached) {
			return cached;
		}

		// Try Supabase cache
		cached = await this.getFromSupabase(imageHash);
		if (cached) {
			// Store in memory for next time
			await this.setInMemory(imageHash, cached, 3600); // 1 hour
			return cached;
		}

		return null;
	}

	/**
	 * Cache receipt processing result
	 * Stores in both memory and Supabase
	 */
	async set(imageBuffer: Buffer, result: any): Promise<void> {
		const imageHash = this.generateImageHash(imageBuffer);

		// Store in both layers
		await Promise.all([
			this.setInMemory(imageHash, result, 3600), // 1 hour in memory
			this.setInSupabase(imageHash, result), // Persistent in DB
		]);
	}

	/**
	 * Get cache statistics
	 */
	getStats(): CacheStats & { hitRate: number } {
		const totalRequests =
			this.stats.memoryHits +
			this.stats.memoryMisses +
			this.stats.supabaseHits +
			this.stats.supabaseMisses;

		const totalHits = this.stats.memoryHits + this.stats.supabaseHits;
		const hitRate = totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0;

		return {
			...this.stats,
			hitRate: Math.round(hitRate * 100) / 100,
		};
	}

	/**
	 * Clear memory cache (for testing)
	 */
	clearMemoryCache(): void {
		this.memoryCache.clear();
		logger.info("Memory cache cleared");
	}

	/**
	 * Clear old cache entries from Supabase (cleanup job)
	 */
	async cleanupOldCache(daysOld: number = 30): Promise<number> {
		try {
			const cutoffDate = new Date();
			cutoffDate.setDate(cutoffDate.getDate() - daysOld);

			const { data, error } = await supabase
				.from("receipt_cache")
				.delete()
				.lt("created_at", cutoffDate.toISOString())
				.select();

			if (error) {
				logger.error("Error cleaning up cache", { error });
				return 0;
			}

			const deletedCount = data?.length || 0;
			logger.info(`Cleaned up ${deletedCount} old cache entries`);
			return deletedCount;
		} catch (error) {
			logger.error("Error in cache cleanup", { error });
			return 0;
		}
	}
}

export const cacheService = new CacheService();

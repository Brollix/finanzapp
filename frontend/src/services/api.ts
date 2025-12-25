import Constants from "expo-constants";
import { supabase } from "../lib/supabase";
import { resolveBackendUrl } from "../utils/getBackendUrl";

/**
 * Common response structure from the backend
 */
export interface ApiResponse<T> {
	success: boolean;
	data: T;
	error?: string;
	message?: string;
	errorType?: string;
}

/**
 * Base configuration for API requests
 */
interface RequestOptions extends RequestInit {
	skipAuth?: boolean;
}

/**
 * Get the configured backend URL
 */
export const getBaseUrl = (): string => {
	const url = 
		process.env.EXPO_PUBLIC_BACKEND_URL ||
		Constants.expoConfig?.extra?.backendUrl ||
		resolveBackendUrl(undefined, 8080);
	
	console.log("[APIClient] Base URL:", url);
	console.log("[APIClient] EXPO_PUBLIC_BACKEND_URL:", process.env.EXPO_PUBLIC_BACKEND_URL);
	console.log("[APIClient] expoConfig.extra.backendUrl:", Constants.expoConfig?.extra?.backendUrl);
	
	return url;
};

/**
 * Centralized API client for handling requests
 */
export const apiClient = {
	/**
	 * Generic fetch wrapper with authentication and error handling
	 */
	async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
		const baseUrl = getBaseUrl();

		// Ensure endpoint starts with /
		const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
		const url = `${baseUrl}${path}`;
		
		console.log("[APIClient] Request to:", url);
		console.log("[APIClient] Method:", options.method || "GET");
		console.log("[APIClient] Body type:", options.body ? options.body.constructor.name : "none");

		const headers = new Headers(options.headers);

		// Add Auth token unless skipped
		if (!options.skipAuth) {
			const {
				data: { session },
			} = await supabase.auth.getSession();
			const token = session?.access_token;
			if (token) {
				headers.set("Authorization", `Bearer ${token}`);
				console.log("[APIClient] Auth token added (length):", token.length);
			} else {
				console.warn("[APIClient] No auth token available!");
			}
		}

		// Add JSON content type if body is present and not FormData
		if (
			options.body &&
			!(options.body instanceof FormData) &&
			!headers.has("Content-Type")
		) {
			headers.set("Content-Type", "application/json");
		}
		
		console.log("[APIClient] Headers:", JSON.stringify(Object.fromEntries(headers.entries()), null, 2));

		try {
			console.log("[APIClient] Sending fetch request...");
			const response = await fetch(url, {
				...options,
				headers,
			});
			
			console.log("[APIClient] Response status:", response.status);
			console.log("[APIClient] Response ok:", response.ok);

			if (!response.ok) {
				const errText = await response.text();
				console.error("[APIClient] Error response text:", errText);
				
				let errorType: string | undefined;
				let errorMessage: string = errText;

				try {
					const errorJson = JSON.parse(errText);
					console.error("[APIClient] Parsed error JSON:", errorJson);
					
					if (errorJson.errorType) errorType = errorJson.errorType;

					if (errorJson.message) {
						errorMessage = errorJson.message;
					} else if (errorJson.error) {
						errorMessage = errorJson.error;
					}
				} catch {
					// Fallback to plain text
					console.error("[APIClient] Could not parse error as JSON");
				}

				// Special handling for 429 (Rate Limiting)
				if (response.status === 429) {
					// Check if we should retry (only for GET requests, max 1 retry)
					if (options.method === "GET" || !options.method) {
						const retryAfter = response.headers.get("Retry-After");
						const retryDelay = retryAfter 
							? parseInt(retryAfter, 10) * 1000 
							: 5000; // Default 5 seconds
						
						console.warn(`[APIClient] Rate limited (429), retrying after ${retryDelay}ms...`);
						
						// Wait before retrying
						await new Promise(resolve => setTimeout(resolve, retryDelay));
						
						// Retry once
						try {
							const retryResponse = await fetch(url, {
								...options,
								headers,
							});
							
							if (retryResponse.ok) {
								console.log("[APIClient] Retry successful after rate limit");
								// Process successful retry response
								if (retryResponse.status === 204) {
									return {} as T;
								}
								const retryText = await retryResponse.text();
								const retryJson = JSON.parse(retryText);
								
								if (retryJson && typeof retryJson === "object" && "data" in retryJson) {
									const keys = Object.keys(retryJson);
									const hasAdditionalFields = keys.some(
										(key) => key !== "success" && key !== "data" && key !== "error" && key !== "message"
									);
									
									if (hasAdditionalFields) {
										return retryJson as T;
									}
									return retryJson.data as T;
								}
								return retryJson as T;
							}
						} catch (retryError) {
							console.error("[APIClient] Retry also failed:", retryError);
							// Fall through to throw original error
						}
					}
					
					// If retry failed or not applicable, throw rate limit error
					const rateLimitError = new Error(`API Error 429: ${errorMessage}`);
					(rateLimitError as any).statusCode = 429;
					(rateLimitError as any).isRateLimit = true;
					throw rateLimitError;
				}

				const errorMsg = errorType
					? `API Error ${response.status} [${errorType}]: ${errorMessage}`
					: `API Error ${response.status}: ${errorMessage}`;

				console.error("[APIClient] Final error message:", errorMsg);
				const apiError = new Error(errorMsg);
				(apiError as any).statusCode = response.status;
				throw apiError;
			}

			// For 204 No Content
			if (response.status === 204) {
				console.log("[APIClient] 204 No Content response");
				return {} as T;
			}

			const text = await response.text();
			console.log("[APIClient] Response text (truncated):", text.substring(0, 500));
			
			let json;
			try {
				json = JSON.parse(text);
				console.log("[APIClient] Parsed JSON response:", JSON.stringify(json, null, 2).substring(0, 500));
			} catch (e) {
				console.error("JSON Parse Error for URL:", url);
				console.error("Response Text:", text);
				throw new Error("Invalid JSON response from server");
			}

		// Unpack generic backend response structure { success: true, data: ... }
		// BUT: if there are additional fields (like jobId), return the full response
		if (json && typeof json === "object" && "data" in json) {
			const keys = Object.keys(json);
			const hasAdditionalFields = keys.some(
				(key) => key !== "success" && key !== "data" && key !== "error" && key !== "message"
			);
			
			if (hasAdditionalFields) {
				console.log("[APIClient] Returning full response (has additional fields)");
				return json as T;
			}
			
			console.log("[APIClient] Returning unpacked data property");
			return json.data as T;
		}

		console.log("[APIClient] Returning raw JSON");
		return json as T;
		} catch (error) {
			console.error("[APIClient] Caught error in request:", error);
			throw error;
		}
	},

	get<T>(endpoint: string, options?: RequestOptions) {
		return this.request<T>(endpoint, { ...options, method: "GET" });
	},

	post<T>(endpoint: string, body: any, options?: RequestOptions) {
		return this.request<T>(endpoint, {
			...options,
			method: "POST",
			body: body instanceof FormData ? body : JSON.stringify(body),
		});
	},

	put<T>(endpoint: string, body: any, options?: RequestOptions) {
		return this.request<T>(endpoint, {
			...options,
			method: "PUT",
			body: JSON.stringify(body),
		});
	},

	delete<T>(endpoint: string, options?: RequestOptions) {
		return this.request<T>(endpoint, { ...options, method: "DELETE" });
	},
};

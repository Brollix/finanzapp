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
	return (
		process.env.EXPO_PUBLIC_BACKEND_URL ||
		Constants.expoConfig?.extra?.backendUrl ||
		resolveBackendUrl(undefined, 8080)
	);
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

		const headers = new Headers(options.headers);

		// Add Auth token unless skipped
		if (!options.skipAuth) {
			const {
				data: { session },
			} = await supabase.auth.getSession();
			const token = session?.access_token;
			if (token) {
				headers.set("Authorization", `Bearer ${token}`);
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

		try {
			const response = await fetch(url, {
				...options,
				headers,
			});

			if (!response.ok) {
				const errText = await response.text();
				let errorType: string | undefined;
				let errorMessage: string = errText;

				try {
					const errorJson = JSON.parse(errText);
					if (errorJson.errorType) errorType = errorJson.errorType;

					if (errorJson.message) {
						errorMessage = errorJson.message;
					} else if (errorJson.error) {
						errorMessage = errorJson.error;
					}
				} catch {
					// Fallback to plain text
				}

				const errorMsg = errorType
					? `API Error ${response.status} [${errorType}]: ${errorMessage}`
					: `API Error ${response.status}: ${errorMessage}`;

				throw new Error(errorMsg);
			}

			// For 204 No Content
			if (response.status === 204) {
				return {} as T;
			}

			const json = await response.json();

			// Unpack generic backend response structure { success: true, data: ... }
			if (json && typeof json === "object" && "data" in json) {
				return json.data as T;
			}

			return json as T;
		} catch (error) {
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

/**
 * Utility functions for Bedrock service
 */

/**
 * Helper to parse Argentine number format (1.234,56) to JS float (1234.56)
 * If the input is already a number, it returns it as is.
 */
export function parseArgentineNumber(value: string | number): number {
	if (typeof value === "number") {
		return value;
	}
	if (!value) {
		return 0;
	}
	// Remove thousands separator (.) and replace decimal separator (,) with (.)
	const cleanValue = value.replace(/\./g, "").replace(",", ".");
	const parsed = parseFloat(cleanValue);
	return isNaN(parsed) ? 0 : parsed;
}

/**
 * Simple Levenshtein distance calculation for fuzzy string matching
 * Used to detect duplicate items that might have slight variations
 */
export function levenshteinDistance(str1: string, str2: string): number {
	const len1 = str1.length;
	const len2 = str2.length;
	const matrix: number[][] = [];

	// Initialize matrix
	for (let i = 0; i <= len1; i++) {
		matrix[i] = [i];
	}
	for (let j = 0; j <= len2; j++) {
		matrix[0][j] = j;
	}

	// Fill matrix
	for (let i = 1; i <= len1; i++) {
		for (let j = 1; j <= len2; j++) {
			if (str1[i - 1] === str2[j - 1]) {
				matrix[i][j] = matrix[i - 1][j - 1];
			} else {
				matrix[i][j] = Math.min(
					matrix[i - 1][j] + 1, // deletion
					matrix[i][j - 1] + 1, // insertion
					matrix[i - 1][j - 1] + 1 // substitution
				);
			}
		}
	}

	return matrix[len1][len2];
}

/**
 * Calculate similarity ratio between two strings (0-1, where 1 is identical)
 */
export function stringSimilarity(str1: string, str2: string): number {
	const maxLen = Math.max(str1.length, str2.length);
	if (maxLen === 0) return 1.0;
	const distance = levenshteinDistance(str1, str2);
	return 1 - distance / maxLen;
}

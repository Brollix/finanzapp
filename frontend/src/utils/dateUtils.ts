export const parseReceiptDate = (dateString: string): Date => {
	if (!dateString) return new Date(NaN);

	// Try standard parsing first (ISO format, etc.)
	const standardDate = new Date(dateString);
	if (!isNaN(standardDate.getTime())) {
		return standardDate;
	}

	// Handle DD/MM/YYYY HH:mm:ss format and variations like "30/11/2025, 11:53 a. m."
	try {
		// Remove commas and normalize spaces
		const cleanString = dateString
			.replace(/,/g, "")
			.replace(/\s+/g, " ")
			.trim();
		const parts = cleanString.split(" ");

		const datePart = parts[0]; // Should be DD/MM/YYYY
		const timePart = parts.length > 1 ? parts[1] : "00:00:00";

		// Check for AM/PM indicators
		const isPM =
			cleanString.toLowerCase().includes("p. m.") ||
			cleanString.toLowerCase().includes("pm");
		const isAM =
			cleanString.toLowerCase().includes("a. m.") ||
			cleanString.toLowerCase().includes("am");

		const [day, month, year] = datePart.split("/").map(Number);

		let hours = 0,
			minutes = 0,
			seconds = 0;

		if (timePart) {
			[hours, minutes, seconds] = timePart.split(":").map(Number);
		}

		// Handle 12-hour format
		if (isPM && hours < 12) {
			hours += 12;
		} else if (isAM && hours === 12) {
			hours = 0;
		}

		// Month is 0-indexed in JS Date
		const parsedDate = new Date(
			year,
			month - 1,
			day,
			hours || 0,
			minutes || 0,
			seconds || 0
		);

		return parsedDate;
	} catch (e) {
		console.warn("Error parsing date:", dateString, e);
		return new Date(NaN);
	}
};

/**
 * Formats a receipt date for display in 24-hour format
 * @param dateString - The date string from the receipt
 * @returns Formatted string in DD/MM/YYYY HH:MM format (24-hour)
 */
export const formatReceiptDateTime = (dateString: string): string => {
	const date = parseReceiptDate(dateString);

	if (isNaN(date.getTime())) {
		return dateString; // Return original if parsing failed
	}

	const day = String(date.getDate()).padStart(2, "0");
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const year = date.getFullYear();
	const hours = String(date.getHours()).padStart(2, "0");
	const minutes = String(date.getMinutes()).padStart(2, "0");

	return `${day}/${month}/${year} ${hours}:${minutes}`;
};

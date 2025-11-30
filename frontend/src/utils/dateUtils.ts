export const parseReceiptDate = (dateString: string): Date => {
	if (!dateString) return new Date(NaN);

	// Try standard parsing first (ISO format, etc.)
	const standardDate = new Date(dateString);
	if (!isNaN(standardDate.getTime())) {
		return standardDate;
	}

	// Handle DD/MM/YYYY HH:mm:ss format
	// Example: "16/09/2025 21:36:57"
	try {
		const [datePart, timePart] = dateString.split(" ");
		if (!datePart) return new Date(NaN);

		const [day, month, year] = datePart.split("/").map(Number);

		let hours = 0,
			minutes = 0,
			seconds = 0;
		if (timePart) {
			[hours, minutes, seconds] = timePart.split(":").map(Number);
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

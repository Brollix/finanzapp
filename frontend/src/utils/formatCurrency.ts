export const formatCurrency = (value: number): string => {
	// Truncate decimals
	const truncated = Math.trunc(value);
	// Format with dot as thousands separator
	return truncated.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

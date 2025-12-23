import { Receipt, Statistics } from "../types/receipt.types";

export const calculateStatistics = (receipts: Receipt[]): Statistics => {
	if (receipts.length === 0) {
		return {
			totalTickets: 0,
			totalSpent: 0,
			averageTicket: 0,
			totalItems: 0,
			mostFrequentSupermarket: "-",
			mostBoughtProduct: null,
			topProducts: [],
		};
	}

	const totalTickets = receipts.length;
	const totalSpent = receipts.reduce((sum, r) => sum + r.total, 0);
	const averageTicket = totalSpent / totalTickets;
	const totalItems = receipts.reduce(
		(sum, r) => sum + (r.items?.length || 0),
		0
	);

	// Find most frequent supermarket
	const supermarketCounts: { [key: string]: number } = {};
	receipts.forEach((r) => {
		supermarketCounts[r.supermarket] =
			(supermarketCounts[r.supermarket] || 0) + 1;
	});

	const mostFrequentSupermarket =
		Object.keys(supermarketCounts).length > 0
			? Object.entries(supermarketCounts).reduce((a, b) =>
					a[1] > b[1] ? a : b
				)[0]
			: "-";

	// Calculate product stats
	const productStats: {
		[key: string]: { count: number; totalSpent: number };
	} = {};

	receipts.forEach((r) => {
		r.items?.forEach((item) => {
			// Normalize product name to avoid duplicates due to casing or minor differences
			const brand = item.brand ? `${item.brand} ` : "";
			const name = `${brand}${item.product}`.trim();

			if (!productStats[name]) {
				productStats[name] = { count: 0, totalSpent: 0 };
			}
			productStats[name].count += item.quantity;
			productStats[name].totalSpent += item.price;
		});
	});

	const sortedProducts = Object.entries(productStats)
		.map(([name, stats]) => ({
			name,
			...stats,
		}))
		.sort((a, b) => b.count - a.count); // Sort by count descending

	const mostBoughtProduct =
		sortedProducts.length > 0 ? sortedProducts[0] : null;
	const topProducts = sortedProducts.slice(0, 10);

	return {
		totalTickets,
		totalSpent,
		averageTicket,
		totalItems,
		mostFrequentSupermarket,
		mostBoughtProduct,
		topProducts,
	};
};

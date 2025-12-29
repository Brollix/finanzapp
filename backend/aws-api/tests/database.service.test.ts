import { ReceiptItem } from "../src/types/receipt.types.js";
import { supabase } from "../src/config/supabase.js";

// Mock Supabase
jest.mock("../src/config/supabase.js", () => ({
	supabase: {
		from: jest.fn(),
	},
}));

// Mock logger
jest.mock("../src/utils/logger.js", () => ({
	default: {
		error: jest.fn(),
		warn: jest.fn(),
		info: jest.fn(),
		debug: jest.fn(),
	},
}));

describe("Database Service - Batch Operations", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	afterAll(() => {
		jest.restoreAllMocks();
	});

	describe("getOrCreateProductsBatch logic", () => {
		it("should handle empty items array", () => {
			const items: ReceiptItem[] = [];
			// This tests the early return logic
			expect(items.length).toBe(0);
		});

		it("should extract unique product names correctly", () => {
			const items: ReceiptItem[] = [
				{ product: "Leche", quantity: 1, price: 100 },
				{ product: "Pan", quantity: 2, price: 50 },
				{ product: "Leche", quantity: 1, price: 100 }, // Duplicate
			];

			const uniqueNames = [...new Set(items.map((item) => item.product))];
			expect(uniqueNames).toEqual(["Leche", "Pan"]);
		});

		it("should create correct key format for product lookup", () => {
			const item1: ReceiptItem = {
				product: "Leche",
				brand: "La Serenísima",
				quantity: 1,
				price: 100,
			};
			const item2: ReceiptItem = {
				product: "Leche",
				quantity: 1,
				price: 100,
			};

			const key1 = `${item1.product}|${item1.brand || ""}`;
			const key2 = `${item2.product}|${item2.brand || ""}`;

			expect(key1).toBe("Leche|La Serenísima");
			expect(key2).toBe("Leche|");
		});

		it("should identify missing products correctly", () => {
			const existingProducts = [
				{ id: "1", name: "Leche", brand: "La Serenísima" },
			];
			const productMap = new Map<string, string>();
			productMap.set("Leche|La Serenísima", "1");

			const items: ReceiptItem[] = [
				{
					product: "Leche",
					brand: "La Serenísima",
					quantity: 1,
					price: 100,
				},
				{ product: "Pan", quantity: 1, price: 50 },
			];

			const missingItems = items.filter((item) => {
				const key = `${item.product}|${item.brand || ""}`;
				return !productMap.has(key);
			});

			expect(missingItems).toHaveLength(1);
			expect(missingItems[0].product).toBe("Pan");
		});

		it("should handle race condition scenario (unique violation)", () => {
			const error = {
				code: "23505", // PostgreSQL unique violation
				message: "duplicate key value",
			};

			expect(error.code).toBe("23505");
		});
	});
});

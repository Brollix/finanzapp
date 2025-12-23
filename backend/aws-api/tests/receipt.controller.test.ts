import { Response } from "express";
import { AuthenticatedRequest } from "../src/middleware/auth.js";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import { ReceiptData } from "../src/types/receipt.types.js";

// Define schema locally to avoid importing controller dependencies
const ReceiptItemSchema = z.object({
	product: z.string(),
	quantity: z.number(),
	price: z.number(),
	discount: z.number().optional(),
	promotion: z.string().optional().nullable(),
	is_weight: z.boolean().optional(),
	brand: z.string().optional().nullable(),
});

const ReceiptDataSchema = z.object({
	supermarket: z.string(),
	datetime: z.string(),
	total: z.number().optional(),
	subtotal: z.number().optional(),
	items: z.array(ReceiptItemSchema).min(1),
	discounts: z.array(z.any()).optional(),
	total_saved: z.number().optional(),
});

describe("Receipt Controller - Validation", () => {
	describe("ReceiptDataSchema validation", () => {
		it("should validate correct receipt data", () => {
			const validData = {
				supermarket: "Carrefour",
				datetime: "01/01/2024 10:00:00",
				total: 1000.5,
				items: [
					{
						product: "Leche",
						quantity: 1,
						price: 100,
						brand: "La Serenísima",
					},
				],
			};

			const result = ReceiptDataSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it("should reject receipt without supermarket", () => {
			const invalidData = {
				datetime: "01/01/2024 10:00:00",
				total: 1000.5,
				items: [
					{
						product: "Leche",
						quantity: 1,
						price: 100,
					},
				],
			};

			const result = ReceiptDataSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		it("should reject receipt without items", () => {
			const invalidData = {
				supermarket: "Carrefour",
				datetime: "01/01/2024 10:00:00",
				total: 1000.5,
				items: [],
			};

			const result = ReceiptDataSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		it("should reject receipt with invalid item structure", () => {
			const invalidData = {
				supermarket: "Carrefour",
				datetime: "01/01/2024 10:00:00",
				total: 1000.5,
				items: [
					{
						// Missing required fields
						product: "Leche",
					},
				],
			};

			const result = ReceiptDataSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		it("should accept optional fields", () => {
			const validData = {
				supermarket: "Carrefour",
				datetime: "01/01/2024 10:00:00",
				total: 1000.5,
				subtotal: 1200,
				total_saved: 200,
				items: [
					{
						product: "Leche",
						quantity: 1,
						price: 100,
						discount: 10,
						promotion: "2x1",
						is_weight: false,
						brand: "La Serenísima",
					},
				],
				discounts: [
					{
						description: "Descuento especial",
						amount: 50,
					},
				],
			};

			const result = ReceiptDataSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});
	});

	describe("ReceiptDataSchema validation with ticket1 fixture", () => {
		let fixtureData: ReceiptData;

		beforeAll(async () => {
			// Load fixture data
			const fixturePath = path.join(
				__dirname,
				"fixtures/ticket1/receipt-data.json"
			);
			const fixtureJson = await fs.readFile(fixturePath, "utf-8");
			fixtureData = JSON.parse(fixtureJson);
		});

		it("should validate complex receipt with discounts", () => {
			const result = ReceiptDataSchema.safeParse(fixtureData);
			expect(result.success).toBe(true);
			if (!result.success) {
				console.error("Validation errors:", result.error.issues);
			}
		});

		it("should validate receipt with multiple items and discounts", () => {
			expect(fixtureData.items.length).toBeGreaterThan(10);
			expect(fixtureData.discounts).toBeDefined();
			expect(fixtureData.discounts!.length).toBeGreaterThan(0);

			const result = ReceiptDataSchema.safeParse(fixtureData);
			expect(result.success).toBe(true);
		});

		it("should validate receipt with item-level discounts", () => {
			const itemsWithDiscounts = fixtureData.items.filter(
				(item) => item.discount && item.discount > 0
			);
			expect(itemsWithDiscounts.length).toBeGreaterThan(0);

			// All items with discounts should have valid structure
			itemsWithDiscounts.forEach((item) => {
				const itemResult = ReceiptDataSchema.safeParse({
					supermarket: fixtureData.supermarket,
					datetime: fixtureData.datetime,
					total: fixtureData.total,
					items: [item],
				});
				expect(itemResult.success).toBe(true);
			});
		});

		it("should validate receipt with weight items", () => {
			const weightItems = fixtureData.items.filter(
				(item) => item.is_weight === true
			);
			expect(weightItems.length).toBeGreaterThan(0);

			// Weight items should have valid structure
			weightItems.forEach((item) => {
				expect(item.quantity).toBeLessThan(10); // Typically < 10kg
				expect(typeof item.is_weight).toBe("boolean");
				expect(item.is_weight).toBe(true);
			});
		});

		it("should validate discount structure", () => {
			expect(fixtureData.discounts).toBeDefined();
			fixtureData.discounts!.forEach((discount) => {
				expect(discount.description).toBeDefined();
				expect(typeof discount.description).toBe("string");
				expect(discount.description.length).toBeGreaterThan(0);
				expect(discount.amount).toBeDefined();
				expect(typeof discount.amount).toBe("number");
				expect(discount.amount).toBeGreaterThan(0);
			});
		});

		it("should validate receipt with brands", () => {
			const itemsWithBrands = fixtureData.items.filter(
				(item) => item.brand
			);
			expect(itemsWithBrands.length).toBeGreaterThan(0);

			itemsWithBrands.forEach((item) => {
				expect(typeof item.brand).toBe("string");
				expect(item.brand!.length).toBeGreaterThan(0);
			});
		});

		it("should validate receipt with promotions", () => {
			const itemsWithPromotions = fixtureData.items.filter(
				(item) => item.promotion
			);
			expect(itemsWithPromotions.length).toBeGreaterThan(0);

			itemsWithPromotions.forEach((item) => {
				expect(typeof item.promotion).toBe("string");
				expect(item.promotion!.length).toBeGreaterThan(0);
			});
		});
	});
});


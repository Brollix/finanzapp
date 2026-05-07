import fs from "fs/promises";
import path from "path";

// Mock p-retry to avoid ES module import issues
jest.mock("p-retry", () => {
	const mockRetry = jest.fn((fn) => fn());
	return {
		__esModule: true,
		default: mockRetry,
	};
});

import { extractTextFromImage } from "../../src/services/textract.service.js";
import { formatReceiptWithBedrock } from "../../src/services/bedrock.service.js";
import { ReceiptDataSchema } from "../../src/controllers/receipt.controller.js";
import { ReceiptData } from "../../src/types/receipt.types.js";

// Load expected fixture for comparison
const fixturesDir = path.join(__dirname, "../fixtures/ticket1");
let expectedReceiptData: ReceiptData;

beforeAll(async () => {
	// Load expected fixture
	const receiptDataJson = await fs.readFile(
		path.join(fixturesDir, "receipt-data.json"),
		"utf-8"
	);
	expectedReceiptData = JSON.parse(receiptDataJson);
});

/**
 * Integration tests that call real AWS services
 * 
 * WARNING: These tests make actual API calls to AWS Textract and Bedrock.
 * - They are slow (can take 30-60 seconds)
 * - They cost money (AWS API usage)
 * - Results may vary slightly due to AI model behavior
 * 
 * Run with: npm test -- receipt.integration.test.ts
 * Or skip by default and run manually when needed
 */
describe.skip("Receipt Processing Integration Tests (Real AWS)", () => {
	const samplesDir = path.join(__dirname, "../../../../samples");
	const ticketFile = "ticket1.jpeg";
	const ticketPath = path.join(samplesDir, ticketFile);

	beforeAll(() => {
		// Skip if AWS credentials are not configured
		if (
			!process.env.AWS_ACCESS_KEY_ID ||
			!process.env.AWS_SECRET_ACCESS_KEY
		) {
			console.warn(
				"⚠️  AWS credentials not configured. Skipping integration tests."
			);
		}
	});

	it("should process ticket1.jpeg through Textract and Bedrock", async () => {
		// Read image
		const imageBuffer = await fs.readFile(ticketPath);

		// Extract text with Textract
		const ocrText = await extractTextFromImage(imageBuffer);
		expect(ocrText).toBeDefined();
		expect(ocrText.length).toBeGreaterThan(0);
		expect(ocrText).toContain("Disco");

		// Format with Bedrock
		const receiptData = await formatReceiptWithBedrock(ocrText);
		expect(receiptData).toBeDefined();

		// Validate structure
		const validationResult = ReceiptDataSchema.safeParse(receiptData);
		expect(validationResult.success).toBe(true);
	}, 120000); // 2 minute timeout

	it("should extract correct supermarket name", async () => {
		const imageBuffer = await fs.readFile(ticketPath);
		const ocrText = await extractTextFromImage(imageBuffer);
		const receiptData = await formatReceiptWithBedrock(ocrText);

		expect(receiptData.supermarket).toBe("Disco Salguero");
	}, 120000);

	it("should extract correct datetime", async () => {
		const imageBuffer = await fs.readFile(ticketPath);
		const ocrText = await extractTextFromImage(imageBuffer);
		const receiptData = await formatReceiptWithBedrock(ocrText);

		expect(receiptData.datetime).toBe("21/11/2025 09:49:49");
	}, 120000);

	it("should extract all items", async () => {
		const imageBuffer = await fs.readFile(ticketPath);
		const ocrText = await extractTextFromImage(imageBuffer);
		const receiptData = await formatReceiptWithBedrock(ocrText);

		// Should have approximately the same number of items (AI may vary slightly)
		expect(receiptData.items.length).toBeGreaterThanOrEqual(20);
		expect(receiptData.items.length).toBeLessThanOrEqual(30);
	}, 120000);

	it("should extract discounts", async () => {
		const imageBuffer = await fs.readFile(ticketPath);
		const ocrText = await extractTextFromImage(imageBuffer);
		const receiptData = await formatReceiptWithBedrock(ocrText);

		// Should have discounts
		expect(receiptData.discounts).toBeDefined();
		expect(receiptData.discounts!.length).toBeGreaterThan(0);

		// Should have at least some items with discounts
		const itemsWithDiscounts = receiptData.items.filter(
			(item) => item.discount && item.discount > 0
		);
		expect(itemsWithDiscounts.length).toBeGreaterThan(0);
	}, 120000);

	it("should have correct total (within reasonable range)", async () => {
		const imageBuffer = await fs.readFile(ticketPath);
		const ocrText = await extractTextFromImage(imageBuffer);
		const receiptData = await formatReceiptWithBedrock(ocrText);

		// Total should be close to expected (within 1% tolerance for AI variation)
		const expectedTotal = expectedReceiptData.total ?? 0;
		const actualTotal = receiptData.total ?? 0;
		const tolerance = expectedTotal * 0.01; // 1% tolerance
		
		expect(actualTotal).toBeGreaterThanOrEqual(expectedTotal - tolerance);
		expect(actualTotal).toBeLessThanOrEqual(expectedTotal + tolerance);
	}, 120000);

	it("should have valid item structure", async () => {
		const imageBuffer = await fs.readFile(ticketPath);
		const ocrText = await extractTextFromImage(imageBuffer);
		const receiptData = await formatReceiptWithBedrock(ocrText);

		receiptData.items.forEach((item) => {
			expect(item.product).toBeDefined();
			expect(item.product.length).toBeGreaterThan(0);
			expect(typeof item.quantity).toBe("number");
			expect(item.quantity).toBeGreaterThan(0);
			expect(typeof item.price).toBe("number");
			expect(item.price).toBeGreaterThan(0);
		});
	}, 120000);

	it("should flag weight items correctly", async () => {
		const imageBuffer = await fs.readFile(ticketPath);
		const ocrText = await extractTextFromImage(imageBuffer);
		const receiptData = await formatReceiptWithBedrock(ocrText);

		const weightItems = receiptData.items.filter(
			(item) => item.is_weight === true
		);
		// Should have some weight items (cheese, salami, etc.)
		expect(weightItems.length).toBeGreaterThan(0);

		weightItems.forEach((item) => {
			// Weight items should have quantity < 10 (typically in kg)
			expect(item.quantity).toBeLessThan(10);
		});
	}, 120000);
});


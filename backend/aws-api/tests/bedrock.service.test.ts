import { parseArgentineNumber } from "../src/services/bedrock.service.js";

describe("parseArgentineNumber", () => {
	it("should parse Argentine format with thousands separator", () => {
		expect(parseArgentineNumber("1.234,56")).toBe(1234.56);
		expect(parseArgentineNumber("5.850,00")).toBe(5850.0);
		expect(parseArgentineNumber("10.000,50")).toBe(10000.5);
	});

	it("should parse numbers without thousands separator", () => {
		expect(parseArgentineNumber("123,45")).toBe(123.45);
		expect(parseArgentineNumber("50,00")).toBe(50.0);
	});

	it("should handle integer values", () => {
		expect(parseArgentineNumber("100")).toBe(100);
		expect(parseArgentineNumber("1.000")).toBe(1000);
	});

	it("should return number as-is if already a number", () => {
		expect(parseArgentineNumber(123.45)).toBe(123.45);
		expect(parseArgentineNumber(1000)).toBe(1000);
	});

	it("should return 0 for empty or invalid values", () => {
		expect(parseArgentineNumber("")).toBe(0);
		expect(parseArgentineNumber(null as any)).toBe(0);
		expect(parseArgentineNumber(undefined as any)).toBe(0);
		expect(parseArgentineNumber("invalid")).toBe(0);
	});

	it("should handle edge cases", () => {
		expect(parseArgentineNumber("0,00")).toBe(0);
		expect(parseArgentineNumber("0")).toBe(0);
		expect(parseArgentineNumber(",50")).toBe(0.5);
	});
});


import { parseArgentineNumber } from "../src/services/bedrock.service.js";

describe("Bedrock Service - Utility Functions", () => {
	describe("parseArgentineNumber", () => {
		it("should parse Argentine format with thousands separator", () => {
			expect(parseArgentineNumber("1.234,56")).toBe(1234.56);
		});

		it("should parse numbers without thousands separator", () => {
			expect(parseArgentineNumber("123,45")).toBe(123.45);
		});

		it("should handle integer values", () => {
			expect(parseArgentineNumber("100")).toBe(100);
		});

		it("should return number as-is if already a number", () => {
			expect(parseArgentineNumber(123.45)).toBe(123.45);
		});

		it("should return 0 for empty or invalid values", () => {
			expect(parseArgentineNumber("")).toBe(0);
			expect(parseArgentineNumber("abc")).toBe(0);
		});

		it("should handle edge cases", () => {
			expect(parseArgentineNumber("0,00")).toBe(0);
			expect(parseArgentineNumber("5.850,00")).toBe(5850.0);
		});

		it("should handle large numbers", () => {
			expect(parseArgentineNumber("59.144,30")).toBe(59144.3);
		});

		it("should handle numbers with only decimal part", () => {
			expect(parseArgentineNumber("0,50")).toBe(0.5);
		});
	});

	describe("Number format edge cases", () => {
		it("should handle numbers with multiple thousand separators", () => {
			expect(parseArgentineNumber("1.234.567,89")).toBe(1234567.89);
		});

		it("should handle numbers without decimal part", () => {
			expect(parseArgentineNumber("1.234")).toBe(1234);
		});

		it("should handle single digit decimals", () => {
			expect(parseArgentineNumber("123,5")).toBe(123.5);
		});
	});
});

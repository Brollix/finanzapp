import {
	parseError,
	parseReceiptError,
	parseAuthError,
	parseValidationError,
} from "../errorService";

describe("errorService", () => {
	describe("parseError", () => {
		it("should handle unknown errors", () => {
			const result = parseError("string error");

			expect(result.title).toBe("Ups, algo salió mal");
			expect(result.type).toBe("error");
		});

		it("should parse network errors", () => {
			const error = new Error("Network request failed");
			const result = parseError(error);

			expect(result.title).toBe("Error de Conexión");
			expect(result.message).toContain("conexión");
			expect(result.type).toBe("error");
		});

		it("should parse authentication errors", () => {
			const error = new Error("Unauthorized");
			const result = parseError(error);

			expect(result.title).toBe("Error de Autenticación");
			expect(result.type).toBe("error");
		});
	});

	describe("parseReceiptError", () => {
		it("should parse textract errors", () => {
			const error = new Error(
				"Receipt API error 500: errorType: textract_error"
			);
			const result = parseReceiptError(error);

			expect(result.title).toBe("Error de Lectura");
			expect(result.message).toContain("leer el texto");
		});

		it("should parse bedrock errors", () => {
			const error = new Error("Receipt API error 500: errorType: bedrock_error");
			const result = parseReceiptError(error);

			expect(result.title).toBe("Error de Procesamiento");
			expect(result.message).toContain("IA");
		});

		it("should parse rate limit errors", () => {
			const error = new Error("Receipt API error 429:");
			const result = parseReceiptError(error);

			expect(result.title).toBe("Límite Alcanzado");
			expect(result.type).toBe("warning");
		});

		it("should parse validation errors", () => {
			const error = new Error("Receipt API error 400:");
			const result = parseReceiptError(error);

			expect(result.title).toBe("Error de Validación");
			expect(result.type).toBe("warning");
		});
	});

	describe("parseAuthError", () => {
		it("should parse invalid credentials", () => {
			const error = new Error("Invalid credentials");
			const result = parseAuthError(error);

			expect(result.title).toBe("Credenciales Incorrectas");
			expect(result.message).toContain("correo o la contraseña");
		});

		it("should parse user not found", () => {
			const error = new Error("User not found");
			const result = parseAuthError(error);

			expect(result.title).toBe("Usuario No Encontrado");
		});

		it("should parse email already registered", () => {
			const error = new Error("Email already exists");
			const result = parseAuthError(error);

			expect(result.title).toBe("Email ya Registrado");
			expect(result.type).toBe("warning");
		});

		it("should parse expired session", () => {
			const error = new Error("Token expired");
			const result = parseAuthError(error);

			expect(result.title).toBe("Sesión Expirada");
			expect(result.type).toBe("warning");
		});
	});

	describe("parseValidationError", () => {
		it("should parse validation errors", () => {
			const error = new Error("Field is required");
			const result = parseValidationError(error);

			expect(result.title).toBe("Error de Validación");
			expect(result.message).toBe("Field is required");
			expect(result.type).toBe("warning");
		});

		it("should handle non-Error objects", () => {
			const result = parseValidationError("string error");

			expect(result.title).toBe("Error de Validación");
			expect(result.message).toContain("revisa los datos");
		});
	});
});


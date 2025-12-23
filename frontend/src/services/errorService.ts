/**
 * Error Service
 * 
 * Centraliza la lógica de manejo de errores del frontend,
 * convirtiendo respuestas de error del backend en mensajes amigables
 * para el usuario.
 */

export interface ParsedError {
	title: string;
	message: string;
	type: "error" | "warning" | "info";
}

export type ErrorType =
	| "textract_error"
	| "bedrock_error"
	| "database_error"
	| "validation_error"
	| "auth_error"
	| "rate_limit_error"
	| "network_error"
	| "unknown_error";

/**
 * Parsea un error y devuelve un mensaje amigable para el usuario
 */
export function parseError(error: unknown): ParsedError {
	// Error por defecto
	const defaultError: ParsedError = {
		title: "Ups, algo salió mal",
		message: "Ocurrió un error inesperado. Por favor, intenta de nuevo.",
		type: "error",
	};

	// Si no es un error, devolver por defecto
	if (!(error instanceof Error)) {
		return defaultError;
	}

	const errorMessage = error.message;

	// Detectar errores del backend (formato: "Receipt API error XXX: ...")
	if (errorMessage.includes("Receipt API error")) {
		return parseApiError(errorMessage);
	}

	// Errores de red
	if (
		errorMessage.includes("fetch") ||
		errorMessage.includes("Network request failed") ||
		errorMessage.includes("timeout")
	) {
		return {
			title: "Error de Conexión",
			message:
				"No se pudo conectar al servidor. Verifica tu conexión a internet.",
			type: "error",
		};
	}

	// Errores de autenticación
	if (
		errorMessage.includes("auth") ||
		errorMessage.includes("Authentication") ||
		errorMessage.includes("Unauthorized")
	) {
		return {
			title: "Error de Autenticación",
			message: "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
			type: "error",
		};
	}

	// Error por defecto
	return defaultError;
}

/**
 * Parsea errores del API backend
 */
function parseApiError(errorMessage: string): ParsedError {
	// Extraer el status code
	const statusMatch = errorMessage.match(/error (\d+):/);
	const status = statusMatch ? statusMatch[1] : "unknown";

	// Extraer el errorType
	const errorTypeMatch = errorMessage.match(/errorType: (\w+)/);
	const errorType = errorTypeMatch ? (errorTypeMatch[1] as ErrorType) : null;

	// Status 400 - Validación
	if (status === "400") {
		return {
			title: "Error de Validación",
			message:
				"La imagen no es clara o el formato no es válido. Por favor, intenta tomar una foto mejor iluminada.",
			type: "warning",
		};
	}

	// Status 429 - Rate limit
	if (status === "429") {
		return {
			title: "Límite Alcanzado",
			message:
				"Has alcanzado el límite de escaneos por ahora. Por favor, intenta más tarde.",
			type: "warning",
		};
	}

	// Status 500 - Errores del servidor
	if (status === "500") {
		return parseServerError(errorType, errorMessage);
	}

	// Error desconocido
	return {
		title: "Ups, algo salió mal",
		message: "Ocurrió un problema inesperado. Estamos trabajando en ello.",
		type: "error",
	};
}

/**
 * Parsea errores del servidor (500)
 */
function parseServerError(
	errorType: ErrorType | null,
	errorMessage: string
): ParsedError {
	// Si tenemos errorType, usarlo
	if (errorType === "textract_error") {
		return {
			title: "Error de Lectura",
			message:
				"No pudimos leer el texto del ticket. Asegúrate de que esté bien iluminado y enfocado.",
			type: "error",
		};
	}

	if (errorType === "bedrock_error") {
		return {
			title: "Error de Procesamiento",
			message:
				"La IA tuvo problemas para entender el ticket. Intenta tomar la foto desde otro ángulo.",
			type: "error",
		};
	}

	if (errorType === "database_error") {
		return {
			title: "Error de Guardado",
			message:
				"No se pudo guardar el ticket. Por favor, intenta de nuevo en unos momentos.",
			type: "error",
		};
	}

	if (errorType === "unknown_error") {
		return {
			title: "Ups, algo salió mal",
			message: "Ocurrió un problema inesperado. Estamos trabajando en ello.",
			type: "error",
		};
	}

	// Fallback: detección por texto (retrocompatibilidad)
	if (
		errorMessage.includes("Textract") ||
		errorMessage.includes("textract")
	) {
		return {
			title: "Error de Lectura",
			message:
				"No pudimos leer el texto del ticket. Asegúrate de que esté bien iluminado y enfocado.",
			type: "error",
		};
	}

	if (
		errorMessage.includes("Bedrock") ||
		errorMessage.includes("bedrock")
	) {
		return {
			title: "Error de Procesamiento",
			message:
				"La IA tuvo problemas para entender el ticket. Intenta tomar la foto desde otro ángulo.",
			type: "error",
		};
	}

	// Error genérico del servidor
	return {
		title: "Error del Servidor",
		message: "Ocurrió un problema en nuestros servidores. Estamos trabajando en ello.",
		type: "error",
	};
}

/**
 * Parsea errores específicos de receipts/tickets
 */
export function parseReceiptError(error: unknown): ParsedError {
	const parsed = parseError(error);

	// Mantener el mismo comportamiento pero con título específico
	if (parsed.title === "Ups, algo salió mal") {
		return {
			...parsed,
			title: "Error al procesar ticket",
			message:
				parsed.message ||
				"No se pudo procesar el ticket. Inténtalo de nuevo.",
		};
	}

	return parsed;
}

/**
 * Parsea errores de validación (formularios)
 */
export function parseValidationError(error: unknown): ParsedError {
	if (error instanceof Error) {
		return {
			title: "Error de Validación",
			message: error.message,
			type: "warning",
		};
	}

	return {
		title: "Error de Validación",
		message: "Por favor, revisa los datos ingresados.",
		type: "warning",
	};
}

/**
 * Parsea errores de autenticación
 */
export function parseAuthError(error: unknown): ParsedError {
	if (!(error instanceof Error)) {
		return {
			title: "Error de Autenticación",
			message: "Ocurrió un error al iniciar sesión. Intenta de nuevo.",
			type: "error",
		};
	}

	const message = error.message.toLowerCase();

	// Credenciales incorrectas
	if (
		message.includes("invalid") ||
		message.includes("incorrect") ||
		message.includes("wrong")
	) {
		return {
			title: "Credenciales Incorrectas",
			message: "El correo o la contraseña son incorrectos.",
			type: "error",
		};
	}

	// Usuario no encontrado
	if (message.includes("not found") || message.includes("doesn't exist")) {
		return {
			title: "Usuario No Encontrado",
			message: "No existe una cuenta con ese correo.",
			type: "error",
		};
	}

	// Email ya registrado
	if (message.includes("already") || message.includes("exists")) {
		return {
			title: "Email ya Registrado",
			message: "Ya existe una cuenta con ese correo.",
			type: "warning",
		};
	}

	// Sesión expirada
	if (message.includes("expired") || message.includes("token")) {
		return {
			title: "Sesión Expirada",
			message: "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
			type: "warning",
		};
	}

	// Error genérico de auth
	return {
		title: "Error de Autenticación",
		message: error.message || "Ocurrió un error. Por favor, intenta de nuevo.",
		type: "error",
	};
}


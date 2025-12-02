import rateLimit from "express-rate-limit";

export const apiLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

export const scanLimiter = rateLimit({
	windowMs: 60 * 60 * 1000, // 1 hour
	max: 10, // Limit each IP to 10 requests per `window` (here, per 1 hour)
	message: {
		error: "Too Many Requests",
		message: "Límite de escaneos excedido, espera una hora",
	},
	standardHeaders: true,
	legacyHeaders: false,
});

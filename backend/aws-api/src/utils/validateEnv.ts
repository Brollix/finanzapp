import { z, ZodError } from "zod";
import logger from "./logger.js";

const envSchema = z
	.object({
		PORT: z.string().default("8080"),
		NODE_ENV: z
			.enum(["development", "production", "test"])
			.default("development"),
		AWS_REGION: z.string().min(1),
		AWS_ACCESS_KEY_ID: z.string().min(1),
		AWS_SECRET_ACCESS_KEY: z.string().min(1),
		BEDROCK_MODEL_ID: z.string().min(1),
		SUPABASE_URL: z.string().url(),
		SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
		SUPABASE_ANON_KEY: z.string().min(1).optional(),
	})
	.refine((data) => data.SUPABASE_SERVICE_ROLE_KEY || data.SUPABASE_ANON_KEY, {
		message:
			"Either SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY must be set",
		path: ["SUPABASE_SERVICE_ROLE_KEY"],
	});

export const validateEnv = () => {
	try {
		const env = envSchema.parse(process.env);
		logger.info("Environment variables validated successfully");
		return env;
	} catch (error) {
		if (error instanceof ZodError) {
			logger.error("Invalid environment variables:");
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(error as any).errors.forEach((err: any) => {
				logger.error(`  ${err.path.join(".")}: ${err.message}`);
			});
			process.exit(1);
		}
		throw error;
	}
};

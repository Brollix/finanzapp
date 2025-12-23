import { Request, Response, NextFunction } from "express";
import { supabase } from "../config/supabase.js";
import logger from "../utils/logger.js";

export interface AuthenticatedRequest extends Request {
	user?: {
		id: string;
		email?: string;
	};
}

export const authenticate = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		const authHeader = req.headers.authorization;

		if (!authHeader) {
			res.status(401).json({ error: "Missing authorization header" });
			return;
		}

		const token = authHeader.split(" ")[1];

		if (!token) {
			res.status(401).json({ error: "Missing bearer token" });
			return;
		}

		const {
			data: { user },
			error,
		} = await supabase.auth.getUser(token);

		if (error || !user) {
			logger.error(`Auth error: ${error?.message || "Unknown error"}`);
			res.status(401).json({ error: "Invalid or expired token" });
			return;
		}

		req.user = {
			id: user.id,
			email: user.email,
		};

		next();
	} catch (error) {
		logger.error(
			`Auth middleware error: ${
				error instanceof Error ? error.message : String(error)
			}`
		);
		res
			.status(500)
			.json({ error: "Internal server error during authentication" });
	}
};

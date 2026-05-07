import dotenv from "dotenv";
dotenv.config();
import { createClient } from "@supabase/supabase-js";
import logger from "../utils/logger.js";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey =
	process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseKey) {
	throw new Error(
		"Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) in .env"
	);
}

const isServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
logger.info(
	`Supabase Client Initialized. Using Service Role Key: ${isServiceRole}`
);

// Global Service Role client for background tasks
export const supabase = createClient(supabaseUrl, supabaseKey);

// Auth client generator for RLS operations
export const createAuthClient = (token: string) => {
	const anonKey = process.env.SUPABASE_ANON_KEY || supabaseKey;
	return createClient(supabaseUrl, anonKey, {
		global: {
			headers: {
				Authorization: `Bearer ${token}`
			}
		}
	});
};

// Helper to check if Supabase is configured
export const isSupabaseConfigured = () => supabase !== null;

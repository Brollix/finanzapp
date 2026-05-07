import dotenv from "dotenv";
dotenv.config();
import { createClient } from "@supabase/supabase-js";
import logger from "../utils/logger.js";

const envUrl = process.env.SUPABASE_URL;
const supabaseUrl = (typeof envUrl === "string" && envUrl.length > 0) ? envUrl : "";

const envServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const envAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseKey = (typeof envServiceKey === "string" && envServiceKey.length > 0) 
	? envServiceKey 
	: (typeof envAnonKey === "string" && envAnonKey.length > 0) ? envAnonKey : "";

if (supabaseUrl.length === 0 || supabaseKey.length === 0) {
	throw new Error(
		"Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) in .env"
	);
}

const isServiceRole = typeof process.env.SUPABASE_SERVICE_ROLE_KEY === "string" && process.env.SUPABASE_SERVICE_ROLE_KEY.length > 0;
logger.info(
	`Supabase Client Initialized. Using Service Role Key: ${isServiceRole}`
);

// Global Service Role client for background tasks
export const supabase = createClient(supabaseUrl, supabaseKey);

// Auth client generator for RLS operations
export const createAuthClient = (token: string) => {
	const envAnon = process.env.SUPABASE_ANON_KEY;
	const anonKey = (typeof envAnon === "string" && envAnon.length > 0) ? envAnon : supabaseKey;
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

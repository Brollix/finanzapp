import dotenv from "dotenv";
dotenv.config();
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey =
	process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseKey) {
	throw new Error(
		"Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) in .env"
	);
}

const isServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
console.log(
	`Supabase Client Initialized. Using Service Role Key: ${isServiceRole}`
);

export const supabase = createClient(supabaseUrl, supabaseKey);

// Helper to check if Supabase is configured
export const isSupabaseConfigured = () => supabase !== null;

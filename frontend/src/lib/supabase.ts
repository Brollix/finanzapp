import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

// Leer variables de entorno (desde .env o process.env) o desde app.json extra
// Expo lee automáticamente EXPO_PUBLIC_* desde process.env en desarrollo
// También podemos leer desde app.json extra como respaldo
const supabaseUrl =
	process.env.EXPO_PUBLIC_SUPABASE_URL ||
	(Constants.expoConfig?.extra as any)?.EXPO_PUBLIC_SUPABASE_URL ||
	null;
const supabaseAnonKey =
	process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
	(Constants.expoConfig?.extra as any)?.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
	null;

// Verificar que las URLs no contengan placeholders
const cleanUrl = (supabaseUrl ?? "").replace(/\$\{.*?\}/g, "").trim();
const cleanKey = (supabaseAnonKey ?? "").replace(/\$\{.*?\}/g, "").trim();

// Validación mejorada de configuración
const isValidUrl =
	cleanUrl &&
	cleanUrl !== "" &&
	!cleanUrl.includes("localhost") &&
	cleanUrl.startsWith("http");
const isValidKey =
	cleanKey &&
	cleanKey !== "" &&
	cleanKey !== "public-anon-key" &&
	cleanKey.length > 20;

if (!isValidUrl || !isValidKey) {
	const missingVars = [];
	if (!isValidUrl) missingVars.push("EXPO_PUBLIC_SUPABASE_URL");
	if (!isValidKey) missingVars.push("EXPO_PUBLIC_SUPABASE_ANON_KEY");

	console.error(
		"⚠️ CONFIGURACIÓN DE SUPABASE INCOMPLETA ⚠️\n",
		`Variables faltantes o inválidas: ${missingVars.join(", ")}\n`,
		"La aplicación puede no funcionar correctamente.\n",
		"Por favor, configura las variables de entorno en tu archivo .env o app.json\n",
		`URL actual: ${cleanUrl || "NO CONFIGURADA"}\n`,
		`KEY actual: ${cleanKey ? `${cleanKey.slice(0, 10)}...` : "NO CONFIGURADA"}`
	);
} else {
	console.log("✓ Configuración de Supabase válida");
	console.log(`URL: ${cleanUrl.substring(0, 30)}...`);
	console.log(`KEY: ${cleanKey.slice(0, 10)}...`);
}

const finalUrl = cleanUrl || "http://localhost:54321";
const finalKey = cleanKey || "public-anon-key";

export const supabase = createClient(finalUrl, finalKey, {
	auth: {
		storage: AsyncStorage,
		autoRefreshToken: true,
		persistSession: true,
		detectSessionInUrl: false,
	},
});

// Exportar flag para verificar si la configuración es válida
export const isSupabaseConfigured = isValidUrl && isValidKey;

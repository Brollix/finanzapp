import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Usar directamente las variables de entorno o valores por defecto
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Verificar que las URLs no contengan placeholders
const cleanUrl = (supabaseUrl ?? '').replace(/\$\{.*?\}/g, '');
const cleanKey = (supabaseAnonKey ?? '').replace(/\$\{.*?\}/g, '');

console.log('URL-env:', supabaseUrl);
console.log('KEY-env:', supabaseAnonKey?.slice(0, 10)); // sólo los 10 primeros caracteres

if (!cleanUrl || !cleanKey) {
  console.warn('Supabase environment variables are missing. Using placeholder credentials – functionality may be limited.');
}

const finalUrl = cleanUrl || 'http://localhost:54321';
const finalKey = cleanKey || 'public-anon-key';
export const supabase = createClient(finalUrl, finalKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});

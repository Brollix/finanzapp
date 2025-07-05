import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Usar directamente las variables de entorno o valores por defecto
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Verificar que las URLs no contengan placeholders
const cleanUrl = supabaseUrl.replace(/\$\{.*?\}/g, '');
const cleanKey = supabaseAnonKey.replace(/\$\{.*?\}/g, '');

if (!cleanUrl || !cleanKey) {
  throw new Error('Missing Supabase configuration. Please check your environment variables.');
}

export const supabase = createClient(cleanUrl, cleanKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});

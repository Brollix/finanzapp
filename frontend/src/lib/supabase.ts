import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Usar directamente las variables de entorno o valores por defecto
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://bluhllaqxvvflaguamwe.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsdWhsbGFxeHZ2ZmxhZ3VhbXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5MDUzMTgsImV4cCI6MjA1NzQ4MTMxOH0.ms-6xCZRDm2BD1LvTCb9kt4-21CKpcolq07Crx3ggJw';

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

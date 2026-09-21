import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Safe fallback URL and key prevents top-level runtime crash if env vars are undefined
const supabaseUrl = (rawUrl && rawUrl.trim()) ? rawUrl.trim() : 'https://placeholder-instance.supabase.co';
const supabaseAnonKey = (rawKey && rawKey.trim()) ? rawKey.trim() : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder';

export const isSupabaseConfigured = Boolean(
  rawUrl && 
  rawKey && 
  !rawUrl.includes('your-project') &&
  !rawUrl.includes('placeholder')
);

if (!isSupabaseConfigured) {
  console.warn('[Supabase] Running in local/offline fallback mode. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY for live cloud DB.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

import { createClient } from '@supabase/supabase-js'

let _supabase = null;

const initSupabase = () => {
  if (_supabase) return _supabase;

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase configuration');
    return null;
  }

  try {
    if (typeof window !== 'undefined') {
      // Client-side initialization
      _supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
          storage: window.localStorage,
          storageKey: 'supabase.auth.token'
        }
      });
    } else {
      // Server-side initialization
      _supabase = createClient(supabaseUrl, supabaseAnonKey);
    }
    
    console.log('✅ Supabase client initialized');
    return _supabase;
  } catch (error) {
    console.error('❌ Failed to initialize Supabase:', error);
    return null;
  }
};

// Initialize immediately
const supabase = initSupabase();

// Export a function that ensures initialization
export const getSupabase = () => _supabase || initSupabase();

// Default export for backward compatibility
export { supabase };

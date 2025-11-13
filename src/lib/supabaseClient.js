import { createClient } from '@supabase/supabase-js';

// Singleton instance
let supabaseInstance = null;

// Safely get environment variables with fallbacks
const getEnv = (key, defaultValue = '') => {
  // Ensure we're in a browser environment
  if (typeof window === 'undefined') {
    return defaultValue;
  }
  
  try {
    return import.meta.env[key] || defaultValue;
  } catch (error) {
    console.warn(`[Supabase] Warning: Could not access environment variable ${key}`, error);
    return defaultValue;
  }
};

// Initialize Supabase client
const initSupabase = () => {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const supabaseUrl = getEnv('VITE_SUPABASE_URL');
  const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

  // Validate environment variables
  if (!supabaseUrl || !supabaseAnonKey) {
    const errorMsg = `[Supabase] Missing configuration:\n- VITE_SUPABASE_URL: ${supabaseUrl ? '✅' : '❌'}\n- VITE_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✅' : '❌'}`;
    console.error(errorMsg);
    throw new Error('Supabase configuration is missing. Please check your environment variables.');
  }

  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        redirectTo: `${window.location.origin}/auth/callback`,
        storage: window.localStorage,
        storageKey: 'supabase.auth.token',
        flowType: 'pkce', // Use PKCE for better security
      },
      global: {
        headers: {
          'X-Client-Info': 'HomeSwift/1.0.0',
        },
      },
    });

    // Add error logging for auth state changes
    supabaseInstance.auth.onAuthStateChange((event, session) => {
      console.log('[Supabase Auth] State changed:', event, session);
    });

    console.log('[Supabase] Client initialized successfully');
    return supabaseInstance;
  } catch (error) {
    console.error('[Supabase] Initialization error:', error);
    throw new Error(`Failed to initialize Supabase: ${error.message}`);
  }
};

// Initialize immediately if in browser
const supabase = typeof window !== 'undefined' ? initSupabase() : null;

export { supabase, initSupabase };

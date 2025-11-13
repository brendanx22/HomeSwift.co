import { createClient } from '@supabase/supabase-js';

// Safely get environment variables with fallbacks
const getEnv = (key, defaultValue = '') => {
  try {
    return import.meta.env[key] || defaultValue;
  } catch (error) {
    console.error(`Error accessing environment variable ${key}:`, error);
    return defaultValue;
  }
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

// Log environment variables (remove in production)
console.log('Supabase Config:', {
  url: supabaseUrl ? '✅ Found' : '❌ Missing',
  anonKey: supabaseAnonKey ? '✅ Found' : '❌ Missing',
  nodeEnv: getEnv('NODE_ENV', 'development')
});

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  const errorMsg = `Missing Supabase configuration:\n- VITE_SUPABASE_URL: ${supabaseUrl ? '✅' : '❌'}\n- VITE_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✅' : '❌'}`;
  console.error(errorMsg);
  throw new Error(errorMsg);
}

// Create Supabase client with error handling
let supabase;
try {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      redirectTo: `${window.location.origin}/auth/callback`,
      storage: window.localStorage,
      storageKey: 'supabase.auth.token'
    }
  });
  
  console.log('Supabase client initialized successfully');
} catch (error) {
  console.error('Failed to initialize Supabase client:', error);
  throw new Error(`Failed to initialize Supabase: ${error.message}`);
}

export { supabase };

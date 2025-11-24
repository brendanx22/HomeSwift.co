import { createClient } from '@supabase/supabase-js'

// Initialize with a function to avoid hoisting issues
const initSupabase = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  console.log('🔧 [Supabase] Initializing client...', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    urlPreview: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'MISSING',
    keyPreview: supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : 'MISSING',
    env: import.meta.env.MODE
  });

  // Validate environment variables
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ [Supabase] Missing configuration!', {
      supabaseUrl,
      supabaseAnonKey: supabaseAnonKey ? 'exists' : 'missing'
    });
    throw new Error('Missing Supabase configuration. Please check your environment variables.')
  }

  // Ensure window is available (for SSR/SSG)
  if (typeof window === 'undefined') {
    console.warn('Supabase is being initialized in a non-browser environment')
    return createClient(supabaseUrl, supabaseAnonKey)
  }

  console.log('✅ [Supabase] Client initialized successfully', {
    origin: window.location.origin
  });

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      redirectTo: `${window.location.origin}/auth/callback`,
      storage: window.localStorage,
      storageKey: 'supabase.auth.token',
      flowType: 'pkce'
    }
  })
}

export const supabase = initSupabase()

// Log the client configuration after initialization
console.log('📊 [Supabase] Client export complete', {
  clientExists: !!supabase,
  hasAuth: !!supabase?.auth,
  hasFrom: !!supabase?.from
});

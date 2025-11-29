import { createClient } from '@supabase/supabase-js'

// Initialize with a function to avoid hoisting issues
const initSupabase = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  // Validate environment variables
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase configuration. Please check your environment variables.')
  }

  // Ensure window is available (for SSR/SSG)
  if (typeof window === 'undefined') {
    console.warn('Supabase is being initialized in a non-browser environment')
    return createClient(supabaseUrl, supabaseAnonKey)
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      redirectTo: `${window.location.origin}/auth/callback`,
      storage: window.localStorage,
      storageKey: 'supabase.auth.token',
      flowType: 'pkce'
    },
    global: {
      headers: {
        'X-Client-Info': 'homeswift-web'
      }
    },
    db: {
      schema: 'public'
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  })
}

export const supabase = initSupabase()

/**
 * Ensure Supabase session is loaded before making queries
 * This fixes hanging queries that happen before auth is ready
 */
let sessionPromise = null;

export const ensureSession = async () => {
  if (sessionPromise) return sessionPromise;

  sessionPromise = supabase.auth.getSession().then(({ data: { session }, error }) => {
    if (error) {
      console.error('❌ Error getting Supabase session:', error);
    } else if (session) {
      console.log('✅ Supabase session loaded:', session.user.id);
    } else {
      console.log('ℹ️ No active Supabase session');
    }
    return session;
  });

  return sessionPromise;
}

// Call ensureSession immediately to pre-load the session
ensureSession();

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
  console.log('🔄 [ensureSession] Called');

  // If we already have a promise
  if (sessionPromise) {
    try {
      const session = await sessionPromise;
      // If we got a session, return it
      if (session) {
        console.log('✅ [ensureSession] Returning cached session');
        return session;
      }
      // If cached session was null, but we might have one now (e.g. after login)
      // We should try again.
      console.log('⚠️ [ensureSession] Cached session was null, checking again...');
      sessionPromise = null; // Reset to force new check
    } catch (e) {
      console.error('❌ [ensureSession] Cached promise error:', e);
      sessionPromise = null; // Reset on error
    }
  }

  console.log('🔍 [ensureSession] Fetching new session...');
  sessionPromise = supabase.auth.getSession().then(({ data: { session }, error }) => {
    if (error) {
      console.error('❌ [ensureSession] Error getting session:', error);
    } else if (session) {
      console.log('✅ [ensureSession] Session loaded:', session.user.id);
    } else {
      console.log('ℹ️ [ensureSession] No active session found');
    }
    return session;
  });

  return sessionPromise;
}

// Call ensureSession immediately to pre-load the session
ensureSession();

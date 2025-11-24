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
    }
  })
}

export const supabase = initSupabase()

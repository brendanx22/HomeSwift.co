import { supabase } from './supabaseClient';

/**
 * Hook to handle Google authentication
 * @returns {Object} Auth functions and state
 */
export const useGoogleAuth = () => {
  /**
   * Sign in with Google
   * @returns {Promise<{user: Object, session: Object, error: Error}>}
   */
  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin, // Redirect after successful login
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;
      return { user: data.user, session: data.session, error: null };
    } catch (error) {
      console.error('Error signing in with Google:', error);
      return { user: null, session: null, error };
    }
  };

  /**
   * Sign up with Google
   * This is similar to sign in since Supabase handles both with OAuth
   */
  const signUpWithGoogle = async () => {
    return signInWithGoogle();
  };

  /**
   * Sign out the current user
   * @returns {Promise<{error: Error}>}
   */
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Error signing out:', error);
      return { error };
    }
  };

  /**
   * Get the current user session
   * @returns {Promise<{user: Object, session: Object, error: Error}>}
   */
  const getSession = async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return { user: data?.session?.user || null, session: data?.session || null, error: null };
    } catch (error) {
      console.error('Error getting session:', error);
      return { user: null, session: null, error };
    }
  };

  return {
    signInWithGoogle,
    signUpWithGoogle,
    signOut,
    getSession,
  };
};

export default useGoogleAuth;

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
export { supabase };

// Create the auth context
export const AuthContext = createContext({
  user: null,
  loading: true,
  userType: null,
  isAuthenticated: false,
  isLandlord: false,
  isRenter: false,
  signUp: async () => {},
  signIn: async () => {},
  signOut: async () => {},
  resetPassword: async () => {},
  updatePassword: async () => {}
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState(null);
  const navigate = useNavigate();

  // Sign up a new user
  const signUp = async (email, password, userType, fullName) => {
    try {
      console.log('Signing up user with:', { email, userType, fullName });
      setLoading(true);
      
      // 1. Sign up the user with Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            full_name: fullName,
            user_type: userType,
            email: email // Ensure email is included in the user metadata
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (signUpError) {
        console.error('Auth signup error:', signUpError);
        throw signUpError;
      }

      console.log('Auth signup successful, creating profile...');

      // 2. Create user profile in the database
      const profileData = {
        id: authData.user.id,
        email: email,
        full_name: fullName,  // Match the database column name
        user_type: userType,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: profileResponse, error: profileError } = await supabase
        .from('user_profiles')
        .insert(profileData)
        .select();

      if (profileError) {
        console.error('Profile creation error:', profileError);
        
        // If profile creation fails, try to delete the auth user
        try {
          await supabase.auth.admin.deleteUser(authData.user.id);
        } catch (deleteError) {
          console.error('Error cleaning up auth user:', deleteError);
          // Even if cleanup fails, we should still show the original error
        }
        
        // Provide more specific error message based on the error code
        if (profileError.code === '23505') { // Unique violation
          throw new Error('This email is already registered. Please sign in instead.');
        } else if (profileError.code === '42501') { // Insufficient privilege
          throw new Error('Insufficient permissions to create user profile.');
        } else {
          throw new Error('Failed to create user profile. Please try again.');
        }
      }

      console.log('User profile created successfully:', profileResponse);
      return { 
        user: { 
          ...authData.user, 
          userType, 
          fullName, 
          email 
        }, 
        error: null 
      };
    } catch (error) {
      console.error('Signup error:', error);
      return { 
        user: null, 
        error: error.message || 'An unexpected error occurred during signup.' 
      };
    } finally {
      setLoading(false);
    }
  };

  // Sign in a user
  const signIn = async (email, password) => {
    try {
      setLoading(true);
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      // Fetch user profile including userType
      const profile = await fetchUserProfile(authData.user.id);
      setUser(authData.user);
      setUserType(profile?.user_type || null);

      // Redirect based on user type after sign in
      const redirectPath = profile?.user_type === 'landlord' ? '/landlord/dashboard' : '/chat';
      navigate(redirectPath, { replace: true });

      return { user: { ...authData.user, userType: profile?.user_type }, error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { user: null, error };
    } finally {
      setLoading(false);
    }
  };

  // Sign out the current user
  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Reset user state
      setUser(null);
      setUserType(null);

      // Redirect to home page after sign out
      navigate('/');
      
      return { error: null };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check active sessions and set the user
    const checkUser = async () => {
      try {
        setLoading(true);
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (session?.user) {
          const profile = await fetchUserProfile(session.user.id);
          setUser(session.user);
          setUserType(profile?.user_type || null);
        } else {
          setUser(null);
          setUserType(null);
        }
      } catch (error) {
        console.error('Error checking user session:', error);
        setUser(null);
        setUserType(null);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // Listen for changes in auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        setUser(session.user);
        setUserType(profile?.user_type || null);
        
        // Redirect based on user type after sign in
        if (event === 'SIGNED_IN') {
          const redirectPath = profile?.user_type === 'landlord' ? '/landlord/dashboard' : '/dashboard';
          navigate(redirectPath);
        }
      } else {
        setUser(null);
        setUserType(null);
      }
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Check if an email exists in the user_profiles table
  const checkEmailExists = async (email) => {
    try {
      const emailLower = email.toLowerCase();
      
      // Check in user_profiles table
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('email')
        .eq('email', emailLower)
        .maybeSingle();

      if (error) throw error;
      
      // If we find a profile, the email is considered taken
      if (profile) {
        return { 
          exists: true, 
          isVerified: true, // Assume verified if in user_profiles
          error: null 
        };
      }
      
      return { 
        exists: false, 
        isVerified: false,
        error: null 
      };
      
    } catch (error) {
      console.error('Error checking email:', error);
      return { 
        exists: false, 
        isVerified: false, 
        error: error.message 
      };
    }
  };

  const resendVerificationEmail = async (email) => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) throw error;
      return { success: true, error: null };
    } catch (error) {
      console.error('Error resending verification email:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to resend verification email' 
      };
    }
  };

  const value = {
    signUp,
    signIn,
    signOut,
    user,
    userType,
    loading,
    checkEmailExists,
    resendVerificationEmail,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};

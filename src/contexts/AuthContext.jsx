import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { authAPI } from '../utils/api';
import { supabase } from '../lib/supabaseClient';
import { identifyUser, resetUser, trackLogin, trackSignup, trackRoleSwitch } from '../lib/posthog';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [currentRole, setCurrentRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [, forceUpdate] = useState(); // Add forceUpdate hook

  // Derived state for full auth readiness - prevents race conditions
  // Only true when we have a user, roles are loaded, and current role is set
  const authReady = isAuthenticated && user && roles.length > 0 && currentRole;

  // Load user data from localStorage (for both regular login and OAuth)
  const loadUserData = useCallback(async () => {
    try {
      console.log('🔍 loadUserData - Checking authentication state...');

      // First, check if we have valid user data in localStorage
      const userDataString = localStorage.getItem('user');
      const savedRolesString = localStorage.getItem('userRoles');
      const savedRole = localStorage.getItem('currentRole');

      console.log('🔍 loadUserData - LocalStorage state:', {
        hasUserData: !!userDataString,
        userDataLength: userDataString?.length || 0,
        savedRolesLength: savedRolesString?.length || 0,
        savedRole: savedRole
      });

      if (!userDataString) {
        console.log('❌ No user data in localStorage');
        return false;
      }

      let userData;
      try {
        userData = JSON.parse(userDataString);
      } catch (parseError) {
        console.error('❌ Failed to parse user data from localStorage:', parseError);
        localStorage.removeItem('user');
        return false;
      }

      // Validate user data structure
      if (!userData || !userData.id || !userData.email) {
        console.log('❌ Invalid user data structure in localStorage');
        localStorage.removeItem('user');
        localStorage.removeItem('userRoles');
        localStorage.removeItem('currentRole');
        return false;
      }

      console.log('✅ Valid user data found in localStorage:', {
        id: userData.id,
        email: userData.email,
        userType: userData.user_metadata?.user_type
      });

      // Try to get Supabase session to validate
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.warn('⚠️ Supabase session error:', sessionError.message);
          // Continue with localStorage data for better UX
        } else if (sessionData?.session?.user?.id === userData.id) {
          console.log('✅ Active Supabase session matches localStorage user');
          setUser(sessionData.session.user);
          setIsAuthenticated(true);
          setLoading(false);
        } else {
          console.log('⚠️ No active Supabase session or mismatch, using localStorage data');
          setUser(userData);
          setIsAuthenticated(true);
        }

        // Set loading to false since we have user data
        setLoading(false);

        // Handle roles
        if (savedRolesString) {
          try {
            const savedRoles = JSON.parse(savedRolesString);
            if (Array.isArray(savedRoles) && savedRoles.length > 0) {
              console.log('✅ Using cached roles:', savedRoles);
              setRoles(savedRoles);
              const primaryRole = savedRoles.find(r => r.is_primary)?.role || savedRoles[0]?.role;
              console.log('Setting primary role to:', primaryRole);
              setCurrentRole(primaryRole);
              localStorage.setItem('currentRole', primaryRole);
              return true;
            }
          } catch (rolesError) {
            console.error('❌ Failed to parse saved roles:', rolesError);
          }
        }

        // Fallback: try to get currentRole from localStorage
        const savedCurrentRole = localStorage.getItem('currentRole');
        if (savedCurrentRole) {
          console.log('🔄 Using saved currentRole from localStorage:', savedCurrentRole);
          setCurrentRole(savedCurrentRole);
          setLoading(false);
          return true;
        }

        // Additional fallback: check user_type from metadata if roles aren't available yet
        const userType = userData.user_metadata?.user_type;
        if (userType && ['landlord', 'renter'].includes(userType)) {
          console.log('✅ Found required role in user metadata, allowing access');
          setLoading(false);
          if (userType === 'landlord' && !currentRole) {
            console.log('🔄 User has landlord metadata but no role assigned, assigning landlord role...');
            try {
              await addRole('landlord', userData.id);
              console.log('✅ Landlord role assigned successfully');
            } catch (error) {
              console.error('❌ Failed to assign landlord role:', error);
            }
          }
          return true;
        }

        // Fetch fresh roles from database
        console.log('🔄 Fetching fresh roles from database...');
        const rolesFetched = await fetchUserRoles(userData.id);
        if (rolesFetched) {
          console.log('✅ Fresh roles fetched successfully');
          return true;
        } else {
          console.log('⚠️ No roles found, assigning default role');
          const defaultRole = userData.user_metadata?.user_type === 'landlord' ? 'landlord' : 'renter';
          await addRole(defaultRole, userData.id);
          await fetchUserRoles(userData.id);
          return true;
        }

      } catch (supabaseError) {
        console.error('❌ Supabase session check failed:', supabaseError);
        // Fall back to localStorage data
        setUser(userData);
        setIsAuthenticated(true);

        if (savedRolesString) {
          try {
            const savedRoles = JSON.parse(savedRolesString);
            setRoles(savedRoles);
            setCurrentRole(savedRole || (savedRoles.find(r => r.is_primary)?.role || savedRoles[0]?.role));
          } catch (rolesError) {
            console.error('❌ Failed to load saved roles:', rolesError);
          }
        }

        return true; // Return true to indicate we have valid local data
      }

    } catch (error) {
      console.error('💥 Error in loadUserData:', error);
      return false;
    }
  }, []);

  // Update the primary role for a user
  const updatePrimaryRole = async (userId, role) => {
    try {
      console.log(`🔄 Updating primary role to ${role} for user ${userId}`);

      // First, set all roles to not primary
      const { error: updateError } = await supabase
        .from('user_roles')
        .update({ is_primary: false })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      // Then set the specified role as primary
      const { error: setError } = await supabase
        .from('user_roles')
        .update({ is_primary: true })
        .eq('user_id', userId)
        .eq('role', role);

      if (setError) throw setError;

      // Update local state
      const updatedRoles = await fetchUserRoles(userId);
      if (updatedRoles) {
        setCurrentRole(role);
        localStorage.setItem('currentRole', role);
        console.log(`✅ Successfully updated primary role to ${role}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Error updating primary role:', error);
      return false;
    }
  };

  // Fetch user roles from the database
  const fetchUserRoles = async (userId) => {
    try {
      console.log(`Fetching roles for user ${userId}`);

      // First, try to get roles directly from the user_roles table
      const { data: directRoles, error: directError } = await supabase
        .from('user_roles')
        .select('role, is_primary')
        .eq('user_id', userId)
        .order('is_primary', { ascending: false }); // Ensure primary role comes first

      if (!directError && directRoles?.length > 0) {
        console.log('Direct roles from user_roles table:', directRoles);

        // Update roles in state and localStorage
        setRoles(directRoles);
        localStorage.setItem('userRoles', JSON.stringify(directRoles));

        // Find the primary role or use the first role if no primary is set
        let primaryRole = directRoles.find(r => r.is_primary)?.role || directRoles[0]?.role;

        // Ensure we have a valid role
        if (!primaryRole) {
          console.warn('No valid role found, defaulting to renter');
          primaryRole = 'renter';
        }

        // Update current role in state and localStorage
        console.log('Setting primary role to:', primaryRole);
        setCurrentRole(primaryRole);
        localStorage.setItem('currentRole', primaryRole);

        // Dispatch event to notify other components about the role update
        window.dispatchEvent(new CustomEvent('role-updated'));

        return true;
      }

      // If no roles found via direct query, try the RPC function
      console.log('No roles found via direct query, trying RPC function');
      try {
        const { data: roles, error } = await supabase
          .rpc('get_user_roles', { user_id_param: userId });

        if (error) {
          console.error('Error fetching roles via RPC:', {
            code: error.code,
            details: error.details,
            message: error.message
          });
        } else if (roles?.length > 0) {
          console.log('Setting roles in state from RPC:', roles);
          setRoles(roles);
          const primaryRole = roles.find(r => r.is_primary)?.role || roles[0]?.role;
          console.log('Setting primary role to:', primaryRole);
          setCurrentRole(primaryRole);
          localStorage.setItem('userRoles', JSON.stringify(roles));
          localStorage.setItem('currentRole', primaryRole);
          return true;
        }
      } catch (rpcError) {
        console.error('Exception in RPC call:', rpcError);
      }

      // If we get here, no roles were found
      console.log('No roles found for user, initializing empty roles');
      setRoles([]);
      setCurrentRole(null);
      localStorage.removeItem('userRoles');
      localStorage.removeItem('currentRole');
      return false;

    } catch (error) {
      console.error('Error in fetchUserRoles:', error);
      // Ensure we don't get stuck in loading state
      setRoles([]);
      setCurrentRole(null);
      return false;
    }
  };

  // Sign up a new user using Supabase client-side auth
  const signup = async (userData) => {
    try {
      console.log('Starting signup with data:', userData);

      // Generate a unique agent ID for the user
      const { generateUniqueAgentId } = await import('../utils/agentId.js');
      const agentId = await generateUniqueAgentId();
      console.log('Generated agent ID:', agentId);

      // Use Supabase's client-side auth for signup to trigger email verification
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.full_name || `${userData.firstName} ${userData.lastName}`,
            user_type: userData.user_type || 'renter',
            agent_id: agentId, // Store the agent ID in user metadata
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error('Signup error:', error);
        let userFriendlyError = 'We encountered an issue creating your account. ';

        // Map common Supabase errors to friendly messages
        if (error.message.includes('already registered')) {
          userFriendlyError = 'This email is already registered. Please try logging in or use a different email.';
        } else if (error.message.includes('password')) {
          userFriendlyError = 'Please choose a stronger password (minimum 6 characters).';
        } else if (error.message.includes('email')) {
          userFriendlyError = 'Please enter a valid email address.';
        } else if (error.message.includes('network')) {
          userFriendlyError = 'Unable to connect to our servers. Please check your internet connection and try again.';
        }

        return {
          success: false,
          error: userFriendlyError,
          technicalError: error.message // Include original error for debugging
        };
      }

      // Check if email confirmation is required
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        return {
          success: false,
          error: 'This email is already registered. Please check your inbox for a verification email or try resetting your password.'
        };
      }

      console.log('Signup successful, check your email for verification');

      return {
        success: true,
        message: 'Almost there! We\'ve sent a verification link to your email. Please check your inbox (and spam folder) to complete your registration.',
        requiresVerification: true
      };

    } catch (error) {
      console.error('Signup error:', error);
      return {
        success: false,
        error: 'We apologize, but we encountered an unexpected error while creating your account. Our team has been notified. Please try again in a few minutes.',
        technicalError: error.message // Include original error for debugging
      };
    }
  };

  // Sign out the current user
  const logout = async () => {
    try {
      console.log('🔒 Starting logout process...');

      // First, try to sign out from Supabase
      console.log('🔐 Attempting to sign out from Supabase...');
      try {
        const { error } = await Promise.race([
          supabase.auth.signOut(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Sign out timed out')), 5000)
          )
        ]);

        if (error) {
          console.error('Supabase sign out error:', error);
          // Continue with local sign out even if Supabase fails
        } else {
          console.log('✅ Successfully signed out from Supabase');
        }
      } catch (signOutError) {
        console.error('Error during Supabase sign out:', signOutError);
        // Continue with local sign out even if Supabase fails
      }

      // Clear all auth related data from localStorage
      console.log('🧹 Clearing local storage...');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userRoles');
      localStorage.removeItem('currentRole');
      localStorage.removeItem('backendToken');

      // Reset all state
      console.log('🔄 Resetting application state...');
      setUser(null);
      setRoles([]);
      setCurrentRole(null);
      setIsAuthenticated(false);

      // Track logout event after clearing data
      console.log('📊 Tracking logout event...');
      resetUser();

      // Force a full page reload to ensure all state is cleared
      console.log('🔄 Reloading application...');
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      // Even if there's an error, we still want to clear the local state
      resetUser();
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userRoles');
      localStorage.removeItem('currentRole');
      localStorage.removeItem('backendToken'); // Clear backend token
      setUser(null);
      setRoles([]);
      setCurrentRole(null);
      setIsAuthenticated(false);
      window.location.href = '/';
    }
  };

  // Set up real-time subscriptions for user data updates
  useEffect(() => {
    if (!user?.id) return;

    console.log('🔄 Setting up real-time subscriptions for user:', user.id);

    // Subscribe to user profile changes
    const profileSubscription = supabase
      .channel(`user_profile_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_profiles',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔄 User profile updated:', payload);
          if (payload.new) {
            const updatedUser = {
              ...user,
              ...payload.new,
              user_metadata: {
                ...user?.user_metadata,
                user_type: payload.new.user_type
              },
              _updated: Date.now() // Force re-render
            };

            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            console.log('✅ Profile updated, state refreshed');
          }
        }
      )
      .subscribe();

    // Subscribe to user roles changes
    const rolesSubscription = supabase
      .channel(`user_roles_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_roles',
          filter: `user_id=eq.${user.id}`
        },
        async (payload) => {
          console.log('🔄 User roles updated:', payload);

          // Refetch all roles when any role changes
          const rolesUpdated = await fetchUserRoles(user.id);

          // Force a state update to trigger re-renders
          if (rolesUpdated) {
            console.log('✅ Roles refreshed, forcing state update');
            setUser(prev => ({ ...prev, _updated: Date.now() }));
          }
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      console.log('🧹 Cleaning up real-time subscriptions');
      supabase.removeChannel(profileSubscription);
      supabase.removeChannel(rolesSubscription);
    };
  }, [user?.id]);

  // Listen for custom rolesUpdated event from AuthCallback
  useEffect(() => {
    const handleRolesUpdated = async (event) => {
      console.log('🔄 Roles updated event received:', event.detail);
      if (event.detail?.userId && user?.id === event.detail.userId) {
        console.log('🔄 Refetching roles after update...');
        await fetchUserRoles(event.detail.userId);
      }
    };

    window.addEventListener('rolesUpdated', handleRolesUpdated);

    return () => {
      window.removeEventListener('rolesUpdated', handleRolesUpdated);
    };
  }, [user?.id]);

  // Sync current role from localStorage on mount
  useEffect(() => {
    const syncRoleFromLocalStorage = () => {
      try {
        const storedRole = localStorage.getItem('currentRole');
        const storedRoles = JSON.parse(localStorage.getItem('userRoles') || '[]');

        if (storedRole && storedRoles.some(r => r.role === storedRole)) {
          console.log('🔄 Syncing current role from localStorage:', storedRole);
          setCurrentRole(storedRole);
        } else if (storedRoles.length > 0) {
          // If no current role but we have roles, set the first one as current
          const firstRole = storedRoles[0].role;
          console.log('🔄 Setting first available role as current:', firstRole);
          setCurrentRole(firstRole);
          localStorage.setItem('currentRole', firstRole);
        }
      } catch (error) {
        console.error('❌ Error syncing role from localStorage:', error);
      }
    };

    // Initial sync
    syncRoleFromLocalStorage();

    // Also sync when the storage event is triggered from other tabs
    const handleStorageChange = (e) => {
      if (e.key === 'currentRole' || e.key === 'userRoles') {
        syncRoleFromLocalStorage();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Clean and safe Supabase auth listener
  useEffect(() => {
    console.log("🔄 Initializing lightweight auth listener...");

    const handleAuthStateChange = async (event, session) => {
      console.log("🔐 Auth event:", event);

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") {
        // If no user, set loading to false and return
        if (!session?.user) {
          console.log("ℹ️ No user in session, setting loading to false");
          setLoading(false);
          setIsAuthenticated(false);
          return;
        }

        // Check if we're in the middle of an OAuth flow with a pending user type
        const pendingUserType = localStorage.getItem('pendingUserType');
        
        // If there's a pending user type and we're on the callback page, let AuthCallback handle it
        if (pendingUserType && window.location.pathname === '/auth/callback') {
          console.log('🔄 OAuth flow in progress with pending type:', pendingUserType, '- letting AuthCallback handle it');
          setUser(session.user);
          setIsAuthenticated(true);
          setLoading(false);
          return; // Exit early, let AuthCallback handle role creation
        }

        try {
          setIsAuthenticated(true);
          setUser(session.user);

          // Always fetch roles after a valid session, with timeout protection
          try {
            await Promise.race([
              fetchUserRoles(session.user.id),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Role fetch timeout')), 5000)
              )
            ]);
          } catch (roleError) {
            console.error("⚠️ Role fetch failed or timed out:", roleError);
            // Continue anyway - roles might load later via other mechanisms
          }

          // Resolve metadata userType → currentRole
          const stored = localStorage.getItem("currentRole");
          const fallback = session.user.user_metadata?.user_type;

          if (stored) {
            setCurrentRole(stored);
          } else if (fallback) {
            setCurrentRole(fallback);
            localStorage.setItem("currentRole", fallback);
          }

          setLoading(false);
        } catch (error) {
          console.error("❌ Error in auth state handler:", error);
          setLoading(false); // Always set loading to false even on error
        }
      }

      if (event === "SIGNED_OUT") {
        setUser(null);
        setRoles([]);
        setCurrentRole(null);
        setIsAuthenticated(false);
        setLoading(false);

        localStorage.removeItem("user");
        localStorage.removeItem("userRoles");
        localStorage.removeItem("currentRole");
        localStorage.removeItem("pendingUserType");
      }
    };

    const { data: { subscription } } =
      supabase.auth.onAuthStateChange(handleAuthStateChange);

    // Do not manually re-check session — Supabase will call INITIAL_SESSION automatically

    return () => {
      subscription?.unsubscribe();
    };
  }, []);



  // Add a new role to the current user
  const addRole = async (role, userId = null) => {
    const targetUserId = userId || user?.id;
    if (!targetUserId) {
      console.error('No user ID provided for role assignment');
      return { success: false, error: 'No user ID provided' };
    }

    console.log(`Attempting to add role '${role}' to user ${targetUserId}`);

    // First, check if the user already has this role
    const { data: existingRoles, error: fetchError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', targetUserId)
      .eq('role', role);

    if (fetchError) {
      console.error('Error checking existing roles:', fetchError);
      return { success: false, error: 'Failed to check existing roles' };
    }

    if (existingRoles && existingRoles.length > 0) {
      console.log('Role already exists, updating to primary');

      // Update all roles for this user to set is_primary correctly
      const { error: updateError } = await supabase
        .from('user_roles')
        .update({ is_primary: false })
        .eq('user_id', targetUserId);

      if (updateError) throw updateError;

      // Set the selected role as primary
      const { error: setPrimaryError } = await supabase
        .from('user_roles')
        .update({ is_primary: true })
        .eq('user_id', targetUserId)
        .eq('role', role);

      if (setPrimaryError) throw setPrimaryError;

      return { success: true };
    }

    // If role doesn't exist, add it
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .insert([
          {
            user_id: targetUserId,
            role: role,
            is_primary: true
          }
        ])
        .select();

      console.log('Direct insert response:', { data, error });

      if (error) {
        console.log('Insert error details:', { code: error.code, message: error.message, details: error.details });
        // If duplicate key error or conflict error, the role already exists
        if (error.code === '23505' || error.message?.includes('duplicate key') || error.message?.includes('conflict')) {
          console.log('Role already exists, updating to primary');
          // Update all roles for this user to set is_primary correctly
          const { error: updateError } = await supabase
            .from('user_roles')
            .update({ is_primary: false })
            .eq('user_id', targetUserId);

          if (updateError) throw updateError;

          // Set the selected role as primary
          const { error: setPrimaryError } = await supabase
            .from('user_roles')
            .update({ is_primary: true })
            .eq('user_id', targetUserId)
            .eq('role', role);

          if (setPrimaryError) throw setPrimaryError;

          console.log('Updated existing role to primary');
        } else {
          throw error;
        }
      }

      // Refresh roles
      const rolesUpdated = await fetchUserRoles(targetUserId);
      console.log('Roles after update:', rolesUpdated ? 'Updated' : 'Failed to update');

      // If this is the current user, ensure React state is updated
      if (!userId && targetUserId === user?.id) {
        console.log('Updating React state for current user');
        // fetchUserRoles already updated localStorage and state
      }

      return { success: true };
    } catch (error) {
      console.error('Error in direct role assignment, trying RPC as fallback:', error);

      // Fallback to RPC if direct insert fails
      try {
        const { data, error: rpcError } = await supabase.rpc('add_user_role', {
          user_id_param: targetUserId,
          role_name: role,
          make_primary: true
        });

        if (rpcError) throw rpcError;

        // Refresh roles if this is the current user
        if (!userId) {
          await fetchUserRoles(targetUserId);
          console.log('Roles refreshed via RPC for current user');
        }

        return { success: true };
      } catch (rpcError) {
        console.error('Error in RPC role assignment:', {
          error: rpcError.message,
          code: rpcError.code,
          details: rpcError.details,
          userId: targetUserId,
          role: role
        });

        return {
          success: false,
          error: rpcError.message || 'Failed to assign role',
          details: rpcError
        };
      }
    }
  };

  // Get the user's current role
  const getCurrentRole = () => {
    return currentRole;
  };

  // Get all user roles
  const getUserRoles = () => {
    return [...roles];
  };

  // Switch the current user to a different role
  const switchRole = async (newRole) => {
    try {
      if (!user?.id) throw new Error('No user logged in');

      // Update the role in the database using the new function
      const { error } = await supabase.rpc('set_primary_role', {
        user_id_param: user.id,
        role_name: newRole
      });

      if (error) throw error;

      // Update local state
      setCurrentRole(newRole);
      localStorage.setItem('currentRole', newRole);

      // Update the primary role in the roles list
      setRoles(prevRoles =>
        prevRoles.map(role => ({
          ...role,
          is_primary: role.role === newRole
        }))
      );

      return { success: true };
    } catch (error) {
      console.error('Error switching role:', error);
      return { success: false, error: error.message };
    }
  };

  // Login user with Supabase
  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);

      console.log('AuthContext login called with:', credentials);

      // Store the user type in localStorage before authentication
      if (credentials.userType) {
        console.log(`Setting pending user type to: ${credentials.userType}`);
        localStorage.setItem('pendingUserType', credentials.userType);
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        console.error('Login error:', error);

        // Handle specific error cases
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password. Please try again.');
        } else if (error.message.includes('Email not confirmed')) {
          // Set flag to show resend verification option
          setShowResendVerification(true);
          throw new Error('Please verify your email before signing in. Check your inbox.');
        } else {
          throw error;
        }
      }

      const { user, session } = data;

      if (user) {
        // Ensure we have the latest user data
        const { data: { user: updatedUser } } = await supabase.auth.getUser();

        console.log('🔍 Login - User object before processing:', {
          id: user.id,
          email: user.email,
          metadata: user.user_metadata,
          fullMetadata: data.user
        });

        console.log('User object before metadata update:', user);

        // Ensure user_type is included in metadata if provided
        if (credentials.userType && !user.user_metadata?.user_type) {
          user.user_metadata = {
            ...user.user_metadata,
            user_type: credentials.userType
          };
          console.log('Updated user metadata with user_type:', credentials.userType);
        }

        // Ensure name fields are properly populated for display
        if (!user.user_metadata?.first_name || !user.user_metadata?.full_name) {
          // Try to derive names from stored data or create fallbacks
          let firstName = user.user_metadata?.first_name;
          let fullName = user.user_metadata?.full_name;

          if (!firstName && !fullName) {
            // If no name data exists, we need to handle this differently
            // For now, we'll leave it empty and let the dashboard handle it
            console.log('⚠️ No name data found in user metadata');
          } else if (!firstName && fullName) {
            // Derive first_name from full_name
            firstName = fullName.split(' ')[0];
            user.user_metadata = {
              ...user.user_metadata,
              first_name: firstName
            };
            console.log('✅ Derived first_name from full_name:', firstName);
          }

          // Update the user metadata in Supabase to persist any changes
          if (user.user_metadata && (user.user_metadata.first_name !== data.user.user_metadata?.first_name || user.user_metadata.full_name !== data.user.user_metadata?.full_name)) {
            try {
              const { error: updateError } = await supabase.auth.updateUser({
                data: user.user_metadata
              });
              if (updateError) {
                console.warn('Failed to update user metadata:', updateError);
              }
            } catch (updateError) {
              console.warn('Error updating user metadata:', updateError);
            }
          }
        }

        // Ensure agent_id is included in metadata for existing users
        if (!user.user_metadata?.agent_id) {
          const { generateUniqueAgentId } = await import('../utils/agentId.js');
          const agentId = await generateUniqueAgentId();
          user.user_metadata = {
            ...user.user_metadata,
            agent_id: agentId
          };
          console.log('Generated agent ID for existing user:', agentId);

          // Update the user metadata in Supabase to persist the agent ID
          try {
            const { error: updateError } = await supabase.auth.updateUser({
              data: user.user_metadata
            });
            if (updateError) {
              console.warn('Failed to update user metadata with agent ID:', updateError);
            }
          } catch (updateError) {
            console.warn('Error updating user metadata:', updateError);
          }
        }

        console.log('🔍 Final user object before storage:', {
          id: user.id,
          email: user.email,
          metadata: user.user_metadata
        });

        // Store the user in localStorage
        localStorage.setItem('user', JSON.stringify(user));
        console.log('User stored in localStorage');

        // Fetch user roles
        const hasRoles = await fetchUserRoles(user.id);
        console.log('Has roles:', hasRoles);

        // Get the current roles for comparison
        const currentRoles = JSON.parse(localStorage.getItem('userRoles') || '[]');

        if (!hasRoles) {
          // Assign default role based on userType or default to renter
          const defaultRole = credentials.userType === 'landlord' ? 'landlord' : 'renter';
          console.log(`No roles found, assigning default ${defaultRole} role`);
          await addRole(defaultRole, user.id);

          // After adding role, fetch and update state
          await fetchUserRoles(user.id);
          console.log('Roles updated after role assignment');
        } else {
          console.log('User already has roles:', hasRoles);
          // Check if the current primary role matches the expected role based on user_type
          const expectedRole = credentials.userType === 'landlord' ? 'landlord' : 'renter';
          const primaryRole = currentRoles.find(r => r.is_primary)?.role || currentRoles[0]?.role;

          if (primaryRole !== expectedRole) {
            console.log(`Primary role '${primaryRole}' doesn't match expected role '${expectedRole}' based on user_type`);

            // If the user has the expected role but it's not primary, make it primary
            const hasExpectedRole = currentRoles.some(r => r.role === expectedRole);

            if (hasExpectedRole) {
              console.log(`User has ${expectedRole} role but it's not primary, updating to primary`);
              try {
                // Update all roles to not be primary
                const { error: updatePrimaryError } = await supabase
                  .from('user_roles')
                  .update({ is_primary: false })
                  .eq('user_id', user.id);

                if (updatePrimaryError) throw updatePrimaryError;

                // Set the expected role as primary
                const { error: setPrimaryError } = await supabase
                  .from('user_roles')
                  .update({ is_primary: true })
                  .eq('user_id', user.id)
                  .eq('role', expectedRole);

                if (setPrimaryError) throw setPrimaryError;

                console.log(`✅ Successfully updated primary role to ${expectedRole}`);

                // Force refresh roles and update state
                const updated = await fetchUserRoles(user.id);

                if (updated) {
                  // Update the current role in both state and localStorage
                  setCurrentRole(expectedRole);
                  localStorage.setItem('currentRole', expectedRole);

                  // Force a re-render of protected routes
                  window.dispatchEvent(new Event('role-updated'));
                } else {
                  console.warn('Failed to update roles after setting primary role');
                }
              } catch (error) {
                console.error('Error updating primary role:', error);
                // Even if there's an error, we should still proceed with login
                // but log the error for debugging
              }
            } else {
              console.log(`User doesn't have ${expectedRole} role, adding it`);
              // Try using the RPC function first as it's more reliable for role management
              try {
                const { error: rpcError } = await supabase.rpc('add_user_role', {
                  p_user_id: user.id,
                  p_role: expectedRole,
                  p_is_primary: true
                });

                if (rpcError) throw rpcError;

                console.log('Successfully added role via RPC');
              } catch (rpcError) {
                console.error('RPC failed, falling back to direct insert:', rpcError);
                // Fall back to direct insert if RPC fails
                await addRole(expectedRole, user.id);
              }

              await fetchUserRoles(user.id);
            }
          }
        }

        // Update auth state
        setUser(user);
        setIsAuthenticated(true);

        // Get backend JWT token for API calls
        try {
          console.log('🔐 Getting backend JWT token...');
          // Force HTTPS to avoid mixed content errors
          const apiUrl = 'https://api.homeswift.co';
          const backendResponse = await fetch(`${apiUrl}/api/auth/signin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: user.email,
              password: credentials.password // Note: This is a security issue - should use a different approach
            })
          });

          const backendData = await backendResponse.json();

          if (backendResponse.ok && backendData.success) {
            console.log('✅ Backend JWT token obtained:', backendData.token ? 'Token received' : 'No token in response');
            // Store backend token in localStorage for API calls
            localStorage.setItem('backendToken', backendData.token);
          } else {
            console.warn('⚠️ Failed to get backend JWT token:', backendData.error);
            // Continue without backend token - some features may not work
          }
        } catch (backendError) {
          console.warn('⚠️ Error getting backend JWT token:', backendError);
          // Continue without backend token - some features may not work
        }

        return {
          success: true,
          user,
          message: 'Login successful! Redirecting...'
        };
      }

      return {
        success: false,
        error: 'Login failed. Please try again.'
      };

    } catch (error) {
      console.error('Login error:', error);
      setLoading(false);
      return {
        success: false,
        error: error.message || 'An unexpected error occurred. Please try again later.'
      };
    } finally {
      setLoading(false);
    }
  };

  // Check if user has a specific role
  const hasRole = (role) => {
    if (!role) return true;
    return roles.some(r => r.role === role);
  };

  // Check if user has any of the specified roles
  const hasAnyRole = (requiredRoles = []) => {
    if (!requiredRoles.length) return true;
    return roles.some(r => requiredRoles.includes(r.role));
  };

  // Update the current role in the UI (without changing it in the database)
  const updateCurrentRole = (role) => {
    if (roles.some(r => r.role === role)) {
      setCurrentRole(role);
      localStorage.setItem('currentRole', role);
      return true;
    }
    return false;
  };

  // Google OAuth login
  const loginWithGoogle = async (userType) => {
    try {
      console.log('🔐 Google OAuth - Starting with userType:', userType);

      // Store the user type in localStorage before redirect
      if (userType) {
        localStorage.setItem('pendingUserType', userType);
        console.log('✅ Stored pendingUserType in localStorage:', userType);
      } else {
        console.warn('⚠️ No userType provided to loginWithGoogle!');
      }

      // Verify it was stored
      const storedType = localStorage.getItem('pendingUserType');
      console.log('🔍 Verified pendingUserType in localStorage:', storedType);

      // Use Supabase's Google OAuth
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account', // Force account selection to ensure pendingUserType is used
          },
        }
      });

      if (error) {
        console.error('❌ Google OAuth error:', error);
        localStorage.removeItem('pendingUserType');
        return {
          success: false,
          error: 'Failed to initiate Google sign-in. Please try again.'
        };
      }

      console.log('✅ Google OAuth initiated successfully, redirecting to Google...');
      return {
        success: true,
        message: 'Redirecting to Google...'
      };

    } catch (error) {
      console.error('❌ Google OAuth error:', error);
      localStorage.removeItem('pendingUserType');
      return {
        success: false,
        error: 'An unexpected error occurred during Google sign-in.'
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authReady, // Expose authReady for components to wait on
        isAuthenticated,
        currentRole,
        roles,
        signup,
        login,
        loginWithGoogle,
        logout,
        updateCurrentRole,
        hasRole,
        hasAnyRole,
        addRole,
        getCurrentRole,
        getUserRoles,
        switchRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Helper hook to check if the current user has a specific role
export const useRole = (requiredRole) => {
  const { hasRole, currentRole } = useAuth();
  return {
    hasRole: hasRole(requiredRole),
    isCurrentRole: currentRole === requiredRole,
    currentRole
  };
};

// Helper hook to check if the current user has any of the specified roles
export const useAnyRole = (requiredRoles = []) => {
  const { hasAnyRole, currentRole } = useAuth();
  return {
    hasAnyRole: hasAnyRole(requiredRoles),
    currentRole,
    isInRole: requiredRoles.includes(currentRole)
  };
};

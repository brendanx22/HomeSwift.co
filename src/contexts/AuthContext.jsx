import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { authAPI } from '../utils/api';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [currentRole, setCurrentRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load user data from localStorage on initial load
  const loadUserData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const savedRoles = JSON.parse(localStorage.getItem('userRoles') || '[]');
      const savedRole = localStorage.getItem('currentRole');
      
      if (token && userData?.id) {
        try {
          // Verify the token is still valid
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) throw error;
          
          if (session) {
            // If we have saved roles, use them, otherwise fetch fresh
            if (savedRoles?.length > 0) {
              setRoles(savedRoles);
              setCurrentRole(savedRole || (savedRoles.find(r => r.is_primary)?.role || savedRoles[0]?.role));
              setUser(userData);
              setIsAuthenticated(true);
              return true;
            }
            
            // Fetch fresh roles if we don't have them
            const hasRoles = await fetchUserRoles(userData.id);
            if (hasRoles) {
              setUser(userData);
              setIsAuthenticated(true);
              return true;
            }
          }
        } catch (error) {
          console.error('Session validation error:', error);
          // If there's an error validating the session, log the user out
          logout();
        }
      }
      return false;
    } catch (error) {
      console.error('Error loading user data:', error);
      return false;
    }
  }, []);

  // Fetch user roles from the server
  const fetchUserRoles = async (userId) => {
    try {
      console.log(`Fetching roles for user ${userId}`);
      
      // First, try to get roles directly from the user_roles table
      const { data: directRoles, error: directError } = await supabase
        .from('user_roles')
        .select('role, is_primary')
        .eq('user_id', userId);

      if (!directError && directRoles?.length > 0) {
        console.log('Direct roles from user_roles table:', directRoles);
        setRoles(directRoles);
        const primaryRole = directRoles.find(r => r.is_primary)?.role || directRoles[0]?.role;
        console.log('Setting primary role to:', primaryRole);
        setCurrentRole(primaryRole);
        localStorage.setItem('userRoles', JSON.stringify(directRoles));
        localStorage.setItem('currentRole', primaryRole);
        return true;
      }

      // If direct query failed or returned no results, try the function
      console.log('No roles found via direct query, trying RPC function');
      const { data: roles, error } = await supabase
        .rpc('get_current_user_roles')
        .select('*');
      
      console.log('Roles from database function:', roles);
      
      if (error) {
        console.error('Error fetching roles via RPC:', {
          code: error.code,
          details: error.details,
          message: error.message
        });
        // Don't throw here, we'll try direct insert as last resort
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
      
      console.log('No roles found for user');
      return false;
    } catch (error) {
      console.error('Error fetching user roles:', error);
      return false;
    }
  };

  // Sign up a new user
  const signup = async (userData) => {
    try {
      console.log('Sending signup request with data:', userData);
      const response = await authAPI.signup(userData);
      console.log('Signup response:', response);
      
      if (response.success) {
        // The user data is in response.data in the backend response
        const user = response.data || response.user;
        
        if (!user) {
          console.error('No user data in response:', response);
          return { success: false, error: 'No user data received' };
        }
        
        console.log('User created successfully:', user);
        
        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(user));
        
        // Set auth state
        setUser(user);
        setIsAuthenticated(true);
        
        // Add default role based on signup type
        const role = userData.user_type || 'renter';
        console.log('Adding role:', role, 'for user:', user.id);
        
        const roleResult = await addRole(role, user.id);
        
        if (!roleResult.success) {
          console.warn('Role assignment failed, but user was created:', roleResult.error);
          // Continue even if role assignment fails, as the user is still created
        }
        
        // Refresh user data to include roles
        await fetchUserRoles(user.id);
        
        return { success: true, user };
      }
      
      return { 
        success: false, 
        error: response.error || response.message || 'Signup failed' 
      };
    } catch (error) {
      console.error('Signup error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || error.message || 'An error occurred during signup' 
      };
    }
  };

  // Sign out the current user
  const logout = async () => {
    try {
      // Clear all auth related data from localStorage first
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userRoles');
      localStorage.removeItem('currentRole');
      
      // Clear the Supabase session
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Reset all state
      setUser(null);
      setRoles([]);
      setCurrentRole(null);
      setIsAuthenticated(false);
      
      // Force a full page reload to ensure all state is cleared
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      // Even if there's an error, we still want to clear the local state
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userRoles');
      localStorage.removeItem('currentRole');
      setUser(null);
      setRoles([]);
      setCurrentRole(null);
      setIsAuthenticated(false);
      window.location.href = '/';
    }
  };

  // Check if user is logged in on initial load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const hasUserData = await loadUserData();
        
        if (!hasUserData) {
          // If no valid session or roles, clear auth state
          localStorage.removeItem('token');
          localStorage.removeItem('userRoles');
          localStorage.removeItem('currentRole');
          setUser(null);
          setRoles([]);
          setCurrentRole(null);
          setIsAuthenticated(false);
        } else {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [loadUserData]);

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
        // If duplicate key error, the role already exists
        if (error.code === '23505') {
          console.log('Role already exists, updating to primary');
          const { data: updateData, error: updateError } = await supabase
            .from('user_roles')
            .update({ is_primary: true })
            .eq('user_id', targetUserId)
            .eq('role', role)
            .select();

          if (updateError) throw updateError;
          console.log('Updated existing role to primary');
        } else {
          throw error;
        }
      }

      // Refresh roles
      const rolesUpdated = await fetchUserRoles(targetUserId);
      console.log('Roles after update:', rolesUpdated ? 'Updated' : 'Failed to update');

      return { success: true };
    } catch (error) {
      console.error('Error in direct role assignment, trying RPC as fallback:', error);
      
      // Fallback to RPC if direct insert fails
      try {
        const { data, error: rpcError } = await supabase.rpc('add_user_role', {
          p_user_id: targetUserId,
          p_role: role,
          p_is_primary: true
        });
        
        if (rpcError) throw rpcError;
        
        // Refresh roles if this is the current user
        if (!userId) {
          await fetchUserRoles(targetUserId);
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
      
      // Update the role in the database
      const { error } = await supabase.rpc('set_user_role', {
        p_user_id: user.id,
        p_role: newRole
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

  // Login user
  const login = async (credentials) => {
    try {
      const response = await authAPI.signin(credentials);
      
      if (response.data.success) {
        const { user, token } = response.data;
        
        // First, set the user data in localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        try {
          // Try to fetch user roles
          let hasRoles = await fetchUserRoles(user.id);
          
          // If no roles found, assign default 'renter' role
          if (!hasRoles) {
            console.log('No roles found, assigning default renter role');
            const roleResult = await addRole('renter', user.id);
            if (roleResult.success) {
              hasRoles = await fetchUserRoles(user.id);
            }
          }
          
          if (hasRoles) {
            // Now that we have roles, update the state
            setUser(user);
            setIsAuthenticated(true);
            return { success: true, user };
          } else {
            console.error('Failed to assign default role to user');
            throw new Error('Failed to assign default role');
          }
        } catch (roleError) {
          console.error('Role assignment error:', roleError);
          // Clean up on error
          logout();
          return { 
            success: false, 
            error: 'Unable to set up your account. Please contact support.' 
          };
        }
      }
      
      return { 
        success: false, 
        error: response.data.error || 'Login failed' 
      };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'An error occurred during login' 
      };
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

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        loading, 
        isAuthenticated, 
        currentRole,
        roles,
        signup, 
        login, 
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

export default AuthContext;

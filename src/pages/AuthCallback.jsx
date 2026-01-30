import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('Auth callback triggered');
        
        // Clear any existing errors
        setError('');

        // Helper to get session with retries
        const getSessionWithRetry = async (retries = 3, delay = 1000) => {
          for (let i = 0; i < retries; i++) {
            const { data, error } = await supabase.auth.getSession();
            if (!error && data?.session) {
              return { data, error: null };
            }
            if (i < retries - 1) {
              console.log(`Session check attempt ${i + 1} failed, retrying in ${delay}ms...`);
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }
          return { data: null, error: new Error('Failed to retrieve session after multiple attempts') };
        };

        // Give Supabase a moment to process the OAuth callback
        await new Promise(resolve => setTimeout(resolve, 500));

        // Get session with retry
        const { data, error: sessionError } = await getSessionWithRetry();

        if (sessionError || !data?.session) {
          console.error('Auth callback error:', sessionError);
          setError('Authentication failed. Please try again.');
          toast.error('Authentication failed. Please try again.');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        console.log('Auth callback successful, user authenticated');

        // Get user data
        const user = data.session.user;

        // Check for pending user type from Google OAuth flow
        const pendingUserType = localStorage.getItem('pendingUserType');
        console.log('🔍 Pending user type from OAuth:', pendingUserType);

        // Check if user profile exists
        const { data: userProfile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        console.log('🔍 Existing user profile:', userProfile);

        // PRIORITY:
        // 1. Pending User Type (Explicit intent from login/signup page) - WINS over everything to support multi-role accounts
        // 2. Existing Profile Type (Fallback)
        // 3. Metadata
        // 4. Default 'renter'
        
        let userType;
        if (pendingUserType) {
          userType = pendingUserType;
          console.log('✅ Using pending user type from OAuth (High Priority):', userType);
        } else if (userProfile?.user_type) {
          userType = userProfile.user_type;
          console.log('✅ Using existing profile user type:', userType);
        } else if (user.user_metadata?.user_type) {
          userType = user.user_metadata.user_type;
          console.log('✅ Using user metadata user type:', userType);
        } else {
          userType = 'renter';
          console.log('✅ Using default user type: renter');
        }
        
        let isNewUser = !userProfile;

        // Fetch existing user roles FIRST to check conflicts
        const { data: userRoles, error: rolesError } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', user.id);

        console.log('🔍 Existing user roles:', userRoles);
        
        // If user exists but using a new role (e.g. Renter logging in as Landlord)
        // We need to ensure they get the new role added
        const hasCurrentRole = userRoles?.some(r => r.role === userType);
        
        console.log(`🔍 Checking logic: Login intent='${userType}', Has role=${hasCurrentRole}`);

        // Update user metadata with current role intent for this session
        await supabase.auth.updateUser({
          data: { 
            current_role: userType,
            // If new user or adding role, we'll update 'roles' metadata later
          }
        });

        // Always attempt to upsert profile to ensure it exists
        const { error: upsertError } = await supabase
          .from('user_profiles')
          .upsert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.user_metadata?.name,
            avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
            // Only update user_type if it's a new user, otherwise keep original primary type
            // or if we want to migrate them. For now, let's preserve original type unless empty.
            ...(isNewUser ? { user_type: userType } : {})
          }, { onConflict: 'id' });

        if (upsertError) console.error('Error creating/updating user profile:', upsertError);

        // ROLE MANAGEMENT
        // 1. If user doesn't have the role, add it.
        // 2. If user has the role, ensure it's set as primary for this session
        if (!hasCurrentRole) {
          console.log(`🆕 Adding new role '${userType}' for existing user`);
          
          try {
            // Since the user is explicitly logging in as this role, we should make it PRIMARY
            // This ensures they stay in this context
            
            console.log(`🔄 Attempting to add '${userType}' via RPC first...`);
            
            // Try using RPC first - this is often more reliable with RLS
            // We'll try to use set_primary_role which might implicitly handle things or check specific rpcs
            
            // NOTE: Using a hypothetical 'add_user_role' RPC if exists, or just direct insert as fallback
            const { error: rpcError } = await supabase.rpc('add_user_role', {
              p_user_id: user.id,
              p_role: userType,
              p_is_primary: true
            });
            
            if (!rpcError) {
              console.log(`✅ Successfully added role via RPC`);
            } else {
              console.warn(`⚠️ RPC failed (${rpcError.message}), falling back to direct table manipulation`);
              
              // First, set all other roles to non-primary
              if (userRoles && userRoles.length > 0) {
                 await supabase
                  .from('user_roles')
                  .update({ is_primary: false })
                  .eq('user_id', user.id);
              }
              
              // Add new role as PRIMARY
              const { error: roleError } = await supabase
                .from('user_roles')
                .insert({
                  user_id: user.id,
                  role: userType,
                  is_primary: true 
                });
  
              if (roleError) console.error("Error inserting role:", roleError);
              else console.log(`✅ Successfully added extra role: ${userType} (Primary via Insert)`);
            }
            
            // Refresh roles list for local storage
            const updatedRoles = [...(userRoles || []).map(r => ({...r, is_primary: false})), { role: userType, is_primary: true }];
            localStorage.setItem('userRoles', JSON.stringify(updatedRoles));
            
          } catch (err) {
            console.error('Error managing roles:', err);
          }
        } else {
          console.log(`✅ User already has '${userType}' role, checking primary status`);
          
          const currentRole = userRoles.find(r => r.role === userType);
          
          // ALWAYS set as primary if explicitly logging in as this type
          if (currentRole && !currentRole.is_primary) {
            console.log(`🔄 Setting '${userType}' as primary role to match login intent`);
            
            // First, set all roles to non-primary
            await supabase
              .from('user_roles')
              .update({ is_primary: false })
              .eq('user_id', user.id);
              
            // Then set this role as primary
            await supabase
              .from('user_roles')
              .update({ is_primary: true })
              .eq('user_id', user.id)
              .eq('role', userType);
              
             // Refresh local userRoles to reflect change
             const updatedRoles = userRoles.map(r => ({
               ...r,
               is_primary: r.role === userType
             }));
             localStorage.setItem('userRoles', JSON.stringify(updatedRoles));
          } else {
             localStorage.setItem('userRoles', JSON.stringify(userRoles));
          }
        }

        // Force current role in local storage to match INTENT
        console.log(`🔄 Setting current active role to: ${userType}`);
        localStorage.setItem('currentRole', userType);
        
        // Store user data
        const userData = {
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name,
          avatar_url: user.user_metadata?.avatar_url,
          user_metadata: {
            ...user.user_metadata,
            current_role: userType
          }
        };
        localStorage.setItem('user', JSON.stringify(userData));

        // Clear pending intent
        if (pendingUserType) {
          localStorage.removeItem('pendingUserType');
        }

        // Ensure we have the latest roles
        const { data: finalRoles } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', user.id);

        if (finalRoles) {
          localStorage.setItem('userRoles', JSON.stringify(finalRoles));
          console.log('🔍 Final roles after update:', finalRoles);
        }

        // Update user metadata with current role
        await supabase.auth.updateUser({
          data: {
            current_role: userType,
            roles: finalRoles?.map(r => r.role) || []
          }
        });

        // Clear pending user type after successful role assignment
        if (pendingUserType) {
          localStorage.removeItem('pendingUserType');
          console.log('✅ Cleared pendingUserType from localStorage');
        }

        toast.success(isNewUser ? 'Account created successfully!' : 'Successfully authenticated!');

        // Determine redirect path based on user type
        let redirectPath = '/profile';
        
        // Always use the most specific path for the role
        switch(userType) {
          case 'landlord':
            redirectPath = '/landlord/dashboard';
            break;
          case 'renter':
            redirectPath = '/chat';
            break;
          default:
            redirectPath = '/profile';
        }
        
        console.log(`🔄 User is now '${userType}', redirecting to:`, redirectPath);
        
        // Set currentRole in localStorage to ensure persistence
        localStorage.setItem('currentRole', userType);
        console.log('✅ Set currentRole in localStorage:', userType);
        
        // Clear pendingUserType after successful processing
        localStorage.removeItem('pendingUserType');
        console.log('🧹 Cleared pendingUserType after successful OAuth');
        
        // Force state update before redirect
        setTimeout(() => {
          // Dispatch event to update all components
          window.dispatchEvent(new CustomEvent('authStateChanged', {
            detail: {
              user: {
                ...user,
                user_metadata: {
                  ...user.user_metadata,
                  current_role: userType
                }
              },
              currentRole: userType,
              isAuthenticated: true
            }
          }));
          
          // Force refresh any cached data
          window.dispatchEvent(new Event('storage'));
          
          // Navigate to the appropriate dashboard
          navigate(redirectPath, { 
            replace: true,
            state: { 
              forceRefresh: true,
              roleChanged: true
            } 
          });
        }, 100);

      } catch (err) {
        console.error('Unexpected error in auth callback:', err);
        setError('An unexpected error occurred. Please try again.');
        setTimeout(() => navigate('/login'), 3000);
      } finally {
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Processing authentication...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-red-600 mb-4">{error}</p>
          <p className="text-gray-500">Redirecting to login page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-green-600 mb-2">Authentication successful!</p>
        <p className="text-gray-500">Redirecting...</p>
      </div>
    </div>
  );
};

export default AuthCallback;

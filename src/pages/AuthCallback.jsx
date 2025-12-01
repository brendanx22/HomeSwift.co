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

        // Give Supabase a moment to process the OAuth callback
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Handle both email verification and OAuth callbacks
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Auth callback error:', error);
          setError('Authentication failed. Please try again.');
          toast.error('Authentication failed. Please try again.');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        if (data.session) {
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

          // Determine the user type for this login attempt
          // IMPORTANT: If pendingUserType exists, ALWAYS use it (user is trying to add/switch role)
          // Otherwise, use existing profile type
          let userType;
          if (pendingUserType) {
            userType = pendingUserType;
            console.log('✅ Using pending user type from OAuth:', userType);
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

          console.log('📋 Summary - User type:', userType, '| Is new user:', isNewUser, '| Has pending type:', !!pendingUserType);

          // Always create/update user profile
          const { error: upsertError } = await supabase
            .from('user_profiles')
            .upsert({
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || user.user_metadata?.name,
              avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
              user_type: userType,
              updated_at: new Date().toISOString()
            }, { onConflict: 'id' });

          if (upsertError) {
            console.error('Error creating/updating user profile:', upsertError);
          }

          // Update user metadata
          const { error: updateError } = await supabase.auth.updateUser({
            data: { user_type: userType }
          });

          if (updateError) {
            console.error('Error updating user metadata:', updateError);
          }

          // Fetch existing user roles FIRST before using them
          const { data: userRoles, error: rolesError } = await supabase
            .from('user_roles')
            .select('*')
            .eq('user_id', user.id);

          console.log('🔍 Existing user roles:', userRoles);
          console.log('🔍 Checking if user has role:', userType);

          // Check if user already has the current role
          const hasCurrentRole = userRoles?.some(r => r.role === userType);
          console.log('🔍 Has current role?', hasCurrentRole);

          // Store user in localStorage for consistency
          const userData = {
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.user_metadata?.name,
            avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
            user_metadata: {
              ...user.user_metadata,
              user_type: userType,
              // Store all roles in user metadata for quick access
              roles: [...new Set([
                ...(userRoles?.map(r => r.role) || []),
                ...(hasCurrentRole ? [] : [userType])
              ])]
            }
          };
          localStorage.setItem('user', JSON.stringify(userData));
          
          // Always update the current role in localStorage to match the login type
          console.log(`🔄 Setting current role to: ${userType}`);
          localStorage.setItem('currentRole', userType);
          
          // If user doesn't have this role yet, add it
          if (!hasCurrentRole) {
            console.log(`🆕 Adding new role '${userType}' for user`);
            
            try {
              // Add the new role as primary if it's the first role, otherwise non-primary
              const isFirstRole = !userRoles || userRoles.length === 0;
              
              const { data: insertedRole, error: roleError } = await supabase
                .from('user_roles')
                .insert({
                  user_id: user.id,
                  role: userType,
                  is_primary: isFirstRole
                })
                .select()
                .single();

              if (roleError) throw roleError;
              
              console.log(`✅ Successfully added '${userType}' role:`, insertedRole);
              
              // If we added a new role, update the user_metadata with all roles
              if (insertedRole) {
                const allRoles = [...(userRoles || []).map(r => r.role), userType];
                await supabase.auth.updateUser({
                  data: { 
                    roles: allRoles,
                    current_role: userType
                  }
                });
                
                console.log('🔄 Updated user metadata with roles:', allRoles);
              }
              
            } catch (error) {
              console.error('❌ Error in role management:', error);
              // If role already exists (race condition), continue
              if (!error.message.includes('duplicate key')) {
                throw error;
              }
            }
          } else {
            console.log(`✅ User already has '${userType}' role, updating as current`);
            
            // Update the current role in the database
            await supabase.auth.updateUser({
              data: { 
                current_role: userType
              }
            });
            
            // Set this role as primary if it's not already
            const currentRole = userRoles.find(r => r.role === userType);
            if (currentRole && !currentRole.is_primary) {
              console.log(`🔄 Setting '${userType}' as primary role`);
              
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
            }

            // Refetch roles after adding new one
            const { data: updatedRoles } = await supabase
              .from('user_roles')
              .select('*')
              .eq('user_id', user.id);

            console.log('🔍 Updated roles after insert:', updatedRoles);

            if (updatedRoles) {
              localStorage.setItem('userRoles', JSON.stringify(updatedRoles));
              localStorage.setItem('currentRole', userType);
              console.log('✅ Stored updated roles in localStorage');
              
              // Dispatch custom event to notify auth context to refetch roles
              window.dispatchEvent(new CustomEvent('rolesUpdated', { detail: { userId: user.id } }));
            }
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

          // Get backend token for the authenticated user
          try {
            const response = await fetch('https://api.homeswift.co/api/auth/token', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ user_id: user.id }),
              credentials: 'include'
            });

            if (response.ok) {
              const data = await response.json();
              if (data.token) {
                localStorage.setItem('backendToken', data.token);
                console.log('Backend token stored successfully');
              }
            }
          } catch (err) {
            console.warn('Could not get backend token, continuing with Supabase auth only:', err);
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
        } else {
          console.log('No active session in callback');

          // Try multiple approaches to get the session
          let sessionAttempts = 0;
          const maxAttempts = 3;

          while (sessionAttempts < maxAttempts) {
            sessionAttempts++;
            console.log(`Session attempt ${sessionAttempts}/${maxAttempts}`);

            // Wait a bit between attempts
            await new Promise(resolve => setTimeout(resolve, 1000));

            const { data: retryData, error: retryError } = await supabase.auth.getSession();

            if (retryError) {
              console.error(`Session attempt ${sessionAttempts} error:`, retryError);
              continue;
            }

            if (retryData.session) {
              console.log(`Session found on attempt ${sessionAttempts}`);
              // Process the session
              const user = retryData.session.user;
              const userData = {
                id: user.id,
                email: user.email,
                ...user.user_metadata
              };
              localStorage.setItem('user', JSON.stringify(userData));

              // Try backend token
              try {
                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'https://api.homeswift.co'}/api/auth/token`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ user_id: user.id }),
                  credentials: 'include'
                });

                if (response.ok) {
                  const data = await response.json();
                  if (data.token) {
                    localStorage.setItem('backendToken', data.token);
                  }
                }
              } catch (err) {
                console.warn('Backend token failed:', err);
              }

              toast.success('Successfully authenticated!');
              const userType = user.user_metadata?.user_type || 'renter';
              const redirectPath = userType === 'landlord' ? '/landlord/dashboard' : '/chat';
              console.log('🔄 Redirecting to:', redirectPath);
              navigate(redirectPath, { replace: true });
              return;
            }
          }

          setError('No active session found after multiple attempts. Please try logging in again.');
          setTimeout(() => navigate('/login'), 3000);
        }
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

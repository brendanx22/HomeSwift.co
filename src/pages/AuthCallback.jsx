import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Get userType from URL parameters (for Google OAuth)
  const userType = searchParams.get('userType');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('Auth callback triggered with userType:', userType);

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

          // Calculate final user type first
          const finalUserType = userType || user.user_metadata?.user_type || 'renter';

          // Update user metadata with user_type if provided
          if (userType && !user.user_metadata?.user_type) {
            try {
              const { error: updateError } = await supabase.auth.updateUser({
                data: {
                  ...user.user_metadata,
                  user_type: userType
                }
              });

              if (updateError) {
                console.warn('Failed to update user metadata with user_type:', updateError);
              } else {
                console.log('Updated user metadata with user_type:', userType);
                // Update local user object
                user.user_metadata = {
                  ...user.user_metadata,
                  user_type: userType
                };
              }
            } catch (updateError) {
              console.warn('Error updating user metadata:', updateError);
            }
          }

          // Store user in localStorage for consistency
          const userData = {
            id: user.id,
            email: user.email,
            user_metadata: {
              ...user.user_metadata,
              user_type: finalUserType // Ensure user_type is in metadata
            }
          };
          localStorage.setItem('user', JSON.stringify(userData));

          // Try to get backend token for the authenticated user
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

          // Check if user profile exists and determine user type
          const { data: userProfile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') {
            console.error('Error fetching user profile:', profileError);
          }

          // Handle role assignment based on user type
          try {
            // Check if user already has roles
            const { data: existingRoles, error: rolesError } = await supabase
              .from('user_roles')
              .select('*')
              .eq('user_id', user.id);

            if (rolesError) {
              console.error('Error fetching user roles:', rolesError);
            }

            console.log('Role assignment - finalUserType:', finalUserType);
            console.log('Role assignment - userType parameter:', userType);
            console.log('Role assignment - existingRoles:', existingRoles);

            if (!existingRoles || existingRoles.length === 0) {
              // Assign default role based on userType
              console.log(`No roles found, assigning default ${finalUserType} role`);
              try {
                const { error: roleError } = await supabase.rpc('add_user_role', {
                  p_user_id: user.id,
                  p_role: finalUserType,
                  p_is_primary: true
                });

                if (roleError) {
                  console.error('RPC error assigning role:', roleError);
                } else {
                  console.log('✅ Successfully assigned role via RPC');
                }
              } catch (rpcError) {
                console.error('Error in RPC role assignment:', rpcError);
              }
            } else {
              console.log('User already has roles:', existingRoles);

              // Check if the current primary role matches the expected role
              const primaryRole = existingRoles.find(r => r.is_primary)?.role || existingRoles[0]?.role;

              if (primaryRole !== finalUserType) {
                console.log(`Primary role '${primaryRole}' doesn't match expected role '${finalUserType}'`);

                // Update roles to make the expected role primary
                if (existingRoles.some(r => r.role === finalUserType)) {
                  // User has the role but it's not primary - use RPC function
                  console.log(`🔄 Using RPC to set ${finalUserType} as primary role`);
                  try {
                    const { error: rpcError } = await supabase.rpc('set_primary_role', {
                      user_id_param: user.id,
                      role_name: finalUserType
                    });

                    if (rpcError) {
                      console.error('RPC error setting primary role:', rpcError);
                    } else {
                      console.log('✅ Successfully set primary role via RPC');
                    }
                  } catch (rpcError) {
                    console.error('Error in RPC role update:', rpcError);
                  }
                } else {
                  // User doesn't have the expected role, add it
                  console.log(`🔄 Adding new role ${finalUserType}`);
                  try {
                    const { error: rpcError } = await supabase.rpc('add_user_role', {
                      p_user_id: user.id,
                      p_role: finalUserType,
                      p_is_primary: true
                    });

                    if (rpcError) {
                      console.error('RPC error adding role:', rpcError);
                    } else {
                      console.log('✅ Successfully added role via RPC');
                    }
                  } catch (rpcError) {
                    console.error('Error in RPC role add:', rpcError);
                  }
                }
              } else {
                console.log(`Primary role '${primaryRole}' already matches expected role '${finalUserType}'`);
              }
            }
          } catch (roleError) {
            console.error('Error handling user roles:', roleError);
          }

          toast.success('Successfully authenticated!');

          // Redirect based on user type
          const redirectPath = finalUserType === 'landlord' ? '/landlord/dashboard' : '/chat';

          // Trigger AuthContext to re-check authentication state
          window.dispatchEvent(new CustomEvent('auth-callback-complete', {
            detail: { userType: finalUserType }
          }));

          setTimeout(() => navigate(redirectPath), 2000);
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
                user_metadata: {
                  ...user.user_metadata,
                  user_type: userType || user.user_metadata?.user_type || 'renter' // Include user_type from parameter
                }
              };
              localStorage.setItem('user', JSON.stringify(userData));

              // Try backend token
              try {
                const response = await fetch('https://api.homeswift.co/api/auth/token', {
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
              const finalUserType = userType || user.user_metadata?.user_type || 'renter';
              const redirectPath = finalUserType === 'landlord' ? '/landlord/dashboard' : '/chat';

              // Trigger AuthContext to re-check authentication state
              window.dispatchEvent(new CustomEvent('auth-callback-complete', {
                detail: { userType: finalUserType }
              }));

              setTimeout(() => navigate(redirectPath), 2000);
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
  }, [navigate, userType]);

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

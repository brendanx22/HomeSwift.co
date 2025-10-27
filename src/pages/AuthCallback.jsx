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
          console.log('Pending user type from OAuth:', pendingUserType);

          // Check if user profile exists
          const { data: userProfile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          // Determine the user type for this login attempt
          let userType = pendingUserType || userProfile?.user_type || user.user_metadata?.user_type || 'renter';
          let isNewUser = !userProfile;

          console.log('User type for this login:', userType, '| Is new user:', isNewUser);

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

          // Clear pending user type
          localStorage.removeItem('pendingUserType');

          // Store user in localStorage for consistency
          const userData = {
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.user_metadata?.name,
            avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
            user_metadata: {
              ...user.user_metadata,
              user_type: userType
            }
          };
          localStorage.setItem('user', JSON.stringify(userData));

          // Fetch existing user roles
          const { data: userRoles, error: rolesError } = await supabase
            .from('user_roles')
            .select('*')
            .eq('user_id', user.id);

          console.log('Existing user roles:', userRoles);

          // Check if user already has the current role
          const hasCurrentRole = userRoles?.some(r => r.role === userType);
          
          if (!hasCurrentRole) {
            console.log(`Adding new role '${userType}' for user`);
            
            // Determine if this should be primary (first role or no primary exists)
            const hasPrimaryRole = userRoles?.some(r => r.is_primary);
            const shouldBePrimary = !hasPrimaryRole || isNewUser;

            // Add the new role
            const { error: roleError } = await supabase
              .from('user_roles')
              .insert({
                user_id: user.id,
                role: userType,
                is_primary: shouldBePrimary
              });

            if (roleError) {
              console.error('Error adding role:', roleError);
            } else {
              console.log(`✅ Successfully added '${userType}' role`);
            }

            // Refetch roles after adding new one
            const { data: updatedRoles } = await supabase
              .from('user_roles')
              .select('*')
              .eq('user_id', user.id);

            if (updatedRoles) {
              localStorage.setItem('userRoles', JSON.stringify(updatedRoles));
              localStorage.setItem('currentRole', userType);
            }
          } else {
            console.log(`User already has '${userType}' role`);
            
            if (userRoles) {
              localStorage.setItem('userRoles', JSON.stringify(userRoles));
              
              // Set current role to the one they're logging in as
              localStorage.setItem('currentRole', userType);
            }
          }

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

          toast.success(isNewUser ? 'Account created successfully!' : 'Successfully authenticated!');

          // Redirect based on user type immediately
          const redirectPath = userType === 'landlord' ? '/landlord/dashboard' : '/chat';
          console.log('🔄 Redirecting to:', redirectPath);
          
          // Use replace to avoid back button issues
          navigate(redirectPath, { replace: true });
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
                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/auth/token`, {
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

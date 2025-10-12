import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth ? useAuth() : { setUser: null };

  useEffect(() => {
    const url = new URL(window.location.href);
    const access_token = url.searchParams.get('access_token');
    const refresh_token = url.searchParams.get('refresh_token');

    if (access_token && refresh_token) {
      supabase.auth.setSession({ access_token, refresh_token })
        .then(({ error, data }) => {
          if (error) {
            toast.error('Verification failed. Please try logging in.');
            navigate('/login');
          } else {
            if (setUser) setUser(data.user);
            toast.success('Email verified! You are now logged in.');
            navigate('/app');
          }
        });
    } else {
      toast.error('Invalid verification link.');
      navigate('/login');
    }
  }, [navigate, setUser, location]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-2xl font-bold mb-4">Verifying your email...</h2>
      <p>Please wait while we log you in.</p>
    </div>
  );
}

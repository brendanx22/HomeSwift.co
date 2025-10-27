import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowLeft, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Toaster, toast } from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient';


export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [hasRequestedResend, setHasRequestedResend] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { login, googleLogin, isAuthenticated } = useAuth();
  const from = location.state?.from?.pathname || '/';
  const [searchParams] = useSearchParams();
  const isVerified = searchParams.get('verified') === 'true';
  const isLandlord = searchParams.get('type') === 'landlord';

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, from, navigate]);

  // Handle resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Handle email verification callback
  useEffect(() => {
    const { state } = location;
    if (state?.verified) {
      toast.success('Email verified successfully! You can now log in.');
      // Clear the state to prevent showing the message again
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setShowResendVerification(false);

    // Basic validation
    if (!email || !password) {
      setError('Please enter both email and password');
      setLoading(false);
      return;
    }

    try {
      // First, try to log in with Supabase
      const loginResult = await login({
        email,
        password,
        userType: isLandlord ? 'landlord' : 'renter'
      });

      if (loginResult?.success) {
        // After successful Supabase login, get the backend token
        try {
          const response = await fetch('https://api.homeswift.co/api/auth/signin', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
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

        toast.success(loginResult.message || 'Login successful!');
      } else {
        // Handle specific error cases
        if (loginResult?.error?.includes('verify your email')) {
          setUnverifiedEmail(email);
          setShowResendVerification(true);
          setResendCooldown(60);
        }
        setError(loginResult?.error || 'Login failed. Please check your credentials and try again.');
      }

    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred during login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleResendVerification = async () => {
    if (!unverifiedEmail) return;

    try {
      setLoading(true);
      setError('');

      const response = await fetch('https://api.homeswift.co/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: unverifiedEmail })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend verification email');
      }

      toast.success('Verification email sent! Please check your inbox.');
      setResendCooldown(60); // 60 seconds cooldown
      setShowResendVerification(true);
      setHasRequestedResend(true);
    } catch (error) {
      console.error('Resend verification error:', error);

      if (error.response) {
        if (error.response.status === 429) {
          setResendCooldown(60);
          setHasRequestedResend(true);
          setError('Please wait before requesting another verification email.');
        } else {
          setError(error.response.data?.error || 'Failed to resend verification email');
        }
      } else {
        setError(error.message || 'Failed to resend verification email');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      setError('');

      const userType = isLandlord ? 'landlord' : 'renter';
      console.log('Starting Google OAuth with userType:', userType);

      const result = await googleLogin(userType);

      if (result.success) {
        toast.success('Redirecting to Google...');
        // The redirect will be handled by Supabase OAuth
      } else {
        toast.error(result.error || 'Google sign-in failed');
      }

      setGoogleLoading(false);
    } catch (err) {
      console.error('Google login error:', err);
      setError('Failed to sign in with Google. Please try again.');
      setGoogleLoading(false);
    }
  };

  const handleBackToHome = () => {
    navigate('/user-type');
  };

  return (
    <div 
      className="min-h-screen flex justify-center items-start pt-24 sm:pt-32 md:pt-40 pb-24 sm:pb-32 md:pb-40 px-6 bg-cover bg-center bg-no-repeat relative"
     
    >
      {/* Background overlay for better text readability */}
      <div className="absolute inset-0 bg-white"></div>
      
      {/* Back Button - Top Left Corner */}
      <button
        onClick={() => navigate('/user-type')}
        className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20 flex items-center space-x-2 bg-white border border-[#2C3E50]/20 rounded-full px-4 py-2 text-[#2C3E50] hover:text-[#FF6B35] hover:border-[#FF6B35] transition-all duration-300 min-w-[44px] min-h-[44px] sm:min-w-auto sm:min-h-auto shadow-sm"
      >
        <span className="text-lg font-bold">&lt;</span>
        <img src="/images/logo.png" alt="HomeSwift Logo" className="w-4 h-4 rounded" />
      </button>


      
      <div className="w-full max-w-md relative z-10">

        {/* Login Form */}
        <div className="bg-white/90 backdrop-blur-sm border border-[#2C3E50]/20 rounded-[2rem] px-8 py-12 min-h-[560px] md:min-h-[640px] shadow-xl">
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
              className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4"
            >
              <Users className="w-8 h-8 text-blue-600" />
            </motion.div>

            <h1 className="text-3xl font-bold text-[#2C3E50] mb-2">
              {isVerified ? 'Email Verified!' : 'Renter Login'}
            </h1>
            <p className="text-[#2C3E50]/80">
              {isVerified ? 'Your email has been verified successfully!' : 'Sign in to browse properties'}
            </p>
            {isVerified && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm">
                Email verification successful! You can now log in to your account.
              </div>
            )}
          </div>

          

          {showResendVerification && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="text-sm text-yellow-700">
                  <p className="mb-2">Please verify your email before signing in. Check your email or click below to resend the verification email.</p>
                  <button
                    onClick={handleResendVerification}
                    disabled={loading || (hasRequestedResend && resendCooldown > 0)}
                    className="text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {hasRequestedResend && resendCooldown > 0 
                      ? `Resend in ${resendCooldown}s`
                      : 'Resend verification email'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[#2C3E50] text-sm font-medium mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/50 border border-[#2C3E50]/30 rounded-[2rem] pl-12 pr-4 py-4 text-[#2C3E50] placeholder-[#2C3E50]/60 focus:outline-none focus:border-[#FF6B35] focus:bg-white/80 transition-all"
                  placeholder="Enter your email"
                  autoComplete="username"
                  inputMode="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  required
                />
              </div>
            </div>

            
              <label className="block text-[#2C3E50] text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/50 border border-[#2C3E50]/30 rounded-[2rem] pl-12 pr-12 py-4 text-[#2C3E50] placeholder-[#2C3E50]/60 focus:outline-none focus:border-[#FF6B35] focus:bg-white/80 transition-all"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#FF6B35] transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

            <motion.button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FF6B35] text-white py-4 px-6 rounded-[2rem] font-semibold text-lg hover:bg-[#e85e2f] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                  Signing In...
                </div>
              ) : (
                'Sign In'
              )}
            </motion.button>

          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-400/30"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-transparent text-gray-400">Or continue with</span>
            </div>
          </div>

          {/* Google Login */}
          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full flex items-center justify-center space-x-3 bg-transparent border border-gray-400/50 text-[#2C3E50] py-4 rounded-[2rem] font-medium hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="text-orange-600 hover:text-orange-700 font-semibold"
              >
                Sign up
              </Link>
            </p>
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Looking for landlord tools?{' '}
              <button 
                onClick={() => navigate('/user-type')} 
                className="text-blue-400 hover:text-blue-300 transition-colors underline"
              >
                Switch to Landlord Login
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

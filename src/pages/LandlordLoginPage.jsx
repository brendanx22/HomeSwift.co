import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Mail, Lock, ArrowLeft, AlertCircle, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';

const LandlordLoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [searchParams] = useSearchParams();
  
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/landlord/dashboard';
  const isVerified = searchParams.get('verified') === 'true';

  // Redirect if already authenticated AND we have proper role data
  useEffect(() => {
    if (isAuthenticated) {
      // Check if we have the user data in localStorage with proper user_type
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const userType = storedUser?.user_metadata?.user_type || storedUser?.user_type;
      const storedRoles = JSON.parse(localStorage.getItem('userRoles') || '[]');
      const currentRole = storedRoles.find(r => r.is_primary)?.role || storedRoles[0]?.role || userType || 'renter';

      console.log('LandlordLoginPage Auth Check:', { isAuthenticated, currentRole, userType });

      if (currentRole === 'landlord') {
        navigate(from, { replace: true });
      }
      // If not landlord role, don't redirect - let App.jsx handle it
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
      setIsVerified(true);
      // Clear the state to prevent showing the message again
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setErrors({});

    try {
      // Show toast notification that Google OAuth is not available
      toast.error('Google sign-in is currently not available. Please use email and password to sign in.');

      setGoogleLoading(false);
    } catch (error) {
      console.error('Google login error:', error);
      setErrors({
        general: error.message || 'Google sign-in failed. Please try again.'
      });
      setGoogleLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for the field being edited
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
        general: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleResendVerification = async () => {
    if (resendCooldown > 0) return;
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success('Verification email sent! Please check your inbox.');
        setResendCooldown(60);
      } else {
        toast.error(data.error || 'Failed to resend verification email');
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});
    setShowResendVerification(false);

    try {
      // Use AuthContext login function which handles Supabase authentication and role assignment
      console.log('Attempting landlord login for:', formData.email);
      const loginResult = await login({
        email: formData.email,
        password: formData.password,
        userType: 'landlord'
      });

      console.log('Login result:', loginResult);

      if (loginResult?.success) {
        console.log('Login successful:', loginResult.message);
        // The App.jsx useEffect will handle the redirect based on role detection
      } else {
        // Handle specific error cases
        if (loginResult?.error?.includes('verify your email')) {
          setShowResendVerification(true);
          setErrors({
            general: 'Please verify your email before signing in. Check your email or resend the verification link.'
          });
        } else {
          setErrors({
            general: loginResult?.error || 'Login failed. Please try again.'
          });
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrors({
        general: error.message || 'An error occurred during login. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToHome = () => {
    navigate('/user-type');
  };
  
  const handleSignUpLink = () => {
    console.log('🔗 Landlord signup link clicked, navigating to /landlord/signup');
    navigate('/landlord/signup', { 
      state: { 
        from: location.state?.from || { pathname: '/landlord/dashboard' },
        userType: 'landlord'
      } 
    });
  };

  return (
    <div className="min-h-screen flex justify-center items-start pt-16 sm:pt-24 md:pt-32 pb-16 px-4 sm:px-6 bg-gradient-to-br from-gray-50 to-gray-100">
      <button
        onClick={handleBackToHome}
        className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20 flex items-center space-x-2 bg-white border border-[#2C3E50]/20 rounded-full px-4 py-2 text-[#2C3E50] hover:text-[#FF6B35] hover:border-[#FF6B35] transition-all duration-300 min-w-[44px] min-h-[44px] sm:min-w-auto sm:min-h-auto shadow-sm"
        aria-label="Back to home"
      >
        <span className="text-lg font-bold">&lt;</span>
        <img src="/images/logo.png" alt="HomeSwift Logo" className="w-4 h-4 rounded" />
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          onSubmit={handleSubmit}
          className="bg-white/90 backdrop-blur-sm border border-[#2C3E50]/20 rounded-[2rem] px-8 py-12 min-h-[560px] md:min-h-[640px] shadow-xl"
        >
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
              Landlord Login
            </h1>
            <p className="text-[#2C3E50]/80">
              Access your property management dashboard
            </p>
          </div>

          {isVerified && (
            <div className="mb-6 p-3 bg-green-50 text-green-700 rounded-md text-sm">
              Your email has been verified! You can now sign in.
            </div>
          )}
          
          {errors.general && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{errors.general}</p>
            </div>
          )}
          
          {showResendVerification && (
            <div className="mb-6 p-3 bg-yellow-50 text-yellow-700 rounded-md text-sm">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Email not verified</p>
                  <p className="mt-1">Check your email or click below to resend the verification link.</p>
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resendCooldown > 0 || isLoading}
                    className={`mt-2 text-sm font-medium text-yellow-700 hover:text-yellow-800 underline ${resendCooldown > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {resendCooldown > 0 
                      ? `Resend in ${resendCooldown}s` 
                      : 'Resend verification email'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-[#2C3E50] text-sm font-medium mb-2">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full bg-white/50 border border-[#2C3E50]/30 rounded-[2rem] px-4 py-3 pl-4 pr-4 text-[#2C3E50] placeholder-[#2C3E50]/60 focus:outline-none focus:border-[#FF6B35] focus:bg-white/80 transition-all"
                  placeholder="Enter your email address"
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-[#2C3E50] text-sm font-medium mb-2">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-blue-400 hover:text-blue-300 font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full bg-white/50 border border-[#2C3E50]/30 rounded-[2rem] px-4 py-3 pr-12 text-[#2C3E50] placeholder-[#2C3E50]/60 focus:outline-none focus:border-[#FF6B35] focus:bg-white/80 transition-all"
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#FF6B35] transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#FF6B35] text-white py-4 px-6 rounded-[2rem] font-semibold text-lg hover:bg-[#e85e2f] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                'Sign In'
              )}
            </motion.button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

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
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <button
                onClick={handleSignUpLink}
                className="font-medium text-blue-600 hover:text-blue-800 transition-colors"
              >
                Sign up as Landlord
              </button>
            </p>
          </div>
        </motion.form>
      </motion.div>
    </div>
  );
};

export default LandlordLoginPage;
          
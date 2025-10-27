import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, User, Mail, Lock, Users, Check, X, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient';

const LandlordSignupPage = () => {
  console.log('🏗️ LandlordSignupPage component loaded');

  // Add error boundary to catch any component errors
  React.useEffect(() => {
    console.log('🏗️ LandlordSignupPage mounted successfully');
    return () => {
      console.log('🏗️ LandlordSignupPage unmounted');
    };
  }, []);

  const navigate = useNavigate();
  const { signup } = useAuth();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [emailStatus, setEmailStatus] = useState(''); // '', 'checking', 'available', 'taken', 'error'
  const emailCheckTimeoutRef = useRef(null);
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const email = (formData.email || '').trim();
  const isEmailEmpty = email.length === 0;
  const isEmailValid = emailRegex.test(email);
  const passwordsMatch = formData.password && formData.confirmPassword && 
    (formData.password === formData.confirmPassword);
  const isEmailAvailable = emailStatus === 'available';
  const canSubmit = formData.firstName && formData.lastName && isEmailValid && 
                  isEmailAvailable && passwordsMatch && formData.agreeToTerms;

  // Get email validation message
  const getEmailValidationMessage = () => {
    if (isEmailEmpty) return '';
    if (!isEmailValid) return 'Please enter a valid email address';
    if (emailStatus === 'checking') return 'Checking email availability...';
    if (emailStatus === 'taken') return 'This email is already registered';
    if (emailStatus === 'available') return 'Email is available';
    if (emailStatus === 'error') return 'Error checking email availability';
    return '';
  };

  // Dynamic email border color based on validity and availability
  const getEmailBorder = () => {
    if (!formData.email) return 'border-gray-400/50 focus:border-gray-300';
    if (!isEmailValid) return 'border-red-500 focus:border-red-400';
    if (emailStatus === 'taken' || emailStatus === 'unverified') return 'border-amber-500 focus:border-amber-400';
    if (emailStatus === 'available') return 'border-green-500 focus:border-green-400';
    return 'border-gray-400/50 focus:border-gray-300';
  };

  const emailBorder = getEmailBorder();

  const handleEmailBlur = () => {
    const value = (formData.email || '').trim();
    if (!value) {
      setEmailStatus('');
      return;
    }
    if (emailRegex.test(value)) {
      if (emailStatus !== 'available' && emailStatus !== 'taken') {
        checkEmailAvailability(value);
      }
    }
  };

  const renderEmailValidationIcon = () => {
    if (isEmailEmpty) return null;

    if (emailStatus === 'checking') {
      return (
        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      );
    }

    if (emailStatus === 'available') {
      return (
        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    }

    if (emailStatus === 'taken') {
      return (
        <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      );
    }

    if (emailStatus === 'unverified') {
      return (
        <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
      );
    }

    if (emailStatus === 'error') {
      return (
        <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
      );
    }

    return null;
  };

  const getEmailStatusText = () => {
    if (!formData.email) return null;

    switch (emailStatus) {
      case 'checking':
        return <span className="text-sm text-gray-500">Checking availability...</span>;
      case 'available':
        return <span className="text-sm text-green-600">Email is available</span>;
      case 'taken':
        return <span className="text-sm text-red-600">Email is already in use</span>;
      case 'error':
        return <span className="text-sm text-yellow-600">Error checking email</span>;
      default:
        return null;
    }
  };

  const handleGoogleSignup = async () => {
    console.log('🔐 Google signup initiated');
    setGoogleLoading(true);
    setErrors({});

    try {
      // Show toast notification that Google OAuth is not available
      toast.error('Google sign-up is currently not available. Please use email and password to create your account.');

      setGoogleLoading(false);
    } catch (error) {
      console.error('❌ Google signup failed:', error.message);
      toast.error(error.message || 'Failed to sign in with Google');
      setGoogleLoading(false);
    }
  };

  // Check email availability function
  const checkEmailAvailability = async (emailToCheck) => {
    console.log(`📧 Checking email availability: ${emailToCheck}`);
    setEmailStatus('checking');

    try {
      console.log('📧 Making Supabase query to user_profiles table...');

      // Check if user_profiles table exists and has data
      const { data, error } = await supabase
        .from('user_profiles')
        .select('email')
        .eq('email', emailToCheck)
        .maybeSingle();

      if (error) {
        console.error('❌ Supabase query error:', error);
        // If the table doesn't exist, assume email is available for now
        if (error.code === '42P01') { // Table doesn't exist
          console.log('📧 user_profiles table does not exist, assuming email is available');
          setEmailStatus('available');
          return;
        }
        throw error;
      }

      console.log('📧 Query result:', { data, error });

      const status = data ? 'taken' : 'available';
      setEmailStatus(status);
      console.log(`📧 Email status: ${status}`, data ? 'Email exists in database' : 'Email is available');
    } catch (error) {
      console.error('❌ Email check failed:', error.message);
      console.error('❌ Full error object:', error);
      setEmailStatus('error');
      toast.error('Failed to check email availability');
    }
  };

  // Check email availability with debounce
  useEffect(() => {
    // Clear previous timeout
    if (emailCheckTimeoutRef.current) {
      clearTimeout(emailCheckTimeoutRef.current);
    }

    // Only check if email is valid and not empty
    if (isEmailValid && !isEmailEmpty) {
      // Set new timeout with 500ms debounce
      emailCheckTimeoutRef.current = setTimeout(() => checkEmailAvailability(email), 500);
    } else {
      setEmailStatus('');
    }

    // Cleanup function
    return () => {
      if (emailCheckTimeoutRef.current) {
        clearTimeout(emailCheckTimeoutRef.current);
      }
    };
  }, [email, isEmailValid, isEmailEmpty]);

  // Clear email status when email is empty
  useEffect(() => {
    if (!formData.email) {
      setEmailStatus('');
    }
  }, [formData.email]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Log important field changes
    if (['email', 'password', 'confirmPassword', 'agreeToTerms'].includes(name)) {
      console.log(`📝 ${name} field changed:`, name === 'agreeToTerms' ? (value ? '✅ Agreed' : '❌ Not agreed') : (value ? '***' : '(empty)'));
    }
  };

  const validateForm = () => {
    console.log('🔍 Validating landlord signup form...');
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    } else if (emailStatus === 'taken') {
      newErrors.email = 'This email is already in use';
    } else if (emailStatus === 'error') {
      newErrors.email = 'Error checking email availability';
    } else if (emailStatus === 'checking') {
      newErrors.email = 'Please wait while we check email availability';
    } else if (emailStatus !== 'available') {
      newErrors.email = 'Please wait for email availability check to complete';
    }

    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions';
    }

    const isValid = Object.keys(newErrors).length === 0;
    console.log(`✅ Form validation: ${isValid ? 'PASSED' : 'FAILED'}`, isValid ? '' : newErrors);

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('🚀 Landlord signup form submitted');

    if (!validateForm()) {
      console.log('❌ Form validation failed, signup cancelled');
      return;
    }

    setIsLoading(true);
    console.log('⏳ Creating landlord account...');

    try {
      const result = await signup({
        ...formData,
        userType: 'landlord'
      });

      if (!result.success) {
        throw new Error(result.error || 'Signup failed');
      }

      console.log('✅ Landlord account created successfully');
      toast.success('Account created successfully! Please check your email to verify your account.');

      // Navigate to verification page instead of dashboard
      navigate('/verify-email', {
        state: {
          email: formData.email,
          userType: 'landlord'
        }
      });
    } catch (error) {
      console.error('❌ Landlord signup failed:', error);
      toast.error(error.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

 const handleGoogleSignUp = async () => {
  console.log('🔐 Google signup initiated');
  setGoogleLoading(true);
  setErrors({});

  try {
    // Show toast notification that Google OAuth is not available
    toast.error('Google sign-up is currently not available. Please use email and password to create your account.');

    setGoogleLoading(false);
  } catch (error) {
    console.error('❌ Google signup failed:', error.message);
    toast.error(error.message || 'Failed to sign in with Google');
    setGoogleLoading(false);
  }
};

const handleBackToHome = () => {
  navigate('/user-type');
};

  return (
    <div className="min-h-screen flex justify-center items-start pt-24 sm:pt-32 md:pt-40 pb-24 sm:pb-32 md:pb-40 px-6 bg-cover bg-center bg-no-repeat relative">
      {/* Background overlay for better text readability */}
      <div className="absolute inset-0 bg-white"></div>
      
      {/* Back Button - Top Left Corner */}
      <button
        onClick={handleBackToHome}
        className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20 flex items-center space-x-2 bg-white border border-[#2C3E50]/20 rounded-full px-4 py-2 text-[#2C3E50] hover:text-[#FF6B35] hover:border-[#FF6B35] transition-all duration-300 min-w-[44px] min-h-[44px] sm:min-w-auto sm:min-h-auto shadow-sm"
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

        {/* Signup Form */}
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
              Landlord Signup
            </h1>
            <p className="text-[#2C3E50]/80">
              Create your landlord account to manage properties
            </p>
          </div>
          {errors.general && (
            <div className="bg-white/90 backdrop-blur-sm border border-[#2C3E50]/20 rounded-[2rem] px-8 py-12 min-h-[560px] md:min-h-[640px] shadow-xl">
              <p className="text-red-600 text-sm">{errors.general}</p>
            </div>
          )}

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[#2C3E50] text-sm font-medium mb-2">
                  First Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full bg-white/50 border border-[#2C3E50]/30 rounded-[2rem] pl-12 pr-4 py-4 text-[#2C3E50] placeholder-[#2C3E50]/60 focus:outline-none focus:border-[#FF6B35] focus:bg-white/80 transition-all"
                    placeholder="First name"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-[#2C3E50] text-sm font-medium mb-2">
                  Last Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full bg-white/50 border border-[#2C3E50]/30 rounded-[2rem] pl-12 pr-4 py-4 text-[#2C3E50] placeholder-[#2C3E50]/60 focus:outline-none focus:border-[#FF6B35] focus:bg-white/80 transition-all"
                    placeholder="Last name"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-[#2C3E50] text-sm font-medium mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  onBlur={handleEmailBlur}
                  className={`w-full bg-white/50 border ${emailBorder} rounded-[2rem] pl-12 pr-12 py-4 text-[#2C3E50] placeholder-[#2C3E50]/60 focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:bg-white/80 transition-all`}
                  placeholder="Enter email address"
                  autoComplete="email"
                  required
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center">
                  {renderEmailValidationIcon()}
                </div>
              </div>
              {getEmailStatusText()}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-[#2C3E50] text-sm font-medium mb-2">
                Phone Number
              </label>
              <div className="relative">
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full bg-white/50 border border-[#2C3E50]/30 rounded-[2rem] px-4 py-3 pl-4 pr-4 text-[#2C3E50] placeholder-[#2C3E50]/60 focus:outline-none focus:border-[#FF6B35] focus:bg-white/80 transition-all"
                  placeholder="Enter phone number"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[#2C3E50] text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full bg-white/50 border border-[#2C3E50]/30 rounded-[2rem] pl-12 pr-12 py-4 text-[#2C3E50] placeholder-[#2C3E50]/60 focus:outline-none focus:border-[#FF6B35] focus:bg-white/80 transition-all"
                  placeholder="Create password"
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
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-[#2C3E50] text-sm font-medium mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full bg-white/50 border border-[#2C3E50]/30 rounded-[2rem] pl-12 pr-12 py-4 text-[#2C3E50] placeholder-[#2C3E50]/60 focus:outline-none focus:border-[#FF6B35] focus:bg-white/80 transition-all"
                  placeholder="Confirm password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#FF6B35] transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleInputChange}
                className="mt-1 w-4 h-4 text-[#FF6B35] bg-white border-gray-300 rounded focus:ring-[#FF6B35] focus:ring-2"
                required
              />
              <label className="text-sm text-gray-600 leading-relaxed">
                I agree to the{' '}
                <a href="#" className="text-[#FF6B35] hover:text-[#e85e2f] underline">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-[#FF6B35] hover:text-[#e85e2f] underline">
                  Privacy Policy
                </a>
              </label>
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#FF6B35] text-white py-4 px-6 rounded-[2rem] font-semibold text-lg hover:bg-[#e85e2f] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  <span>Creating account...</span>
                </>
              ) : (
                'Create Landlord Account'
              )}
            </motion.button>
          </div>

               {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-400/30"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-transparent text-gray-400">Or continue with</span>
            </div>
          </div>

          {/* Google Signup */}
          <button
            onClick={handleGoogleSignup}
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
              Already have a landlord account?{' '}
              <Link
                to="/landlord/login"
                className="text-orange-600 hover:text-orange-700 font-semibold"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </motion.form>

        <div className="mt-6 text-center">
          <p className="text-gray-400">
            Looking for renter signup?{' '}
            <button 
              onClick={() => navigate('/user-type')} 
              className="text-blue-400 hover:text-blue-300 transition-colors underline"
            >
              Switch to Renter Signup
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default LandlordSignupPage;
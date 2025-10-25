import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, User, Home, Building2, Users, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

export default function SignupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signup: signUp, isAuthenticated, loading: authLoading, checkEmailExists } = useAuth();
  
  // Determine user type from localStorage first, then URL
  const [userType, setUserType] = useState('renter');
  
  useEffect(() => {
    // Get user type from localStorage or URL
    const storedUserType = localStorage.getItem('userType');
    const isLandlordSignup = storedUserType === 'landlord' || location.pathname.includes('landlord');
    const newUserType = isLandlordSignup ? 'landlord' : 'renter';
    
    // Update state and localStorage
    setUserType(newUserType);
    localStorage.setItem('userType', newUserType);
  }, [location.pathname]);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailStatus, setEmailStatus] = useState(''); // '', 'checking', 'available', 'taken', 'unverified', 'error'
  const [emailCheckError, setEmailCheckError] = useState('');
  
  const emailCheckTimeoutRef = useRef(null);
  const emailAbortRef = useRef(null);
  const lastRequestedEmailRef = useRef('');
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = emailRegex.test((formData.email || '').trim());
  const passwordsMatch = formData.password && formData.confirmPassword && (formData.password === formData.confirmPassword);
  const hasNames = Boolean(formData.firstName && formData.lastName);
  const isEmailAvailable = emailStatus === 'available';
  const canSubmit = hasNames && isEmailValid && isEmailAvailable && passwordsMatch;

  // Dynamic email border color based on validity and availability
  const getEmailBorder = () => {
    if (!formData.email) return 'border-gray-400/50 focus:border-gray-300';
    if (!isEmailValid) return 'border-red-500 focus:border-red-400';
    if (emailStatus === 'taken' || emailStatus === 'unverified') return 'border-amber-500 focus:border-amber-400';
    if (emailStatus === 'available') return 'border-green-500 focus:border-green-400';
    return 'border-gray-400/50 focus:border-gray-300';
  };
  
  const emailBorder = getEmailBorder();

  // Cleanup any in-flight email check requests and timers on unmount
  useEffect(() => {
    return () => {
      if (emailCheckTimeoutRef.current) {
        try { clearTimeout(emailCheckTimeoutRef.current); } catch {}
      }
      if (emailAbortRef.current) {
        try { emailAbortRef.current.abort(); } catch {}
      }
    };
  }, []);

  // Log auth state for debugging
  useEffect(() => {
    console.log('Auth state changed:', { isAuthenticated, authLoading });
    
    if (!authLoading && isAuthenticated) {
      console.log('User already authenticated, redirecting to app');
      navigate(userType === 'landlord' ? '/landlord/dashboard' : '/chat');
    }
  }, [isAuthenticated, authLoading, navigate, userType]);

  const handleResendVerification = async (email) => {
    if (!email) {
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Use Supabase's resend confirmation email
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });
      
      if (error) throw error;
      
      toast.success('A new verification email has been sent. Please check your inbox.');
    } catch (err) {
      console.error('Error resending verification email:', err);
      const errorMessage = err.message || 'Failed to resend verification email';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Clear previous errors
      setError('');
      
      // Basic validation
      if (!formData.firstName) {
        const errorMsg = 'Please enter your first name';
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }
      
      if (!formData.lastName) {
        const errorMsg = 'Please enter your last name';
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }
      
      if (!formData.email) {
        const errorMsg = 'Please enter your email';
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }
      
      if (!emailRegex.test(formData.email)) {
        const errorMsg = 'Please enter a valid email address';
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }
      
      if (!formData.password) {
        const errorMsg = 'Please enter a password';
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }
      
      if (formData.password.length < 6) {
        const errorMsg = 'Password must be at least 6 characters';
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }
      
      if (formData.password !== formData.confirmPassword) {
        const errorMsg = 'Passwords do not match';
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }
      
      // Register the user
      setLoading(true);
      setError('');
      
      try {
        console.log('Attempting to sign up with data:', {
          email: formData.email,
          userType,
          firstName: formData.firstName,
          lastName: formData.lastName
        });
        
        const result = await signUp({
          email: formData.email,
          password: formData.password,
          user_type: userType,
          full_name: `${formData.firstName} ${formData.lastName}`.trim()
        });
        
        console.log('Signup result:', result);
        
        // If we get here, signup was successful
        if (result.success) {
          // Show success message
          toast.success('Registration successful! Please check your email to verify your account.', {
            duration: 5000
          });
          
          // Clear form
          setFormData({
            firstName: '',
            lastName: '',
            email: '',
            password: '',
            confirmPassword: ''
          });
          
          // Reset email status
          setEmailStatus('');
          setEmailCheckError('');
          
          // Redirect to email verification page
          navigate('/verify-email', { 
            state: { 
              email: formData.email,
              message: 'Registration successful! Please check your email to verify your account.',
              status: 'pending',
              userType: userType
            },
            replace: true
          });
          
          return; // Exit early since we've handled the success case
        }

        if (!result.success) {
          console.error('Signup failed with details:', {
            error: result.error,
            status: result.status,
            responseData: result.responseData,
            response: result.response
          });
          
          // Extract error message from response data if available
          let errorMessage = 'Signup failed. Please try again.';
          let errorDetails = '';
          
          // Check for detailed error in response data
          if (result.responseData) {
            // Handle different possible error response formats
            if (result.responseData.error) {
              errorMessage = result.responseData.error;
              errorDetails = result.responseData.details || result.responseData.message || '';
            } else if (result.responseData.message) {
              errorMessage = result.responseData.message;
              errorDetails = result.responseData.details || '';
            } else if (Array.isArray(result.responseData.errors)) {
              // Handle validation errors array
              errorMessage = 'Validation error';
              errorDetails = result.responseData.errors.map(err => err.msg || err.message || String(err)).join('\n');
            } else if (typeof result.responseData === 'string') {
              errorMessage = result.responseData;
            }
          } else if (result.error) {
            errorMessage = result.error;
          }
          
          // Handle specific error cases
          const lowerCaseError = errorMessage.toLowerCase();
          if (lowerCaseError.includes('already registered') || 
              lowerCaseError.includes('already in use') ||
              lowerCaseError.includes('user already registered') ||
              lowerCaseError.includes('email already in use')) {
            setEmailStatus('taken');
            setEmailCheckError('This email is already registered');
            errorMessage = 'This email is already registered. Please use a different email or sign in.';
          } else if (lowerCaseError.includes('rate limit') || 
                    lowerCaseError.includes('too many requests') ||
                    lowerCaseError.includes('too many attempts')) {
            errorMessage = 'Too many signup attempts. Please wait 30 minutes before trying again, or use a different email address.';
          }
          
          // Show detailed error message if available
          if (errorDetails) {
            console.error('Error details:', errorDetails);
            toast.error(`${errorMessage}: ${errorDetails}`, { duration: 10000 });
          } else {
            toast.error(errorMessage);
          }
          
          throw new Error(errorMessage);
        }
      }

       catch (error) {
        console.error('Error during signup:', error);
        // The error is already handled in the try block, so we just need to stop the execution
        return;
      }

      console.log('User registered successfully:', result);
      
      // Show success message with resend option
      toast.success(
        <div>
          <p>Registration successful! Check your email to verify your account.</p>
          <button 
            onClick={() => handleResendVerification(formData.email)}
            className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Resend Verification Email'}
          </button>
        </div>,
        { 
          duration: 10000,
          style: { minWidth: '300px' }
        }
      );
      
      // Clear form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: ''
      });
      
      // Reset email status
      setEmailStatus('');
      setEmailCheckError('');
      
      // Redirect to email verification page
      navigate('/verify-email', { 
        state: { 
          email: formData.email,
          message: 'Registration successful! Please check your email to verify your account.',
          status: 'pending',
          userType: userType
        },
        replace: true
      });
      
    } catch (err) {
      console.error('Registration error:', err);
      const errorMessage = err.message || 'An unexpected error occurred. Please try again.';
      setError(errorMessage);
      
      // Only show toast for non-validation errors
      if (![
        'Please enter your full name',
        'Please enter your email',
        'Please enter a valid email address',
        'Please enter a password',
        'Password must be at least 6 characters',
        'Passwords do not match',
        'Please check that your email is valid and available'
      ].includes(err.message)) {
        toast.error(errorMessage, { duration: 5000 });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      setGoogleLoading(true);
      setError('');

      // Show toast notification that Google OAuth is not available
      toast.error('Google sign-up is currently not available. Please use email and password to create your account.');

      setGoogleLoading(false);
    } catch (err) {
      console.error('Google signup error:', err);
      setError('Failed to sign up with Google. Please try again.');
      setGoogleLoading(false);
    }
  };

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

  const checkEmailAvailability = async (email) => {
    const sanitized = (email || '').trim().toLowerCase();
    
    // Clear previous state
    setEmailCheckError('');
    
    // Validate email format
    if (!emailRegex.test(sanitized)) {
      setEmailStatus('invalid');
      setEmailCheckError('Please enter a valid email address');
      return;
    }
    
    // Store the email we're currently checking
    const checkId = Date.now();
    lastRequestedEmailRef.current = { email: sanitized, id: checkId };
    
    // Cancel any in-flight request
    if (emailCheckTimeoutRef.current) {
      clearTimeout(emailCheckTimeoutRef.current);
    }
    
    // Show checking status
    setEmailStatus('checking');
    
    try {
      // Use a timeout to debounce the API call
      emailCheckTimeoutRef.current = setTimeout(async () => {
        try {
          console.log(`[${checkId}] Starting email check for:`, sanitized);
          
          // Use the admin API to check if user exists (this requires RLS policies to be set correctly)
          const { data, error } = await supabase
            .from('user_profiles')  // Using the correct table name
            .select('id')
            .eq('email', sanitized)
            .maybeSingle();
          
          // Check if this response is still relevant
          const currentRequest = lastRequestedEmailRef.current;
          if (!currentRequest || currentRequest.email !== sanitized || currentRequest.id !== checkId) {
            console.log(`[${checkId}] Email check response for different email or outdated request, ignoring`);
            return;
          }
          
          if (error) {
            console.warn(`[${checkId}] Error checking email:`, error);
            // If there's an error, assume available to be safe
            setEmailStatus('available');
            setEmailCheckError('');
            return;
          }
          
          if (data) {
            // Email is already registered
            console.log(`[${checkId}] Email is already registered`);
            setEmailStatus('taken');
            setEmailCheckError('This email is already registered');
          } else {
            // Email is available
            console.log(`[${checkId}] Email is available`);
            setEmailStatus('available');
            setEmailCheckError('');
          }
        } catch (err) {
          console.error(`[${checkId}] Email check error:`, err);
          setEmailStatus('error');
          setEmailCheckError('Error checking email availability. Please try again.');
        }
      }, 500); // 500ms debounce
    } catch (error) {
      // Handle any synchronous errors
      if (error.name === 'AbortError') {
        console.log('Email check aborted');
        return;
      }
      
      console.error('Email check setup error:', error);
      // Only update state if this was for the current email
      const currentEmail = (formData.email || '').trim().toLowerCase();
      if (currentEmail === sanitized) {
        setEmailStatus('error');
        setEmailCheckError(
          error.message || 'We could not verify your email right now. Please try again.'
        );
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const newFormData = {
      ...formData,
      [name]: value
    };
    setFormData(newFormData);

    // Check email availability when email field changes
    if (name === 'email') {
      const trimmedValue = value.trim();
      
      // Clear existing timeout
      if (emailCheckTimeoutRef.current) {
        clearTimeout(emailCheckTimeoutRef.current);
      }

      // If the field is empty or not a valid email, clear the status
      if (!trimmedValue) {
        setEmailStatus('');
        setEmailCheckError('');
        return;
      }

      if (!emailRegex.test(trimmedValue)) {
        setEmailStatus('');
        setEmailCheckError('Please enter a valid email address');
        return;
      }

      // Debounce the email check
      emailCheckTimeoutRef.current = setTimeout(() => {
        checkEmailAvailability(trimmedValue);
      }, 500);
    }
    
    // Clear any existing errors when user starts typing
    if (error) {
      setError('');
    }
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <div 
      className="min-h-screen flex justify-center items-start pt-24 sm:pt-32 md:pt-40 pb-24 sm:pb-32 md:pb-40 px-6 bg-cover bg-center bg-no-repeat relative w-full"
    
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

        {/* Signup Form */}
        <div className="bg-white/90 backdrop-blur-sm border border-[#2C3E50]/20 rounded-[2rem] px-10 py-12 min-h-[560px] md:min-h-[640px] shadow-xl w-full">
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
              Renter Signup
            </h1>
            <p className="text-[#2C3E50]/80">
              Create your account to start browsing properties
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  First Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-gray-400/50 rounded-[2rem] pl-12 pr-4 py-4 text-[#2C3E50] placeholder-[#2C3E50]/60 focus:outline-none focus:border-gray-300 focus:bg-white transition-all"
                    placeholder="First name"
                    autoComplete="given-name"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Last Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-gray-400/50 rounded-[2rem] pl-12 pr-4 py-4 text-[#2C3E50] placeholder-[#2C3E50]/60 focus:outline-none focus:border-gray-300 focus:bg-white transition-all"
                    placeholder="Last name"
                    autoComplete="family-name"
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
                  className={`w-full bg-white/50 border ${getEmailBorder()} rounded-[2rem] pl-12 pr-12 py-4 text-[#2C3E50] placeholder-[#2C3E50]/60 focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:bg-white/80 transition-all`}
                  placeholder="Enter email address"
                  autoComplete="email"
                  required
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center">
                  {emailStatus === 'checking' && (
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  )}
                  {emailStatus === 'available' && (
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  {emailStatus === 'taken' && (
                    <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  )}
                  {emailStatus === 'unverified' && (
                    <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                  )}
                  {emailStatus === 'error' && (
                    <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
              {emailCheckError && (
                <p className={`mt-1 text-sm ${emailStatus === 'unverified' ? 'text-yellow-600' : 'text-red-500'}`}>
                  {emailCheckError}
                  {emailStatus === 'unverified' && (
                    <button
                      type="button"
                      onClick={() => handleResendVerification(formData.email)}
                      className="ml-2 text-blue-600 hover:text-blue-800 underline text-sm"
                      disabled={loading}
                    >
                      Resend verification
                    </button>
                  )}
                </p>
              )}
            </div>

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
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full bg-white/50 border border-[#2C3E50]/30 rounded-[2rem] pl-12 pr-12 py-4 text-[#2C3E50] placeholder-[#2C3E50]/60 focus:outline-none focus:border-[#FF6B35] focus:bg-white/80 transition-all"
                  placeholder="Create password"
                  autoComplete="new-password"
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
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  className="w-full bg-white/50 border border-[#2C3E50]/30 rounded-[2rem] pl-12 pr-12 py-4 text-[#2C3E50] placeholder-[#2C3E50]/60 focus:outline-none focus:border-[#FF6B35] focus:bg-white/80 transition-all"
                  placeholder="Confirm password"
                  autoComplete="new-password"
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

            <motion.button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FF6B35] text-white py-4 px-6 rounded-[2rem] font-semibold text-lg hover:bg-[#e85e2f] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </motion.button>

            {/* Disabled reasons for clarity */}
            {(!canSubmit && !loading) && (
              <div className="mt-2 text-xs text-gray-400">
                <ul className="list-disc pl-5 space-y-1">
                  {!hasNames && <li>Enter your first and last name</li>}
                  {formData.email && !isEmailValid && <li>Enter a valid email address</li>}
                  {isEmailValid && emailStatus === '' && <li>Validate your email availability</li>}
                  {emailStatus === 'error' && <li className="text-yellow-400">Email availability service is temporarily unavailable</li>}
                  {emailStatus === 'checking' && <li>Checking email availability...</li>}
                  {emailStatus === 'taken' && <li className="text-red-400">This email is already registered</li>}
                  {!passwordsMatch && <li>Passwords must match</li>}
                </ul>
              </div>
            )}
          </form>

          {/* Divider */}
          <div className="relative my-4">
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

          <div className="mt-4 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-orange-600 hover:text-orange-700 font-semibold"
              >
                Sign in
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <p className="text-gray-400">
              Need landlord tools?{' '}
              <button 
                onClick={() => navigate('/user-type')} 
                className="text-blue-400 hover:text-blue-300 transition-colors underline"
              >
                Switch to Landlord Signup
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

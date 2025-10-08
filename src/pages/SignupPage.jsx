import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, User, Home, Building2, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

export default function SignupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signUp, isAuthenticated, checkEmailExists, loading: authLoading } = useAuth();
  
  // Determine if this is a landlord signup from the URL
  const isLandlordSignup = location.pathname.includes('landlord');
  const userType = isLandlordSignup ? 'landlord' : 'renter';
  
  const [formData, setFormData] = useState({
    fullName: '',
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
  const hasNames = Boolean(formData.fullName);
  const isEmailAvailable = emailStatus === 'available';
  const canSubmit = hasNames && isEmailValid && isEmailAvailable && passwordsMatch;

  // Dynamic email border color based on validity and availability
  const emailBorder = !formData.email
    ? 'border-gray-400/50 focus:border-gray-300'
    : (!isEmailValid
        ? 'border-red-500 focus:border-red-400'
        : (emailStatus === 'taken' || emailStatus === 'unverified'
            ? 'border-amber-500 focus:border-amber-400'
            : (emailStatus === 'available'
                ? 'border-green-500 focus:border-green-400'
                : 'border-gray-400/50 focus:border-gray-300')));

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
      navigate('/app', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate form data
      if (!formData.fullName) {
        throw new Error('Please enter your full name');
      }
      
      if (!formData.email) {
        throw new Error('Please enter your email');
      }
      
      if (!emailRegex.test(formData.email)) {
        throw new Error('Please enter a valid email address');
      }
      
      if (!formData.password) {
        throw new Error('Please enter a password');
      }
      
      if (formData.password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }
      
      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      // Check email status before submission
      if (emailStatus === 'taken') {
        throw new Error('This email is already registered. Please sign in instead.');
      } else if (emailStatus === 'unverified') {
        // Don't allow creating a new account with an unverified email
        throw new Error('This email is registered but not verified. Please check your email for the verification link or resend it.');
      } else if (emailStatus !== 'available') {
        // Force check email availability one more time if status is not determined
        await checkEmailAvailability(formData.email);
        if (emailStatus === 'taken' || emailStatus === 'unverified') {
          throw new Error('This email is already registered. Please sign in instead.');
        } else if (emailStatus !== 'available') {
          throw new Error('Please check that your email is valid and available');
        }
      }

      // Check if user is already authenticated
      if (isAuthenticated) {
        toast.success('You are already logged in. Redirecting to dashboard...');
        navigate(userType === 'landlord' ? '/landlord/dashboard' : '/chat');
        return;
      }

      console.log('Registration attempt with:', { 
        email: formData.email, 
        name: formData.fullName,
        userType: userType
      });

      // Register the user
      const { user, error: signUpError } = await signUp(
        formData.email,
        formData.password,
        userType,
        formData.fullName
      );

      if (signUpError) {
        console.error('Signup error:', signUpError);
        
        // Handle specific error cases
        if (signUpError.message.includes('already registered')) {
          setEmailStatus('taken');
          setEmailCheckError('This email is already registered');
          throw new Error('This email is already registered. Please use a different email or sign in.');
        }
        
        throw signUpError;
      }

      if (!user) {
        throw new Error('Failed to create user. Please try again.');
      }

      console.log('User registered successfully:', user);
      
      // Show success message
      toast.success('Registration successful! Please check your email to verify your account.', {
        duration: 5000
      });
      
      // Clear form
      setFormData({
        fullName: '',
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
    setGoogleLoading(true);
    setError('');

    try {
      await googleAuth.signInWithGoogle({
        redirectTo: window.location.origin,
        userType: 'renter'
      });
      // The redirect will happen automatically via Supabase OAuth
    } catch (error) {
      console.error('Google signup error:', error);
      setError(error.message || 'Google sign-up failed. Please try again.');
    } finally {
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
    } else {
      setEmailStatus('');
    }
  };

  const handleResendVerification = async (email) => {
    setLoading(true);
    try {
      const { success, error } = await resendVerificationEmail(email);
      if (success) {
        toast.success('Verification email resent. Please check your inbox.');
      } else {
        throw new Error(error || 'Failed to resend verification email');
      }
    } catch (error) {
      console.error('Error resending verification:', error);
      toast.error(error.message || 'Failed to resend verification email');
    } finally {
      setLoading(false);
    }
  };

  const checkEmailAvailability = async (email) => {
    const sanitized = (email || '').trim().toLowerCase();
    
    // Clear previous state
    setEmailCheckError('');
    
    // Validate email format
    if (!emailRegex.test(sanitized)) {
      setEmailStatus('');
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
          const { exists, isVerified, error } = await checkEmailExists(sanitized);
          console.log(`[${checkId}] Email check result:`, { exists, isVerified, error });
          
          // Check if this response is still relevant
          const currentRequest = lastRequestedEmailRef.current;
          if (!currentRequest || currentRequest.email !== sanitized || currentRequest.id !== checkId) {
            console.log(`[${checkId}] Email check response for different email or outdated request, ignoring`);
            return;
          }

          if (error) {
            console.error(`[${checkId}] Email check error:`, error);
            setEmailStatus('error');
            setEmailCheckError('Error checking email availability. Please try again.');
            return;
          }
          
          // Update UI based on email availability and verification status
          if (exists) {
            console.log(`[${checkId}] Email is already registered`);
            setEmailStatus('taken');
            if (!isVerified) {
              console.log(`[${checkId}] Email is registered but not verified`);
              setEmailCheckError('This email is already registered. Please check your email for a verification link.');
            } else {
              console.log(`[${checkId}] Email is already registered and verified`);
              setEmailCheckError('This email is already registered');
            }
          } else {
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

          <form onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(e);
             }} className="space-y-4" noValidate>
            {/* Full Name Field */}
            <div>
              <label className="block text-[#2C3E50] text-sm font-medium mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full bg-white/50 border border-[#2C3E50]/30 rounded-[2rem] pl-12 pr-4 py-4 text-[#2C3E50] placeholder-[#2C3E50]/60 focus:outline-none focus:border-[#FF6B35] focus:bg-white/80 transition-all"
                  placeholder="Your full name"
                  autoComplete="name"
                  required
                />
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
                  className="w-full bg-white/50 border border-[#2C3E50]/30 rounded-[2rem] pl-12 pr-4 py-4 text-[#2C3E50] placeholder-[#2C3E50]/60 focus:outline-none focus:border-[#FF6B35] focus:bg-white/80 transition-all"
                  placeholder="Enter email address"
                  autoComplete="email"
                  required
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center">
                  {emailStatus === 'checking' && (
                    <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  )}
                  {emailStatus === 'available' && (
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  {(emailStatus === 'taken' || emailStatus === 'unverified') && (
                    <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
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
                  onChange={handleInputChange}
                  className="w-full bg-white/50 border border-[#2C3E50]/30 rounded-[2rem] pl-12 pr-12 py-4 text-[#2C3E50] placeholder-[#2C3E50]/60 focus:outline-none focus:border-[#FF6B35] focus:bg-white/80 transition-all"
                  placeholder="Create password"
                  autoComplete="new-password"
                  inputMode="text"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck="false"
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
                  onChange={handleInputChange}
                  className="w-full bg-white/50 border border-[#2C3E50]/30 rounded-[2rem] pl-12 pr-12 py-4 text-[#2C3E50] placeholder-[#2C3E50]/60 focus:outline-none focus:border-[#FF6B35] focus:bg-white/80 transition-all"
                  placeholder="Confirm password"
                  autoComplete="new-password"
                  inputMode="text"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck="false"
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
            {emailCheckError && (
                <div className="mt-1 text-sm">
                  <p className={emailStatus === 'unverified' ? 'text-amber-600' : 'text-red-600'}>
                    {emailCheckError}
                  </p>
                  {emailStatus === 'unverified' && (
                    <button
                      type="button"
                      onClick={() => handleResendVerification(formData.email)}
                      className="mt-1 text-sm font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:underline transition duration-150 ease-in-out"
                      disabled={loading}
                    >
                      {loading ? 'Sending...' : 'Resend verification email'}
                    </button>
                  )}
                </div>
              )}
              <ul className="list-disc pl-5 space-y-1">
                {!hasNames && <li>Enter your first and last name</li>}
                {formData.email && !isEmailValid && <li>Enter a valid email address</li>}
                {isEmailValid && emailStatus === '' && <li>Validate your email availability</li>}
                {emailStatus === 'error' && <li className="text-yellow-400">Email availability service is temporarily unavailable</li>}
                {emailStatus === 'checking' && <li>Checking email availability...</li>}
                {emailStatus === 'unverified' && <li className="text-amber-600">Email address is unverified</li>}
                {emailStatus === 'taken' && <li className="text-red-600">This email is already registered</li>}
                {!passwordsMatch && formData.confirmPassword && <li>Passwords must match</li>}
              </ul>
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

import Loading from '../components/Loading';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient';

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'
  const [message, setMessage] = useState('');

  // Get email and message from location state
  const { email, message: locationMessage, status: locationStatus } = location.state || {};

  useEffect(() => {
    // Set initial status based on location state
    if (locationStatus) {
      setStatus(locationStatus);
    }

    if (locationMessage) {
      setMessage(locationMessage);
    }

    // Auto-redirect after success
    if (locationStatus === 'success') {
      const timer = setTimeout(() => {
        const userType = localStorage.getItem('userType') || 'renter';
        const redirectPath = userType === 'landlord' ? '/landlord/login' : '/login';
        navigate(redirectPath);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [location, navigate]);

  const handleContinue = () => {
    const userType = localStorage.getItem('userType') || 'renter';
    const redirectPath = userType === 'landlord' ? '/landlord/login' : '/login';
    navigate(redirectPath);
  };

  const handleResendEmail = async () => {
    if (!email) return;

    try {
      setStatus('loading');
      setMessage('');

      // Use Supabase to resend verification email
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      setStatus('success');
      setMessage('Verification email sent! Please check your inbox and click the link to verify your account.');
      toast.success('Verification email sent!');
    } catch (error) {
      console.error('Error resending verification:', error);
      setStatus('error');
      setMessage('Failed to send verification email. Please try again.');
      toast.error('Failed to send verification email');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      {status === 'loading' ? (
        <Loading />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8"
        >
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6"
            >
              {status === 'success' && (
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              )}
              {status === 'error' && (
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
              )}
              {!status || status === 'pending' ? (
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
              ) : null}
            </motion.div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {status === 'success' ? 'Email Verified!' :
               status === 'error' ? 'Verification Failed' :
               'Verify Your Email'}
            </h1>

            <p className="text-gray-600 mb-6">
              {message || 'Please check your email for a verification link to complete your account setup.'}
            </p>

            {status === 'success' && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                onClick={handleContinue}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <span>Continue to Login</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            )}

            {status === 'error' && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                onClick={handleResendEmail}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Try Again
              </motion.button>
            )}

            {(status === 'pending') && (
              <div className="space-y-3">
                <p className="text-sm text-gray-500">
                  Didn't receive the email? Check your spam folder or click below to resend.
                </p>
                <button
                  onClick={handleResendEmail}
                  className="text-blue-600 hover:text-blue-800 font-medium text-sm underline"
                >
                  Resend verification email
                </button>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => navigate('/')}
                className="text-gray-500 hover:text-gray-700 text-sm font-medium"
              >
                ← Back to Home
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default VerifyEmail;

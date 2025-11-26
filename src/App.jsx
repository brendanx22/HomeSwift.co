import React, { Suspense, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { OfflineIndicator, PWAInstallPrompt, UpdatePrompt, registerServiceWorker } from './utils/pwa.jsx';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { initPostHog } from './lib/posthog';
import { checkAndClearCache } from './utils/cacheManager';

// Lazy load pages for better performance
const Home = React.lazy(() => import('./pages/Home'));
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const SignupPage = React.lazy(() => import('./pages/SignupPage'));
const RenterDashboard = React.lazy(() => import('./pages/RenterDashboard'));
const PropertyBrowse = React.lazy(() => import('./pages/PropertyBrowse'));
const LandlordPropertyBrowse = React.lazy(() => import('./pages/LandlordPropertyBrowse'));
const LandlordLoginPage = React.lazy(() => import('./pages/LandlordLoginPage'));
import LandlordSignupPage from './pages/LandlordSignupPage';
const LandlordDashboard = React.lazy(() => import('./pages/LandlordDashboard'));
const LandlordSettings = React.lazy(() => import('./pages/LandlordSettings'));
const ChatPage = React.lazy(() => import('./pages/ChatPage'));
const Properties = React.lazy(() => import('./pages/Properties'));
const About = React.lazy(() => import('./pages/About'));
const Contact = React.lazy(() => import('./pages/Contact'));
const Gallery = React.lazy(() => import('./pages/Gallery'));
const InquiryManagement = React.lazy(() => import('./pages/InquiryManagement'));
const MessageCenter = React.lazy(() => import('./pages/MessageCenter'));
const FAQ = React.lazy(() => import('./pages/FAQ'));
const PropertyDetails = React.lazy(() => import('./pages/PropertyDetails'));
const VerifyEmail = React.lazy(() => import('./pages/VerifyEmail'));
const AuthCallback = React.lazy(() => import('./pages/AuthCallback'));
const UserTypeSelection = React.lazy(() => import('./pages/UserTypeSelection'));
const ForgotPassword = React.lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = React.lazy(() => import('./pages/ResetPassword'));
const RenterProperties = React.lazy(() => import('./pages/RenterProperties'));
const SavedProperties = React.lazy(() => import('./pages/SavedProperties'));
const Profile = React.lazy(() => import('./pages/Profile'));
const NeighborhoodInfo = React.lazy(() => import('./pages/NeighborhoodInfo'));
const VirtualTours = React.lazy(() => import('./pages/VirtualTours'));
const PropertyComparison = React.lazy(() => import('./pages/PropertyComparison'));
const ListPropertyForm = React.lazy(() => import('./pages/ListPropertyForm'));
const PropertyAlerts = React.lazy(() => import('./pages/PropertyAlerts'));
const PropertyAnalytics = React.lazy(() => import('./pages/PropertyAnalytics'));
const PropertyRecommendations = React.lazy(() => import('./pages/PropertyRecommendations'));
const ComparisonHistory = React.lazy(() => import('./pages/ComparisonHistory'));
const LandlordProperties = React.lazy(() => import('./pages/LandlordProperties'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const RenterHomePage = React.lazy(() => import('./pages/RenterHomePage'));

const Settings = React.lazy(() => import('./pages/Settings'));
const EditPropertyForm = React.lazy(() => import('./pages/EditPropertyForm'));

// Legal and Support Pages
const TermsOfService = React.lazy(() => import('./pages/TermsOfService'));
const PrivacyPolicy = React.lazy(() => import('./pages/PrivacyPolicy'));
const Help = React.lazy(() => import('./pages/Help'));


// Main App Layout Component
const AppLayout = () => {
  const { user, isAuthenticated, loading, roles, currentRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isMounted = React.useRef(true);

  // Handle redirects after login
  React.useEffect(() => {
    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Handle authentication state changes
  React.useEffect(() => {
    if (!isMounted.current || loading) return;

    const searchParams = new URLSearchParams(window.location.search);
    const isFromLogout = searchParams.get('from') === 'logout';
    const isLoginPage = location.pathname === '/login';
    const isLandlordLoginPage = location.pathname === '/landlord/login';
    const isLandlordRoute = location.pathname.startsWith('/landlord/');
    const path = location.pathname;

    // Clean up URL if needed
    if (isFromLogout || searchParams.get('redirected') === 'true') {
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }

    // Handle authenticated users
    if (isAuthenticated && user) {
      const publicRoutes = ['/', '/login', '/signup', '/user-type', '/forgot-password', '/reset-password', '/landlord/login'];

      // Get user data from multiple sources for consistency
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const userType = user?.user_metadata?.user_type || storedUser?.user_metadata?.user_type || storedUser?.user_type;
      const storedRoles = JSON.parse(localStorage.getItem('userRoles') || '[]');
      const authContextRoles = roles || [];
      const allRoles = authContextRoles.length > 0 ? authContextRoles : storedRoles;
      const detectedRole = currentRole || allRoles.find(r => r.is_primary)?.role || allRoles[0]?.role || userType || 'renter';

      // Enhanced debug logging
      console.log('AppLayout Auth Debug:', {
        isAuthenticated,
        user: user ? 'exists' : 'null',
        userType,
        storedRoles,
        authContextRoles,
        allRoles,
        currentRole,
        detectedRole,
        path,
        isLandlordLoginPage,
        isLoginPage
      });

      // If we're on a login page, redirect to the appropriate dashboard
      if (isLoginPage || isLandlordLoginPage) {
        const dashboardPath = detectedRole === 'landlord' ? '/landlord/dashboard' : '/chat';
        // console.log('Redirecting from login to:', dashboardPath, 'based on role:', detectedRole);
        if (path !== dashboardPath) {
          navigate(dashboardPath, { replace: true });
        }
        return;
      }

      // For other public routes when authenticated
      if (publicRoutes.includes(path)) {
        const dashboardPath = detectedRole === 'landlord' ? '/landlord/dashboard' : '/chat';
        // console.log('Redirecting from public route to:', dashboardPath);
        if (path !== dashboardPath) {
          navigate(dashboardPath, { replace: true });
        }
        return;
      }

      // If user is on a landlord route but not a landlord, redirect to renter dashboard
      // Exclude signup pages from this check since they should be accessible to unauthenticated users
      if (isLandlordRoute && detectedRole !== 'landlord' && !path.includes('/signup')) {
        // console.log('Not a landlord, redirecting to chat');
        navigate('/chat', { replace: true });
        return;
      }

      // If user is a renter but on a landlord route, redirect to renter dashboard
      // Exclude signup pages from this check
      if (detectedRole === 'renter' && isLandlordRoute && !path.includes('/signup')) {
        // console.log('Renter on landlord route, redirecting to chat');
        navigate('/chat', { replace: true });
        return;
      }
    }
    // Handle unauthenticated users
    else {
      const authPages = ['/login', '/landlord/login', '/signup', '/landlord/signup', '/forgot-password', '/reset-password', '/user-type'];

      // If not on an auth page and not on the home page, redirect to login
      if (!authPages.includes(path) && path !== '/') {
        // For landlord routes, redirect to landlord login, otherwise regular login
        const loginPath = isLandlordRoute ? '/landlord/login' : '/login';
        // console.log('Unauthenticated user, redirecting to:', loginPath, 'from path:', path);
        if (path !== loginPath) {
          navigate(`${loginPath}?redirected=true&from=${encodeURIComponent(path)}`, {
            replace: true,
            state: { from: path }
          });
        }
      }
    }
  }, [user, loading, isAuthenticated, location.pathname, navigate, roles, currentRole]);

  // Initialize PostHog
  useEffect(() => {
    try {
      if (typeof initPostHog === 'function') {
        initPostHog();
      } else {
        console.warn('initPostHog is not a function');
      }
    } catch (error) {
      console.error('Failed to initialize PostHog:', error);
    }
  }, []);

  // Set document title
  React.useEffect(() => {
    document.title = 'HomeSwift';
  }, []);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-white via-gray-50 to-white p-4"
      >
        <div className="relative">
          {/* Animated logo */}
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="mb-8"
          >
            <img
              src="/images/logo.png"
              alt="HomeSwift"
              className="w-20 h-20 object-cover rounded-2xl shadow-lg"
            />
          </motion.div>

          {/* Animated spinner */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "linear"
            }}
            className="w-16 h-16 border-4 border-[#FF6B35]/20 border-t-[#FF6B35] rounded-full mx-auto mb-6"
          />
        </div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <main className="flex-grow">
        <Toaster position="top-right" />
        <Suspense
          fallback={
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-white via-gray-50 to-white p-4"
            >
              <div className="relative">
                {/* Animated logo */}
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="mb-8"
                >
                  <img
                    src="/images/logo.png"
                    alt="HomeSwift"
                    className="w-20 h-20 object-cover rounded-2xl shadow-lg"
                  />
                </motion.div>

                {/* Animated spinner */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  className="w-16 h-16 border-4 border-[#FF6B35]/20 border-t-[#FF6B35] rounded-full mx-auto mb-6"
                />
              </div>
            </motion.div>
          }
        >
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/user-type" element={<UserTypeSelection />} />

            {/* Auth Routes */}
            <Route
              path="/login"
              element={
                !isAuthenticated || new URLSearchParams(location.search).get('from') === 'logout' ? (
                  <LoginPage />
                ) : user?.user_type === 'landlord' ? (
                  <Navigate to="/landlord/dashboard" replace />
                ) : (
                  <Navigate to="/chat" replace />
                )
              }
            />

            <Route
              path="/signup"
              element={
                !isAuthenticated ? (
                  <SignupPage />
                ) : user?.user_type === 'landlord' ? (
                  <Navigate to="/landlord/dashboard" replace />
                ) : (
                  <Navigate to="/chat" replace />
                )
              }
            />

            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/landlord/login" element={<LandlordLoginPage />} />
            <Route path="/landlord/signup" element={<LandlordSignupPage />} />

            {/* Renter Routes */}
            <Route
              path="/renter/dashboard"
              element={
                <ProtectedRoute requiredRoles={['renter']}>
                  <RenterDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/browse"
              element={
                <ProtectedRoute requiredRoles={['renter', 'landlord']}>
                  <PropertyBrowse />
                </ProtectedRoute>
              }
            />

            {/* Protected Routes */}
            <Route
              path="/chat"
              element={
                <ProtectedRoute requiredRoles={['renter', 'landlord']}>
                  <RenterHomePage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/messages"
              element={
                <ProtectedRoute requiredRoles={['renter', 'landlord']}>
                  <ChatPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/landlord/dashboard"
              element={
                <ProtectedRoute requiredRoles={['landlord']}>
                  <LandlordDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/landlord/settings"
              element={
                <ProtectedRoute requiredRoles={['landlord']}>
                  <LandlordSettings />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/analytics"
              element={
                <ProtectedRoute requiredRoles={['landlord', 'renter']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/properties/:id"
              element={
                <ProtectedRoute requiredRoles={['renter', 'landlord']}>
                  <PropertyDetails />
                </ProtectedRoute>
              }
            />

            <Route
              path="/list-property"
              element={
                <ProtectedRoute requiredRoles={['landlord']}>
                  <ListPropertyForm />
                </ProtectedRoute>
              }
            />

            <Route
              path="/inquiries"
              element={
                <ProtectedRoute requiredRoles={['landlord']}>
                  <InquiryManagement />
                </ProtectedRoute>
              }
            />

            {/* AI-Powered Real Estate Pages */}
            <Route
              path="/neighborhoods"
              element={
                <ProtectedRoute requiredRoles={['renter', 'landlord']}>
                  <NeighborhoodInfo />
                </ProtectedRoute>
              }
            />

            <Route
              path="/virtual-tours"
              element={
                <ProtectedRoute requiredRoles={['renter', 'landlord']}>
                  <VirtualTours />
                </ProtectedRoute>
              }
            />

            {/* Catch-all route */}
            <Route
              path="/saved"
              element={
                <ProtectedRoute requiredRoles={['renter', 'landlord']}>
                  <SavedProperties />
                </ProtectedRoute>
              }
            />

            <Route
              path="/compare"
              element={
                <ProtectedRoute requiredRoles={['renter', 'landlord']}>
                  <PropertyComparison />
                </ProtectedRoute>
              }
            />



            <Route
              path="/analytics"
              element={
                <ProtectedRoute requiredRoles={['landlord']}>
                  <PropertyAnalytics />
                </ProtectedRoute>
              }
            />

            <Route
              path="/recommendations"
              element={
                <ProtectedRoute requiredRoles={['renter', 'landlord']}>
                  <PropertyRecommendations />
                </ProtectedRoute>
              }
            />





            <Route
              path="/history"
              element={
                <ProtectedRoute requiredRoles={['renter', 'landlord']}>
                  <ComparisonHistory />
                </ProtectedRoute>
              }
            />



            <Route
              path="/alerts"
              element={
                <ProtectedRoute requiredRoles={['renter', 'landlord']}>
                  <PropertyAlerts />
                </ProtectedRoute>
              }
            />

            <Route
              path="/about"
              element={<About />}
            />

            <Route
              path="/contact"
              element={<Contact />}
            />

            <Route
              path="/gallery"
              element={<Gallery />}
            />

            <Route
              path="/renter-properties"
              element={
                <ProtectedRoute requiredRoles={['renter']}>
                  <RenterProperties />
                </ProtectedRoute>
              }
            />

            <Route
              path="/properties"
              element={
                <ProtectedRoute requiredRoles={['renter', 'landlord']}>
                  <Properties />
                </ProtectedRoute>
              }
            />

            <Route
              path="/landlord-properties"
              element={
                <ProtectedRoute requiredRoles={['landlord']}>
                  <LandlordProperties />
                </ProtectedRoute>
              }
            />

            <Route
              path="/message-center"
              element={
                <ProtectedRoute requiredRoles={['renter', 'landlord']}>
                  <MessageCenter />
                </ProtectedRoute>
              }
            />

            <Route
              path="/faq"
              element={<FAQ />}
            />

            {/* Legal Pages */}
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />

            {/* Support */}
            <Route path="/help" element={<Help />} />

            {/* User Pages */}
            <Route
              path="/settings"
              element={
                <ProtectedRoute requiredRoles={['renter', 'landlord']}>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute requiredRoles={['renter', 'landlord']}>
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* Property Edit */}
            <Route
              path="/properties/:id/edit"
              element={
                <ProtectedRoute requiredRoles={['landlord']}>
                  <EditPropertyForm />
                </ProtectedRoute>
              }
            />

            {/* Redirects for consistency */}
            <Route path="/landlord-dashboard" element={<Navigate to="/landlord/dashboard" replace />} />
            <Route path="/properties/new" element={<Navigate to="/list-property" replace />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
};

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-xl font-bold text-red-600 mb-4">Something went wrong</h2>
            <p className="text-gray-700 mb-4">
              We're sorry, but an unexpected error occurred. The issue has been logged.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Main App Component
const App = () => {
  // Initialize PostHog and register service worker
  useEffect(() => {
    // Check and clear cache if version changed
    checkAndClearCache();

    // Initialize PostHog
    try {
      initPostHog();
    } catch (error) {
      console.error('Failed to initialize PostHog:', error);
    }

    // Register service worker for PWA functionality in production
    if (process.env.NODE_ENV === 'production') {
      const handleUpdateAvailable = () => {
        console.log('Service Worker: Update available, reloading...');
        window.location.reload();
      };

      // Register service worker with update handler
      registerServiceWorker(handleUpdateAvailable).catch(error => {
        console.error('Failed to register service worker:', error);
      });
    }
  }, []);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <OfflineIndicator />
        <PWAInstallPrompt />
        <UpdatePrompt onUpdate={() => window.location.reload()} />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#363636',
              color: '#fff',
              borderRadius: '0.5rem',
              padding: '1rem',
            },
          }}
        />
        <AppLayout />
      </div>
    </ErrorBoundary>
  );
};

export default App;

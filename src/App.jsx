import React, { Suspense } from 'react';
import { motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy load pages for better performance
const Home = React.lazy(() => import('./pages/Home'));
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const SignupPage = React.lazy(() => import('./pages/SignupPage'));
const RenterDashboard = React.lazy(() => import('./pages/RenterDashboard'));
const PropertyBrowse = React.lazy(() => import('./pages/PropertyBrowse'));
const LandlordPropertyBrowse = React.lazy(() => import('./pages/LandlordPropertyBrowse'));
const LandlordLoginPage = React.lazy(() => import('./pages/LandlordLoginPage'));
const LandlordSignupPage = React.lazy(() => import('./pages/LandlordSignupPage'));
const LandlordDashboard = React.lazy(() => import('./pages/LandlordDashboard'));
const LandlordSettings = React.lazy(() => import('./pages/LandlordSettings'));
const ChatPage = React.lazy(() => import('./pages/ChatPage'));
const Properties = React.lazy(() => import('./pages/Properties'));
const About = React.lazy(() => import('./pages/About'));
const Contact = React.lazy(() => import('./pages/Contact'));
const Gallery = React.lazy(() => import('./pages/Gallery'));
const LandlordProperties = React.lazy(() => import('./pages/LandlordProperties'));
const MessageCenter = React.lazy(() => import('./pages/MessageCenter'));
const FAQ = React.lazy(() => import('./pages/FAQ'));
const VerifyEmail = React.lazy(() => import('./pages/VerifyEmail'));
const AuthCallback = React.lazy(() => import('./pages/AuthCallback'));
const UserTypeSelection = React.lazy(() => import('./pages/UserTypeSelection'));
const ForgotPassword = React.lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = React.lazy(() => import('./pages/ResetPassword'));
const PropertyDetails = React.lazy(() => import('./pages/PropertyDetails'));
const SavedProperties = React.lazy(() => import('./pages/SavedProperties'));
const Profile = React.lazy(() => import('./pages/Profile'));
const MarketAnalysis = React.lazy(() => import('./pages/MarketAnalysis'));
const NeighborhoodInfo = React.lazy(() => import('./pages/NeighborhoodInfo'));
const PriceCalculator = React.lazy(() => import('./pages/PriceCalculator'));
const VirtualTours = React.lazy(() => import('./pages/VirtualTours'));
const Messages = React.lazy(() => import('./pages/Messages'));
const ListPropertyForm = React.lazy(() => import('./pages/ListPropertyForm'));
const RenterProperties = React.lazy(() => import('./pages/RenterProperties'));
const InquiryManagement = React.lazy(() => import('./pages/InquiryManagement'));

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
      // console.log('AppLayout Auth Debug:', {
      //   isAuthenticated,
      //   user: user ? 'exists' : 'null',
      //   userType,
      //   storedRoles,
      //   authContextRoles,
      //   allRoles,
      //   currentRole,
      //   detectedRole,
      //   path,
      //   isLandlordLoginPage,
      //   isLoginPage
      // });

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
      if (isLandlordRoute && detectedRole !== 'landlord') {
        // console.log('Not a landlord, redirecting to chat');
        navigate('/chat', { replace: true });
        return;
      }

      // If user is a renter but on a landlord route, redirect to renter dashboard
      if (detectedRole === 'renter' && isLandlordRoute) {
        // console.log('Renter on landlord route, redirecting to chat');
        navigate('/chat', { replace: true });
        return;
      }
    }
    // Handle unauthenticated users
    else {
      const authPages = ['/login', '/landlord/login', '/signup', '/forgot-password', '/reset-password', '/user-type'];

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

          {/* Pulsing dots */}
          <div className="flex justify-center space-x-2 mb-4">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut"
                }}
                className="w-3 h-3 bg-[#FF6B35] rounded-full"
              />
            ))}
          </div>

          {/* Loading text with typewriter effect */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-center"
          >
            <motion.h2
              className="text-2xl font-bold text-[#2C3E50] mb-2"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Loading HomeSwift
            </motion.h2>
            <motion.p
              className="text-gray-600 text-lg"
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
            >
              Preparing your AI real estate experience...
            </motion.p>
          </motion.div>

          {/* Progress bar */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 3, ease: "easeInOut" }}
            className="mt-8 w-64 h-1 bg-gray-200 rounded-full overflow-hidden mx-auto"
          >
            <motion.div
              animate={{
                x: ["0%", "100%", "0%"]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="h-full bg-gradient-to-r from-[#FF6B35] to-[#e85e2f] rounded-full"
            />
          </motion.div>
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

                {/* Pulsing dots */}
                <div className="flex justify-center space-x-2 mb-4">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.5, 1, 0.5]
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.2,
                        ease: "easeInOut"
                      }}
                      className="w-3 h-3 bg-[#FF6B35] rounded-full"
                    />
                  ))}
                </div>

                {/* Loading text with typewriter effect */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-center"
                >
                  <motion.h2
                    className="text-2xl font-bold text-[#2C3E50] mb-2"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    Loading Page
                  </motion.h2>
                  <motion.p
                    className="text-gray-600 text-lg"
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                  >
                    Please wait...
                  </motion.p>
                </motion.div>

                {/* Progress bar */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 3, ease: "easeInOut" }}
                  className="mt-8 w-64 h-1 bg-gray-200 rounded-full overflow-hidden mx-auto"
                >
                  <motion.div
                    animate={{
                      x: ["0%", "100%", "0%"]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="h-full bg-gradient-to-r from-[#FF6B35] to-[#e85e2f] rounded-full"
                  />
                </motion.div>
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
                user?.user_type === 'landlord' ? (
                  <ProtectedRoute requiredRoles={['landlord']}>
                    <LandlordPropertyBrowse />
                  </ProtectedRoute>
                ) : (
                  <ProtectedRoute requiredRoles={['renter', 'landlord']}>
                    <PropertyBrowse />
                  </ProtectedRoute>
                )
              }
            />

            {/* Protected Routes */}
            <Route
              path="/chat"
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
              path="/market-analysis"
              element={
                <ProtectedRoute requiredRoles={['renter', 'landlord']}>
                  <MarketAnalysis />
                </ProtectedRoute>
              }
            />

            <Route
              path="/neighborhoods"
              element={
                <ProtectedRoute requiredRoles={['renter', 'landlord']}>
                  <NeighborhoodInfo />
                </ProtectedRoute>
              }
            />

            <Route
              path="/calculator"
              element={
                <ProtectedRoute requiredRoles={['renter', 'landlord']}>
                  <PriceCalculator />
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
              path="/profile"
              element={
                <ProtectedRoute requiredRoles={['renter', 'landlord']}>
                  <Profile />
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

            {/* Catch-all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
};

// Main App Component
const App = () => {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
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
      </AuthProvider>
    </Router>
  );
};

export default App;

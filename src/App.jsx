import React, { Suspense } from 'react';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Lazy load pages for better performance
const Home = React.lazy(() => import('./pages/Home'));
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const SignupPage = React.lazy(() => import('./pages/SignupPage'));
const LandlordLoginPage = React.lazy(() => import('./pages/LandlordLoginPage.jsx'));
const LandlordSignupPage = React.lazy(() => import('./pages/LandlordSignupPage.jsx'));
const LandlordDashboard = React.lazy(() => import('./pages/LandlordDashboard'));
const ChatPage = React.lazy(() => import('./pages/ChatPage'));
const UserTypeSelection = React.lazy(() => import('./pages/UserTypeSelection'));
const ForgotPassword = React.lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = React.lazy(() => import('./pages/ResetPassword'));
const VerifyEmail = React.lazy(() => import('./pages/VerifyEmail'));
const AuthCallback = React.lazy(() => import('./pages/AuthCallback'));
const Messages = React.lazy(() => import('./pages/Messages'));
const Properties = React.lazy(() => import('./pages/Properties'));
const ListPropertyForm = React.lazy(() => import('./pages/ListPropertyForm'));

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, loading, roles, currentRole } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary mx-auto mb-4"></div>
            <div className="absolute inset-0 rounded-full h-16 w-16 border-2 border-primary/10 animate-pulse"></div>
          </div>
          <h2 className="text-xl font-semibold text-secondary mb-2">Checking Access</h2>
          <p className="text-gray-600">Verifying your permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check roles from multiple sources for consistency
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userType = storedUser?.user_metadata?.user_type || storedUser?.user_type;
  const storedRoles = roles || JSON.parse(localStorage.getItem('userRoles') || '[]');
  const detectedRole = currentRole || storedRoles.find(r => r.is_primary)?.role || storedRoles[0]?.role || userType || 'renter';

  console.log('ProtectedRoute Check:', { requiredRole, detectedRole, currentRole, userType, storedRoles });

  if (requiredRole && detectedRole !== requiredRole) {
    // Redirect to a default route based on the user's role
    const defaultRoute = detectedRole === 'landlord'
      ? '/landlord/dashboard'
      : '/chat';
    return <Navigate to={defaultRoute} replace />;
  }

  return children;
};

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
        console.log('Redirecting from login to:', dashboardPath, 'based on role:', detectedRole);
        if (path !== dashboardPath) {
          navigate(dashboardPath, { replace: true });
        }
        return;
      }

      // For other public routes when authenticated
      if (publicRoutes.includes(path)) {
        const dashboardPath = detectedRole === 'landlord' ? '/landlord/dashboard' : '/chat';
        console.log('Redirecting from public route to:', dashboardPath);
        if (path !== dashboardPath) {
          navigate(dashboardPath, { replace: true });
        }
        return;
      }

      // If user is on a landlord route but not a landlord, redirect to chat
      if (isLandlordRoute && detectedRole !== 'landlord') {
        console.log('Not a landlord, redirecting to chat');
        navigate('/chat', { replace: true });
        return;
      }

      // If user is a landlord but on a non-landlord route, redirect to landlord dashboard
      if (detectedRole === 'landlord' && !isLandlordRoute && !publicRoutes.includes(path)) {
        console.log('Landlord on non-landlord route, redirecting to landlord dashboard');
        navigate('/landlord/dashboard', { replace: true });
        return;
      }
    }
    // Handle unauthenticated users
    else {
      const authPages = ['/login', '/landlord/login', '/signup', '/forgot-password', '/reset-password'];

      // If not on an auth page and not on the home page, redirect to login
      if (!authPages.includes(path) && path !== '/') {
        // For landlord routes, redirect to landlord login, otherwise regular login
        const loginPath = isLandlordRoute ? '/landlord/login' : '/login';
        console.log('Unauthenticated user, redirecting to:', loginPath, 'from path:', path);
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
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-primary/20 border-t-primary mx-auto mb-6"></div>
            <div className="absolute inset-0 rounded-full h-20 w-20 border-2 border-primary/10 animate-pulse"></div>
          </div>
          <h2 className="text-2xl font-bold text-secondary mb-3">Loading HomeSwift</h2>
          <p className="text-gray-600 text-lg">Please wait while we prepare your experience...</p>
          <div className="mt-6 flex justify-center">
            <div className="flex space-x-2">
              <div className="w-3 h-3 bg-primary rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <main className="flex-grow">
        <Toaster position="top-right" />
        <Suspense 
          fallback={
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
              <div className="text-center">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary mx-auto mb-4"></div>
                  <div className="absolute inset-0 rounded-full h-16 w-16 border-2 border-primary/10 animate-pulse"></div>
                </div>
                <h2 className="text-xl font-semibold text-secondary mb-2">Loading Page</h2>
                <p className="text-gray-600">Please wait...</p>
              </div>
            </div>
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
            
            {/* Protected Routes */}
            <Route
              path="/chat"
              element={
                <ProtectedRoute requiredRole="renter">
                  <ChatPage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/landlord/dashboard"
              element={
                <ProtectedRoute requiredRole="landlord">
                  <LandlordDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/properties"
              element={
                <ProtectedRoute requiredRole="landlord">
                  <Properties />
                </ProtectedRoute>
              }
            />

            <Route
              path="/list-property"
              element={
                <ProtectedRoute requiredRole="landlord">
                  <ListPropertyForm />
                </ProtectedRoute>
              }
            />

            <Route
              path="/messages"
              element={
                <ProtectedRoute requiredRole="landlord">
                  <Messages />
                </ProtectedRoute>
              }
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

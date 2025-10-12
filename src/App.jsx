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

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, loading, roles } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const userRoles = roles || JSON.parse(localStorage.getItem('userRoles') || '[]');
  const hasRequiredRole = userRoles.some(role => role.role === requiredRole);

  if (!hasRequiredRole) {
    // Redirect to a default route based on the user's role
    const defaultRoute = userRoles.find(r => r.is_primary)?.role === 'landlord' 
      ? '/landlord/dashboard' 
      : '/chat';
    return <Navigate to={defaultRoute} replace />;
  }

  return children;
};

// Main App Layout Component
const AppLayout = () => {
  const { user, isAuthenticated, loading } = useAuth();
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
    if (isAuthenticated) {
      const publicRoutes = ['/', '/login', '/signup', '/user-type', '/forgot-password', '/reset-password', '/landlord/login'];
      
      // Get user roles from localStorage or context
      const storedRoles = JSON.parse(localStorage.getItem('userRoles') || '[]');
      const currentRole = storedRoles.find(r => r.is_primary)?.role || storedRoles[0]?.role || 'renter';
      
      // If we're on a login page, redirect to the appropriate dashboard
      if (isLoginPage || isLandlordLoginPage) {
        const dashboardPath = currentRole === 'landlord' ? '/landlord/dashboard' : '/chat';
        if (path !== dashboardPath) {
          navigate(dashboardPath, { replace: true });
        }
        return;
      }
      
      // For other public routes when authenticated
      if (publicRoutes.includes(path)) {
        const dashboardPath = currentRole === 'landlord' ? '/landlord/dashboard' : '/chat';
        if (path !== dashboardPath) {
          navigate(dashboardPath, { replace: true });
        }
        return;
      }
      
      // If user is on a landlord route but not a landlord, redirect to chat
      if (isLandlordRoute && currentRole !== 'landlord') {
        navigate('/chat', { replace: true });
        return;
      }
      
      // If user is a landlord but on a non-landlord route, redirect to landlord dashboard
      if (currentRole === 'landlord' && !isLandlordRoute && !publicRoutes.includes(path)) {
        navigate('/landlord/dashboard', { replace: true });
        return;
      }
    } 
    // Handle unauthenticated users
    else {
      const authPages = ['/login', '/landlord/login', '/signup', '/forgot-password', '/reset-password'];
      
      // If not on an auth page and not on the home page, redirect to login
      if (!authPages.includes(path) && path !== '/') {
        const loginPath = isLandlordRoute ? '/landlord/login' : '/login';
        if (path !== loginPath) {
          navigate(`${loginPath}?redirected=true&from=${encodeURIComponent(path)}`, { 
            replace: true,
            state: { from: path }
          });
        }
      }
    }
  }, [user, loading, isAuthenticated, location.pathname, navigate]);

  // Set document title
  React.useEffect(() => {
    document.title = 'HomeSwift';
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <main className="flex-grow">
        <Toaster position="top-right" />
        <Suspense 
          fallback={
            <div className="flex items-center justify-center min-h-screen">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          }
        >
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
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

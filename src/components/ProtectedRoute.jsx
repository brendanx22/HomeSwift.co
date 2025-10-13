// src/components/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Protected Route component for role-based access control
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if access is allowed
 * @param {string[]} props.requiredRoles - Array of roles required to access the route
 * @param {string} props.fallbackPath - Path to redirect to if access is denied (default: '/login')
 * @returns {React.ReactNode} - Either the children or a redirect component
 */
export default function ProtectedRoute({
  children,
  requiredRoles = [],
  fallbackPath = '/login'
}) {
  const { user, currentRole, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while auth state is being determined
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
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

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <Navigate
        to={fallbackPath}
        state={{ from: location }}
        replace
      />
    );
  }

  // Check if user has any of the required roles
  if (requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.includes(currentRole);

    if (!hasRequiredRole) {
      // Redirect to appropriate dashboard based on user's current role
      const defaultRoute = currentRole === 'landlord'
        ? '/landlord/dashboard'
        : '/chat';

      return (
        <Navigate
          to={defaultRoute}
          state={{
            from: location,
            error: `Access denied. Required role: ${requiredRoles.join(' or ')}`
          }}
          replace
        />
      );
    }
  }

  // User is authenticated and has required role(s)
  return children;
}

/**
 * Higher-order component for role-based access control
 * @param {React.ComponentType} Component - Component to wrap
 * @param {string[]} requiredRoles - Array of roles required to access the component
 * @returns {React.ComponentType} - Wrapped component
 */
export function withRoleProtection(Component, requiredRoles = []) {
  return function ProtectedComponent(props) {
    return (
      <ProtectedRoute requiredRoles={requiredRoles}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

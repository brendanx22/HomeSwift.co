// src/components/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Loading from './Loading';

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
    return <Loading />;
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

    console.log('🚨 ProtectedRoute role check:', {
      currentRole,
      requiredRoles,
      hasRequiredRole,
      user: user ? 'authenticated' : 'not authenticated',
      userId: user?.id,
      userType: user?.user_metadata?.user_type
    });

    // If currentRole is null but user is authenticated, try to get role from localStorage
    if (!hasRequiredRole && currentRole === null && user) {
      try {
        const storedRoles = JSON.parse(localStorage.getItem('userRoles') || '[]');
        const storedCurrentRole = localStorage.getItem('currentRole');

        console.log('🔍 ProtectedRoute fallback check:', {
          storedRoles: storedRoles.length,
          storedCurrentRole,
          requiredRoles,
          checkingStoredRoles: storedRoles.some(role => requiredRoles.includes(role.role)),
          checkingStoredCurrentRole: storedCurrentRole && requiredRoles.includes(storedCurrentRole)
        });

        // Check if user has any of the required roles in stored data
        const hasStoredRole = storedRoles.some(role => requiredRoles.includes(role.role)) ||
                             (storedCurrentRole && requiredRoles.includes(storedCurrentRole));

        if (hasStoredRole) {
          console.log('✅ Found required role in localStorage, allowing access');
          return children;
        }

        // Additional fallback: check user_type from metadata if roles aren't available yet
        const userType = user?.user_metadata?.user_type;
        if (userType && requiredRoles.includes(userType)) {
          console.log('✅ Found required role in user metadata, allowing access');
          return children;
        }

        console.log('❌ No required role found in localStorage or metadata');
      } catch (error) {
        console.error('Error checking stored roles:', error);
      }
    }

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

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, requiredUserType }) {
  const { user, userType, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>; // Or a loading spinner
  }

  if (!user) {
    // Redirect to login page with the current path they were trying to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If a specific user type is required and the current user doesn't match
  if (requiredUserType && userType !== requiredUserType) {
    // Redirect to the appropriate dashboard based on user type
    const redirectTo = userType === 'landlord' ? '/landlord/dashboard' : '/chat';
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}

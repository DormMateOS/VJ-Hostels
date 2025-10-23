import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../auth/authStore';

/**
 * ProtectedRoute Component
 * Protects routes based on authentication status and user role
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - The component to render if authorized
 * @param {string|string[]} props.allowedRoles - Role(s) allowed to access this route
 * @returns {React.ReactNode}
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, isCheckingAuth, authCheckCompleted, user, checkAuth } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    // Only check auth if it hasn't been completed yet
    if (!authCheckCompleted && !isCheckingAuth) {
      checkAuth();
    }
  }, [authCheckCompleted, isCheckingAuth, checkAuth]);

  // Show loading spinner while checking authentication
  if (isCheckingAuth || !authCheckCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access if roles are specified
  if (allowedRoles) {
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    const userRole = user?.role;

    if (!userRole || !roles.includes(userRole)) {
      // Redirect to appropriate dashboard based on user's actual role
      const redirectPath = getUserRolePath(userRole);
      return <Navigate to={redirectPath} replace />;
    }
  }

  // User is authenticated and authorized
  return children;
};

/**
 * Get the appropriate path based on user role
 * @param {string} role - User's role
 * @returns {string} - Path to redirect to
 */
const getUserRolePath = (role) => {
  switch (role) {
    case 'student':
      return '/student';
    case 'admin':
      return '/admin';
    case 'security':
    case 'guard':
      return '/security';
    default:
      return '/login';
  }
};

export default ProtectedRoute;

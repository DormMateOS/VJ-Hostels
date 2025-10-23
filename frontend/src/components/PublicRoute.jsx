import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../auth/authStore';

/**
 * PublicRoute Component
 * Redirects authenticated users away from public pages (like login)
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - The component to render if not authenticated
 * @returns {React.ReactNode}
 */
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isCheckingAuth, authCheckCompleted, user, checkAuth } = useAuthStore();

  useEffect(() => {
    // Only check auth if it hasn't been completed yet
    if (!authCheckCompleted && !isCheckingAuth) {
      checkAuth();
    }
  }, [authCheckCompleted, isCheckingAuth, checkAuth]);

  // If auth check is completed and user is not authenticated, show login immediately
  if (authCheckCompleted && !isAuthenticated) {
    return children;
  }

  // Show loading spinner only while actively checking authentication
  if (isCheckingAuth || !authCheckCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If authenticated, redirect to role-based dashboard
  if (isAuthenticated && user) {
    const userRole = user.role;
    
    switch (userRole) {
      case 'student':
        return <Navigate to="/student" replace />;
      case 'admin':
        return <Navigate to="/admin" replace />;
      case 'security':
      case 'guard':
        return <Navigate to="/security" replace />;
      default:
        // If role is unknown, stay on public page
        return children;
    }
  }

  // User is not authenticated, show public page
  return children;
};

export default PublicRoute;

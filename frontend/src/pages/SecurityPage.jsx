import React from 'react';
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from '../context/SecurityContext';  // Changed import
import Guard from '../components/security/Guard';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function SecurityPage() {
  return (
    <AuthProvider> 
      <Routes>
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Guard />
            </ProtectedRoute>
          } 
        />
        {/* Redirect all other paths to root */}
        <Route path="*" element={<Navigate to="/security" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default SecurityPage;

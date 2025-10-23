import React from 'react';
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from '../context/SecurityContext';
import SecurityLayout from '../layouts/SecurityLayout'
import VisitorManagement from '../components/security/VisitorManagement';
import Home from '../components/student/HomePage'
import Attendance from '../components/security/Attendance';

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
        <Route path="/" element={
          <ProtectedRoute>
            <SecurityLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Home />} />
          <Route path="home" element={<Home />} />
          <Route path="visitors" element={<VisitorManagement />} />
          <Route path="attendance" element={<Attendance/>}></Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default SecurityPage;

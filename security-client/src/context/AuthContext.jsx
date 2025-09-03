import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('guard_token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await authAPI.verifyToken();
      if (response.data.success) {
        setUser(response.data.user);
      } else {
        localStorage.removeItem('guard_token');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('guard_token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      setError(null);
      setLoading(true);

      console.log('AuthContext: Sending login request with:', credentials);
      const response = await authAPI.guardLogin(credentials);
      console.log('AuthContext: Login response:', response.data);
      
      if (response.data.success) {
        const { token, user } = response.data;
        localStorage.setItem('guard_token', token);
        setUser(user);
        console.log('AuthContext: Login successful, user set:', user);
        return { success: true };
      } else {
        console.log('AuthContext: Login failed:', response.data.message);
        setError(response.data.message);
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      console.error('AuthContext: Login error:', error);
      const message = error.response?.data?.message || 'Login failed';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('guard_token');
    setUser(null);
    setError(null);
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

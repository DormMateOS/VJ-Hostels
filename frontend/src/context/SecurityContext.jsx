import React, { createContext, useContext, useState, useEffect } from 'react';

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Check for guard_token first (username/password login)
      // Then check for auth-token or token (Google OAuth login)
      const token = localStorage.getItem('guard_token') || 
                    localStorage.getItem('auth-token') || 
                    localStorage.getItem('token');
      
      if (!token) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      // Decode JWT token to get user data
      const tokenParts = token.split('.');
      if (tokenParts.length === 3) {
        try {
          const decodedToken = JSON.parse(atob(tokenParts[1]));
          console.log('Decoded token payload:', decodedToken);
          
          // Check if this is a security/guard token
          if (decodedToken.role !== 'guard' && decodedToken.role !== 'security') {
            console.log('Token is not for security role, clearing...');
            setIsAuthenticated(false);
            setLoading(false);
            return;
          }
          
          // Extract user from token payload - support multiple formats
          let userData = decodedToken.user || decodedToken.guardId || decodedToken;
          
          // Ensure user has an _id field - critical for backend authentication
          if (userData) {
            // Map various ID formats to _id
            if (!userData._id) {
              userData._id = userData.id || userData.guardId || decodedToken.id || decodedToken.sub;
            }
            if (!userData.id) {
              userData.id = userData._id;
            }
            // Ensure role is set
            userData.role = decodedToken.role || 'guard';
          }
          
          // Store the token as guard_token for consistency
          if (!localStorage.getItem('guard_token')) {
            localStorage.setItem('guard_token', token);
          }
          
          setUser(userData);
          setIsAuthenticated(true);
          console.log('Auth check successful, user:', userData);
        } catch (decodeError) {
          console.error('Token decode failed:', decodeError);
          localStorage.removeItem('guard_token');
          localStorage.removeItem('auth-token');
          localStorage.removeItem('token');
          setIsAuthenticated(false);
        }
      } else {
        localStorage.removeItem('guard_token');
        localStorage.removeItem('auth-token');
        localStorage.removeItem('token');
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('guard_token');
      localStorage.removeItem('auth-token');
      localStorage.removeItem('token');
      setIsAuthenticated(false);
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
        setIsAuthenticated(true);
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
    // Clear all possible token variations from localStorage
    localStorage.removeItem('guard_token');
    localStorage.removeItem('token');
    localStorage.removeItem('auth-token');
    localStorage.removeItem('admin');
    localStorage.removeItem('adminToken');
    setUser(null);
    setError(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

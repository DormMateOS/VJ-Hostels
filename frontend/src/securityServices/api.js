import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:6201';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  // Check for guard_token first, then fall back to auth-token or token
  const token = localStorage.getItem('guard_token') || 
                localStorage.getItem('auth-token') || 
                localStorage.getItem('token');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    // Decode and log token for debugging
    try {
      const tokenParts = token.split('.');
      if (tokenParts.length === 3) {
        const decoded = JSON.parse(atob(tokenParts[1]));
        console.log('Request with token payload:', decoded);
        
        // If using auth-token or token (OAuth), ensure it's also stored as guard_token
        if (!localStorage.getItem('guard_token') && 
            (decoded.role === 'guard' || decoded.role === 'security')) {
          localStorage.setItem('guard_token', token);
        }
      }
    } catch (e) {
      console.error('Could not decode token:', e);
    }
    console.log('Request headers:', config.headers.Authorization);
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log('API Error:', error.response?.status, error.response?.data);
    if (error.response?.status === 401) {
      localStorage.removeItem('guard_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  guardLogin: (credentials) => api.post('/auth/guard/login', credentials),
};

// OTP API - Match backend routes exactly
export const otpAPI = {
  requestOTP: (data) => api.post('/api/otp/request', data),
  verifyOTP: (data) => api.post('/api/otp/verify', data),
  getActiveVisits: (guardId) => {
    console.log('Fetching active visits for guardId:', guardId);
    console.log('Token:', localStorage.getItem('guard_token')?.substring(0, 50) + '...');
    return api.get('/api/otp/visits/active', { params: { guardId } });
  },
  getVisitHistory: (params) => api.get('/api/otp/visits/history', { params }),
  checkout: (visitId, data) => api.post(`/api/otp/visits/${visitId}/checkout`, data),
};

// Override API
export const overrideAPI = {
  requestOverride: (data) => api.post('/api/otp/override/request', data),
  getOverrideHistory: (params) => api.get('/api/otp/override/history', { params }),
};

// Student API
export const studentAPI = {
  searchStudents: (params) => api.get('/api/otp/students/search', { params }),
};

export default api;

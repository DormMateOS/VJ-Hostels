import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('guard_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('guard_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  guardLogin: (credentials) => api.post('/auth/guard/login', credentials),
  verifyToken: () => api.get('/auth/verify'),
};

// OTP API
export const otpAPI = {
  requestOTP: (data) => api.post('/api/otp/request', data),
  verifyOTP: (data) => api.post('/api/otp/verify', data),
  getActiveVisits: (guardId) => api.get('/api/otp/visits/active', { params: { guardId } }),
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

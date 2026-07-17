import axios from 'axios';
import api from './api';

const API_URL =
  process.env.NODE_ENV === 'development'
    ? '/api'
    : (process.env.REACT_APP_API_URL || '/api');

// Dedicated client for portal-session endpoints.
// Intentionally does NOT attach dashboard JWT Authorization header.
const accessSessionApi = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

accessSessionApi.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const accessCodeAPI = {
  // Generate a standalone portal access code
  generateCode: async (internLabel = '') => {
    return api.post('/access/generate-code', { internLabel });
  },
  generateNextCode: async (expiresInMinutes = 60) => {
    return api.post('/access/generate-next-code', { expiresInMinutes });
  },

  // Verify code and get access
  verifyCode: async (code) => {
    return api.post('/access/verify-code', { code });
  },

  // Check current session status
  verifySession: async () => {
    return accessSessionApi.get('/access/verify-session');
  },

  // Logout/revoke current session (also ends this code on other devices)
  logout: async () => {
    return accessSessionApi.post('/access/logout');
  },

  // Admin: force-logout every active portal session on every device
  logoutAllPortals: () => api.post('/access/logout-all-portals'),

  // Get code usage status
  getStatus: async (codeId) => {
    return api.get(`/access/status/${codeId}`);
  },

  // Get all codes (admin panel)
  getAllCodes: () => api.get('/access/all-codes'),

  // Revoke a code
  revokeCode: async (codeId) => {
    return api.put(`/access/revoke/${codeId}`);
  },

  // Permanently delete a code record
  deleteCode: (codeId) => api.delete(`/access/${codeId}`),
};

export default accessCodeAPI;

import axios from 'axios';

const API_URL =
  process.env.NODE_ENV === 'development'
    ? '/api'
    : (process.env.REACT_APP_API_URL || '/api');
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  config => {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Auth endpoints
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// Jobs endpoints
export const jobsAPI = {
  getAll: (filters) => api.get('/jobs', { params: filters }),
  getById: (id) => api.get(`/jobs/${id}`),
  create: (data) => api.post('/jobs', data),
  update: (id, data) => api.put(`/jobs/${id}`, data),
  delete: (id) => api.delete(`/jobs/${id}`),
};

// Applications endpoints
export const applicationsAPI = {
  apply: (data) => api.post('/applications', data),
  getMyApplications: () => api.get('/applications'),
  getJobApplications: () => api.get('/applications?forJobs=true'),
  updateStatus: (id, status) => api.put(`/applications/${id}/status`, { status }),
};

// CV endpoints
export const cvAPI = {
  upload: (file) => {
    const formData = new FormData();
    formData.append('cv', file);

    // Use the main api instance so interceptors (token + credentials) apply
    return api.post('/cv/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  getAll: () => api.get('/cv'),
  delete: (filename) => api.delete(`/cv/delete/${encodeURIComponent(filename)}`),
};

// Users endpoints
export const usersAPI = {
  getProfile: (id) => api.get(`/users/${id}`),
  updateProfile: (data) => api.put('/users/profile', data),
  search: (query) => api.get('/users/search', { params: { q: query } }),
  getInterns: () => api.get('/users/interns'),
  approveIntern: (id) => api.put(`/users/${id}/approve`),
  blockIntern: (id) => api.put(`/users/${id}/block`),
  unblockIntern: (id) => api.put(`/users/${id}/unblock`),
  deleteIntern: (id) => api.delete(`/users/${id}`),
  // Super Admin
  getDashboardUsers: () => api.get('/users/dashboard-users'),
  createDashboardUser: (data) => api.post('/users/dashboard-users', data),
  updateDashboardUserPassword: (id, password) => api.put(`/users/dashboard-users/${id}/password`, { password }),
  deleteDashboardUser: (id) => api.delete(`/users/dashboard-users/${id}`),
  logoutAllDashboardAdmins: () => api.post('/users/dashboard-users/logout-all-admins'),
};

export default api;

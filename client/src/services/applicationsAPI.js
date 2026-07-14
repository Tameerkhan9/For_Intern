import api from './api';

export const applicationsAPI = {
  getMyApplications: () => api.get('/applications/my'),
};

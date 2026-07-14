import api from './api';

export const feedbackAPI = {
  submit: (message, user = null) =>
    api.post('/feedback', { message, user }),
  getAll: () =>
    api.get('/feedback'),
  delete: (feedbackId) =>
    api.delete(`/feedback/${feedbackId}`),
};

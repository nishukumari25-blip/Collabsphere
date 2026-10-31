import api from './api';

export const analyticsService = {
  async getProjectAnalytics(projectId) {
    const res = await api.get(`/projects/${projectId}/analytics`);
    return res.data;
  },

  async getProjectActivities(projectId, params = {}) {
    const res = await api.get(`/projects/${projectId}/activities`, { params });
    return res.data;
  },

  async getUserDashboardStats() {
    const res = await api.get('/analytics/dashboard');
    return res.data;
  }
};

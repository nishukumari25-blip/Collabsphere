import api from './api';

export const publicService = {
  async getPublicProject(shareToken) {
    const res = await api.get(`/public/projects/${shareToken}`);
    return res.data;
  }
};

export const notificationService = {
  async getNotifications() {
    const res = await api.get('/notifications');
    return res.data;
  },

  async markAsRead(id) {
    const res = await api.put(`/notifications/${id}/read`);
    return res.data;
  },

  async markAllAsRead() {
    const res = await api.put('/notifications/read-all');
    return res.data;
  },

  async deleteNotification(id) {
    const res = await api.delete(`/notifications/${id}`);
    return res.data;
  }
};

export const userService = {
  async searchUsers(query) {
    const res = await api.get('/users/search', { params: { q: query } });
    return res.data;
  }
};

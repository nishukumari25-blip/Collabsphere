import api from './api';

export const projectService = {
  async getProjects(params = {}) {
    const res = await api.get('/projects', { params });
    return res.data;
  },

  async getProjectById(id) {
    const res = await api.get(`/projects/${id}`);
    return res.data;
  },

  async createProject(projectData) {
    const res = await api.post('/projects', projectData);
    return res.data;
  },

  async updateProject(id, projectData) {
    const res = await api.put(`/projects/${id}`, projectData);
    return res.data;
  },

  async deleteProject(id) {
    const res = await api.delete(`/projects/${id}`);
    return res.data;
  },

  async togglePublicShare(id, enabled) {
    const res = await api.post(`/projects/${id}/share-token`, { enabled });
    return res.data;
  },

  // Member management
  async getMembers(projectId) {
    const res = await api.get(`/projects/${projectId}/members`);
    return res.data;
  },

  async addMember(projectId, memberData) {
    const res = await api.post(`/projects/${projectId}/members`, memberData);
    return res.data;
  },

  async updateMemberRole(projectId, userId, role) {
    const res = await api.put(`/projects/${projectId}/members/${userId}`, { role });
    return res.data;
  },

  async removeMember(projectId, userId) {
    const res = await api.delete(`/projects/${projectId}/members/${userId}`);
    return res.data;
  }
};

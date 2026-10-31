import api from './api';

export const noteService = {
  async getNotes(projectId, params = {}) {
    const res = await api.get(`/projects/${projectId}/notes`, { params });
    return res.data;
  },

  async getNoteById(projectId, noteId) {
    const res = await api.get(`/projects/${projectId}/notes/${noteId}`);
    return res.data;
  },

  async createNote(projectId, noteData) {
    const res = await api.post(`/projects/${projectId}/notes`, noteData);
    return res.data;
  },

  async updateNote(projectId, noteId, noteData) {
    const res = await api.put(`/projects/${projectId}/notes/${noteId}`, noteData);
    return res.data;
  },

  async deleteNote(projectId, noteId) {
    const res = await api.delete(`/projects/${projectId}/notes/${noteId}`);
    return res.data;
  }
};

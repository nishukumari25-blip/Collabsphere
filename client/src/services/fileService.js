import api from './api';

export const fileService = {
  async getFiles(projectId, params = {}) {
    const res = await api.get(`/projects/${projectId}/files`, { params });
    return res.data;
  },

  async getFileMetadata(projectId, fileId) {
    const res = await api.get(`/projects/${projectId}/files/${fileId}`);
    return res.data;
  },

  async uploadFile(projectId, fileObject, onProgress) {
    const formData = new FormData();
    formData.append('file', fileObject);

    const res = await api.post(`/projects/${projectId}/files`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      }
    });
    return res.data;
  },

  async deleteFile(projectId, fileId) {
    const res = await api.delete(`/projects/${projectId}/files/${fileId}`);
    return res.data;
  },

  async previewRaw(projectId, fileId) {
    const res = await api.get(`/projects/${projectId}/files/${fileId}/preview?raw=true&format=json`);
    return res.data;
  },

  getDownloadUrl(projectId, fileId) {
    return `/api/projects/${projectId}/files/${fileId}/download`;
  },

  getPreviewUrl(projectId, fileId) {
    return `/api/projects/${projectId}/files/${fileId}/preview`;
  }
};

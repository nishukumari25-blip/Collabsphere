import api from './api';

export const geminiService = {
  async explainCode(data) {
    const res = await api.post('/gemini/explain', data);
    return res.data;
  },

  async generateDocs(data) {
    const res = await api.post('/gemini/docs', data);
    return res.data;
  },

  async generateReadme(data) {
    const res = await api.post('/gemini/readme', data);
    return res.data;
  },

  async improveNote(data) {
    const res = await api.post('/gemini/improve-note', data);
    return res.data;
  },

  async reviewCode(data) {
    const res = await api.post('/gemini/review-code', data);
    return res.data;
  }
};

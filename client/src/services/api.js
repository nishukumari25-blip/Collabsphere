
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL
    ? `${API_URL.replace(/\/+$/, '')}/api`
    : '/api',

  withCredentials: true,

  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach Bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Handle API errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected server error occurred';

    return Promise.reject(new Error(message));
  }
);

export default api;

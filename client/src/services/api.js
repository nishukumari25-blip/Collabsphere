import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // Send HttpOnly cookie
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach Bearer token from localStorage as fallback
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

// Response interceptor to handle 401 unauthenticated
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected server error occurred';

    // If unauthenticated on protected routes, we can trigger re-login
    if (error.response?.status === 401 && !window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register') && !window.location.pathname.startsWith('/share')) {
      // localStorage.removeItem('token');
    }

    return Promise.reject(new Error(message));
  }
);

export default api;

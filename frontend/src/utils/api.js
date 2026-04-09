import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Attach token to every request
api.interceptors.request.use((config) => {
  try {
    const stored = JSON.parse(localStorage.getItem('auth-store') || '{}');
    const token = stored?.state?.token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch (_) {}
  return config;
});

// Global error handling
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.detail || err.message || 'Something went wrong';
    if (err.response?.status === 401) {
      localStorage.removeItem('auth-store');
      window.location.href = '/login';
      return Promise.reject(err);
    }
    if (err.response?.status !== 422) {
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
    return Promise.reject(err);
  }
);

export default api;

import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const msg = error.response?.data?.detail || error.message || 'Something went wrong';
    if (error.response?.status === 401) {
      window.location.href = '/login';
    }
    toast.error(msg);
    return Promise.reject(error);
  }
);

export default api;

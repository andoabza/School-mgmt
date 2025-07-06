import axios from 'axios';
import { message } from 'antd';
//import { logout } from './auth';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  }
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      message.error('Session expired. Please login again.');
      //logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

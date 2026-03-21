import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('learnova_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('learnova_token');
      localStorage.removeItem('learnova_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default API;

/*
============================================
BACKEND TEAM INSTRUCTIONS:
============================================
Base URL: http://localhost:5000/api

All protected routes need:
  Header: Authorization: Bearer <jwt_token>

All responses should follow:
{
  success: true/false,
  data: {...},
  message: "string"
}

Error responses:
{
  success: false,
  message: "Error description"
}
============================================
*/

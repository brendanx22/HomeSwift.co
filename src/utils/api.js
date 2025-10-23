import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.homeswift.co/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access (e.g., token expired)
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  signup: (userData) => api.post('/auth/signup', userData),
  signin: (credentials) => api.post('/auth/signin', credentials),
  signout: () => api.post('/auth/signout'),
  getSession: () => api.get('/auth/session'),
  resendVerification: (email) => api.post('/auth/resend-verification', { email }),
};

// Properties API
export const propertyAPI = {
  getAll: () => api.get('/properties'),
  getMyProperties: () => api.get('/properties/my'),
  getById: (id) => api.get(`/properties/${id}`),
  create: (propertyData) => api.post('/properties', propertyData),
  update: (id, propertyData) => api.put(`/properties/${id}`, propertyData),
  delete: (id) => api.delete(`/properties/${id}`),
};

// Messages API
export const messageAPI = {
  send: (messageData) => api.post('/messages', messageData),
  getByProperty: (propertyId) => api.get(`/messages/property/${propertyId}`),
  getConversation: (userId) => api.get(`/messages/conversation/${userId}`),
  markAsRead: (messageId) => api.put(`/messages/${messageId}/read`),
};

export default api;

import { create } from 'zustand';
import API from '../api/axios';

const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('learnova_user')) || null,
  token: localStorage.getItem('learnova_token') || null,
  isAuthenticated: !!localStorage.getItem('learnova_token'),
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const res = await API.post('/auth/login', { email, password });
      const { token, user } = res.data.data;
      localStorage.setItem('learnova_token', token);
      localStorage.setItem('learnova_user', JSON.stringify(user));
      set({ user, token, isAuthenticated: true, loading: false });
      return user;
    } catch (err) {
      set({
        error: err.response?.data?.message || err.message || 'Login failed',
        loading: false,
      });
      throw err;
    }
  },

  signup: async (userData) => {
    set({ loading: true, error: null });
    try {
      const res = await API.post('/auth/signup', userData);
      const { token, user } = res.data.data;
      localStorage.setItem('learnova_token', token);
      localStorage.setItem('learnova_user', JSON.stringify(user));
      set({ user, token, isAuthenticated: true, loading: false });
      return user;
    } catch (err) {
      set({
        error: err.response?.data?.message || err.message || 'Signup failed',
        loading: false,
      });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('learnova_token');
    localStorage.removeItem('learnova_user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  updateUser: (userData) => {
    const updatedUser = { ...get().user, ...userData };
    localStorage.setItem('learnova_user', JSON.stringify(updatedUser));
    set({ user: updatedUser });
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;

/*
============================================
BACKEND API REQUIRED:
============================================

POST /api/auth/signup
Body: { name, email, password, role: "Learner" }
Response: { success: true, data: { token: "jwt", user: { _id, name, email, role, points } } }

POST /api/auth/login
Body: { email, password }
Response: { success: true, data: { token: "jwt", user: { _id, name, email, role, points } } }

JWT should contain: { userId, role }
Token expiry: 7 days

============================================
*/

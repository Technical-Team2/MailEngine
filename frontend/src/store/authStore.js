import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../utils/api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email, password) => {
        try {
          // Call real backend API
          const response = await api.post('/auth/login', { email, password });
          const data = response.data;
          
          set({ 
            user: data.user, 
            token: data.access_token, 
            isAuthenticated: true 
          });
          
          api.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`;
          return data;
        } catch (error) {
          set({ user: null, token: null, isAuthenticated: false });
          throw error;
        }
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        delete api.defaults.headers.common['Authorization'];
      },

      initAuth: () => {
        const { token } = get();
        if (token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
      },
    }),
    { 
      name: 'auth-store', 
      partialize: (s) => ({ user: s.user, token: s.token, isAuthenticated: s.isAuthenticated }) 
    }
  )
);
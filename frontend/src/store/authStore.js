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
        // ==========================================
  
        
        // 2. Simulate a slight network delay so your loading spinners still test correctly
        await new Promise((resolve) => setTimeout(resolve, 500));

        // 3. Create a fake successful response from the backend
        const data = {
          user: { 
            id: 'mock-uuid-1234', 
            name: 'Isaac Mathenge', 
            role: 'Admin', 
            email: email || 'admin@emailsys.com' 
          },
          access_token: 'fake-jwt-token-bypass'
        };
        // ==========================================
        // END OF MOCK
        // ==========================================

        set({ user: data.user, token: data.access_token, isAuthenticated: true });
        api.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`;
        return data;
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
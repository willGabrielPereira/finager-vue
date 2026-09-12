import { defineStore } from 'pinia';
import { api } from '../api/axios';

export interface UserProfile {
  user_id: string;
  login: string;
  family_id: string;
  family_name?: string;
  created_at?: string;
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    accessToken: localStorage.getItem('access_token') || null,
    refreshToken: localStorage.getItem('refresh_token') || null,
    user: null as UserProfile | null,
  }),
  
  getters: {
    isAuthenticated: (state) => !!state.accessToken,
  },
  
  actions: {
    setTokens(access: string, refresh: string) {
      this.accessToken = access;
      this.refreshToken = refresh;
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
    },
    
    async login(login: string, password: string) {
      const { data } = await api.post('/auth/login', { login, password });
      this.setTokens(data.access_token, data.refresh_token);
      await this.fetchMe();
    },

    async register(login: string, password: string, familyName?: string) {
      const payload: { login: string; password: string; family_name?: string } = { login, password };
      if (familyName && familyName.trim().length > 0) {
        payload.family_name = familyName.trim();
      }
      const { data } = await api.post('/auth/register', payload);
      this.setTokens(data.access_token, data.refresh_token);
      await this.fetchMe();
    },
    
    async fetchMe() {
      if (!this.accessToken) return;
      try {
        const { data } = await api.get('/me');
        this.user = data;
      } catch (err) {
        this.clearAuth();
      }
    },

    async updateProfile(payload: { login?: string; family_name?: string }) {
      const { data } = await api.put('/me', payload);
      this.user = data;
      return data;
    },

    async changePassword(currentPassword: string, newPassword: string) {
      await api.put('/auth/password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
    },
    
    async logout() {
      if (this.refreshToken) {
        try {
          await api.post('/auth/logout', { refresh_token: this.refreshToken });
        } catch (e) {
          // Ignore error on logout
        }
      }
      this.clearAuth();
    },
    
    clearAuth() {
      this.accessToken = null;
      this.refreshToken = null;
      this.user = null;
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  }
});

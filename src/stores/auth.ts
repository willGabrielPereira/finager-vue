import { defineStore } from 'pinia';
import { api } from '../api/axios';

export interface UserProfile {
  user_id: string;
  login: string;
  email?: string;
  family_id: string;
  family_name?: string;
  plan?: string;
  subscription_status?: string;
  onboarding_completed?: boolean;
  onboarding_step?: number;
  created_at?: string;
}

export interface FamilyMember {
  user_id: string;
  login: string;
  email: string;
  joined_at: string;
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    accessToken: localStorage.getItem('access_token') || null,
    refreshToken: localStorage.getItem('refresh_token') || null,
    user: null as UserProfile | null,
    familyMembers: [] as FamilyMember[],
  }),
  
  getters: {
    isAuthenticated: (state) => !!state.accessToken,
    isOnboardingCompleted: (state) => !!state.user?.onboarding_completed,
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

    async register(login: string, email: string, password: string, familyName?: string, inviteToken?: string) {
      sessionStorage.removeItem('finager_tour_started');
      const payload: Record<string, any> = { login, email, password };
      if (familyName && familyName.trim().length > 0) {
        payload.family_name = familyName.trim();
      }
      if (inviteToken && inviteToken.trim().length > 0) {
        payload.invite_token = inviteToken.trim();
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

    async updateOnboarding(completed: boolean, step: number) {
      try {
        const { data } = await api.patch('/me/onboarding', { completed, step });
        if (this.user) {
          this.user.onboarding_completed = completed;
          this.user.onboarding_step = step;
        }
        return data;
      } catch (err) {
        console.error('Falha ao atualizar onboarding:', err);
      }
    },

    async deleteAccount(password: string) {
      const { data } = await api.delete('/me', { data: { password } });
      this.clearAuth();
      return data;
    },

    async fetchFamilyMembers() {
      try {
        const { data } = await api.get('/family/members');
        this.familyMembers = data || [];
        return this.familyMembers;
      } catch (err) {
        console.error('Erro ao buscar membros da família:', err);
        return [];
      }
    },

    async createInvite(targetEmail?: string) {
      const payload = targetEmail ? { target_email: targetEmail } : {};
      const { data } = await api.post('/family/invites', payload);
      return data;
    },

    async validateInvite(token: string) {
      const { data } = await api.get('/family/invites/validate', { params: { token } });
      return data;
    },

    async joinFamily(token: string) {
      const { data } = await api.post('/family/join', { token });
      // O access token ainda carrega a família antiga nas claims: renova a sessão
      // (o /auth/refresh relê o usuário no banco e emite o token com a nova família)
      const { data: tokens } = await api.post('/auth/refresh', { refresh_token: this.refreshToken });
      this.setTokens(tokens.access_token, tokens.refresh_token);
      return data;
    },

    async removeMember(userId: string) {
      const { data } = await api.delete(`/family/members/${userId}`);
      this.familyMembers = this.familyMembers.filter(m => m.user_id !== userId);
      return data;
    },

    async updateProfile(payload: { login?: string; email?: string; family_name?: string }) {
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
      this.familyMembers = [];
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      sessionStorage.removeItem('finager_tour_started');
    }
  }
});
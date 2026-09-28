import { defineStore } from 'pinia';
import { api } from '../api/axios';

export const useAdminAuthStore = defineStore('adminAuth', {
  state: () => ({
    elevatedToken: null as string | null,
    expiresAt: null as number | null, // timestamp em ms (Date.now() + TTL), NUNCA persistido
  }),

  actions: {
    // Método, não getter: um getter do Pinia é computed e fica em cache — não
    // reavaliaria sozinho quando expiresAt passasse do relógio, já que nenhum
    // state observado muda com o tempo. Chamado explicitamente a cada checagem.
    isElevated(): boolean {
      return !!this.elevatedToken && !!this.expiresAt && this.expiresAt > Date.now();
    },

    async elevate(password: string) {
      const { data } = await api.post('/auth/elevate', { password });
      this.elevatedToken = data.elevated_token;
      this.expiresAt = new Date(data.expires_at).getTime();
      return data;
    },

    clear() {
      this.elevatedToken = null;
      this.expiresAt = null;
    },
  },
});

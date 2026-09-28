import { defineStore } from 'pinia';
import { api } from '../api/axios';
import { toast } from '../utils/feedback';

export interface AdminStatsOverview {
  total_users: number;
  users_by_plan: Record<string, number>;
}

export interface AdminActivityItem {
  user_id: string;
  login: string;
  email: string;
  family_id: string;
  last_login_at: string | null;
  last_transaction_at: string | null;
}

export interface AdminUser {
  id: string;
  login: string;
  email: string;
  family_id: string;
  role: string;
  created_at: string;
}

export interface AdminInvite {
  id: string;
  token: string;
  plan_granted: string;
  created_by: string;
  expires_at: string;
  used_at: string | null;
  used_by_family_id: string | null;
  created_at: string;
}

export interface AdminCoupon {
  id: string;
  code: string;
  discount_percent: number;
  plan_granted: string;
  max_uses: number | null;
  times_used: number;
  expires_at: string | null;
  created_at: string;
  active: boolean;
}

// O backend responde {"error":{"code","message"}} (objeto), não uma string em
// data.error — passar o objeto direto pro toast quebra o escapeHtml interno.
export function extractErrorMessage(err: any, fallback: string): string {
  return err.response?.data?.message || err.response?.data?.error?.message || fallback;
}

async function withLoadingAndErrorToast<T>(
  store: { loading: boolean },
  fallbackMessage: string,
  fallbackValue: T,
  request: () => Promise<T>,
): Promise<T> {
  store.loading = true;
  try {
    return await request();
  } catch (err: any) {
    toast.error(extractErrorMessage(err, fallbackMessage));
    return fallbackValue;
  } finally {
    store.loading = false;
  }
}

export const useAdminStore = defineStore('admin', {
  state: () => ({
    stats: null as AdminStatsOverview | null,
    activity: {
      items: [] as AdminActivityItem[],
      total: 0,
      page: 1,
      limit: 20,
    },
    admins: [] as AdminUser[],
    invites: [] as AdminInvite[],
    coupons: [] as AdminCoupon[],
    loading: false,
  }),

  actions: {
    async fetchStats() {
      return withLoadingAndErrorToast(this, 'Erro ao buscar estatísticas de admin', null, async () => {
        const { data } = await api.get('/admin/stats/overview');
        this.stats = data;
        return data;
      });
    },

    async fetchActivity(page = 1) {
      return withLoadingAndErrorToast(this, 'Erro ao buscar atividade de usuários', this.activity, async () => {
        const { data } = await api.get('/admin/stats/activity', {
          params: { page, limit: this.activity.limit },
        });
        this.activity = data;
        return data;
      });
    },

    async fetchAdmins() {
      return withLoadingAndErrorToast(this, 'Erro ao buscar usuários administradores', [], async () => {
        const { data } = await api.get('/admin/users');
        this.admins = data || [];
        return this.admins;
      });
    },

    async updateUserRole(id: string, role: string) {
      const { data } = await api.patch(`/admin/users/${id}/role`, { role });
      await this.fetchAdmins();
      return data;
    },

    async fetchInvites() {
      return withLoadingAndErrorToast(this, 'Erro ao buscar convites', [], async () => {
        const { data } = await api.get('/admin/invites');
        this.invites = data || [];
        return this.invites;
      });
    },

    async createInvite(expiresInDays?: number) {
      const payload = expiresInDays ? { expires_in_days: expiresInDays } : {};
      const { data } = await api.post('/admin/invites', payload);
      this.invites.push(data);
      return data;
    },

    async revokeInvite(id: string) {
      const { data } = await api.delete(`/admin/invites/${id}`);
      this.invites = this.invites.filter(i => i.id !== id);
      return data;
    },

    async fetchCoupons() {
      return withLoadingAndErrorToast(this, 'Erro ao buscar cupons', [], async () => {
        const { data } = await api.get('/admin/coupons');
        this.coupons = data || [];
        return this.coupons;
      });
    },

    async createCoupon(payload: {
      code: string;
      discount_percent: number;
      plan_granted: string;
      max_uses?: number;
      expires_at?: string;
    }) {
      const { data } = await api.post('/admin/coupons', payload);
      await this.fetchCoupons();
      return data;
    },

    async updateCoupon(id: string, payload: { active?: boolean; max_uses?: number; expires_at?: string }) {
      const { data } = await api.patch(`/admin/coupons/${id}`, payload);
      await this.fetchCoupons();
      return data;
    },
  },
});

import { defineStore } from 'pinia';
import { api } from '../api/axios';
import { useAuthStore } from './auth';

export interface PlanLimits {
  plan: string;
  max_accounts: number;
  max_members: number;
  max_history_days: number;
  allowed_features: string[];
}

export interface FamilyUsage {
  accounts_count: number;
  members_count: number;
}

export interface FamilyPlanStatus {
  family_id: string;
  plan: string; // 'FREE' | 'PRO' | 'LIFETIME_FREE'
  subscription_status: string;
  subscription_expires_at?: string | null;
  limits: PlanLimits;
  current_usage: FamilyUsage;
}

export const useBillingStore = defineStore('billing', {
  state: () => ({
    planStatus: null as FamilyPlanStatus | null,
    loading: false,
    actionLoading: false,
    error: null as string | null,
  }),

  getters: {
    currentPlan: (state) => state.planStatus?.plan || 'FREE',
    isPro: (state) => state.planStatus?.plan === 'PRO' || state.planStatus?.plan === 'LIFETIME_FREE',
    isLifetime: (state) => state.planStatus?.plan === 'LIFETIME_FREE',
    isFree: (state) => !state.planStatus?.plan || state.planStatus?.plan === 'FREE',
    
    // Contas
    accountsUsed: (state) => state.planStatus?.current_usage?.accounts_count ?? 0,
    accountsLimit: (state) => state.planStatus?.limits?.max_accounts ?? 2,
    isAccountsUnlimited: (state) => (state.planStatus?.limits?.max_accounts ?? 2) < 0,
    isAccountsLimitReached(state): boolean {
      const limit = state.planStatus?.limits?.max_accounts ?? 2;
      if (limit < 0) return false;
      const used = state.planStatus?.current_usage?.accounts_count ?? 0;
      return used >= limit;
    },
    accountsUsagePercent(state): number {
      const limit = state.planStatus?.limits?.max_accounts ?? 2;
      if (limit < 0) return 0;
      if (limit <= 0) return 100;
      const used = state.planStatus?.current_usage?.accounts_count ?? 0;
      return Math.min(100, Math.round((used / limit) * 100));
    },

    // Membros
    membersUsed: (state) => state.planStatus?.current_usage?.members_count ?? 1,
    membersLimit: (state) => state.planStatus?.limits?.max_members ?? 2,
    isMembersUnlimited: (state) => (state.planStatus?.limits?.max_members ?? 2) < 0,
    isMembersLimitReached(state): boolean {
      const limit = state.planStatus?.limits?.max_members ?? 2;
      if (limit < 0) return false;
      const used = state.planStatus?.current_usage?.members_count ?? 1;
      return used >= limit;
    },
    membersUsagePercent(state): number {
      const limit = state.planStatus?.limits?.max_members ?? 2;
      if (limit < 0) return 0;
      if (limit <= 0) return 100;
      const used = state.planStatus?.current_usage?.members_count ?? 1;
      return Math.min(100, Math.round((used / limit) * 100));
    },

    // Histórico em dias (-1 = ilimitado)
    historyDaysLimit: (state) => state.planStatus?.limits?.max_history_days ?? 90,
    isHistoryUnlimited: (state) => (state.planStatus?.limits?.max_history_days ?? 90) < 0,
  },

  actions: {
    async fetchPlan() {
      this.loading = true;
      this.error = null;
      try {
        const { data } = await api.get('/billing/plan');
        this.planStatus = data;
        return data;
      } catch (err: any) {
        this.error = err.response?.data?.message || err.response?.data?.error || 'Falha ao carregar status do plano.';
        console.error('Erro ao buscar plano:', err);
      } finally {
        this.loading = false;
      }
    },

    async simulateUpgrade() {
      this.actionLoading = true;
      this.error = null;
      const authStore = useAuthStore();
      try {
        const { data } = await api.post('/billing/simulate-upgrade');
        await Promise.all([
          this.fetchPlan(),
          authStore.fetchMe()
        ]);
        return data;
      } catch (err: any) {
        this.error = err.response?.data?.message || err.response?.data?.error || 'Falha ao simular upgrade.';
        throw err;
      } finally {
        this.actionLoading = false;
      }
    },

    async simulateDowngrade() {
      this.actionLoading = true;
      this.error = null;
      const authStore = useAuthStore();
      try {
        const { data } = await api.post('/billing/simulate-downgrade');
        await Promise.all([
          this.fetchPlan(),
          authStore.fetchMe()
        ]);
        return data;
      } catch (err: any) {
        this.error = err.response?.data?.message || err.response?.data?.error || 'Falha ao simular downgrade.';
        throw err;
      } finally {
        this.actionLoading = false;
      }
    },

    async applyCoupon(code: string) {
      this.actionLoading = true;
      this.error = null;
      const authStore = useAuthStore();
      try {
        const { data } = await api.post('/billing/coupons/apply', { code: code.trim() });
        await Promise.all([
          this.fetchPlan(),
          authStore.fetchMe()
        ]);
        return data;
      } catch (err: any) {
        const msg = err.response?.data?.message || err.response?.data?.error || 'Cupom inválido ou expirado.';
        this.error = msg;
        throw new Error(msg);
      } finally {
        this.actionLoading = false;
      }
    }
  }
});
import { defineStore } from 'pinia';
import { api } from '../api/axios';

export interface Account {
  id: string;
  name: string;
  institution: string;
  family_id: string;
  created_by: string;
  allowed_users: string[];
}

export const useAccountsStore = defineStore('accounts', {
  state: () => ({
    accounts: [] as Account[],
    loading: false
  }),
  
  actions: {
    async fetchAccounts() {
      this.loading = true;
      try {
        const { data } = await api.get('/accounts');
        this.accounts = data || [];
      } catch (err) {
        console.error('Falha ao buscar contas bancárias:', err);
      } finally {
        this.loading = false;
      }
    }
  }
});

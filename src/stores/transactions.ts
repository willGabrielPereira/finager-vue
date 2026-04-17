import { defineStore } from 'pinia';
import { api } from '../api/axios';

export const useTransactionsStore = defineStore('transactions', {
  state: () => ({
    transactions: [] as any[],
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0
    },
    loading: false
  }),
  
  actions: {
    async fetchTransactions(params: Record<string, any> = {}) {
      this.loading = true;
      try {
        const { data } = await api.get('/transactions', { params: { page: this.pagination.page, limit: this.pagination.limit, ...params } });
        this.transactions = data.data || [];
        this.pagination = {
          page: data.page,
          limit: data.limit,
          total: data.total,
          totalPages: data.total_pages
        };
      } finally {
        this.loading = false;
      }
    }
  }
});

import { defineStore } from 'pinia';
import { api } from '../api/axios';

export interface Transaction {
  id: string;
  fitid: string;
  type: 'DEBIT' | 'CREDIT';
  date_posted: string;
  amount: number;
  name: string;
  memo: string;
  tags: string[];
  account_id: string;
  family_id: string;
  created_by: string;
  imported_at: string;
  manually_tagged: boolean;
  status: 'POSTED' | 'PLANNED' | 'PENDING_RECONCILIATION' | 'RECONCILED';
  is_transfer: boolean;
  destination_account_id?: string;
  source: 'OFX' | 'MANUAL' | 'RECEIPT';
}

export const useTransactionsStore = defineStore('transactions', {
  state: () => ({
    transactions: [] as Transaction[],
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    },
    filters: {
      search: '',
      status: '',
      type: '',
      tag: '',
      accounts: [] as string[],
      tags: [] as string[],
      date_from: '',
      date_to: '',
      amount_min: undefined as number | string | undefined,
      amount_max: undefined as number | string | undefined,
    },
    loading: false,
    dashboardTransactions: [] as Transaction[],
    dashboardLoading: false,
  }),

  actions: {
    async fetchDashboardTransactions(params: { date_from: string; date_to: string; accounts?: string; limit?: number }) {
      this.dashboardLoading = true;
      try {
        const queryParams: Record<string, any> = {
          date_from: params.date_from,
          date_to: params.date_to,
          limit: params.limit ?? 500,
        };
        if (params.accounts && params.accounts !== 'ALL') {
          queryParams.accounts = params.accounts;
        }
        const { data } = await api.get('/transactions', { params: queryParams });
        this.dashboardTransactions = data.data || [];
        return this.dashboardTransactions;
      } finally {
        this.dashboardLoading = false;
      }
    },
    async fetchTransactions(params: Record<string, any> = {}) {
      this.loading = true;
      try {
        const queryParams: Record<string, any> = {
          page: params.page ?? this.pagination.page,
          limit: params.limit ?? this.pagination.limit,
          search: params.search !== undefined ? params.search : this.filters.search,
          status: params.status !== undefined ? params.status : this.filters.status,
          type: params.type !== undefined ? params.type : this.filters.type,
          amount_min: params.amount_min !== undefined ? params.amount_min : this.filters.amount_min,
          amount_max: params.amount_max !== undefined ? params.amount_max : this.filters.amount_max,
          date_from: params.date_from !== undefined ? params.date_from : this.filters.date_from,
          date_to: params.date_to !== undefined ? params.date_to : this.filters.date_to,
        };

        const accounts = params.accounts !== undefined ? params.accounts : this.filters.accounts;
        if (Array.isArray(accounts) && accounts.length > 0) {
          queryParams.accounts = accounts.join(',');
        } else if (typeof accounts === 'string' && accounts.trim()) {
          queryParams.accounts = accounts.trim();
        }

        const tags = params.tags !== undefined ? params.tags : this.filters.tags;
        if (Array.isArray(tags) && tags.length > 0) {
          queryParams.tags = tags.join(',');
        } else if (params.tag || this.filters.tag) {
          queryParams.tag = params.tag || this.filters.tag;
        }

        const cleaned: Record<string, any> = {};
        for (const [k, v] of Object.entries(queryParams)) {
          if (v !== '' && v !== null && v !== undefined) {
            cleaned[k] = v;
          }
        }

        const { data } = await api.get('/transactions', { params: cleaned });
        this.transactions = data.data || [];
        this.pagination = {
          page: data.page,
          limit: data.limit,
          total: data.total,
          totalPages: data.total_pages,
        };
      } finally {
        this.loading = false;
      }
    },

    clearFilters() {
      this.filters.search = '';
      this.filters.status = '';
      this.filters.type = '';
      this.filters.tag = '';
      this.filters.accounts = [];
      this.filters.tags = [];
      this.filters.date_from = '';
      this.filters.date_to = '';
      this.filters.amount_min = undefined;
      this.filters.amount_max = undefined;
      this.pagination.page = 1;
    },

    async updateTags(txId: string, tagIds: string[]) {
      const tx = this.transactions.find((t) => t.id === txId);
      const originalTags = tx ? [...(tx.tags || [])] : [];

      if (tx) {
        tx.tags = tagIds;
        tx.manually_tagged = true;
      }

      const dTx = this.dashboardTransactions.find((t) => t.id === txId);
      const originalDTags = dTx ? [...(dTx.tags || [])] : [];
      if (dTx) {
        dTx.tags = tagIds;
        dTx.manually_tagged = true;
      }

      try {
        await api.put('/transactions/' + txId, { tags: tagIds });
      } catch (err) {
        if (tx) tx.tags = originalTags;
        if (dTx) dTx.tags = originalDTags;
        throw err;
      }
    },

    async updateTransaction(txId: string, payload: Record<string, any>) {
      const { data } = await api.put('/transactions/' + txId, payload);
      const idx = this.transactions.findIndex((t) => t.id === txId);
      if (idx !== -1) {
        this.transactions[idx] = { ...this.transactions[idx], ...(data || payload) };
      }
      const dIdx = this.dashboardTransactions.findIndex((t) => t.id === txId);
      if (dIdx !== -1) {
        this.dashboardTransactions[dIdx] = { ...this.dashboardTransactions[dIdx], ...(data || payload) };
      }
      return data;
    },

    async createTransaction(payload: any) {
      const { data } = await api.post('/transactions', payload);
      this.transactions.unshift(data);
      this.dashboardTransactions.unshift(data);
      this.pagination.total++;
      return data;
    },

    async deleteTransaction(txId: string) {
      await api.delete('/transactions/' + txId);
      this.transactions = this.transactions.filter((t) => t.id !== txId);
      this.dashboardTransactions = this.dashboardTransactions.filter((t) => t.id !== txId);
      this.pagination.total--;
    },

    async applySimilar(txId: string, includeManuallyTagged = false) {
      const { data } = await api.post('/transactions/' + txId + '/apply-similar', {
        include_manually_tagged: includeManuallyTagged,
      });
      await this.fetchTransactions();
      return data;
    },

    async runAIAutoTag(includeManuallyTagged = false) {
      const { data } = await api.post('/transactions/ai-auto-tag', {
        include_manually_tagged: includeManuallyTagged,
      });
      await this.fetchTransactions();
      return data;
    },
  },
});

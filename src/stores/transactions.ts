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
    },
    loading: false,
  }),

  actions: {
    async fetchTransactions(params: Record<string, any> = {}) {
      this.loading = true;
      try {
        const queryParams = {
          page: params.page ?? this.pagination.page,
          limit: params.limit ?? this.pagination.limit,
          search: params.search !== undefined ? params.search : this.filters.search,
          status: params.status !== undefined ? params.status : this.filters.status,
          type: params.type !== undefined ? params.type : this.filters.type,
          tag: params.tag !== undefined ? params.tag : this.filters.tag,
        };

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

    async updateTags(txId: string, tagIds: string[]) {
      const tx = this.transactions.find((t) => t.id === txId);
      const originalTags = tx ? [...(tx.tags || [])] : [];

      if (tx) {
        tx.tags = tagIds;
        tx.manually_tagged = true;
      }

      try {
        await api.put('/transactions/' + txId, { tags: tagIds });
      } catch (err) {
        if (tx) tx.tags = originalTags;
        throw err;
      }
    },

    async createTransaction(payload: any) {
      const { data } = await api.post('/transactions', payload);
      this.transactions.unshift(data);
      this.pagination.total++;
      return data;
    },

    async deleteTransaction(txId: string) {
      await api.delete('/transactions/' + txId);
      this.transactions = this.transactions.filter((t) => t.id !== txId);
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

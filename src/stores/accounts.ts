import { defineStore } from 'pinia'
import { api } from '../api/axios'

export interface Account {
  id: string
  name: string
  institution: string
  type: 'CHECKING' | 'CREDIT_CARD' | 'INVESTMENT' | 'CASH' | 'OTHER'
  family_id: string
  created_by: string
  allowed_users: string[]
  created_at?: string
  updated_at?: string
}

export const useAccountsStore = defineStore('accounts', {
  state: () => ({
    accounts: [] as Account[],
    loading: false,
    error: null as string | null
  }),

  actions: {
    async fetchAccounts() {
      this.loading = true
      this.error = null
      try {
        const { data } = await api.get('/accounts')
        this.accounts = data || []
        return this.accounts
      } catch (err: any) {
        this.error = err.response?.data?.message || 'Falha ao buscar contas bancárias'
        if (err.response?.status !== 401 && err.response?.status !== 400) {
          console.warn('Falha ao buscar contas bancárias:', err?.message || err)
        }
        this.accounts = []
        return []
      } finally {
        this.loading = false
      }
    },

    async createAccount(payload: { name: string; institution: string; type?: string; allowed_users?: string[] }) {
      this.loading = true
      try {
        const { data } = await api.post('/accounts', payload)
        this.accounts.push(data)
        return data
      } finally {
        this.loading = false
      }
    },

    async updateAccount(id: string, payload: { name?: string; institution?: string; type?: string; allowed_users?: string[] }) {
      this.loading = true
      try {
        await api.put(`/accounts/${id}`, payload)
        await this.fetchAccounts()
      } finally {
        this.loading = false
      }
    },

    async deleteAccount(id: string) {
      this.loading = true
      try {
        await api.delete(`/accounts/${id}`)
        this.accounts = this.accounts.filter(a => a.id !== id)
      } finally {
        this.loading = false
      }
    }
  }
})

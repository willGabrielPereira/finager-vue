import { defineStore } from 'pinia';
import { api } from '../api/axios';

export interface Tag {
  id: string;
  name: string;
  color: string;
  icon: string;
  family_id?: string;
  is_system: boolean;
}

export const useTagsStore = defineStore('tags', {
  state: () => ({
    tags: [] as Tag[],
    frequentTags: [] as Tag[],
    loading: false,
    loadingFrequent: false,
  }),

  actions: {
    async fetchTags() {
      this.loading = true;
      try {
        const { data } = await api.get('/tags');
        this.tags = data || [];
        return this.tags;
      } catch (err: any) {
        if (err.response?.status !== 401 && err.response?.status !== 400) {
          console.warn('Falha ao buscar tags:', err?.message || err);
        }
        this.tags = [];
        return [];
      } finally {
        this.loading = false;
      }
    },

    async fetchFrequentTags(days = 60, limit = 8) {
      this.loadingFrequent = true;
      try {
        const { data } = await api.get('/tags/frequent', { params: { days, limit } });
        this.frequentTags = data || [];
      } catch (err) {
        console.error('Falha ao buscar tags frequentes:', err);
      } finally {
        this.loadingFrequent = false;
      }
    },

    async createTag(payload: { name: string; color: string; icon: string }) {
      const { data } = await api.post('/tags', payload);
      this.tags.push(data);
      return data;
    },

    async updateTag(id: string, payload: { name?: string; color?: string; icon?: string }) {
      await api.put(`/tags/${id}`, payload);
      const index = this.tags.findIndex(t => t.id === id);
      if (index !== -1) {
        this.tags[index] = {
          ...this.tags[index],
          ...(payload.name !== undefined ? { name: payload.name } : {}),
          ...(payload.color !== undefined ? { color: payload.color } : {}),
          ...(payload.icon !== undefined ? { icon: payload.icon } : {}),
        };
      }
      const freqIndex = this.frequentTags.findIndex(t => t.id === id);
      if (freqIndex !== -1) {
        this.frequentTags[freqIndex] = {
          ...this.frequentTags[freqIndex],
          ...(payload.name !== undefined ? { name: payload.name } : {}),
          ...(payload.color !== undefined ? { color: payload.color } : {}),
          ...(payload.icon !== undefined ? { icon: payload.icon } : {}),
        };
      }
      return this.tags[index];
    },

    async deleteTag(id: string) {
      await api.delete(`/tags/${id}`);
      this.tags = this.tags.filter(t => t.id !== id);
      this.frequentTags = this.frequentTags.filter(t => t.id !== id);
    },
  },
});

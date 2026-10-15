import { defineStore } from 'pinia';
import { api } from '../api/axios';

export type ChangelogTag = 'NOVIDADES' | 'MELHORIAS' | 'CORREÇÕES';

export interface ChangelogSection {
  tag: ChangelogTag;
  heading: string;
  body: string; // markdown
}

export interface ChangelogEntry {
  id: string;
  title: string;
  intro: string; // markdown
  sections: ChangelogSection[];
  published_at: string | null;
  created_at: string;
}

export const useChangelogStore = defineStore('changelog', {
  state: () => ({
    entries: [] as ChangelogEntry[],
    unseen: false,
    loading: false,
  }),

  actions: {
    async fetch() {
      this.loading = true;
      try {
        const { data } = await api.get('/changelog');
        this.entries = data.entries || [];
        this.unseen = !!data.unseen;
      } finally {
        this.loading = false;
      }
    },

    async markSeen() {
      this.unseen = false;
      try {
        await api.post('/me/changelog/seen');
      } catch {
        // falha silenciosa: no pior caso o modal reaparece no próximo login
      }
    },
  },
});

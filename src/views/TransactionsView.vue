<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useTransactionsStore } from '../stores/transactions';
import { PhArrowDownRight, PhArrowUpRight, PhCalendarBlank } from '@phosphor-icons/vue';

const store = useTransactionsStore();

onMounted(() => {
  store.fetchTransactions();
});

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString();
};

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
};
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">Transactions</h1>
      <router-link to="/import" class="bg-accent text-bg px-4 py-2 font-semibold rounded-lg hover:opacity-90 hover:-translate-y-px transition-all">
        Import OFX
      </router-link>
    </div>

    <div class="bg-surface rounded-xl border border-white/5 overflow-hidden shadow-lg">
      <div v-if="store.loading" class="p-8 text-center text-white/50">
        Carregando transações...
      </div>
      
      <table v-else class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-white/5 text-sm font-medium text-white/70">
            <th class="p-4 border-b border-white/5 min-w-[300px]">NAME/MEMO</th>
            <th class="p-4 border-b border-white/5 w-[150px]">DATE</th>
            <th class="p-4 border-b border-white/5 w-[150px]">TAGS</th>
            <th class="p-4 border-b border-white/5 text-right w-[150px]">AMOUNT</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="store.transactions.length === 0">
            <td colspan="4" class="p-8 text-center text-white/50">Nenhuma transação encontrada.</td>
          </tr>
          
          <tr v-for="t in store.transactions" :key="t.id" class="border-b border-white/5 hover:bg-white/5 transition-colors">
            <td class="p-4">
              <div class="flex items-center gap-3">
                <div class="flex-shrink-0 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                  <PhArrowUpRight v-if="t.type === 'CREDIT'" class="text-accent" :size="20" />
                  <PhArrowDownRight v-else class="text-red-400" :size="20" />
                </div>
                <div>
                  <div class="font-medium truncate max-w-xs" :title="t.name">{{ t.name }}</div>
                  <div class="text-xs text-white/50 truncate max-w-xs" :title="t.memo">{{ t.memo || 'Sem descrição' }}</div>
                </div>
              </div>
            </td>
            <td class="p-4 text-white/70 whitespace-nowrap">
              <div class="flex items-center gap-2 text-sm">
                <PhCalendarBlank :size="16" />
                {{ formatDate(t.date_posted) }}
              </div>
            </td>
            <td class="p-4">
              <div class="flex flex-wrap gap-2">
                <span v-for="tag in (t.tags || [])" :key="tag" class="px-2 py-0.5 rounded text-xs bg-white/10 text-white/80">
                  Tag {{ tag }}
                </span>
                <span v-if="!t.tags || t.tags.length === 0" class="text-xs text-white/30 italic">No tags</span>
              </div>
            </td>
            <td class="p-4 text-right font-medium whitespace-nowrap" :class="t.type === 'CREDIT' ? 'text-accent' : ''">
              {{ t.type === 'CREDIT' ? '+' : '' }}{{ formatCurrency(t.amount) }}
            </td>
          </tr>
        </tbody>
      </table>
      
      <!-- Pagination -->
      <div v-if="store.pagination.totalPages > 1" class="p-4 border-t border-white/5 flex items-center justify-between">
        <span class="text-sm text-white/50">Página {{ store.pagination.page }} de {{ store.pagination.totalPages }}</span>
        <div class="flex gap-2">
          <button 
            :disabled="store.pagination.page === 1"
            @click="store.fetchTransactions({ page: store.pagination.page - 1 })"
            class="px-3 py-1 bg-surface-2 rounded border border-white/10 hover:bg-white/10 disabled:opacity-50 transition-colors cursor-pointer"
          >
            Anterior
          </button>
          <button 
            :disabled="store.pagination.page === store.pagination.totalPages"
            @click="store.fetchTransactions({ page: store.pagination.page + 1 })"
            class="px-3 py-1 bg-surface-2 rounded border border-white/10 hover:bg-white/10 disabled:opacity-50 transition-colors cursor-pointer"
          >
            Próxima
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

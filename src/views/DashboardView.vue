<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useTransactionsStore } from '../stores/transactions'
import { useTagsStore } from '../stores/tags'
import { useAccountsStore } from '../stores/accounts'
import { 
  PhWallet, 
  PhTrendUp, 
  PhTrendDown, 
  PhClock, 
  PhArrowRight
} from '@phosphor-icons/vue'
import { Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  CategoryScale
} from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale)

const txStore = useTransactionsStore()
const tagsStore = useTagsStore()
const accountsStore = useAccountsStore()

onMounted(async () => {
  await Promise.all([
    txStore.fetchTransactions({ limit: 50 }),
    tagsStore.fetchTags(),
    accountsStore.fetchAccounts()
  ])
})

const getTagById = (id: string) => {
  return tagsStore.tags.find(t => t.id === id)
}

// Métricas de Caixa
const totalIncome = computed(() => {
  return txStore.transactions
    .filter(t => t.type === 'CREDIT' && t.status !== 'PLANNED')
    .reduce((acc, t) => acc + t.amount, 0)
})

const totalExpenses = computed(() => {
  return txStore.transactions
    .filter(t => t.type === 'DEBIT' && t.status !== 'PLANNED')
    .reduce((acc, t) => acc + Math.abs(t.amount), 0)
})

const totalPlanned = computed(() => {
  return txStore.transactions
    .filter(t => t.type === 'DEBIT' && t.status === 'PLANNED')
    .reduce((acc, t) => acc + Math.abs(t.amount), 0)
})

const netBalance = computed(() => {
  return totalIncome.value - totalExpenses.value
})

const projectedBalance = computed(() => {
  return netBalance.value - totalPlanned.value
})

const recentTransactions = computed(() => {
  return txStore.transactions.slice(0, 7)
})

// Dados do Gráfico de Rosca por Categoria
const chartData = computed(() => {
  const categoryTotals: Record<string, { total: number; color: string; name: string }> = {}

  for (const t of txStore.transactions) {
    if (t.type === 'DEBIT') {
      const tagId = t.tags?.[0]
      const tag = tagId ? getTagById(tagId) : null
      const name = tag?.name || 'Sem Categoria'
      const color = tag?.color || '#64748b'

      if (!categoryTotals[name]) {
        categoryTotals[name] = { total: 0, color, name }
      }
      categoryTotals[name].total += Math.abs(t.amount)
    }
  }

  const labels = Object.values(categoryTotals).map(c => c.name)
  const data = Object.values(categoryTotals).map(c => c.total)
  const backgroundColor = Object.values(categoryTotals).map(c => c.color)

  return {
    labels,
    datasets: [
      {
        data,
        backgroundColor: backgroundColor.length > 0 ? backgroundColor : ['#64748b'],
        borderWidth: 2,
        borderColor: '#0f172a',
      }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        color: 'rgba(255, 255, 255, 0.7)',
        font: { size: 11 },
        boxWidth: 12,
        padding: 12
      }
    }
  }
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
}

const formatDate = (dateString: string) => {
  if (!dateString) return ''
  const d = new Date(dateString)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl md:text-2xl font-bold tracking-tight">Visão Geral</h1>
        <p class="text-xs text-white/50">Fluxo de caixa e saldo comprometido da família</p>
      </div>
    </div>

    <!-- Bento Grid de Métricas Financeiras -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Card: Receitas -->
      <div class="bg-surface rounded-2xl p-5 border border-white/5 shadow-lg flex flex-col justify-between gap-3">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-white/50">Receitas do Mês</span>
          <div class="w-8 h-8 rounded-xl bg-accent/15 flex items-center justify-center text-accent">
            <PhTrendUp :size="18" weight="bold" />
          </div>
        </div>
        <div>
          <div class="text-2xl font-bold text-accent">{{ formatCurrency(totalIncome) }}</div>
          <p class="text-[10px] text-white/40 mt-0.5">Entradas confirmadas</p>
        </div>
      </div>

      <!-- Card: Despesas -->
      <div class="bg-surface rounded-2xl p-5 border border-white/5 shadow-lg flex flex-col justify-between gap-3">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-white/50">Despesas do Mês</span>
          <div class="w-8 h-8 rounded-xl bg-red-500/15 flex items-center justify-center text-red-400">
            <PhTrendDown :size="18" weight="bold" />
          </div>
        </div>
        <div>
          <div class="text-2xl font-bold text-red-400">{{ formatCurrency(totalExpenses) }}</div>
          <p class="text-[10px] text-white/40 mt-0.5">Gastos efetivados</p>
        </div>
      </div>

      <!-- Card: Saldo Real Líquido -->
      <div class="bg-surface rounded-2xl p-5 border border-white/5 shadow-lg flex flex-col justify-between gap-3">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-white/50">Saldo Líquido</span>
          <div class="w-8 h-8 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-400">
            <PhWallet :size="18" weight="duotone" />
          </div>
        </div>
        <div>
          <div class="text-2xl font-bold text-white">{{ formatCurrency(netBalance) }}</div>
          <p class="text-[10px] text-white/40 mt-0.5">Entradas menos saídas</p>
        </div>
      </div>

      <!-- Card: Saldo Projetado (com comprometimento de despesas planejadas) -->
      <div class="bg-surface rounded-2xl p-5 border border-amber-500/20 shadow-lg flex flex-col justify-between gap-3 bg-gradient-to-br from-amber-500/5 to-transparent">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-amber-400">Saldo Projetado</span>
          <div class="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
            <PhClock :size="18" weight="bold" />
          </div>
        </div>
        <div>
          <div class="text-2xl font-bold text-amber-400">{{ formatCurrency(projectedBalance) }}</div>
          <p class="text-[10px] text-white/50 mt-0.5">
            Abatendo {{ formatCurrency(totalPlanned) }} em gastos previstos
          </p>
        </div>
      </div>
    </div>

    <!-- Seção de Gráficos e Transações Recentes -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Gráfico de Despesas por Categoria -->
      <div class="lg:col-span-1 bg-surface rounded-2xl p-5 border border-white/5 shadow-lg flex flex-col gap-4">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-bold">Gastos por Categoria</h3>
          <span class="text-[10px] text-white/40 uppercase font-semibold">Mês Atual</span>
        </div>

        <div v-if="chartData.datasets[0].data.length === 0" class="h-64 flex items-center justify-center text-center text-xs text-white/40">
          Nenhuma despesa para exibir no gráfico.
        </div>
        <div v-else class="h-64 relative">
          <Doughnut :data="chartData" :options="chartOptions" />
        </div>
      </div>

      <!-- Últimas Transações -->
      <div class="lg:col-span-2 bg-surface rounded-2xl p-5 border border-white/5 shadow-lg flex flex-col justify-between gap-4">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-sm font-bold">Últimos Lançamentos</h3>
            <p class="text-[11px] text-white/40">Transações mais recentes sincronizadas</p>
          </div>
          <router-link to="/transactions" class="text-xs font-semibold text-accent hover:underline flex items-center gap-1">
            <span>Ver extrato completo</span>
            <PhArrowRight :size="12" />
          </router-link>
        </div>

        <div v-if="recentTransactions.length === 0" class="p-8 text-center text-xs text-white/40">
          Nenhuma transação cadastrada ainda.
        </div>

        <div v-else class="flex flex-col divide-y divide-white/5">
          <div 
            v-for="t in recentTransactions" 
            :key="t.id"
            class="py-3 flex items-center justify-between gap-3"
          >
            <div class="flex items-center gap-3 min-w-0">
              <div 
                class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                :class="t.type === 'CREDIT' ? 'bg-accent/15 text-accent' : 'bg-red-500/15 text-red-400'"
              >
                <PhTrendUp v-if="t.type === 'CREDIT'" :size="16" weight="bold" />
                <PhTrendDown v-else :size="16" weight="bold" />
              </div>
              <div class="min-w-0">
                <div class="text-xs font-bold text-white truncate">{{ t.name || 'Sem nome' }}</div>
                <div class="flex items-center gap-2 text-[10px] text-white/40 mt-0.5">
                  <span>{{ formatDate(t.date_posted) }}</span>
                  <span v-if="t.tags && t.tags.length > 0 && getTagById(t.tags[0])" class="text-white/60">
                      {{ getTagById(t.tags[0])?.name }}
                  </span>
                </div>
              </div>
            </div>

            <div class="text-right flex-shrink-0">
              <div 
                class="text-xs font-bold"
                :class="t.type === 'CREDIT' ? 'text-accent' : 'text-white'"
              >
                {{ t.type === 'CREDIT' ? '+' : '' }}{{ formatCurrency(t.amount) }}
              </div>
              <span v-if="t.status === 'PLANNED'" class="text-[9px] text-amber-400 font-semibold">Prevista</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

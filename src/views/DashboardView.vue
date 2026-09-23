<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useTransactionsStore } from '../stores/transactions'
import { useTagsStore } from '../stores/tags'
import { useAccountsStore } from '../stores/accounts'
import { inject } from 'vue'
import { useRouter } from 'vue-router'
import AppSelect, { type AppSelectOption } from '../components/ui/AppSelect.vue'
import OnboardingChecklist from '../components/ui/OnboardingChecklist.vue'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const router = useRouter()
const openOFXGuide = inject<(bankName?: string) => void>('openOFXGuide')
const openImport = inject<() => void>('openImport')
import { 
  PhWallet, 
  PhTrendUp, 
  PhTrendDown, 
  PhClock, 
  PhArrowRight, 
  PhCaretLeft, 
  PhCaretRight, 
  PhUploadSimple, 
  PhArrowUpRight, 
  PhArrowDownRight,
  PhCreditCard,
  PhBank
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

// Inicializa no mês passado por padrão (rotina de conciliação)
const now = new Date()
const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)

const selectedYear = ref(prevMonthDate.getFullYear())
const selectedMonth = ref(prevMonthDate.getMonth()) // 0 a 11
const selectedAccountId = ref('')

const monthNames = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

const monthDisplay = computed(() => {
  return `${monthNames[selectedMonth.value]} de ${selectedYear.value}`
})

const isCurrentMonth = computed(() => {
  return selectedYear.value === now.getFullYear() && selectedMonth.value === now.getMonth()
})

const isPrevMonth = computed(() => {
  return selectedYear.value === prevMonthDate.getFullYear() && selectedMonth.value === prevMonthDate.getMonth()
})

// Opções do Select customizado de contas
const accountOptions = computed<AppSelectOption[]>(() => {
  const list: AppSelectOption[] = [
    {
      value: '',
      label: 'Consolidado (Todas as Contas)',
      icon: PhWallet
    }
  ]
  accountsStore.accounts.forEach(acc => {
    list.push({
      value: acc.id,
      label: acc.name,
      sublabel: acc.institution,
      badge: acc.type === 'CREDIT_CARD' ? 'Cartão' : 'Conta',
      icon: acc.type === 'CREDIT_CARD' ? PhCreditCard : PhBank
    })
  })
  return list
})

const prevMonth = () => {
  if (selectedMonth.value === 0) {
    selectedMonth.value = 11
    selectedYear.value--
  } else {
    selectedMonth.value--
  }
}

const nextMonth = () => {
  if (selectedMonth.value === 11) {
    selectedMonth.value = 0
    selectedYear.value++
  } else {
    selectedMonth.value++
  }
}

const goToCurrentMonth = () => {
  selectedYear.value = now.getFullYear()
  selectedMonth.value = now.getMonth()
}

const goToPrevMonth = () => {
  selectedYear.value = prevMonthDate.getFullYear()
  selectedMonth.value = prevMonthDate.getMonth()
}

const loadDashboardData = async () => {
  const firstDay = new Date(selectedYear.value, selectedMonth.value, 1)
  const lastDay = new Date(selectedYear.value, selectedMonth.value + 1, 0)
  
  const formatDateISO = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  const params: { date_from: string; date_to: string; accounts?: string; limit?: number } = {
    limit: 500,
    date_from: formatDateISO(firstDay),
    date_to: formatDateISO(lastDay),
  }

  if (selectedAccountId.value && selectedAccountId.value !== 'ALL') {
    params.accounts = selectedAccountId.value
  }

  try {
    await txStore.fetchDashboardTransactions(params)
  } catch (err) {
    console.warn('Erro ao buscar transações do dashboard:', err)
  }
}

onMounted(async () => {
  try {
    await Promise.all([
      tagsStore.fetchTags(),
      accountsStore.fetchAccounts()
    ])
    await loadDashboardData()
  } catch (err) {
    console.warn('Erro ao carregar dados iniciais do dashboard:', err)
  }
})

watch([selectedMonth, selectedYear, selectedAccountId], () => {
  loadDashboardData()
})

const getTagById = (id: string) => {
  return tagsStore.tags.find(t => t.id === id)
}

const isCredit = (t: any) => {
  return t.amount > 0
}

// Transações ativas no período (não planejadas)
const activeTransactions = computed(() => {
  return txStore.dashboardTransactions.filter(t => t.status !== 'PLANNED')
})

// Consolidação financeira por categoria com compensação entre débitos e créditos.
// Para qualquer categoria no período, entradas (créditos) e saídas (débitos) se abatem:
// despesa líquida = max(0, débitos - créditos)
// receita líquida = max(0, créditos - débitos)
const categoryBreakdown = computed(() => {
  const map: Record<string, {
    tagId?: string
    name: string
    color: string
    debits: number
    credits: number
  }> = {}

  let untaggedDebits = 0
  let untaggedCredits = 0

  for (const t of activeTransactions.value) {
    if (t.is_transfer) continue

    const tagId = t.tags?.[0]
    const tag = tagId ? getTagById(tagId) : null
    const amount = Math.abs(t.amount)

    if (!tag) {
      if (isCredit(t)) {
        untaggedCredits += amount
      } else {
        untaggedDebits += amount
      }
      continue
    }

    if (!map[tag.id]) {
      map[tag.id] = {
        tagId: tag.id,
        name: tag.name,
        color: tag.color || '#64748b',
        debits: 0,
        credits: 0,
      }
    }

    if (isCredit(t)) {
      map[tag.id].credits += amount
    } else {
      map[tag.id].debits += amount
    }
  }

  let totalExpensesCalc = untaggedDebits
  let totalIncomeCalc = untaggedCredits
  let totalAbated = 0

  const expenseCategories: Record<string, { total: number; color: string; name: string }> = {}

  for (const cat of Object.values(map)) {
    const abatedAmount = Math.min(cat.debits, cat.credits)
    totalAbated += abatedAmount

    const netExpense = Math.max(0, cat.debits - cat.credits)
    const netIncome = Math.max(0, cat.credits - cat.debits)

    totalExpensesCalc += netExpense
    totalIncomeCalc += netIncome

    if (netExpense > 0) {
      expenseCategories[cat.name] = {
        total: netExpense,
        color: cat.color,
        name: cat.name,
      }
    }
  }

  if (untaggedDebits > 0) {
    expenseCategories['Sem Categoria'] = {
      total: untaggedDebits,
      color: '#64748b',
      name: 'Sem Categoria',
    }
  }

  return {
    totalExpenses: totalExpensesCalc,
    totalIncome: totalIncomeCalc,
    totalAbated,
    expenseCategories,
  }
})

// Métricas de Caixa do Mês Selecionado
const totalIncome = computed(() => categoryBreakdown.value.totalIncome)
const totalExpenses = computed(() => categoryBreakdown.value.totalExpenses)
const totalAbated = computed(() => categoryBreakdown.value.totalAbated)

const totalPlanned = computed(() => {
  return txStore.dashboardTransactions
    .filter(t => !isCredit(t) && t.status === 'PLANNED' && !t.is_transfer)
    .reduce((acc, t) => acc + Math.abs(t.amount), 0)
})

const netBalance = computed(() => {
  return totalIncome.value - totalExpenses.value
})

const projectedBalance = computed(() => {
  return netBalance.value - totalPlanned.value
})

const recentTransactions = computed(() => {
  return txStore.dashboardTransactions.slice(0, 7)
})

// Dados do Gráfico de Rosca por Categoria
const chartData = computed(() => {
  const categories = categoryBreakdown.value.expenseCategories
  const labels = Object.values(categories).map(c => c.name)
  const data = Object.values(categories).map(c => c.total)
  const backgroundColor = Object.values(categories).map(c => c.color)

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
        padding: 10
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
    <!-- Checklist de Onboarding / Primeiros Passos -->
    <OnboardingChecklist 
      @open-ofx-guide="openOFXGuide?.()"
      @open-new-account="router.push('/accounts')"
      @open-import-ofx="openImport?.()"
    />
    <!-- Header & Barra de Controles de Período -->
    <div class="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
      <div class="shrink-0">
        <h1 class="text-xl md:text-2xl font-bold tracking-tight text-white whitespace-nowrap">Painel Geral</h1>
        <p class="text-xs text-white/50">Fluxo de caixa e despesas consolidadas da família</p>
      </div>

      <div class="flex flex-col md:flex-row items-stretch md:items-center gap-2.5 w-full md:w-auto">
        <!-- 1. Seletor de Conta com Componente Padronizado -->
        <div class="w-full md:w-60 lg:w-64 shrink-0">
          <AppSelect
            v-model="selectedAccountId"
            :options="accountOptions"
            placeholder="Consolidado (Todas as Contas)"
            size="md"
          />
        </div>

        <!-- 2. Navegador de Mês / Anão -->
        <div class="flex items-center justify-between md:justify-center bg-surface border border-white/10 rounded-xl p-1 gap-1 shadow-sm h-10 w-full md:w-auto">
          <button
            type="button"
            @click="prevMonth"
            class="p-2 sm:p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            title="Mês Anterior"
          >
            <PhCaretLeft :size="15" weight="bold" />
          </button>

          <span class="px-2 text-xs font-bold text-white text-center select-none truncate flex-1 md:flex-none md:min-w-[145px]">
            {{ monthDisplay }}
          </span>

          <button
            type="button"
            @click="nextMonth"
            class="p-2 sm:p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            title="Próximo Mês"
          >
            <PhCaretRight :size="15" weight="bold" />
          </button>
        </div>

        <!-- 3. Atalhos rápidos de Mês -->
        <div class="grid grid-cols-2 md:inline-flex bg-surface border border-white/10 rounded-xl p-1 gap-1 shadow-sm h-10 items-center w-full md:w-auto">
          <button
            type="button"
            @click="goToPrevMonth"
            class="px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none whitespace-nowrap text-center flex items-center justify-center"
            :class="isPrevMonth ? 'bg-accent/20 text-accent font-bold shadow-sm' : 'text-white/60 hover:text-white hover:bg-white/5'"
          >
            Mês Passado
          </button>
          <button
            type="button"
            @click="goToCurrentMonth"
            class="px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none whitespace-nowrap text-center flex items-center justify-center"
            :class="isCurrentMonth ? 'bg-accent/20 text-accent font-bold shadow-sm' : 'text-white/60 hover:text-white hover:bg-white/5'"
          >
            Mês Atual
          </button>
        </div>
      </div>
    </div>

    <!-- Bento Grid de Métricas Financeiras -->
    <div data-tour="kpi-cards" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Card: Receitas -->
      <Card data-tour="kpi-card-primary" class="p-5 flex flex-col justify-between gap-3 min-h-[115px]">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-white/50">Receitas em {{ monthNames[selectedMonth] }}</span>
          <div class="w-8 h-8 rounded-xl bg-accent/15 flex items-center justify-center text-accent">
            <PhTrendUp :size="18" weight="bold" />
          </div>
        </div>
        <div>
          <span class="text-2xl font-bold tracking-tight text-accent">
            {{ formatCurrency(totalIncome) }}
          </span>
          <p class="text-[11px] text-white/40 mt-1">Entradas confirmadas no período</p>
        </div>
      </Card>

      <!-- Card: Despesas -->
      <Card class="p-5 flex flex-col justify-between gap-3 min-h-[115px]">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-white/50">Despesas em {{ monthNames[selectedMonth] }}</span>
          <div class="w-8 h-8 rounded-xl bg-red-500/15 flex items-center justify-center text-red-400">
            <PhTrendDown :size="18" weight="bold" />
          </div>
        </div>
        <div>
          <span class="text-2xl font-bold tracking-tight text-red-400">
            {{ formatCurrency(totalExpenses) }}
          </span>
          <p class="text-[11px] text-white/40 mt-1">
            <span v-if="totalAbated > 0" class="text-accent/80 font-medium">
              {{ formatCurrency(totalAbated) }} compensados
            </span>
            <span v-else>Gastos efetivados no período</span>
          </p>
        </div>
      </Card>

      <!-- Card: Saldo Líquido -->
      <Card class="p-5 flex flex-col justify-between gap-3 min-h-[115px]">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-white/50">Saldo Líquido</span>
          <div class="w-8 h-8 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-400">
            <PhWallet :size="18" weight="duotone" />
          </div>
        </div>
        <div>
          <span 
            class="text-2xl font-bold tracking-tight"
            :class="netBalance >= 0 ? 'text-white' : 'text-red-400'"
          >
            {{ formatCurrency(netBalance) }}
          </span>
          <p class="text-[11px] text-white/40 mt-1">Receitas menãos despesas</p>
        </div>
      </Card>

      <!-- Card: Saldo Projetado -->
      <Card class="p-5 flex flex-col justify-between gap-3 min-h-[115px]">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-amber-400/90">Saldo Projetado</span>
          <div class="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400">
            <PhClock :size="18" weight="bold" />
          </div>
        </div>
        <div>
          <span 
            class="text-2xl font-bold tracking-tight text-amber-400"
          >
            {{ formatCurrency(projectedBalance) }}
          </span>
          <p class="text-[11px] text-white/40 mt-1">
            Abatendo {{ formatCurrency(totalPlanned) }} em gastos previstos
          </p>
        </div>
      </Card>
    </div>

    <!-- Linha Principal: Gráfico de Rosca e Últimas Transações -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Gráfico de Rosca: Despesas por Categoria -->
      <Card class="p-6 flex flex-col gap-4 min-h-[380px]">
        <div class="flex items-center justify-between">
          <h2 class="text-sm font-bold text-white tracking-wide">Gastos por Categoria</h2>
          <Badge variant="secondary">
            {{ monthNames[selectedMonth] }}
          </Badge>
        </div>

        <div class="relative h-64 flex items-center justify-center">
          <div v-if="txStore.dashboardLoading" class="text-xs text-white/40">Carregando dados...</div>
          <div v-else-if="chartData.labels.length === 0" class="text-center text-white/40 text-xs flex flex-col gap-2">
            <span>Nenhuma despesa registrada neste mês.</span>
          </div>
          <Doughnut v-else :data="chartData" :options="chartOptions" />
        </div>
      </Card>

      <!-- Tabela: Lançamentos Recentes do Mês -->
      <Card class="lg:col-span-2 p-6 flex flex-col justify-between min-h-[380px]">
        <div class="flex flex-col gap-4">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-sm font-bold text-white tracking-wide">Lançamentos de {{ monthDisplay }}</h2>
              <p class="text-xs text-white/40 mt-0.5">Exibindo as transações registradas para este período</p>
            </div>
            <router-link 
              to="/transactions" 
              class="text-xs text-accent hover:underline flex items-center gap-1 font-semibold"
            >
              <span>Ver extrato completo</span>
              <PhArrowRight :size="12" />
            </router-link>
          </div>

          <!-- Lista de Lançamentos -->
          <div v-if="txStore.dashboardLoading" class="py-12 text-center text-xs text-white/40">
            Carregando transações...
          </div>
          <div v-else-if="recentTransactions.length === 0" class="py-12 text-center flex flex-col items-center gap-2">
            <span class="text-xs text-white/40">Nenhuma transação encontrada para este mês.</span>
            <router-link 
              to="/import"
              class="text-xs text-accent hover:underline flex items-center gap-1 mt-1 font-medium"
            >
              <PhUploadSimple :size="15" />
              <span>Importar extrato OFX</span>
            </router-link>
          </div>
          <div v-else class="divide-y divide-white/5">
            <div 
              v-for="t in recentTransactions" 
              :key="t.id"
              class="py-3 flex items-center justify-between gap-3 hover:bg-white/[0.02] px-2 rounded-xl transition-colors"
            >
              <div class="flex items-center gap-3 min-w-0">
                <div 
                  class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  :class="isCredit(t) ? 'bg-accent/15 text-accent' : 'bg-red-500/15 text-red-400'"
                >
                  <PhArrowUpRight v-if="isCredit(t)" :size="16" weight="bold" />
                  <PhArrowDownRight v-else :size="16" weight="bold" />
                </div>
                <div class="min-w-0">
                  <p class="text-xs font-bold text-white truncate">{{ t.name || 'Sem descrição' }}</p>
                  <div class="flex items-center gap-1.5 mt-0.5">
                    <span 
                      v-if="t.tags && t.tags.length > 0 && getTagById(t.tags[0])" 
                      class="text-[10px] px-1.5 py-0.2 rounded font-medium"
                      :style="{
                        backgroundColor: (getTagById(t.tags[0])?.color || '#10b981') + '20',
                        color: getTagById(t.tags[0])?.color || '#10b981'
                      }"
                    >
                      {{ getTagById(t.tags[0])?.name }}
                    </span>
                    <span class="text-[10px] text-white/40">{{ formatDate(t.date_posted) }}</span>
                  </div>
                </div>
              </div>

              <div class="text-right shrink-0">
                <span 
                  class="text-xs font-bold"
                  :class="isCredit(t) ? 'text-accent' : 'text-white'"
                >
                  {{ isCredit(t) ? '+' : '' }}{{ formatCurrency(t.amount) }}
                </span>
                <span 
                  v-if="t.status === 'PLANNED'"
                  class="block text-[9px] text-amber-400 font-semibold"
                >
                  Prevista
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>


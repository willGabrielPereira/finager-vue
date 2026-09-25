<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch, computed, markRaw } from 'vue'
import { useTransactionsStore } from '../stores/transactions'
import { useAuthStore } from '../stores/auth'
import AppSelect from '../components/ui/AppSelect.vue'
import { useTagsStore } from '../stores/tags'
import { useAccountsStore } from '../stores/accounts'
import { TagCombobox } from '@/components/ui/tag-combobox'
import { Button } from '@/components/ui/button'
import SimilarTagPrompt from '../components/ui/SimilarTagPrompt.vue'
import AIReclassifyModal from '../components/ui/AIReclassifyModal.vue'
import CreateTransactionModal from '../components/ui/CreateTransactionModal.vue'
import ImportOFXModal from '../components/ui/ImportOFXModal.vue'
import TransactionDetailsModal from '../components/ui/TransactionDetailsModal.vue'
import { toast, showAlert } from '../utils/feedback'
import { type Transaction } from '../stores/transactions'
import { 
  PhArrowDownRight, 
  PhArrowUpRight, 
  PhCalendarBlank, 
  PhCaretDown,
  PhCaretLeft,
  PhCaretRight, 
  PhPlus, 
  PhCircleNotch, 
  PhSparkle, 
  PhUploadSimple, 
  PhTrash, 
  PhMagnifyingGlass, 
  PhBank, 
  PhCreditCard, 
  PhX, 
  PhCheck, 
  PhArrowsCounterClockwise,
  PhPencilSimple,
  PhFunnel,
  PhWarningCircle
} from '@phosphor-icons/vue'

const authStore = useAuthStore()
const store = useTransactionsStore()
const tagsStore = useTagsStore()
const accountsStore = useAccountsStore()

// Estado de atualização de transação
const updatingTxId = ref<string | null>(null)

// Modais e Prompts
const isAIModalOpen = ref(false)
const isAIModalLoading = ref(false)
const aiResultCount = ref<number | null>(null)

const isCreateModalOpen = ref(false)
const isImportModalOpen = ref(false)

// Modal de Detalhes / Edição de Transação
const selectedTxForDetails = ref<Transaction | null>(null)
const isDetailsModalOpen = ref(false)

const openTransactionDetails = (tx: Transaction) => {
  selectedTxForDetails.value = tx
  isDetailsModalOpen.value = true
}

const closeTransactionDetails = () => {
  isDetailsModalOpen.value = false
  selectedTxForDetails.value = null
}

const onTransactionUpdated = (updatedTx: Transaction) => {
  const idx = store.transactions.findIndex(t => t.id === updatedTx.id)
  if (idx !== -1) {
    store.transactions[idx] = { ...store.transactions[idx], ...updatedTx }
  }
}

const onTransactionDeleted = (txId: string) => {
  store.transactions = store.transactions.filter(t => t.id !== txId)
}

// Prompt de Propagação de Tags Semelhantes
const similarPrompt = ref<{
  txId: string
  merchantPattern: string
  categoryName: string
  categoryColor: string
  loading: boolean
} | null>(null)

// Filtros
const searchInput = ref('')
const activeFilterTab = ref<'ALL' | 'UNTAGGED' | 'DEBIT' | 'CREDIT' | 'PLANNED'>('ALL')

// Controle de rolagem horizontal das abas de filtro com setas, wheel e affordance visual
const chipsContainer = ref<HTMLElement | null>(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)

const updateChipsScroll = () => {
  const el = chipsContainer.value
  if (!el) return
  canScrollLeft.value = el.scrollLeft > 4
  canScrollRight.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 4
}

const scrollChips = (direction: 'left' | 'right') => {
  const el = chipsContainer.value
  if (!el) return
  const offset = direction === 'left' ? -180 : 180
  el.scrollBy({ left: offset, behavior: 'smooth' })
}

const handleChipsWheel = (e: WheelEvent) => {
  if (!chipsContainer.value) return
  if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
    chipsContainer.value.scrollLeft += e.deltaY
    updateChipsScroll()
  }
}

watch(activeFilterTab, () => {
  setTimeout(updateChipsScroll, 60)
})

// Dropdowns de Filtro Avançado
const isAccountsMenuOpen = ref(false)
const isTagsMenuOpen = ref(false)
const isPeriodMenuOpen = ref(false)
const tagSearchQuery = ref('')

type PeriodPreset = 'ALL' | 'PREVIOUS_MONTH' | 'CURRENT_MONTH' | 'LAST_30' | 'CURRENT_YEAR' | 'CUSTOM'
const activePeriodPreset = ref<PeriodPreset>('ALL')
const customDateFrom = ref('')
const customDateTo = ref('')

const periodLabels: Record<PeriodPreset, string> = {
  ALL: 'Todo o histórico',
  PREVIOUS_MONTH: 'Mês anterior',
  CURRENT_MONTH: 'Mês atual',
  LAST_30: 'Últimos 30 dias',
  CURRENT_YEAR: 'Este ano',
  CUSTOM: 'Personalizado',
}

onMounted(async () => {
  setTimeout(updateChipsScroll, 100)
  if (chipsContainer.value) {
    const observer = new ResizeObserver(updateChipsScroll)
    observer.observe(chipsContainer.value)
  }
  if (!authStore.isAuthenticated) return
  await Promise.all([
    store.fetchTransactions(),
    tagsStore.fetchTags(),
    tagsStore.fetchFrequentTags(60, 6),
    accountsStore.fetchAccounts()
  ])
  window.addEventListener('click', onWindowClick)
  window.addEventListener('scroll', onWindowScroll, true)
})

onUnmounted(() => {
  window.removeEventListener('click', onWindowClick)
  window.removeEventListener('scroll', onWindowScroll, true)
})

const onWindowClick = () => {
  isAccountsMenuOpen.value = false
  isTagsMenuOpen.value = false
  isPeriodMenuOpen.value = false
}

const onWindowScroll = () => {
  isAccountsMenuOpen.value = false
  isTagsMenuOpen.value = false
  isPeriodMenuOpen.value = false
}

// Busca com debounce
let searchTimeout: any = null
watch(searchInput, (newVal) => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    store.filters.search = newVal
    store.pagination.page = 1
    store.fetchTransactions()
  }, 350)
})

const setFilterTab = (tab: 'ALL' | 'UNTAGGED' | 'DEBIT' | 'CREDIT' | 'PLANNED') => {
  activeFilterTab.value = tab
  store.pagination.page = 1

  if (tab === 'ALL') {
    store.filters.type = ''
    store.filters.amount_min = undefined
    store.filters.amount_max = undefined
    store.filters.status = ''
  } else if (tab === 'DEBIT') {
    store.filters.type = ''
    store.filters.amount_min = undefined
    store.filters.amount_max = -0.01
    store.filters.status = ''
  } else if (tab === 'CREDIT') {
    store.filters.type = ''
    store.filters.amount_min = 0.01
    store.filters.amount_max = undefined
    store.filters.status = ''
  } else if (tab === 'UNTAGGED') {
    store.filters.type = ''
    store.filters.amount_min = undefined
    store.filters.amount_max = undefined
    store.filters.status = 'UNTAGGED'
  } else if (tab === 'PLANNED') {
    store.filters.type = ''
    store.filters.amount_min = undefined
    store.filters.amount_max = undefined
    store.filters.status = 'PLANNED'
  }

  store.fetchTransactions()
}

// Filtros avançados (contas, categorias, período) ficam recolhidos no mobile
const showAdvancedFilters = ref(false)
const advancedFilterCount = computed(() =>
  store.filters.accounts.length +
  store.filters.tags.length +
  (store.filters.date_from || store.filters.date_to ? 1 : 0)
)

// Mudou filtro => volta à página 1 (senão uma página alta pode vir vazia)
const onFilterSelectChange = () => {
  store.pagination.page = 1
  store.fetchTransactions()
}

const goToPage = async (page: number) => {
  await store.fetchTransactions({ page })
  document.querySelector('main')?.scrollTo({ top: 0 })
}

// Filtro Multi-Contas
const toggleAccountFilter = (accId: string) => {
  const current = [...store.filters.accounts]
  const idx = current.indexOf(accId)
  if (idx >= 0) {
    current.splice(idx, 1)
  } else {
    current.push(accId)
  }
  store.filters.accounts = current
  store.pagination.page = 1
  store.fetchTransactions()
}


const accountFilterOptions = computed(() => {
  return accountsStore.accounts.map((a) => ({
    value: a.id,
    label: a.name,
    badge: a.type === 'CREDIT_CARD' ? 'Cartão' : 'Conta',
    icon: markRaw(a.type === 'CREDIT_CARD' ? PhCreditCard : PhBank),
  }))
})



const toggleTagFilter = (tagId: string) => {
  store.filters.tags = store.filters.tags.filter(id => id !== tagId);
  store.pagination.page = 1;
  store.fetchTransactions();
};

const tagFilterOptions = computed(() => {
  return tagsStore.tags.map((t) => ({
    value: t.id,
    label: t.name,
    color: t.color,
  }))
})

// Filtro de Período
const setPeriodPreset = (preset: PeriodPreset) => {
  activePeriodPreset.value = preset
  const now = new Date()

  if (preset === 'ALL') {
    store.filters.date_from = ''
    store.filters.date_to = ''
    isPeriodMenuOpen.value = false
  } else if (preset === 'CURRENT_MONTH') {
    const y = now.getFullYear()
    const m = now.getMonth()
    store.filters.date_from = `${y}-${String(m + 1).padStart(2, '0')}-01`
    const lastDay = new Date(y, m + 1, 0).getDate()
    store.filters.date_to = `${y}-${String(m + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
    isPeriodMenuOpen.value = false
  } else if (preset === 'PREVIOUS_MONTH') {
    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const y = prevDate.getFullYear()
    const m = prevDate.getMonth()
    store.filters.date_from = `${y}-${String(m + 1).padStart(2, '0')}-01`
    const lastDay = new Date(y, m + 1, 0).getDate()
    store.filters.date_to = `${y}-${String(m + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
    isPeriodMenuOpen.value = false
  } else if (preset === 'LAST_30') {
    const d30 = new Date()
    d30.setDate(now.getDate() - 30)
    store.filters.date_from = d30.toISOString().split('T')[0]
    store.filters.date_to = now.toISOString().split('T')[0]
    isPeriodMenuOpen.value = false
  } else if (preset === 'CURRENT_YEAR') {
    const y = now.getFullYear()
    store.filters.date_from = `${y}-01-01`
    store.filters.date_to = `${y}-12-31`
    isPeriodMenuOpen.value = false
  } else if (preset === 'CUSTOM') {
    return
  }

  store.pagination.page = 1
  store.fetchTransactions()
}

const applyCustomDates = () => {
  store.filters.date_from = customDateFrom.value
  store.filters.date_to = customDateTo.value
  isPeriodMenuOpen.value = false
  store.pagination.page = 1
  store.fetchTransactions()
}

// Reset de Todos os Filtros
const hasActiveFilters = computed(() => {
  return (
    searchInput.value !== '' ||
    activeFilterTab.value !== 'ALL' ||
    store.filters.accounts.length > 0 ||
    store.filters.tags.length > 0 ||
    activePeriodPreset.value !== 'ALL' ||
    Boolean(store.filters.date_from) ||
    Boolean(store.filters.date_to)
  )
})

const resetAllFilters = () => {
  store.clearFilters()
  activeFilterTab.value = 'ALL'
  searchInput.value = ''
  activePeriodPreset.value = 'ALL'
  customDateFrom.value = ''
  customDateTo.value = ''
  tagSearchQuery.value = ''
  store.fetchTransactions()
}

const getTagById = (id: string) => {
  return tagsStore.tags.find((t) => t.id === id)
}

const getAccountById = (id: string) => {
  return accountsStore.accounts.find((a) => a.id === id)
}

const onCategorySelected = async (txId: string, tagId: string | null) => {
  const tx = store.transactions.find((t) => t.id === txId)
  if (!tx) return
  updatingTxId.value = txId

  const originalTags = [...(tx.tags || [])]
  const newTags = tagId ? [tagId, ...originalTags.slice(1)] : []

  try {
    await store.updateTags(txId, newTags)

    if (tagId) {
      const tagObj = getTagById(tagId)
      similarPrompt.value = {
        txId: tx.id,
        merchantPattern: tx.name || tx.memo,
        categoryName: tagObj?.name || 'Categoria',
        categoryColor: tagObj?.color || '#22c55e',
        loading: false,
      }
    }
  } catch (err) {
    console.error('Erro ao atualizar categoria:', err)
    toast.error('Categoria não salva', 'Não foi possível salvar a alteração. Tente novamente.')
  } finally {
    updatingTxId.value = null
  }
}

const onSecondaryTagToggled = async (txId: string, tagId: string) => {
  const tx = store.transactions.find((t) => t.id === txId)
  if (!tx) return

  const currentTags = [...(tx.tags || [])]
  const exists = currentTags.includes(tagId)
  const newTags = exists ? currentTags.filter((id) => id !== tagId) : [...currentTags, tagId]

  try {
    await store.updateTags(txId, newTags)
  } catch (err) {
    console.error('Erro ao atualizar marcadores secundários:', err)
    toast.error('Categoria não salva', 'Não foi possível salvar a alteração. Tente novamente.')
  }
}

const handleApplySimilar = async () => {
  if (!similarPrompt.value) return

  similarPrompt.value.loading = true
  try {
    const res = await store.applySimilar(similarPrompt.value.txId, false)
    const count = res?.updated_count ?? 0
    similarPrompt.value = null
    toast.success(
      'Atualização em massa concluída!',
      count === 1
        ? 'A categoria foi aplicada a 1 transação semelhante.'
        : `A categoria foi aplicada a ${count} transações semelhantes.`
    )
  } catch (err: any) {
    console.error('Falha ao propagar tags:', err)
    toast.error('Erro na propagação', err.response?.data?.message || 'Falha ao propagar categoria.')
  } finally {
    if (similarPrompt.value) similarPrompt.value.loading = false
  }
}

const handleConfirmAI = async (includeManuallyTagged: boolean) => {
  isAIModalLoading.value = true
  try {
    const res = await store.runAIAutoTag(includeManuallyTagged)
    aiResultCount.value = res.tagged_count
  } catch (err: any) {
    console.error('Erro na IA:', err)
    toast.error('Erro na IA', err.response?.data?.message || 'Falha ao rodar classificação com IA.')
  } finally {
    isAIModalLoading.value = false
  }
}

const closeAIModal = () => {
  isAIModalOpen.value = false
  aiResultCount.value = null
}

const handleDelete = async (txId: string) => {
  const confirmed = await showAlert.confirm({
    title: 'Excluir lançamento?',
    text: 'Esta ação removerá a transação permanentemente.',
    confirmText: 'Sim, excluir',
    cancelText: 'Cancelar',
    isDestructive: true,
  })
  if (!confirmed) return

  try {
    await store.deleteTransaction(txId)
    toast.success('Transação excluída com sucesso.')
  } catch (err) {
    console.error('Falha ao deletar:', err)
    toast.error('Erro ao excluir', 'Não foi possível excluir a transação.')
  }
}

const formatDate = (dateString: string) => {
  if (!dateString) return ''
  const d = new Date(dateString)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
}

const isCredit = (t: Transaction) => {
  return t.amount > 0
}
</script>

<template>
  <div class="flex flex-col gap-5">
    <!-- Barra Superior: Título e Botões de Ação -->
    <div data-tour="transactions-header" class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div class="min-w-0">
        <h1 class="text-xl md:text-2xl font-bold tracking-tight text-white">Extrato & Transações</h1>
        <p class="text-xs text-white/50">Gerencie seus lançamentos bancários, manuais e faturas</p>
      </div>

      <div class="flex items-center gap-2 shrink-0 flex-wrap">
        <Button 
          variant="outline"
          size="sm"
          class="border-accent/30 bg-accent/10 hover:bg-accent/20 text-accent gap-1.5"
          @click="isAIModalOpen = true"
        >
          <PhSparkle :size="15" weight="fill" />
          <span>Classificar com IA</span>
        </Button>

        <!-- No mobile, importar fica no botão "+" da barra inferior -->
        <Button
          variant="outline"
          size="sm"
          class="gap-1.5 hidden sm:inline-flex"
          @click="isImportModalOpen = true"
        >
          <PhUploadSimple :size="15" />
          <span>Importar OFX</span>
        </Button>

        <Button 
          size="sm"
          class="gap-1.5"
          @click="isCreateModalOpen = true" 
        >
          <PhPlus :size="15" weight="bold" />
          <span>Novo Lançamento</span>
        </Button>
      </div>
    </div>

    <!-- Bloco de Filtros Principal -->
    <div class="bg-surface rounded-2xl border border-white/5 p-3.5 flex flex-col gap-3 shadow-lg">
      <!-- Linha 1: Abas Rápidas e Busca -->
      <div class="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <!-- Container dos Chips com Indicadores Visuais de Scroll e Setas -->
        <div class="relative flex items-center min-w-0 flex-1">
          <!-- Seta Esquerda -->
          <button 
            v-if="canScrollLeft"
            type="button"
            @click="scrollChips('left')"
            class="absolute left-0 z-20 p-1.5 rounded-full bg-slate-900/95 border border-white/20 text-white/80 hover:text-white hover:border-accent hover:bg-slate-800 shadow-xl transition-all cursor-pointer flex items-center justify-center shrink-0"
            title="Ver opções anteriores"
          >
            <PhCaretLeft :size="13" weight="bold" />
          </button>

          <!-- Fade Gradiente Esquerdo -->
          <div 
            v-if="canScrollLeft"
            class="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-surface via-surface/80 to-transparent pointer-events-none z-10"
          ></div>

          <!-- Container Rolável de Chips com Scrollbar Estilizada -->
          <div 
            ref="chipsContainer"
            @scroll="updateChipsScroll"
            @wheel.passive="handleChipsWheel"
            class="flex items-center gap-1.5 overflow-x-auto scroll-smooth custom-h-scrollbar pb-2 pt-0.5 px-2 min-w-0 w-full"
          >
            <button
              type="button"
              @click="setFilterTab('ALL')"
              class="px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0"
              :class="activeFilterTab === 'ALL' ? 'bg-accent/20 text-accent border border-accent/40' : 'text-white/60 hover:text-white hover:bg-white/5'"
            >
              Todas
            </button>
            <button
              type="button"
              @click="setFilterTab('DEBIT')"
              class="px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0"
              :class="activeFilterTab === 'DEBIT' ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'text-white/60 hover:text-white hover:bg-white/5'"
            >
              Despesas
            </button>
            <button
              type="button"
              @click="setFilterTab('CREDIT')"
              class="px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0"
              :class="activeFilterTab === 'CREDIT' ? 'bg-accent/20 text-accent border border-accent/40' : 'text-white/60 hover:text-white hover:bg-white/5'"
            >
              Receitas
            </button>
            <button
              type="button"
              @click="setFilterTab('UNTAGGED')"
              class="px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0"
              :class="activeFilterTab === 'UNTAGGED' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'text-white/60 hover:text-white hover:bg-white/5'"
            >
              Sem Categoria
            </button>
            <button
              type="button"
              @click="setFilterTab('PLANNED')"
              class="px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0"
              :class="activeFilterTab === 'PLANNED' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40' : 'text-white/60 hover:text-white hover:bg-white/5'"
            >
              Previstas
            </button>
          </div>

          <!-- Fade Gradiente Direito (indica claramente que há mais opções à direita) -->
          <div 
            v-if="canScrollRight"
            class="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-surface via-surface/80 to-transparent pointer-events-none z-10"
          ></div>

          <!-- Seta Direita com Pulsar Sutil (Affordance interativa de mais opções) -->
          <button 
            v-if="canScrollRight"
            type="button"
            @click="scrollChips('right')"
            class="absolute right-0 z-20 p-1.5 rounded-full bg-slate-900/95 border border-white/20 text-white/80 hover:text-white hover:border-accent hover:bg-slate-800 shadow-xl transition-all cursor-pointer flex items-center justify-center shrink-0 animate-pulse hover:animate-none motion-reduce:animate-none"
            title="Mais opções à direita"
          >
            <PhCaretRight :size="13" weight="bold" />
          </button>
        </div>

        <!-- Campo de Busca + botão de filtros (mobile) -->
        <div class="flex items-center gap-2 w-full md:w-72 shrink-0">
          <div class="relative flex-1 min-w-0">
            <PhMagnifyingGlass :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
            <input
              v-model="searchInput"
              type="search"
              aria-label="Buscar lançamentos"
              placeholder="Buscar por descrição ou observação..."
              class="w-full bg-slate-950/70 border border-white/10 rounded-xl pl-9 pr-9 py-2 text-base md:text-xs text-white placeholder-white/40 focus:outline-none focus:border-accent focus:bg-slate-950 transition-colors"
            />
            <button
              v-if="searchInput"
              @click="searchInput = ''"
              type="button"
              aria-label="Limpar busca"
              class="absolute right-1 top-1/2 -translate-y-1/2 p-2 text-white/50 hover:text-white cursor-pointer"
            >
              <PhX :size="14" />
            </button>
          </div>
          <button
            type="button"
            @click="showAdvancedFilters = !showAdvancedFilters"
            :aria-expanded="showAdvancedFilters"
            class="md:hidden flex items-center gap-1.5 px-3 h-10 rounded-xl text-xs font-semibold border transition-colors cursor-pointer shrink-0"
            :class="advancedFilterCount > 0 || showAdvancedFilters ? 'bg-accent/15 border-accent/50 text-accent' : 'bg-white/5 border-white/10 text-white/70'"
          >
            <PhFunnel :size="16" />
            <span>Filtros{{ advancedFilterCount > 0 ? ` (${advancedFilterCount})` : '' }}</span>
          </button>
        </div>
      </div>

      <!-- Linha 2: Dropdowns de Filtros Avançados (Contas, Categorias, Período, Limpar) -->
      <div
        class="items-center gap-2 flex-wrap pt-1 border-t border-white/5"
        :class="showAdvancedFilters ? 'flex' : 'hidden md:flex'"
      >
        <!-- 1. Dropdown Multi-Contas com AppSelect -->
        <div class="w-full sm:w-56 shrink-0">
          <AppSelect
            v-model="store.filters.accounts"
            :options="accountFilterOptions"
            mode="multiple"
            placeholder="Todas as Contas"
            size="sm"
            @change="onFilterSelectChange"
          />
        </div>

        <!-- 2. Dropdown Multi-Categorias com AppSelect -->
        <div class="w-full sm:w-56 shrink-0">
          <AppSelect
            v-model="store.filters.tags"
            :options="tagFilterOptions"
            mode="multiple"
            placeholder="Todas as Categorias"
            size="sm"
            @change="onFilterSelectChange"
          />
        </div>

        <!-- 3. Dropdown de Período -->
        <div class="relative">
          <button
            type="button"
            @click.stop="isPeriodMenuOpen = !isPeriodMenuOpen; isAccountsMenuOpen = false; isTagsMenuOpen = false"
            class="flex items-center gap-2 px-3 h-9 rounded-xl text-xs font-medium border transition-all cursor-pointer whitespace-nowrap shrink-0"
            :class="activePeriodPreset !== 'ALL' || store.filters.date_from 
              ? 'bg-accent/15 border-accent/50 text-accent' 
              : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'"
          >
            <PhCalendarBlank :size="15" />
            <span>{{ periodLabels[activePeriodPreset] }}</span>
            <PhCaretDown :size="12" class="opacity-60" />
          </button>

          <!-- Menu Flutuante de Período -->
          <div 
            v-if="isPeriodMenuOpen" 
            @click.stop
            class="absolute left-0 top-full mt-2 w-72 p-3 bg-surface border border-white/10 rounded-2xl shadow-2xl z-50 flex flex-col gap-2 backdrop-blur-md"
          >
            <div class="text-xs font-bold text-white pb-1.5 border-b border-white/5">
              Selecione o Período
            </div>

            <div class="grid grid-cols-1 gap-1">
              <button
                v-for="preset in (['PREVIOUS_MONTH', 'CURRENT_MONTH', 'LAST_30', 'CURRENT_YEAR', 'ALL'] as PeriodPreset[])"
                :key="preset"
                type="button"
                @click="setPeriodPreset(preset)"
                class="w-full text-left px-3 py-2 rounded-xl text-xs transition-colors flex items-center justify-between cursor-pointer"
                :class="activePeriodPreset === preset ? 'bg-accent/20 text-accent font-semibold' : 'text-white/70 hover:bg-white/5 hover:text-white'"
              >
                <span>{{ periodLabels[preset] }}</span>
                <PhCheck v-if="activePeriodPreset === preset" :size="14" weight="bold" />
              </button>

              <button
                type="button"
                @click="activePeriodPreset = 'CUSTOM'"
                class="w-full text-left px-3 py-2 rounded-xl text-xs transition-colors flex items-center justify-between cursor-pointer"
                :class="activePeriodPreset === 'CUSTOM' ? 'bg-accent/20 text-accent font-semibold' : 'text-white/70 hover:bg-white/5 hover:text-white'"
              >
                <span>Personalizado</span>
                <PhCheck v-if="activePeriodPreset === 'CUSTOM'" :size="14" weight="bold" />
              </button>
            </div>

            <!-- Campos de Data Personalizada -->
            <div v-if="activePeriodPreset === 'CUSTOM'" class="mt-2 pt-2 border-t border-white/5 flex flex-col gap-2">
              <div class="flex items-center gap-2">
                <div class="flex-1">
                  <label class="text-[10px] text-white/50 block mb-1">De:</label>
                  <input
                    v-model="customDateFrom"
                    type="date"
                    class="w-full bg-slate-950/70 border border-white/10 rounded-lg px-2 py-1 text-base md:text-xs text-white focus:outline-none focus:border-accent"
                  />
                </div>
                <div class="flex-1">
                  <label class="text-[10px] text-white/50 block mb-1">Até:</label>
                  <input
                    v-model="customDateTo"
                    type="date"
                    class="w-full bg-slate-950/70 border border-white/10 rounded-lg px-2 py-1 text-base md:text-xs text-white focus:outline-none focus:border-accent"
                  />
                </div>
              </div>
              <button
                type="button"
                @click="applyCustomDates"
                class="w-full py-1.5 bg-accent text-bg font-bold rounded-lg text-xs hover:opacity-90 transition-opacity cursor-pointer mt-1"
              >
                Aplicar Datas
              </button>
            </div>
          </div>
        </div>

        <!-- 4. Botão Limpar Filtros -->
        <button
          v-if="hasActiveFilters"
          type="button"
          @click="resetAllFilters"
          class="flex items-center gap-1.5 px-3 h-9 rounded-xl text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-all cursor-pointer whitespace-nowrap shrink-0 ml-auto"
        >
          <PhArrowsCounterClockwise :size="14" />
          <span>Limpar Filtros</span>
        </button>
      </div>

      <!-- Badges de Filtros Ativos -->
      <div v-if="hasActiveFilters" class="flex items-center gap-1.5 flex-wrap pt-1 text-[11px]">
        <span class="text-white/50 text-[11px]">Filtros ativos:</span>

        <!-- Badge Busca -->
        <span 
          v-if="searchInput" 
          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/80"
        >
          Busca: "{{ searchInput }}"
          <button @click="searchInput = ''" aria-label="Remover busca" class="p-1 -m-1 hover:text-rose-400 cursor-pointer"><PhX :size="12" /></button>
        </span>

        <!-- Badges de Contas Selecionadas -->
        <span 
          v-for="accId in store.filters.accounts" 
          :key="'badge-acc-' + accId"
          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10 border border-accent/30 text-accent"
        >
          {{ getAccountById(accId)?.name || 'Conta' }}
          <button @click="toggleAccountFilter(accId)" aria-label="Remover filtro de conta" class="p-1 -m-1 hover:text-rose-400 cursor-pointer"><PhX :size="12" /></button>
        </span>

        <!-- Badges de Categorias Selecionadas -->
        <span 
          v-for="tagId in store.filters.tags" 
          :key="'badge-tag-' + tagId"
          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/80"
        >
          <span class="w-1.5 h-1.5 rounded-full" :style="{ backgroundColor: getTagById(tagId)?.color || '#10b981' }"></span>
          {{ getTagById(tagId)?.name || 'Categoria' }}
          <button @click="toggleTagFilter(tagId)" aria-label="Remover filtro de categoria" class="p-1 -m-1 hover:text-rose-400 cursor-pointer"><PhX :size="12" /></button>
        </span>

        <!-- Badge de Período -->
        <span 
          v-if="store.filters.date_from || store.filters.date_to"
          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300"
        >
          Período: {{ formatDate(store.filters.date_from) }} - {{ formatDate(store.filters.date_to) }}
          <button @click="setPeriodPreset('ALL')" aria-label="Remover filtro de período" class="p-1 -m-1 hover:text-rose-400 cursor-pointer"><PhX :size="12" /></button>
        </span>
      </div>
    </div>

    <!-- Lista de Transações: Layout Responsivo Mobile-First -->
    <div class="bg-surface rounded-2xl border border-white/5 overflow-hidden shadow-xl min-h-[420px] flex flex-col justify-between">
      <div v-if="store.loading" class="p-12 text-center text-white/50 flex flex-col items-center gap-3">
        <PhCircleNotch class="animate-spin text-accent" :size="32" />
        <span class="text-xs font-medium">Carregando extrato...</span>
      </div>

      <div v-else-if="store.loadError" class="p-12 text-center flex flex-col items-center gap-3" role="alert">
        <PhWarningCircle :size="32" class="text-rose-400" weight="duotone" />
        <span class="text-base font-semibold text-white/80">Não foi possível carregar os lançamentos</span>
        <span class="text-xs text-white/50">Verifique sua conexão e tente novamente.</span>
        <Button size="sm" variant="outline" @click="store.fetchTransactions()">Tentar novamente</Button>
      </div>

      <div v-else-if="store.transactions.length === 0" class="p-12 text-center text-white/50 flex flex-col items-center gap-2">
        <span class="text-base font-semibold text-white/80">Nenhum lançamento encontrado</span>
        <span class="text-xs text-white/50">
          {{ hasActiveFilters ? 'Tente ajustar ou limpar os filtros para ver mais resultados.' : 'Importe um extrato OFX do seu banco ou registre um lançamento manual.' }}
        </span>
        <button
          v-if="hasActiveFilters"
          @click="resetAllFilters"
          class="mt-2 px-3 py-2 text-xs text-accent hover:underline cursor-pointer"
        >
          Limpar todos os filtros
        </button>
        <div v-else class="mt-3 flex flex-wrap justify-center gap-2">
          <Button size="sm" class="gap-1.5" @click="isCreateModalOpen = true">
            <PhPlus :size="15" weight="bold" />
            <span>Novo Lançamento</span>
          </Button>
          <Button size="sm" variant="outline" class="gap-1.5" @click="isImportModalOpen = true">
            <PhUploadSimple :size="15" />
            <span>Importar OFX</span>
          </Button>
        </div>
      </div>

      <div v-else class="overflow-x-auto custom-scrollbar">
        <!-- Versão Mobile (Cards Touch-Friendly) -->
        <div class="flex flex-col divide-y divide-white/5 md:hidden">
          <div 
            v-for="t in store.transactions" 
            :key="t.id"
            class="p-4 flex flex-col gap-2.5 active:bg-white/5 transition-colors cursor-pointer group"
            @click="openTransactionDetails(t)"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-start gap-3 min-w-0 flex-1">
                <div 
                  class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  :class="isCredit(t) ? 'bg-accent/15 text-accent' : 'bg-red-500/15 text-red-400'"
                >
                  <PhArrowUpRight v-if="isCredit(t)" :size="20" weight="bold" />
                  <PhArrowDownRight v-else :size="20" weight="bold" />
                </div>
                <div class="min-w-0 flex-1">
                  <div class="text-sm font-bold text-white truncate group-hover:text-accent transition-colors">{{ t.name || t.memo || 'Sem nome' }}</div>
                  <div class="text-xs text-white/50 truncate">{{ t.memo || getAccountById(t.account_id)?.name || 'Extrato' }}</div>
                </div>
              </div>

              <!-- Valor e Status -->
              <div class="text-right flex-shrink-0">
                <div 
                  class="text-sm font-bold whitespace-nowrap"
                  :class="isCredit(t) ? 'text-accent' : 'text-white'"
                >
                  {{ isCredit(t) ? '+' : '' }}{{ formatCurrency(t.amount) }}
                </div>
                <div class="text-[10px] text-white/50 mt-0.5">
                  {{ formatDate(t.date_posted) }}
                </div>
              </div>
            </div>

            <!-- Rodapé do Card Mobile: Categoria, Conta e Badges -->
            <div class="flex items-center justify-between pt-1" @click.stop>
              <div class="flex items-center gap-1.5 flex-wrap">
                <!-- Seletor de Categoria Principal -->
                <TagCombobox
                  compact
                  placeholder="+ Categoria"
                  :model-value="t.tags?.[0] || null"
                  :secondary-tags="t.tags?.slice(1) || []"
                  allow-secondary-tags
                  @select-category="(tagId) => onCategorySelected(t.id, tagId)"
                  @toggle-secondary-tag="(tagId) => onSecondaryTagToggled(t.id, tagId)"
                />

                <!-- Tags Secundárias -->
                <span
                  v-for="tagId in (t.tags || []).slice(1)"
                  :key="'msec-' + tagId"
                  class="px-2 py-0.5 rounded-full text-[10px] bg-white/5 border border-white/10 text-white/60"
                >
                  #{{ getTagById(tagId)?.name }}
                </span>

                <!-- Badge de Conta -->
                <span class="px-2 py-0.5 rounded-full text-[10px] bg-white/5 border border-white/10 text-white/60">
                  {{ getAccountById(t.account_id)?.name || 'Conta' }}
                </span>

                <!-- Badge de Status Planejado -->
                <span v-if="t.status === 'PLANNED'" class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-400">
                  Prevista
                </span>
                <span v-if="t.status === 'RECONCILED'" class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/15 border border-blue-500/30 text-blue-400">
                  Conciliada
                </span>
              </div>

              <button 
                type="button"
                @click="handleDelete(t.id)"
                class="p-2.5 -m-1 rounded-lg text-white/50 hover:text-red-400 active:text-red-400 transition-colors cursor-pointer"
                title="Excluir"
                aria-label="Excluir lançamento"
              >
                <PhTrash :size="16" />
              </button>
            </div>
          </div>
        </div>

        <!-- Versão Desktop (Tabela de Alta Densidade) -->
        <table class="hidden md:table w-full text-left border-collapse">
          <thead>
            <tr class="bg-white/[0.02] text-xs font-semibold text-white/50 border-b border-white/5">
              <th class="p-4 min-w-[260px]">DESCRIÇÃO</th>
              <th class="p-4 w-[130px]">DATA</th>
              <th class="p-4 min-w-[180px]">CATEGORIA PRINCIPAL</th>
              <th class="p-4 w-[140px]">CONTA</th>
              <th class="p-4 text-right w-[150px]">VALOR</th>
              <th class="p-4 text-center w-[60px]">AÇÕES</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5 text-xs">
            <tr 
              v-for="t in store.transactions" 
              :key="'desk-' + t.id" 
              class="hover:bg-white/[0.03] transition-colors group"
            >
              <td class="p-4 cursor-pointer" @click="openTransactionDetails(t)">
                <div class="flex items-center gap-3">
                  <div 
                    class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    :class="isCredit(t) ? 'bg-accent/15 text-accent' : 'bg-red-500/15 text-red-400'"
                  >
                    <PhArrowUpRight v-if="isCredit(t)" :size="18" weight="bold" />
                    <PhArrowDownRight v-else :size="18" weight="bold" />
                  </div>
                  <div class="min-w-0 max-w-sm">
                    <div class="font-bold text-white truncate hover:text-accent transition-colors" :title="t.name || t.memo">{{ t.name || t.memo || 'Sem nome' }}</div>
                    <div class="text-[11px] text-white/50 truncate" :title="t.memo">{{ t.memo || 'Sem observações' }}</div>
                  </div>
                </div>
              </td>

              <td class="p-4 text-white/70 whitespace-nowrap">
                <div class="flex items-center gap-1.5">
                  <PhCalendarBlank :size="14" class="text-white/50" />
                  <span>{{ formatDate(t.date_posted) }}</span>
                </div>
              </td>

              <td class="p-4">
                <!-- Seletor de Categoria Desktop -->
                <div class="flex items-center gap-1.5 flex-wrap">
                  <TagCombobox
                    compact
                    placeholder="+ Categoria"
                    :model-value="t.tags?.[0] || null"
                    :secondary-tags="t.tags?.slice(1) || []"
                    allow-secondary-tags
                    @select-category="(tagId) => onCategorySelected(t.id, tagId)"
                    @toggle-secondary-tag="(tagId) => onSecondaryTagToggled(t.id, tagId)"
                  />

                  <!-- Tags Secundárias -->
                  <span 
                    v-for="tagId in (t.tags || []).slice(1)" 
                    :key="'sec-' + tagId"
                    class="px-2 py-0.5 rounded-full text-[10px] bg-white/5 border border-white/10 text-white/60"
                  >
                    #{{ getTagById(tagId)?.name }}
                  </span>
                </div>
              </td>

              <td class="p-4 text-white/60 whitespace-nowrap">
                <span class="truncate">{{ getAccountById(t.account_id)?.name || 'Conta' }}</span>
              </td>

              <td class="p-4 text-right font-bold whitespace-nowrap" :class="isCredit(t) ? 'text-accent' : 'text-white'">
                <div>{{ isCredit(t) ? '+' : '' }}{{ formatCurrency(t.amount) }}</div>
                <div v-if="t.status === 'PLANNED'" class="text-[10px] text-amber-400 font-medium">Prevista</div>
                <div v-else-if="t.status === 'RECONCILED'" class="text-[10px] text-blue-400 font-medium">Conciliada</div>
              </td>

              <td class="p-4 text-center" @click.stop>
                <div class="flex items-center justify-center gap-1">
                  <button
                    type="button"
                    @click="openTransactionDetails(t)"
                    class="p-1.5 rounded-lg text-white/50 hover:text-accent hover:bg-accent/10 transition-colors cursor-pointer"
                    title="Ver detalhes / Editar"
                    aria-label="Ver detalhes e editar"
                  >
                    <PhPencilSimple :size="15" />
                  </button>
                  <button
                    type="button"
                    @click="handleDelete(t.id)"
                    class="p-1.5 rounded-lg text-white/50 hover:text-red-400 hover:bg-red-400/10 transition-colors cursor-pointer"
                    title="Excluir"
                    aria-label="Excluir lançamento"
                  >
                    <PhTrash :size="15" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Paginação -->
        <div v-if="store.pagination.totalPages > 1" class="p-4 border-t border-white/5 flex items-center justify-between text-xs">
          <span class="text-white/50">
            Página {{ store.pagination.page }} de {{ store.pagination.totalPages }} ({{ store.pagination.total }} itens)
          </span>
          <div class="flex gap-2">
            <button
              :disabled="store.pagination.page === 1"
              @click="goToPage(store.pagination.page - 1)"
              class="px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-40 transition-colors cursor-pointer font-semibold"
            >
              Anterior
            </button>
            <button
              :disabled="store.pagination.page === store.pagination.totalPages"
              @click="goToPage(store.pagination.page + 1)"
              class="px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-40 transition-colors cursor-pointer font-semibold"
            >
              Próxima
            </button>
          </div>
        </div>
      </div>
    </div>



    <!-- Banner Flutuante de Propagação para Transações Parecidas -->
    <SimilarTagPrompt
      v-if="similarPrompt"
      :merchant-pattern="similarPrompt.merchantPattern"
      :category-name="similarPrompt.categoryName"
      :category-color="similarPrompt.categoryColor"
      :loading="similarPrompt.loading"
      @apply-all="handleApplySimilar"
      @dismiss="similarPrompt = null"
    />

    <!-- Modal de Reclassificação com IA -->
    <AIReclassifyModal
      :is-open="isAIModalOpen"
      :loading="isAIModalLoading"
      :result-count="aiResultCount"
      @confirm="handleConfirmAI"
      @close="closeAIModal"
    />

    <!-- Modais Globais de Lançamento e Importação -->
    <CreateTransactionModal
      :is-open="isCreateModalOpen"
      @close="isCreateModalOpen = false"
      @created="store.fetchTransactions()"
    />

    <ImportOFXModal
      :is-open="isImportModalOpen"
      @close="isImportModalOpen = false"
      @imported="store.fetchTransactions()"
    />

    <!-- Modal de Detalhes e Edição da Transação (Mobile & Desktop) -->
    <TransactionDetailsModal
      :is-open="isDetailsModalOpen"
      :transaction="selectedTxForDetails"
      @close="closeTransactionDetails"
      @updated="onTransactionUpdated"
      @deleted="onTransactionDeleted"
    />
  </div>
</template>

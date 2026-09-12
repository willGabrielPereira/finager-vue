<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useTransactionsStore } from '../stores/transactions'
import { useTagsStore } from '../stores/tags'
import { useAccountsStore } from '../stores/accounts'
import CategoryCombobox from '../components/ui/CategoryCombobox.vue'
import SimilarTagPrompt from '../components/ui/SimilarTagPrompt.vue'
import AIReclassifyModal from '../components/ui/AIReclassifyModal.vue'
import CreateTransactionModal from '../components/ui/CreateTransactionModal.vue'
import ImportOFXModal from '../components/ui/ImportOFXModal.vue'
import { 
  PhArrowDownRight, 
  PhArrowUpRight, 
  PhCalendarBlank, 
  PhCaretDown, 
  PhPlus, 
  PhCircleNotch,
  PhSparkle,
  PhUploadSimple,
  PhTrash,
  PhMagnifyingGlass
} from '@phosphor-icons/vue'

const store = useTransactionsStore()
const tagsStore = useTagsStore()
const accountsStore = useAccountsStore()

// Estado do Seletor de Categoria
const activeDropdownTxId = ref<string | null>(null)
const updatingTxId = ref<string | null>(null)
const dropdownPosition = ref({ left: '0px', top: '0px' })

// Modais e Prompts
const isAIModalOpen = ref(false)
const isAIModalLoading = ref(false)
const aiResultCount = ref<number | null>(null)

const isCreateModalOpen = ref(false)
const isImportModalOpen = ref(false)

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

onMounted(async () => {
  await Promise.all([
    store.fetchTransactions(),
    tagsStore.fetchTags(),
    tagsStore.fetchFrequentTags(60, 6),
    accountsStore.fetchAccounts()
  ])
  window.addEventListener('click', closeDropdown)
})

onUnmounted(() => {
  window.removeEventListener('click', closeDropdown)
})

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
    store.filters.status = ''
  } else if (tab === 'DEBIT') {
    store.filters.type = 'DEBIT'
    store.filters.status = ''
  } else if (tab === 'CREDIT') {
    store.filters.type = 'CREDIT'
    store.filters.status = ''
  } else if (tab === 'PLANNED') {
    store.filters.type = ''
    store.filters.status = 'PLANNED'
  }

  store.fetchTransactions()
}

const getTagById = (id: string) => {
  return tagsStore.tags.find((t) => t.id === id)
}

const getAccountById = (id: string) => {
  return accountsStore.accounts.find((a) => a.id === id)
}

const toggleDropdown = (txId: string, event: Event) => {
  event.stopPropagation()
  if (activeDropdownTxId.value === txId) {
    activeDropdownTxId.value = null
  } else {
    activeDropdownTxId.value = txId

    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
    const scrollTop = window.scrollY || document.documentElement.scrollTop
    const scrollLeft = window.scrollX || document.documentElement.scrollLeft

    const dropdownHeight = 320
    const windowHeight = window.innerHeight
    const opensUpward = rect.bottom + dropdownHeight > windowHeight && rect.top - dropdownHeight > 0

    dropdownPosition.value = {
      left: Math.min(rect.left + scrollLeft, window.innerWidth - 340) + 'px',
      top: (opensUpward 
        ? (rect.top + scrollTop - dropdownHeight - 6) 
        : (rect.bottom + scrollTop + 6)) + 'px',
    }
  }
}

const closeDropdown = () => {
  activeDropdownTxId.value = null
}

const onCategorySelected = async (txId: string, tagId: string | null) => {
  closeDropdown()
  updatingTxId.value = txId

  const tx = store.transactions.find((t) => t.id === txId)
  if (!tx) return

  const originalTags = [...(tx.tags || [])]
  const newTags = tagId ? [tagId, ...originalTags.slice(1)] : []

  try {
    await store.updateTags(txId, newTags)

    // Se selecionou uma categoria válida, ativa o prompt de propagação para similares
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
  }
}

const handleApplySimilar = async () => {
  if (!similarPrompt.value) return

  similarPrompt.value.loading = true
  try {
    const res = await store.applySimilar(similarPrompt.value.txId, false)
    similarPrompt.value = null
    alert('Sucesso! A categoria foi aplicada a ' + (res?.updated_count ?? 0) + ' transações semelhantes.')
  } catch (err: any) {
    console.error('Falha ao propagar tags:', err)
    alert(err.response?.data?.message || 'Falha ao propagar tags.')
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
    alert(err.response?.data?.message || 'Falha ao rodar classificação com IA.')
  } finally {
    isAIModalLoading.value = false
  }
}

const closeAIModal = () => {
  isAIModalOpen.value = false
  aiResultCount.value = null
}

const handleDelete = async (txId: string) => {
  if (!confirm('Deseja realmente excluir este lançamento?')) return
  try {
    await store.deleteTransaction(txId)
  } catch (err) {
    console.error('Falha ao deletar:', err)
    alert('Erro ao excluir transação.')
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
</script>

<template>
  <div class="flex flex-col gap-5">
    <!-- Barra Superior: Título e Botões de Ação -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div>
        <h1 class="text-xl md:text-2xl font-bold tracking-tight">Extrato & Transações</h1>
        <p class="text-xs text-white/50">Gerencie seus lançamentos bancários, manuais e faturas</p>
      </div>

      <div class="flex items-center gap-2 flex-wrap">
        <button 
          @click="isAIModalOpen = true"
          class="flex items-center gap-1.5 border border-accent/40 bg-accent/10 hover:bg-accent/20 text-accent px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
        >
          <PhSparkle :size="16" weight="fill" />
          <span>Classificar com IA</span>
        </button>

        <button 
          @click="isImportModalOpen = true" 
          class="hidden md:flex items-center gap-1.5 border border-white/10 bg-white/5 hover:bg-white/10 text-white px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer"
        >
          <PhUploadSimple :size="16" />
          <span>Importar OFX</span>
        </button>

        <button 
          @click="isCreateModalOpen = true" 
          class="flex items-center gap-1.5 bg-accent text-bg px-4 py-2 rounded-xl text-xs font-bold hover:opacity-90 transition-all cursor-pointer shadow-lg shadow-accent/20 hover:scale-105 active:scale-95"
        >
          <PhPlus :size="16" weight="bold" />
          <span>Novo Lançamento</span>
        </button>
      </div>
    </div>

    <!-- Barra de Filtros e Busca Rápida -->
    <div class="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-surface p-3 rounded-2xl border border-white/5">
      <!-- Chips de Filtro Rápido -->
      <div class="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scroll-smooth no-scrollbar">
        <button
          type="button"
          @click="setFilterTab('ALL')"
          class="px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer"
          :class="activeFilterTab === 'ALL' ? 'bg-accent/20 text-accent border border-accent/40' : 'text-white/60 hover:text-white hover:bg-white/5'"
        >
          Todas
        </button>
        <button
          type="button"
          @click="setFilterTab('DEBIT')"
          class="px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer"
          :class="activeFilterTab === 'DEBIT' ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'text-white/60 hover:text-white hover:bg-white/5'"
        >
          Despesas
        </button>
        <button
          type="button"
          @click="setFilterTab('CREDIT')"
          class="px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer"
          :class="activeFilterTab === 'CREDIT' ? 'bg-accent/20 text-accent border border-accent/40' : 'text-white/60 hover:text-white hover:bg-white/5'"
        >
          Receitas
        </button>
        <button
          type="button"
          @click="setFilterTab('PLANNED')"
          class="px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer"
          :class="activeFilterTab === 'PLANNED' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'text-white/60 hover:text-white hover:bg-white/5'"
        >
          Previstas / Planejadas
        </button>
      </div>

      <!-- Campo de Busca por Digitação -->
      <div class="relative min-w-[240px]">
        <PhMagnifyingGlass class="absolute left-3 top-2.5 text-white/40" :size="16" />
        <input
          v-model="searchInput"
          type="text"
          placeholder="Buscar estabelecimento, memo..."
          class="w-full bg-slate-950/80 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-accent focus:bg-slate-950 transition-colors"
        />
      </div>
    </div>

    <!-- Lista de Transações: Layout Responsivo Mobile-First -->
    <div class="bg-surface rounded-2xl border border-white/5 overflow-hidden shadow-xl">
      <div v-if="store.loading" class="p-12 text-center text-white/50 flex flex-col items-center gap-3">
        <PhCircleNotch class="animate-spin text-accent" :size="32" />
        <span class="text-xs font-medium">Carregando extrato...</span>
      </div>

      <div v-else-if="store.transactions.length === 0" class="p-12 text-center text-white/50 flex flex-col items-center gap-2">
        <span class="text-base font-semibold text-white/80">Nenhum lançamento localizado</span>
        <span class="text-xs text-white/40">Importe um arquivo OFX ou crie um lançamento manual acima.</span>
      </div>

      <div v-else>
        <!-- Versão Mobile (Cards Touch-Friendly) -->
        <div class="flex flex-col divide-y divide-white/5 md:hidden">
          <div 
            v-for="t in store.transactions" 
            :key="t.id"
            class="p-4 flex flex-col gap-2.5 active:bg-white/5 transition-colors"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-start gap-3 min-w-0">
                <div 
                  class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  :class="t.type === 'CREDIT' ? 'bg-accent/15 text-accent' : 'bg-red-500/15 text-red-400'"
                >
                  <PhArrowUpRight v-if="t.type === 'CREDIT'" :size="20" weight="bold" />
                  <PhArrowDownRight v-else :size="20" weight="bold" />
                </div>
                <div class="min-w-0 flex-1">
                  <div class="text-sm font-bold text-white truncate">{{ t.name || 'Sem nome' }}</div>
                  <div class="text-xs text-white/40 truncate">{{ t.memo || getAccountById(t.account_id)?.name || 'Extrato' }}</div>
                </div>
              </div>

              <!-- Valor e Status -->
              <div class="text-right flex-shrink-0">
                <div 
                  class="text-sm font-bold whitespace-nowrap"
                  :class="t.type === 'CREDIT' ? 'text-accent' : 'text-white'"
                >
                  {{ t.type === 'CREDIT' ? '+' : '' }}{{ formatCurrency(t.amount) }}
                </div>
                <div class="text-[10px] text-white/40 mt-0.5">
                  {{ formatDate(t.date_posted) }}
                </div>
              </div>
            </div>

            <!-- Rodapé do Card Mobile: Categoria e Badges -->
            <div class="flex items-center justify-between pt-1">
              <div class="flex items-center gap-1.5 flex-wrap">
                <!-- Seletor de Categoria Principal -->
                <button
                  type="button"
                  @click="toggleDropdown(t.id, $event)"
                  class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer active:scale-95"
                  :style="t.tags && t.tags.length > 0 && getTagById(t.tags[0]) ? {
                    backgroundColor: (getTagById(t.tags[0])?.color || '#10b981') + '18',
                    borderColor: (getTagById(t.tags[0])?.color || '#10b981') + '40',
                    color: getTagById(t.tags[0])?.color || '#10b981',
                  } : {
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    borderColor: 'rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.5)',
                  }"
                >
                  <span 
                    v-if="t.tags && t.tags.length > 0 && getTagById(t.tags[0])"
                    class="w-2 h-2 rounded-full" 
                    :style="{ backgroundColor: getTagById(t.tags[0])?.color }"
                  ></span>
                  <span>{{ t.tags && t.tags.length > 0 && getTagById(t.tags[0]) ? getTagById(t.tags[0])?.name : '+ Categoria' }}</span>
                  <PhCaretDown :size="12" class="opacity-50" />
                </button>

                <!-- Badge de Status Planejado -->
                <span v-if="t.status === 'PLANNED'" class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-400">
                  Planejada
                </span>
                <span v-if="t.status === 'RECONCILED'" class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/15 border border-blue-500/30 text-blue-400">
                  Conciliada
                </span>
              </div>

              <button 
                type="button"
                @click="handleDelete(t.id)" 
                class="p-1.5 rounded-lg text-white/30 hover:text-red-400 active:text-red-400 transition-colors cursor-pointer"
                title="Excluir"
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
              <th class="p-4 min-w-[260px]">ESTABELECIMENTO / MEMO</th>
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
              <td class="p-4">
                <div class="flex items-center gap-3">
                  <div 
                    class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    :class="t.type === 'CREDIT' ? 'bg-accent/15 text-accent' : 'bg-red-500/15 text-red-400'"
                  >
                    <PhArrowUpRight v-if="t.type === 'CREDIT'" :size="18" weight="bold" />
                    <PhArrowDownRight v-else :size="18" weight="bold" />
                  </div>
                  <div class="min-w-0 max-w-sm">
                    <div class="font-bold text-white truncate" :title="t.name">{{ t.name || 'Sem nome' }}</div>
                    <div class="text-[11px] text-white/40 truncate" :title="t.memo">{{ t.memo || 'Sem observações' }}</div>
                  </div>
                </div>
              </td>

              <td class="p-4 text-white/70 whitespace-nowrap">
                <div class="flex items-center gap-1.5">
                  <PhCalendarBlank :size="14" class="text-white/40" />
                  <span>{{ formatDate(t.date_posted) }}</span>
                </div>
              </td>

              <td class="p-4">
                <!-- Seletor de Categoria Desktop -->
                <div class="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    @click="toggleDropdown(t.id, $event)"
                    class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer hover:brightness-110 active:scale-95"
                    :style="t.tags && t.tags.length > 0 && getTagById(t.tags[0]) ? {
                      backgroundColor: (getTagById(t.tags[0])?.color || '#10b981') + '18',
                      borderColor: (getTagById(t.tags[0])?.color || '#10b981') + '40',
                      color: getTagById(t.tags[0])?.color || '#10b981',
                    } : {
                      backgroundColor: 'rgba(255,255,255,0.03)',
                      borderColor: 'rgba(255,255,255,0.1)',
                      color: 'rgba(255,255,255,0.4)',
                    }"
                  >
                    <span 
                      v-if="t.tags && t.tags.length > 0 && getTagById(t.tags[0])"
                      class="w-2 h-2 rounded-full" 
                      :style="{ backgroundColor: getTagById(t.tags[0])?.color }"
                    ></span>
                    <span>{{ t.tags && t.tags.length > 0 && getTagById(t.tags[0]) ? getTagById(t.tags[0])?.name : '+ Categoria' }}</span>
                    <PhCaretDown :size="12" class="opacity-50" />
                  </button>

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

              <td class="p-4 text-right font-bold whitespace-nowrap" :class="t.type === 'CREDIT' ? 'text-accent' : 'text-white'">
                <div>{{ t.type === 'CREDIT' ? '+' : '' }}{{ formatCurrency(t.amount) }}</div>
                <div v-if="t.status === 'PLANNED'" class="text-[10px] text-amber-400 font-medium">Prevista</div>
                <div v-else-if="t.status === 'RECONCILED'" class="text-[10px] text-blue-400 font-medium">Conciliada</div>
              </td>

              <td class="p-4 text-center">
                <button
                  type="button"
                  @click="handleDelete(t.id)"
                  class="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-colors cursor-pointer"
                  title="Excluir"
                >
                  <PhTrash :size="16" />
                </button>
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
              @click="store.fetchTransactions({ page: store.pagination.page - 1 })"
              class="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-40 transition-colors cursor-pointer font-semibold"
            >
              Anterior
            </button>
            <button
              :disabled="store.pagination.page === store.pagination.totalPages"
              @click="store.fetchTransactions({ page: store.pagination.page + 1 })"
              class="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-40 transition-colors cursor-pointer font-semibold"
            >
              Próxima
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Dropdown Teleportado do Seletor de Categoria com Mais Usadas e Busca -->
    <Teleport to="body">
      <div 
        v-if="activeDropdownTxId" 
        :style="{
          position: 'absolute',
          left: dropdownPosition.left,
          top: dropdownPosition.top,
          zIndex: 10005,
        }"
        @click.stop
      >
        <CategoryCombobox
          :category-id="store.transactions.find(t => t.id === activeDropdownTxId)?.tags?.[0] || null"
          :secondary-tags="store.transactions.find(t => t.id === activeDropdownTxId)?.tags?.slice(1) || []"
          @select-category="(tagId) => onCategorySelected(activeDropdownTxId!, tagId)"
          @toggle-secondary-tag="(tagId) => onSecondaryTagToggled(activeDropdownTxId!, tagId)"
          @close="closeDropdown"
        />
      </div>
    </Teleport>

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
  </div>
</template>

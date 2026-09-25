<script setup lang="ts">
import { ref, computed, watch, onMounted, markRaw } from 'vue'
import { type Transaction, useTransactionsStore } from '../../stores/transactions'
import { useAccountsStore } from '../../stores/accounts'
import { useTagsStore } from '../../stores/tags'
import AppSelect, { type AppSelectOption } from './AppSelect.vue'
import CurrencyInput from './CurrencyInput.vue'
import { TagCombobox } from './tag-combobox'
import { Button } from './button'
import { Input } from './input'
import { DatePicker } from './date-picker'
import { toast, showAlert } from '../../utils/feedback'
import { useEscapeKey } from '@/composables/useEscapeKey'
import { positiveAmountSchema } from '@/validation/schemas'
import { 
  PhX, 
  PhArrowUpRight, 
  PhArrowDownRight, 
  PhTrash, 
  PhFloppyDisk, 
  PhCircleNotch, 
  PhBank, 
  PhCreditCard, 
  PhInfo
} from '@phosphor-icons/vue'

const props = defineProps<{
  isOpen: boolean
  transaction: Transaction | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'updated', tx: Transaction): void
  (e: 'deleted', txId: string): void
}>()

const accountsStore = useAccountsStore()
const tagsStore = useTagsStore()
const txStore = useTransactionsStore()

// Form state
const type = ref<'DEBIT' | 'CREDIT'>('DEBIT')
const amount = ref<number | ''>('')
const name = ref('')
const memo = ref('')
const accountId = ref('')
const selectedTagId = ref('')
const datePosted = ref('')
const status = ref<'POSTED' | 'PLANNED' | 'PENDING_RECONCILIATION' | 'RECONCILED'>('POSTED')

const loading = ref(false)
const deleteLoading = ref(false)
const errorMessage = ref('')

useEscapeKey(() => props.isOpen && !!props.transaction, () => emit('close'))

// Gesto de fechar no mobile (drag-to-dismiss)
const translateY = ref(0)
const isDragging = ref(false)
let startY = 0

const onTouchStart = (e: TouchEvent) => {
  if (window.innerWidth >= 640) return
  startY = e.touches[0].clientY
  isDragging.value = true
}

const onTouchMove = (e: TouchEvent) => {
  if (!isDragging.value) return
  const currentY = e.touches[0].clientY
  const deltaY = currentY - startY
  if (deltaY > 0) {
    translateY.value = deltaY
    if (e.cancelable) e.preventDefault()
  } else {
    translateY.value = 0
  }
}

const onTouchEnd = () => {
  if (!isDragging.value) return
  isDragging.value = false
  if (translateY.value > 80) {
    emit('close')
  }
  translateY.value = 0
}

onMounted(() => {
  if (tagsStore.tags.length === 0) {
    tagsStore.fetchTags()
  }
  if (accountsStore.accounts.length === 0) {
    accountsStore.fetchAccounts()
  }
})

// Preenche o formulário quando a transação mudar
watch(
  () => props.transaction,
  (tx) => {
    if (tx) {
      type.value = tx.type
      amount.value = Math.abs(tx.amount)
      name.value = tx.name || ''
      memo.value = tx.memo || ''
      accountId.value = tx.account_id || ''
      selectedTagId.value = tx.tags && tx.tags.length > 0 ? tx.tags[0] : ''
      status.value = tx.status || 'POSTED'
      
      if (tx.date_posted) {
        datePosted.value = tx.date_posted.split('T')[0]
      } else {
        datePosted.value = new Date().toISOString().split('T')[0]
      }

      errorMessage.value = ''
      translateY.value = 0
    }
  },
  { immediate: true }
)

const accountOptions = computed<AppSelectOption[]>(() => {
  return accountsStore.accounts.map(acc => ({
    value: acc.id,
    label: acc.name,
    sublabel: acc.institution,
    badge: acc.type === 'CREDIT_CARD' ? 'Cartão' : 'Conta',
    icon: markRaw(acc.type === 'CREDIT_CARD' ? PhCreditCard : PhBank)
  }))
})

const formatDatePretty = (isoStr: string) => {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  return d.toLocaleDateString('pt-BR', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const handleSave = async () => {
  if (!props.transaction) return
  const amountCheck = positiveAmountSchema.safeParse(amount.value)
  if (!amountCheck.success) {
    errorMessage.value = amountCheck.error.issues[0].message
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const finalAmount = type.value === 'DEBIT' ? -Math.abs(amountCheck.data) : Math.abs(amountCheck.data)
    const tagsArray = selectedTagId.value ? [selectedTagId.value] : []

    const payload: Record<string, any> = {
      name: name.value.trim(),
      memo: memo.value.trim(),
      type: type.value,
      amount: finalAmount,
      account_id: accountId.value,
      tags: tagsArray,
      status: status.value,
      date_posted: new Date(datePosted.value + 'T12:00:00Z').toISOString(),
    }

    const updated = await txStore.updateTransaction(props.transaction.id, payload)
    toast.success('Alterações salvas.')
    emit('updated', updated || { ...props.transaction, ...payload })
    emit('close')
  } catch (err: any) {
    console.error('Falha ao salvar detalhes:', err)
    errorMessage.value = err.response?.data?.message || err.response?.data?.error || 'Erro ao salvar alterações da transação.'
  } finally {
    loading.value = false
  }
}

const handleDelete = async () => {
  if (!props.transaction) return
  const confirmed = await showAlert.confirm({
    title: 'Excluir transação?',
    text: 'Esta ação não poderá ser desfeita.',
    confirmText: 'Sim, excluir',
    cancelText: 'Cancelar',
    isDestructive: true,
  })
  if (!confirmed) return

  deleteLoading.value = true
  try {
    await txStore.deleteTransaction(props.transaction.id)
    toast.success('Transação excluída com sucesso.')
    emit('deleted', props.transaction.id)
    emit('close')
  } catch (err: any) {
    console.error('Erro ao excluir:', err)
    toast.error('Erro ao excluir', err.response?.data?.message || 'Falha ao excluir transação.')
  } finally {
    deleteLoading.value = false
  }
}
</script>

<template>
  <div 
    v-if="isOpen && transaction"
    class="fixed inset-0 z-[10002] bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center sm:justify-center p-0 sm:p-4 animate-in fade-in duration-200 overflow-y-auto overscroll-contain"
    @click="emit('close')"
  >
    <div 
      class="w-full sm:max-w-lg bg-surface border border-white/10 rounded-t-3xl sm:rounded-2xl max-h-[92dvh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 text-white my-0 sm:my-auto overscroll-contain will-change-transform"
      :style="{
        transform: translateY > 0 ? `translateY(${translateY}px)` : undefined,
        transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
      }"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tx-details-title"
      @click.stop
    >
      <!-- Barra Mobile Drag indicator com suporte a arrastar para fechar -->
      <div 
        class="w-full pt-3 pb-1 cursor-grab active:cursor-grabbing sm:hidden touch-none flex justify-center"
        @touchstart="onTouchStart"
        @touchmove="onTouchMove"
        @touchend="onTouchEnd"
      >
        <div class="w-12 h-1.5 bg-white/25 hover:bg-white/40 rounded-full transition-colors"></div>
      </div>

      <!-- Cabeçalho (arrastável no mobile) -->
      <div 
        class="px-5 py-3.5 border-b border-white/10 flex items-center justify-between shrink-0 touch-none sm:touch-auto select-none"
        @touchstart="onTouchStart"
        @touchmove="onTouchMove"
        @touchend="onTouchEnd"
      >
        <div class="flex items-center gap-2.5 min-w-0">
          <div 
            class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            :class="type === 'CREDIT' ? 'bg-accent/15 text-accent' : 'bg-red-500/15 text-red-400'"
          >
            <PhArrowUpRight v-if="type === 'CREDIT'" :size="18" weight="bold" />
            <PhArrowDownRight v-else :size="18" weight="bold" />
          </div>
          <div class="min-w-0">
            <h2 id="tx-details-title" class="text-sm sm:text-base font-bold text-white truncate">Detalhes da Transação</h2>
            <p class="text-[11px] text-white/50 truncate">Veja e edite as informações</p>
          </div>
        </div>

        <button 
          type="button"
          @click="emit('close')" 
          class="text-white/50 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          title="Fechar"
          aria-label="Fechar"
        >
          <PhX :size="18" />
        </button>
      </div>

      <!-- Corpo Rolável com Todas as Informações Completas -->
      <div class="px-5 py-4 overflow-y-auto flex-1 flex flex-col gap-4">
        <!-- Mensagem de Erro -->
        <div v-if="errorMessage" role="alert" class="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          {{ errorMessage }}
        </div>

        <!-- Seletor Tipo: Despesa vs Receita -->
        <div class="grid grid-cols-2 gap-2 bg-white/5 p-1 rounded-xl">
          <button
            type="button"
            @click="type = 'DEBIT'"
            class="py-2 text-xs font-bold rounded-lg transition-all cursor-pointer text-center"
            :class="type === 'DEBIT' ? 'bg-red-500/20 text-red-400 shadow-sm border border-red-500/30' : 'text-white/50 hover:text-white'"
          >
            - Despesa (Saída)
          </button>
          <button
            type="button"
            @click="type = 'CREDIT'"
            class="py-2 text-xs font-bold rounded-lg transition-all cursor-pointer text-center"
            :class="type === 'CREDIT' ? 'bg-accent/20 text-accent shadow-sm border border-accent/30' : 'text-white/50 hover:text-white'"
          >
            + Receita (Entrada)
          </button>
        </div>

        <!-- Campo: Valor com Máscara Monetária -->
        <div class="flex flex-col gap-1">
          <label for="tx-details-amount" class="text-xs font-semibold text-white/70">Valor</label>
          <CurrencyInput
            id="tx-details-amount"
            v-model="amount"
            placeholder="0,00"
          />
        </div>

        <!-- Campo: Nome / Descrição Completa -->
        <div class="flex flex-col gap-1">
          <label for="tx-details-name" class="text-xs font-semibold text-white/70">Descrição</label>
          <Input
            id="tx-details-name"
            v-model="name"
            type="text"
            placeholder="Nome ou descrição do lançamento"
            class="bg-slate-950 border-white/10"
          />
        </div>

        <!-- Campo: Estabelecimento / Memo / Detalhes OFX Completos -->
        <div class="flex flex-col gap-1">
          <label for="tx-details-memo" class="text-xs font-semibold text-white/70">Observação</label>
          <textarea
            id="tx-details-memo"
            v-model="memo"
            rows="2"
            placeholder="Texto do banco ou anotação sua"
            class="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-white placeholder-white/30 focus:outline-none focus:border-accent transition-colors resize-none"
          ></textarea>
        </div>

        <!-- Grid: Conta, Categoria e Data -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div class="flex flex-col gap-1">
            <label class="text-xs font-semibold text-white/70">Conta</label>
            <AppSelect
              v-model="accountId"
              :options="accountOptions"
              placeholder="Selecione..."
              size="sm"
              :teleport="true"
            />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-xs font-semibold text-white/70">Categoria</label>
            <TagCombobox
              v-model="selectedTagId"
              placeholder="Sem Categoria"
              size="sm"
            />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-xs font-semibold text-white/70">Data</label>
            <DatePicker
              v-model="datePosted"
              class="bg-[#0b1329] border-white/10 h-9 text-xs"
            />
          </div>
        </div>

        <!-- Seletor de Status -->
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold text-white/70">Situação</label>
          <div class="grid grid-cols-3 gap-2 bg-white/5 p-1 rounded-xl text-xs">
            <button
              type="button"
              @click="status = 'POSTED'"
              class="py-2 px-2 rounded-lg font-medium transition-all text-center cursor-pointer"
              :class="status === 'POSTED' ? 'bg-white/15 text-white font-bold' : 'text-white/50 hover:text-white'"
            >
              Efetivada
            </button>
            <button
              type="button"
              @click="status = 'PLANNED'"
              class="py-2 px-2 rounded-lg font-medium transition-all text-center cursor-pointer"
              :class="status === 'PLANNED' ? 'bg-amber-500/20 text-amber-400 font-bold' : 'text-white/50 hover:text-white'"
            >
              Prevista
            </button>
            <button
              type="button"
              @click="status = 'RECONCILED'"
              class="py-2 px-2 rounded-lg font-medium transition-all text-center cursor-pointer"
              :class="status === 'RECONCILED' ? 'bg-blue-500/20 text-blue-400 font-bold' : 'text-white/50 hover:text-white'"
            >
              Conciliada
            </button>
          </div>
        </div>

        <!-- Card de Metadados / Auditoria do Banco (Somente Leitura) -->
        <div class="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col gap-2 text-[11px] text-white/50">
          <div class="flex items-center gap-1.5 font-semibold text-white/60">
            <PhInfo :size="13" class="text-accent" />
            <span>Informações de Origem e Sistema</span>
          </div>

          <div class="grid grid-cols-2 gap-2 pt-1 border-t border-white/5">
            <div>
              <span class="block text-white/50 text-[10px]">Origem:</span>
              <span class="font-medium text-white/70">{{ transaction.source || 'OFX / Importado' }}</span>
            </div>
            <div>
              <span class="block text-white/50 text-[10px]">Classificação:</span>
              <span class="font-medium text-white/70">{{ transaction.manually_tagged ? 'Manual' : 'Automática (IA/Regra)' }}</span>
            </div>
            <div v-if="transaction.fitid" class="col-span-2">
              <span class="block text-white/50 text-[10px]">Identificador Bancário (FITID):</span>
              <span class="font-mono text-[10px] text-white/60 break-all select-all">{{ transaction.fitid }}</span>
            </div>
            <div v-if="transaction.imported_at" class="col-span-2">
              <span class="block text-white/50 text-[10px]">Importado em:</span>
              <span class="text-white/60">{{ formatDatePretty(transaction.imported_at) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Rodapé Fixo de Ações -->
      <div class="px-5 py-3.5 border-t border-white/10 bg-surface flex items-center justify-between shrink-0 gap-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          @click="handleDelete"
          :disabled="deleteLoading"
          class="text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20"
        >
          <PhTrash :size="15" class="mr-1.5" />
          <span>Excluir</span>
        </Button>

        <div class="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            @click="emit('close')"
          >
            Cancelar
          </Button>

          <Button
            type="button"
            size="sm"
            @click="handleSave"
            :disabled="loading"
            class="bg-accent text-bg hover:bg-accent/90 font-bold shadow-md shadow-accent/20"
          >
            <PhCircleNotch v-if="loading" :size="14" class="animate-spin mr-1.5" />
            <PhFloppyDisk v-else :size="14" weight="bold" class="mr-1.5" />
            <span>{{ loading ? 'Salvando...' : 'Salvar Alterações' }}</span>
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

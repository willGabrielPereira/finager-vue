<script setup lang="ts">
import { ref, computed, onMounted, markRaw } from 'vue'
import { useEscapeKey } from '@/composables/useEscapeKey'
import { positiveAmountSchema } from '@/validation/schemas'
import { toast } from '@/utils/feedback'
import AppSelect, { type AppSelectOption } from './AppSelect.vue'
import CurrencyInput from './CurrencyInput.vue'
import { TagCombobox } from './tag-combobox'
import { Button } from './button'
import { Input } from './input'
import { DatePicker } from './date-picker'
import { PhBank, PhCreditCard, PhX, PhPlus, PhCircleNotch, PhCheck, PhClock } from '@phosphor-icons/vue'
import { useAccountsStore } from '../../stores/accounts'
import { useTagsStore } from '../../stores/tags'
import { useTransactionsStore } from '../../stores/transactions'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'created'): void
}>()

const accountsStore = useAccountsStore()
const tagsStore = useTagsStore()
const txStore = useTransactionsStore()

const type = ref<'DEBIT' | 'CREDIT'>('DEBIT')
const status = ref<'POSTED' | 'PLANNED'>('POSTED')
const amount = ref<number | ''>('')
const name = ref('')
const memo = ref('')
const accountId = ref('')
const selectedTagId = ref('')
// Data local (toISOString usaria UTC e viraria "amanhã" após 21h no Brasil)
const todayLocal = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const datePosted = ref(todayLocal())
const loading = ref(false)
const errorMessage = ref('')

const isDirty = computed(() => Boolean(amount.value || name.value.trim() || memo.value.trim()))

// Clique no fundo só fecha se não houver nada digitado (evita perder o formulário)
const onBackdropClick = () => {
  if (!isDirty.value) emit('close')
}

useEscapeKey(() => props.isOpen, () => emit('close'))

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

const accountOptions = computed<AppSelectOption[]>(() => {
  return accountsStore.accounts.map(acc => ({
    value: acc.id,
    label: acc.name,
    sublabel: acc.institution,
    badge: acc.type === 'CREDIT_CARD' ? 'Cartão' : 'Conta',
    icon: markRaw(acc.type === 'CREDIT_CARD' ? PhCreditCard : PhBank)
  }))
})


onMounted(() => {
  if (accountsStore.accounts.length === 0) {
    accountsStore.fetchAccounts()
  }
  if (tagsStore.tags.length === 0) {
    tagsStore.fetchTags()
  }
})

const submit = async () => {
  const amountCheck = positiveAmountSchema.safeParse(amount.value)
  if (!amountCheck.success) {
    errorMessage.value = amountCheck.error.issues[0].message
    return
  }
  if (!accountId.value) {
    errorMessage.value = accountsStore.accounts.length
      ? 'Selecione a conta do lançamento.'
      : 'Cadastre uma conta bancária antes de lançar.'
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const finalAmount = type.value === 'DEBIT' ? -Math.abs(amountCheck.data) : Math.abs(amountCheck.data)

    await txStore.createTransaction({
      account_id: accountId.value,
      type: type.value,
      amount: finalAmount,
      name: name.value.trim(),
      memo: memo.value.trim(),
      status: status.value,
      // Meio-dia UTC: mesma convenção do modal de edição, evita a data "voltar" um dia no fuso do Brasil
      date_posted: new Date(datePosted.value + 'T12:00:00Z').toISOString(),
      tags: selectedTagId.value ? [selectedTagId.value] : [],
    })

    toast.success('Lançamento criado', type.value === 'DEBIT' ? 'Despesa registrada.' : 'Receita registrada.')
    emit('created')
    emit('close')
    // Reset form (conta volta vazia: escolha sempre explícita)
    accountId.value = ''
    name.value = ''
    memo.value = ''
    amount.value = ''
    type.value = 'DEBIT'
    status.value = 'POSTED'
    selectedTagId.value = ''
    datePosted.value = todayLocal()
  } catch (err: any) {
    console.error('Falha ao criar transação:', err)
    errorMessage.value = err.response?.data?.message || 'Falha ao salvar transação'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div 
    v-if="isOpen"
    class="fixed inset-0 z-[10002] flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto overscroll-contain"
    @click="onBackdropClick"
  >
    <div 
      class="bg-surface border border-white/10 rounded-t-3xl sm:rounded-2xl w-full max-w-lg max-h-[90dvh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 text-white my-0 sm:my-auto overscroll-contain will-change-transform"
      :style="{
        transform: translateY > 0 ? `translateY(${translateY}px)` : undefined,
        transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
      }"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-tx-title"
      @click.stop
    >
      <!-- Barra Mobile Drag indicator com suporte a toque -->
      <div 
        class="w-full pt-3 pb-1 cursor-grab active:cursor-grabbing sm:hidden touch-none flex justify-center"
        @touchstart="onTouchStart"
        @touchmove="onTouchMove"
        @touchend="onTouchEnd"
      >
        <div class="w-12 h-1.5 bg-white/25 hover:bg-white/40 rounded-full transition-colors"></div>
      </div>

      <!-- Cabeçalho Fixo (arrastável no mobile) -->
      <div 
        class="px-5 py-3.5 border-b border-white/10 flex items-center justify-between flex-shrink-0 touch-none sm:touch-auto select-none"
        @touchstart="onTouchStart"
        @touchmove="onTouchMove"
        @touchend="onTouchEnd"
      >
        <div>
          <h3 id="create-tx-title" class="text-base sm:text-lg font-bold text-white">Novo Lançamento</h3>
          <p class="text-[11px] text-white/50">Crie uma despesa ou receita avulsa</p>
        </div>
        <button 
          @click="emit('close')" 
          class="text-white/50 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          title="Fechar"
          aria-label="Fechar"
        >
          <PhX :size="18" />
        </button>
      </div>

      <!-- Corpo com Rolagem Interna -->
      <div class="px-5 py-4 overflow-y-auto flex-1 flex flex-col gap-3.5 custom-scrollbar">
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

        <!-- Valor com Máscara Monetária -->
        <div class="flex flex-col gap-1">
          <label for="create-tx-amount" class="text-xs font-semibold text-white/70">Valor</label>
          <CurrencyInput
            id="create-tx-amount"
            v-model="amount"
            placeholder="0,00"
          />
        </div>

        <!-- Nome e Observação -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="flex flex-col gap-1">
            <label for="create-tx-name" class="text-xs font-semibold text-white/70">Descrição</label>
            <Input
              id="create-tx-name"
              v-model="name"
              type="text"
              placeholder="Ex: Supermercado Extra"
            />
          </div>
          <div class="flex flex-col gap-1">
            <label for="create-tx-memo" class="text-xs font-semibold text-white/70">Observação (opcional)</label>
            <Input
              id="create-tx-memo"
              v-model="memo"
              type="text"
              placeholder="Ex: Compras do mês"
            />
          </div>
        </div>

        <!-- Conta, Categoria e Data -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div class="flex flex-col gap-1">
            <label class="text-xs font-semibold text-white/70">Conta <span class="text-rose-400" aria-hidden="true">*</span></label>
            <AppSelect
              v-model="accountId"
              :options="accountOptions"
              placeholder="Selecione a conta..."
              :teleport="true"
            />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-xs font-semibold text-white/70">Categoria</label>
            <TagCombobox
              v-model="selectedTagId"
              placeholder="Sem categoria"
            />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-xs font-semibold text-white/70">Data</label>
            <DatePicker v-model="datePosted" />
          </div>
        </div>

        <!-- Situação: Já Pago vs Previsto (Pendente) -->
        <div class="flex flex-col gap-1.5 pt-1">
          <label class="text-xs font-semibold text-white/70">Situação</label>
          <div class="grid grid-cols-2 gap-2 bg-white/5 p-1 rounded-xl">
            <button
              type="button"
              @click="status = 'POSTED'"
              class="py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
              :class="status === 'POSTED' ? 'bg-accent/20 border border-accent/40 text-accent font-bold shadow-sm' : 'text-white/50 hover:text-white border border-transparent'"
            >
              <PhCheck :size="14" weight="bold" />
              <span>Efetivada</span>
            </button>
            <button
              type="button"
              @click="status = 'PLANNED'"
              class="py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
              :class="status === 'PLANNED' ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold shadow-sm' : 'text-white/50 hover:text-white border border-transparent'"
            >
              <PhClock :size="14" weight="bold" />
              <span>Prevista</span>
            </button>
          </div>
          <p class="text-[11px] text-white/50 px-1">
            {{ status === 'POSTED' ? 'O valor já saiu ou entrou na conta.' : 'Programada para o futuro. Não afeta o saldo até ser efetivada.' }}
          </p>
        </div>
      </div>

      <!-- Rodapé Fixo com Ações -->
      <div class="px-5 py-3 border-t border-white/10 flex items-center justify-end gap-3 flex-shrink-0 bg-surface/90 backdrop-blur-sm">
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
          @click="submit"
          :disabled="loading"
          class="gap-2 font-bold shadow-lg shadow-accent/15"
        >
          <PhCircleNotch v-if="loading" :size="16" class="animate-spin" />
          <PhPlus v-else :size="16" weight="bold" />
          <span>{{ loading ? 'Salvando...' : 'Criar Lançamento' }}</span>
        </Button>
      </div>
    </div>
  </div>
</template>

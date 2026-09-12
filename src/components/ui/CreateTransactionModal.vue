<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAccountsStore } from '../../stores/accounts'
import { useTagsStore } from '../../stores/tags'
import { useTransactionsStore } from '../../stores/transactions'
import { PhX, PhPlus, PhCircleNotch, PhCheck, PhClock } from '@phosphor-icons/vue'

defineProps<{
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
const datePosted = ref(new Date().toISOString().split('T')[0])
const loading = ref(false)
const errorMessage = ref('')

onMounted(() => {
  if (accountsStore.accounts.length === 0) {
    accountsStore.fetchAccounts()
  }
  if (tagsStore.tags.length === 0) {
    tagsStore.fetchTags()
  }
})

const submit = async () => {
  if (!amount.value || Number(amount.value) <= 0) {
    errorMessage.value = 'Informe um valor válido.'
    return
  }
  if (!accountId.value && accountsStore.accounts.length > 0) {
    accountId.value = accountsStore.accounts[0].id
  }
  if (!accountId.value) {
    errorMessage.value = 'Cadastre ou selecione uma conta bancária antes de lançar.'
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const finalAmount = type.value === 'DEBIT' ? -Math.abs(Number(amount.value)) : Math.abs(Number(amount.value))

    await txStore.createTransaction({
      account_id: accountId.value,
      type: type.value,
      amount: finalAmount,
      name: name.value.trim(),
      memo: memo.value.trim(),
      status: status.value,
      date_posted: new Date(datePosted.value).toISOString(),
      tags: selectedTagId.value ? [selectedTagId.value] : [],
    })

    emit('created')
    emit('close')
    // Reset form
    name.value = ''
    memo.value = ''
    amount.value = ''
    status.value = 'POSTED'
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
    class="fixed inset-0 z-[10002] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto"
    @click="emit('close')"
  >
    <div 
      class="bg-surface border border-white/10 rounded-2xl w-full max-w-lg max-h-[90dvh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-white my-auto"
      @click.stop
    >
      <!-- Cabeçalho Fixo -->
      <div class="px-5 py-4 border-b border-white/10 flex items-center justify-between flex-shrink-0">
        <div>
          <h3 class="text-base sm:text-lg font-bold text-white">Novo Lançamento</h3>
          <p class="text-[11px] text-white/50">Crie uma despesa ou receita avulsa</p>
        </div>
        <button 
          @click="emit('close')" 
          class="text-white/40 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          title="Fechar"
        >
          <PhX :size="18" />
        </button>
      </div>

      <!-- Corpo com Rolagem Interna -->
      <div class="px-5 py-4 overflow-y-auto flex-1 flex flex-col gap-3.5 custom-scrollbar">
        <div v-if="errorMessage" class="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
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

        <!-- Valor -->
        <div class="flex flex-col gap-1">
          <label class="text-xs font-semibold text-white/70">Valor</label>
          <div class="relative">
            <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-white/40">R$</span>
            <input
              v-model="amount"
              type="number"
              step="0.01"
              placeholder="0,00"
              class="w-full bg-slate-950 border border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-xl font-bold text-white placeholder-white/20 focus:outline-none focus:border-accent transition-colors"
            />
          </div>
        </div>

        <!-- Nome e Observação -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="flex flex-col gap-1">
            <label class="text-xs font-semibold text-white/70">Estabelecimento / Descrição</label>
            <input
              v-model="name"
              type="text"
              placeholder="Ex: Supermercado Extra"
              class="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-accent"
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-xs font-semibold text-white/70">Observação (Opcional)</label>
            <input
              v-model="memo"
              type="text"
              placeholder="Ex: Compras do mês"
              class="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        <!-- Conta, Categoria e Data -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div class="flex flex-col gap-1">
            <label class="text-xs font-semibold text-white/70">Conta Bancária</label>
            <select
              v-model="accountId"
              class="bg-slate-950 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-accent cursor-pointer truncate"
            >
              <option v-for="acc in accountsStore.accounts" :key="acc.id" :value="acc.id">
                {{ acc.name }} ({{ acc.institution }})
              </option>
            </select>
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-xs font-semibold text-white/70">Categoria</label>
            <select
              v-model="selectedTagId"
              class="bg-slate-950 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-accent cursor-pointer truncate"
            >
              <option value="">Sem Categoria</option>
              <option v-for="t in tagsStore.tags" :key="t.id" :value="t.id">
                {{ t.name }}
              </option>
            </select>
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-xs font-semibold text-white/70">Data</label>
            <input
              v-model="datePosted"
              type="date"
              class="bg-slate-950 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-accent cursor-pointer"
            />
          </div>
        </div>

        <!-- Situação: Já Pago vs Previsto (Pendente) -->
        <div class="flex flex-col gap-1.5 pt-1">
          <label class="text-xs font-semibold text-white/70">Situação do Lançamento</label>
          <div class="grid grid-cols-2 gap-2 bg-white/5 p-1 rounded-xl">
            <button
              type="button"
              @click="status = 'POSTED'"
              class="py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
              :class="status === 'POSTED' ? 'bg-accent/20 border border-accent/40 text-accent font-bold shadow-sm' : 'text-white/50 hover:text-white border border-transparent'"
            >
              <PhCheck :size="14" weight="bold" />
              <span>Já Pago (Efetivado)</span>
            </button>
            <button
              type="button"
              @click="status = 'PLANNED'"
              class="py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
              :class="status === 'PLANNED' ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold shadow-sm' : 'text-white/50 hover:text-white border border-transparent'"
            >
              <PhClock :size="14" weight="bold" />
              <span>Previsto (Pendente)</span>
            </button>
          </div>
          <p class="text-[10px] text-white/40 px-1">
            {{ status === 'POSTED' ? 'O valor já foi debitado ou creditado da conta.' : 'Programado para o futuro. Não afeta o saldo atual até ser confirmado.' }}
          </p>
        </div>
      </div>

      <!-- Rodapé Fixo com Ações -->
      <div class="px-5 py-3 border-t border-white/10 flex items-center justify-end gap-3 flex-shrink-0 bg-surface/90 backdrop-blur-sm">
        <button
          type="button"
          @click="emit('close')"
          class="px-4 py-2 text-xs font-semibold text-white/50 hover:text-white transition-colors cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="button"
          @click="submit"
          :disabled="loading"
          class="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-bg font-bold text-xs hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 shadow-lg shadow-accent/15"
        >
          <PhCircleNotch v-if="loading" :size="16" class="animate-spin" />
          <PhPlus v-else :size="16" weight="bold" />
          <span>{{ loading ? 'Salvando...' : 'Criar Lançamento' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

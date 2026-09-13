<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAccountsStore, type Account } from '../stores/accounts'
import { useAuthStore } from '../stores/auth'
import { 
  PhBank, 
  PhPlus, 
  PhPencilSimple, 
  PhTrash, 
  PhCreditCard, 
  PhLock, 
  PhUsers, 
  PhCoins, 
  PhChartLineUp, 
  PhCheck, 
  PhX, 
  PhWarningCircle 
} from '@phosphor-icons/vue'

const accountsStore = useAccountsStore()
const authStore = useAuthStore()

const isModalOpen = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)
const submitting = ref(false)
const formError = ref('')

const form = ref({
  name: '',
  institution: 'Nubank',
  type: 'CHECKING' as 'CHECKING' | 'CREDIT_CARD' | 'INVESTMENT' | 'CASH' | 'OTHER',
  isPrivate: false
})

const popularBanks = [
  { name: 'Nubank', color: 'from-purple-600 to-indigo-700' },
  { name: 'Inter', color: 'from-orange-500 to-amber-600' },
  { name: 'Itaú', color: 'from-orange-600 to-amber-700' },
  { name: 'Bradesco', color: 'from-red-600 to-rose-700' },
  { name: 'Santander', color: 'from-red-700 to-red-800' },
  { name: 'Banco do Brasil', color: 'from-yellow-500 to-blue-600' },
  { name: 'C6 Bank', color: 'from-zinc-800 to-zinc-950' },
  { name: 'Caixa', color: 'from-blue-600 to-sky-700' },
  { name: 'Outro', color: 'from-slate-700 to-slate-900' }
]

onMounted(async () => {
  await accountsStore.fetchAccounts()
})

const sharedAccountsCount = computed(() => {
  return accountsStore.accounts.filter(a => !a.allowed_users || a.allowed_users.length === 0).length
})

const privateAccountsCount = computed(() => {
  return accountsStore.accounts.filter(a => a.allowed_users && a.allowed_users.length > 0).length
})

const openCreateModal = () => {
  isEditing.value = false
  editingId.value = null
  form.value = {
    name: '',
    institution: 'Nubank',
    type: 'CHECKING',
    isPrivate: false
  }
  formError.value = ''
  isModalOpen.value = true
}

const openEditModal = (acc: Account) => {
  isEditing.value = true
  editingId.value = acc.id
  form.value = {
    name: acc.name,
    institution: acc.institution || 'Nubank',
    type: acc.type || 'CHECKING',
    isPrivate: Array.isArray(acc.allowed_users) && acc.allowed_users.length > 0
  }
  formError.value = ''
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
}

const handleSave = async () => {
  formError.value = ''
  if (!form.value.name.trim() || form.value.name.trim().length < 2) {
    formError.value = 'O nome da conta deve conter pelo menos 2 caracteres.'
    return
  }

  submitting.value = true
  try {
    const currentUserId = authStore.user?.user_id
    const allowedUsers = form.value.isPrivate && currentUserId ? [currentUserId] : []

    const payload = {
      name: form.value.name.trim(),
      institution: form.value.institution,
      type: form.value.type,
      allowed_users: allowedUsers
    }

    if (isEditing.value && editingId.value) {
      await accountsStore.updateAccount(editingId.value, payload)
    } else {
      await accountsStore.createAccount(payload)
    }

    closeModal()
  } catch (err: any) {
    formError.value = err.response?.data?.message || err.response?.data?.error || 'Falha ao salvar conta bancária.'
  } finally {
    submitting.value = false
  }
}

const handleDelete = async (acc: Account) => {
  if (!confirm(`Deseja realmente excluir a conta "${acc.name}"? Todas as transações vinculadas a ela poderão ser afetadas.`)) {
    return
  }

  try {
    await accountsStore.deleteAccount(acc.id)
  } catch (err: any) {
    alert(err.response?.data?.message || err.response?.data?.error || 'Falha ao excluir conta.')
  }
}

const getTypeLabel = (type?: string) => {
  switch (type) {
    case 'CREDIT_CARD': return 'Cartão de Crédito'
    case 'INVESTMENT': return 'Investimentos'
    case 'CASH': return 'Dinheiro / Carteira'
    default: return 'Conta Corrente'
  }
}

const getTypeBadgeClass = (type?: string) => {
  switch (type) {
    case 'CREDIT_CARD': return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
    case 'INVESTMENT': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    case 'CASH': return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    default: return 'bg-accent/10 text-accent border-accent/20'
  }
}
</script>

<template>
  <div class="max-w-5xl mx-auto flex flex-col gap-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <PhBank :size="26" class="text-accent" weight="duotone" />
          <span>Contas Bancárias</span>
        </h1>
        <p class="text-white/50 text-xs sm:text-sm mt-1">
          Gerencie contas correntes, cartões e controle a privacidade de cada instituição.
        </p>
      </div>

      <button
        type="button"
        @click="openCreateModal"
        class="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-accent text-bg text-xs font-bold hover:opacity-90 transition-all cursor-pointer shadow-lg shadow-accent/20"
      >
        <PhPlus :size="16" weight="bold" />
        <span>Nova Conta</span>
      </button>
    </div>

    <!-- Cards Resumo -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div class="p-4 rounded-2xl bg-surface border border-white/5 flex items-center gap-3.5 shadow-sm">
        <div class="w-10 h-10 rounded-xl bg-accent/15 border border-accent/30 text-accent flex items-center justify-center">
          <PhBank :size="22" weight="duotone" />
        </div>
        <div>
          <span class="text-[11px] text-white/50 font-medium">Total de Contas</span>
          <p class="text-lg font-bold text-white">{{ accountsStore.accounts.length }}</p>
        </div>
      </div>

      <div class="p-4 rounded-2xl bg-surface border border-white/5 flex items-center gap-3.5 shadow-sm">
        <div class="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
          <PhUsers :size="22" weight="duotone" />
        </div>
        <div>
          <span class="text-[11px] text-white/50 font-medium">Contas Conjuntas (Família)</span>
          <p class="text-lg font-bold text-emerald-400">{{ sharedAccountsCount }}</p>
        </div>
      </div>

      <div class="p-4 rounded-2xl bg-surface border border-white/5 flex items-center gap-3.5 shadow-sm">
        <div class="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
          <PhLock :size="22" weight="duotone" />
        </div>
        <div>
          <span class="text-[11px] text-white/50 font-medium">Contas Privadas</span>
          <p class="text-lg font-bold text-amber-400">{{ privateAccountsCount }}</p>
        </div>
      </div>
    </div>

    <!-- Lista de Contas -->
    <div v-if="accountsStore.loading" class="p-12 text-center text-white/40 text-sm">
      Carregando contas...
    </div>

    <div v-else-if="accountsStore.accounts.length === 0" class="bg-surface rounded-2xl p-8 border border-white/5 text-center flex flex-col items-center justify-center gap-3">
      <div class="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 text-white/40 flex items-center justify-center">
        <PhBank :size="28" weight="duotone" />
      </div>
      <h3 class="text-base font-bold text-white">Nenhuma conta cadastrada</h3>
      <p class="text-xs text-white/50 max-w-sm">
        Cadastre sua primeira conta corrente ou cartão de crédito para começar a importar extratos e lançar transações.
      </p>
      <button
        type="button"
        @click="openCreateModal"
        class="mt-2 flex items-center gap-2 py-2 px-4 rounded-xl bg-accent text-bg text-xs font-bold hover:opacity-90 transition-all cursor-pointer"
      >
        <PhPlus :size="15" weight="bold" />
        <span>Cadastrar Primeira Conta</span>
      </button>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
      <div
        v-for="acc in accountsStore.accounts"
        :key="acc.id"
        class="bg-surface rounded-2xl p-5 border border-white/5 hover:border-white/15 transition-all shadow-sm flex flex-col justify-between gap-4 group"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="w-11 h-11 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center text-white shadow-sm">
              <PhCreditCard v-if="acc.type === 'CREDIT_CARD'" :size="22" weight="duotone" class="text-purple-400" />
              <PhChartLineUp v-else-if="acc.type === 'INVESTMENT'" :size="22" weight="duotone" class="text-emerald-400" />
              <PhCoins v-else-if="acc.type === 'CASH'" :size="22" weight="duotone" class="text-amber-400" />
              <PhBank v-else :size="22" weight="duotone" class="text-accent" />
            </div>
            <div>
              <h3 class="text-sm font-bold text-white group-hover:text-accent transition-colors">{{ acc.name }}</h3>
              <p class="text-xs text-white/50">{{ acc.institution }}</p>
            </div>
          </div>

          <div class="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              @click="openEditModal(acc)"
              class="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              title="Editar Conta"
            >
              <PhPencilSimple :size="16" />
            </button>
            <button
              type="button"
              @click="handleDelete(acc)"
              class="p-1.5 rounded-lg text-rose-400/60 hover:text-rose-300 hover:bg-rose-500/10 transition-all cursor-pointer"
              title="Excluir Conta"
            >
              <PhTrash :size="16" />
            </button>
          </div>
        </div>

        <div class="flex items-center justify-between gap-2 pt-3 border-t border-white/5 text-[11px]">
          <span class="px-2.5 py-1 rounded-lg border font-medium" :class="getTypeBadgeClass(acc.type)">
            {{ getTypeLabel(acc.type) }}
          </span>

          <span 
            v-if="acc.allowed_users && acc.allowed_users.length > 0"
            class="flex items-center gap-1 text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 font-medium"
            title="Apenas você tem acesso a esta conta"
          >
            <PhLock :size="12" />
            <span>Privada</span>
          </span>
          <span 
            v-else 
            class="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 font-medium"
            title="Toda a família pode ver e lançar nesta conta"
          >
            <PhUsers :size="12" />
            <span>Conjunta</span>
          </span>
        </div>
      </div>
    </div>

    <!-- Modal de Criação / Edição -->
    <div
      v-if="isModalOpen"
      class="fixed inset-0 z-[10000] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
      @click="closeModal"
    >
      <div 
        class="w-full max-w-md bg-surface border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 duration-150"
        @click.stop
      >
        <div class="flex items-center justify-between pb-3 border-b border-white/10">
          <h3 class="text-sm font-bold text-white flex items-center gap-2">
            <PhBank :size="18" class="text-accent" />
            <span>{{ isEditing ? 'Editar Conta Bancária' : 'Nova Conta Bancária' }}</span>
          </h3>
          <button @click="closeModal" class="text-white/40 hover:text-white transition-colors cursor-pointer">
            <PhX :size="18" />
          </button>
        </div>

        <form @submit.prevent="handleSave" class="flex flex-col gap-4">
          <div>
            <label class="text-xs font-semibold text-white/80 mb-1.5 block">Nome Identificador da Conta</label>
            <input
              v-model="form.name"
              type="text"
              placeholder="ex: Nubank Principal, Itaú Salário, Cartão XP"
              class="w-full bg-bg border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
              required
            />
          </div>

          <!-- Instituição -->
          <div>
            <label class="text-xs font-semibold text-white/80 mb-1.5 block">Instituição Financeira</label>
            <div class="grid grid-cols-3 gap-2 mb-2">
              <button
                v-for="b in popularBanks.slice(0, 6)"
                :key="b.name"
                type="button"
                @click="form.institution = b.name"
                class="py-2 px-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer text-center truncate"
                :class="form.institution === b.name 
                  ? 'bg-accent/20 border-accent text-white font-bold shadow-sm' 
                  : 'bg-bg/60 border-white/5 text-white/60 hover:bg-white/5 hover:text-white'"
              >
                {{ b.name }}
              </button>
            </div>
            <input
              v-model="form.institution"
              type="text"
              placeholder="Ou digite o nome do banco/corretora"
              class="w-full bg-bg border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
              required
            />
          </div>

          <!-- Tipo de Conta -->
          <div>
            <label class="text-xs font-semibold text-white/80 mb-1.5 block">Tipo da Conta</label>
            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                @click="form.type = 'CHECKING'"
                class="p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer"
                :class="form.type === 'CHECKING' ? 'bg-accent/20 border-accent text-white font-semibold' : 'bg-bg/60 border-white/5 text-white/60 hover:bg-white/5'"
              >
                <PhBank :size="16" class="text-accent" />
                <span class="text-xs">Conta Corrente</span>
              </button>

              <button
                type="button"
                @click="form.type = 'CREDIT_CARD'"
                class="p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer"
                :class="form.type === 'CREDIT_CARD' ? 'bg-purple-500/20 border-purple-400 text-white font-semibold' : 'bg-bg/60 border-white/5 text-white/60 hover:bg-white/5'"
              >
                <PhCreditCard :size="16" class="text-purple-400" />
                <span class="text-xs">Cartão de Crédito</span>
              </button>

              <button
                type="button"
                @click="form.type = 'INVESTMENT'"
                class="p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer"
                :class="form.type === 'INVESTMENT' ? 'bg-emerald-500/20 border-emerald-400 text-white font-semibold' : 'bg-bg/60 border-white/5 text-white/60 hover:bg-white/5'"
              >
                <PhChartLineUp :size="16" class="text-emerald-400" />
                <span class="text-xs">Investimentos</span>
              </button>

              <button
                type="button"
                @click="form.type = 'CASH'"
                class="p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer"
                :class="form.type === 'CASH' ? 'bg-amber-500/20 border-amber-400 text-white font-semibold' : 'bg-bg/60 border-white/5 text-white/60 hover:bg-white/5'"
              >
                <PhCoins :size="16" class="text-amber-400" />
                <span class="text-xs">Dinheiro Físico</span>
              </button>
            </div>
          </div>

          <!-- Privacidade / Compartilhamento -->
          <div class="p-3 rounded-xl bg-bg/80 border border-white/5 flex flex-col gap-2">
            <span class="text-xs font-semibold text-white/80">Visibilidade Familiar</span>
            <label class="flex items-center gap-2.5 cursor-pointer text-xs text-white/80 select-none">
              <input 
                type="checkbox" 
                v-model="form.isPrivate"
                class="rounded bg-surface border-white/20 text-accent focus:ring-accent"
              />
              <span>Tornar esta conta privada (apenas eu posso visualizar e lançar nela)</span>
            </label>
            <p class="text-[11px] text-white/40">
              Contas conjuntas ficam visíveis para todos os membros que você convidar para a família.
            </p>
          </div>

          <div v-if="formError" class="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <PhWarningCircle :size="15" />
            <span>{{ formError }}</span>
          </div>

          <div class="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              @click="closeModal"
              class="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-xs font-medium transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="submitting"
              class="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent text-bg text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
            >
              <PhCheck :size="14" weight="bold" />
              <span>{{ submitting ? 'Salvando...' : (isEditing ? 'Salvar Alterações' : 'Criar Conta') }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

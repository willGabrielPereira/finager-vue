<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { useAccountsStore } from '../../stores/accounts'
import { useTransactionsStore } from '../../stores/transactions'
import { api } from '../../api/axios'
import { 
  PhCheckCircle, 
  PhCircle, 
  PhArrowRight, 
  PhBank, 
  PhUploadSimple, 
  PhListDashes, 
  PhUsers, 
  PhX, 
  PhFileText,
  PhSparkle
} from '@phosphor-icons/vue'

const emit = defineEmits<{
  (e: 'open-ofx-guide'): void
  (e: 'open-new-account'): void
  (e: 'open-import-ofx'): void
}>()

const router = useRouter()
const authStore = useAuthStore()
const accountsStore = useAccountsStore()
const txStore = useTransactionsStore()

const isDismissed = ref(localStorage.getItem('finager_onboarding_dismissed') === 'true')

// Totais globais vindos do backend. O Dashboard não carrega txStore.transactions,
// então sem isso o checklist achava que nada foi importado/categorizado.
const totalTx = ref(0)
const untaggedTx = ref(0)

const fetchProgress = async () => {
  try {
    const [all, untagged] = await Promise.all([
      api.get('/transactions', { params: { limit: 1 } }),
      api.get('/transactions', { params: { limit: 1, status: 'UNTAGGED' } }),
    ])
    totalTx.value = all.data.total || 0
    untaggedTx.value = untagged.data.total || 0
  } catch {
    // Sem progresso remoto: cai no estado local da store
  }
}

onMounted(async () => {
  if (!isDismissed.value) fetchProgress()
  if (accountsStore.accounts.length === 0) {
    accountsStore.fetchAccounts()
  }
  if (authStore.familyMembers.length === 0) {
    authStore.fetchFamilyMembers()
  }
})

const hasAccount = computed(() => accountsStore.accounts.length > 0)
const hasImported = computed(() => totalTx.value > 0 || txStore.transactions.length > 0 || txStore.pagination.total > 0)
const hasReviewedTags = computed(() => {
  return totalTx.value > untaggedTx.value || txStore.transactions.some(t => t.tags && t.tags.length > 0)
})
const hasFamily = computed(() => authStore.familyMembers.length > 1)

// Progresso baseado nos passos principais
const completedCount = computed(() => {
  let count = 0
  if (hasAccount.value) count++
  if (hasImported.value) count++
  if (hasReviewedTags.value) count++
  return count
})

const progressPercent = computed(() => {
  return Math.round((completedCount.value / 3) * 100)
})

const isAllCompleted = computed(() => completedCount.value >= 3)

const handleDismiss = () => {
  isDismissed.value = true
  localStorage.setItem('finager_onboarding_dismissed', 'true')
}

const handleReopen = () => {
  isDismissed.value = false
  localStorage.removeItem('finager_onboarding_dismissed')
}

defineExpose({
  handleReopen
})
</script>

<template>
  <div 
    v-if="!isDismissed && !isAllCompleted"
    class="bg-gradient-to-r from-surface via-surface to-accent/5 border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col gap-4 relative overflow-hidden"
  >
    <!-- Background Decorator -->
    <div class="absolute -right-10 -bottom-10 w-40 h-40 bg-accent/10 rounded-full blur-3xl pointer-events-none"></div>

    <!-- Header do Checklist -->
    <div class="flex items-start justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shrink-0">
          <PhSparkle :size="20" weight="fill" />
        </div>
        <div>
          <h3 class="text-sm sm:text-base font-bold text-white flex items-center gap-2">
            <span>Primeiros Passos no Finager</span>
            <span class="text-[10px] px-2 py-0.5 rounded-full bg-accent/20 text-accent font-semibold">
              {{ progressPercent }}% concluído
            </span>
          </h3>
          <p class="text-xs text-white/50 mt-0.5">Complete o setup inicial para desbloquear todo o potencial do seu extrato</p>
        </div>
      </div>

      <div class="flex items-center gap-1.5">
        <button
          type="button"
          @click="emit('open-ofx-guide')"
          class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-white/70 text-xs font-medium transition-colors cursor-pointer"
        >
          <PhFileText :size="14" />
          <span>Guia de Bancos OFX</span>
        </button>

        <button 
          @click="handleDismiss"
          class="text-white/50 hover:text-white p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
          title="Ocultar checklist"
          aria-label="Ocultar checklist"
        >
          <PhX :size="18" />
        </button>
      </div>
    </div>

    <!-- Barra de Progresso Visual -->
    <div class="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
      <div 
        class="bg-accent h-full transition-all duration-500 ease-out rounded-full shadow-sm shadow-accent/50"
        :style="{ width: `${progressPercent}%` }"
      ></div>
    </div>

    <!-- Lista de Passos -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-2.5 mt-1">
      <!-- Passo 1: Cadastrar Conta -->
      <div 
        class="p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3"
        :class="hasAccount 
          ? 'bg-accent/5 border-accent/20 text-white/60' 
          : 'bg-white/[0.02] border-white/10 text-white hover:border-accent/40'"
      >
        <div class="flex items-start justify-between gap-2">
          <div class="flex items-center gap-2">
            <PhCheckCircle v-if="hasAccount" :size="18" weight="fill" class="text-accent shrink-0" />
            <PhCircle v-else :size="18" class="text-white/50 shrink-0" />
            <span class="text-xs font-bold" :class="hasAccount ? 'line-through text-white/50' : 'text-white'">
              1. Cadastrar Conta
            </span>
          </div>
          <PhBank :size="16" class="text-white/50" />
        </div>

        <button
          v-if="!hasAccount"
          type="button"
          @click="emit('open-new-account')"
          class="w-full py-1.5 px-2.5 rounded-xl bg-accent/20 hover:bg-accent/30 text-accent font-bold text-[11px] transition-colors flex items-center justify-center gap-1 cursor-pointer"
        >
          <span>Criar Conta</span>
          <PhArrowRight :size="12" />
        </button>
        <span v-else class="text-[11px] text-accent font-medium">Conta conectada!</span>
      </div>

      <!-- Passo 2: Importar Extrato OFX -->
      <div 
        class="p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3"
        :class="hasImported 
          ? 'bg-accent/5 border-accent/20 text-white/60' 
          : 'bg-white/[0.02] border-white/10 text-white hover:border-accent/40'"
      >
        <div class="flex items-start justify-between gap-2">
          <div class="flex items-center gap-2">
            <PhCheckCircle v-if="hasImported" :size="18" weight="fill" class="text-accent shrink-0" />
            <PhCircle v-else :size="18" class="text-white/50 shrink-0" />
            <span class="text-xs font-bold" :class="hasImported ? 'line-through text-white/50' : 'text-white'">
              2. Importar 1º OFX
            </span>
          </div>
          <PhUploadSimple :size="16" class="text-white/50" />
        </div>

        <button
          v-if="!hasImported"
          type="button"
          @click="emit('open-import-ofx')"
          class="w-full py-1.5 px-2.5 rounded-xl bg-accent text-bg font-bold text-[11px] transition-opacity hover:opacity-90 flex items-center justify-center gap-1 cursor-pointer shadow-md shadow-accent/20"
        >
          <span>Subir Extrato</span>
          <PhArrowRight :size="12" />
        </button>
        <span v-else class="text-[11px] text-accent font-medium">Transações importadas!</span>
      </div>

      <!-- Passo 3: Conferir Tags / Extrato -->
      <div 
        class="p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3"
        :class="hasReviewedTags 
          ? 'bg-accent/5 border-accent/20 text-white/60' 
          : 'bg-white/[0.02] border-white/10 text-white hover:border-accent/40'"
      >
        <div class="flex items-start justify-between gap-2">
          <div class="flex items-center gap-2">
            <PhCheckCircle v-if="hasReviewedTags" :size="18" weight="fill" class="text-accent shrink-0" />
            <PhCircle v-else :size="18" class="text-white/50 shrink-0" />
            <span class="text-xs font-bold" :class="hasReviewedTags ? 'line-through text-white/50' : 'text-white'">
              3. Conferir Gastos
            </span>
          </div>
          <PhListDashes :size="16" class="text-white/50" />
        </div>

        <button
          v-if="!hasReviewedTags"
          type="button"
          @click="router.push('/transactions')"
          class="w-full py-1.5 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 font-medium text-[11px] transition-colors flex items-center justify-center gap-1 cursor-pointer"
        >
          <span>Ver Extrato</span>
          <PhArrowRight :size="12" />
        </button>
        <span v-else class="text-[11px] text-accent font-medium">Categorias conferidas!</span>
      </div>

      <!-- Passo 4 (Opcional): Família -->
      <div 
        class="p-3.5 rounded-2xl border bg-white/[0.02] border-white/10 text-white transition-all flex flex-col justify-between gap-3"
      >
        <div class="flex items-start justify-between gap-2">
          <div class="flex items-center gap-2">
            <PhCheckCircle v-if="hasFamily" :size="18" weight="fill" class="text-accent shrink-0" />
            <PhCircle v-else :size="18" class="text-white/50 shrink-0" />
            <span class="text-xs font-bold" :class="hasFamily ? 'line-through text-white/50' : 'text-white'">
              4. Família <span class="text-[10px] text-white/50 font-normal">(Opcional)</span>
            </span>
          </div>
          <PhUsers :size="16" class="text-white/50" />
        </div>

        <button
          type="button"
          @click="router.push('/profile')"
          class="w-full py-1.5 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 font-medium text-[11px] transition-colors flex items-center justify-center gap-1 cursor-pointer"
        >
          <span>{{ hasFamily ? 'Gerenciar Membros' : 'Convidar Membro' }}</span>
          <PhArrowRight :size="12" />
        </button>
      </div>
    </div>
  </div>
</template>
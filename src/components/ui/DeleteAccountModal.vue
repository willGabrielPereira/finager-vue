<script setup lang="ts">
import { ref, watch } from 'vue'
import { PhWarning, PhLock, PhTrash, PhX, PhShieldWarning } from '@phosphor-icons/vue'
import { useAuthStore } from '../../stores/auth'
import { useRouter } from 'vue-router'
import { toast } from '../../utils/feedback'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const authStore = useAuthStore()
const router = useRouter()

const password = ref('')
const loading = ref(false)
const errorMessage = ref('')

watch(() => props.isOpen, (open) => {
  if (open) {
    password.value = ''
    errorMessage.value = ''
  }
})

const isFormValid = () => {
  return password.value.trim().length > 0
}

const handleDelete = async () => {
  if (!isFormValid() || loading.value) return
  loading.value = true
  errorMessage.value = ''

  try {
    await authStore.deleteAccount(password.value)
    emit('close')
    toast.success('Conta excluída com sucesso.')
    router.push('/login')
  } catch (err: any) {
    errorMessage.value = 
      err.response?.data?.error?.message || 
      err.response?.data?.message || 
      'Falha ao excluir conta. Verifique sua senha e tente novamente.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div 
    v-if="isOpen" 
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    @click.self="$emit('close')"
  >
    <div 
      class="bg-surface border border-red-500/30 w-full max-w-md rounded-2xl shadow-[0_25px_50px_-12px_rgba(239,68,68,0.25)] p-6 flex flex-col gap-5 animate-in zoom-in-95 duration-200"
    >
      <!-- Header -->
      <div class="flex items-start justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
            <PhShieldWarning :size="22" weight="duotone" />
          </div>
          <div>
            <h2 class="text-base font-bold text-white tracking-tight">Exclusão Definitiva de Conta</h2>
            <p class="text-xs text-red-400/90 font-medium">Direito de Eliminação (LGPD Art. 18)</p>
          </div>
        </div>

        <button 
          type="button" 
          @click="$emit('close')" 
          class="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <PhX :size="18" />
        </button>
      </div>

      <!-- Warning Box -->
      <div class="bg-red-500/10 border border-red-500/20 rounded-xl p-3.5 flex flex-col gap-2">
        <div class="flex items-center gap-2 text-red-400 font-semibold text-xs">
          <PhWarning :size="16" weight="bold" />
          <span>Atenção: Ação irreversível</span>
        </div>
        <p class="text-[11px] text-white/75 leading-relaxed">
          Todos os seus acessos, contas bancárias, lançamentos e histórico serão eliminados.
          <strong class="text-white block mt-1">Se esta for a última conta vinculada à família, toda a família e dados financeiros serão excluídos definitivamente.</strong>
        </p>
      </div>

      <!-- Form (Apenas Senha) -->
      <form @submit.prevent="handleDelete" class="flex flex-col gap-4">
        <div>
          <label class="block text-xs font-semibold text-white/80 mb-1.5 flex items-center gap-1.5">
            <PhLock :size="14" class="text-red-400" />
            <span>Digite sua senha para confirmar:</span>
          </label>
          <input 
            v-model="password"
            type="password"
            placeholder="Sua senha atual"
            autocomplete="current-password"
            autofocus
            class="w-full bg-bg border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-white/20 text-xs focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all"
            required
          />
        </div>

        <!-- Error Message -->
        <div v-if="errorMessage" class="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs text-center font-medium">
          {{ errorMessage }}
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center justify-end gap-2.5 pt-2 border-t border-white/5">
          <button
            type="button"
            @click="$emit('close')"
            class="px-4 py-2.5 rounded-xl text-xs font-semibold text-white/70 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="submit"
            :disabled="!isFormValid() || loading"
            class="px-5 py-2.5 rounded-xl text-xs font-bold bg-red-500 text-white hover:bg-red-600 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-red-500/20"
          >
            <PhTrash :size="15" weight="bold" />
            <span v-if="loading">Excluindo permanentemente...</span>
            <span v-else>Confirmar Exclusão Definitiva</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

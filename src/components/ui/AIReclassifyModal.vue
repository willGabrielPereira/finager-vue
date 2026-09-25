<script setup lang="ts">
import { ref } from 'vue'
import { PhSparkle, PhX, PhCircleNotch, PhCheckCircle } from '@phosphor-icons/vue'
import { Button } from './button'
import { useEscapeKey } from '@/composables/useEscapeKey'

const props = defineProps<{
  isOpen: boolean
  loading?: boolean
  resultCount?: number | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm', includeManuallyTagged: boolean): void
}>()

const includeManual = ref(false)

// Enquanto classifica, não fecha (o resultado se perderia)
useEscapeKey(() => props.isOpen && !props.loading, () => emit('close'))

const handleConfirm = () => {
  emit('confirm', includeManual.value)
}
</script>

<template>
  <div 
    v-if="isOpen"
    class="fixed inset-0 z-[10002] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto"
    @click="!loading && emit('close')"
  >
    <div
      class="bg-surface border border-white/10 rounded-2xl w-full max-w-md max-h-[90dvh] flex flex-col shadow-2xl overflow-y-auto custom-scrollbar p-5 sm:p-6 relative gap-4 animate-in zoom-in-95 duration-200 text-white my-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-modal-title"
      @click.stop
    >
      <button
        @click="emit('close')"
        :disabled="loading"
        aria-label="Fechar"
        class="absolute top-3 right-3 text-white/50 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-40"
      >
        <PhX :size="20" />
      </button>

      <!-- Cabeçalho -->
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center text-accent">
          <PhSparkle :size="22" weight="duotone" />
        </div>
        <div>
          <h3 id="ai-modal-title" class="text-lg font-bold">Classificar com IA</h3>
          <p class="text-xs text-white/50">Usa suas regras e o que você já categorizou</p>
        </div>
      </div>

      <!-- Estado: Sucesso após execução -->
      <div v-if="resultCount !== null && resultCount !== undefined" class="flex flex-col items-center gap-3 py-4 text-center">
        <PhCheckCircle :size="52" class="text-accent animate-in zoom-in-50 duration-200" weight="duotone" />
        <div>
          <h4 class="text-base font-bold">Classificação Concluída!</h4>
          <p class="text-xs text-white/60 mt-1">
            <template v-if="resultCount === 0">Nenhuma transação nova pôde ser categorizada desta vez.</template>
            <template v-else-if="resultCount === 1"><span class="text-accent font-bold text-sm">1</span> transação foi categorizada.</template>
            <template v-else><span class="text-accent font-bold text-sm">{{ resultCount }}</span> transações foram categorizadas.</template>
          </p>
        </div>
        <Button
          type="button"
          @click="emit('close')"
          class="mt-2 w-full bg-accent text-bg font-bold text-xs hover:opacity-90"
        >
          Entendido
        </Button>
      </div>

      <!-- Estado: Formulário de Confirmação -->
      <div v-else class="flex flex-col gap-4">
        <p class="text-xs text-white/70 leading-relaxed">
          Quais transações a IA deve categorizar?
        </p>

        <div class="flex flex-col gap-2">
          <label 
            class="flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none"
            :class="!includeManual ? 'bg-accent/10 border-accent/50 text-white' : 'bg-white/5 border-white/5 text-white/70 hover:bg-white/10'"
          >
            <input 
              type="radio" 
              name="scope" 
              :value="false" 
              v-model="includeManual" 
              class="mt-0.5 accent-accent" 
            />
            <div class="flex flex-col gap-0.5">
              <span class="text-xs font-bold text-white">Apenas transações sem categoria (Recomendado)</span>
              <span class="text-[11px] text-white/50">
                Preserva intactas todas as transações que você já classificou ou corrigiu manualmente.
              </span>
            </div>
          </label>

          <label 
            class="flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none"
            :class="includeManual ? 'bg-accent/10 border-accent/50 text-white' : 'bg-white/5 border-white/5 text-white/70 hover:bg-white/10'"
          >
            <input 
              type="radio" 
              name="scope" 
              :value="true" 
              v-model="includeManual" 
              class="mt-0.5 accent-accent" 
            />
            <div class="flex flex-col gap-0.5">
              <span class="text-xs font-bold text-white">Todas, inclusive as que eu já categorizei</span>
              <span class="text-[11px] text-white/50">
                Pode substituir categorias escolhidas por você em todo o histórico da família.
              </span>
            </div>
          </label>
        </div>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            @click="emit('close')"
            :disabled="loading"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            size="sm"
            @click="handleConfirm"
            :disabled="loading"
            class="bg-accent text-bg hover:opacity-90 font-bold"
          >
            <PhCircleNotch v-if="loading" :size="16" class="animate-spin mr-1.5" />
            <PhSparkle v-else :size="16" weight="fill" class="mr-1.5" />
            <span>{{ loading ? 'Classificando...' : 'Iniciar Classificação' }}</span>
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>


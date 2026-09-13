<script setup lang="ts">
import { ref } from 'vue'
import { PhSparkle, PhX, PhCircleNotch, PhCheckCircle } from '@phosphor-icons/vue'

defineProps<{
  isOpen: boolean
  loading?: boolean
  resultCount?: number | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm', includeManuallyTagged: boolean): void
}>()

const includeManual = ref(false)

const handleConfirm = () => {
  emit('confirm', includeManual.value)
}
</script>

<template>
  <div 
    v-if="isOpen"
    class="fixed inset-0 z-[10002] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto"
    @click="emit('close')"
  >
    <div 
      class="bg-surface border border-white/10 rounded-2xl w-full max-w-md max-h-[90dvh] flex flex-col shadow-2xl overflow-y-auto custom-scrollbar p-5 sm:p-6 relative gap-4 animate-in zoom-in-95 duration-200 text-white my-auto"
      @click.stop
    >
      <button 
        @click="emit('close')" 
        class="absolute top-4 right-4 text-white/50 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
      >
        <PhX :size="20" />
      </button>

      <!-- Cabeçalho -->
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center text-accent">
          <PhSparkle :size="22" weight="duotone" />
        </div>
        <div>
          <h3 class="text-lg font-bold">Classificação Inteligente</h3>
          <p class="text-xs text-white/50">Memória de comerciantes + IA local</p>
        </div>
      </div>

      <!-- Estado: Sucesso após execução -->
      <div v-if="resultCount !== null && resultCount !== undefined" class="flex flex-col items-center gap-3 py-4 text-center">
        <PhCheckCircle :size="52" class="text-accent animate-in zoom-in-50 duration-200" weight="duotone" />
        <div>
          <h4 class="text-base font-bold">Classificação Concluída!</h4>
          <p class="text-xs text-white/60 mt-1">
            Foram categorizadas <span class="text-accent font-bold text-sm">{{ resultCount }}</span> transações com sucesso.
          </p>
        </div>
        <button
          type="button"
          @click="emit('close')"
          class="mt-2 w-full py-2.5 rounded-xl bg-accent text-bg font-bold text-xs hover:opacity-90 transition-opacity cursor-pointer"
        >
          Entendido
        </button>
      </div>

      <!-- Estado: Formulário de Confirmação -->
      <div v-else class="flex flex-col gap-4">
        <p class="text-xs text-white/70 leading-relaxed">
          Como deseja aplicar a inteligência artificial nas transações do seu extrato?
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
              <span class="text-xs font-bold text-white">Incluir também transações manuais</span>
              <span class="text-[11px] text-white/50">
                Reavalia todo o histórico da família aplicando os novos padrões aprendidos.
              </span>
            </div>
          </label>
        </div>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
          <button
            type="button"
            @click="emit('close')"
            :disabled="loading"
            class="px-4 py-2 rounded-xl text-xs font-semibold text-white/60 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            @click="handleConfirm"
            :disabled="loading"
            class="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-accent text-bg hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
          >
            <PhCircleNotch v-if="loading" :size="16" class="animate-spin" />
            <PhSparkle v-else :size="16" weight="fill" />
            <span>{{ loading ? 'Classificando...' : 'Iniciar Classificação' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>


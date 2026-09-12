<script setup lang="ts">
import { PhSparkle, PhCheck, PhX } from '@phosphor-icons/vue'

defineProps<{
  merchantPattern: string
  categoryName: string
  categoryColor: string
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'apply-all'): void
  (e: 'dismiss'): void
}>()
</script>

<template>
  <div class="fixed bottom-20 md:bottom-8 right-4 md:right-8 z-[10001] max-w-md w-[calc(100vw-2rem)] bg-slate-950/95 border border-accent/40 rounded-2xl p-4 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-5 duration-200 flex flex-col gap-3 text-white">
    <div class="flex items-start gap-3">
      <div class="w-9 h-9 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-accent flex-shrink-0">
        <PhSparkle :size="20" weight="duotone" />
      </div>
      <div class="flex-1">
        <h4 class="text-sm font-bold text-white">Propagar Categoria</h4>
        <p class="text-xs text-white/70 mt-0.5">
          Deseja aplicar a categoria 
          <span class="font-semibold" :style="{ color: categoryColor }">"{{ categoryName }}"</span> 
          para as outras transações parecidas com 
          <span class="text-white font-medium">"{{ merchantPattern }}"</span>?
        </p>
      </div>
      <button 
        @click="emit('dismiss')" 
        class="text-white/40 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
      >
        <PhX :size="16" />
      </button>
    </div>

    <div class="flex items-center justify-end gap-2 pt-1 border-t border-white/10">
      <button
        type="button"
        @click="emit('dismiss')"
        class="px-3 py-1.5 rounded-lg text-xs font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
      >
        Apenas esta
      </button>
      <button
        type="button"
        @click="emit('apply-all')"
        :disabled="loading"
        class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-accent text-bg hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
      >
        <PhCheck :size="14" weight="bold" />
        <span>{{ loading ? 'Aplicando...' : 'Aplicar a todas' }}</span>
      </button>
    </div>
  </div>
</template>

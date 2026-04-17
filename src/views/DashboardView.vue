<script setup lang="ts">
import { useAuthStore } from '../stores/auth';
import { PhTrendUp, PhTrendDown, PhWallet } from '@phosphor-icons/vue';

const auth = useAuthStore();
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">Dashboard</h1>
    </div>
    
    <!-- Bento Grid -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      <div class="bg-surface rounded-xl p-6 border border-white/5 shadow-md flex items-center gap-4 hover:-translate-y-px transition-transform cursor-pointer">
        <div class="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-accent">
          <PhWallet :size="24" weight="duotone" />
        </div>
        <div>
          <p class="text-sm text-white/50 mb-1">Renda Total</p>
          <p class="text-2xl font-bold">R$ 14.500,00</p>
        </div>
      </div>
      
      <div class="bg-surface rounded-xl p-6 border border-white/5 shadow-md flex items-center gap-4 hover:-translate-y-px transition-transform cursor-pointer">
        <div class="w-12 h-12 rounded-full bg-red-400/20 flex items-center justify-center text-red-400">
          <PhTrendDown :size="24" weight="duotone" />
        </div>
        <div>
          <p class="text-sm text-white/50 mb-1">Despesas Mes</p>
          <p class="text-2xl font-bold">R$ 8.350,00</p>
        </div>
      </div>
      
      <div class="bg-surface rounded-xl p-6 border border-white/5 shadow-md flex items-center gap-4 hover:-translate-y-px transition-transform cursor-pointer">
        <div class="w-12 h-12 rounded-full bg-blue-400/20 flex items-center justify-center text-blue-400">
          <PhTrendUp :size="24" weight="duotone" />
        </div>
        <div>
          <p class="text-sm text-white/50 mb-1">Balanço</p>
          <p class="text-2xl font-bold">R$ 6.150,00</p>
        </div>
      </div>
      
    </div>
    
    <!-- Chart placeholding -->
    <div class="bg-surface rounded-xl p-6 border border-white/5 shadow-md h-80 flex items-center justify-center">
      <p class="text-white/50">Gráficos de evolução serão carregados aqui...</p>
    </div>
  </div>
</template>

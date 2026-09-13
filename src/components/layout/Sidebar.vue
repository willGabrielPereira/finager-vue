<script setup lang="ts">
import { 
  PhSquaresFour, 
  PhListDashes, 
  PhBank,
  PhUploadSimple, 
  PhTag, 
  PhUser, 
  PhPlus,
  PhWallet
} from '@phosphor-icons/vue'
import { useRoute } from 'vue-router'

defineEmits<{
  (e: 'new-transaction'): void
  (e: 'import-ofx'): void
}>()

const route = useRoute()

const navItems = [
  { name: 'Dashboard', path: '/', icon: PhSquaresFour },
  { name: 'Transações', path: '/transactions', icon: PhListDashes },
  { name: 'Contas Bancárias', path: '/accounts', icon: PhBank },
  { name: 'Importar OFX', path: '/import', icon: PhUploadSimple },
  { name: 'Categorias & Tags', path: '/tags', icon: PhTag },
  { name: 'Meu Perfil', path: '/profile', icon: PhUser },
]
</script>

<template>
  <aside class="hidden md:flex w-64 bg-surface border-r border-white/5 flex-col transition-all duration-300 select-none">
    <!-- Logo -->
    <div class="h-16 flex items-center px-6 border-b border-white/5">
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-lg bg-accent/20 border border-accent/40 flex items-center justify-center text-accent">
          <PhWallet :size="18" weight="duotone" />
        </div>
        <h2 class="text-lg font-bold bg-gradient-to-r from-accent via-emerald-400 to-teal-300 bg-clip-text text-transparent">
          Finager
        </h2>
      </div>
    </div>

    <!-- Ação Rápida no Desktop -->
    <div class="p-4 border-b border-white/5 flex flex-col gap-2">
      <button
        type="button"
        @click="$emit('new-transaction')"
        class="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-accent text-bg font-bold text-xs hover:opacity-90 transition-all cursor-pointer shadow-lg shadow-accent/15"
      >
        <PhPlus :size="16" weight="bold" />
        <span>Novo Lançamento</span>
      </button>
    </div>

    <!-- Navegação -->
    <nav class="flex-1 px-3 py-4 flex flex-col gap-1">
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs transition-all duration-150 font-medium"
        :class="route.path === item.path 
          ? 'bg-accent/15 text-accent font-semibold shadow-sm' 
          : 'text-white/60 hover:bg-white/5 hover:text-white'"
      >
        <component 
          :is="item.icon" 
          :size="18" 
          :weight="route.path === item.path ? 'duotone' : 'regular'" 
        />
        <span>{{ item.name }}</span>
      </router-link>
    </nav>
  </aside>
</template>

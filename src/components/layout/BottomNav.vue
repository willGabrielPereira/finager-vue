<script setup lang="ts">
import { useRoute } from 'vue-router'
import { 
  PhSquaresFour, 
  PhListDashes, 
  PhPlus, 
  PhTag, 
  PhUser
} from '@phosphor-icons/vue'

defineEmits<{
  (e: 'open-action-menu'): void
}>()

const route = useRoute()

const navItems = [
  { name: 'Início', path: '/', icon: PhSquaresFour },
  { name: 'Extrato', path: '/transactions', icon: PhListDashes },
  { name: 'Tags', path: '/tags', icon: PhTag },
  { name: 'Perfil', path: '/profile', icon: PhUser },
]
</script>

<template>
  <nav class="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-xl border-t border-white/10 px-3 py-1.5 flex items-center justify-around safe-area-pb">
    <!-- Item 1: Início -->
    <router-link
      :to="navItems[0].path"
      class="flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all"
      :class="route.path === navItems[0].path ? 'text-accent font-semibold' : 'text-white/50 hover:text-white'"
    >
      <component :is="navItems[0].icon" :size="20" :weight="route.path === navItems[0].path ? 'fill' : 'regular'" />
      <span class="text-[10px]">{{ navItems[0].name }}</span>
    </router-link>

    <!-- Item 2: Extrato -->
    <router-link
      :to="navItems[1].path"
      data-tour="bottom-nav-transactions"
      class="flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all"
      :class="route.path === navItems[1].path ? 'text-accent font-semibold' : 'text-white/50 hover:text-white'"
    >
      <component :is="navItems[1].icon" :size="20" :weight="route.path === navItems[1].path ? 'fill' : 'regular'" />
      <span class="text-[10px]">{{ navItems[1].name }}</span>
    </router-link>

    <!-- Botão Central Flutuante (+) -->
    <button
      type="button"
      @click="$emit('open-action-menu')"
      data-tour="mobile-action-btn"
      class="w-12 h-12 -mt-5 rounded-full bg-accent text-bg shadow-lg shadow-accent/25 flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-transform"
      title="Ações Rápidas"
    >
      <PhPlus :size="24" weight="bold" />
    </button>

    <!-- Item 3: Tags -->
    <router-link
      :to="navItems[2].path"
      class="flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all"
      :class="route.path === navItems[2].path ? 'text-accent font-semibold' : 'text-white/50 hover:text-white'"
    >
      <component :is="navItems[2].icon" :size="20" :weight="route.path === navItems[2].path ? 'fill' : 'regular'" />
      <span class="text-[10px]">{{ navItems[2].name }}</span>
    </router-link>

    <!-- Item 4: Perfil -->
    <router-link
      :to="navItems[3].path"
      data-tour="bottom-nav-profile"
      class="flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all"
      :class="route.path === navItems[3].path ? 'text-accent font-semibold' : 'text-white/50 hover:text-white'"
    >
      <component :is="navItems[3].icon" :size="20" :weight="route.path === navItems[3].path ? 'fill' : 'regular'" />
      <span class="text-[10px]">{{ navItems[3].name }}</span>
    </router-link>
  </nav>
</template>

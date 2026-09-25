<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  PhSquaresFour,
  PhListDashes,
  PhPlus,
  PhTag,
  PhDotsThreeOutline
} from '@phosphor-icons/vue'

defineEmits<{
  (e: 'open-action-menu'): void
  (e: 'open-more-menu'): void
}>()

const route = useRoute()

// Frequência de uso: Início/Transações (diário), "+" (lançar/importar), Categorias (periódico).
// Telas raras (Perfil, Contas, Regras, Plano) ficam em "Mais".
const leftItems = [
  { name: 'Início', path: '/', icon: PhSquaresFour },
  { name: 'Transações', path: '/transactions', icon: PhListDashes, tour: 'bottom-nav-transactions' },
]

const morePaths = ['/profile', '/accounts', '/tag-rules', '/billing']
const isMoreActive = computed(() => morePaths.includes(route.path))

const itemClass = (active: boolean) =>
  active ? 'text-accent font-semibold' : 'text-white/60 hover:text-white'
</script>

<template>
  <nav
    aria-label="Navegação principal"
    class="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-xl border-t border-white/10 px-2 pt-1.5 flex items-center justify-around"
    style="padding-bottom: max(0.375rem, env(safe-area-inset-bottom))"
  >
    <router-link
      v-for="item in leftItems"
      :key="item.path"
      :to="item.path"
      :data-tour="item.tour"
      :aria-current="route.path === item.path ? 'page' : undefined"
      class="flex flex-col items-center gap-1 py-1.5 min-w-[64px] rounded-xl transition-all"
      :class="itemClass(route.path === item.path)"
    >
      <component :is="item.icon" :size="22" :weight="route.path === item.path ? 'fill' : 'regular'" />
      <span class="text-[11px]">{{ item.name }}</span>
    </router-link>

    <!-- Botão Central Flutuante (+) -->
    <button
      type="button"
      @click="$emit('open-action-menu')"
      data-tour="mobile-action-btn"
      class="w-14 h-14 -mt-6 rounded-full bg-accent text-bg shadow-lg shadow-accent/25 flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
      aria-label="Novo lançamento ou importar"
    >
      <PhPlus :size="26" weight="bold" />
    </button>

    <router-link
      to="/tags"
      :aria-current="route.path === '/tags' ? 'page' : undefined"
      class="flex flex-col items-center gap-1 py-1.5 min-w-[64px] rounded-xl transition-all"
      :class="itemClass(route.path === '/tags')"
    >
      <PhTag :size="22" :weight="route.path === '/tags' ? 'fill' : 'regular'" />
      <span class="text-[11px]">Categorias</span>
    </router-link>

    <button
      type="button"
      @click="$emit('open-more-menu')"
      data-tour="bottom-nav-more"
      class="flex flex-col items-center gap-1 py-1.5 min-w-[64px] rounded-xl transition-all cursor-pointer"
      :class="itemClass(isMoreActive)"
    >
      <PhDotsThreeOutline :size="22" :weight="isMoreActive ? 'fill' : 'regular'" />
      <span class="text-[11px]">Mais</span>
    </button>
  </nav>
</template>

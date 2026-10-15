<script setup lang="ts">
// Shell dedicado à área administrativa: propositalmente diferente do AppLayout
// (sem Sidebar/Topbar/BottomNav) para deixar claro que é outro contexto.
import { PhShieldCheck, PhSignOut } from '@phosphor-icons/vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { useAdminAuthStore } from '../../stores/adminAuth'

const router = useRouter()
const adminAuthStore = useAdminAuthStore()
const auth = useAuthStore()

// Sair do painel apaga a elevação imediatamente — não deixa o token de 15min vivo
// em memória enquanto o admin usa o app comum depois de "sair".
function sair() {
  adminAuthStore.clear()
  router.push('/')
}
</script>

<template>
  <div class="flex flex-col h-screen h-[100dvh] bg-bg text-white overflow-hidden font-sans">
    <!-- Cabeçalho fixo com accent âmbar (diferente do verde do app comum) -->
    <header class="flex items-center justify-between gap-3 px-4 md:px-6 h-14 shrink-0 bg-surface border-b border-amber-400/30">
      <div class="flex items-center gap-2 text-amber-400 font-bold text-sm">
        <PhShieldCheck :size="20" weight="fill" />
        <span>Painel Administrativo</span>
      </div>

      <nav class="flex items-center gap-4 ml-auto text-xs font-semibold">
        <router-link to="/admin" class="text-white/60 hover:text-white transition-colors">Painel</router-link>
        <router-link v-if="auth.isAdmin" to="/admin/changelog" class="text-white/60 hover:text-white transition-colors">Novidades</router-link>
      </nav>

      <button
        type="button"
        @click="sair"
        class="flex items-center gap-1.5 text-white/60 hover:text-white text-xs font-semibold transition-colors"
      >
        <PhSignOut :size="16" />
        <span>Sair do painel administrativo</span>
      </button>
    </header>

    <main class="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth custom-scrollbar">
      <slot></slot>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { PhSignOut, PhUserCircle, PhWallet, PhCrown, PhLightning } from '@phosphor-icons/vue'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

onMounted(() => {
  if (!authStore.user && authStore.isAuthenticated) {
    authStore.fetchMe()
  }
})

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}
</script>

<template>
  <header class="h-16 bg-surface/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
    <!-- Brand on Mobile -->
    <div class="flex items-center gap-2 md:hidden" data-tour="brand-mobile">
      <div class="w-8 h-8 rounded-lg bg-accent/20 border border-accent/40 flex items-center justify-center text-accent">
        <PhWallet :size="18" weight="duotone" />
      </div>
      <span class="text-base font-bold bg-gradient-to-r from-accent to-emerald-400 bg-clip-text text-transparent">
        Finager
      </span>
    </div>

    <!-- Desktop Title / Breadcrumb -->
    <div class="hidden md:flex items-center gap-2 text-xs text-white/50">
      <span>Gestão Financeira Familiar</span>
    </div>

    <!-- Right Side: Plan Badge, User and Logout -->
    <div class="flex items-center gap-2.5">
      <!-- Badge de Plano no Topbar -->
      <router-link
        to="/billing"
        class="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border transition-all cursor-pointer"
        :class="authStore.user?.plan === 'PRO' || authStore.user?.plan === 'LIFETIME_FREE' 
          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25' 
          : 'bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-white/10'"
        title="Gerenciar Plano & Assinatura"
      >
        <component 
          :is="authStore.user?.plan === 'PRO' || authStore.user?.plan === 'LIFETIME_FREE' ? PhCrown : PhLightning" 
          :size="13" 
          class="shrink-0"
          :class="authStore.user?.plan === 'PRO' || authStore.user?.plan === 'LIFETIME_FREE' ? 'text-emerald-400' : 'text-accent'"
          weight="fill"
        />
        <span class="font-semibold">{{ authStore.user?.plan === 'PRO' || authStore.user?.plan === 'LIFETIME_FREE' ? 'PRO' : 'FREE' }}</span>
      </router-link>

      <router-link
        to="/profile"
        class="flex items-center gap-2 text-xs text-white/80 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full border border-white/5 transition-all cursor-pointer group"
        title="Ver meu perfil"
        aria-label="Ver meu perfil"
      >
        <PhUserCircle :size="18" weight="duotone" class="text-accent group-hover:scale-105 transition-transform" />
        <span class="hidden sm:inline font-medium max-w-[120px] truncate">{{ authStore.user?.login || 'Usuário' }}</span>
      </router-link>

      <button 
        @click="handleLogout" 
        class="p-2 rounded-xl text-white/50 hover:text-red-400 hover:bg-red-400/10 transition-all cursor-pointer" 
        title="Sair da conta"
        aria-label="Sair da conta"
      >
        <PhSignOut :size="18" />
      </button>
    </div>
  </header>
</template>
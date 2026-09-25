<script setup lang="ts">
import { onMounted } from 'vue'
import { 
  PhSquaresFour, 
  PhListDashes, 
  PhBank, 
  PhUploadSimple, 
  PhTag, 
  PhUser, 
  PhPlus,
  PhWallet,
  PhFileText,
  PhSparkle,
  PhCrown,
  PhLightning,
  PhListChecks
} from '@phosphor-icons/vue'
import { useRoute } from 'vue-router'
import { useBillingStore } from '../../stores/billing'

defineEmits<{
  (e: 'new-transaction'): void
  (e: 'import-ofx'): void
  (e: 'open-ofx-guide'): void
  (e: 'open-tour'): void
}>()

const route = useRoute()
const billingStore = useBillingStore()

onMounted(() => {
  if (!billingStore.planStatus) {
    billingStore.fetchPlan()
  }
})

const navItems = [
  { name: 'Dashboard', path: '/', icon: PhSquaresFour, tour: 'nav-dashboard' },
  { name: 'Transações', path: '/transactions', icon: PhListDashes, tour: 'nav-transactions' },
  { name: 'Contas Bancárias', path: '/accounts', icon: PhBank, tour: 'nav-accounts' },
  { name: 'Categorias', path: '/tags', icon: PhTag, tour: 'nav-tags' },
  { name: 'Regras Automáticas', path: '/tag-rules', icon: PhListChecks, tour: 'nav-tag-rules' },
  { name: 'Plano & Cobrança', path: '/billing', icon: PhCrown, tour: 'nav-billing' },
  { name: 'Meu Perfil', path: '/profile', icon: PhUser, tour: 'nav-profile' },
]
</script>

<template>
  <aside class="hidden md:flex w-64 bg-surface border-r border-white/5 flex-col transition-all duration-300 select-none">
    <!-- Logo -->
    <div class="h-16 flex items-center px-6 border-b border-white/5" data-tour="brand">
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-lg bg-accent/20 border border-accent/40 flex items-center justify-center text-accent">
          <PhWallet :size="18" weight="duotone" />
        </div>
        <h2 class="text-lg font-bold bg-gradient-to-r from-accent via-emerald-400 to-teal-300 bg-clip-text text-transparent">
          Finager
        </h2>
      </div>
    </div>

    <!-- Ações Rápidas no Desktop -->
    <div class="p-4 border-b border-white/5 flex flex-col gap-2">
      <button
        type="button"
        @click="$emit('new-transaction')"
        data-tour="new-tx-btn"
        class="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-accent text-bg font-bold text-xs hover:opacity-90 transition-all cursor-pointer shadow-lg shadow-accent/15"
      >
        <PhPlus :size="16" weight="bold" />
        <span>Novo Lançamento</span>
      </button>
      <button
        type="button"
        @click="$emit('import-ofx')"
        data-tour="sidebar-import-btn"
        class="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white/5 border border-white/10 text-white font-semibold text-xs hover:bg-white/10 transition-all cursor-pointer"
      >
        <PhUploadSimple :size="16" />
        <span>Importar OFX</span>
      </button>
    </div>

    <!-- Navegação Principal -->
    <nav class="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto custom-scrollbar">
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        :data-tour="item.tour"
        :aria-current="route.path === item.path ? 'page' : undefined"
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

    <!-- Widget de Status do Plano no Rodapé da Sidebar -->
    <div class="px-3 py-2 border-t border-white/5">
      <router-link
        to="/billing"
        class="block p-3 rounded-xl bg-bg/60 hover:bg-bg border border-white/5 hover:border-accent/30 transition-all group"
      >
        <div class="flex items-center justify-between mb-1.5">
          <div class="flex items-center gap-1.5">
            <component 
              :is="billingStore.isPro ? PhCrown : PhLightning" 
              :size="14" 
              class="shrink-0"
              :class="billingStore.isPro ? 'text-emerald-400' : 'text-accent'"
              weight="fill"
            />
            <span class="text-[11px] font-bold text-white group-hover:text-accent transition-colors">
              {{ billingStore.isPro ? 'Plano Pro' : 'Plano Free' }}
            </span>
          </div>
          <span 
            v-if="!billingStore.isPro" 
            class="text-[9px] font-bold bg-accent/20 text-accent px-1.5 py-0.5 rounded uppercase tracking-wider"
          >
            Upgrade
          </span>
          <span 
            v-else 
            class="text-[9px] font-bold bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded"
          >
            Ativo
          </span>
        </div>

        <div v-if="!billingStore.isPro" class="space-y-1">
          <div class="flex items-center justify-between text-[10px] text-white/50">
            <span>Contas conectadas</span>
            <span :class="billingStore.isAccountsLimitReached ? 'text-rose-400 font-bold' : ''">
              {{ billingStore.accountsUsed }}/{{ billingStore.accountsLimit }}
            </span>
          </div>
          <div class="w-full h-1 bg-white/10 rounded-full overflow-hidden">
            <div 
              class="h-full rounded-full transition-all"
              :class="billingStore.isAccountsLimitReached ? 'bg-rose-500' : 'bg-accent'"
              :style="{ width: `${billingStore.accountsUsagePercent}%` }"
            ></div>
          </div>
        </div>
        <div v-else class="text-[10px] text-white/50 flex items-center justify-between">
          <span>Recursos ilimitados</span>
          <span class="text-emerald-400 font-medium">100%</span>
        </div>
      </router-link>
    </div>

    <!-- Ajuda & Onboarding no Rodapé da Sidebar -->
    <div class="p-3 border-t border-white/5 flex flex-col gap-1">
      <button
        type="button"
        @click="$emit('open-ofx-guide')"
        class="flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs text-white/50 hover:text-white hover:bg-white/5 transition-all cursor-pointer font-medium text-left"
        title="Ver passo a passo de como baixar extratos OFX nos bancos"
      >
        <PhFileText :size="16" class="text-accent" />
        <span>Guia de Bancos OFX</span>
      </button>

      <button
        type="button"
        @click="$emit('open-tour')"
        class="flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs text-white/50 hover:text-white hover:bg-white/5 transition-all cursor-pointer font-medium text-left"
        title="Rever o tour interativo com explicação dos recursos"
      >
        <PhSparkle :size="16" class="text-amber-400" />
        <span>Tour de Boas-Vindas</span>
      </button>
    </div>
  </aside>
</template>
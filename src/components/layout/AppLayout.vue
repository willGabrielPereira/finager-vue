<script setup lang="ts">
import { ref, provide, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import Sidebar from './Sidebar.vue'
import Topbar from './Topbar.vue'
import BottomNav from './BottomNav.vue'
import CreateTransactionModal from '../ui/CreateTransactionModal.vue'
import ImportOFXModal from '../ui/ImportOFXModal.vue'
import OFXGuideModal from '../ui/OFXGuideModal.vue'
import { PhPlus, PhUploadSimple, PhBank, PhX, PhFileText, PhSparkle } from '@phosphor-icons/vue'
import { useTransactionsStore } from '../../stores/transactions'
import { useAuthStore } from '../../stores/auth'
import { startInteractiveTour } from '../../utils/tour'

const router = useRouter()
const txStore = useTransactionsStore()
const authStore = useAuthStore()

const isCreateTxModalOpen = ref(false)
const isImportModalOpen = ref(false)
const isMobileActionSheetOpen = ref(false)
const isOFXGuideOpen = ref(false)
const ofxGuideBank = ref('')

const openCreateTx = () => {
  isMobileActionSheetOpen.value = false
  isCreateTxModalOpen.value = true
}

const openImport = () => {
  isMobileActionSheetOpen.value = false
  isImportModalOpen.value = true
}

const openAccounts = () => {
  isMobileActionSheetOpen.value = false
  router.push('/accounts')
}

const openOFXGuide = (bankName?: string) => {
  isMobileActionSheetOpen.value = false
  ofxGuideBank.value = bankName || ''
  isOFXGuideOpen.value = true
}

// Inicia o Tour Interativo (Driver.js / TourGuideJS style)
const triggerTour = () => {
  isMobileActionSheetOpen.value = false
  startInteractiveTour(router, async () => {
    // Ao concluir ou fechar o tour, salva onboarding_completed = true no backend
    if (authStore.user && !authStore.user.onboarding_completed) {
      await authStore.updateOnboarding(true, 1)
    }
  })
}

// Provide global para componentes filhos abrirem de qualquer lugar
provide('openOFXGuide', openOFXGuide)
provide('openTour', () => triggerTour())
provide('openCreateTx', openCreateTx)
provide('openImport', openImport)

// Verifica se é o primeiro login do usuário
const checkFirstTimeTour = () => {
  if (authStore.user && authStore.user.onboarding_completed === false) {
    if (!sessionStorage.getItem('finager_tour_started')) {
      sessionStorage.setItem('finager_tour_started', 'true')
      // Aguarda 600ms para layout, fontes e DOM estarem totalmente prontos
      setTimeout(() => {
        triggerTour()
      }, 600)
    }
  }
}

onMounted(async () => {
  if (authStore.isAuthenticated && !authStore.user) {
    await authStore.fetchMe()
  }
  checkFirstTimeTour()
})

watch(() => authStore.user, (user) => {
  if (user) {
    checkFirstTimeTour()
  }
})

const onTxCreated = () => {
  txStore.fetchTransactions()
}

const onOFXImported = () => {
  txStore.fetchTransactions()
}
</script>

<template>
  <div class="flex h-screen bg-bg text-white overflow-hidden font-sans">
    <!-- Desktop Sidebar -->
    <Sidebar 
      @new-transaction="openCreateTx"
      @import-ofx="openImport"
      @open-ofx-guide="openOFXGuide()"
      @open-tour="triggerTour()"
    />

    <!-- Main Content Area -->
    <div class="flex flex-col flex-1 overflow-hidden min-w-0">
      <Topbar @import-ofx="openImport" />

      <main class="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6 scroll-smooth custom-scrollbar">
        <slot></slot>
      </main>
    </div>

    <!-- Mobile Bottom Navigation -->
    <BottomNav @open-action-menu="isMobileActionSheetOpen = true" />

    <!-- Mobile Action Sheet (Ao clicar no '+' da barra inferior) -->
    <div
      v-if="isMobileActionSheetOpen"
      class="fixed inset-0 z-[10000] bg-slate-950/80 backdrop-blur-sm flex items-end md:hidden animate-in fade-in duration-150"
      @click="isMobileActionSheetOpen = false"
    >
      <div 
        class="w-full bg-surface border-t border-white/10 rounded-t-3xl p-5 flex flex-col gap-3 animate-in slide-in-from-bottom duration-200 max-h-[85vh] overflow-y-auto"
        @click.stop
      >
        <div class="w-12 h-1 bg-white/20 rounded-full mx-auto mb-1"></div>
        <div class="flex items-center justify-between pb-2 border-b border-white/10">
          <h3 class="text-sm font-bold text-white">Ações Rápidas & Ajuda</h3>
          <button @click="isMobileActionSheetOpen = false" class="text-white/40 p-1">
            <PhX :size="18" />
          </button>
        </div>

        <button
          type="button"
          @click="openCreateTx"
          class="flex items-center gap-3 p-3 rounded-2xl bg-accent/15 border border-accent/30 text-accent font-bold text-xs hover:bg-accent/20 transition-colors cursor-pointer text-left"
        >
          <div class="w-9 h-9 rounded-xl bg-accent text-bg flex items-center justify-center">
            <PhPlus :size="20" weight="bold" />
          </div>
          <div>
            <div>Novo Lançamento Manual</div>
            <div class="text-[10px] text-white/50 font-normal">Cadastre uma despesa avulsa ou prevista</div>
          </div>
        </button>

        <button
          type="button"
          @click="openImport"
          class="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-xs hover:bg-white/10 transition-colors cursor-pointer text-left"
        >
          <div class="w-9 h-9 rounded-xl bg-white/10 text-white flex items-center justify-center">
            <PhUploadSimple :size="20" />
          </div>
          <div>
            <div>Importar Arquivo OFX</div>
            <div class="text-[10px] text-white/50 font-normal">Extrato bancário ou fatura de cartão</div>
          </div>
        </button>

        <button
          type="button"
          @click="openAccounts"
          class="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-xs hover:bg-white/10 transition-colors cursor-pointer text-left"
        >
          <div class="w-9 h-9 rounded-xl bg-white/10 text-accent flex items-center justify-center">
            <PhBank :size="20" weight="duotone" />
          </div>
          <div>
            <div>Gerenciar Contas Bancárias</div>
            <div class="text-[10px] text-white/50 font-normal">Contas correntes, cartões e privacidade</div>
          </div>
        </button>

        <div class="border-t border-white/5 pt-2 flex flex-col gap-1.5">
          <button
            type="button"
            @click="openOFXGuide()"
            class="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 text-white/70 hover:text-white text-xs transition-colors cursor-pointer text-left"
          >
            <PhFileText :size="18" class="text-accent" />
            <span>Guia: Como baixar OFX no seu banco</span>
          </button>

          <button
            type="button"
            @click="triggerTour()"
            class="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 text-white/70 hover:text-white text-xs transition-colors cursor-pointer text-left"
          >
            <PhSparkle :size="18" class="text-amber-400" />
            <span>Rever Tour de Boas-Vindas</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Modais Globais -->
    <CreateTransactionModal 
      :is-open="isCreateTxModalOpen"
      @close="isCreateTxModalOpen = false"
      @created="onTxCreated"
    />

    <ImportOFXModal 
      :is-open="isImportModalOpen"
      @close="isImportModalOpen = false"
      @imported="onOFXImported"
    />

    <OFXGuideModal
      :is-open="isOFXGuideOpen"
      :initial-bank="ofxGuideBank"
      @close="isOFXGuideOpen = false"
      @import="openImport"
    />
  </div>
</template>

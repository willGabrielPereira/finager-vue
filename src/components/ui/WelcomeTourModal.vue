<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { 
  PhX, 
  PhSparkle, 
  PhSquaresFour, 
  PhListDashes, 
  PhBank, 
  PhTag, 
  PhFileText, 
  PhShieldCheck, 
  PhUsers, 
  PhArrowRight, 
  PhArrowLeft, 
  PhCheckCircle,
  PhWallet
} from '@phosphor-icons/vue'

defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'open-ofx-guide'): void
  (e: 'open-new-account'): void
}>()

const authStore = useAuthStore()
const currentStep = ref(1)
const totalSteps = 3

const handleNext = () => {
  if (currentStep.value < totalSteps) {
    currentStep.value++
  } else {
    handleFinish()
  }
}

const handlePrev = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const handleFinish = async () => {
  await authStore.updateOnboarding(true, 1)
  emit('close')
}

const handleCloseWithoutSaving = () => {
  emit('close')
}

const handleOpenOFXGuide = () => {
  emit('open-ofx-guide')
}
</script>

<template>
  <div 
    v-if="isOpen"
    class="fixed inset-0 z-[10040] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200 select-none"
    @click="handleCloseWithoutSaving"
  >
    <div 
      class="w-full max-w-xl bg-surface border border-white/10 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
      @click.stop
    >
      <!-- Top Bar com Indicador de Passos -->
      <div class="px-5 py-4 sm:px-6 sm:py-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-accent/20 border border-accent/40 flex items-center justify-center text-accent">
            <PhWallet :size="18" weight="duotone" />
          </div>
          <span class="text-sm font-bold text-white">Bem-vindo ao Finager</span>
        </div>

        <div class="flex items-center gap-3">
          <div class="flex items-center gap-1.5">
            <div 
              v-for="i in totalSteps" 
              :key="i"
              class="w-2 h-2 rounded-full transition-all duration-300"
              :class="i === currentStep ? 'w-6 bg-accent' : (i < currentStep ? 'bg-accent/40' : 'bg-white/15')"
            ></div>
          </div>
          <button 
            @click="handleCloseWithoutSaving" 
            class="text-white/40 hover:text-white p-1 rounded-lg transition-colors cursor-pointer ml-1"
            title="Pular tour"
          >
            <PhX :size="18" />
          </button>
        </div>
      </div>

      <!-- Conteúdo do Slide -->
      <div class="p-6 sm:p-8 flex flex-col min-h-[340px] justify-between">
        <!-- SLIDE 1: Objetivo e Telas Principais -->
        <div v-if="currentStep === 1" class="flex flex-col gap-4 animate-in fade-in duration-200">
          <div class="flex items-center gap-2 text-accent text-xs font-bold uppercase tracking-wider">
            <PhSparkle :size="16" weight="fill" />
            <span>Passo 1 de 3 • Conhecendo o Sistema</span>
          </div>

          <h3 class="text-lg sm:text-xl font-bold text-white leading-snug">
            Controle financeiro inteligente para você e sua família.
          </h3>
          <p class="text-xs sm:text-sm text-white/70 leading-relaxed">
            O Finager foi projetado para transformar extratos confusos em relatórios visuais cristalinos, sem pedir a senha do seu banco.
          </p>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2">
            <div class="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-start gap-2.5">
              <PhSquaresFour :size="20" class="text-accent shrink-0 mt-0.5" />
              <div>
                <span class="text-xs font-bold text-white block">Dashboard</span>
                <span class="text-[11px] text-white/50">Resumo de receitas, despesas e gráfico de gastos.</span>
              </div>
            </div>

            <div class="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-start gap-2.5">
              <PhListDashes :size="20" class="text-blue-400 shrink-0 mt-0.5" />
              <div>
                <span class="text-xs font-bold text-white block">Transações</span>
                <span class="text-[11px] text-white/50">Extrato completo categorizado automaticamente.</span>
              </div>
            </div>

            <div class="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-start gap-2.5">
              <PhBank :size="20" class="text-purple-400 shrink-0 mt-0.5" />
              <div>
                <span class="text-xs font-bold text-white block">Contas Bancárias</span>
                <span class="text-[11px] text-white/50">Contas conjuntas ou privadas para cada membro.</span>
              </div>
            </div>

            <div class="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-start gap-2.5">
              <PhTag :size="20" class="text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span class="text-xs font-bold text-white block">Classificador Inteligente</span>
                <span class="text-[11px] text-white/50">Aprende seus hábitos e categoriza despesas recorrentes.</span>
              </div>
            </div>
          </div>
        </div>

        <!-- SLIDE 2: O que é OFX e Segurança -->
        <div v-else-if="currentStep === 2" class="flex flex-col gap-4 animate-in fade-in duration-200">
          <div class="flex items-center gap-2 text-accent text-xs font-bold uppercase tracking-wider">
            <PhShieldCheck :size="16" weight="fill" />
            <span>Passo 2 de 3 • A Mágica do OFX</span>
          </div>

          <h3 class="text-lg sm:text-xl font-bold text-white leading-snug">
            Por que nós não pedimos a senha do seu banco?
          </h3>
          <p class="text-xs sm:text-sm text-white/70 leading-relaxed">
            Muitos apps exigem que você digite sua senha bancária. Nós escolhemos a <strong>segurança absoluta</strong>: você baixa o extrato oficial em formato <strong>.OFX</strong> no site ou app do seu banco e sobe aqui com 1 clique.
          </p>

          <div class="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex flex-col gap-3">
            <div class="flex items-center gap-2.5 text-xs text-white/90">
              <PhCheckCircle :size="18" weight="fill" class="text-accent shrink-0" />
              <span><strong>Apenas leitura:</strong> O arquivo OFX contém somente valores, datas e descrições.</span>
            </div>
            <div class="flex items-center gap-2.5 text-xs text-white/90">
              <PhCheckCircle :size="18" weight="fill" class="text-accent shrink-0" />
              <span><strong>Zero riscos:</strong> Ninguém pode movimentar sua conta ou ver seus dados de acesso.</span>
            </div>
          </div>

          <div class="mt-1">
            <button
              type="button"
              @click="handleOpenOFXGuide"
              class="w-full py-2.5 px-4 rounded-xl bg-accent/15 border border-accent/30 text-accent font-bold text-xs hover:bg-accent/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <PhFileText :size="16" weight="duotone" />
              <span>Ver passo a passo de como baixar no seu banco (Nubank, Inter, Itaú, etc.)</span>
            </button>
          </div>
        </div>

        <!-- SLIDE 3: Família e Comece Agora -->
        <div v-else class="flex flex-col gap-4 animate-in fade-in duration-200">
          <div class="flex items-center gap-2 text-accent text-xs font-bold uppercase tracking-wider">
            <PhUsers :size="16" weight="fill" />
            <span>Passo 3 de 3 • Sua Família & Primeiros Passos</span>
          </div>

          <h3 class="text-lg sm:text-xl font-bold text-white leading-snug">
            Tudo pronto para organizar sua vida financeira!
          </h3>
          <p class="text-xs sm:text-sm text-white/70 leading-relaxed">
            Seu espaço já está criado. Você pode usar o Finager sozinho ou, quando quiser, convidar quem divide as contas com você (cônjuge, filhos) através da tela de <strong>Meu Perfil</strong>.
          </p>

          <div class="p-4 rounded-2xl bg-accent/10 border border-accent/20 flex flex-col gap-2">
            <span class="text-xs font-bold text-white flex items-center gap-2">
              <PhSparkle :size="16" class="text-accent" />
              <span>Próximos passos recomendados:</span>
            </span>
            <ul class="text-xs text-white/80 space-y-1.5 pl-1">
              <li>1. Cadastre sua primeira <strong>Conta Bancária</strong> (ex: Nubank, Inter).</li>
              <li>2. Importe seu primeiro <strong>extrato OFX</strong> do mês.</li>
              <li>3. Acompanhe os gastos categorizados na Dashboard!</li>
            </ul>
          </div>
        </div>

        <!-- Barra Inferior de Navegação -->
        <div class="pt-6 border-t border-white/10 flex items-center justify-between gap-3 mt-4">
          <button
            v-if="currentStep > 1"
            type="button"
            @click="handlePrev"
            class="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-xs font-medium transition-colors cursor-pointer"
          >
            <PhArrowLeft :size="14" />
            <span>Voltar</span>
          </button>
          <div v-else></div>

          <button
            type="button"
            @click="handleNext"
            class="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent text-bg text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer shadow-lg shadow-accent/20"
          >
            <span>{{ currentStep === totalSteps ? 'Começar a Usar!' : 'Avançar' }}</span>
            <PhArrowRight :size="14" weight="bold" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
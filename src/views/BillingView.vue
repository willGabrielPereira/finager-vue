<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useBillingStore } from '../stores/billing'
import { useAuthStore } from '../stores/auth'
import { 
  PhCrown, 
  PhSparkle, 
  PhCheck, 
  PhX, 
  PhBank, 
  PhUsers, 
  PhClockCounterClockwise, 
  PhLightning, 
  PhTicket, 
  PhShieldCheck, 
  PhArrowClockwise, 
  PhRocketLaunch,
  PhInfo,
  PhCheckCircle,
  PhWarningCircle
} from '@phosphor-icons/vue'

const billingStore = useBillingStore()
const authStore = useAuthStore()

const couponCode = ref('')
const couponSuccess = ref('')
const couponError = ref('')

const simulationMessage = ref('')
const simulationError = ref('')

onMounted(async () => {
  await Promise.all([
    billingStore.fetchPlan(),
    authStore.fetchMe()
  ])
})

const planBadgeInfo = computed(() => {
  const plan = billingStore.currentPlan
  if (plan === 'PRO') {
    return {
      label: 'Plano Pro',
      color: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
      icon: PhCrown,
      tagline: 'Acesso completo a todos os recursos avançados'
    }
  }
  if (plan === 'LIFETIME_FREE') {
    return {
      label: 'Lifetime Pro (Amigos & VIP)',
      color: 'bg-purple-500/15 border-purple-500/30 text-purple-300',
      icon: PhSparkle,
      tagline: 'Acesso vitalício irrestrito e perpétuo'
    }
  }
  return {
    label: 'Plano Gratuito (Free)',
    color: 'bg-blue-500/15 border-blue-500/30 text-blue-400',
    icon: PhLightning,
    tagline: 'Ideal para organização pessoal essencial'
  }
})

const handleSimulateUpgrade = async () => {
  simulationMessage.value = ''
  simulationError.value = ''
  try {
    const res = await billingStore.simulateUpgrade()
    simulationMessage.value = res.message || 'Upgrade para o plano Pro simulado com sucesso!'
    setTimeout(() => { simulationMessage.value = '' }, 4000)
  } catch (err: any) {
    simulationError.value = err.response?.data?.message || err.message || 'Falha ao simular upgrade.'
  }
}

const handleSimulateDowngrade = async () => {
  simulationMessage.value = ''
  simulationError.value = ''
  try {
    const res = await billingStore.simulateDowngrade()
    simulationMessage.value = res.message || 'Downgrade para o plano Free simulado com sucesso!'
    setTimeout(() => { simulationMessage.value = '' }, 4000)
  } catch (err: any) {
    simulationError.value = err.response?.data?.message || err.message || 'Falha ao simular downgrade.'
  }
}

const handleApplyCoupon = async () => {
  couponError.value = ''
  couponSuccess.value = ''
  if (!couponCode.value.trim()) {
    couponError.value = 'Digite o código do cupom.'
    return
  }

  try {
    const res = await billingStore.applyCoupon(couponCode.value.trim())
    couponSuccess.value = res.message || `Cupom aplicado! Plano concedido: ${res.plan_granted}`
    couponCode.value = ''
    setTimeout(() => { couponSuccess.value = '' }, 5000)
  } catch (err: any) {
    couponError.value = err.message || 'Cupom inválido ou expirado.'
  }
}
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8 select-none">
    
    <!-- Cabeçalho -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
      <div>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-accent/20 border border-accent/40 flex items-center justify-center text-accent">
            <PhCrown :size="22" weight="duotone" />
          </div>
          <div>
            <h1 class="text-xl sm:text-2xl font-bold text-white tracking-tight">Planos & Assinatura</h1>
            <p class="text-xs sm:text-sm text-white/50">
              Controle o plano da sua família, acompanhe quotas em tempo real e teste recursos.
            </p>
          </div>
        </div>
      </div>

      <!-- Badge do Plano Atual no Header -->
      <div 
        class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-semibold self-start sm:self-center"
        :class="planBadgeInfo.color"
      >
        <component :is="planBadgeInfo.icon" :size="16" weight="duotone" />
        <span>{{ planBadgeInfo.label }}</span>
      </div>
    </div>

    <!-- Feedback Global de Simulação -->
    <div v-if="simulationMessage" class="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs sm:text-sm flex items-center gap-3 animate-fade-in">
      <PhCheckCircle :size="20" weight="fill" class="shrink-0" />
      <span>{{ simulationMessage }}</span>
    </div>
    <div v-if="simulationError" class="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-center gap-3 animate-fade-in">
      <PhWarningCircle :size="20" weight="fill" class="shrink-0" />
      <span>{{ simulationError }}</span>
    </div>

    <!-- Card Principal: Status da Família & Limites de Quota -->
    <div class="bg-surface rounded-2xl p-6 sm:p-8 border border-white/5 shadow-xl relative overflow-hidden">
      <!-- Glow decorativo de fundo -->
      <div 
        class="absolute -right-16 -top-16 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-20"
        :class="billingStore.isPro ? 'bg-emerald-500' : 'bg-accent'"
      ></div>

      <div class="relative z-10 flex flex-col gap-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span class="text-xs font-bold uppercase tracking-wider text-accent">Plano da Família</span>
            <h2 class="text-2xl font-bold text-white mt-1 flex items-center gap-2.5">
              <span>{{ planBadgeInfo.label }}</span>
              <span v-if="billingStore.isPro" class="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium">
                Ativo
              </span>
            </h2>
            <p class="text-xs text-white/50 mt-1">{{ planBadgeInfo.tagline }}</p>
          </div>

          <!-- Status da Assinatura -->
          <div class="flex items-center gap-3">
            <div class="text-right">
              <span class="text-[11px] text-white/40 block">Status da Conta</span>
              <span class="text-xs font-semibold text-white capitalize">
                {{ billingStore.planStatus?.subscription_status || 'Ativo' }}
              </span>
            </div>
            <div class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
          </div>
        </div>

        <!-- Barras de Quota em Tempo Real -->
        <div class="pt-4 border-t border-white/5 grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <!-- Quota 1: Contas Bancárias -->
          <div class="p-4 rounded-xl bg-bg/60 border border-white/5 flex flex-col justify-between gap-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 text-white/80">
                <PhBank :size="18" class="text-accent" />
                <span class="text-xs font-semibold">Contas Bancárias</span>
              </div>
              <span class="text-xs font-bold" :class="billingStore.isAccountsLimitReached ? 'text-rose-400' : 'text-white'">
                <template v-if="billingStore.isAccountsUnlimited">
                  {{ billingStore.accountsUsed }} / ∞
                </template>
                <template v-else>
                  {{ billingStore.accountsUsed }} / {{ billingStore.accountsLimit }}
                </template>
              </span>
            </div>

            <!-- Barra de Progresso -->
            <div class="w-full h-2 rounded-full bg-white/10 overflow-hidden">
              <div 
                class="h-full transition-all duration-500 rounded-full"
                :class="billingStore.isAccountsLimitReached ? 'bg-rose-500' : 'bg-accent'"
                :style="{ width: billingStore.isAccountsUnlimited ? '20%' : `${billingStore.accountsUsagePercent}%` }"
              ></div>
            </div>

            <p class="text-[11px] text-white/40">
              <template v-if="billingStore.isAccountsUnlimited">
                Contas conectadas ilimitadas liberadas no seu plano.
              </template>
              <template v-else-if="billingStore.isAccountsLimitReached">
                Limite atingido. Faça upgrade para conectar novas contas.
              </template>
              <template v-else>
                Você pode cadastrar mais {{ billingStore.accountsLimit - billingStore.accountsUsed }} conta(s).
              </template>
            </p>
          </div>

          <!-- Quota 2: Membros da Família -->
          <div class="p-4 rounded-xl bg-bg/60 border border-white/5 flex flex-col justify-between gap-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 text-white/80">
                <PhUsers :size="18" class="text-accent" />
                <span class="text-xs font-semibold">Membros na Família</span>
              </div>
              <span class="text-xs font-bold" :class="billingStore.isMembersLimitReached ? 'text-rose-400' : 'text-white'">
                {{ billingStore.membersUsed }} / {{ billingStore.membersLimit }}
              </span>
            </div>

            <div class="w-full h-2 rounded-full bg-white/10 overflow-hidden">
              <div 
                class="h-full transition-all duration-500 rounded-full"
                :class="billingStore.isMembersLimitReached ? 'bg-rose-500' : 'bg-accent'"
                :style="{ width: `${billingStore.membersUsagePercent}%` }"
              ></div>
            </div>

            <p class="text-[11px] text-white/40">
              <template v-if="billingStore.isPro">
                Até 8 pessoas podem compartilhar a gestão financeira.
              </template>
              <template v-else-if="billingStore.isMembersLimitReached">
                Limite de 2 membros atingido no plano Free.
              </template>
              <template v-else>
                Espaço para convidar mais {{ billingStore.membersLimit - billingStore.membersUsed }} familiar.
              </template>
            </p>
          </div>

          <!-- Quota 3: Histórico de Transações -->
          <div class="p-4 rounded-xl bg-bg/60 border border-white/5 flex flex-col justify-between gap-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 text-white/80">
                <PhClockCounterClockwise :size="18" class="text-accent" />
                <span class="text-xs font-semibold">Histórico de Transações</span>
              </div>
              <span class="text-xs font-bold text-accent">
                {{ billingStore.isHistoryUnlimited ? 'Ilimitado' : '90 Dias' }}
              </span>
            </div>

            <div class="w-full h-2 rounded-full bg-white/10 overflow-hidden">
              <div 
                class="h-full bg-accent rounded-full"
                :style="{ width: billingStore.isHistoryUnlimited ? '100%' : '35%' }"
              ></div>
            </div>

            <p class="text-[11px] text-white/40">
              <template v-if="billingStore.isHistoryUnlimited">
                Extratos guardados permanentemente para comparativos.
              </template>
              <template v-else>
                Acesso aos últimos 3 meses no plano gratuito.
              </template>
            </p>
          </div>

        </div>
      </div>
    </div>

    <!-- Comparativo de Planos (Cards lado a lado) -->
    <div>
      <div class="text-center max-w-xl mx-auto mb-6">
        <h3 class="text-lg font-bold text-white">Compare os Planos</h3>
        <p class="text-xs text-white/50 mt-1">
          Transparência total nos recursos disponíveis em cada modalidade.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <!-- Card Free -->
        <div 
          class="rounded-2xl p-6 border flex flex-col justify-between transition-all"
          :class="billingStore.isFree 
            ? 'bg-surface border-blue-500/30 shadow-lg' 
            : 'bg-surface/50 border-white/5 opacity-80 hover:opacity-100'"
        >
          <div class="flex flex-col gap-4">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold uppercase tracking-wider text-white/50">Plano Gratuito</span>
              <span v-if="billingStore.isFree" class="text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full">
                Seu Plano Atual
              </span>
            </div>

            <div>
              <div class="flex items-baseline gap-1">
                <span class="text-3xl font-extrabold text-white">R$ 0</span>
                <span class="text-xs text-white/40">/mês para sempre</span>
              </div>
              <p class="text-xs text-white/60 mt-1">
                Perfeito para começar a organizar despesas essenciais.
              </p>
            </div>

            <ul class="space-y-3 pt-4 border-t border-white/5 text-xs text-white/70">
              <li class="flex items-center gap-2.5">
                <PhCheck :size="16" class="text-accent shrink-0" weight="bold" />
                <span>Até <strong>2 contas bancárias</strong> conectadas</span>
              </li>
              <li class="flex items-center gap-2.5">
                <PhCheck :size="16" class="text-accent shrink-0" weight="bold" />
                <span>Até <strong>2 membros</strong> na família (você + cônjuge)</span>
              </li>
              <li class="flex items-center gap-2.5">
                <PhCheck :size="16" class="text-accent shrink-0" weight="bold" />
                <span>Histórico de transações dos <strong>últimos 90 dias</strong></span>
              </li>
              <li class="flex items-center gap-2.5">
                <PhCheck :size="16" class="text-accent shrink-0" weight="bold" />
                <span>Importação ilimitada de arquivos <strong>OFX</strong></span>
              </li>
              <li class="flex items-center gap-2.5">
                <PhCheck :size="16" class="text-accent shrink-0" weight="bold" />
                <span>Classificador Inteligente <strong>Naive Bayes</strong></span>
              </li>
              <li class="flex items-center gap-2.5 text-white/30">
                <PhX :size="16" class="text-white/20 shrink-0" weight="bold" />
                <span>Relatórios comparativos plurianuais</span>
              </li>
            </ul>
          </div>

          <div class="mt-6 pt-4 border-t border-white/5">
            <button
              v-if="!billingStore.isFree"
              type="button"
              @click="handleSimulateDowngrade"
              :disabled="billingStore.actionLoading"
              class="w-full py-2.5 px-4 rounded-xl border border-white/10 hover:border-white/20 text-white/80 hover:text-white text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
            >
              Alternar para Plano Free
            </button>
            <div v-else class="text-center text-xs text-white/40 py-2">
              Plano base ativado
            </div>
          </div>
        </div>

        <!-- Card Pro -->
        <div 
          class="rounded-2xl p-6 border flex flex-col justify-between transition-all relative overflow-hidden"
          :class="billingStore.isPro 
            ? 'bg-surface border-emerald-500/40 shadow-xl shadow-emerald-500/5' 
            : 'bg-surface border-accent/30 shadow-lg'"
        >
          <!-- Badge Destaque -->
          <div class="absolute top-4 right-4">
            <span v-if="billingStore.isPro" class="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <PhCrown :size="12" weight="fill" />
              Seu Plano Atual
            </span>
            <span v-else class="text-[10px] font-bold bg-accent text-bg px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Recomendado
            </span>
          </div>

          <div class="flex flex-col gap-4">
            <div>
              <span class="text-xs font-bold uppercase tracking-wider text-emerald-400">Plano Pro</span>
              <div class="flex items-baseline gap-1 mt-1">
                <span class="text-3xl font-extrabold text-white">R$ 19,90</span>
                <span class="text-xs text-white/40">/mês (valor previsto)</span>
              </div>
              <p class="text-xs text-white/60 mt-1">
                Sem travas ou limites para famílias que desejam total controle financeiro.
              </p>
            </div>

            <ul class="space-y-3 pt-4 border-t border-white/5 text-xs text-white/80">
              <li class="flex items-center gap-2.5">
                <PhCheck :size="16" class="text-emerald-400 shrink-0" weight="bold" />
                <span><strong>Contas bancárias ilimitadas</strong> (corrente, cartão, corretoras)</span>
              </li>
              <li class="flex items-center gap-2.5">
                <PhCheck :size="16" class="text-emerald-400 shrink-0" weight="bold" />
                <span>Até <strong>8 membros</strong> conectados na família</span>
              </li>
              <li class="flex items-center gap-2.5">
                <PhCheck :size="16" class="text-emerald-400 shrink-0" weight="bold" />
                <span>Histórico de transações <strong>ilimitado</strong> (sem cortes de data)</span>
              </li>
              <li class="flex items-center gap-2.5">
                <PhCheck :size="16" class="text-emerald-400 shrink-0" weight="bold" />
                <span><strong>Relatórios comparativos</strong> mês a mês e plurianuais</span>
              </li>
              <li class="flex items-center gap-2.5">
                <PhCheck :size="16" class="text-emerald-400 shrink-0" weight="bold" />
                <span>Classificador de IA Naive Bayes e regras automáticas</span>
              </li>
              <li class="flex items-center gap-2.5">
                <PhCheck :size="16" class="text-emerald-400 shrink-0" weight="bold" />
                <span>Suporte prioritário e backup contínuo criptografado</span>
              </li>
            </ul>
          </div>

          <div class="mt-6 pt-4 border-t border-white/5">
            <button
              v-if="!billingStore.isPro"
              type="button"
              @click="handleSimulateUpgrade"
              :disabled="billingStore.actionLoading"
              class="w-full py-2.5 px-4 rounded-xl bg-accent text-bg font-bold text-xs hover:opacity-90 transition-all cursor-pointer shadow-lg shadow-accent/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <PhRocketLaunch :size="16" weight="bold" />
              <span>Fazer Upgrade para Pro (Simulado)</span>
            </button>
            <div v-else class="text-center text-xs text-emerald-400 font-semibold py-2 flex items-center justify-center gap-1.5">
              <PhCheckCircle :size="16" weight="fill" />
              <span>Você já possui todos os recursos desbloqueados!</span>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Seção Inferior: Cupons e Console de Testes (Mock) -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      
      <!-- Card Cupom Promocional -->
      <div class="bg-surface rounded-2xl p-6 border border-white/5 shadow-md flex flex-col justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 pb-3 border-b border-white/5">
            <PhTicket :size="18" class="text-accent" weight="duotone" />
            <h3 class="text-sm font-bold text-white">Resgatar Cupom Promocional</h3>
          </div>
          <p class="text-xs text-white/50 mt-3">
            Possui um código de desconto ou convite VIP? Digite abaixo para ativar o benefício imediatamente.
          </p>

          <form @submit.prevent="handleApplyCoupon" class="mt-4 flex gap-2">
            <input
              v-model="couponCode"
              type="text"
              placeholder="Ex: AMIGO100"
              class="flex-1 bg-bg border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white uppercase tracking-wider focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <button
              type="submit"
              :disabled="billingStore.actionLoading || !couponCode.trim()"
              class="py-2 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-all cursor-pointer disabled:opacity-40"
            >
              Aplicar
            </button>
          </form>

          <p v-if="couponSuccess" class="text-xs text-emerald-400 mt-2 flex items-center gap-1.5">
            <PhCheckCircle :size="14" weight="bold" />
            <span>{{ couponSuccess }}</span>
          </p>
          <p v-if="couponError" class="text-xs text-rose-400 mt-2 flex items-center gap-1.5">
            <PhWarningCircle :size="14" weight="bold" />
            <span>{{ couponError }}</span>
          </p>
        </div>

        <div class="p-3 rounded-xl bg-bg/40 border border-white/5 text-[11px] text-white/40 flex items-start gap-2">
          <PhInfo :size="15" class="text-accent shrink-0 mt-0.5" />
          <span>Dica: experimente usar o código <strong>AMIGO100</strong> para testar a ativação do plano vitalício.</span>
        </div>
      </div>

      <!-- Card Console de Testes (Mock Provider) -->
      <div class="bg-surface rounded-2xl p-6 border border-amber-500/20 shadow-md flex flex-col justify-between gap-4">
        <div>
          <div class="flex items-center justify-between pb-3 border-b border-white/5">
            <div class="flex items-center gap-2">
              <PhLightning :size="18" class="text-amber-400" weight="duotone" />
              <h3 class="text-sm font-bold text-white">Ambiente de Testes (Mock Gateway)</h3>
            </div>
            <span class="text-[10px] font-mono bg-amber-500/15 border border-amber-500/30 text-amber-300 px-2 py-0.5 rounded-full">
              Dev Sandbox
            </span>
          </div>
          
          <p class="text-xs text-white/50 mt-3">
            Como a plataforma ainda opera em pré-lançamento sem gateway bancário real (Asaas/Stripe), utilize estes atalhos para alternar entre as regras de limites e validar o sistema ponta a ponta:
          </p>

          <div class="mt-4 flex flex-col sm:flex-row gap-2.5">
            <button
              type="button"
              @click="handleSimulateUpgrade"
              :disabled="billingStore.actionLoading"
              class="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
            >
              <PhRocketLaunch :size="15" />
              <span>Simular Upgrade PRO</span>
            </button>

            <button
              type="button"
              @click="handleSimulateDowngrade"
              :disabled="billingStore.actionLoading"
              class="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
            >
              <PhArrowClockwise :size="15" />
              <span>Simular Downgrade FREE</span>
            </button>
          </div>
        </div>

        <div class="p-3 rounded-xl bg-bg/40 border border-white/5 text-[11px] text-white/40 flex items-start gap-2">
          <PhShieldCheck :size="15" class="text-emerald-400 shrink-0 mt-0.5" />
          <span>As travas do banco de dados (máx. 2 contas e 2 membros no plano Free) respondem dinamicamente a essas alterações.</span>
        </div>
      </div>

    </div>

  </div>
</template>
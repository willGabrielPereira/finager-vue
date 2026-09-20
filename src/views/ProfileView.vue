<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showAlert, toast } from '../utils/feedback'
import DeleteAccountModal from '../components/ui/DeleteAccountModal.vue'
import { useAuthStore } from '../stores/auth'
import { useBillingStore } from '../stores/billing'
import { 
  PhUser, 
  PhHouse, 
  PhLock, 
  PhCheckCircle, 
  PhWarningCircle, 
  PhSignOut,
  PhFloppyDisk,
  PhKey,
  PhCopy,
  PhCheck,
  PhBank,
  PhUsers,
  PhUserPlus,
  PhTrash,
  PhArrowRight,
  PhEnvelopeSimple,
  PhCrown,
  PhLightning,
  PhRocketLaunch,
  PhShieldCheck,
  PhX
} from '@phosphor-icons/vue'

const authStore = useAuthStore()
const billingStore = useBillingStore()
const router = useRouter()

// Profile Form
const login = ref('')
const email = ref('')
const familyName = ref('')
const profileLoading = ref(false)
const profileSuccess = ref(false)
const profileError = ref('')

// Password Form
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const passwordLoading = ref(false)
const passwordSuccess = ref(false)
const passwordError = ref('')

// Invite Modal & State
const isInviteModalOpen = ref(false)
const inviteTargetEmail = ref('')
const inviteLoading = ref(false)
const generatedInvite = ref<{ token: string; link: string; expiresAt: string } | null>(null)
const copiedInvite = ref(false)
const inviteError = ref('')

// Join Family Form
const joinToken = ref('')
const joinLoading = ref(false)
const joinError = ref('')
const joinSuccess = ref('')

const isDeleteModalOpen = ref(false)
const openDeleteAccountModal = () => {
  isDeleteModalOpen.value = true
}

onMounted(async () => {
  await Promise.all([
    authStore.fetchMe(),
    authStore.fetchFamilyMembers(),
    billingStore.fetchPlan()
  ])
  if (authStore.user) {
    login.value = authStore.user.login || ''
    email.value = authStore.user.email || ''
    familyName.value = authStore.user.family_name || ''
  }
})

const handleSaveProfile = async () => {
  profileError.value = ''
  profileSuccess.value = false

  if (!login.value.trim() || login.value.trim().length < 4) {
    profileError.value = 'O nome de usuário deve conter no mínimo 4 caracteres.'
    return
  }

  const trimmedEmail = email.value.trim().toLowerCase()
  if (trimmedEmail && (!trimmedEmail.includes('@') || !trimmedEmail.includes('.'))) {
    profileError.value = 'Por favor, informe um e-mail válido.'
    return
  }

  profileLoading.value = true
  try {
    await authStore.updateProfile({
      login: login.value.trim(),
      email: trimmedEmail,
      family_name: familyName.value.trim(),
    })
    profileSuccess.value = true
    setTimeout(() => {
      profileSuccess.value = false
    }, 3000)
  } catch (err: any) {
    profileError.value = err.response?.data?.message || err.response?.data?.error || 'Falha ao atualizar dados.'
  } finally {
    profileLoading.value = false
  }
}

const handleChangePassword = async () => {
  passwordError.value = ''
  passwordSuccess.value = false

  if (!currentPassword.value || !newPassword.value) {
    passwordError.value = 'Preencha a senha atual e a nova senha.'
    return
  }
  if (newPassword.value.length < 8) {
    passwordError.value = 'A nova senha deve possuir pelo menos 8 caracteres.'
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    passwordError.value = 'A confirmação não confere com a nova senha digitada.'
    return
  }

  passwordLoading.value = true
  try {
    await authStore.changePassword(currentPassword.value, newPassword.value)
    passwordSuccess.value = true
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
    setTimeout(() => {
      passwordSuccess.value = false
    }, 3000)
  } catch (err: any) {
    passwordError.value = err.response?.data?.error || err.response?.data?.message || 'Falha ao alterar senha. Verifique sua senha atual.'
  } finally {
    passwordLoading.value = false
  }
}

const openInviteModal = () => {
  inviteTargetEmail.value = ''
  generatedInvite.value = null
  inviteError.value = ''
  isInviteModalOpen.value = true
}

const handleCreateInvite = async () => {
  inviteLoading.value = true
  inviteError.value = ''
  try {
    const data = await authStore.createInvite(inviteTargetEmail.value.trim() || undefined)
    const origin = window.location.origin
    const inviteLink = `${origin}/register?invite=${data.token}`
    generatedInvite.value = {
      token: data.token,
      link: inviteLink,
      expiresAt: data.expires_at
    }
  } catch (err: any) {
    inviteError.value = err.response?.data?.message || err.response?.data?.error || 'Falha ao gerar convite.'
  } finally {
    inviteLoading.value = false
  }
}

const copyInviteLink = () => {
  if (generatedInvite.value?.link) {
    navigator.clipboard.writeText(generatedInvite.value.link)
    copiedInvite.value = true
    setTimeout(() => {
      copiedInvite.value = false
    }, 2000)
  }
}

const handleJoinFamily = async () => {
  joinError.value = ''
  joinSuccess.value = ''
  if (!joinToken.value.trim()) {
    joinError.value = 'Informe o código do convite.'
    return
  }

  joinLoading.value = true
  try {
    const data = await authStore.joinFamily(joinToken.value.trim())
    joinSuccess.value = data.message || 'Você ingressou na nova família com sucesso!'
    joinToken.value = ''
    familyName.value = authStore.user?.family_name || ''
  } catch (err: any) {
    joinError.value = err.response?.data?.error || err.response?.data?.message || 'Código de convite inválido ou expirado.'
  } finally {
    joinLoading.value = false
  }
}

const handleRemoveMember = async (memberId: string, memberLogin: string) => {
  const confirmed = await showAlert.confirm({
    title: 'Remover membro da família?',
    text: `Deseja realmente remover o usuário "${memberLogin}" da sua família? Ele perderá acesso às contas e dados compartilhados.`,
    confirmText: 'Sim, remover',
    cancelText: 'Cancelar',
    isDestructive: true,
  })
  if (!confirmed) return

  try {
    await authStore.removeMember(memberId)
    toast.success('Membro removido com sucesso.')
  } catch (err: any) {
    toast.error('Erro ao remover membro', err.response?.data?.error || err.response?.data?.message || 'Falha ao remover membro.')
  }
}

const handleLogout = async () => {
  const confirmed = await showAlert.confirm({
    title: 'Deseja realmente sair?',
    text: 'Você precisará fazer login novamente para acessar suas finanças.',
    confirmText: 'Sair da conta',
    cancelText: 'Permanecer',
    isDestructive: false,
  })
  if (!confirmed) return

  await authStore.logout()
  router.push('/login')
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
</script>

<template>
  <div class="max-w-4xl mx-auto flex flex-col gap-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <PhUser :size="26" class="text-accent" weight="duotone" />
          <span>Meu Perfil & Família</span>
        </h1>
        <p class="text-white/50 text-xs sm:text-sm mt-1">
          Gerencie seus dados de acesso, preferências familiares e segurança da conta.
        </p>
      </div>

      <button
        type="button"
        @click="handleLogout"
        class="flex items-center justify-center gap-2 py-2 px-3.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-semibold transition-all cursor-pointer"
      >
        <PhSignOut :size="16" />
        <span>Sair da Conta</span>
      </button>
    </div>

    <!-- Banner do Usuário -->
    <div class="bg-surface rounded-2xl p-6 border border-white/5 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        <div class="w-14 h-14 rounded-2xl bg-accent/20 border border-accent/30 text-accent flex items-center justify-center text-xl font-bold shadow-lg shadow-accent/10">
          {{ (authStore.user?.login || 'U').charAt(0).toUpperCase() }}
        </div>
        <div>
          <h2 class="text-base sm:text-lg font-bold text-white">{{ authStore.user?.login }}</h2>
          <p class="text-xs text-white/50 flex items-center gap-2 mt-0.5">
            <span class="inline-flex items-center gap-1 text-accent">
              <PhHouse :size="13" />
              <span>{{ authStore.user?.family_name || 'Espaço Familiar' }}</span>
            </span>
            <span class="text-white/20">•</span>
            <span>Membro desde {{ formatDate(authStore.user?.created_at) }}</span>
          </p>
        </div>
      </div>

      <!-- Atalho Rápido: Minhas Contas Bancárias -->
      <router-link
        to="/accounts"
        class="flex items-center gap-2 py-2 px-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white/80 hover:text-white transition-all"
      >
        <PhBank :size="16" class="text-accent" />
        <span>Gerenciar Contas Bancárias</span>
        <PhArrowRight :size="13" />
      </router-link>
    </div>

    
    <!-- Card Resumo do Plano & Quotas -->
    <div class="bg-surface rounded-2xl p-6 border border-white/5 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative overflow-hidden">
      <div class="flex items-start sm:items-center gap-4 z-10">
        <div 
          class="w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0"
          :class="billingStore.isPro 
            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-500/10' 
            : 'bg-accent/15 border-accent/30 text-accent'"
        >
          <component :is="billingStore.isPro ? PhCrown : PhLightning" :size="22" weight="duotone" />
        </div>
        <div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-semibold text-white/50">Plano Atual</span>
            <span 
              class="text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider"
              :class="billingStore.isPro 
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                : 'bg-white/10 text-white/80 border-white/15'"
            >
              {{ billingStore.isPro ? 'Plano Pro' : 'Plano Free' }}
            </span>
          </div>
          <div class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-white/70">
            <span>
              Contas: <strong>{{ billingStore.accountsUsed }}/{{ billingStore.isAccountsUnlimited ? '∞' : billingStore.accountsLimit }}</strong>
            </span>
            <span class="text-white/20">•</span>
            <span>
              Membros: <strong>{{ billingStore.membersUsed }}/{{ billingStore.membersLimit }}</strong>
            </span>
            <span class="text-white/20">•</span>
            <span>
              Histórico: <strong>{{ billingStore.isHistoryUnlimited ? 'Ilimitado' : '90 dias' }}</strong>
            </span>
          </div>
        </div>
      </div>

      <router-link
        to="/billing"
        class="z-10 inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md self-stretch sm:self-auto"
        :class="billingStore.isPro 
          ? 'bg-white/10 hover:bg-white/15 text-white border border-white/10' 
          : 'bg-accent text-bg hover:opacity-90 shadow-accent/15'"
      >
        <component :is="billingStore.isPro ? PhCrown : PhRocketLaunch" :size="15" weight="bold" />
        <span>{{ billingStore.isPro ? 'Gerenciar Plano' : 'Fazer Upgrade para Pro' }}</span>
        <PhArrowRight :size="13" />
      </router-link>
    </div>

    <!-- Seção Membros da Família & Convite Seguro -->
    <div class="bg-surface rounded-2xl p-6 border border-white/5 shadow-md flex flex-col gap-4">
      <div class="flex items-center justify-between pb-2 border-b border-white/5">
        <div class="flex items-center gap-2">
          <PhUsers :size="20" class="text-accent" weight="duotone" />
          <h3 class="text-sm font-bold text-white flex items-center gap-2">
            <span>Membros da Família Compartilhada</span>
            <span class="text-xs text-white/40 font-normal">({{ billingStore.membersUsed }}/{{ billingStore.isMembersUnlimited ? '∞' : billingStore.membersLimit }})</span>
          </h3>
        </div>

        <button
          type="button"
          @click="openInviteModal"
          class="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-accent text-bg text-xs font-bold hover:opacity-90 transition-all cursor-pointer shadow-md shadow-accent/15"
        >
          <PhUserPlus :size="15" weight="bold" />
          <span>Convidar Membro</span>
        </button>
      </div>

      <div v-if="authStore.familyMembers.length === 0" class="p-4 text-center text-xs text-white/40">
        Nenhum membro listado.
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div
          v-for="m in authStore.familyMembers"
          :key="m.user_id"
          class="p-3.5 rounded-xl bg-bg/60 border border-white/5 flex items-center justify-between gap-3"
        >
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-accent/15 text-accent flex items-center justify-center font-bold text-xs">
              {{ m.login.charAt(0).toUpperCase() }}
            </div>
            <div>
              <p class="text-xs font-bold text-white flex items-center gap-1.5">
                <span>{{ m.login }}</span>
                <span v-if="m.user_id === authStore.user?.user_id" class="text-[10px] bg-accent/20 text-accent px-1.5 py-0.2 rounded font-normal">você</span>
              </p>
              <p class="text-[11px] text-white/40 truncate max-w-[180px]">{{ m.email || 'Sem e-mail' }}</p>
            </div>
          </div>

          <div v-if="m.user_id !== authStore.user?.user_id">
            <button
              type="button"
              @click="handleRemoveMember(m.user_id, m.login)"
              class="p-1.5 text-rose-400/60 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
              title="Remover membro da família"
            >
              <PhTrash :size="15" />
            </button>
          </div>
        </div>
      </div>

      <!-- Ingressar em Outra Família via Código -->
      <div class="mt-2 pt-4 border-t border-white/5 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div class="flex-1">
          <label class="text-xs text-white/70 block mb-1">Recebeu um convite? Cole o código ou abra o link:</label>
          <input
            v-model="joinToken"
            type="text"
            placeholder="Cole o código do convite aqui..."
            class="w-full bg-bg border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
        <button
          type="button"
          @click="handleJoinFamily"
          :disabled="joinLoading"
          class="sm:mt-5 py-2 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
        >
          {{ joinLoading ? 'Entrando...' : 'Entrar na Família' }}
        </button>
      </div>
      <p v-if="joinSuccess" class="text-xs text-emerald-400 mt-1">{{ joinSuccess }}</p>
      <p v-if="joinError" class="text-xs text-rose-400 mt-1">{{ joinError }}</p>
    </div>

    <!-- Grid de Configurações -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Card 1: Dados Pessoais e Espaço Familiar -->
      <div class="bg-surface rounded-2xl p-6 border border-white/5 shadow-md flex flex-col gap-4">
        <div class="flex items-center gap-2 pb-2 border-b border-white/5">
          <PhUser :size="18" class="text-accent" weight="bold" />
          <h3 class="text-sm font-bold text-white">Dados de Identificação</h3>
        </div>

        <form @submit.prevent="handleSaveProfile" class="flex flex-col gap-4">
          <div>
            <label class="text-xs font-semibold text-white/80 mb-1.5 block">Nome de Usuário (Login)</label>
            <input
              v-model="login"
              type="text"
              class="w-full bg-bg border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
            />
          </div>

          <div>
            <label class="text-xs font-semibold text-white/80 mb-1.5 block">E-mail Cadastrado</label>
            <input
              v-model="email"
              type="email"
              placeholder="ex: usuario@email.com"
              class="w-full bg-bg border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
            />
          </div>

          <div>
            <label class="text-xs font-semibold text-white/80 mb-1.5 block">Nome da Família / Espaço</label>
            <input
              v-model="familyName"
              type="text"
              placeholder="ex: Família Pereira"
              class="w-full bg-bg border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
            />
          </div>

          <div v-if="profileSuccess" class="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
            <PhCheckCircle :size="16" />
            <span>Perfil atualizado com sucesso!</span>
          </div>

          <div v-if="profileError" class="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl flex items-center gap-2">
            <PhWarningCircle :size="16" />
            <span>{{ profileError }}</span>
          </div>

          <button
            type="submit"
            :disabled="profileLoading"
            class="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-accent text-bg text-xs font-bold hover:opacity-90 transition-all cursor-pointer shadow-lg shadow-accent/15 disabled:opacity-50 mt-1"
          >
            <PhFloppyDisk :size="16" weight="bold" />
            <span>{{ profileLoading ? 'Salvando...' : 'Salvar Alterações' }}</span>
          </button>
        </form>
      </div>

      <!-- Card 2: Segurança e Senha -->
      <div class="bg-surface rounded-2xl p-6 border border-white/5 shadow-md flex flex-col gap-4">
        <div class="flex items-center gap-2 pb-2 border-b border-white/5">
          <PhLock :size="18" class="text-accent" weight="bold" />
          <h3 class="text-sm font-bold text-white">Alterar Senha</h3>
        </div>

        <form @submit.prevent="handleChangePassword" class="flex flex-col gap-4">
          <div>
            <label class="text-xs font-semibold text-white/80 mb-1.5 block">Senha Atual</label>
            <input
              v-model="currentPassword"
              type="password"
              placeholder="••••••••"
              class="w-full bg-bg border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
            />
          </div>

          <div>
            <label class="text-xs font-semibold text-white/80 mb-1.5 block">Nova Senha (mínimo 8 caracteres)</label>
            <input
              v-model="newPassword"
              type="password"
              placeholder="••••••••"
              class="w-full bg-bg border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
            />
          </div>

          <div>
            <label class="text-xs font-semibold text-white/80 mb-1.5 block">Confirmar Nova Senha</label>
            <input
              v-model="confirmPassword"
              type="password"
              placeholder="••••••••"
              class="w-full bg-bg border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
            />
          </div>

          <div v-if="passwordSuccess" class="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
            <PhCheckCircle :size="16" />
            <span>Senha alterada com sucesso!</span>
          </div>

          <div v-if="passwordError" class="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl flex items-center gap-2">
            <PhWarningCircle :size="16" />
            <span>{{ passwordError }}</span>
          </div>

          <button
            type="submit"
            :disabled="passwordLoading"
            class="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50 mt-1"
          >
            <PhKey :size="16" />
            <span>{{ passwordLoading ? 'Alterando...' : 'Atualizar Senha' }}</span>
          </button>
        </form>
      </div>
    </div>

        <!-- Zona de Privacidade e Direitos LGPD -->
    <div class="bg-surface rounded-2xl p-6 border border-red-500/20 shadow-xl flex flex-col gap-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 class="text-sm font-bold text-red-400 flex items-center gap-2">
            <PhTrash :size="18" />
            <span>Eliminação de Conta e Dados (LGPD Art. 18)</span>
          </h3>
          <p class="text-xs text-white/50 mt-1 max-w-2xl leading-relaxed">
            Em conformidade com a Lei Geral de Proteção de Dados, você tem o direito de excluir permanentemente seus acessos, contas bancárias, extratos e histórico financeiro.
          </p>
        </div>
        <button
          type="button"
          @click="openDeleteAccountModal"
          class="shrink-0 px-4 py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 hover:text-red-200 text-xs font-bold transition-all cursor-pointer">
          <span>Excluir Minha Conta</span>
        </button>
      </div>
    </div>

    <!-- Modal de Convite Seguro -->
    <div
      v-if="isInviteModalOpen"
      class="fixed inset-0 z-[10000] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
      @click="isInviteModalOpen = false"
    >
      <div 
        class="w-full max-w-md bg-surface border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 duration-150"
        @click.stop
      >
        <div class="flex items-center justify-between pb-3 border-b border-white/10">
          <h3 class="text-sm font-bold text-white flex items-center gap-2">
            <PhShieldCheck :size="18" class="text-accent" weight="duotone" />
            <span>Convidar Membro para a Família</span>
          </h3>
          <button @click="isInviteModalOpen = false" class="text-white/40 hover:text-white transition-colors cursor-pointer">
            <PhX :size="18" />
          </button>
        </div>

        <div v-if="!generatedInvite" class="flex flex-col gap-4">
          <p class="text-xs text-white/60 leading-relaxed">
            Gere um link protegido com <strong>criptografia de 256 bits</strong> para convidar seu cônjuge ou familiar. O link é de uso único e expira em 48 horas.
          </p>

          <div>
            <label class="text-xs font-semibold text-white/80 mb-1.5 flex items-center gap-1.5">
              <PhEnvelopeSimple :size="14" class="text-accent" />
              <span>E-mail do Convidado (Recomendado para Segurança)</span>
            </label>
            <input
              v-model="inviteTargetEmail"
              type="email"
              placeholder="ex: parceiro@email.com (opcional)"
              class="w-full bg-bg border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
            />
            <p class="text-[11px] text-white/40 mt-1">
              Se informado, apenas uma conta com este e-mail poderá aceitar o convite, impedindo qualquer entrada indevida.
            </p>
          </div>

          <div v-if="inviteError" class="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <PhWarningCircle :size="15" />
            <span>{{ inviteError }}</span>
          </div>

          <div class="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              @click="isInviteModalOpen = false"
              class="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-xs font-medium cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              @click="handleCreateInvite"
              :disabled="inviteLoading"
              class="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent text-bg text-xs font-bold hover:opacity-90 cursor-pointer disabled:opacity-50 shadow-lg shadow-accent/20"
            >
              <PhShieldCheck :size="15" weight="bold" />
              <span>{{ inviteLoading ? 'Gerando Link...' : 'Gerar Convite Criptografado' }}</span>
            </button>
          </div>
        </div>

        <div v-else class="flex flex-col gap-4">
          <div class="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2.5 text-emerald-400 text-xs">
            <PhCheckCircle :size="18" weight="fill" />
            <span>Convite seguro gerado com sucesso!</span>
          </div>

          <div>
            <label class="text-xs font-semibold text-white/80 mb-1.5 block">Link de Cadastro Direto:</label>
            <div class="flex items-center gap-2">
              <input
                :value="generatedInvite.link"
                readonly
                class="flex-1 bg-bg border border-white/10 rounded-xl px-3 py-2 text-xs text-white/80 font-mono truncate"
              />
              <button
                type="button"
                @click="copyInviteLink"
                class="px-3.5 py-2 rounded-xl bg-accent text-bg text-xs font-bold hover:opacity-90 flex items-center gap-1.5 cursor-pointer shadow-md shadow-accent/15"
              >
                <PhCheck v-if="copiedInvite" :size="14" weight="bold" />
                <PhCopy v-else :size="14" weight="bold" />
                <span>{{ copiedInvite ? 'Copiado!' : 'Copiar' }}</span>
              </button>
            </div>
          </div>

          <div class="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-[11px] text-white/50 flex flex-col gap-1">
            <p><strong>Expiração:</strong> Válido até {{ new Date(generatedInvite.expiresAt).toLocaleString('pt-BR') }} (48h).</p>
            <p><strong>Destinatário:</strong> {{ inviteTargetEmail || 'Qualquer pessoa em posse do link seguro' }}.</p>
          </div>

          <div class="flex justify-end pt-1">
            <button
              type="button"
              @click="isInviteModalOpen = false"
              class="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold cursor-pointer"
            >
              Concluir
            </button>
          </div>
        </div>
      </div>
    </div>
    <DeleteAccountModal :is-open="isDeleteModalOpen" @close="isDeleteModalOpen = false" />
  </div>
</template>

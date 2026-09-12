<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { 
  PhUser, 
  PhHouse, 
  PhLock, 
  PhCheckCircle, 
  PhWarningCircle, 
  PhSignOut,
  PhFloppyDisk,
  PhKey,
  PhLightning,
  PhCopy,
  PhCheck,
  PhArrowSquareOut
} from '@phosphor-icons/vue'

const authStore = useAuthStore()
const router = useRouter()

// Profile Form
const login = ref('')
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

const copiedFamilyId = ref(false)

onMounted(async () => {
  await authStore.fetchMe()
  if (authStore.user) {
    login.value = authStore.user.login || ''
    familyName.value = authStore.user.family_name || ''
  }
})

const copyFamilyId = () => {
  if (authStore.user?.family_id) {
    navigator.clipboard.writeText(authStore.user.family_id)
    copiedFamilyId.value = true
    setTimeout(() => {
      copiedFamilyId.value = false
    }, 2000)
  }
}

const handleSaveProfile = async () => {
  profileError.value = ''
  profileSuccess.value = false

  if (!login.value.trim() || login.value.trim().length < 4) {
    profileError.value = 'O nome de usuário deve conter no mínimo 4 caracteres.'
    return
  }

  profileLoading.value = true
  try {
    await authStore.updateProfile({
      login: login.value.trim(),
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

const handleLogout = async () => {
  if (confirm('Deseja realmente sair da sua conta?')) {
    await authStore.logout()
    router.push('/login')
  }
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

      <div class="flex items-center gap-2 w-full sm:w-auto">
        <div class="px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-[11px] text-white/60 font-mono flex items-center justify-between gap-2 w-full sm:w-auto">
          <span class="text-white/40">Família ID:</span>
          <span class="truncate max-w-[120px]">{{ authStore.user?.family_id }}</span>
          <button 
            type="button" 
            @click="copyFamilyId"
            class="text-accent hover:text-white transition-colors cursor-pointer"
            title="Copiar ID da família"
          >
            <PhCheck v-if="copiedFamilyId" :size="14" class="text-emerald-400" />
            <PhCopy v-else :size="14" />
          </button>
        </div>
      </div>
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
            <label class="text-xs font-semibold text-white/80 mb-1.5 block">Nome da Família / Espaço</label>
            <input
              v-model="familyName"
              type="text"
              placeholder="ex: Família Pereira"
              class="w-full bg-bg border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
            />
          </div>

          <div v-if="profileSuccess" class="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
            <PhCheckCircle :size="16" weight="fill" />
            <span>Perfil atualizado com sucesso!</span>
          </div>

          <div v-if="profileError" class="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl flex items-center gap-2">
            <PhWarningCircle :size="16" weight="fill" />
            <span>{{ profileError }}</span>
          </div>

          <button
            type="submit"
            :disabled="profileLoading"
            class="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-accent text-bg font-bold text-xs hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-lg shadow-accent/15 disabled:opacity-50 disabled:cursor-not-allowed mt-1"
          >
            <PhFloppyDisk :size="16" weight="bold" />
            <span v-if="profileLoading">Salvando...</span>
            <span v-else>Salvar Dados</span>
          </button>
        </form>
      </div>

      <!-- Card 2: Alteração de Senha -->
      <div class="bg-surface rounded-2xl p-6 border border-white/5 shadow-md flex flex-col gap-4">
        <div class="flex items-center gap-2 pb-2 border-b border-white/5">
          <PhKey :size="18" class="text-accent" weight="bold" />
          <h3 class="text-sm font-bold text-white">Alterar Senha</h3>
        </div>

        <form @submit.prevent="handleChangePassword" class="flex flex-col gap-3">
          <div>
            <label class="text-xs font-semibold text-white/80 mb-1 block">Senha Atual</label>
            <input
              v-model="currentPassword"
              type="password"
              placeholder="••••••••"
              class="w-full bg-bg border border-white/10 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
            />
          </div>

          <div>
            <label class="text-xs font-semibold text-white/80 mb-1 block">Nova Senha (mínimo 8 caracteres)</label>
            <input
              v-model="newPassword"
              type="password"
              placeholder="••••••••"
              class="w-full bg-bg border border-white/10 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-accent transition-all"
            />
          </div>

          <div>
            <label class="text-xs font-semibold text-white/80 mb-1 block">Confirmar Nova Senha</label>
            <input
              v-model="confirmPassword"
              type="password"
              placeholder="••••••••"
              class="w-full bg-bg border border-white/10 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-accent transition-all"
            />
          </div>

          <div v-if="passwordSuccess" class="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
            <PhCheckCircle :size="16" weight="fill" />
            <span>Senha alterada com sucesso!</span>
          </div>

          <div v-if="passwordError" class="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl flex items-center gap-2">
            <PhWarningCircle :size="16" weight="fill" />
            <span>{{ passwordError }}</span>
          </div>

          <button
            type="submit"
            :disabled="passwordLoading || !newPassword || !currentPassword"
            class="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs active:scale-95 transition-all cursor-pointer border border-white/10 disabled:opacity-40 disabled:cursor-not-allowed mt-1"
          >
            <PhLock :size="16" weight="bold" />
            <span v-if="passwordLoading">Atualizando...</span>
            <span v-else>Atualizar Senha</span>
          </button>
        </form>
      </div>
    </div>

    <!-- Card 3: Seção Explicativa das Regras de Auto-Tagging -->
    <div class="bg-surface rounded-2xl p-6 border border-white/5 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div class="flex items-start gap-3.5">
        <div class="w-10 h-10 rounded-xl bg-teal-500/15 text-teal-300 flex items-center justify-center shrink-0 border border-teal-500/20">
          <PhLightning :size="22" weight="fill" />
        </div>
        <div>
          <h3 class="text-sm font-bold text-white">Memória de Estabelecimentos (Camada 1)</h3>
          <p class="text-xs text-white/50 mt-1 max-w-xl">
            Quando você altera a categoria de um lançamento e clica em <em>"Aplicar em Similares"</em>, o Finager memoriza o padrão do estabelecimento (ex: UBER, IFOOD) para auto-categorizar automaticamente os próximos extratos antes de acionar a IA.
          </p>
        </div>
      </div>

      <router-link
        to="/tag-rules"
        class="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-xs transition-all cursor-pointer"
      >
        <span>Ver Padrões Salvos</span>
        <PhArrowSquareOut :size="14" />
      </router-link>
    </div>
  </div>
</template>

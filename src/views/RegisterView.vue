<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { 
  PhWallet, 
  PhUserPlus, 
  PhLock, 
  PhHouse, 
  PhEnvelopeSimple, 
  PhShieldCheck 
} from '@phosphor-icons/vue'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const login = ref('')
const email = ref('')
const emailLocked = ref(false)
const familyName = ref('')
const password = ref('')
const confirmPassword = ref('')
const inviteToken = ref('')
const inviteFamilyName = ref('')
const loading = ref(false)
const validatingInvite = ref(false)
const errorMsg = ref('')

onMounted(async () => {
  const inviteParam = route.query.invite as string
  if (inviteParam) {
    inviteToken.value = inviteParam.trim()
    validatingInvite.value = true
    try {
      const data = await auth.validateInvite(inviteToken.value)
      if (data.valid) {
        inviteFamilyName.value = data.family_name
        if (data.target_email) {
          email.value = data.target_email
          emailLocked.value = true
        }
      }
    } catch (err: any) {
      errorMsg.value = err.response?.data?.message || err.response?.data?.error || 'O link de convite utilizado é inválido ou expirou.'
    } finally {
      validatingInvite.value = false
    }
  }
})

const handleRegister = async () => {
  errorMsg.value = ''

  if (!login.value.trim() || !email.value.trim() || !password.value) {
    errorMsg.value = 'Preencha todos os campos obrigatórios.'
    return
  }
  if (login.value.trim().length < 4) {
    errorMsg.value = 'O nome de usuário deve conter pelo menos 4 caracteres.'
    return
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.value.trim())) {
    errorMsg.value = 'Informe um endereço de e-mail válido.'
    return
  }
  if (password.value.length < 8) {
    errorMsg.value = 'A senha deve conter no mínimo 8 caracteres.'
    return
  }
  if (password.value !== confirmPassword.value) {
    errorMsg.value = 'As senhas digitadas não coincidem.'
    return
  }

  loading.value = true

  try {
    await auth.register(
      login.value.trim(),
      email.value.trim(),
      password.value,
      inviteToken.value ? undefined : familyName.value.trim(),
      inviteToken.value || undefined
    )
    router.push('/')
  } catch (err: any) {
    if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
      errorMsg.value = err.response.data.errors.map((e: any) => e.message).join(' | ')
    } else {
      errorMsg.value = err.response?.data?.error || err.response?.data?.message || 'Falha ao criar conta. Tente novamente.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen w-full flex items-center justify-center p-4 bg-bg">
    <Card class="max-w-md w-full p-6 sm:p-8">
      <div class="flex justify-center mb-5 text-accent">
        <div class="w-14 h-14 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center shadow-lg shadow-accent/10">
          <PhWallet :size="32" weight="duotone" />
        </div>
      </div>
      
      <h1 class="text-2xl font-bold mb-1.5 text-center text-white tracking-tight">Criar Conta no Finager</h1>
      <p class="text-white/50 text-center mb-6 text-xs sm:text-sm">Gestão financeira familiar inteligente e moderna</p>

      <!-- Banner de Convite de Família -->
      <div 
        v-if="inviteFamilyName" 
        class="mb-5 p-3.5 rounded-xl bg-accent/10 border border-accent/25 flex items-center gap-3 text-white text-xs"
      >
        <div class="w-8 h-8 rounded-lg bg-accent/20 text-accent flex items-center justify-center flex-shrink-0">
          <PhShieldCheck :size="20" weight="duotone" />
        </div>
        <div>
          <p class="font-bold text-accent">Convite de Família Aceito!</p>
          <p class="text-white/70 text-[11px]">Você ingressará diretamente na <strong>{{ inviteFamilyName }}</strong>.</p>
        </div>
      </div>

      <form @submit.prevent="handleRegister" class="flex flex-col gap-4">
        <!-- Login -->
        <div>
          <label class="text-xs font-semibold text-white/80 mb-1.5 flex items-center gap-1.5">
            <PhUserPlus :size="14" />
            <span>Nome de Usuário</span>
          </label>
          <Input 
            v-model="login"
            type="text" 
            placeholder="ex: william"
            autocomplete="username"
            required
          />
        </div>

        <!-- E-mail -->
        <div>
          <label class="text-xs font-semibold text-white/80 mb-1.5 flex items-center gap-1.5">
            <PhEnvelopeSimple :size="14" />
            <span>Endereço de E-mail</span>
          </label>
          <Input 
            v-model="email"
            type="email" 
            placeholder="ex: william@email.com"
            autocomplete="email"
            :disabled="emailLocked"
            required
          />
          <p v-if="emailLocked" class="text-[10px] text-accent mt-1">E-mail vinculado exclusivamente a este convite de família.</p>
        </div>

        <!-- Nome da Família (ocultado se veio com convite) -->
        <div v-if="!inviteFamilyName">
          <label class="text-xs font-semibold text-white/80 mb-1.5 flex items-center gap-1.5">
            <PhHouse :size="14" />
            <span>Nome da Família / Espaço (opcional)</span>
          </label>
          <Input 
            v-model="familyName"
            type="text" 
            placeholder="ex: Família Pereira"
          />
        </div>
        
        <!-- Senha -->
        <div>
          <label class="text-xs font-semibold text-white/80 mb-1.5 flex items-center gap-1.5">
            <PhLock :size="14" />
            <span>Senha (mínimo 8 caracteres)</span>
          </label>
          <Input 
            v-model="password"
            type="password" 
            placeholder="••••••••"
            autocomplete="new-password"
            required
          />
        </div>

        <!-- Confirmação de Senha -->
        <div>
          <label class="text-xs font-semibold text-white/80 mb-1.5 flex items-center gap-1.5">
            <PhLock :size="14" />
            <span>Confirme a Senha</span>
          </label>
          <Input 
            v-model="confirmPassword"
            type="password" 
            placeholder="••••••••"
            autocomplete="new-password"
            required
          />
        </div>
        
        <div v-if="errorMsg" class="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl text-center">
          {{ errorMsg }}
        </div>
        
        <Button 
          type="submit"
          :disabled="loading || validatingInvite"
          size="lg"
          class="mt-2 w-full"
        >
          <span v-if="loading">Criando conta...</span>
          <span v-else>Cadastrar e Entrar</span>
        </Button>
      </form>
      
      <div class="mt-6 text-center text-xs sm:text-sm text-white/50">
        Já tem uma conta? 
        <router-link to="/login" class="text-accent font-semibold hover:underline">Faça login</router-link>
      </div>
    </Card>
  </div>
</template>


<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'
import { PhWallet, PhUserPlus, PhLock, PhHouse } from '@phosphor-icons/vue'

const auth = useAuthStore()
const router = useRouter()

const login = ref('')
const familyName = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const errorMsg = ref('')

const handleRegister = async () => {
  if (!login.value || !password.value) {
    errorMsg.value = 'Preencha o nome de usuário e senha.'
    return
  }
  if (login.value.length < 4) {
    errorMsg.value = 'O nome de usuário deve conter pelo menos 4 caracteres.'
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
  errorMsg.value = ''

  try {
    await auth.register(login.value, password.value, familyName.value)
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
    <div class="max-w-md w-full bg-surface rounded-2xl p-6 sm:p-8 border border-white/5 shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5)]">
      <div class="flex justify-center mb-5 text-accent">
        <div class="w-14 h-14 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center shadow-lg shadow-accent/10">
          <PhWallet :size="32" weight="duotone" />
        </div>
      </div>
      
      <h1 class="text-2xl font-bold mb-1.5 text-center text-white tracking-tight">Criar Conta no Finager</h1>
      <p class="text-white/50 text-center mb-6 text-xs sm:text-sm">Gestão financeira familiar inteligente e moderna</p>
      
      <form @submit.prevent="handleRegister" class="flex flex-col gap-4">
        <div>
          <label class="text-xs font-semibold text-white/80 mb-1.5 flex items-center gap-1.5">
            <PhUserPlus :size="14" />
            <span>Nome de Usuário</span>
          </label>
          <input 
            v-model="login"
            type="text" 
            placeholder="ex: william"
            autocomplete="username"
            class="w-full bg-bg border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-white/25 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all" 
          />
        </div>

        <div>
          <label class="text-xs font-semibold text-white/80 mb-1.5 flex items-center gap-1.5">
            <PhHouse :size="14" />
            <span>Nome da Família / Espaço (opcional)</span>
          </label>
          <input 
            v-model="familyName"
            type="text" 
            placeholder="ex: Família Pereira"
            class="w-full bg-bg border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-white/25 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all" 
          />
        </div>
        
        <div>
          <label class="text-xs font-semibold text-white/80 mb-1.5 flex items-center gap-1.5">
            <PhLock :size="14" />
            <span>Senha (mínimo 8 caracteres)</span>
          </label>
          <input 
            v-model="password"
            type="password" 
            placeholder="••••••••"
            autocomplete="new-password"
            class="w-full bg-bg border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-white/25 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all" 
          />
        </div>

        <div>
          <label class="text-xs font-semibold text-white/80 mb-1.5 flex items-center gap-1.5">
            <PhLock :size="14" />
            <span>Confirme a Senha</span>
          </label>
          <input 
            v-model="confirmPassword"
            type="password" 
            placeholder="••••••••"
            autocomplete="new-password"
            class="w-full bg-bg border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-white/25 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all" 
          />
        </div>
        
        <div v-if="errorMsg" class="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl text-center">
          {{ errorMsg }}
        </div>
        
        <button 
          type="submit"
          :disabled="loading"
          class="bg-accent text-bg mt-2 font-bold px-6 py-3 rounded-xl hover:opacity-90 active:scale-[0.99] transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-accent/20 text-sm"
        >
          <span v-if="loading">Criando conta...</span>
          <span v-else>Cadastrar e Entrar</span>
        </button>
      </form>
      
      <div class="mt-6 text-center text-xs sm:text-sm text-white/50">
        Já tem uma conta? 
        <router-link to="/login" class="text-accent font-semibold hover:underline">Faça login</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';
import { PhWallet, PhUser, PhLock, PhSignIn } from '@phosphor-icons/vue';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const auth = useAuthStore();
const router = useRouter();

const login = ref('');
const password = ref('');
const loading = ref(false);
const errorMsg = ref('');

const handleLogin = async () => {
  if (!login.value.trim() || !password.value) return;
  loading.value = true;
  errorMsg.value = '';
  
  try {
    await auth.login(login.value.trim(), password.value);
    router.push('/');
  } catch (err: any) {
    errorMsg.value = err.response?.data?.error || err.response?.data?.message || 'Falha ao autenticar. Verifique usuário e senha.';
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen w-full flex items-center justify-center p-4 bg-bg">
    <Card class="max-w-md w-full p-6 sm:p-8">
      <div class="flex justify-center mb-5 text-accent">
        <div class="w-14 h-14 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center shadow-lg shadow-accent/10">
          <PhWallet :size="32" weight="duotone" />
        </div>
      </div>

      <h1 class="text-2xl font-bold mb-1.5 text-center text-white tracking-tight">Bem-vindo de Volta</h1>
      <p class="text-white/50 text-center mb-6 text-xs sm:text-sm">Acesse suas finanças no Finager</p>
      
      <form @submit.prevent="handleLogin" class="flex flex-col gap-4">
        <div>
          <label class="text-xs font-semibold text-white/80 mb-1.5 flex items-center gap-1.5">
            <PhUser :size="14" />
            <span>Nome de Usuário ou E-mail</span>
          </label>
          <Input 
            v-model="login"
            type="text" 
            placeholder="Digite seu usuário ou e-mail"
            autocomplete="username"
            required
          />
        </div>
        
        <div>
          <label class="text-xs font-semibold text-white/80 mb-1.5 flex items-center gap-1.5">
            <PhLock :size="14" />
            <span>Senha</span>
          </label>
          <Input 
            v-model="password"
            type="password" 
            placeholder="••••••••"
            autocomplete="current-password"
            required
          />
        </div>
        
        <div v-if="errorMsg" class="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl text-center">
          {{ errorMsg }}
        </div>
        
        <Button 
          type="submit"
          :disabled="loading"
          size="lg"
          class="mt-2 w-full"
        >
          <PhSignIn :size="16" weight="bold" />
          <span v-if="loading">Entrando...</span>
          <span v-else>Entrar</span>
        </Button>
      </form>
      
      <div class="mt-6 text-center text-xs sm:text-sm text-white/50">
        Não tem uma conta? 
        <router-link to="/register" class="text-accent font-semibold hover:underline">Cadastre-se aqui</router-link>
      </div>
    </Card>
  </div>
</template>


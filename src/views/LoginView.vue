<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';
import { PhWallet } from '@phosphor-icons/vue';

const auth = useAuthStore();
const router = useRouter();

const login = ref('');
const password = ref('');
const loading = ref(false);
const errorMsg = ref('');

const handleLogin = async () => {
  if (!login.value || !password.value) return;
  loading.value = true;
  errorMsg.value = '';
  
  try {
    await auth.login(login.value, password.value);
    router.push('/');
  } catch (err: any) {
    errorMsg.value = err.response?.data?.error || 'Failed to login';
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="h-screen w-full flex items-center justify-center p-4">
    <div class="max-w-md w-full bg-surface rounded-2xl p-8 border border-white/5 shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5)]">
      <div class="flex justify-center mb-6 text-accent">
        <PhWallet :size="48" weight="duotone" />
      </div>
      <h1 class="text-2xl font-bold mb-2 text-center text-white">Welcome back</h1>
      <p class="text-white/50 text-center mb-8 text-sm">Sign in to your Finager account</p>
      
      <form @submit.prevent="handleLogin" class="flex flex-col gap-5">
        <div>
          <label class="text-sm font-medium text-white/80 mb-1.5 block">Username</label>
          <input 
            v-model="login"
            type="text" 
            placeholder="johndoe"
            class="w-full bg-bg border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all duration-200" 
          />
        </div>
        
        <div>
          <label class="text-sm font-medium text-white/80 mb-1.5 block">Password</label>
          <input 
            v-model="password"
            type="password" 
            placeholder="••••••••"
            class="w-full bg-bg border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all duration-200" 
          />
        </div>
        
        <div v-if="errorMsg" class="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg text-center">
          {{ errorMsg }}
        </div>
        
        <button 
          type="submit"
          :disabled="loading"
          class="bg-accent text-bg mt-2 font-semibold px-6 py-3 rounded-lg hover:opacity-90 hover:-translate-y-px transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="loading">Signing in...</span>
          <span v-else>Sign in</span>
        </button>
      </form>
      
      <div class="mt-6 text-center text-sm text-white/50">
        Don't have an account? 
        <router-link to="/register" class="text-accent hover:underline">Register here</router-link>
      </div>
    </div>
  </div>
</template>

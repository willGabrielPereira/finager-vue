<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { PhLock, PhShieldCheck } from '@phosphor-icons/vue';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/utils/feedback';
import { useAdminAuthStore } from '@/stores/adminAuth';

const adminAuthStore = useAdminAuthStore();
const route = useRoute();
const router = useRouter();

const password = ref('');
const loading = ref(false);

const handleSubmit = async () => {
  loading.value = true;
  try {
    await adminAuthStore.elevate(password.value);
    const redirect = route.query.redirect as string;
    router.push(redirect || '/admin');
  } catch (err: any) {
    const code = err.response?.data?.error?.code;
    if (code === 'E_INVALID_PASSWORD') {
      toast.error('Senha incorreta');
    } else if (code === 'E_RATE_LIMITED') {
      toast.error('Muitas tentativas. Aguarde alguns minutos e tente novamente.');
    } else if (code === 'E_FORBIDDEN_ROLE') {
      toast.error('Você não tem permissão para acessar a área administrativa.');
    } else {
      toast.error('Não foi possível reautenticar. Tente novamente.');
    }
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="min-h-full w-full flex items-center justify-center p-4">
    <Card class="max-w-sm w-full p-6 sm:p-8">
      <div class="flex justify-center mb-5 text-amber-400">
        <div class="w-14 h-14 rounded-2xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center shadow-lg shadow-amber-400/10">
          <PhShieldCheck :size="32" weight="duotone" />
        </div>
      </div>

      <h1 class="text-xl font-bold mb-1.5 text-center text-white tracking-tight">Confirme sua senha</h1>
      <p class="text-white/50 text-center mb-6 text-xs sm:text-sm">Reautenticação necessária para acessar a área administrativa</p>

      <form @submit.prevent="handleSubmit" class="flex flex-col gap-4">
        <div>
          <label for="reauth-password" class="text-xs font-semibold text-white/80 mb-1.5 flex items-center gap-1.5">
            <PhLock :size="14" />
            <span>Senha</span>
          </label>
          <Input id="reauth-password"
            v-model="password"
            type="password"
            placeholder="••••••••"
            autocomplete="current-password"
            required
          />
        </div>

        <Button
          type="submit"
          :disabled="loading"
          size="lg"
          class="mt-2 w-full"
        >
          <span v-if="loading">Verificando...</span>
          <span v-else>Confirmar</span>
        </Button>
      </form>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { getHashToken } from '@/utils/authRedirect';
import { unwrapApiError } from '@/utils/feedback';
import { resetPasswordSchema } from '@/validation/schemas';
import { useFormValidation } from '@/composables/useFormValidation';
import { PhLockKey, PhFloppyDisk, PhCheckCircle, PhWarningCircle } from '@phosphor-icons/vue';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const auth = useAuthStore();
const router = useRouter();
const { validate, firstError } = useFormValidation(resetPasswordSchema);

const token = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const loading = ref(false);
const errorMsg = ref('');
const done = ref(false);

onMounted(() => {
  token.value = getHashToken();
  if (!token.value) {
    errorMsg.value = 'Link de redefinição inválido. Solicite um novo.';
  }
});

const handleSubmit = async () => {
  errorMsg.value = '';
  const data = validate({ newPassword: newPassword.value, confirmPassword: confirmPassword.value });
  if (!data) { errorMsg.value = firstError.value; return; }

  loading.value = true;
  try {
    await auth.resetPassword(token.value, data.newPassword);
    done.value = true;
    setTimeout(() => router.push('/login'), 2500);
  } catch (err: any) {
    errorMsg.value = unwrapApiError(err, 'Link inválido ou expirado. Solicite um novo.');
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
          <PhLockKey :size="32" weight="duotone" />
        </div>
      </div>

      <h1 class="text-2xl font-bold mb-1.5 text-center text-white tracking-tight">Redefinir Senha</h1>
      <p class="text-white/50 text-center mb-6 text-xs sm:text-sm">Escolha uma nova senha para sua conta</p>

      <div v-if="done" class="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2 text-center justify-center">
        <PhCheckCircle :size="18" />
        <span>Senha redefinida com sucesso! Redirecionando para o login...</span>
      </div>

      <form v-else-if="token" @submit.prevent="handleSubmit" class="flex flex-col gap-4">
        <div>
          <label for="reset-new-password" class="text-xs font-semibold text-white/80 mb-1.5 block">Nova Senha</label>
          <Input id="reset-new-password" v-model="newPassword" type="password" placeholder="••••••••" autocomplete="new-password" />
        </div>

        <div>
          <label for="reset-confirm-password" class="text-xs font-semibold text-white/80 mb-1.5 block">Confirmar Nova Senha</label>
          <Input id="reset-confirm-password" v-model="confirmPassword" type="password" placeholder="••••••••" autocomplete="new-password" />
        </div>

        <div v-if="errorMsg" role="alert" class="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl text-center">
          {{ errorMsg }}
        </div>

        <Button type="submit" :disabled="loading" size="lg" class="mt-2 w-full">
          <PhFloppyDisk :size="16" weight="bold" />
          <span>{{ loading ? 'Salvando...' : 'Redefinir Senha' }}</span>
        </Button>
      </form>

      <div v-else class="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl flex items-center gap-2 text-center justify-center">
        <PhWarningCircle :size="16" />
        <span>{{ errorMsg }}</span>
      </div>

      <div class="mt-6 text-center text-xs sm:text-sm text-white/50">
        <router-link to="/esqueci-senha" class="text-accent font-semibold hover:underline">Solicitar novo link</router-link>
      </div>
    </Card>
  </div>
</template>

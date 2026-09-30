<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { getHashToken } from '@/utils/authRedirect';
import { unwrapApiError, toast } from '@/utils/feedback';
import { PhUsersThree, PhWarningCircle, PhSignIn, PhUserPlus, PhCheckCircle } from '@phosphor-icons/vue';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const auth = useAuthStore();
const router = useRouter();

const token = ref('');
const loading = ref(true);
const joining = ref(false);
const familyName = ref('');
const errorMsg = ref('');

onMounted(async () => {
  token.value = getHashToken();
  if (!token.value) {
    errorMsg.value = 'Link de convite inválido.';
    loading.value = false;
    return;
  }
  try {
    const data = await auth.validateInvite(token.value);
    familyName.value = data.family_name;
  } catch (err: any) {
    errorMsg.value = unwrapApiError(err, 'Este convite é inválido, expirado ou já foi utilizado.');
  } finally {
    loading.value = false;
  }
});

const acceptInvite = async () => {
  joining.value = true;
  try {
    const data = await auth.joinFamily(token.value);
    toast.success('Você entrou na família', data.message);
    // Recarrega o app inteiro: todas as stores ainda têm dados da família anterior.
    window.location.assign('/');
  } catch (err: any) {
    errorMsg.value = unwrapApiError(err, 'Não foi possível aceitar o convite.');
  } finally {
    joining.value = false;
  }
};

const goToRegister = () => router.push({ path: '/register', query: { invite: token.value } });
const goToLogin = () => router.push({ path: '/login', query: { invite: token.value } });
</script>

<template>
  <div class="min-h-screen w-full flex items-center justify-center p-4 bg-bg">
    <Card class="max-w-md w-full p-6 sm:p-8">
      <div class="flex justify-center mb-5 text-accent">
        <div class="w-14 h-14 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center shadow-lg shadow-accent/10">
          <PhUsersThree :size="32" weight="duotone" />
        </div>
      </div>

      <h1 class="text-2xl font-bold mb-1.5 text-center text-white tracking-tight">Convite de Família</h1>

      <div v-if="loading" class="text-center text-white/50 text-xs sm:text-sm py-4">Verificando convite...</div>

      <template v-else-if="familyName">
        <p class="text-white/70 text-center mb-6 text-xs sm:text-sm">
          Você foi convidado para ingressar em <strong class="text-accent">{{ familyName }}</strong>.
        </p>

        <div v-if="errorMsg" role="alert" class="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl text-center">
          {{ errorMsg }}
        </div>

        <div v-if="auth.isAuthenticated" class="flex flex-col gap-3">
          <Button :disabled="joining" size="lg" class="w-full" @click="acceptInvite">
            <PhCheckCircle :size="16" weight="bold" />
            <span>{{ joining ? 'Entrando...' : 'Aceitar Convite' }}</span>
          </Button>
        </div>

        <div v-else class="flex flex-col gap-3">
          <Button size="lg" class="w-full" @click="goToRegister">
            <PhUserPlus :size="16" weight="bold" />
            <span>Criar conta e entrar</span>
          </Button>
          <Button variant="secondary" size="lg" class="w-full" @click="goToLogin">
            <PhSignIn :size="16" weight="bold" />
            <span>Já tenho conta, fazer login</span>
          </Button>
        </div>
      </template>

      <div v-else class="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl flex items-center gap-2 text-center justify-center">
        <PhWarningCircle :size="16" />
        <span>{{ errorMsg }}</span>
      </div>

      <div class="mt-6 text-center text-xs sm:text-sm text-white/50">
        <router-link to="/" class="text-accent font-semibold hover:underline">Voltar ao início</router-link>
      </div>
    </Card>
  </div>
</template>

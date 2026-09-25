<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRoute, useRouter } from 'vue-router';
import { PhWallet, PhUser, PhLock, PhSignIn, PhShieldCheck } from '@phosphor-icons/vue';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { showAlert, toast } from '@/utils/feedback';
import { getRedirectTarget, getInviteToken } from '@/utils/authRedirect';
import { loginSchema } from '@/validation/schemas';
import { useFormValidation } from '@/composables/useFormValidation';

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();

const login = ref('');
const password = ref('');
const loading = ref(false);
const errorMsg = ref('');
const { validate, firstError } = useFormValidation(loginSchema);

// Convite de família na URL (ex.: alguém com conta clicou "Faça login" em vez de se cadastrar)
const inviteToken = getInviteToken(route.query);
const inviteFamilyName = ref('');

onMounted(async () => {
  if (!inviteToken) return;
  try {
    const data = await auth.validateInvite(inviteToken);
    if (data.valid) inviteFamilyName.value = data.family_name;
  } catch {
    // Convite inválido/expirado: login continua normal, só não mostra o banner
  }
});

const registerLink = computed(() => ({ path: '/register', query: route.query }));

const goToDestination = () => {
  router.push(getRedirectTarget(route.query));
};

const joinInviteAfterLogin = async () => {
  if (!inviteToken) return;
  const confirmed = await showAlert.confirm({
    title: 'Entrar nesta família?',
    text: inviteFamilyName.value
      ? `Você passará a ver as contas e lançamentos de "${inviteFamilyName.value}" e deixará de ver os da família atual.`
      : 'Você passará a ver as contas e lançamentos da família do convite.',
    confirmText: 'Entrar na família',
    cancelText: 'Agora não',
    isDestructive: true,
  });
  if (!confirmed) return;

  try {
    const data = await auth.joinFamily(inviteToken);
    toast.success('Você entrou na família', data.message);
    // Recarrega o app inteiro: todas as stores ainda têm dados da família anterior
    window.location.assign(getRedirectTarget(route.query));
  } catch (err: any) {
    toast.error('Convite não aplicado', err.response?.data?.error || err.response?.data?.message || 'O convite pode ter expirado.');
  }
};

const handleLogin = async () => {
  const data = validate({ login: login.value, password: password.value });
  if (!data) { errorMsg.value = firstError.value; return; }

  loading.value = true;
  errorMsg.value = '';

  try {
    await auth.login(data.login, data.password);
    if (inviteToken) {
      await joinInviteAfterLogin();
    }
    goToDestination();
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

      <!-- Banner de Convite de Família (chegou aqui com um link de convite) -->
      <div
        v-if="inviteToken && inviteFamilyName"
        class="mb-5 p-3.5 rounded-xl bg-accent/10 border border-accent/25 flex items-center gap-3 text-white text-xs"
      >
        <div class="w-8 h-8 rounded-lg bg-accent/20 text-accent flex items-center justify-center flex-shrink-0">
          <PhShieldCheck :size="20" weight="duotone" />
        </div>
        <div>
          <p class="font-bold text-accent">Convite de Família Detectado</p>
          <p class="text-white/70 text-[11px]">Após entrar, vamos perguntar se você quer ingressar em <strong>{{ inviteFamilyName }}</strong>.</p>
        </div>
      </div>

      <form @submit.prevent="handleLogin" class="flex flex-col gap-4">
        <div>
          <label for="login-user" class="text-xs font-semibold text-white/80 mb-1.5 flex items-center gap-1.5">
            <PhUser :size="14" />
            <span>Nome de Usuário ou E-mail</span>
          </label>
          <Input id="login-user"
            v-model="login"
            type="text"
            placeholder="Digite seu usuário ou e-mail"
            autocomplete="username"
            required
          />
        </div>

        <div>
          <label for="login-password" class="text-xs font-semibold text-white/80 mb-1.5 flex items-center gap-1.5">
            <PhLock :size="14" />
            <span>Senha</span>
          </label>
          <Input id="login-password"
            v-model="password"
            type="password"
            placeholder="••••••••"
            autocomplete="current-password"
            required
          />
        </div>

        <div v-if="errorMsg" role="alert" class="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl text-center">
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
        <router-link :to="registerLink" class="text-accent font-semibold hover:underline">Cadastre-se aqui</router-link>
      </div>
    </Card>
  </div>
</template>

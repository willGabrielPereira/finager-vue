<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth';
import { PhKey, PhEnvelopeSimple, PhPaperPlaneTilt, PhCheckCircle } from '@phosphor-icons/vue';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { emailSchema } from '@/validation/schemas';

const auth = useAuthStore();

const email = ref('');
const loading = ref(false);
const errorMsg = ref('');
const sent = ref(false);

const handleSubmit = async () => {
  errorMsg.value = '';
  const check = emailSchema.safeParse(email.value.trim());
  if (!check.success) {
    errorMsg.value = check.error.issues[0].message;
    return;
  }

  loading.value = true;
  try {
    // O backend sempre responde 202 com a mesma mensagem, exista ou não o e-mail.
    await auth.forgotPassword(check.data.toLowerCase());
    sent.value = true;
  } catch {
    errorMsg.value = 'Não foi possível processar o pedido agora. Tente novamente em instantes.';
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
          <PhKey :size="32" weight="duotone" />
        </div>
      </div>

      <h1 class="text-2xl font-bold mb-1.5 text-center text-white tracking-tight">Esqueceu sua senha?</h1>
      <p class="text-white/50 text-center mb-6 text-xs sm:text-sm">Informe seu e-mail para receber um link de redefinição</p>

      <div v-if="sent" class="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2 text-center justify-center">
        <PhCheckCircle :size="18" />
        <span>Se o e-mail estiver cadastrado, você receberá um link para redefinir a senha.</span>
      </div>

      <form v-else @submit.prevent="handleSubmit" class="flex flex-col gap-4">
        <div>
          <label for="forgot-email" class="text-xs font-semibold text-white/80 mb-1.5 flex items-center gap-1.5">
            <PhEnvelopeSimple :size="14" />
            <span>E-mail Cadastrado</span>
          </label>
          <Input id="forgot-email"
            v-model="email"
            type="email"
            placeholder="ex: usuario@email.com"
            autocomplete="email"
            required
          />
        </div>

        <div v-if="errorMsg" role="alert" class="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl text-center">
          {{ errorMsg }}
        </div>

        <Button type="submit" :disabled="loading" size="lg" class="mt-2 w-full">
          <PhPaperPlaneTilt :size="16" weight="bold" />
          <span>{{ loading ? 'Enviando...' : 'Enviar link de redefinição' }}</span>
        </Button>
      </form>

      <div class="mt-6 text-center text-xs sm:text-sm text-white/50">
        <router-link to="/login" class="text-accent font-semibold hover:underline">Voltar para o login</router-link>
      </div>
    </Card>
  </div>
</template>

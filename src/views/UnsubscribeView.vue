<script setup lang="ts">
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { unwrapApiError } from '@/utils/feedback';
import { PhBellSlash, PhCheckCircle, PhWarningCircle } from '@phosphor-icons/vue';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const route = useRoute();
const auth = useAuthStore();

const u = String(route.query.u || '');
const s = String(route.query.s || '');

const loading = ref(false);
const done = ref(false);
const errorMsg = ref(u && s ? '' : 'Link inválido.');

const handleUnsubscribe = async () => {
  loading.value = true;
  errorMsg.value = '';
  try {
    await auth.unsubscribeEmail(u, s);
    done.value = true;
  } catch (err: any) {
    errorMsg.value = unwrapApiError(err, 'Link inválido ou expirado.');
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
          <PhBellSlash :size="32" weight="duotone" />
        </div>
      </div>

      <h1 class="text-2xl font-bold mb-1.5 text-center text-white tracking-tight">Lembretes por E-mail</h1>

      <div v-if="done" class="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2 text-center justify-center">
        <PhCheckCircle :size="18" />
        <span>Você não receberá mais lembretes por e-mail.</span>
      </div>

      <template v-else-if="u && s">
        <p class="text-white/50 text-center mb-6 text-xs sm:text-sm">
          Deseja parar de receber lembretes de importação (OFX) por e-mail?
        </p>

        <div v-if="errorMsg" role="alert" class="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl text-center">
          {{ errorMsg }}
        </div>

        <Button :disabled="loading" size="lg" class="w-full" @click="handleUnsubscribe">
          <PhBellSlash :size="16" weight="bold" />
          <span>{{ loading ? 'Processando...' : 'Sim, descadastrar' }}</span>
        </Button>
      </template>

      <div v-else class="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl flex items-center gap-2 text-center justify-center">
        <PhWarningCircle :size="16" />
        <span>{{ errorMsg }}</span>
      </div>
    </Card>
  </div>
</template>

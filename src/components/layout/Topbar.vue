<script setup lang="ts">
import { onMounted } from 'vue';
import { useAuthStore } from '../../stores/auth';
import { PhSignOut, PhUserCircle } from '@phosphor-icons/vue';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

onMounted(() => {
  if (!authStore.user) {
    authStore.fetchMe();
  }
});

const handleLogout = async () => {
  await authStore.logout();
  router.push('/login');
};
</script>

<template>
  <header class="h-16 bg-surface border-b border-white/5 flex items-center justify-between px-6 sticky top-0 z-10">
    <div class="flex items-center">
      <!-- Breadcrumb or Title placeholder -->
    </div>
    
    <div class="flex items-center gap-4">
      <div class="flex items-center gap-2 text-sm text-white/80">
        <PhUserCircle :size="24" weight="duotone" />
        <span>{{ authStore.user?.login || 'Loading...' }}</span>
      </div>
      
      <button @click="handleLogout" class="p-2 rounded-lg text-white/50 hover:text-red-400 hover:bg-red-400/10 transition-all cursor-pointer" title="Logout">
        <PhSignOut :size="20" />
      </button>
    </div>
  </header>
</template>

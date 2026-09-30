<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AppLayout from './components/layout/AppLayout.vue';
import AdminLayout from './components/layout/AdminLayout.vue';

const route = useRoute();

// Seleciona o shell: área admin, sem layout (público) ou app comum
const shell = computed(() => {
  if (route.meta.layout === 'admin') return AdminLayout;
  if (route.meta.public || route.meta.open) return 'div';
  return AppLayout;
});
</script>

<template>
  <component :is="shell">
    <router-view></router-view>
  </component>
</template>

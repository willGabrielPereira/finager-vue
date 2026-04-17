<script setup lang="ts">
import { useRoute } from 'vue-router';
import AppLayout from './components/layout/AppLayout.vue';
const route = useRoute();
</script>

<template>
  <component :is="route.meta.public ? 'div' : AppLayout">
    <router-view></router-view>
  </component>
</template>

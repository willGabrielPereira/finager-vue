<script setup lang="ts">
import { PhSquaresFour, PhListDashes, PhUploadSimple, PhTag, PhList } from '@phosphor-icons/vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const navItems = [
  { name: 'Dashboard', path: '/', icon: PhSquaresFour },
  { name: 'Transactions', path: '/transactions', icon: PhListDashes },
  { name: 'Import', path: '/import', icon: PhUploadSimple },
  { name: 'Tags', path: '/tags', icon: PhTag },
  { name: 'Tag Rules', path: '/tag-rules', icon: PhList },
];
</script>

<template>
  <aside class="w-64 bg-surface border-r border-white/5 flex flex-col transition-all duration-300">
    <div class="h-16 flex items-center px-6 border-b border-white/5">
      <h2 class="text-xl font-bold bg-gradient-to-r from-accent to-emerald-400 bg-clip-text text-transparent">Finager</h2>
    </div>
    
    <nav class="flex-1 px-4 py-6 flex flex-col gap-2">
      <router-link 
        v-for="item in navItems" 
        :key="item.path" 
        :to="item.path"
        class="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200"
        :class="route.path === item.path ? 'bg-accent/10 text-accent font-medium' : 'text-white/70 hover:bg-white/5 hover:text-white'"
      >
        <component :is="item.icon" :size="20" :weight="route.path === item.path ? 'duotone' : 'regular'" />
        <span>{{ item.name }}</span>
      </router-link>
    </nav>
  </aside>
</template>

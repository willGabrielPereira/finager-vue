<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <thead :class="cn('[&_tr]:border-b [&_tr]:border-white/5 bg-surface-2/30', props.class)">
    <slot />
  </thead>
</template>

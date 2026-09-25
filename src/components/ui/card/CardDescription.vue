<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <p :class="cn('text-xs sm:text-sm text-white/50 leading-relaxed', props.class)">
    <slot />
  </p>
</template>

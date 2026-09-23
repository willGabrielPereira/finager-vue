<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <div
    :class="
      cn(
        'rounded-2xl border border-white/5 bg-surface text-white shadow-xl shadow-black/20 transition-all duration-200',
        props.class
      )
    "
  >
    <slot />
  </div>
</template>

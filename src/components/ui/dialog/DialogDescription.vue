<script setup lang="ts">
import { DialogDescription, type DialogDescriptionProps } from 'radix-vue'
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

interface Props extends DialogDescriptionProps {
  class?: HTMLAttributes['class']
}

const props = defineProps<Props>()
</script>

<template>
  <DialogDescription :class="cn('text-xs sm:text-sm text-white/50 leading-relaxed', props.class)">
    <slot />
  </DialogDescription>
</template>

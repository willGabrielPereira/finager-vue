<script setup lang="ts">
import { DialogTitle, type DialogTitleProps } from 'radix-vue'
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

interface Props extends DialogTitleProps {
  class?: HTMLAttributes['class']
}

const props = defineProps<Props>()
</script>

<template>
  <DialogTitle :class="cn('text-lg font-bold leading-none tracking-tight text-white', props.class)">
    <slot />
  </DialogTitle>
</template>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'
import TableRow from './TableRow.vue'
import TableCell from './TableCell.vue'

interface Props {
  class?: HTMLAttributes['class']
  colspan?: number
}

const props = withDefaults(defineProps<Props>(), {
  colspan: 1,
})
</script>

<template>
  <TableRow>
    <TableCell :colspan="colspan" :class="cn('p-8 text-center text-sm text-white/50', props.class)">
      <slot />
    </TableCell>
  </TableRow>
</template>

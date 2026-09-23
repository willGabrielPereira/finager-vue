<script setup lang="ts">
import {
  DialogClose,
  DialogContent,
  type DialogContentEmits,
  type DialogContentProps,
  DialogOverlay,
  DialogPortal,
  useForwardPropsEmits,
} from 'radix-vue'
import type { HTMLAttributes } from 'vue'
import { PhX } from '@phosphor-icons/vue'
import { cn } from '@/lib/utils'

interface Props extends DialogContentProps {
  class?: HTMLAttributes['class']
  hideCloseButton?: boolean
}

const props = defineProps<Props>()
const emits = defineEmits<DialogContentEmits>()

const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <DialogPortal>
    <DialogOverlay
      class="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
    />
    <DialogContent
      v-bind="forwarded"
      :class="
        cn(
          'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 rounded-2xl border border-white/10 bg-surface p-6 text-white shadow-2xl shadow-black/60 duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
          props.class
        )
      "
    >
      <slot />

      <DialogClose
        v-if="!hideCloseButton"
        class="absolute right-4 top-4 rounded-lg p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-accent/50 cursor-pointer"
      >
        <PhX :size="18" />
        <span class="sr-only">Fechar</span>
      </DialogClose>
    </DialogContent>
  </DialogPortal>
</template>

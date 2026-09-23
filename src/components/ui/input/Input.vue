<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

interface Props {
  defaultValue?: string | number
  modelValue?: string | number
  class?: HTMLAttributes['class']
  type?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
  autocomplete?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', payload: string | number): void
}>()

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <input
    :type="type || 'text'"
    :value="modelValue ?? defaultValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :required="required"
    :autocomplete="autocomplete"
    :class="
      cn(
        'flex h-11 w-full rounded-xl border border-white/10 bg-bg px-3.5 py-2.5 text-sm text-white placeholder-white/25 transition-all duration-200 outline-none focus:border-accent focus:ring-2 focus:ring-accent/50 disabled:cursor-not-allowed disabled:opacity-50',
        props.class
      )
    "
    @input="handleInput"
  />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { CalendarDate, type DateValue, parseDate } from '@internationalized/date'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { PhCalendarBlank } from '@phosphor-icons/vue'
import { cn } from '@/lib/utils'

interface Props {
  modelValue?: string
  placeholder?: string
  disabled?: boolean
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: 'Selecione a data...',
  disabled: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', val: string): void
}>()

const isOpen = ref(false)

// Converte 'YYYY-MM-DD' <-> CalendarDate (@internationalized/date)
const calendarValue = computed<DateValue | undefined>(() => {
  if (!props.modelValue) return undefined
  try {
    return parseDate(props.modelValue)
  } catch {
    return undefined
  }
})

const displayLabel = computed(() => {
  if (!calendarValue.value) return props.placeholder
  const d = calendarValue.value
  return `${String(d.day).padStart(2, '0')}/${String(d.month).padStart(2, '0')}/${d.year}`
})

const onSelect = (val: DateValue | undefined) => {
  if (!val) return
  const cd = val as CalendarDate
  const iso = `${cd.year}-${String(cd.month).padStart(2, '0')}-${String(cd.day).padStart(2, '0')}`
  emit('update:modelValue', iso)
  isOpen.value = false
}
</script>

<template>
  <Popover v-model:open="isOpen">
    <PopoverTrigger as-child>
      <button
        type="button"
        :disabled="disabled"
        :class="
          cn(
            'flex h-11 w-full items-center gap-2 rounded-xl border border-white/10 bg-bg px-3.5 py-2.5 text-sm transition-all duration-200 cursor-pointer outline-none hover:border-white/20 focus:border-accent focus:ring-2 focus:ring-accent/50',
            disabled && 'opacity-50 cursor-not-allowed',
            props.class
          )
        "
      >
        <PhCalendarBlank :size="16" class="text-white/40 shrink-0" />
        <span :class="calendarValue ? 'text-white font-medium' : 'text-white/40'">{{ displayLabel }}</span>
      </button>
    </PopoverTrigger>

    <PopoverContent align="start" :side-offset="6" class="w-auto p-0 rounded-2xl border-white/10 bg-surface shadow-2xl shadow-black/80">
      <Calendar
        :model-value="calendarValue"
        locale="pt-BR"
        weekday-format="short"
        @update:model-value="onSelect"
      />
    </PopoverContent>
  </Popover>
</template>

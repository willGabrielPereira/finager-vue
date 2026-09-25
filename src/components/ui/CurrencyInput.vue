<script setup lang="ts">
import { useCurrencyInput, CurrencyDisplay } from 'vue-currency-input'
import { watch } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: number | '' | null
    placeholder?: string
    disabled?: boolean
    id?: string
  }>(),
  {
    placeholder: '0,00',
    disabled: false,
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: number | null): void
}>()

const { inputRef, numberValue, setValue } = useCurrencyInput({
  currency: 'BRL',
  locale: 'pt-BR',
  currencyDisplay: CurrencyDisplay.hidden,
  hideCurrencySymbolOnFocus: false,
  hideGroupingSeparatorOnFocus: false,
  hideNegligibleDecimalDigitsOnFocus: false,
  precision: 2,
  valueRange: { min: 0 },
  autoDecimalDigits: true,
})

watch(numberValue, (val) => {
  emit('update:modelValue', val)
})

watch(
  () => props.modelValue,
  (val) => {
    setValue(val === '' || val === null || val === undefined ? null : Number(val))
  },
  { immediate: true }
)
</script>

<template>
  <div class="relative w-full">
    <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-white/50 pointer-events-none select-none">
      R$
    </span>
    <input
      ref="inputRef"
      :id="id"
      type="text"
      inputmode="decimal"
      :placeholder="placeholder"
      :disabled="disabled"
      class="w-full bg-slate-950 border border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-xl font-bold text-white placeholder-white/20 focus:outline-none focus:border-accent transition-colors disabled:opacity-50"
    />
  </div>
</template>

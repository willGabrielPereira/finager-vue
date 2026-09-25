<script setup lang="ts">
import Multiselect from '@vueform/multiselect'
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { PhCaretDown, PhX } from '@phosphor-icons/vue'

export interface AppSelectOption {
  value: any
  label: string
  sublabel?: string
  icon?: any
  color?: string
  badge?: string
  disabled?: boolean
}

const props = withDefaults(
  defineProps<{
    modelValue: any
    options: (AppSelectOption | any)[]
    mode?: 'single' | 'multiple' | 'tags'
    placeholder?: string
    disabled?: boolean
    canClear?: boolean
    clearable?: boolean // alias for canClear
    canDeselect?: boolean
    searchable?: boolean
    openDirection?: 'bottom' | 'top'
    closeOnSelect?: boolean
    noResultsText?: string
    noOptionsText?: string
    size?: 'sm' | 'md' | 'lg'
    teleport?: boolean // backwards compatibility
    align?: 'left' | 'right' // backwards compatibility
    minWidth?: string // backwards compatibility
  }>(),
  {
    mode: 'single',
    placeholder: 'Selecione...',
    disabled: false,
    canClear: false,
    clearable: false,
    canDeselect: false,
    searchable: undefined,
    openDirection: 'bottom',
    closeOnSelect: true,
    noResultsText: 'Nenhum resultado encontrado',
    noOptionsText: 'Nenhuma opção disponível',
    size: 'md'
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', val: any): void
  (e: 'change', val: any): void
  (e: 'select', val: any, option: any): void
  (e: 'deselect', val: any, option: any): void
  (e: 'clear'): void
}>()

const effectiveCanClear = computed(() => {
  return props.canClear || props.clearable
})

// Habilita busca se houver 8 ou mais opções, ou se especificado explicitamente
const isSearchable = computed(() => {
  if (props.searchable !== undefined) return props.searchable
  return props.options.length >= 8
})

// Normaliza as opções para garantir que o Multiselect entenda labels e valores
const normalizedOptions = computed(() => {
  return props.options.map(opt => {
    if (typeof opt === 'object' && opt !== null) {
      return {
        ...opt,
        value: opt.value,
        label: opt.label !== undefined ? opt.label : String(opt.value)
      }
    }
    return { value: opt, label: String(opt) }
  })
})

const onUpdate = (val: any) => {
  emit('update:modelValue', val)
  emit('change', val)
}

const getValuesCount = (values: any): number => {
  if (Array.isArray(values)) return values.length
  if (values && typeof values === 'object') return Object.keys(values).length
  return 0
}

const msRef = ref<any>(null)

const onWindowScroll = (e: Event) => {
  if (msRef.value && msRef.value.isOpen) {
    const target = e.target as HTMLElement
    // Ignore scrolling within the options dropdown itself
    if (target && (target.closest?.('.multiselect-dropdown') || target.classList?.contains('multiselect-dropdown'))) {
      return
    }
    msRef.value.close()
  }
}

onMounted(() => {
  window.addEventListener('scroll', onWindowScroll, true)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onWindowScroll, true)
})
</script>

<template>
  <div class="w-full finager-select" :class="[`finager-select-${size}`]">
    <Multiselect
      ref="msRef"
      :model-value="modelValue"
      :options="normalizedOptions"
      :mode="mode"
      :placeholder="placeholder"
      :disabled="disabled"
      :can-clear="effectiveCanClear"
      :can-deselect="canDeselect"
      :searchable="isSearchable"
      :open-direction="openDirection"
      :close-on-select="mode === 'single' ? closeOnSelect : false"
      :no-results-text="noResultsText"
      :no-options-text="noOptionsText"
      :append-to-body="teleport"
      @update:model-value="onUpdate"
      @select="(val, opt) => emit('select', val, opt)"
      @deselect="(val, opt) => emit('deselect', val, opt)"
      @clear="emit('clear')"
    >
      <!-- Slot de cada opção no menu suspenso -->
      <template #option="{ option }">
        <div class="flex items-center justify-between w-full py-0.5 gap-2 select-none">
          <div class="flex items-center gap-2.5 min-w-0">
            <!-- Ícone customizado -->
            <component 
              v-if="option.icon" 
              :is="option.icon" 
              :size="16" 
              class="shrink-0 text-white/70" 
            />
            <!-- Bolinha colorida (categorias) -->
            <span 
              v-else-if="option.color" 
              class="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
              :style="{ backgroundColor: option.color }"
            />

            <!-- Rótulo e sub-rótulo -->
            <div class="flex flex-col min-w-0">
              <span class="text-xs sm:text-[13px] font-medium text-white truncate">
                {{ option.label }}
              </span>
              <span v-if="option.sublabel" class="text-[10px] text-white/50 truncate">
                {{ option.sublabel }}
              </span>
            </div>
          </div>

          <!-- Badge se houver -->
          <span 
            v-if="option.badge" 
            class="shrink-0 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white/5 text-white/60 border border-white/10"
          >
            {{ option.badge }}
          </span>
        </div>
      </template>

      <!-- Slot do valor selecionado em modo single -->
      <template #singlelabel="{ value }">
        <div class="multiselect-single-label">
          <div class="flex items-center gap-2 max-w-full overflow-hidden">
            <component 
              v-if="value.icon" 
              :is="value.icon" 
              :size="15" 
              class="shrink-0 text-white/80" 
            />
            <span 
              v-else-if="value.color" 
              class="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
              :style="{ backgroundColor: value.color }"
            />
            <span class="text-xs sm:text-[13px] font-medium text-white truncate">
              {{ value.label }}
            </span>
          </div>
        </div>
      </template>

      <!-- Slot do valor selecionado em modo multiple (evita CLS mostrando contagem compacta) -->
      <template #multiplelabel="{ values }">
        <div class="flex items-center gap-1.5 text-xs text-white/90">
          <span class="px-1.5 py-0.5 rounded bg-accent/20 text-accent text-[11px] font-bold">
            {{ getValuesCount(values) }}
          </span>
          <span class="truncate text-white/70">selecionado{{ getValuesCount(values) > 1 ? 's' : '' }}</span>
        </div>
      </template>

      <!-- Ícone customizado de seta -->
      <template #caret>
        <div class="mr-2.5 text-white/50 group-hover:text-white/70 transition-colors pointer-events-none">
          <PhCaretDown :size="14" weight="bold" />
        </div>
      </template>

      <!-- Botão customizado de limpar -->
      <template #clear="{ clear }">
        <button 
          type="button" 
          @click.stop="clear" 
          class="mr-1 text-white/50 hover:text-white transition-colors cursor-pointer p-0.5"
          title="Limpar seleção"
        >
          <PhX :size="13" weight="bold" />
        </button>
      </template>
    </Multiselect>
  </div>
</template>

<style scoped>
.finager-select-sm :deep(.multiselect) {
  min-height: 36px;
  height: 36px;
}
.finager-select-md :deep(.multiselect) {
  min-height: 40px;
  height: 40px;
}
.finager-select-lg :deep(.multiselect) {
  min-height: 46px;
  height: 46px;
}
</style>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useTagsStore } from '../../stores/tags'
import CategoryCombobox from './CategoryCombobox.vue'
import { PhCaretDown, PhX, PhTag } from '@phosphor-icons/vue'

const props = withDefaults(
  defineProps<{
    modelValue?: string | null
    placeholder?: string
    disabled?: boolean
    clearable?: boolean
    size?: 'sm' | 'md'
  }>(),
  {
    modelValue: '',
    placeholder: 'Sem Categoria',
    disabled: false,
    clearable: true,
    size: 'md'
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', val: string | null): void
  (e: 'change', val: string | null): void
}>()

const tagsStore = useTagsStore()
const isOpen = ref(false)
const triggerRef = ref<HTMLElement | null>(null)
const dropdownPosition = ref({ left: '0px', top: '0px' })

const selectedTag = computed(() => {
  if (!props.modelValue) return null
  return tagsStore.tags.find(t => t.id === props.modelValue) || null
})

const updatePosition = () => {
  if (!triggerRef.value) return
  const rect = triggerRef.value.getBoundingClientRect()
  const dropdownHeight = 360
  const windowHeight = window.innerHeight
  const opensUpward = rect.bottom + dropdownHeight > windowHeight && rect.top - dropdownHeight > 0

  dropdownPosition.value = {
    left: Math.max(12, Math.min(rect.left, window.innerWidth - 340)) + 'px',
    top: (opensUpward 
      ? Math.max(12, rect.top - dropdownHeight - 6) 
      : (rect.bottom + 6)) + 'px',
  }
}

const toggleDropdown = () => {
  if (props.disabled) return
  if (isOpen.value) {
    isOpen.value = false
    return
  }
  updatePosition()
  isOpen.value = true
}

const close = () => {
  isOpen.value = false
}

const onSelect = (tagId: string | null) => {
  emit('update:modelValue', tagId || '')
  emit('change', tagId || '')
  close()
}

const onClear = (e: MouseEvent) => {
  e.stopPropagation()
  emit('update:modelValue', '')
  emit('change', '')
  close()
}

const handleOutsideClick = (e: MouseEvent) => {
  if (!isOpen.value) return
  const target = e.target as HTMLElement
  if (triggerRef.value && triggerRef.value.contains(target)) return
  if (target.closest('.category-select-dropdown') || target.closest('.category-combobox-container')) return
  close()
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && isOpen.value) {
    close()
  }
}

const handleScrollOrResize = (e: Event) => {
  if (!isOpen.value) return
  const target = e.target as HTMLElement
  if (target && (target.closest?.('.category-select-dropdown') || target.closest?.('.category-combobox-container'))) {
    return
  }
  updatePosition()
}

onMounted(() => {
  window.addEventListener('click', handleOutsideClick, true)
  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('scroll', handleScrollOrResize, true)
  window.addEventListener('resize', handleScrollOrResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('click', handleOutsideClick, true)
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('scroll', handleScrollOrResize, true)
  window.removeEventListener('resize', handleScrollOrResize)
})
</script>

<template>
  <div class="relative w-full">
    <!-- Trigger Button -->
    <button
      ref="triggerRef"
      type="button"
      :disabled="props.disabled"
      @click="toggleDropdown"
      class="w-full flex items-center justify-between bg-slate-950 border border-white/10 rounded-xl transition-all cursor-pointer select-none text-left"
      :class="[
        props.size === 'sm' ? 'h-9 px-3 text-xs' : 'h-10 px-3.5 text-xs',
        isOpen ? 'border-accent ring-1 ring-accent/40 shadow-sm' : 'hover:border-white/20',
        props.disabled ? 'opacity-50 cursor-not-allowed' : ''
      ]"
    >
      <!-- Label / Tag Selecionada -->
      <div class="flex items-center gap-2 truncate min-w-0">
        <template v-if="selectedTag">
          <span 
            class="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" 
            :style="{ backgroundColor: selectedTag.color || '#10b981' }"
          ></span>
          <span class="font-medium text-white truncate">{{ selectedTag.name }}</span>
        </template>
        <template v-else>
          <span class="text-white/40 truncate">{{ props.placeholder }}</span>
        </template>
      </div>

      <!-- Ícones da Direita: Clear e Caret -->
      <div class="flex items-center gap-1 shrink-0 ml-2">
        <button
          v-if="props.clearable && selectedTag && !props.disabled"
          type="button"
          @click="onClear"
          class="text-white/30 hover:text-red-400 p-0.5 rounded transition-colors cursor-pointer"
          title="Limpar categoria"
        >
          <PhX :size="12" />
        </button>
        <PhCaretDown 
          :size="14" 
          class="text-white/40 transition-transform duration-200"
          :class="{ 'rotate-180 text-accent': isOpen }"
        />
      </div>
    </button>

    <!-- Popover Teleportado para o Body -->
    <Teleport to="body">
      <div v-if="isOpen" class="relative z-[100050]">
        <!-- Mobile: Backdrop e Bottom Sheet -->
        <div 
          class="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100051] md:hidden animate-in fade-in duration-200" 
          @click="close"
        ></div>
        <div 
          class="fixed inset-x-0 bottom-0 z-[100052] bg-slate-950 border-t border-white/10 rounded-t-3xl p-4 md:hidden max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200"
        >
          <div class="flex items-center justify-between pb-3 border-b border-white/10 mb-2">
            <div class="flex items-center gap-2">
              <PhTag :size="16" class="text-accent" />
              <span class="text-xs font-bold text-white">Selecionar Categoria</span>
            </div>
            <button 
              type="button" 
              @click="close" 
              class="text-white/40 hover:text-white p-1 rounded-lg cursor-pointer"
            >
              <PhX :size="16" />
            </button>
          </div>
          <CategoryCombobox
            :category-id="modelValue"
            @select-category="onSelect"
            @close="close"
          />
        </div>

        <!-- Desktop: Dropdown Flutuante -->
        <div 
          class="hidden md:block fixed z-[100055] category-select-dropdown"
          :style="{
            left: dropdownPosition.left,
            top: dropdownPosition.top,
          }"
          @click.stop
        >
          <CategoryCombobox
            :category-id="modelValue"
            @select-category="onSelect"
            @close="close"
          />
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useTagsStore, type Tag } from '@/stores/tags'
import {
  Popover,
  PopoverTrigger,
  PopoverContent
} from '@/components/ui/popover'
import {
  PhMagnifyingGlass,
  PhCheck,
  PhX,
  PhClockCounterClockwise,
  PhPlus,
  PhTag,
  PhCaretDown
} from '@phosphor-icons/vue'
import { cn } from '@/lib/utils'

interface Props {
  modelValue?: string | null
  secondaryTags?: string[]
  placeholder?: string
  disabled?: boolean
  clearable?: boolean
  compact?: boolean
  align?: 'start' | 'center' | 'end'
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  secondaryTags: () => [],
  placeholder: 'Sem Categoria',
  disabled: false,
  clearable: true,
  compact: false,
  align: 'start',
})

const emit = defineEmits<{
  (e: 'update:modelValue', val: string | null): void
  (e: 'change', val: string | null): void
  (e: 'select-category', tagId: string | null): void
  (e: 'toggle-secondary-tag', tagId: string): void
}>()

const tagsStore = useTagsStore()
const isOpen = ref(false)
const searchQuery = ref('')
const searchInput = ref<HTMLInputElement | null>(null)
const focusedIndex = ref(0)
const isCreating = ref(false)
const selectedColor = ref('#22c55e')

const defaultColors = [
  '#22c55e', '#3b82f6', '#f59e0b', '#ef4444',
  '#ec4899', '#8b5cf6', '#06b6d4', '#64748b'
]

// Tag selecionada atualmente
const selectedTag = computed<Tag | null>(() => {
  if (!props.modelValue) return null
  return tagsStore.tags.find(t => t.id === props.modelValue) || null
})

// Filtragem em tempo real
const filteredTags = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return tagsStore.tags
  return tagsStore.tags.filter(t => t.name.toLowerCase().includes(q))
})

const exactMatchExists = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return tagsStore.tags.some(t => t.name.toLowerCase() === q)
})

watch(isOpen, (open) => {
  if (open) {
    searchQuery.value = ''
    focusedIndex.value = 0
    if (tagsStore.frequentTags.length === 0 && tagsStore.tags.length > 0) {
      tagsStore.fetchFrequentTags(60, 6)
    }
    nextTick(() => {
      searchInput.value?.focus()
    })
  }
})

watch(searchQuery, () => {
  focusedIndex.value = 0
})

const selectCategory = (tagId: string | null) => {
  emit('update:modelValue', tagId || '')
  emit('change', tagId || '')
  emit('select-category', tagId || '')
  isOpen.value = false
}

const toggleSecondary = (tagId: string) => {
  emit('toggle-secondary-tag', tagId)
}

const clearCategory = (e: MouseEvent) => {
  e.stopPropagation()
  emit('update:modelValue', '')
  emit('change', '')
  emit('select-category', null)
}

const handleCreateTag = async () => {
  const name = searchQuery.value.trim()
  if (!name) return

  isCreating.value = true
  try {
    const created = await tagsStore.createTag({
      name,
      color: selectedColor.value,
      icon: 'tag'
    })
    if (created && created.id) {
      selectCategory(created.id)
    }
  } finally {
    isCreating.value = false
  }
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (focusedIndex.value < filteredTags.value.length - 1) {
      focusedIndex.value++
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    if (focusedIndex.value > 0) {
      focusedIndex.value--
    }
  } else if (e.key === 'Enter') {
    e.preventDefault()
    if (filteredTags.value.length > 0 && filteredTags.value[focusedIndex.value]) {
      selectCategory(filteredTags.value[focusedIndex.value].id)
    } else if (searchQuery.value.trim() && !exactMatchExists.value) {
      handleCreateTag()
    }
  } else if (e.key === 'Escape') {
    isOpen.value = false
  }
}
</script>

<template>
  <Popover v-model:open="isOpen">
    <PopoverTrigger as-child>
      <!-- Modo Compacto (ex.: Célula da Tabela de Transações) -->
      <button
        v-if="compact"
        type="button"
        :disabled="disabled"
        :class="
          cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer border max-w-full truncate',
            selectedTag
              ? 'bg-surface-2/90 border-white/10 hover:border-white/20 text-white'
              : 'bg-white/[0.03] border-dashed border-white/15 text-white/40 hover:text-white/70 hover:bg-white/[0.06]',
            disabled && 'opacity-50 cursor-not-allowed',
            props.class
          )
        "
      >
        <span
          v-if="selectedTag"
          class="w-2 h-2 rounded-full shrink-0"
          :style="{ backgroundColor: selectedTag.color || '#22c55e' }"
        />
        <PhTag v-else :size="12" class="shrink-0 text-white/30" />
        <span class="truncate">{{ selectedTag ? selectedTag.name : placeholder }}</span>
      </button>

      <!-- Modo Form/Input Padrão -->
      <button
        v-else
        type="button"
        :disabled="disabled"
        :class="
          cn(
            'flex h-11 w-full items-center justify-between rounded-xl border border-white/10 bg-bg px-3.5 py-2.5 text-sm transition-all duration-200 cursor-pointer outline-none hover:border-white/20 focus:border-accent focus:ring-2 focus:ring-accent/50',
            disabled && 'opacity-50 cursor-not-allowed',
            props.class
          )
        "
      >
        <div class="flex items-center gap-2 truncate">
          <template v-if="selectedTag">
            <span
              class="w-2.5 h-2.5 rounded-full shrink-0"
              :style="{ backgroundColor: selectedTag.color || '#22c55e' }"
            />
            <span class="text-white font-medium truncate">{{ selectedTag.name }}</span>
          </template>
          <template v-else>
            <PhTag :size="16" class="text-white/30 shrink-0" />
            <span class="text-white/40">{{ placeholder }}</span>
          </template>
        </div>

        <div class="flex items-center gap-1 shrink-0 ml-2">
          <button
            v-if="clearable && selectedTag && !disabled"
            type="button"
            class="p-1 text-white/40 hover:text-rose-400 transition-colors cursor-pointer rounded"
            title="Remover Categoria"
            @click="clearCategory"
          >
            <PhX :size="14" />
          </button>
          <PhCaretDown :size="14" class="text-white/40 transition-transform" :class="{ 'rotate-180': isOpen }" />
        </div>
      </button>
    </PopoverTrigger>

    <PopoverContent
      :align="align"
      :side-offset="6"
      class="w-80 p-0 overflow-hidden rounded-2xl border-white/10 bg-surface shadow-2xl shadow-black/80"
    >
      <!-- Campo de Busca -->
      <div class="p-3 border-b border-white/5 flex items-center gap-2 bg-surface-2/40">
        <PhMagnifyingGlass :size="16" class="text-white/40 shrink-0" />
        <input
          ref="searchInput"
          v-model="searchQuery"
          type="text"
          placeholder="Buscar ou criar categoria..."
          class="w-full bg-transparent text-sm text-white placeholder-white/30 outline-none"
          @keydown="handleKeydown"
        />
        <button
          v-if="searchQuery"
          type="button"
          class="text-white/30 hover:text-white p-0.5"
          @click="searchQuery = ''"
        >
          <PhX :size="14" />
        </button>
      </div>

      <!-- Tags Frequentes (se não estiver buscando) -->
      <div
        v-if="!searchQuery && tagsStore.frequentTags.length > 0"
        class="p-2.5 border-b border-white/5 bg-surface-2/20"
      >
        <div class="text-[10px] font-semibold tracking-wider uppercase text-white/40 mb-1.5 flex items-center gap-1">
          <PhClockCounterClockwise :size="12" />
          <span>Frequentes</span>
        </div>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="ft in tagsStore.frequentTags"
            :key="ft.id"
            type="button"
            :class="
              cn(
                'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs transition-colors cursor-pointer border',
                modelValue === ft.id
                  ? 'bg-accent/20 border-accent/40 text-accent font-semibold'
                  : 'bg-surface-2 border-white/5 text-white/80 hover:bg-white/10'
              )
            "
            @click="selectCategory(ft.id)"
          >
            <span class="w-1.5 h-1.5 rounded-full shrink-0" :style="{ backgroundColor: ft.color || '#22c55e' }" />
            <span>{{ ft.name }}</span>
          </button>
        </div>
      </div>

      <!-- Lista de Categorias -->
      <div class="max-h-60 overflow-y-auto p-1.5 custom-scrollbar divide-y divide-white/[0.03]">
        <!-- Opção de Limpar Categoria -->
        <button
          v-if="modelValue && clearable"
          type="button"
          class="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer text-left font-medium mb-1"
          @click="selectCategory(null)"
        >
          <PhX :size="14" />
          <span>Remover categoria</span>
        </button>

        <!-- Itens Encontrados -->
        <div
          v-for="(tag, index) in filteredTags"
          :key="tag.id"
          :class="
            cn(
              'w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-colors cursor-pointer select-none',
              index === focusedIndex && 'bg-white/[0.06]',
              modelValue === tag.id ? 'bg-accent/15 text-accent font-semibold' : 'text-white/90 hover:bg-white/[0.04]'
            )
          "
          @click="selectCategory(tag.id)"
          @mouseenter="focusedIndex = index"
        >
          <div class="flex items-center gap-2.5 truncate">
            <span
              class="w-2.5 h-2.5 rounded-full shrink-0"
              :style="{ backgroundColor: tag.color || '#22c55e' }"
            />
            <span class="truncate">{{ tag.name }}</span>
          </div>

          <div class="flex items-center gap-1.5 shrink-0">
            <!-- Checkmark se for a categoria principal -->
            <PhCheck v-if="modelValue === tag.id" :size="14" class="text-accent" />

            <!-- Ação secundária para alternar tag adicional (se aplicável) -->
            <button
              v-if="secondaryTags"
              type="button"
              class="p-1 rounded hover:bg-white/10 text-white/30 hover:text-white"
              :title="secondaryTags.includes(tag.id) ? 'Remover tag secundária' : 'Adicionar tag secundária'"
              @click.stop="toggleSecondary(tag.id)"
            >
              <span
                class="w-1.5 h-1.5 rounded-full"
                :class="secondaryTags.includes(tag.id) ? 'bg-accent' : 'border border-white/40'"
              />
            </button>
          </div>
        </div>

        <!-- Mensagem de Nenhuma Categoria Encontrada -->
        <div v-if="filteredTags.length === 0 && !searchQuery" class="p-4 text-center text-xs text-white/40">
          Nenhuma categoria cadastrada.
        </div>
      </div>

      <!-- Criação Rápida de Nova Tag -->
      <div v-if="searchQuery.trim() && !exactMatchExists" class="p-3 border-t border-white/5 bg-surface-2/30">
        <div class="text-[11px] text-white/60 mb-2">
          Criar nova categoria: <strong class="text-white">"{{ searchQuery.trim() }}"</strong>
        </div>
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-1.5">
            <button
              v-for="color in defaultColors"
              :key="color"
              type="button"
              class="w-4 h-4 rounded-full transition-transform cursor-pointer"
              :style="{ backgroundColor: color }"
              :class="selectedColor === color ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'"
              @click="selectedColor = color"
            />
          </div>
          <button
            type="button"
            :disabled="isCreating"
            class="inline-flex items-center gap-1 px-3 py-1 bg-accent text-bg font-bold rounded-lg text-xs hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
            @click="handleCreateTag"
          >
            <PhPlus :size="12" weight="bold" />
            <span>Criar</span>
          </button>
        </div>
      </div>
    </PopoverContent>
  </Popover>
</template>

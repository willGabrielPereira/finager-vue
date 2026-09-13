<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useTagsStore } from '../../stores/tags'
import { 
  PhMagnifyingGlass, 
  PhCheck, 
  PhX, 
  PhClockCounterClockwise
} from '@phosphor-icons/vue'

const props = defineProps<{
  categoryId?: string | null
  secondaryTags?: string[]
  align?: 'left' | 'right'
}>()

const emit = defineEmits<{
  (e: 'select-category', tagId: string | null): void
  (e: 'toggle-secondary-tag', tagId: string): void
  (e: 'close'): void
}>()

const tagsStore = useTagsStore()
const searchInput = ref<HTMLInputElement | null>(null)
const searchQuery = ref('')
const focusedIndex = ref(0)
const isCreating = ref(false)
const newTagName = ref('')
const newTagColor = ref('#22c55e')

const defaultColors = [
  '#22c55e', '#3b82f6', '#f59e0b', '#ef4444', 
  '#ec4899', '#8b5cf6', '#06b6d4', '#64748b'
]

onMounted(() => {
  if (tagsStore.frequentTags.length === 0) {
    tagsStore.fetchFrequentTags(60, 6)
  }
  nextTick(() => {
    searchInput.value?.focus()
  })
})

const filteredTags = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return tagsStore.tags
  return tagsStore.tags.filter(t => t.name.toLowerCase().includes(q))
})

const exactMatchExists = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return tagsStore.tags.some(t => t.name.toLowerCase() === q)
})

watch(searchQuery, () => {
  focusedIndex.value = 0
})

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
    emit('close')
  }
}

const selectCategory = (tagId: string | null) => {
  emit('select-category', tagId)
}

const toggleSecondary = (tagId: string) => {
  emit('toggle-secondary-tag', tagId)
}

const handleCreateTag = async () => {
  const name = searchQuery.value.trim() || newTagName.value.trim()
  if (!name) return

  isCreating.value = true
  try {
    const created = await tagsStore.createTag({
      name,
      color: newTagColor.value,
      icon: 'tag'
    })
    selectCategory(created.id)
  } catch (err) {
    console.error('Falha ao criar tag:', err)
  } finally {
    isCreating.value = false
  }
}
</script>

<template>
  <div 
    class="w-80 rounded-2xl border border-white/10 bg-slate-950/95 backdrop-blur-xl p-3 shadow-2xl animate-in fade-in zoom-in-95 duration-150 flex flex-col gap-3 text-white"
    @click.stop
  >
    <!-- Seção: Mais Usadas Recentemente (1 Toque) -->
    <div v-if="tagsStore.frequentTags.length > 0" class="flex flex-col gap-1.5 pb-2 border-b border-white/10">
      <div class="flex items-center gap-1.5 text-[11px] font-semibold text-white/50 uppercase tracking-wider px-1">
        <PhClockCounterClockwise :size="12" class="text-accent" />
        <span>Frequentes recentes (30-60 dias)</span>
      </div>
      <div class="flex flex-wrap gap-1.5 pt-0.5">
        <button
          v-for="tag in tagsStore.frequentTags"
          :key="'freq-' + tag.id"
          type="button"
          @click="selectCategory(tag.id)"
          class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer hover:scale-105 active:scale-95"
          :style="{
            backgroundColor: (tag.color || '#10b981') + '20',
            borderColor: props.categoryId === tag.id ? tag.color : (tag.color || '#10b981') + '40',
            color: tag.color || '#10b981'
          }"
        >
          <span class="w-2 h-2 rounded-full" :style="{ backgroundColor: tag.color }"></span>
          <span>{{ tag.name }}</span>
          <PhCheck v-if="props.categoryId === tag.id" :size="12" />
        </button>
      </div>
    </div>

    <!-- Campo de Busca com Autofocus -->
    <div class="relative">
      <PhMagnifyingGlass class="absolute left-2.5 top-2.5 text-white/40" :size="15" />
      <input
        ref="searchInput"
        v-model="searchQuery"
        type="text"
        placeholder="Buscar categoria ou criar..."
        class="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-accent focus:bg-white/10 transition-colors"
        @keydown="handleKeydown"
      />
    </div>

    <!-- Lista de Categorias Filtradas -->
    <div class="max-h-48 overflow-y-auto flex flex-col gap-0.5 pr-1 scroll-smooth">
      <div v-if="filteredTags.length === 0 && !searchQuery.trim()" class="p-4 text-center text-xs text-white/40">
        Nenhuma categoria cadastrada.
      </div>

      <button
        v-for="(tag, idx) in filteredTags"
        :key="tag.id"
        type="button"
        @click="selectCategory(tag.id)"
        class="flex items-center justify-between px-2.5 py-2 rounded-lg text-xs text-left transition-colors cursor-pointer group"
        :class="[
          props.categoryId === tag.id ? 'bg-accent/15 text-accent font-semibold' : 'text-white/80 hover:bg-white/5 hover:text-white',
          focusedIndex === idx ? 'ring-1 ring-accent/40 bg-white/5' : ''
        ]"
      >
        <div class="flex items-center gap-2 truncate">
          <span class="w-2.5 h-2.5 rounded-full flex-shrink-0" :style="{ backgroundColor: tag.color }"></span>
          <span class="truncate">{{ tag.name }}</span>
          <span v-if="tag.is_system" class="text-[9px] px-1.5 py-0.2 rounded bg-white/5 text-white/40 font-normal">Sistema</span>
        </div>
        <PhCheck v-if="props.categoryId === tag.id" class="text-accent flex-shrink-0" :size="14" />
      </button>

      <!-- Opção de Criar Nova Tag se não existir exata -->
      <div v-if="searchQuery.trim() && !exactMatchExists" class="pt-1.5 border-t border-white/5 mt-1">
        <div class="text-[10px] text-white/40 px-2 mb-1">Criar como nova tag:</div>
        <div class="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-accent/10 border border-accent/20">
          <span class="w-3 h-3 rounded-full flex-shrink-0" :style="{ backgroundColor: newTagColor }"></span>
          <span class="text-xs font-semibold text-accent truncate flex-1">"{{ searchQuery.trim() }}"</span>
          <div class="flex gap-1">
            <span 
              v-for="color in defaultColors.slice(0, 4)" 
              :key="color"
              @click.stop="newTagColor = color"
              class="w-3.5 h-3.5 rounded-full cursor-pointer transition-transform hover:scale-110"
              :class="newTagColor === color ? 'ring-2 ring-white scale-110' : ''"
              :style="{ backgroundColor: color }"
            ></span>
          </div>
          <button
            type="button"
            @click="handleCreateTag"
            :disabled="isCreating"
            class="px-2 py-1 rounded bg-accent text-bg font-bold text-[10px] hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
          >
            Criar
          </button>
        </div>
      </div>
    </div>

    <!-- Tags Adicionais / Contextuais (Chips) -->
    <div v-if="props.secondaryTags && props.secondaryTags.length > 0" class="pt-2 border-t border-white/10 flex flex-col gap-1.5">
      <div class="text-[10px] font-semibold text-white/50 uppercase tracking-wider px-1">
        Marcadores Adicionais
      </div>
      <div class="flex flex-wrap gap-1">
        <span
          v-for="tagId in props.secondaryTags"
          :key="'sec-' + tagId"
          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-white/5 border border-white/10 text-white/70"
        >
          <span>#{{ tagsStore.tags.find(t => t.id === tagId)?.name || 'Tag' }}</span>
          <PhX 
            :size="10" 
            class="cursor-pointer hover:text-red-400 transition-colors" 
            @click.stop="toggleSecondary(tagId)"
          />
        </span>
      </div>
    </div>

    <!-- Rodapé de Ações Rápidas -->
    <div class="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
      <button
        type="button"
        @click="selectCategory(null)"
        class="text-red-400/80 hover:text-red-400 text-[11px] font-medium transition-colors cursor-pointer px-1"
      >
        Limpar Categoria
      </button>
      <button
        type="button"
        @click="emit('close')"
        class="text-white/40 hover:text-white text-[11px] transition-colors cursor-pointer"
      >
        Fechar (Esc)
      </button>
    </div>
  </div>
</template>

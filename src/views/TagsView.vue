<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useTagsStore, type Tag } from '../stores/tags'
import { api } from '../api/axios'
import { 
  PhTag, 
  PhPlus, 
  PhTrash, 
  PhX, 
  PhCheck, 
  PhCircleNotch,
  PhMagnifyingGlass 
} from '@phosphor-icons/vue'

const tagsStore = useTagsStore()

const isModalOpen = ref(false)
const newTagName = ref('')
const newTagColor = ref('#22c55e')
const saving = ref(false)
const searchQuery = ref('')
const deletingTagId = ref<string | null>(null)

const defaultColors = [
  '#22c55e', '#3b82f6', '#f59e0b', '#ef4444', 
  '#ec4899', '#8b5cf6', '#06b6d4', '#64748b',
  '#10b981', '#6366f1', '#14b8a6', '#d97706'
]

onMounted(() => {
  tagsStore.fetchTags()
})

const filteredTags = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return tagsStore.tags
  return tagsStore.tags.filter(t => t.name.toLowerCase().includes(q))
})

const handleCreate = async () => {
  if (!newTagName.value.trim()) return

  saving.value = true
  try {
    await tagsStore.createTag({
      name: newTagName.value.trim(),
      color: newTagColor.value,
      icon: 'tag'
    })
    newTagName.value = ''
    isModalOpen.value = false
  } catch (err) {
    console.error('Falha ao criar tag:', err)
    alert('Erro ao criar categoria.')
  } finally {
    saving.value = false
  }
}

const handleDelete = async (tag: Tag) => {
  if (tag.is_system) {
    alert('Tags de sistema são fixas e não podem ser removidas.')
    return
  }

  if (!confirm('Deseja realmente excluir a tag "' + tag.name + '"?')) return

  deletingTagId.value = tag.id
  try {
    await api.delete('/tags/' + tag.id)
    tagsStore.tags = tagsStore.tags.filter(t => t.id !== tag.id)
  } catch (err) {
    console.error('Falha ao excluir tag:', err)
    alert('Erro ao excluir tag.')
  } finally {
    deletingTagId.value = null
  }
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div>
        <h1 class="text-xl md:text-2xl font-bold tracking-tight">Categorias & Tags</h1>
        <p class="text-xs text-white/50">Gerencie as categorias do sistema e os marcadores personalizados da família</p>
      </div>

      <div class="flex items-center gap-3">
        <button
          type="button"
          @click="isModalOpen = true"
          class="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent text-bg font-bold text-xs hover:opacity-90 transition-all cursor-pointer shadow-lg shadow-accent/20 hover:scale-105 active:scale-95"
        >
          <PhPlus :size="16" weight="bold" />
          <span>Nova Categoria</span>
        </button>
      </div>
    </div>

    <!-- Barra de Pesquisa -->
    <div class="bg-surface p-3 rounded-2xl border border-white/5 flex items-center justify-between">
      <div class="relative w-full max-w-sm">
        <PhMagnifyingGlass class="absolute left-3 top-2.5 text-white/40" :size="16" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar categorias cadastradas..."
          class="w-full bg-slate-950 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-accent transition-colors"
        />
      </div>
      <div class="text-xs text-white/40">
        Total: <span class="text-white font-bold">{{ filteredTags.length }}</span> categorias
      </div>
    </div>

    <!-- Grid de Tags -->
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      <div
        v-for="tag in filteredTags"
        :key="tag.id"
        class="bg-surface p-4 rounded-2xl border border-white/5 hover:border-white/15 transition-all flex items-center justify-between group shadow-sm"
      >
        <div class="flex items-center gap-3 min-w-0">
          <div 
            class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            :style="{ backgroundColor: (tag.color || '#10b981') + '20', color: tag.color || '#10b981' }"
          >
            <PhTag :size="20" weight="duotone" />
          </div>
          <div class="min-w-0">
            <h4 class="text-sm font-bold text-white truncate">{{ tag.name }}</h4>
            <span class="text-[10px] text-white/40 font-medium">
              {{ tag.is_system ? 'Padrão do Sistema' : 'Customizada da Família' }}
            </span>
          </div>
        </div>

        <button
          v-if="!tag.is_system"
          type="button"
          @click="handleDelete(tag)"
          :disabled="deletingTagId === tag.id"
          class="p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-colors cursor-pointer"
          title="Excluir tag"
        >
          <PhCircleNotch v-if="deletingTagId === tag.id" :size="16" class="animate-spin" />
          <PhTrash v-else :size="16" />
        </button>
      </div>
    </div>

    <!-- Modal: Nova Tag -->
    <div
      v-if="isModalOpen"
      class="fixed inset-0 z-[10002] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      @click="isModalOpen = false"
    >
      <div
        class="bg-surface border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6 relative flex flex-col gap-4 text-white animate-in zoom-in-95 duration-200"
        @click.stop
      >
        <button
          @click="isModalOpen = false"
          class="absolute top-4 right-4 text-white/50 hover:text-white p-1 rounded-lg hover:bg-white/5"
        >
          <PhX :size="20" />
        </button>

        <div>
          <h3 class="text-lg font-bold">Nova Categoria</h3>
          <p class="text-xs text-white/50">Crie uma tag para organizar seus gastos</p>
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold text-white/70">Nome da Categoria</label>
          <input
            v-model="newTagName"
            type="text"
            placeholder="Ex: Assinaturas, Hobbies..."
            class="bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-accent"
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold text-white/70">Cor de Identificação</label>
          <div class="flex items-center gap-2 pt-1 flex-wrap">
            <button
              v-for="color in defaultColors"
              :key="color"
              type="button"
              @click="newTagColor = color"
              class="w-6 h-6 rounded-full flex items-center justify-center transition-transform hover:scale-110 cursor-pointer"
              :style="{ backgroundColor: color }"
            >
              <PhCheck v-if="newTagColor === color" :size="14" class="text-white" weight="bold" />
            </button>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
          <button
            type="button"
            @click="isModalOpen = false"
            class="px-4 py-2 text-xs font-semibold text-white/50 hover:text-white transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            @click="handleCreate"
            :disabled="saving || !newTagName.trim()"
            class="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-bg font-bold text-xs hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
          >
            <PhCircleNotch v-if="saving" :size="16" class="animate-spin" />
            <PhPlus v-else :size="16" weight="bold" />
            <span>{{ saving ? 'Salvando...' : 'Salvar Categoria' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

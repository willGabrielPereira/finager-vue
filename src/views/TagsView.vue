<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useTagsStore, type Tag } from '../stores/tags'
import { toast, showAlert } from '../utils/feedback'
import { minLengthText } from '@/validation/schemas'
import { 
  PhTag, 
  PhPlus, 
  PhTrash, 
  PhPencilSimple,
  PhLock,
  PhCheck, 
  PhCircleNotch,
  PhMagnifyingGlass,
  PhWarningCircle
} from '@phosphor-icons/vue'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'

const tagsStore = useTagsStore()

const isModalOpen = ref(false)
const modalMode = ref<'create' | 'edit'>('create')
const editingTagId = ref<string | null>(null)
const formTagName = ref('')
const formTagColor = ref('#22c55e')
const formError = ref('')
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

const openCreateModal = () => {
  modalMode.value = 'create'
  editingTagId.value = null
  formTagName.value = ''
  formTagColor.value = '#22c55e'
  formError.value = ''
  isModalOpen.value = true
}

const openEditModal = (tag: Tag) => {
  if (tag.is_system) return
  modalMode.value = 'edit'
  editingTagId.value = tag.id
  formTagName.value = tag.name
  formTagColor.value = tag.color || '#22c55e'
  formError.value = ''
  isModalOpen.value = true
}

const handleSubmit = async () => {
  const nameCheck = minLengthText(2, 'O nome da categoria deve ter pelo menos 2 caracteres.').safeParse(formTagName.value)
  if (!nameCheck.success) {
    formError.value = nameCheck.error.issues[0].message
    return
  }
  const name = nameCheck.data

  saving.value = true
  formError.value = ''

  try {
    if (modalMode.value === 'create') {
      await tagsStore.createTag({
        name,
        color: formTagColor.value,
        icon: 'tag'
      })
      toast.success('Categoria criada.')
    } else if (editingTagId.value) {
      await tagsStore.updateTag(editingTagId.value, {
        name,
        color: formTagColor.value,
        icon: 'tag'
      })
      toast.success('Categoria atualizada.')
    }
    isModalOpen.value = false
  } catch (err: any) {
    console.error('Falha ao salvar tag:', err)
    formError.value = err.response?.data?.message || err.response?.data?.error || 'Erro ao salvar categoria.'
  } finally {
    saving.value = false
  }
}

const handleDelete = async (tag: Tag) => {
  if (tag.is_system) {
    toast.warning('Ação não permitida', 'Categorias do sistema são fixas e não podem ser removidas.')
    return
  }

  const confirmed = await showAlert.confirm({
    // Nome digitado pelo usuário: o SweetAlert2 renderiza `title` como HTML (não escapa),
    // então nunca interpole dado de usuário ali — só em `text`, que vai como texto puro.
    title: 'Excluir categoria?',
    text: `A categoria "${tag.name}": as transações com ela ficarão sem categoria e as regras automáticas ligadas a ela serão apagadas.`,
    confirmText: 'Sim, excluir',
    cancelText: 'Cancelar',
    isDestructive: true,
  })
  if (!confirmed) return

  deletingTagId.value = tag.id
  try {
    await tagsStore.deleteTag(tag.id)
    toast.success('Categoria excluída.')
  } catch (err) {
    console.error('Falha ao excluir tag:', err)
    toast.error('Erro ao excluir', 'Não foi possível excluir a categoria.')
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
        <h1 class="text-xl md:text-2xl font-bold tracking-tight">Categorias</h1>
        <p class="text-xs text-white/50">Categorias do sistema e as criadas pela sua família</p>
      </div>

      <div class="flex items-center gap-3">
        <Button
          size="sm"
          @click="openCreateModal"
          class="gap-1.5 font-bold shadow-lg shadow-accent/20"
        >
          <PhPlus :size="16" weight="bold" />
          <span>Nova Categoria</span>
        </Button>
      </div>
    </div>

    <!-- Barra de Pesquisa -->
    <Card class="p-3 flex items-center justify-between gap-4">
      <div class="relative w-full max-w-sm">
        <PhMagnifyingGlass class="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 z-10" :size="16" />
        <Input
          v-model="searchQuery"
          type="search"
          aria-label="Buscar categorias"
          placeholder="Buscar categorias..."
          class="pl-9 pr-3"
        />
      </div>
      <div class="hidden sm:block text-xs text-white/50 shrink-0">
        Total: <span class="text-white font-bold">{{ filteredTags.length }}</span> categorias
      </div>
    </Card>

    <div v-if="tagsStore.loading && tagsStore.tags.length === 0" class="p-12 text-center text-white/50 flex flex-col items-center gap-3">
      <PhCircleNotch class="animate-spin text-accent" :size="28" />
      <span class="text-xs">Carregando categorias...</span>
    </div>

    <Card v-else-if="tagsStore.loadError" class="p-8 text-center flex flex-col items-center gap-3" role="alert">
      <PhWarningCircle :size="28" class="text-rose-400" weight="duotone" />
      <p class="text-sm font-semibold text-white">Não foi possível carregar as categorias</p>
      <Button size="sm" variant="outline" @click="tagsStore.fetchTags()">Tentar novamente</Button>
    </Card>

    <div v-else-if="filteredTags.length === 0 && searchQuery" class="p-10 text-center text-xs text-white/50 flex flex-col items-center gap-2">
      <span>Nenhuma categoria encontrada para "{{ searchQuery }}".</span>
      <button type="button" class="px-3 py-2 text-accent hover:underline cursor-pointer" @click="searchQuery = ''">Limpar busca</button>
    </div>

    <!-- Grid de Tags -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      <Card
        v-for="tag in filteredTags"
        :key="tag.id"
        class="p-4 hover:border-white/15 transition-all flex items-center justify-between group shadow-sm"
        :class="{ 'cursor-pointer hover:bg-white/[0.02]': !tag.is_system }"
        @click="!tag.is_system && openEditModal(tag)"
      >
        <div class="flex items-center gap-3 min-w-0 flex-1 pr-2">
          <div 
            class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
            :style="{ backgroundColor: (tag.color || '#10b981') + '20', color: tag.color || '#10b981' }"
          >
            <PhTag :size="20" weight="duotone" />
          </div>
          <div class="min-w-0">
            <h4 class="text-sm font-bold text-white truncate">{{ tag.name }}</h4>
            <span class="text-[11px] text-white/50 font-medium">
              {{ tag.is_system ? 'Padrão do sistema' : 'Criada pela família' }}
            </span>
          </div>
        </div>

        <!-- Ações do Card -->
        <div class="flex items-center gap-1 shrink-0" @click.stop>
          <!-- Indicador de Tag de Sistema Fixa -->
          <span
            v-if="tag.is_system"
            class="p-1.5 text-white/20 hover:text-white/40 transition-colors"
            title="Categoria nativa do sistema (somente leitura)"
          >
            <PhLock :size="16" />
          </span>

          <!-- Botões de Ação para Tags Customizadas -->
          <template v-else>
            <button
              type="button"
              @click="openEditModal(tag)"
              class="p-2.5 rounded-lg text-white/50 hover:text-accent hover:bg-accent/10 transition-colors cursor-pointer"
              title="Editar categoria"
              aria-label="Editar categoria"
            >
              <PhPencilSimple :size="16" />
            </button>
            <button
              type="button"
              @click="handleDelete(tag)"
              :disabled="deletingTagId === tag.id"
              class="p-2.5 rounded-lg text-white/50 hover:text-red-400 hover:bg-red-400/10 transition-colors cursor-pointer"
              title="Excluir categoria"
              aria-label="Excluir categoria"
            >
              <PhCircleNotch v-if="deletingTagId === tag.id" :size="16" class="animate-spin" />
              <PhTrash v-else :size="16" />
            </button>
          </template>
        </div>
      </Card>
    </div>

    <!-- Modal: Criar / Editar Tag -->
    <Dialog v-model:open="isModalOpen">
      <DialogContent class="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {{ modalMode === 'create' ? 'Nova Categoria' : 'Editar Categoria' }}
          </DialogTitle>
          <DialogDescription>
            {{ modalMode === 'create' ? 'Crie uma tag para organizar seus gastos' : 'Altere o nome e a cor de identificação' }}
          </DialogDescription>
        </DialogHeader>

        <!-- Live Preview do Badge -->
        <div class="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-3">
          <div 
            class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
            :style="{ backgroundColor: formTagColor + '20', color: formTagColor }"
          >
            <PhTag :size="20" weight="duotone" />
          </div>
          <div class="min-w-0">
            <span class="text-xs font-bold text-white truncate block">
              {{ formTagName.trim() || 'Nome da Categoria' }}
            </span>
            <span class="text-[10px] text-white/50 font-medium">Pré-visualização</span>
          </div>
        </div>

        <div v-if="formError" class="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          {{ formError }}
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="tag-form-name" class="text-xs font-semibold text-white/70">Nome da Categoria</label>
          <Input
            id="tag-form-name"
            v-model="formTagName"
            type="text"
            placeholder="Ex: Assinaturas, Hobbies..."
            @keydown.enter="handleSubmit"
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold text-white/70">Cor de Identificação</label>
          <div class="flex items-center gap-2 pt-1 flex-wrap">
            <button
              v-for="color in defaultColors"
              :key="color"
              type="button"
              @click="formTagColor = color"
              :aria-label="`Cor ${color}`"
              :aria-pressed="formTagColor === color"
              class="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 cursor-pointer relative"
              :style="{ backgroundColor: color }"
            >
              <PhCheck v-if="formTagColor === color" :size="14" class="text-white" weight="bold" />
            </button>

            <!-- Seletor de Cor Customizada -->
            <label 
              class="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer border border-dashed border-white/30 hover:border-white/60 transition-colors overflow-hidden relative"
              title="Escolher cor personalizada"
            >
              <input
                type="color"
                v-model="formTagColor"
                class="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <span class="text-[9px] font-bold text-white/60">+</span>
            </label>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
          <Button
            type="button"
            variant="outline"
            size="sm"
            @click="isModalOpen = false"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            size="sm"
            @click="handleSubmit"
            :disabled="saving || !formTagName.trim()"
            class="gap-2 font-bold"
          >
            <PhCircleNotch v-if="saving" :size="16" class="animate-spin" />
            <PhCheck v-else-if="modalMode === 'edit'" :size="16" weight="bold" />
            <PhPlus v-else :size="16" weight="bold" />
            <span>{{ saving ? 'Salvando...' : (modalMode === 'edit' ? 'Salvar Alterações' : 'Salvar Categoria') }}</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>

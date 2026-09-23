<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from '../api/axios'
import { useTagsStore } from '../stores/tags'
import { showAlert, toast } from '../utils/feedback'
import { 
  PhListDashes, 
  PhPlus, 
  PhTrash, 
  PhMagnifyingGlass, 
  PhShieldCheck,
  PhStorefront,
  PhArrowRight
} from '@phosphor-icons/vue'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { TagCombobox } from '@/components/ui/tag-combobox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

interface MerchantRule {
  id: string
  pattern: string
  tag_id: string
  tag?: {
    id: string
    name: string
    color: string
  }
  created_at: string
}

const tagsStore = useTagsStore()

const rules = ref<MerchantRule[]>([])
const loading = ref(false)
const searchQuery = ref('')
const isCreateModalOpen = ref(false)
const submitting = ref(false)
const errorMsg = ref('')

const newPattern = ref('')
const newTagId = ref('')

const fetchRules = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/merchant-rules')
    rules.value = data || []
  } catch (err) {
    console.error('Falha ao buscar regras de estabelecimentos', err)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await Promise.all([
    fetchRules(),
    tagsStore.fetchTags()
  ])
})

const filteredRules = computed(() => {
  if (!searchQuery.value.trim()) return rules.value
  const q = searchQuery.value.toLowerCase()
  return rules.value.filter(r => 
    r.pattern.toLowerCase().includes(q) || 
    r.tag?.name.toLowerCase().includes(q)
  )
})

const handleCreateRule = async () => {
  if (!newPattern.value.trim() || !newTagId.value) {
    errorMsg.value = 'Informe o nome do estabelecimento e a categoria.'
    return
  }

  submitting.value = true
  errorMsg.value = ''

  try {
    await api.post('/merchant-rules', {
      pattern: newPattern.value.trim().toUpperCase(),
      tag_id: newTagId.value,
    })
    newPattern.value = ''
    newTagId.value = ''
    isCreateModalOpen.value = false
    await fetchRules()
  } catch (err: any) {
    errorMsg.value = err.response?.data?.error || err.response?.data?.message || 'Falha ao salvar regra.'
  } finally {
    submitting.value = false
  }
}

const handleDeleteRule = async (id: string) => {
  const confirmed = await showAlert.confirm({
    title: 'Excluir regra de estabelecimento?',
    text: 'Lançamentos futuros com este padrão não serão mais categorizados automaticamente por esta regra.',
    confirmText: 'Sim, excluir',
    cancelText: 'Cancelar',
    isDestructive: true,
  })
  if (!confirmed) return

  try {
    await api.delete(`/merchant-rules/${id}`)
    rules.value = rules.value.filter(r => r.id !== id)
    toast.success('Regra excluída com sucesso.')
  } catch (err: any) {
    console.error('Falha ao excluir regra', err)
    toast.error('Erro ao excluir regra', err?.response?.data?.message || err?.response?.data?.error || 'Não foi possível excluir a regra.')
  }
}
</script>

<template>
  <div class="max-w-5xl mx-auto flex flex-col gap-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <PhStorefront :size="26" class="text-accent" weight="duotone" />
          <span>Regras de Estabelecimentos</span>
        </h1>
        <p class="text-white/50 text-xs sm:text-sm mt-1">
          Memória determinística (Camada 1). Padrões cadastrados aqui têm prioridade absoluta sobre o classificador Naive Bayes.
        </p>
      </div>

      <Button
        size="sm"
        @click="isCreateModalOpen = true"
        class="gap-2 font-bold shadow-lg shadow-accent/15 shrink-0"
      >
        <PhPlus :size="16" weight="bold" />
        <span>Nova Regra</span>
      </Button>
    </div>

    <!-- Explicação das Camadas -->
    <Card class="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-accent/15 text-accent flex items-center justify-center border border-accent/25">
          <PhShieldCheck :size="22" weight="duotone" />
        </div>
        <div>
          <h3 class="text-sm font-bold text-white">Hierarquia de Auto-Classificação</h3>
          <p class="text-xs text-white/50 mt-0.5">
            1º Estabelecimentos Salvos (100% de confiança) &rarr; 2º IA Bayesiana (com margem de corte).
          </p>
        </div>
      </div>
      <div class="px-3 py-1.5 rounded-xl bg-white/5 text-white/60 text-xs font-mono border border-white/5">
        {{ rules.length }} regras cadastradas
      </div>
    </Card>

    <!-- Barra de Busca -->
    <div class="relative">
      <PhMagnifyingGlass :size="18" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 z-10" />
      <Input
        v-model="searchQuery"
        type="text"
        placeholder="Buscar regra por estabelecimento ou tag..."
        class="pl-10 pr-4 text-xs sm:text-sm"
      />
    </div>

    <!-- Lista de Regras -->
    <Card class="overflow-hidden shadow-md">
      <div v-if="loading" class="p-12 text-center text-white/40 text-sm">
        Carregando regras...
      </div>

      <div v-else-if="filteredRules.length === 0" class="p-12 text-center flex flex-col items-center">
        <div class="w-12 h-12 rounded-2xl bg-white/5 text-white/30 flex items-center justify-center mb-3">
          <PhListDashes :size="24" />
        </div>
        <p class="text-sm font-semibold text-white/70">Nenhuma regra de estabelecimento encontrada</p>
        <p class="text-xs text-white/40 mt-1 max-w-sm">
          Você pode cadastrar regras manualmente acima, ou ao categorizar uma transação e clicar para propagar para similares.
        </p>
      </div>

      <div v-else class="divide-y divide-white/5">
        <div
          v-for="rule in filteredRules"
          :key="rule.id"
          class="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
        >
          <!-- Padrão e Tag -->
          <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white font-mono text-xs font-bold tracking-wider truncate">
                {{ rule.pattern }}
              </span>
            </div>

            <div class="hidden sm:flex items-center text-white/30">
              <PhArrowRight :size="14" />
            </div>

            <div class="flex items-center gap-1.5">
              <span 
                v-if="rule.tag"
                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                :style="{
                  backgroundColor: `${rule.tag.color}20`,
                  borderColor: `${rule.tag.color}40`,
                  borderWidth: '1px',
                  color: rule.tag.color || '#10b981'
                }"
              >
                <span class="w-1.5 h-1.5 rounded-full" :style="{ backgroundColor: rule.tag.color || '#10b981' }"></span>
                <span>{{ rule.tag.name }}</span>
              </span>
              <span v-else class="text-white/40 text-xs italic">Tag não encontrada</span>
            </div>
          </div>

          <!-- Botão Excluir -->
          <button
            type="button"
            @click="handleDeleteRule(rule.id)"
            class="p-2 text-white/40 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
            title="Excluir regra"
          >
            <PhTrash :size="16" />
          </button>
        </div>
      </div>
    </Card>

    <!-- Modal Nova Regra -->
    <Dialog v-model:open="isCreateModalOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2 text-sm font-bold text-white">
            <PhPlus :size="18" weight="bold" class="text-accent" />
            <span>Nova Regra de Estabelecimento</span>
          </DialogTitle>
        </DialogHeader>

        <form @submit.prevent="handleCreateRule" class="flex flex-col gap-4">
          <div>
            <label class="text-xs font-semibold text-white/80 mb-1.5 block">
              Padrão do Estabelecimento (busca contida no extrato)
            </label>
            <Input
              v-model="newPattern"
              type="text"
              placeholder="ex: UBER, IFOOD, POSTO SHELL"
              class="uppercase font-mono"
            />
            <span class="text-[10px] text-white/40 mt-1 block">
              Qualquer transação cujo nome contenha esse texto receberá a tag abaixo.
            </span>
          </div>

          <div>
            <label class="text-xs font-semibold text-white/80 mb-1.5 block">
              Categoria / Tag Vinculada
            </label>
            <TagCombobox
              v-model="newTagId"
              placeholder="Selecione uma categoria..."
            />
          </div>

          <div v-if="errorMsg" class="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl">
            {{ errorMsg }}
          </div>

          <div class="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              @click="isCreateModalOpen = false"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              :disabled="submitting || !newPattern.trim() || !newTagId"
              class="font-bold"
            >
              <span v-if="submitting">Salvando...</span>
              <span v-else>Salvar Regra</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>

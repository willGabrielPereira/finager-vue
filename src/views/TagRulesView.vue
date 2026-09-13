<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from '../api/axios'
import { useTagsStore } from '../stores/tags'
import AppSelect, { type AppSelectOption } from '../components/ui/AppSelect.vue'
import { 
  PhListDashes, 
  PhPlus, 
  PhTrash, 
  PhMagnifyingGlass, 
  PhShieldCheck,
  PhStorefront,
  PhX,
  PhArrowRight
} from '@phosphor-icons/vue'

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

const tagOptions = computed<AppSelectOption[]>(() => {
  return tagsStore.tags.map(tag => ({
    value: tag.id,
    label: tag.name,
    color: tag.color || '#10b981'
  }))
})


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
  if (!confirm('Deseja excluir esta regra de estabelecimento?')) return
  try {
    await api.delete(`/merchant-rules/${id}`)
    rules.value = rules.value.filter(r => r.id !== id)
  } catch (err) {
    console.error('Falha ao excluir regra', err)
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

      <button
        type="button"
        @click="isCreateModalOpen = true"
        class="flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-accent text-bg font-bold text-xs sm:text-sm hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-lg shadow-accent/15 whitespace-nowrap shrink-0"
      >
        <PhPlus :size="16" weight="bold" />
        <span>Nova Regra</span>
      </button>
    </div>

    <!-- Explicação das Camadas -->
    <div class="bg-surface rounded-2xl p-5 border border-white/5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
    </div>

    <!-- Barra de Busca -->
    <div class="relative">
      <PhMagnifyingGlass :size="18" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Buscar regra por estabelecimento ou tag..."
        class="w-full bg-surface border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
      />
    </div>

    <!-- Lista de Regras -->
    <div class="bg-surface rounded-2xl border border-white/5 shadow-md overflow-hidden">
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
    </div>

    <!-- Modal Nova Regra -->
    <div
      v-if="isCreateModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      @click.self="isCreateModalOpen = false"
    >
      <div class="bg-surface rounded-2xl w-full max-w-md border border-white/10 shadow-2xl p-6 flex flex-col gap-5">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-accent/20 text-accent flex items-center justify-center">
              <PhPlus :size="18" weight="bold" />
            </div>
            <h3 class="text-base font-bold text-white">Nova Regra de Estabelecimento</h3>
          </div>
          <button
            type="button"
            @click="isCreateModalOpen = false"
            class="text-white/40 hover:text-white p-1 rounded-lg"
          >
            <PhX :size="18" />
          </button>
        </div>

        <form @submit.prevent="handleCreateRule" class="flex flex-col gap-4">
          <div>
            <label class="text-xs font-semibold text-white/80 mb-1.5 block">
              Padrão do Estabelecimento (busca contida no extrato)
            </label>
            <input
              v-model="newPattern"
              type="text"
              placeholder="ex: UBER, IFOOD, POSTO SHELL"
              class="w-full bg-bg border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent uppercase font-mono"
            />
            <span class="text-[10px] text-white/40 mt-1 block">
              Qualquer transação cujo nome contenha esse texto receberá a tag abaixo.
            </span>
          </div>

          <div>
            <label class="text-xs font-semibold text-white/80 mb-1.5 block">
              Categoria / Tag Vinculada
            </label>
            <AppSelect
              v-model="newTagId"
              :options="tagOptions"
              placeholder="Selecione uma categoria..."
              size="md"
            />
          </div>

          <div v-if="errorMsg" class="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl">
            {{ errorMsg }}
          </div>

          <div class="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              @click="isCreateModalOpen = false"
              class="px-4 py-2 rounded-xl text-xs font-semibold text-white/70 hover:bg-white/5 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="submitting || !newPattern.trim() || !newTagId"
              class="px-5 py-2 rounded-xl bg-accent text-bg text-xs font-bold hover:opacity-90 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-accent/15"
            >
              <span v-if="submitting">Salvando...</span>
              <span v-else>Salvar Regra</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

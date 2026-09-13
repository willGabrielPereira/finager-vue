<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../api/axios'
import { 
  PhUploadSimple, 
  PhFileCode, 
  PhCheckCircle, 
  PhCreditCard, 
  PhBank, 
  PhArrowRight,
  PhWarningCircle,
  PhLightning,
  PhArrowsClockwise,
  PhPlus,
  PhUsers,
  PhLock
} from '@phosphor-icons/vue'

const router = useRouter()

const accounts = ref<any[]>([])
const selectedAccountId = ref('')
const selectedFile = ref<File | null>(null)
const isDragging = ref(false)
const loading = ref(false)
const errorMsg = ref('')

const importResult = ref<{
  total_read?: number
  inserted?: number
  duplicates?: number
  reconciled?: number
  message?: string
} | null>(null)

const fetchAccounts = async () => {
  try {
    const { data } = await api.get('/accounts')
    accounts.value = data || []
    if (accounts.value.length > 0 && !selectedAccountId.value) {
      selectedAccountId.value = accounts.value[0].id
    }
  } catch (err) {
    console.error('Falha ao buscar contas', err)
  }
}

onMounted(() => {
  fetchAccounts()
})

const handleFileDrop = (e: DragEvent) => {
  isDragging.value = false
  if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
    const file = e.dataTransfer.files[0]
    if (file.name.toLowerCase().endsWith('.ofx')) {
      selectedFile.value = file
      errorMsg.value = ''
    } else {
      errorMsg.value = 'Por favor, selecione um arquivo válido com extensão .ofx'
    }
  }
}

const handleFileSelect = (e: Event) => {
  const input = e.target as HTMLInputElement
  if (input.files && input.files.length > 0) {
    selectedFile.value = input.files[0]
    errorMsg.value = ''
  }
}

const handleImport = async () => {
  if (!selectedAccountId.value) {
    errorMsg.value = 'Selecione a conta de destino antes de importar.'
    return
  }
  if (!selectedFile.value) {
    errorMsg.value = 'Selecione um arquivo OFX para importar.'
    return
  }

  loading.value = true
  errorMsg.value = ''
  importResult.value = null

  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    formData.append('account_id', selectedAccountId.value)

    const { data } = await api.post('/transactions/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    importResult.value = data
  } catch (err: any) {
    errorMsg.value = err.response?.data?.error || err.response?.data?.message || 'Falha ao processar arquivo OFX.'
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  selectedFile.value = null
  importResult.value = null
  errorMsg.value = ''
}
</script>

<template>
  <div class="max-w-4xl mx-auto flex flex-col gap-6">
    <!-- Header -->
    <div>
      <h1 class="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
        <PhUploadSimple :size="26" class="text-accent" weight="duotone" />
        <span>Importação de Extrato OFX</span>
      </h1>
      <p class="text-white/50 text-xs sm:text-sm mt-1">
        Importe extratos bancários de conta corrente e faturas de cartão de crédito. O Finager reconcilia lançamentos manuais automaticamente.
      </p>
    </div>

    <!-- Sucesso / Resultado da Importação -->
    <div 
      v-if="importResult" 
      class="bg-surface rounded-2xl p-6 sm:p-8 border border-accent/20 shadow-xl flex flex-col gap-6"
    >
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 rounded-2xl bg-accent/20 text-accent flex items-center justify-center border border-accent/30">
          <PhCheckCircle :size="28" weight="fill" />
        </div>
        <div>
          <h2 class="text-lg font-bold text-white">Importação Concluída com Sucesso!</h2>
          <p class="text-white/60 text-xs sm:text-sm">{{ importResult.message || 'Seu arquivo OFX foi processado e reconciliado.' }}</p>
        </div>
      </div>

      <!-- Métricas -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="p-4 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col">
          <span class="text-white/40 text-xs">Total Lido</span>
          <span class="text-xl font-bold text-white mt-1">{{ importResult.total_read ?? '-' }}</span>
        </div>
        <div class="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col">
          <span class="text-emerald-400 text-xs">Novos Lançamentos</span>
          <span class="text-xl font-bold text-emerald-400 mt-1">{{ importResult.inserted ?? 0 }}</span>
        </div>
        <div class="p-4 rounded-xl bg-teal-500/10 border border-teal-500/20 flex flex-col">
          <span class="text-teal-300 text-xs">Reconciliados</span>
          <span class="text-xl font-bold text-teal-300 mt-1">{{ importResult.reconciled ?? 0 }}</span>
        </div>
        <div class="p-4 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col">
          <span class="text-white/40 text-xs">Duplicados Ignorados</span>
          <span class="text-xl font-bold text-white/60 mt-1">{{ importResult.duplicates ?? 0 }}</span>
        </div>
      </div>

      <!-- Ações pós-import -->
      <div class="flex flex-col sm:flex-row items-center gap-3 pt-2">
        <button
          type="button"
          @click="router.push('/transactions')"
          class="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-accent text-bg font-bold text-sm hover:opacity-90 transition-all cursor-pointer shadow-lg shadow-accent/20"
        >
          <span>Ir para Transações</span>
          <PhArrowRight :size="16" weight="bold" />
        </button>
        <button
          type="button"
          @click="resetForm"
          class="w-full sm:w-auto px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium text-sm transition-all border border-white/10 cursor-pointer"
        >
          Importar Outro Arquivo
        </button>
      </div>
    </div>

    <!-- Formulário de Importação -->
    <div v-else class="flex flex-col gap-6">
      <div class="bg-surface rounded-2xl p-6 sm:p-8 border border-white/5 shadow-md flex flex-col gap-6">
        <!-- Seleção de Conta Bancária -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="text-xs font-semibold text-white/80 flex items-center gap-1.5">
              <PhBank :size="15" class="text-accent" />
              <span>Selecione a Conta ou Cartão de Destino do Extrato:</span>
            </label>
            <button
              type="button"
              @click="router.push('/accounts')"
              class="text-xs text-accent hover:underline flex items-center gap-1 cursor-pointer font-medium"
            >
              <PhPlus :size="13" weight="bold" />
              <span>Gerenciar Contas</span>
            </button>
          </div>

          <p class="text-[11px] text-white/40 mb-3">
            O arquivo OFX será vinculado à conta bancária selecionada abaixo. Escolha se os lançamentos pertencem a uma Conta Corrente ou a um Cartão de Crédito.
          </p>

          <!-- Estado Sem Contas -->
          <div v-if="accounts.length === 0" class="p-6 rounded-2xl bg-white/5 border border-white/10 text-center flex flex-col items-center gap-3">
            <p class="text-xs text-white/60">Você ainda não possui contas bancárias cadastradas.</p>
            <button
              type="button"
              @click="router.push('/accounts')"
              class="px-4 py-2 rounded-xl bg-accent text-bg text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer"
            >
              <PhPlus :size="14" weight="bold" />
              <span>Cadastrar Minha Primeira Conta</span>
            </button>
          </div>

          <!-- Grade de Contas Selecionáveis -->
          <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            <button
              v-for="acc in accounts"
              :key="acc.id"
              type="button"
              @click="selectedAccountId = acc.id"
              class="p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 relative"
              :class="selectedAccountId === acc.id 
                ? 'bg-accent/15 border-accent text-white shadow-sm ring-1 ring-accent/40' 
                : 'bg-bg/60 border-white/5 text-white/70 hover:bg-white/5 hover:border-white/10'"
            >
              <div 
                class="w-10 h-10 rounded-xl flex items-center justify-center text-sm shrink-0"
                :class="acc.type === 'CREDIT_CARD' ? 'bg-amber-500/20 text-amber-300' : 'bg-accent/20 text-accent'"
              >
                <PhCreditCard v-if="acc.type === 'CREDIT_CARD'" :size="20" weight="duotone" />
                <PhBank v-else :size="20" weight="duotone" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-xs font-bold truncate text-white">{{ acc.name }}</p>
                <div class="flex items-center gap-1.5 mt-0.5">
                  <span class="text-[10px] px-1.5 py-0.2 rounded bg-white/5 text-white/60">
                    {{ acc.type === 'CREDIT_CARD' ? 'Cartão de Crédito' : 'Conta Corrente' }}
                  </span>
                  <span 
                    class="text-[10px] flex items-center gap-0.5"
                    :class="acc.is_shared ? 'text-blue-400' : 'text-amber-400/80'"
                  >
                    <PhUsers v-if="acc.is_shared" :size="10" />
                    <PhLock v-else :size="10" />
                    <span>{{ acc.is_shared ? 'Familiar' : 'Privada' }}</span>
                  </span>
                </div>
              </div>
            </button>
          </div>
        </div>

        <!-- Dropzone de Arquivo OFX -->
        <div>
          <label class="text-xs font-semibold text-white/80 mb-2 block">
            Arquivo .OFX
          </label>
          <div
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleFileDrop"
            class="rounded-2xl border-2 border-dashed p-8 text-center transition-all flex flex-col items-center justify-center gap-3 cursor-pointer select-none"
            :class="isDragging 
              ? 'border-accent bg-accent/10' 
              : selectedFile 
                ? 'border-emerald-500/50 bg-emerald-500/5' 
                : 'border-white/10 bg-bg/40 hover:border-white/20'"
            @click="($refs.fileInput as HTMLInputElement)?.click()"
          >
            <input 
              ref="fileInput"
              type="file" 
              accept=".ofx"
              class="hidden" 
              @change="handleFileSelect"
            />

            <div 
              class="w-14 h-14 rounded-2xl flex items-center justify-center text-accent"
              :class="selectedFile ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-white/50'"
            >
              <PhFileCode v-if="selectedFile" :size="32" weight="duotone" />
              <PhUploadSimple v-else :size="32" weight="duotone" />
            </div>

            <div v-if="selectedFile" class="flex flex-col items-center">
              <p class="text-sm font-bold text-white">{{ selectedFile.name }}</p>
              <p class="text-xs text-white/40 mt-0.5">{{ (selectedFile.size / 1024).toFixed(1) }} KB</p>
              <span class="mt-2 text-[11px] text-accent hover:underline">Clique para alterar o arquivo</span>
            </div>

            <div v-else class="flex flex-col items-center">
              <p class="text-sm font-semibold text-white">Arraste e solte seu arquivo OFX aqui</p>
              <p class="text-xs text-white/40 mt-1">ou clique para procurar no seu computador</p>
              <span class="mt-3 px-3 py-1 rounded-full bg-white/5 text-white/50 text-[10px] font-mono">Formatos suportados: .ofx</span>
            </div>
          </div>
        </div>

        <!-- Alerta de Erro -->
        <div v-if="errorMsg" class="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl flex items-center gap-2">
          <PhWarningCircle :size="16" weight="fill" />
          <span>{{ errorMsg }}</span>
        </div>

        <!-- Botão Importar -->
        <button
          type="button"
          :disabled="loading || !selectedFile || !selectedAccountId"
          @click="handleImport"
          class="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-accent text-bg font-bold text-sm hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer shadow-lg shadow-accent/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PhArrowsClockwise v-if="loading" :size="18" class="animate-spin" />
          <PhUploadSimple v-else :size="18" weight="bold" />
          <span v-if="loading">Processando Extrato OFX...</span>
          <span v-else>Processar e Reconciliar OFX</span>
        </button>
      </div>

      <!-- Dicas e Recursos de Inteligência -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="bg-surface/60 rounded-xl p-4 border border-white/5 flex items-start gap-3">
          <div class="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
            <PhArrowsClockwise :size="18" weight="bold" />
          </div>
          <div>
            <h3 class="text-xs font-bold text-white">Reconciliação Automática</h3>
            <p class="text-[11px] text-white/50 mt-0.5">Pagamentos manuais e previstos são associados ao OFX para evitar lançamentos duplicados.</p>
          </div>
        </div>

        <div class="bg-surface/60 rounded-xl p-4 border border-white/5 flex items-start gap-3">
          <div class="w-8 h-8 rounded-lg bg-teal-500/15 text-teal-300 flex items-center justify-center shrink-0">
            <PhLightning :size="18" weight="fill" />
          </div>
          <div>
            <h3 class="text-xs font-bold text-white">Classificação em 2 Camadas</h3>
            <p class="text-[11px] text-white/50 mt-0.5">Regras determinísticas de estabelecimentos são aplicadas primeiro, seguidas por IA Naive Bayes.</p>
          </div>
        </div>

        <div class="bg-surface/60 rounded-xl p-4 border border-white/5 flex items-start gap-3">
          <div class="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-300 flex items-center justify-center shrink-0">
            <PhCreditCard :size="18" weight="duotone" />
          </div>
          <div>
            <h3 class="text-xs font-bold text-white">Contas vs Cartões</h3>
            <p class="text-[11px] text-white/50 mt-0.5">Faturas de cartão de crédito não somam com o pagamento da fatura no débito da conta corrente.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

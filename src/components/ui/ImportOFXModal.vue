<script setup lang="ts">
import { ref, computed, onMounted, markRaw } from 'vue'
import { useRouter } from 'vue-router'
import { useEscapeKey } from '@/composables/useEscapeKey'
import AppSelect, { type AppSelectOption } from './AppSelect.vue'
import { PhBank, PhCreditCard } from '@phosphor-icons/vue'
import { useAccountsStore } from '../../stores/accounts'
import { api } from '../../api/axios'
import { Button } from './button'
import { 
  PhX, 
  PhUploadSimple, 
  PhFileCode, 
  PhCheckCircle, 
  PhCircleNotch
} from '@phosphor-icons/vue'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'imported'): void
}>()

const accountsStore = useAccountsStore()
const router = useRouter()

const selectedAccountId = ref('')
const selectedFile = ref<File | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const importing = ref(false)
const importError = ref('')
const importResult = ref<{ inserted: number; skipped: number; reconciled: number } | null>(null)
const hasAccounts = computed(() => accountsStore.accounts.length > 0)

const accountOptions = computed<AppSelectOption[]>(() => {
  return accountsStore.accounts.map(acc => ({
    value: acc.id,
    label: acc.name,
    sublabel: acc.institution,
    badge: acc.type === 'CREDIT_CARD' ? 'Cartão' : 'Conta',
    icon: markRaw(acc.type === 'CREDIT_CARD' ? PhCreditCard : PhBank)
  }))
})

onMounted(() => {
  if (accountsStore.accounts.length === 0) {
    accountsStore.fetchAccounts()
  }
})

useEscapeKey(() => props.isOpen && !importing.value, () => reset())

const goToAccounts = () => {
  reset()
  router.push('/accounts')
}

const goToTransactions = () => {
  reset()
  router.push('/transactions')
}

const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    selectedFile.value = target.files[0]
    importError.value = ''
  }
}

const handleDrop = (e: DragEvent) => {
  if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
    selectedFile.value = e.dataTransfer.files[0]
    importError.value = ''
  }
}

const submit = async () => {
  if (!selectedAccountId.value) {
    importError.value = 'Selecione a conta em que o extrato será importado.'
    return
  }
  if (!selectedFile.value) {
    importError.value = 'Selecione o arquivo OFX para importar'
    return
  }

  importing.value = true
  importError.value = ''
  importResult.value = null

  const formData = new FormData()
  formData.append('account_id', selectedAccountId.value)
  formData.append('file', selectedFile.value)

  try {
    const { data } = await api.post('/transactions/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    importResult.value = {
      inserted: data.inserted || 0,
      skipped: data.skipped || 0,
      reconciled: data.reconciled || 0,
    }
    emit('imported')
  } catch (err: any) {
    console.error('Falha ao importar OFX:', err)
    importError.value = err.response?.data?.message || err.response?.data?.error || 'Erro ao processar arquivo OFX'
  } finally {
    importing.value = false
  }
}

const reset = () => {
  selectedAccountId.value = ''
  selectedFile.value = null
  importResult.value = null
  importError.value = ''
  emit('close')
}
</script>

<template>
  <div 
    v-if="isOpen"
    class="fixed inset-0 z-[10002] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto"
    @click="!importing && reset()"
  >
    <div
      class="bg-surface border border-white/10 rounded-2xl w-full max-w-md max-h-[90dvh] flex flex-col shadow-2xl overflow-y-auto custom-scrollbar p-5 sm:p-6 relative gap-4 animate-in zoom-in-95 duration-200 text-white my-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-ofx-title"
      @click.stop
    >
      <button
        @click="reset"
        :disabled="importing"
        aria-label="Fechar"
        class="absolute top-3 right-3 text-white/50 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-40"
      >
        <PhX :size="20" />
      </button>

      <div>
        <h3 id="import-ofx-title" class="text-xl font-bold">Importar Extrato OFX</h3>
        <p class="text-xs text-white/50">Suporta contas correntes e cartões de crédito (Nubank, Santander, etc.)</p>
      </div>

      <!-- Sucesso com Relatório de Conciliação -->
      <div v-if="importResult" class="flex flex-col items-center gap-4 py-2 text-center">
        <PhCheckCircle :size="56" class="text-accent animate-in zoom-in-50 duration-200" weight="duotone" />
        <div>
          <h4 class="text-lg font-bold">Importação Concluída</h4>
          <p class="text-xs text-white/50 mt-0.5">O extrato foi processado e sincronizado</p>
        </div>

        <div class="w-full grid grid-cols-3 gap-2 bg-white/5 p-3 rounded-xl border border-white/5">
          <div class="text-center">
            <span class="text-[10px] text-white/50 uppercase font-semibold">Novas</span>
            <div class="text-xl font-bold text-accent mt-0.5">{{ importResult.inserted }}</div>
          </div>
          <div class="text-center border-x border-white/10">
            <span class="text-[10px] text-white/50 uppercase font-semibold">Conciliadas</span>
            <div class="text-xl font-bold text-blue-400 mt-0.5">{{ importResult.reconciled }}</div>
          </div>
          <div class="text-center">
            <span class="text-[10px] text-white/50 uppercase font-semibold">Já existiam</span>
            <div class="text-xl font-bold text-white/50 mt-0.5">{{ importResult.skipped }}</div>
          </div>
        </div>

        <div class="w-full flex gap-2">
          <Button
            type="button"
            variant="outline"
            @click="goToTransactions"
            class="flex-1 text-xs font-bold"
          >
            Ver Transações
          </Button>
          <Button
            type="button"
            @click="reset"
            class="flex-1 bg-accent text-bg font-bold text-xs hover:opacity-90"
          >
            Concluir
          </Button>
        </div>
      </div>

      <!-- Sem contas cadastradas: não dá para importar sem uma conta de destino -->
      <div v-else-if="!hasAccounts" class="flex flex-col items-center gap-3 py-2 text-center">
        <div class="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-white/50 flex items-center justify-center">
          <PhBank :size="24" weight="duotone" />
        </div>
        <p class="text-xs text-white/70">Você ainda não tem uma conta bancária cadastrada. Crie uma para poder importar o extrato.</p>
        <Button type="button" size="sm" class="gap-1.5 font-bold" @click="goToAccounts">
          <PhBank :size="14" weight="bold" />
          <span>Cadastrar Conta</span>
        </Button>
      </div>

      <!-- Formulário -->
      <div v-else class="flex flex-col gap-4">
        <div v-if="importError" class="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          {{ importError }}
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold text-white/70">Importar na conta <span class="text-rose-400" aria-hidden="true">*</span></label>
          <AppSelect
            v-model="selectedAccountId"
            :options="accountOptions"
            placeholder="Selecione a conta..."
            :teleport="true"
          />
        </div>

        <div 
          @dragover.prevent
          @drop.prevent="handleDrop"
          @click="fileInputRef?.click()"
          class="border-2 border-dashed border-white/15 hover:border-accent/50 rounded-2xl p-6 text-center transition-all cursor-pointer bg-white/[0.02] hover:bg-white/[0.05] flex flex-col items-center justify-center gap-2 group"
        >
          <input
            ref="fileInputRef"
            type="file"
            accept=".ofx"
            class="hidden"
            @change="handleFileChange"
          />
          <div class="w-12 h-12 rounded-full bg-white/5 group-hover:bg-accent/10 flex items-center justify-center text-white/60 group-hover:text-accent transition-colors">
            <PhFileCode v-if="selectedFile" :size="28" class="text-accent" />
            <PhUploadSimple v-else :size="24" />
          </div>

          <div v-if="selectedFile">
            <p class="text-xs font-bold text-white">{{ selectedFile.name }}</p>
            <p class="text-[10px] text-white/50 mt-0.5">{{ (selectedFile.size / 1024).toFixed(1) }} KB</p>
          </div>
          <div v-else>
            <p class="text-xs font-semibold text-white/80">
              <span class="md:hidden">Toque para escolher o arquivo .OFX</span>
              <span class="hidden md:inline">Arraste seu arquivo .OFX aqui</span>
            </p>
            <p class="hidden md:block text-[11px] text-white/50 mt-0.5">ou clique para selecionar</p>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            :disabled="importing"
            @click="reset"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            size="sm"
            @click="submit"
            :disabled="importing || !selectedFile"
            class="bg-accent text-bg font-bold hover:opacity-90"
          >
            <PhCircleNotch v-if="importing" :size="16" class="animate-spin mr-1.5" />
            <PhUploadSimple v-else :size="16" weight="bold" class="mr-1.5" />
            <span>{{ importing ? 'Importando...' : 'Importar Extrato' }}</span>
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

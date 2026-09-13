<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import AppSelect, { type AppSelectOption } from './AppSelect.vue'
import { PhBank, PhCreditCard } from '@phosphor-icons/vue'
import { useAccountsStore } from '../../stores/accounts'
import { api } from '../../api/axios'
import { 
  PhX, 
  PhUploadSimple, 
  PhFileCode, 
  PhCheckCircle, 
  PhCircleNotch
} from '@phosphor-icons/vue'

defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'imported'): void
}>()

const accountsStore = useAccountsStore()

const selectedAccountId = ref('')
const selectedFile = ref<File | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const importing = ref(false)
const importError = ref('')
const importResult = ref<{ inserted: number; skipped: number; reconciled: number } | null>(null)

const accountOptions = computed<AppSelectOption[]>(() => {
  return accountsStore.accounts.map(acc => ({
    value: acc.id,
    label: acc.name,
    sublabel: acc.institution,
    badge: acc.type === 'CREDIT_CARD' ? 'Cartão' : 'Conta',
    icon: acc.type === 'CREDIT_CARD' ? PhCreditCard : PhBank
  }))
})

onMounted(() => {
  if (accountsStore.accounts.length === 0) {
    accountsStore.fetchAccounts()
  }
  if (accountsStore.accounts.length > 0) {
    selectedAccountId.value = accountsStore.accounts[0].id
  }
})

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
  if (!selectedAccountId.value && accountsStore.accounts.length > 0) {
    selectedAccountId.value = accountsStore.accounts[0].id
  }

  if (!selectedAccountId.value) {
    importError.value = 'Selecione a conta bancária de origem'
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
    @click="reset"
  >
    <div 
      class="bg-surface border border-white/10 rounded-2xl w-full max-w-md max-h-[90dvh] flex flex-col shadow-2xl overflow-y-auto custom-scrollbar p-5 sm:p-6 relative gap-4 animate-in zoom-in-95 duration-200 text-white my-auto"
      @click.stop
    >
      <button 
        @click="reset" 
        class="absolute top-4 right-4 text-white/50 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
      >
        <PhX :size="20" />
      </button>

      <div>
        <h3 class="text-xl font-bold">Importar Extrato OFX</h3>
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
            <span class="text-[10px] text-white/50 uppercase font-semibold">Ignoradas</span>
            <div class="text-xl font-bold text-white/40 mt-0.5">{{ importResult.skipped }}</div>
          </div>
        </div>

        <button 
          type="button"
          @click="reset"
          class="w-full py-2.5 rounded-xl bg-accent text-bg font-bold text-xs hover:opacity-90 transition-opacity cursor-pointer mt-1"
        >
          Concluir
        </button>
      </div>

      <!-- Formulário -->
      <div v-else class="flex flex-col gap-4">
        <div v-if="importError" class="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          {{ importError }}
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold text-white/70">Conta Bancária de Destino</label>
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
            <p class="text-[10px] text-white/40 mt-0.5">{{ (selectedFile.size / 1024).toFixed(1) }} KB</p>
          </div>
          <div v-else>
            <p class="text-xs font-semibold text-white/80">Arraste seu arquivo .OFX aqui</p>
            <p class="text-[10px] text-white/40 mt-0.5">ou clique para selecionar</p>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
          <button
            type="button"
            @click="reset"
            class="px-4 py-2 text-xs font-semibold text-white/50 hover:text-white transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            @click="submit"
            :disabled="importing || !selectedFile"
            class="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-bg font-bold text-xs hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
          >
            <PhCircleNotch v-if="importing" :size="16" class="animate-spin" />
            <PhUploadSimple v-else :size="16" weight="bold" />
            <span>{{ importing ? 'Importando...' : 'Importar Extrato' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

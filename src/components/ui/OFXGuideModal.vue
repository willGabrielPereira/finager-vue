<script setup lang="ts">
import { ref, watch } from 'vue'
import { 
  PhX, 
  PhShieldCheck, 
  PhFileText, 
  PhUploadSimple, 
  PhBank, 
  PhArrowRight
} from '@phosphor-icons/vue'

const props = defineProps<{
  isOpen: boolean
  initialBank?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'import'): void
}>()

const selectedBank = ref('nubank')

const banks = [
  { id: 'nubank', name: 'Nubank' },
  { id: 'inter', name: 'Banco Inter' },
  { id: 'itau', name: 'Itaú' },
  { id: 'bradesco', name: 'Bradesco' },
  { id: 'santander', name: 'Santander' },
  { id: 'c6', name: 'C6 Bank' },
  { id: 'btg', name: 'BTG Pactual' },
  { id: 'outros', name: 'Outros Bancos' },
]

watch(() => props.initialBank, (newBank) => {
  if (!newBank) return
  const normalized = newBank.toLowerCase()
  const found = banks.find(b => normalized.includes(b.id) || b.name.toLowerCase().includes(normalized))
  if (found) {
    selectedBank.value = found.id
  }
}, { immediate: true })

const handleClose = () => {
  emit('close')
}

const handleGoToImport = () => {
  emit('close')
  emit('import')
}
</script>

<template>
  <div 
    v-if="isOpen"
    class="fixed inset-0 z-[10050] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
    @click="handleClose"
  >
    <div 
      class="w-full max-w-2xl bg-surface border border-white/10 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
      @click.stop
    >
      <!-- Header -->
      <div class="px-5 py-4 sm:px-6 sm:py-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
            <PhFileText :size="22" weight="duotone" />
          </div>
          <div>
            <h3 class="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <span>Guia do Extrato OFX</span>
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-accent/20 text-accent font-semibold">100% Seguro</span>
            </h3>
            <p class="text-xs text-white/50 mt-0.5">Aprenda o que é e como baixar no seu banco em 1 minuto</p>
          </div>
        </div>
        <button 
          @click="handleClose" 
          class="text-white/50 hover:text-white p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
        >
          <PhX :size="20" />
        </button>
      </div>

      <!-- Body com Scroll -->
      <div class="flex-1 overflow-y-auto p-5 sm:p-6 flex flex-col gap-6 text-xs sm:text-sm">
        <!-- Banner de Segurança e Explicação -->
        <div class="bg-accent/10 border border-accent/25 rounded-2xl p-4 flex items-start gap-3.5 text-white/90">
          <PhShieldCheck :size="24" weight="fill" class="text-accent shrink-0 mt-0.5" />
          <div class="flex flex-col gap-1">
            <span class="font-bold text-xs text-white">Por que o formato OFX é tão seguro?</span>
            <p class="text-[11px] sm:text-xs text-white/70 leading-relaxed">
              O arquivo <strong>.OFX</strong> (Open Financial Exchange) é como uma "foto em texto" do seu extrato bancário. Ele contém <strong>apenas data, valor e descrição</strong> das transações.
              <strong>Não contém suas senhas, nem dados do cartão, nem permite fazer pagamentos ou transferências.</strong>
            </p>
          </div>
        </div>

        <!-- Seletor de Bancos -->
        <div class="flex flex-col gap-2">
          <span class="text-xs font-semibold text-white/70 uppercase tracking-wider">Selecione seu banco:</span>
          <div class="flex items-center gap-2 overflow-x-auto pb-2 pt-0.5 custom-h-scrollbar">
            <button
              v-for="b in banks"
              :key="b.id"
              @click="selectedBank = b.id"
              class="px-3 py-2 rounded-xl border text-xs font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
              :class="selectedBank === b.id 
                ? 'bg-accent text-bg border-accent font-bold shadow-md shadow-accent/20' 
                : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10 hover:text-white'"
            >
              <PhBank :size="14" />
              <span>{{ b.name }}</span>
            </button>
          </div>
        </div>

        <!-- Passo a Passo Específico -->
        <div class="bg-bg/80 border border-white/5 rounded-2xl p-5 flex flex-col gap-3.5">
          <!-- NUBANK -->
          <div v-if="selectedBank === 'nubank'" class="flex flex-col gap-3">
            <h4 class="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-purple-400"></span>
              <span>Passo a passo no Nubank</span>
            </h4>
            <ol class="space-y-2.5 text-xs text-white/80">
              <li class="flex items-start gap-2.5">
                <span class="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                <span>Abra o app do Nubank no celular e toque na sua <strong>Conta</strong> (onde aparece seu saldo).</span>
              </li>
              <li class="flex items-start gap-2.5">
                <span class="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
                <span>Role para baixo até a opção <strong>"Pedir extrato"</strong>.</span>
              </li>
              <li class="flex items-start gap-2.5">
                <span class="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 font-bold flex items-center justify-center shrink-0 text-[11px]">3</span>
                <span>Selecione o mês desejado e escolha o formato <strong>OFX</strong>.</span>
              </li>
              <li class="flex items-start gap-2.5">
                <span class="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 font-bold flex items-center justify-center shrink-0 text-[11px]">4</span>
                <span>O Nubank enviará o arquivo <strong>.ofx</strong> diretamente para o seu e-mail cadastrado em instantes. Basta salvá-lo e fazer upload aqui no Finager!</span>
              </li>
            </ol>
            <div class="mt-2 text-[11px] text-white/50 bg-white/[0.03] p-2.5 rounded-xl border border-white/5">
              💡 <em>Dica Cartão de Crédito:</em> Para a fatura do cartão Nubank, você também pode acessar pelo computador em <strong>nubank.com.br</strong> e clicar em "Exportar OFX".
            </div>
          </div>

          <!-- BANCO INTER -->
          <div v-else-if="selectedBank === 'inter'" class="flex flex-col gap-3">
            <h4 class="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-orange-400"></span>
              <span>Passo a passo no Banco Inter</span>
            </h4>
            <ol class="space-y-2.5 text-xs text-white/80">
              <li class="flex items-start gap-2.5">
                <span class="w-5 h-5 rounded-full bg-orange-500/20 text-orange-300 font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                <span>Acesse o app do Banco Inter ou o Internet Banking pelo computador.</span>
              </li>
              <li class="flex items-start gap-2.5">
                <span class="w-5 h-5 rounded-full bg-orange-500/20 text-orange-300 font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
                <span>Vá no menu <strong>Extrato</strong> da Conta Corrente.</span>
              </li>
              <li class="flex items-start gap-2.5">
                <span class="w-5 h-5 rounded-full bg-orange-500/20 text-orange-300 font-bold flex items-center justify-center shrink-0 text-[11px]">3</span>
                <span>Defina o período que deseja importar (ex: mês atual ou últimos 30 dias).</span>
              </li>
              <li class="flex items-start gap-2.5">
                <span class="w-5 h-5 rounded-full bg-orange-500/20 text-orange-300 font-bold flex items-center justify-center shrink-0 text-[11px]">4</span>
                <span>Clique no botão de <strong>Exportar / Baixar</strong> e selecione a opção <strong>OFX</strong>.</span>
              </li>
            </ol>
          </div>

          <!-- ITAÚ -->
          <div v-else-if="selectedBank === 'itau'" class="flex flex-col gap-3">
            <h4 class="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
              <span>Passo a passo no Itaú</span>
            </h4>
            <ol class="space-y-2.5 text-xs text-white/80">
              <li class="flex items-start gap-2.5">
                <span class="w-5 h-5 rounded-full bg-orange-500/20 text-orange-300 font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                <span>Acesse o Internet Banking do Itaú pelo computador ou aplicativo de desktop.</span>
              </li>
              <li class="flex items-start gap-2.5">
                <span class="w-5 h-5 rounded-full bg-orange-500/20 text-orange-300 font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
                <span>No menu principal, clique em <strong>Conta Corrente > Extrato</strong>.</span>
              </li>
              <li class="flex items-start gap-2.5">
                <span class="w-5 h-5 rounded-full bg-orange-500/20 text-orange-300 font-bold flex items-center justify-center shrink-0 text-[11px]">3</span>
                <span>Filtre as datas que você precisa analisar.</span>
              </li>
              <li class="flex items-start gap-2.5">
                <span class="w-5 h-5 rounded-full bg-orange-500/20 text-orange-300 font-bold flex items-center justify-center shrink-0 text-[11px]">4</span>
                <span>No fim da página do extrato, clique em <strong>"Salvar em outros formatos"</strong> e selecione <strong>OFX (Money 2000 em diante)</strong>.</span>
              </li>
            </ol>
          </div>

          <!-- BRADESCO -->
          <div v-else-if="selectedBank === 'bradesco'" class="flex flex-col gap-3">
            <h4 class="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-red-500"></span>
              <span>Passo a passo no Bradesco</span>
            </h4>
            <ol class="space-y-2.5 text-xs text-white/80">
              <li class="flex items-start gap-2.5">
                <span class="w-5 h-5 rounded-full bg-red-500/20 text-red-300 font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                <span>Acesse o Bradesco Internet Banking pelo navegador no computador.</span>
              </li>
              <li class="flex items-start gap-2.5">
                <span class="w-5 h-5 rounded-full bg-red-500/20 text-red-300 font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
                <span>Acesse <strong>Saldos e Extratos > Extrato Mensal</strong>.</span>
              </li>
              <li class="flex items-start gap-2.5">
                <span class="w-5 h-5 rounded-full bg-red-500/20 text-red-300 font-bold flex items-center justify-center shrink-0 text-[11px]">3</span>
                <span>Escolha o mês e clique no botão <strong>"Salvar como arquivo"</strong> no rodapé.</span>
              </li>
              <li class="flex items-start gap-2.5">
                <span class="w-5 h-5 rounded-full bg-red-500/20 text-red-300 font-bold flex items-center justify-center shrink-0 text-[11px]">4</span>
                <span>Escolha <strong>OFX (Money 2000)</strong> para fazer o download.</span>
              </li>
            </ol>
          </div>

          <!-- SANTANDER -->
          <div v-else-if="selectedBank === 'santander'" class="flex flex-col gap-3">
            <h4 class="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-red-600"></span>
              <span>Passo a passo no Santander</span>
            </h4>
            <ol class="space-y-2.5 text-xs text-white/80">
              <li class="flex items-start gap-2.5">
                <span class="w-5 h-5 rounded-full bg-red-500/20 text-red-300 font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                <span>Acesse o Internet Banking do Santander no computador.</span>
              </li>
              <li class="flex items-start gap-2.5">
                <span class="w-5 h-5 rounded-full bg-red-500/20 text-red-300 font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
                <span>Vá no menu <strong>Conta Corrente > Extrato</strong>.</span>
              </li>
              <li class="flex items-start gap-2.5">
                <span class="w-5 h-5 rounded-full bg-red-500/20 text-red-300 font-bold flex items-center justify-center shrink-0 text-[11px]">3</span>
                <span>Defina o período e clique em <strong>Exportar</strong>.</span>
              </li>
              <li class="flex items-start gap-2.5">
                <span class="w-5 h-5 rounded-full bg-red-500/20 text-red-300 font-bold flex items-center justify-center shrink-0 text-[11px]">4</span>
                <span>Selecione <strong>OFX / Money 2000</strong> para baixar o arquivo.</span>
              </li>
            </ol>
          </div>

          <!-- C6 BANK -->
          <div v-else-if="selectedBank === 'c6'" class="flex flex-col gap-3">
            <h4 class="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
              <span>Passo a passo no C6 Bank</span>
            </h4>
            <ol class="space-y-2.5 text-xs text-white/80">
              <li class="flex items-start gap-2.5">
                <span class="w-5 h-5 rounded-full bg-yellow-500/20 text-yellow-300 font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                <span>Abra o app do C6 Bank no seu celular.</span>
              </li>
              <li class="flex items-start gap-2.5">
                <span class="w-5 h-5 rounded-full bg-yellow-500/20 text-yellow-300 font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
                <span>Toque em <strong>"Ver extrato"</strong> na tela principal.</span>
              </li>
              <li class="flex items-start gap-2.5">
                <span class="w-5 h-5 rounded-full bg-yellow-500/20 text-yellow-300 font-bold flex items-center justify-center shrink-0 text-[11px]">3</span>
                <span>Toque no ícone de exportar/compartilhar no topo da tela.</span>
              </li>
              <li class="flex items-start gap-2.5">
                <span class="w-5 h-5 rounded-full bg-yellow-500/20 text-yellow-300 font-bold flex items-center justify-center shrink-0 text-[11px]">4</span>
                <span>Selecione o formato <strong>OFX</strong> e salve no dispositivo ou envie por e-mail.</span>
              </li>
            </ol>
          </div>

          <!-- BTG PACTUAL -->
          <div v-else-if="selectedBank === 'btg'" class="flex flex-col gap-3">
            <h4 class="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              <span>Passo a passo no BTG Pactual</span>
            </h4>
            <ol class="space-y-2.5 text-xs text-white/80">
              <li class="flex items-start gap-2.5">
                <span class="w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                <span>Acesse o app Banking do BTG ou o Internet Banking.</span>
              </li>
              <li class="flex items-start gap-2.5">
                <span class="w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
                <span>Vá até o menu de <strong>Extrato</strong>.</span>
              </li>
              <li class="flex items-start gap-2.5">
                <span class="w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 font-bold flex items-center justify-center shrink-0 text-[11px]">3</span>
                <span>Selecione a opção <strong>Exportar Extrato</strong> e escolha o formato <strong>OFX</strong>.</span>
              </li>
            </ol>
          </div>

          <!-- OUTROS BANCOS -->
          <div v-else class="flex flex-col gap-3">
            <h4 class="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-accent"></span>
              <span>Passo a passo geral (Caixa, Banco do Brasil, Sicredi, Sicoob, etc.)</span>
            </h4>
            <p class="text-xs text-white/70">
              Praticamente todas as instituições financeiras brasileiras autorizadas pelo Banco Central oferecem exportação OFX gratuita:
            </p>
            <ol class="space-y-2 text-xs text-white/80">
              <li>1. Acesse o <strong>Internet Banking</strong> do seu banco pelo computador (a opção costuma estar mais visível na web do que no app mobile).</li>
              <li>2. Vá na aba de <strong>Extrato da Conta Corrente ou Fatura do Cartão</strong>.</li>
              <li>3. Selecione o período desejado (ex: últimos 30 ou 60 dias).</li>
              <li>4. Procure o botão <strong>Exportar / Baixar / Salvar</strong> e selecione o formato <strong>OFX</strong> ou <strong>Money</strong>.</li>
            </ol>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-5 py-4 sm:px-6 sm:py-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-between gap-3">
        <button
          type="button"
          @click="handleClose"
          class="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-xs font-medium transition-colors cursor-pointer"
        >
          Fechar
        </button>

        <button
          type="button"
          @click="handleGoToImport"
          class="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-bg text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer shadow-lg shadow-accent/20"
        >
          <PhUploadSimple :size="16" weight="bold" />
          <span>Importar Extrato Agora</span>
          <PhArrowRight :size="14" weight="bold" />
        </button>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { PhMegaphone, PhPlus, PhTrash, PhEye, PhFloppyDisk, PhPaperPlaneTilt } from '@phosphor-icons/vue'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import AppSelect from '@/components/ui/AppSelect.vue'
import MarkdownEditor from '@/components/MarkdownEditor.vue'
import ChangelogModal from '@/components/ChangelogModal.vue'
import { useAdminStore, extractErrorMessage } from '../stores/admin'
import type { ChangelogEntry, ChangelogSection, ChangelogTag } from '../stores/changelog'
import { showAlert, toast } from '../utils/feedback'

const admin = useAdminStore()

const editingId = ref<string | null>(null)
const title = ref('')
const intro = ref('')
const sections = ref<ChangelogSection[]>([])
const editorKey = ref(0) // força recriar os editores ao trocar de entrada
const saving = ref(false)
const previewOpen = ref(false)

const tagOptions: { value: ChangelogTag; label: string }[] = [
  { value: 'NOVIDADES', label: 'Novidades' },
  { value: 'MELHORIAS', label: 'Melhorias' },
  { value: 'CORREÇÕES', label: 'Correções' },
]

const current = computed(() => admin.changelog.find(e => e.id === editingId.value) || null)
const isPublished = computed(() => !!current.value?.published_at)

const newSection = (): ChangelogSection => ({ tag: 'NOVIDADES', heading: '', body: '' })

const startNew = () => {
  editingId.value = null
  title.value = ''
  intro.value = ''
  sections.value = [newSection()]
  editorKey.value++
}

const edit = (e: ChangelogEntry) => {
  editingId.value = e.id
  title.value = e.title
  intro.value = e.intro
  sections.value = e.sections.map(s => ({ ...s }))
  editorKey.value++
}

onMounted(async () => {
  await admin.fetchChangelog()
  startNew()
})

const draftEntry = computed<ChangelogEntry>(() => ({
  id: editingId.value || 'preview',
  title: title.value,
  intro: intro.value,
  sections: sections.value,
  published_at: current.value?.published_at || null,
  created_at: current.value?.created_at || new Date().toISOString(),
}))

const save = async (quiet = false): Promise<ChangelogEntry | null> => {
  if (!title.value.trim()) {
    toast.warning('Atenção', 'Informe um título.')
    return null
  }
  saving.value = true
  try {
    const saved = await admin.saveChangelog(editingId.value, { title: title.value.trim(), intro: intro.value, sections: sections.value })
    editingId.value = saved.id
    if (!quiet) toast.success('Salvo', 'Rascunho salvo.')
    return saved
  } catch (err: any) {
    toast.error('Erro', extractErrorMessage(err, 'Não foi possível salvar.'))
    return null
  } finally {
    saving.value = false
  }
}

const publish = async () => {
  const ok = await showAlert.confirm({
    title: 'Publicar novidades?',
    text: 'A publicação dispara um e-mail para todos os usuários que optaram por receber novidades e abre o aviso para todos no próximo acesso. Não dá para desfazer.',
    confirmText: 'Sim, publicar e enviar e-mail',
    cancelText: 'Cancelar',
  })
  if (!ok) return
  const saved = await save(true)
  if (!saved) return
  saving.value = true
  try {
    await admin.publishChangelog(saved.id)
    toast.success('Publicado', 'Novidades publicadas.')
  } catch (err: any) {
    toast.error('Erro', extractErrorMessage(err, 'Não foi possível publicar.'))
  } finally {
    saving.value = false
  }
}

const fmt = (d: string) => new Date(d).toLocaleDateString('pt-BR')
</script>

<template>
  <div class="max-w-5xl mx-auto flex flex-col gap-6">
    <h1 class="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
      <PhMegaphone :size="26" class="text-accent" weight="duotone" />
      <span>Novidades (Changelog)</span>
    </h1>

    <div class="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
      <Card class="p-4 flex flex-col gap-2 h-fit">
        <Button size="sm" class="gap-2" @click="startNew"><PhPlus :size="14" weight="bold" /> Nova entrada</Button>
        <button
          v-for="e in admin.changelog"
          :key="e.id"
          type="button"
          class="text-left p-2.5 rounded-xl hover:bg-white/5 cursor-pointer transition-colors"
          :class="e.id === editingId ? 'bg-accent/10' : ''"
          @click="edit(e)"
        >
          <div class="text-sm font-semibold text-white truncate">{{ e.title }}</div>
          <div class="text-[11px]" :class="e.published_at ? 'text-accent' : 'text-amber-400'">
            {{ e.published_at ? `Publicada em ${fmt(e.published_at)}` : 'Rascunho' }}
          </div>
        </button>
        <p v-if="!admin.changelog.length && !admin.loading" class="text-xs text-white/50 text-center py-2">Nenhuma entrada.</p>
      </Card>

      <Card class="p-5 flex flex-col gap-4">
        <p v-if="isPublished" class="text-xs text-amber-400">Esta entrada já foi publicada; editar não reenvia o e-mail.</p>
        <div>
          <label class="text-xs font-semibold text-white/80 mb-1.5 block">Título</label>
          <Input v-model="title" placeholder="Ex.: Importação de CSV" />
        </div>
        <div>
          <label class="text-xs font-semibold text-white/80 mb-1.5 block">Introdução</label>
          <MarkdownEditor :key="`i${editorKey}`" v-model="intro" />
        </div>

        <div v-for="(s, i) in sections" :key="`${editorKey}-${i}`" class="rounded-xl border border-white/10 p-3 flex flex-col gap-3">
          <div class="flex items-center gap-2">
            <AppSelect v-model="s.tag" :options="tagOptions" class="w-44 shrink-0" />
            <Input v-model="s.heading" placeholder="Título com emoji, ex.: 📥 Importação de CSV" />
            <Button variant="destructive" size="icon" aria-label="Remover seção" @click="sections.splice(i, 1)"><PhTrash :size="16" /></Button>
          </div>
          <MarkdownEditor v-model="s.body" />
        </div>
        <Button variant="outline" size="sm" class="gap-2 self-start" @click="sections.push(newSection())"><PhPlus :size="14" /> Adicionar seção</Button>

        <div class="flex flex-wrap gap-2 justify-end pt-2 border-t border-white/5">
          <Button variant="outline" class="gap-2" @click="previewOpen = true"><PhEye :size="16" /> Pré-visualizar</Button>
          <Button variant="secondary" class="gap-2" :disabled="saving" @click="save()"><PhFloppyDisk :size="16" /> Salvar rascunho</Button>
          <Button v-if="!isPublished" class="gap-2" :disabled="saving" @click="publish"><PhPaperPlaneTilt :size="16" /> Publicar</Button>
        </div>
      </Card>
    </div>

    <ChangelogModal :open="previewOpen" :entries="[draftEntry]" @close="previewOpen = false" />
  </div>
</template>

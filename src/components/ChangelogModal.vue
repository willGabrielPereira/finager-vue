<script setup lang="ts">
import { computed } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { PhX } from '@phosphor-icons/vue'
import type { ChangelogEntry, ChangelogTag } from '../stores/changelog'

const props = defineProps<{ open: boolean; entries: ChangelogEntry[] }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const md = (src: string) => DOMPurify.sanitize(marked.parse(src || '', { async: false }) as string)

const fmtDate = (e: ChangelogEntry) =>
  new Date(e.published_at || e.created_at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })

const tagColor: Record<ChangelogTag, string> = {
  NOVIDADES: 'text-accent',
  MELHORIAS: 'text-sky-400',
  CORREÇÕES: 'text-amber-400',
}
const tagRule: Record<ChangelogTag, string> = {
  NOVIDADES: 'bg-accent/30',
  MELHORIAS: 'bg-sky-400/30',
  CORREÇÕES: 'bg-amber-400/30',
}

const subtitle = computed(() => (props.entries[0] ? fmtDate(props.entries[0]) : ''))
</script>

<template>
  <Dialog :open="open" @update:open="(v: boolean) => !v && emit('close')">
    <DialogContent hide-close-button class="max-w-xl p-0 gap-0 flex flex-col overflow-hidden">
      <header class="flex items-start justify-between gap-3 px-6 pt-5 pb-4 border-b border-white/10 shrink-0">
        <div>
          <DialogTitle class="text-lg font-bold text-white">Novidades</DialogTitle>
          <DialogDescription class="text-xs text-white/50 mt-0.5">{{ subtitle }}</DialogDescription>
        </div>
        <DialogClose class="rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white cursor-pointer">
          <PhX :size="18" />
          <span class="sr-only">Fechar</span>
        </DialogClose>
      </header>

      <div class="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-6 py-5 flex flex-col gap-8">
        <p v-if="!entries.length" class="text-sm text-white/50 text-center py-8">Nenhuma novidade por enquanto.</p>
        <article v-for="e in entries" :key="e.id" class="flex flex-col gap-5">
          <h2 v-if="entries.length > 1" class="text-base font-bold text-white">
            {{ e.title }} <span class="text-xs font-normal text-white/40">· {{ fmtDate(e) }}</span>
          </h2>
          <div class="cl-md font-semibold text-white" v-html="md(e.intro)"></div>
          <section v-for="(s, i) in e.sections" :key="i" class="flex flex-col gap-2">
            <div class="flex items-center gap-3">
              <span class="text-[11px] font-bold tracking-wider" :class="tagColor[s.tag]">{{ s.tag }}</span>
              <span class="h-px flex-1" :class="tagRule[s.tag]"></span>
            </div>
            <h3 class="text-base font-bold text-white">{{ s.heading }}</h3>
            <div class="cl-md text-sm text-white/70" v-html="md(s.body)"></div>
          </section>
        </article>
      </div>

      <footer class="flex items-center justify-end px-6 py-3 border-t border-white/10 bg-surface-2/50 shrink-0">
        <Button size="sm" @click="emit('close')">Entendi</Button>
      </footer>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
.cl-md :deep(p) { margin: 0 0 0.5rem; }
.cl-md :deep(ul) { list-style: disc; padding-left: 1.25rem; margin: 0 0 0.5rem; }
.cl-md :deep(ol) { list-style: decimal; padding-left: 1.25rem; margin: 0 0 0.5rem; }
.cl-md :deep(a) { color: #22c55e; text-decoration: underline; }
.cl-md :deep(strong) { color: #fff; }
</style>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from 'tiptap-markdown'
import { PhTextB, PhTextItalic, PhListBullets, PhLink, PhCheck } from '@phosphor-icons/vue'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit.configure({ heading: false, blockquote: false, codeBlock: false, code: false, strike: false, horizontalRule: false, link: { openOnClick: false } }),
    Markdown,
  ],
  editorProps: { attributes: { class: 'min-h-[100px] px-3 py-2 text-sm text-white outline-none cl-editor' } },
  onUpdate: ({ editor }) => emit('update:modelValue', (editor.storage as any).markdown.getMarkdown()),
})

// Troca externa de valor sem disparar loop.
watch(() => props.modelValue, (v) => {
  if (editor.value && v !== (editor.value.storage as any).markdown.getMarkdown()) editor.value.commands.setContent(v)
})
onBeforeUnmount(() => editor.value?.destroy())

const linkOpen = ref(false)
const linkUrl = ref('')
const openLink = () => {
  linkUrl.value = editor.value?.getAttributes('link').href || ''
  linkOpen.value = !linkOpen.value
}
const applyLink = () => {
  const chain = editor.value?.chain().focus()
  if (!chain) return
  if (linkUrl.value.trim()) chain.extendMarkRange('link').setLink({ href: linkUrl.value.trim() }).run()
  else chain.extendMarkRange('link').unsetLink().run()
  linkOpen.value = false
}

const btn = (active: boolean) => [
  'p-1.5 rounded-md cursor-pointer transition-colors',
  active ? 'bg-accent/20 text-accent' : 'text-white/60 hover:bg-white/10 hover:text-white',
]
</script>

<template>
  <div class="rounded-xl border border-white/10 bg-bg focus-within:border-accent">
    <div v-if="editor" class="flex items-center gap-1 px-2 py-1.5 border-b border-white/10">
      <button type="button" aria-label="Negrito" :class="btn(editor.isActive('bold'))" @click="editor.chain().focus().toggleBold().run()"><PhTextB :size="16" weight="bold" /></button>
      <button type="button" aria-label="Itálico" :class="btn(editor.isActive('italic'))" @click="editor.chain().focus().toggleItalic().run()"><PhTextItalic :size="16" /></button>
      <button type="button" aria-label="Lista" :class="btn(editor.isActive('bulletList'))" @click="editor.chain().focus().toggleBulletList().run()"><PhListBullets :size="16" /></button>
      <button type="button" aria-label="Link" :class="btn(editor.isActive('link'))" @click="openLink"><PhLink :size="16" /></button>
      <form v-if="linkOpen" class="flex items-center gap-1 ml-2 flex-1" @submit.prevent="applyLink">
        <input v-model="linkUrl" placeholder="https://..." class="flex-1 min-w-0 h-7 rounded-md bg-surface border border-white/10 px-2 text-xs text-white outline-none focus:border-accent" />
        <button type="submit" aria-label="Aplicar link" :class="btn(false)"><PhCheck :size="16" /></button>
      </form>
    </div>
    <EditorContent :editor="editor" />
  </div>
</template>

<style scoped>
.cl-editor :deep(p) { margin: 0 0 0.5rem; }
.cl-editor :deep(ul) { list-style: disc; padding-left: 1.25rem; margin: 0 0 0.5rem; }
.cl-editor :deep(a) { color: #22c55e; text-decoration: underline; }
</style>

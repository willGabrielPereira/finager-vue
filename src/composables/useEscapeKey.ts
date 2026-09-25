import { onBeforeUnmount, onMounted } from 'vue'

// Fecha modais feitos à mão com a tecla Esc enquanto `isActive()` for verdadeiro.
// Ignora o Esc quando há uma camada por cima (popover do radix ou diálogo SweetAlert),
// para que ele feche só essa camada e não o modal inteiro.
export function useEscapeKey(isActive: () => boolean, onEscape: () => void) {
  const handler = (e: KeyboardEvent) => {
    if (e.key !== 'Escape' || !isActive()) return
    const body = document.body.classList
    if (body.contains('swal2-shown') && !body.contains('swal2-toast-shown')) return
    if (document.querySelector('[data-radix-popper-content-wrapper]')) return
    onEscape()
  }
  onMounted(() => window.addEventListener('keydown', handler))
  onBeforeUnmount(() => window.removeEventListener('keydown', handler))
}

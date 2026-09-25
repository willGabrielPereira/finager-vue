/**
 * ============================================================================
 * PADRÃO OFICIAL DE FEEDBACK E DIÁLOGOS (FINAGER)
 * ============================================================================
 * REGRA OBRIGATÓRIA: NUNCA utilize alert(), confirm() ou prompt() nativos.
 * Utilize exclusivamente os métodos exportados por este utilitário:
 *
 * - toast.success(title, text?)   -> Notificação rápida de sucesso (4s)
 * - toast.error(title, text?)     -> Notificação de erro
 * - toast.warning(title, text?)   -> Aviso de validação/regra
 * - toast.info(title, text?)      -> Mensagem informativa
 * - showAlert.confirm(options)    -> Diálogo modal de confirmação (destrutivo ou normal)
 * - showAlert.error(title, text?) -> Modal formal de erro
 * - showAlert.success(title, text?) -> Modal formal de sucesso
 * ============================================================================
 */

import Swal from 'sweetalert2';

// SweetAlert2 renderiza `title` como HTML, não como texto (usa innerHTML internamente).
// `text` já é seguro (vira textContent). Se algum chamador algum dia interpolar nome de
// conta/categoria/usuário no título, isso vira XSS armazenado — como já aconteceu aqui
// (nome de conta/categoria digitado pelo usuário indo direto pro `title` do confirm de
// exclusão). Escapamos nesta única porta de entrada para que nenhum chamador precise
// lembrar disso.
const escapeHtml = (str: string): string =>
  str.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as Record<string, string>)[c]);

// Instância base de Toast configurada para Dark OLED Finager
const ToastInstance = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 4000,
  timerProgressBar: true,
  background: '#0f172a',
  color: '#ffffff',
  customClass: {
    popup: 'finager-swal-toast',
    timerProgressBar: 'swal2-timer-progress-bar',
  },
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  }
});

export const toast = {
  success(title: string, text?: string) {
    return ToastInstance.fire({
      icon: 'success',
      title: escapeHtml(title),
      text,
    });
  },
  error(title: string, text?: string) {
    return ToastInstance.fire({
      icon: 'error',
      title: escapeHtml(title),
      text,
    });
  },
  info(title: string, text?: string) {
    return ToastInstance.fire({
      icon: 'info',
      title: escapeHtml(title),
      text,
    });
  },
  warning(title: string, text?: string) {
    return ToastInstance.fire({
      icon: 'warning',
      title: escapeHtml(title),
      text,
    });
  },
};

export const showAlert = {
  success(title: string, text?: string) {
    return Swal.fire({
      icon: 'success',
      title: escapeHtml(title),
      text,
      background: '#0f172a',
      color: '#ffffff',
      confirmButtonText: 'OK, entendi',
      customClass: {
        popup: 'finager-swal-popup',
        confirmButton: 'finager-swal-confirm-btn',
      },
      buttonsStyling: false,
    });
  },
  error(title: string, text?: string) {
    return Swal.fire({
      icon: 'error',
      title: escapeHtml(title),
      text,
      background: '#0f172a',
      color: '#ffffff',
      confirmButtonText: 'Fechar',
      customClass: {
        popup: 'finager-swal-popup',
        confirmButton: 'finager-swal-danger-btn',
      },
      buttonsStyling: false,
    });
  },
  async confirm(options: {
    title: string;
    text?: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
  }): Promise<boolean> {
    const res = await Swal.fire({
      icon: options.isDestructive ? 'warning' : 'question',
      title: escapeHtml(options.title),
      text: options.text,
      showCancelButton: true,
      confirmButtonText: options.confirmText || (options.isDestructive ? 'Sim, excluir' : 'Confirmar'),
      cancelButtonText: options.cancelText || 'Cancelar',
      background: '#0f172a',
      color: '#ffffff',
      customClass: {
        popup: 'finager-swal-popup',
        confirmButton: options.isDestructive ? 'finager-swal-danger-btn' : 'finager-swal-confirm-btn',
        cancelButton: 'finager-swal-cancel-btn',
      },
      buttonsStyling: false,
    });
    return res.isConfirmed;
  }
};

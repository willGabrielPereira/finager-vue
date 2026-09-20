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
      title,
      text,
    });
  },
  error(title: string, text?: string) {
    return ToastInstance.fire({
      icon: 'error',
      title,
      text,
    });
  },
  info(title: string, text?: string) {
    return ToastInstance.fire({
      icon: 'info',
      title,
      text,
    });
  },
  warning(title: string, text?: string) {
    return ToastInstance.fire({
      icon: 'warning',
      title,
      text,
    });
  },
};

export const showAlert = {
  success(title: string, text?: string) {
    return Swal.fire({
      icon: 'success',
      title,
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
      title,
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
      title: options.title,
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

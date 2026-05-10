import { create } from 'zustand';

type AlertType = 'success' | 'error' | 'info' | 'warning';

interface AlertState {
  visible: boolean;
  title: string;
  message: string;
  type: AlertType;
  onConfirm?: () => void;
  confirmText?: string;
  
  showAlert: (title: string, message: string, type?: AlertType, onConfirm?: () => void, confirmText?: string) => void;
  hideAlert: () => void;
}

export const useAlertStore = create<AlertState>((set) => ({
  visible: false,
  title: '',
  message: '',
  type: 'info',
  onConfirm: undefined,
  confirmText: 'ACEPTAR',

  showAlert: (title, message, type = 'info', onConfirm, confirmText = 'ACEPTAR') => set({
    visible: true,
    title,
    message,
    type,
    onConfirm,
    confirmText
  }),

  hideAlert: () => set({ visible: false, onConfirm: undefined })
}));

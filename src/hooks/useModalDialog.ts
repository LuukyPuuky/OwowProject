import { useState, useCallback } from "react";

interface ModalConfig {
  isOpen: boolean;
  title: string;
  message: string;
  type: "alert" | "confirm";
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  showDontShowAgain?: boolean;
  dialogId?: string;
}

/**
 * Custom hook for managing modal dialogs
 * Handles alert and confirm dialogs with "don't show again" functionality
 */
export function useModalDialog() {
  const [modalConfig, setModalConfig] = useState<ModalConfig>({
    isOpen: false,
    title: "",
    message: "",
    type: "alert",
  });

  const [skipDialogs, setSkipDialogs] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('skipDialogs');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    }
    return new Set();
  });

  const showAlert = useCallback((title: string, message: string) => {
    setModalConfig({
      isOpen: true,
      title,
      message,
      type: "alert",
    });
  }, []);

  const showConfirm = useCallback((
    title: string,
    message: string,
    onConfirm: () => void,
    dialogId?: string
  ) => {
    // Check if this dialog should be skipped
    if (dialogId && skipDialogs.has(dialogId)) {
      onConfirm();
      return;
    }

    setModalConfig({
      isOpen: true,
      title,
      message,
      type: "confirm",
      onConfirm,
      showDontShowAgain: !!dialogId,
      dialogId,
    });
  }, [skipDialogs]);

  const closeModal = useCallback(() => {
    setModalConfig((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const handleDontShowAgain = useCallback((checked: boolean) => {
    if (checked && modalConfig.dialogId) {
      const newSkipDialogs = new Set(skipDialogs);
      newSkipDialogs.add(modalConfig.dialogId);
      setSkipDialogs(newSkipDialogs);
      localStorage.setItem('skipDialogs', JSON.stringify([...newSkipDialogs]));
    }
  }, [modalConfig.dialogId, skipDialogs]);

  return {
    modalConfig,
    showAlert,
    showConfirm,
    closeModal,
    handleDontShowAgain,
  };
}

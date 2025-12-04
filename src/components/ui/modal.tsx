"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

// ============================================
// WRAPPER PATTERN (for Luuk's top-bar usage)
// ============================================
interface ModalWrapperProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function ModalWrapper({ open, onClose, children }: ModalWrapperProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm transition-opacity" />
      
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-3xl mx-4 transform rounded-lg bg-card border border-border p-6 text-muted-foreground shadow-lg"
        style={{ animation: "modal-in .18s ease-out forwards" }}
      >
        {children}
      </div>

      <style>{`
        @keyframes modal-in {
          from { opacity: 0; transform: translateY(8px) scale(.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

// Default export for compatibility
export default ModalWrapper;

// ============================================
// DIALOG PATTERN (for create page dialogs)
// ============================================
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  type?: "alert" | "confirm";
  confirmText?: string;
  cancelText?: string;
  showDontShowAgain?: boolean;
  onDontShowAgain?: (checked: boolean) => void;
}

export function Modal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = "alert",
  confirmText = "OK",
  cancelText = "Cancel",
  showDontShowAgain = false,
  onDontShowAgain,
}: ModalProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[#0a0a0a] border-2 border-neutral-800 rounded-lg shadow-2xl w-full max-w-md mx-4"
        style={{
          animation: 'modalFadeIn 0.2s ease-out'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          <h2 className="text-lg font-semibold text-neutral-200">{title}</h2>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-neutral-400 text-sm leading-relaxed whitespace-pre-line">
            {message}
          </p>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800">
          {showDontShowAgain && (
            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                id="dontShowAgain"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="w-4 h-4 rounded bg-neutral-900 border-2 border-neutral-700 cursor-pointer accent-white"
              />
              <label
                htmlFor="dontShowAgain"
                className="text-sm text-neutral-400 cursor-pointer select-none"
              >
                Don&apos;t show this again
              </label>
            </div>
          )}
          <div className="flex items-center justify-end gap-3">
            {type === "confirm" && (
              <button
                onClick={onClose}
                className="bg-neutral-900 text-neutral-300 border-2 border-neutral-800 px-4 py-2 rounded-md hover:bg-neutral-800 hover:text-neutral-200 transition-colors"
              >
                {cancelText}
              </button>
            )}
            <button
              onClick={() => {
                if (onDontShowAgain && dontShowAgain) {
                  onDontShowAgain(true);
                }
                if (onConfirm) onConfirm();
                onClose();
              }}
              className="bg-white text-black border-2 border-white px-4 py-2 rounded-md hover:bg-neutral-200 transition-colors font-medium"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes modalFadeIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

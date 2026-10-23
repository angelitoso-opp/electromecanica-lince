'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}

interface ToastContextValue {
  toast: {
    success: (title: string, description?: string) => void;
    error: (title: string, description?: string) => void;
    info: (title: string, description?: string) => void;
  };
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type: ToastType, title: string, description?: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    setToasts((prev) => [...prev.slice(-3), { id, type, title, description }]);

    setTimeout(() => {
      dismissToast(id);
    }, 3800);
  }, [dismissToast]);

  const toast = {
    success: (title: string, description?: string) => addToast('success', title, description),
    error: (title: string, description?: string) => addToast('error', title, description),
    info: (title: string, description?: string) => addToast('info', title, description),
  };

  return (
    <ToastContext.Provider value={{ toast, dismissToast }}>
      {children}
      {/* Toast Region */}
      <div className="toast-region" aria-live="polite" role="region" aria-label="Notificaciones">
        {toasts.map((item) => (
          <div key={item.id} className="toast-item" role="status">
            <div className="flex items-start gap-2.5 min-w-0">
              {item.type === 'success' && (
                <CheckCircle2 className="w-4 h-4 text-[var(--positive)] shrink-0 mt-0.5" />
              )}
              {item.type === 'error' && (
                <AlertCircle className="w-4 h-4 text-[var(--negative)] shrink-0 mt-0.5" />
              )}
              {item.type === 'info' && (
                <Info className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-[var(--text)] leading-tight">{item.title}</p>
                {item.description && (
                  <p className="text-[12px] text-[var(--muted)] mt-0.5 leading-snug">{item.description}</p>
                )}
              </div>
            </div>
            <button
              onClick={() => dismissToast(item.id)}
              className="p-1 rounded text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--raised)] shrink-0"
              aria-label="Cerrar notificación"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast debe ser usado dentro de un ToastProvider');
  }
  return context.toast;
}

interface ConfirmButtonProps {
  label: string;
  confirmLabel?: string;
  onConfirm: () => void | Promise<void>;
  className?: string;
  confirmClassName?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export function ConfirmButton({
  label,
  confirmLabel = '¿Confirmar?',
  onConfirm,
  className = 'btn',
  confirmClassName = 'btn danger',
  icon,
  disabled = false,
}: ConfirmButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirming) {
      setConfirming(true);
      return;
    }

    try {
      setLoading(true);
      await onConfirm();
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  };

  React.useEffect(() => {
    if (!confirming) return;
    const timer = setTimeout(() => {
      setConfirming(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, [confirming]);

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || loading}
      className={confirming ? confirmClassName : className}
      title={confirming ? 'Haga clic para confirmar la acción' : label}
    >
      {icon && !confirming && <span className="shrink-0">{icon}</span>}
      <span>{loading ? 'Procesando...' : confirming ? confirmLabel : label}</span>
    </button>
  );
}

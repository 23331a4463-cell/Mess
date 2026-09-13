import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: () => void }> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const config = {
    success: {
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
      border: 'border-emerald-500/40',
      bg: 'bg-slate-900/95 shadow-emerald-500/10',
    },
    error: {
      icon: <XCircle className="w-5 h-5 text-rose-400 shrink-0" />,
      border: 'border-rose-500/40',
      bg: 'bg-slate-900/95 shadow-rose-500/10',
    },
    warning: {
      icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
      border: 'border-amber-500/40',
      bg: 'bg-slate-900/95 shadow-amber-500/10',
    },
    info: {
      icon: <Info className="w-5 h-5 text-sky-400 shrink-0" />,
      border: 'border-sky-500/40',
      bg: 'bg-slate-900/95 shadow-sky-500/10',
    },
  }[toast.type];

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border ${config.border} ${config.bg} shadow-xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-right-4`}
    >
      {config.icon}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-white">{toast.title}</h4>
        {toast.message && <p className="text-xs text-slate-400 mt-0.5 break-words">{toast.message}</p>}
      </div>
      <button
        onClick={onDismiss}
        className="text-slate-400 hover:text-slate-200 transition-colors p-1"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

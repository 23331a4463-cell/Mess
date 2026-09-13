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
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none font-sans">
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
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
      border: 'border-emerald-200',
      bg: 'bg-white',
    },
    error: {
      icon: <XCircle className="w-5 h-5 text-rose-600 shrink-0" />,
      border: 'border-rose-200',
      bg: 'bg-white',
    },
    warning: {
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
      border: 'border-amber-200',
      bg: 'bg-white',
    },
    info: {
      icon: <Info className="w-5 h-5 text-blue-600 shrink-0" />,
      border: 'border-blue-200',
      bg: 'bg-white',
    },
  }[toast.type];

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border ${config.border} ${config.bg} transition-all duration-300 animate-in fade-in slide-in-from-right-4 font-sans`}
    >
      {config.icon}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-slate-900 font-display">{toast.title}</h4>
        {toast.message && <p className="text-xs text-slate-500 mt-0.5 break-words font-sans font-normal">{toast.message}</p>}
      </div>
      <button
        onClick={onDismiss}
        className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-[30px] hover:bg-slate-100 cursor-pointer"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

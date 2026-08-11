import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-16 right-4 md:bottom-6 md:right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-xl shadow-lg border text-sm font-medium transition-all duration-200 animate-in slide-in-from-bottom-2 ${
            toast.type === 'success'
              ? 'bg-emerald-900/90 text-emerald-100 border-emerald-700/50 backdrop-blur-md'
              : toast.type === 'error'
              ? 'bg-rose-900/90 text-rose-100 border-rose-700/50 backdrop-blur-md'
              : 'bg-slate-900/90 text-slate-100 border-slate-700/50 backdrop-blur-md'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-blue-400 shrink-0" />}
            <span>{toast.message}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

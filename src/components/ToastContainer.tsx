import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useApp();

  if (!toasts || toasts.length === 0) return null;

  // Show only the latest toast to prevent screen cluttering and overlapping
  const activeToast = toasts[toasts.length - 1];

  return (
    <div
      id="toast-notification-root"
      className="fixed bottom-20 md:bottom-6 right-4 md:right-6 left-4 md:left-auto md:max-w-md z-[9999] pointer-events-none transition-all duration-300"
    >
      <div
        key={activeToast.id}
        id={`toast-${activeToast.id}`}
        className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-2xl shadow-2xl border text-xs sm:text-sm font-semibold transition-all duration-300 animate-in fade-in-50 slide-in-from-bottom-4 zoom-in-95 ${
          activeToast.type === 'success'
            ? 'bg-emerald-950/95 text-emerald-100 border-emerald-500/40 shadow-emerald-950/50 backdrop-blur-md'
            : activeToast.type === 'error'
            ? 'bg-rose-950/95 text-rose-100 border-rose-500/40 shadow-rose-950/50 backdrop-blur-md'
            : 'bg-slate-950/95 text-slate-100 border-slate-700/60 shadow-slate-950/50 backdrop-blur-md'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {activeToast.type === 'success' && (
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          )}
          {activeToast.type === 'error' && (
            <div className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30">
              <AlertCircle className="w-4 h-4" />
            </div>
          )}
          {activeToast.type === 'info' && (
            <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30">
              <Info className="w-4 h-4" />
            </div>
          )}
          <span className="truncate leading-snug">{activeToast.message}</span>
        </div>

        <button
          type="button"
          onClick={() => dismissToast(activeToast.id)}
          title="Dismiss notification"
          className="p-1 -mr-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

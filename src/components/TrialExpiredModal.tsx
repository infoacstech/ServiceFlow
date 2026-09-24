import React from 'react';
import {
  AlertTriangle,
  Sparkles,
  Lock,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  Calendar,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface TrialExpiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgradeClick: () => void;
  actionAttempted?: string;
}

export const TrialExpiredModal: React.FC<TrialExpiredModalProps> = ({
  isOpen,
  onClose,
  onUpgradeClick,
  actionAttempted = 'Creating new job tickets and dispatching technicians',
}) => {
  const { currentBusiness } = useApp();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-auto relative text-slate-900 dark:text-slate-100">
        {/* Top Accent Strip */}
        <div className="h-2 bg-gradient-to-r from-rose-500 via-amber-500 to-indigo-600 w-full" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 sm:p-7 space-y-5">
          {/* Badge & Lock Icon */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-800 shadow-xs">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-400 font-extrabold text-[10px] uppercase tracking-wider border border-rose-500/20">
                <AlertTriangle className="w-3 h-3" /> 14-Day Free Trial Expired
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                Subscription Renewal Required
              </h3>
            </div>
          </div>

          {/* Context Notice */}
          <div className="p-4 rounded-2xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/40 text-xs text-rose-950 dark:text-rose-200 space-y-1.5">
            <div className="font-bold flex items-center gap-1.5 text-rose-800 dark:text-rose-300">
              <Lock className="w-3.5 h-3.5 shrink-0" />
              <span>Operation Restricted</span>
            </div>
            <p className="leading-relaxed">
              <strong>{actionAttempted}</strong> is locked because the 14-day free trial for <strong>{currentBusiness?.name || 'your workspace'}</strong> has ended.
            </p>
            <p className="text-[11px] text-rose-800/80 dark:text-rose-300/80">
              Your existing customer data, invoices, and job history are 100% safe and preserved. Activate an official plan to continue creating and dispatching new work.
            </p>
          </div>

          {/* Value Props & Guarantees */}
          <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Instant activation via UPI QR Code or Bank Transfer</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Full GST Input Tax Credit receipt provided</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Unlimited technician dispatch and customer management</span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer text-center"
            >
              Review History Only
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onUpgradeClick();
              }}
              className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 via-indigo-600 to-indigo-700 hover:from-rose-700 hover:to-indigo-800 text-white font-extrabold text-xs shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Renew & Choose Plan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

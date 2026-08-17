import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Plus,
  Briefcase,
  UserPlus,
  Receipt,
  FileText,
  RefreshCw,
  X,
  Phone,
  Sparkles,
} from 'lucide-react';

interface QuickActionFabProps {
  onOpenNewJob: () => void;
  onNavigate: (tab: string) => void;
}

export const QuickActionFab: React.FC<QuickActionFabProps> = ({
  onOpenNewJob,
  onNavigate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { currentUser, triggerManualSync, isOffline, isSimulatedOffline } = useApp();

  // If user is logged out, don't show FAB
  if (!currentUser) return null;

  const isTech = currentUser.role === 'technician';

  return (
    <div className="fixed bottom-20 sm:bottom-8 right-5 z-40 flex flex-col items-end">
      {/* Backdrop when FAB is open */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-30 transition-all"
        />
      )}

      {/* Expanded Speed-Dial Menu Options */}
      {isOpen && (
        <div className="mb-3 space-y-2 flex flex-col items-end z-40 animate-in slide-in-from-bottom-5 duration-200">
          {/* Action 1: New Job Schedule (Admin, Manager, Tech) */}
          <button
            onClick={() => {
              setIsOpen(false);
              onOpenNewJob();
            }}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg hover:shadow-indigo-500/25 transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Briefcase className="w-4 h-4" />
            <span>+ Schedule New Job</span>
          </button>

          {/* Action 2: Add Customer (Non-Tech or Owner) */}
          {!isTech && (
            <button
              onClick={() => {
                setIsOpen(false);
                onNavigate('customers');
              }}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 font-bold text-xs shadow-lg border border-slate-200 dark:border-slate-700 transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>+ Add Customer</span>
            </button>
          )}

          {/* Action 3: New Invoice */}
          {!isTech && (
            <button
              onClick={() => {
                setIsOpen(false);
                onNavigate('invoices');
              }}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 font-bold text-xs shadow-lg border border-slate-200 dark:border-slate-700 transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Receipt className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>+ Create Invoice</span>
            </button>
          )}

          {/* Action 4: New Quotation */}
          {!isTech && (
            <button
              onClick={() => {
                setIsOpen(false);
                onNavigate('quotations');
              }}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 font-bold text-xs shadow-lg border border-slate-200 dark:border-slate-700 transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>+ New Quotation</span>
            </button>
          )}

          {/* Action 5: Instant Realtime Cloud Sync */}
          <button
            onClick={() => {
              setIsOpen(false);
              triggerManualSync('MANUAL_BUTTON');
            }}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs shadow-lg transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-cyan-400 dark:text-cyan-600" />
            <span>Instant Cloud Sync</span>
          </button>
        </div>
      )}

      {/* Main Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Quick Actions"
        className={`w-13 h-13 rounded-2xl flex items-center justify-center text-white shadow-xl transition-all transform hover:scale-110 active:scale-90 z-40 cursor-pointer ${
          isOpen
            ? 'bg-slate-800 dark:bg-slate-700 rotate-90 shadow-slate-900/40'
            : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/40 ring-4 ring-indigo-500/20'
        }`}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
      </button>
    </div>
  );
};

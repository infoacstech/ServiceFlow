import React from 'react';
import { useApp } from '../context/AppContext';
import { ShieldAlert, KeyRound, CheckCircle2, Lock, UserCheck } from 'lucide-react';

interface AccessDeniedViewProps {
  requiredRoleLabel?: string;
  onSwitchAccount: () => void;
}

export const AccessDeniedView: React.FC<AccessDeniedViewProps> = ({
  requiredRoleLabel = 'Admin or Manager',
  onSwitchAccount,
}) => {
  const { currentUser, roles = [], getRolePermissions } = useApp();
  const currentPermissions = getRolePermissions(currentUser?.role);
  const currentRoleObj = (roles || []).find((r) => r.code === currentUser?.role);

  return (
    <div className="max-w-2xl mx-auto my-8 p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-6 text-center animate-in fade-in">
      <div className="w-16 h-16 rounded-3xl bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-sm">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-bold uppercase tracking-wider">
          <Lock className="w-3.5 h-3.5" /> Access Control Policy Enforced
        </span>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
          Access Restricted To {requiredRoleLabel}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
          Your active account role is <strong className="text-indigo-600 dark:text-indigo-400 capitalize">{(currentUser?.role || 'Guest').replace('_', ' ')}</strong> ({currentUser?.name || 'Unknown User'}), which is configured with targeted permissions in the Roles Database.
        </p>
      </div>

      {/* Role Details Card */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-left space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
              Active Role: {currentRoleObj?.name || currentUser?.role || 'Guest'}
            </span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
            {currentUser?.role || 'none'}
          </span>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          {currentRoleObj?.description || 'Role permissions control access to workspace modules.'}
        </p>

        <div className="pt-2 border-t border-slate-200 dark:border-slate-700/80 grid grid-cols-2 gap-2 text-[11px]">
          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
            <CheckCircle2 className={`w-3.5 h-3.5 ${currentPermissions.canManageJobs ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600'}`} />
            <span>Jobs Dispatch</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
            <CheckCircle2 className={`w-3.5 h-3.5 ${currentPermissions.canViewFinancials ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600'}`} />
            <span>Invoices & Financials</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
            <CheckCircle2 className={`w-3.5 h-3.5 ${currentPermissions.canManageStaff ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600'}`} />
            <span>Staff Management</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
            <CheckCircle2 className={`w-3.5 h-3.5 ${currentPermissions.canAccessSettings ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600'}`} />
            <span>Business Settings</span>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="pt-2">
        <button
          onClick={onSwitchAccount}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all"
        >
          <KeyRound className="w-4 h-4" />
          <span>Switch Account / Sign In as {requiredRoleLabel}</span>
        </button>
      </div>
    </div>
  );
};

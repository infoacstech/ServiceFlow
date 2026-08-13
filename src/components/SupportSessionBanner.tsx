import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ShieldAlert, Clock, LogOut, Lock, Unlock, FileText } from 'lucide-react';

export const SupportSessionBanner: React.FC = () => {
  const { activeSupportSession, endSupportSession } = useApp();
  const [timeLeftStr, setTimeLeftStr] = useState<string>('');

  useEffect(() => {
    if (!activeSupportSession || activeSupportSession.status !== 'active') return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expiry = new Date(activeSupportSession.expiryTime).getTime();
      const diffMs = expiry - now;

      if (diffMs <= 0) {
        setTimeLeftStr('00:00 - Expired');
        endSupportSession('Support session time limit expired automatically');
      } else {
        const totalSecs = Math.floor(diffMs / 1000);
        const mins = Math.floor(totalSecs / 60);
        const secs = totalSecs % 60;
        setTimeLeftStr(
          `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
        );
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSupportSession, endSupportSession]);

  if (!activeSupportSession || activeSupportSession.status !== 'active') {
    return null;
  }

  const isReadOnly = activeSupportSession.accessMode === 'read_only';

  return (
    <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white px-4 py-2.5 shadow-lg border-b border-purple-500/30 sticky top-0 z-50 animate-in slide-in-from-top duration-300">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-start">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 font-extrabold border border-amber-500/40 uppercase text-[10px] tracking-wider animate-pulse">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Super Admin Support Mode</span>
          </div>

          <div className="flex items-center gap-2 font-medium">
            <span className="text-slate-300">Inspecting Tenant:</span>
            <span className="font-extrabold text-white bg-white/10 px-2 py-0.5 rounded-md border border-white/20">
              {activeSupportSession.targetBusinessName}
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-purple-950/60 border border-purple-400/30 px-2.5 py-0.5 rounded-md text-purple-200">
            {isReadOnly ? (
              <>
                <Lock className="w-3 h-3 text-amber-400" />
                <span className="font-bold text-amber-300">Read-Only Mode</span>
              </>
            ) : (
              <>
                <Unlock className="w-3 h-3 text-emerald-400" />
                <span className="font-bold text-emerald-300">Full Operational Support</span>
              </>
            )}
          </div>

          <div className="hidden lg:flex items-center gap-1 text-slate-300 truncate max-w-xs" title={activeSupportSession.reason}>
            <FileText className="w-3 h-3 text-purple-400 shrink-0" />
            <span className="italic truncate">"{activeSupportSession.reason}"</span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-lg">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>{timeLeftStr || 'Calculating...'}</span>
          </div>

          <button
            onClick={() => endSupportSession('Super Admin explicitly ended support session')}
            className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold transition-all shadow-sm flex items-center gap-1.5 text-xs cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>End Support Session</span>
          </button>
        </div>
      </div>
    </div>
  );
};

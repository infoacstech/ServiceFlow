import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { WifiOff, RefreshCw, CheckCircle2, ChevronDown, ChevronUp, Database, AlertTriangle } from 'lucide-react';

export const OfflineSyncBanner: React.FC = () => {
  const {
    isOffline,
    isSimulatedOffline,
    pendingSyncQueue,
    syncOfflineQueue,
    toggleSimulateOffline,
  } = useApp();

  const [isExpanded, setIsExpanded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  if (!isOffline && !isSimulatedOffline && pendingSyncQueue.length === 0) {
    return null;
  }

  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      syncOfflineQueue(true);
      setIsSyncing(false);
    }, 600);
  };

  return (
    <div className="bg-amber-500 text-stone-900 border-b border-amber-600/30 px-4 py-2.5 text-xs shadow-md transition-all">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 font-medium">
          <div className="p-1 bg-stone-900/10 rounded-lg shrink-0">
            {isOffline || isSimulatedOffline ? (
              <WifiOff className="w-4 h-4 text-stone-900 animate-pulse" />
            ) : (
              <Database className="w-4 h-4 text-stone-900" />
            )}
          </div>
          <div>
            <span className="font-bold uppercase tracking-wider text-[11px] mr-2 px-1.5 py-0.5 rounded bg-stone-900/10">
              {isOffline || isSimulatedOffline ? 'Technician Offline Mode' : 'Pending Sync'}
            </span>
            <span>
              {isOffline || isSimulatedOffline
                ? 'Assigned jobs & updates are cached locally.'
                : 'Connection restored.'}
            </span>
            {pendingSyncQueue.length > 0 && (
              <span className="ml-1.5 font-bold underline cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                ({pendingSyncQueue.length} update{pendingSyncQueue.length > 1 ? 's' : ''} queued)
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {pendingSyncQueue.length > 0 && (
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 py-1 bg-stone-900 text-white rounded-lg font-bold hover:bg-stone-800 transition-all shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              Sync Now ({pendingSyncQueue.length})
            </button>
          )}

          <button
            onClick={toggleSimulateOffline}
            className="px-2.5 py-1 bg-stone-900/10 hover:bg-stone-900/20 text-stone-900 rounded-lg font-semibold transition-all"
            title="Toggle simulated offline mode for testing"
          >
            {isSimulatedOffline ? 'Go Online' : 'Simulate Offline'}
          </button>

          {pendingSyncQueue.length > 0 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-stone-900/10 rounded-lg text-stone-900"
              title="Toggle pending queue details"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Queue Details Drawer */}
      {isExpanded && pendingSyncQueue.length > 0 && (
        <div className="max-w-7xl mx-auto mt-2.5 pt-2.5 border-t border-amber-600/20 text-stone-900 space-y-1.5">
          <div className="font-bold text-[11px] uppercase tracking-wider text-stone-950 flex items-center justify-between">
            <span>Offline Sync Queue Log</span>
            <span>Local Storage Active</span>
          </div>
          <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
            {pendingSyncQueue.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2 rounded-lg bg-white/40 border border-stone-900/10 text-[11px]"
              >
                <div className="flex items-center gap-2 truncate">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-800 shrink-0" />
                  <span className="font-semibold">{item.jobId}:</span>
                  <span className="truncate">{item.description}</span>
                </div>
                <span className="text-[10px] text-stone-700 shrink-0 font-mono">
                  {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

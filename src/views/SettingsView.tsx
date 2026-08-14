import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Settings,
  Save,
  Building2,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  Check,
  Sun,
  Moon,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Database,
  WifiOff,
  Clock,
  Search,
  Trash2,
  ChevronDown,
  ChevronUp,
  Zap,
  ShieldCheck,
  Activity,
  ArrowUpRight,
  KeyRound,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    currentBusiness,
    updateBusinessProfile,
    theme,
    toggleTheme,
    isOffline,
    isSimulatedOffline,
    pendingSyncQueue,
    manualSyncLogs,
    triggerManualSync,
    clearSyncLogs,
    toggleSimulateOffline,
    currentUser,
    updateUserPassword,
    purgeTenantTransactionalData,
    showToast,
  } = useApp();

  // Reset Workspace Modal / Action State
  const [isResetTenantModalOpen, setIsResetTenantModalOpen] = useState(false);
  const [resetTenantConfirmText, setResetTenantConfirmText] = useState('');
  const [isResettingTenant, setIsResettingTenant] = useState(false);

  // Password Change State
  const [currentPassInput, setCurrentPassInput] = useState('');
  const [newPassInput, setNewPassInput] = useState('');
  const [confirmPassInput, setConfirmPassInput] = useState('');
  const [passChangeSuccess, setPassChangeSuccess] = useState(false);

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassInput.trim()) {
      showToast('Please enter a new password', 'error');
      return;
    }

    if (newPassInput.length < 4) {
      showToast('Password must be at least 4 characters long', 'error');
      return;
    }

    if (newPassInput !== confirmPassInput) {
      showToast('New passwords do not match', 'error');
      return;
    }

    // Verify current password if user already had a password
    if (currentUser?.password && currentPassInput !== currentUser.password) {
      showToast('Current password is incorrect', 'error');
      return;
    }

    if (currentUser?.id) {
      updateUserPassword(currentUser.id, newPassInput.trim());
    }
    setPassChangeSuccess(true);
    setCurrentPassInput('');
    setNewPassInput('');
    setConfirmPassInput('');
    showToast('Your password has been updated successfully!', 'success');
    setTimeout(() => setPassChangeSuccess(false), 3000);
  };

  const [formData, setFormData] = useState({
    name: currentBusiness.name,
    type: currentBusiness.type,
    logo: currentBusiness.logo || '',
    mobile: currentBusiness.mobile,
    whatsapp: currentBusiness.whatsapp || currentBusiness.mobile,
    email: currentBusiness.email,
    address: currentBusiness.address,
    city: currentBusiness.city,
    state: currentBusiness.state,
    pin: currentBusiness.pin,
    gstNumber: currentBusiness.gstNumber || '',
    currency: currentBusiness.currency,
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [logFilter, setLogFilter] = useState<'ALL' | 'SUCCESS' | 'NO_CHANGES' | 'OFFLINE_QUEUED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateBusinessProfile(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleManualSyncClick = () => {
    setIsSyncing(true);
    setTimeout(() => {
      triggerManualSync('MANUAL_BUTTON');
      setIsSyncing(false);
    }, 600);
  };

  const filteredLogs = (manualSyncLogs || []).filter((log) => {
    const matchesFilter = logFilter === 'ALL' || log.status === logFilter;
    const q = (searchQuery || '').trim().toLowerCase();
    const matchesQuery =
      q === '' ||
      (log.details || '').toLowerCase().includes(q) ||
      (log.technicianName || '').toLowerCase().includes(q) ||
      (log.id || '').toLowerCase().includes(q) ||
      Boolean(
        log.itemsSynced?.some(
          (item) =>
            (item.jobId || '').toLowerCase().includes(q) ||
            (item.description || '').toLowerCase().includes(q)
        )
      );

    return matchesFilter && matchesQuery;
  });

  const lastSyncLog = manualSyncLogs[0];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in">
      {/* Header */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-600" /> Business Profile & Settings
          </h1>
          <p className="text-xs text-slate-500">Configure company details, GSTIN, branding logo, & offline sync operation transparency logs</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 text-xs">
        {savedSuccess && (
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-2xl font-bold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" /> Business Settings Updated Successfully!
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 sm:col-span-1">
            <label className="font-semibold block mb-1">Company / Business Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 dark:border-slate-700 font-bold"
            />
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className="font-semibold block mb-1">Industry Type *</label>
            <input
              type="text"
              required
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
            />
          </div>

          <div className="col-span-2 p-4 bg-slate-50/80 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
            <div>
              <label className="font-bold text-slate-800 dark:text-slate-200 block mb-0.5">
                Company Branding Logo *
              </label>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Upload a small company logo image. This logo will be displayed on the Login Page for your employees and technicians when signing in.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Logo Preview */}
              <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center p-1 shadow-xs shrink-0 overflow-hidden relative group">
                {formData.logo ? (
                  <img src={formData.logo} alt="Company Logo" className="w-full h-full object-contain rounded-xl" />
                ) : (
                  <div className="text-center text-slate-400 text-[10px] font-bold">No Logo</div>
                )}
              </div>

              {/* Upload Controls */}
              <div className="flex-1 space-y-2 w-full">
                <div className="flex flex-wrap items-center gap-2">
                  <label className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer shadow-xs transition-colors inline-flex items-center gap-1.5">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 3 * 1024 * 1024) {
                            alert('Image file is too large. Please select an image under 3MB.');
                            return;
                          }
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const result = event.target?.result as string;
                            if (result) {
                              setFormData((prev) => ({ ...prev, logo: result }));
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <span>Upload Logo Image</span>
                  </label>

                  {formData.logo && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, logo: '' })}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 hover:bg-rose-100 font-semibold text-xs transition-colors"
                    >
                      Remove Logo
                    </button>
                  )}
                </div>

                <div>
                  <input
                    type="text"
                    value={formData.logo}
                    onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                    placeholder="Or paste image URL (e.g., https://example.com/logo.png)"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="font-semibold block mb-1">Primary Mobile *</label>
            <input
              type="text"
              required
              value={formData.mobile}
              onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
            />
          </div>

          <div>
            <label className="font-semibold block mb-1">WhatsApp Business No</label>
            <input
              type="text"
              value={formData.whatsapp}
              onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
            />
          </div>

          <div className="col-span-2">
            <label className="font-semibold block mb-1">Address *</label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
            />
          </div>

          <div>
            <label className="font-semibold block mb-1">City</label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
            />
          </div>

          <div>
            <label className="font-semibold block mb-1">GSTIN / Tax ID</label>
            <input
              type="text"
              value={formData.gstNumber}
              onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 dark:border-slate-700 font-mono uppercase"
            />
          </div>

          <div>
            <label className="font-semibold block mb-1">Currency Symbol</label>
            <input
              type="text"
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 dark:border-slate-700 font-bold"
            />
          </div>
        </div>

        <div className="pt-3 border-t dark:border-slate-800 flex justify-end">
          <button type="submit" className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md flex items-center gap-2 cursor-pointer">
            <Save className="w-4 h-4" /> Save Profile Changes
          </button>
        </div>
      </form>

      {/* Technician Manual Sync Log & Transparency UI */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
              </div>
              <h2 className="text-base font-black text-slate-900 dark:text-slate-100">
                Manual Sync Operations Log
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1 border border-emerald-300 dark:border-emerald-700">
                <ShieldCheck className="w-3 h-3 text-emerald-600" /> Live Audit Trail
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Detailed transparency status, timestamps, latency metrics, and itemized results of manual & automatic technician syncs.
            </p>
          </div>

          {/* Top Actions: Sync Now & Simulate Offline */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleManualSyncClick}
              disabled={isSyncing}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl font-bold text-xs transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Synchronizing...' : 'Trigger Manual Sync'}
            </button>

            <button
              type="button"
              onClick={toggleSimulateOffline}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer flex items-center gap-1.5 ${
                isSimulatedOffline
                  ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-750'
              }`}
            >
              <WifiOff className="w-3.5 h-3.5" />
              {isSimulatedOffline ? 'Simulating Offline' : 'Test Offline'}
            </button>
          </div>
        </div>

        {/* Sync Status Quick Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-indigo-500" /> Pending Queue
            </div>
            <div className="text-lg font-black text-slate-900 dark:text-slate-100">
              {pendingSyncQueue.length} <span className="text-xs font-normal text-slate-500">records</span>
            </div>
            <div className="text-[10px] text-slate-500">
              {pendingSyncQueue.length > 0 ? 'Awaiting cloud sync' : 'All local changes synced'}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-emerald-500" /> Last Sync Status
            </div>
            <div className="flex items-center gap-1.5 font-black text-sm">
              {lastSyncLog ? (
                <span
                  className={`px-2 py-0.5 rounded-lg text-xs ${
                    lastSyncLog.status === 'SUCCESS'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : lastSyncLog.status === 'NO_CHANGES'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  }`}
                >
                  {lastSyncLog.status}
                </span>
              ) : (
                <span className="text-slate-400 font-normal">None yet</span>
              )}
            </div>
            <div className="text-[10px] text-slate-500 truncate">
              {lastSyncLog ? new Date(lastSyncLog.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Ready'}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-500" /> Connection Mode
            </div>
            <div className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              {isOffline || isSimulatedOffline ? (
                <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <WifiOff className="w-4 h-4" /> Offline
                </span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Cloud Online
                </span>
              )}
            </div>
            <div className="text-[10px] text-slate-500">
              {isSimulatedOffline ? 'Simulated Offline Mode' : 'Live Network Link'}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-purple-500" /> Sync Log History
            </div>
            <div className="text-lg font-black text-slate-900 dark:text-slate-100">
              {manualSyncLogs.length} <span className="text-xs font-normal text-slate-500">entries</span>
            </div>
            <div className="text-[10px] text-slate-500">Persisted locally</div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search sync logs by Job ID, technician, or result details..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            {(['ALL', 'SUCCESS', 'NO_CHANGES', 'OFFLINE_QUEUED'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setLogFilter(st)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  logFilter === st
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {st === 'ALL' ? 'All Logs' : st === 'OFFLINE_QUEUED' ? 'Queued' : st}
              </button>
            ))}
          </div>

          {manualSyncLogs.length > 0 && (
            <button
              type="button"
              onClick={clearSyncLogs}
              className="px-2.5 py-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all text-xs font-semibold flex items-center gap-1 cursor-pointer shrink-0"
              title="Clear sync history logs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear Logs
            </button>
          )}
        </div>

        {/* Sync Operations Audit Log List */}
        <div className="space-y-3 pt-1">
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
              <Database className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                No sync operation logs match your current filter.
              </p>
              <p className="text-[11px] text-slate-400">
                Click "Trigger Manual Sync" above to perform a live synchronization check.
              </p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isExpanded = expandedLogId === log.id;
              const hasItems = log.itemsSynced && log.itemsSynced.length > 0;

              const statusColors = {
                SUCCESS: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50 text-emerald-900 dark:text-emerald-200',
                NO_CHANGES: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/50 text-blue-900 dark:text-blue-200',
                OFFLINE_QUEUED: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50 text-amber-900 dark:text-amber-200',
                FAILED: 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/50 text-rose-900 dark:text-rose-200',
              }[log.status];

              const statusBadge = {
                SUCCESS: <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-extrabold"><CheckCircle2 className="w-3.5 h-3.5" /> SUCCESS</span>,
                NO_CHANGES: <span className="flex items-center gap-1 text-blue-700 dark:text-blue-400 font-extrabold"><Database className="w-3.5 h-3.5" /> NO CHANGES</span>,
                OFFLINE_QUEUED: <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400 font-extrabold"><WifiOff className="w-3.5 h-3.5" /> QUEUED OFFLINE</span>,
                FAILED: <span className="flex items-center gap-1 text-rose-700 dark:text-rose-400 font-extrabold"><XCircle className="w-3.5 h-3.5" /> FAILED</span>,
              }[log.status];

              return (
                <div
                  key={log.id}
                  className={`p-4 rounded-2xl border transition-all space-y-2.5 ${statusColors}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      {statusBadge}
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                        {log.triggerType === 'MANUAL_BUTTON' ? 'Manual Trigger' : log.triggerType === 'AUTO_RECONNECT' ? 'Auto Reconnect' : 'Forced Refresh'}
                      </span>
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        by <strong className="font-extrabold text-slate-900 dark:text-slate-100">{log.technicianName}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-medium shrink-0">
                      {log.networkLatencyMs ? (
                        <span className="font-mono text-[10px] text-slate-400">
                          {log.networkLatencyMs}ms latency
                        </span>
                      ) : null}
                      <span title={new Date(log.timestamp).toLocaleString()}>
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} • {new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                    {log.details}
                  </p>

                  {/* Itemized Detail Drawer Toggle */}
                  {hasItems && (
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                      <button
                        type="button"
                        onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                        className="flex items-center justify-between w-full text-xs font-bold text-indigo-700 dark:text-indigo-300 hover:underline cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5">
                          <ArrowUpRight className="w-3.5 h-3.5" /> View {log.itemsSynced!.length} itemized synced job payload{log.itemsSynced!.length > 1 ? 's' : ''}
                        </span>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>

                      {isExpanded && (
                        <div className="mt-2 space-y-1.5 bg-white/70 dark:bg-slate-900/70 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800 text-[11px] animate-in fade-in">
                          <div className="font-extrabold uppercase text-[10px] text-slate-400 tracking-wider mb-1">
                            Itemized Sync Operations Payload
                          </div>
                          {log.itemsSynced!.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200/40 dark:border-slate-700/40"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950">
                                  {item.jobId}
                                </span>
                                <span className="font-medium text-slate-800 dark:text-slate-200">
                                  {item.description}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono shrink-0">
                                {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Change Password Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div>
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-indigo-600" /> Account Password & Security
          </h2>
          <p className="text-xs text-slate-500">
            Change your account password. Logged in as <strong className="text-slate-700 dark:text-slate-200">{currentUser?.name || 'User'}</strong> ({currentUser?.email || currentUser?.phone || ''}).
          </p>
        </div>

        {passChangeSuccess && (
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-2xl font-bold text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Password updated successfully!
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {currentUser?.password && (
            <div>
              <label className="font-semibold block mb-1">Current Password *</label>
              <input
                type="password"
                required
                value={currentPassInput}
                onChange={(e) => setCurrentPassInput(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 dark:border-slate-700 font-medium"
              />
            </div>
          )}

          <div>
            <label className="font-semibold block mb-1">New Password *</label>
            <input
              type="password"
              required
              value={newPassInput}
              onChange={(e) => setNewPassInput(e.target.value)}
              placeholder="Min 4 chars"
              className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 dark:border-slate-700 font-medium"
            />
          </div>

          <div>
            <label className="font-semibold block mb-1">Confirm New Password *</label>
            <input
              type="password"
              required
              value={confirmPassInput}
              onChange={(e) => setConfirmPassInput(e.target.value)}
              placeholder="Repeat new password"
              className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 dark:border-slate-700 font-medium"
            />
          </div>

          <div className="sm:col-span-3 flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md flex items-center gap-2 cursor-pointer"
            >
              <KeyRound className="w-4 h-4" /> Update Password
            </button>
          </div>
        </form>
      </div>

      {/* Reset Testing Data Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-rose-200/80 dark:border-rose-900/60 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-600" /> Workspace Clean Testing Data Reset
            </h2>
            <p className="text-xs text-slate-500">
              Clear demo customers, jobs, invoices, and expenses for <strong className="text-slate-700 dark:text-slate-200">{currentBusiness.name}</strong> only. Your login credentials, business settings, and staff profiles will remain safe.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setResetTenantConfirmText('');
              setIsResetTenantModalOpen(true);
            }}
            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-4 h-4 text-rose-600" />
            <span>Reset Workspace Data</span>
          </button>
        </div>
      </div>

      {/* Global Theme & Appearance Preference */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div>
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            {theme === 'dark' ? <Moon className="w-4 h-4 text-amber-400" /> : <Sun className="w-4 h-4 text-amber-600" />} Appearance & Theme Mode
          </h2>
          <p className="text-xs text-slate-500">Switch between Light Mode (White Sand) and Dark Mode. Your selection is persisted in application state.</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              if (theme !== 'light') toggleTheme();
            }}
            className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
              theme === 'light'
                ? 'bg-amber-50/80 border-amber-300 text-amber-950 font-bold shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Light Mode</div>
                <div className="text-[10px] text-slate-500">Clean, crisp white interface</div>
              </div>
            </div>
            {theme === 'light' && <Check className="w-4 h-4 text-amber-600" />}
          </button>

          <button
            type="button"
            onClick={() => {
              if (theme !== 'dark') toggleTheme();
            }}
            className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
              theme === 'dark'
                ? 'bg-indigo-950/60 border-indigo-700 text-indigo-200 font-bold shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-slate-800 text-amber-400">
                <Moon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Dark Mode</div>
                <div className="text-[10px] text-slate-500">Eye-safe dark slate interface</div>
              </div>
            </div>
            {theme === 'dark' && <Check className="w-4 h-4 text-amber-400" />}
          </button>
        </div>
      </div>

      {/* Tenant Reset Confirmation Modal */}
      {isResetTenantModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-rose-500/40 max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="p-2.5 bg-rose-600 text-white rounded-2xl shadow-md">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 dark:text-slate-100 text-base">
                  Reset Workspace Testing Data
                </h3>
                <p className="text-xs text-rose-600 dark:text-rose-400 font-bold">{currentBusiness.name}</p>
              </div>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (resetTenantConfirmText.trim().toUpperCase() !== 'RESET') {
                  showToast('Please type RESET to confirm workspace data reset.', 'error');
                  return;
                }
                setIsResettingTenant(true);
                try {
                  await purgeTenantTransactionalData(currentBusiness.id);
                  setIsResetTenantModalOpen(false);
                  setResetTenantConfirmText('');
                } finally {
                  setIsResettingTenant(false);
                }
              }}
              className="space-y-4 text-xs"
            >
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                This will delete all test customers, jobs, orders, invoices, and payments for <strong>{currentBusiness.name}</strong>. Your settings and user login will remain safe.
              </p>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Type <span className="font-mono text-rose-600 dark:text-rose-400 font-black">RESET</span> to confirm:
                </label>
                <input
                  type="text"
                  required
                  value={resetTenantConfirmText}
                  onChange={(e) => setResetTenantConfirmText(e.target.value)}
                  placeholder="RESET"
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono font-bold tracking-widest text-center"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  disabled={isResettingTenant}
                  onClick={() => {
                    setIsResetTenantModalOpen(false);
                    setResetTenantConfirmText('');
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isResettingTenant || resetTenantConfirmText.trim().toUpperCase() !== 'RESET'}
                  className={`px-5 py-2 rounded-xl font-extrabold text-white flex items-center gap-2 shadow-md cursor-pointer transition-all ${
                    resetTenantConfirmText.trim().toUpperCase() === 'RESET' && !isResettingTenant
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed opacity-60'
                  }`}
                >
                  {isResettingTenant ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Resetting Workspace...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Confirm Reset</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


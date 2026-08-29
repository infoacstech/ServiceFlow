import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  History,
  Search,
  Briefcase,
  CreditCard,
  FileText,
  FileCode,
  User,
  ShieldCheck,
  Package,
  Settings,
  Plus,
  Clock,
  Filter,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ActivityLog } from '../types';

export const ActivityLogDrawer: React.FC = () => {
  const { activityLogs, isActivityLogOpen, setIsActivityLogOpen, logActivity, currentBusiness } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<string>('all');
  const [logLimit, setLogLimit] = useState<number | 'all'>(10);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [noteAction, setNoteAction] = useState('');
  const [noteDescription, setNoteDescription] = useState('');
  const [noteEntityType, setNoteEntityType] = useState<ActivityLog['entityType']>('job');

  if (!isActivityLogOpen) return null;

  // Filter activity logs
  const allFilteredLogs = (activityLogs || []).filter((log) => {
    const s = (searchTerm || '').toLowerCase();
    const matchesSearch =
      (log.action || '').toLowerCase().includes(s) ||
      (log.description || '').toLowerCase().includes(s) ||
      (log.userName || '').toLowerCase().includes(s) ||
      (log.entityId || '').toLowerCase().includes(s);

    const matchesEntity = selectedEntity === 'all' || log.entityType === selectedEntity;

    return matchesSearch && matchesEntity;
  });

  const displayedLogs = logLimit === 'all' ? allFilteredLogs : allFilteredLogs.slice(0, logLimit);

  const getEntityIcon = (type: ActivityLog['entityType']) => {
    switch (type) {
      case 'job':
        return <Briefcase className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
      case 'payment':
        return <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'invoice':
        return <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'quotation':
        return <FileCode className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case 'customer':
        return <User className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />;
      case 'contract':
        return <ShieldCheck className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
      case 'inventory':
        return <Package className="w-4 h-4 text-orange-600 dark:text-orange-400" />;
      default:
        return <Settings className="w-4 h-4 text-slate-600 dark:text-slate-400" />;
    }
  };

  const getEntityBadgeStyle = (type: ActivityLog['entityType']) => {
    switch (type) {
      case 'job':
        return 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
      case 'payment':
        return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'invoice':
        return 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'quotation':
        return 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'customer':
        return 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800';
      case 'contract':
        return 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      case 'inventory':
        return 'bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  const formatTimestamp = (isoString: string) => {
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return isoString;

      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (isToday) {
        return `Today, ${timeStr}`;
      }

      const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
      return `${dateStr} at ${timeStr}`;
    } catch {
      return isoString;
    }
  };

  const handleAddNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteAction || !noteDescription) return;

    logActivity(noteAction, noteEntityType, `manual-${Date.now()}`, noteDescription);
    setNoteAction('');
    setNoteDescription('');
    setShowAddNoteModal(false);
  };

  const entityCategories = [
    { id: 'all', label: 'All Activities' },
    { id: 'job', label: 'Jobs' },
    { id: 'payment', label: 'Payments' },
    { id: 'invoice', label: 'Invoices' },
    { id: 'quotation', label: 'Quotes' },
    { id: 'customer', label: 'Customers' },
    { id: 'contract', label: 'Contracts' },
    { id: 'inventory', label: 'Inventory' },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsActivityLogOpen(false)}
          className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/70 backdrop-blur-sm transition-opacity"
        />

        {/* Sliding Drawer */}
        <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-full sm:max-w-md bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col h-full overflow-hidden"
          >
            {/* Drawer Header */}
            <div className="px-4 py-3.5 sm:px-5 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/70">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0 border border-indigo-100/60 dark:border-indigo-900/40">
                  <History className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    Activity Log
                    <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-mono">
                      {activityLogs.length}
                    </span>
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    Audit trail for {currentBusiness.name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddNoteModal(true)}
                  className="p-1.5 sm:p-2 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800 text-indigo-600 dark:text-indigo-400 transition-colors cursor-pointer"
                  title="Record Audit Note"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsActivityLogOpen(false)}
                  className="p-1.5 sm:p-2 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Controls & Search */}
            <div className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-800 space-y-2.5 bg-white dark:bg-slate-900">
              {/* Full Width Search input */}
              <div className="relative w-full">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search actions, staff, or descriptions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Entity category pills (Horizontally scrollable) */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 w-full">
                {entityCategories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedEntity(cat.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                      selectedEntity === cat.id
                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Status bar & Limit Selector */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="truncate">
                    Showing <strong>{displayedLogs.length}</strong> of {allFilteredLogs.length}
                  </span>
                  {logLimit !== 'all' && allFilteredLogs.length > logLimit && (
                    <button
                      type="button"
                      onClick={() => setLogLimit('all')}
                      className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer shrink-0"
                    >
                      View All
                    </button>
                  )}
                </div>

                {/* Compact Limit Selector */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg shrink-0 border border-slate-200/80 dark:border-slate-700/80">
                  <span className="text-[10px] font-bold text-slate-400 pl-1.5">Limit:</span>
                  {([10, 25, 50, 'all'] as const).map((lim) => (
                    <button
                      key={String(lim)}
                      type="button"
                      onClick={() => setLogLimit(lim)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                        logLimit === lim
                          ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      {lim === 'all' ? 'All' : lim}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Timeline Content */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-5 space-y-4 bg-slate-50/40 dark:bg-slate-900/30">
              {displayedLogs.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
                    <Filter className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                    No activities found
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                    Try clearing your search or selecting a different category filter.
                  </p>
                </div>
              ) : (
                <div className="relative pl-5 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                  {displayedLogs.map((log) => {
                    const isSelected = selectedLogId === log.id;
                    return (
                      <div
                        key={log.id}
                        onClick={() => setSelectedLogId(isSelected ? null : log.id)}
                        className="relative group cursor-pointer min-w-0"
                      >
                        {/* Timeline Dot Icon */}
                        <div
                          className={`absolute -left-5 top-1 w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center shadow-2xs transition-colors ${
                            isSelected
                              ? 'bg-indigo-600 border-indigo-600'
                              : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700'
                          }`}
                        >
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${
                              isSelected ? 'bg-white' : 'bg-indigo-600 dark:bg-indigo-400'
                            }`}
                          />
                        </div>

                        {/* Card Content */}
                        <div
                          className={`rounded-2xl p-3 sm:p-3.5 border shadow-xs transition-all space-y-2 overflow-hidden min-w-0 ${
                            isSelected
                              ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-600 ring-2 ring-indigo-500/20'
                              : 'bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/60 hover:border-indigo-300 dark:hover:border-indigo-700'
                          }`}
                        >
                          {/* Header: Action & Badge */}
                          <div className="flex items-start justify-between gap-2 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                              <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100 break-words">
                                {log.action}
                              </span>
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-bold border flex items-center gap-1 shrink-0 ${getEntityBadgeStyle(
                                  log.entityType
                                )}`}
                              >
                                {getEntityIcon(log.entityType)}
                                <span className="capitalize">{log.entityType}</span>
                              </span>
                            </div>
                            {isSelected && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-200 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 font-bold shrink-0">
                                Details
                              </span>
                            )}
                          </div>

                          {/* Description */}
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal break-words">
                            {log.description}
                          </p>

                          {/* Extended Details if Selected */}
                          {isSelected && (
                            <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-indigo-200 dark:border-indigo-800/60 text-[10px] text-slate-600 dark:text-slate-300 space-y-1 overflow-hidden break-words">
                              <div className="font-mono text-slate-400 truncate">ID: {log.id}</div>
                              {log.entityId && <div className="font-mono text-slate-400 truncate">Entity: {log.entityId}</div>}
                              <div className="text-indigo-600 dark:text-indigo-400 font-medium break-all">
                                Time: {log.timestamp}
                              </div>
                            </div>
                          )}

                          {/* Footer: User & Time */}
                          <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-1 text-[11px] text-slate-400 dark:text-slate-500 pt-1.5 border-t border-slate-100 dark:border-slate-800/80">
                            <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1 truncate">
                              <User className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{log.userName}</span>
                            </span>
                            <span className="flex items-center gap-1 font-mono text-[10px] text-slate-400 shrink-0">
                              <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                              {formatTimestamp(log.timestamp)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal to add manual note */}
            {showAddNoteModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-sm p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Plus className="w-4 h-4 text-indigo-600" /> Record Audit Note
                    </h3>
                    <button
                      onClick={() => setShowAddNoteModal(false)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleAddNoteSubmit} className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                        Category
                      </label>
                      <select
                        value={noteEntityType}
                        onChange={(e) => setNoteEntityType(e.target.value as ActivityLog['entityType'])}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none"
                      >
                        <option value="job">Job</option>
                        <option value="payment">Payment</option>
                        <option value="invoice">Invoice</option>
                        <option value="quotation">Quotation</option>
                        <option value="customer">Customer</option>
                        <option value="contract">Contract</option>
                        <option value="inventory">Inventory</option>
                        <option value="staff">Staff</option>
                        <option value="settings">Settings</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                        Action Title
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Call logged with client, Site inspection"
                        value={noteAction}
                        onChange={(e) => setNoteAction(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                        Details / Description
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Write details regarding this event..."
                        value={noteDescription}
                        onChange={(e) => setNoteDescription(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddNoteModal(false)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs"
                      >
                        Save Note
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

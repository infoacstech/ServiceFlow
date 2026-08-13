import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SystemSettings } from '../types';
import {
  ShieldCheck,
  Building2,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Ban,
  RotateCcw,
  Headphones,
  Lock,
  Unlock,
  Sliders,
  FileText,
  KeyRound,
  UserX,
  AlertOctagon,
  Eye,
  ShieldAlert,
  Trash2,
  Sparkles,
  Database,
  RefreshCw,
  AlertTriangle,
  Layers,
  Check,
} from 'lucide-react';

export const SuperAdminView: React.FC = () => {
  const {
    businesses,
    users,
    customers,
    jobs,
    services,
    categories,
    inventory,
    quotations,
    invoices,
    payments,
    contracts,
    expenses,
    notifications,
    activityLogs,
    roles,
    plans,
    switchBusiness,
    updateBusinessAndOwnerStatus,
    updateUserStatus,
    supportSessions,
    activeSupportSession,
    startSupportSession,
    endSupportSession,
    systemSettings,
    updateSystemSettings,
    securityAuditLogs,
    revokeUserSession,
    forcePasswordReset,
    purgeAllTransactionalData,
    purgeTenantTransactionalData,
    showToast,
  } = useApp();

  const [activeTabSection, setActiveTabSection] = useState<
    'approvals' | 'tenants' | 'cleanup' | 'support' | 'settings' | 'audit' | 'sessions'
  >('approvals');

  // Support Session Dialog State
  const [supportModalBiz, setSupportModalBiz] = useState<{ id: string; name: string } | null>(null);
  const [supportReason, setSupportReason] = useState<string>('');
  const [supportDuration, setSupportDuration] = useState<number>(30);
  const [supportAccessMode, setSupportAccessMode] = useState<'read_only' | 'full_support'>('read_only');

  // Purge / Clean Reset Modal State
  const [isPurgeModalOpen, setIsPurgeModalOpen] = useState(false);
  const [purgeTargetMode, setPurgeTargetMode] = useState<'global' | 'tenant'>('global');
  const [selectedTenantForPurge, setSelectedTenantForPurge] = useState<string>(businesses[0]?.id || '');
  const [purgeConfirmationText, setPurgeConfirmationText] = useState('');
  const [isPurgingInProgress, setIsPurgingInProgress] = useState(false);
  const [lastPurgeResult, setLastPurgeResult] = useState<{ clearedCollections: string[]; totalDocsDeleted: number } | null>(null);

  // Find pending owner/business registrations & pending staff
  const pendingOwners = users.filter(
    (u) => u.role === 'business_owner' && u.approvalStatus === 'pending'
  );
  const pendingStaffUsers = users.filter(
    (u) => u.role !== 'business_owner' && u.role !== 'super_admin' && u.approvalStatus === 'pending'
  );
  const pendingBusinessIds = Array.from(
    new Set([
      ...businesses.filter((b) => b.status === 'pending').map((b) => b.id),
      ...pendingOwners.map((u) => u.businessId),
    ])
  );

  const pendingRegistrations = pendingBusinessIds.map((bId) => {
    const biz = businesses.find((b) => b.id === bId);
    const owner =
      users.find((u) => u.businessId === bId && u.role === 'business_owner' && u.approvalStatus === 'pending') ||
      users.find((u) => u.businessId === bId && u.role === 'business_owner');
    return {
      businessId: bId,
      businessName: biz?.name || (owner?.name ? `${owner.name}'s Business` : 'New Business'),
      type: biz?.type || 'General Service',
      ownerName: owner?.name || 'Unknown Owner',
      ownerEmail: owner?.email || biz?.email || 'N/A',
      ownerPhone: owner?.phone || biz?.mobile || 'N/A',
      dateRegistered:
        owner?.requestedDate ||
        owner?.joiningDate ||
        biz?.createdAt ||
        new Date().toISOString().split('T')[0],
      ownerId: owner?.id,
    };
  });

  const activeCount = businesses.filter((b) => b.status === 'active' || b.status === 'trial').length;
  const suspendedCount = businesses.filter((b) => b.status === 'suspended').length;
  const pendingCount = pendingRegistrations.length + pendingStaffUsers.length;

  const handleOpenSupportModal = (bId: string, bName: string) => {
    setSupportModalBiz({ id: bId, name: bName });
    setSupportReason('');
    setSupportDuration(30);
    setSupportAccessMode('read_only');
  };

  const handleConfirmStartSupportSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportModalBiz) return;
    if (!supportReason.trim()) {
      alert('Please provide a mandatory justification/reason for accessing customer tenant data.');
      return;
    }
    startSupportSession(
      supportModalBiz.id,
      supportReason,
      supportDuration,
      supportAccessMode
    );
    setSupportModalBiz(null);
  };

  const handleExecutePurge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (purgeConfirmationText.trim().toUpperCase() !== 'RESET') {
      showToast('Safety Check Failed: Please type "RESET" to confirm the action.', 'error');
      return;
    }

    setIsPurgingInProgress(true);
    try {
      let result;
      if (purgeTargetMode === 'global') {
        result = await purgeAllTransactionalData();
      } else {
        result = await purgeTenantTransactionalData(selectedTenantForPurge);
      }
      setLastPurgeResult(result);
      setIsPurgeModalOpen(false);
      setPurgeConfirmationText('');
    } catch (err) {
      console.error('Failed to execute clean data purge:', err);
    } finally {
      setIsPurgingInProgress(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-1">
          <div className="inline-flex items-center gap-2 bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full border border-purple-500/30 text-xs font-semibold mb-1">
            <ShieldCheck className="w-4 h-4 text-purple-300" />
            <span>SaaS Super Administrator Master Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Platform Security, Support & Tenant Control
          </h1>
          <p className="text-xs sm:text-sm text-purple-200/80 max-w-2xl">
            Manage tenant signups, request audited time-limited support access, configure global system policies, and review platform security logs.
          </p>
        </div>

        {activeSupportSession && (
          <div className="relative z-10 bg-amber-500/20 border border-amber-400/40 p-3.5 rounded-2xl flex flex-col gap-1 text-xs">
            <span className="font-extrabold text-amber-300 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              Active Support Mode
            </span>
            <span className="font-bold text-white">
              {activeSupportSession.targetBusinessName}
            </span>
            <button
              onClick={() => endSupportSession('Super Admin ended session from master console')}
              className="mt-1 px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-[11px] transition-all"
            >
              End Support Access
            </button>
          </div>
        )}
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto p-1.5 bg-slate-200/60 dark:bg-slate-900/80 rounded-2xl border border-slate-300/60 dark:border-slate-800 text-xs font-bold scrollbar-none">
        <button
          onClick={() => setActiveTabSection('approvals')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTabSection === 'approvals'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-300/50 dark:hover:bg-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Pending Registrations ({pendingCount})</span>
        </button>

        <button
          onClick={() => setActiveTabSection('tenants')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTabSection === 'tenants'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-300/50 dark:hover:bg-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Tenant Businesses ({businesses.length})</span>
        </button>

        <button
          onClick={() => setActiveTabSection('cleanup')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTabSection === 'cleanup'
              ? 'bg-rose-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-300/50 dark:hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Clean State & Data Purge</span>
        </button>

        <button
          onClick={() => setActiveTabSection('support')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTabSection === 'support'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-300/50 dark:hover:bg-slate-800'
          }`}
        >
          <Headphones className="w-4 h-4" />
          <span>Audited Support Access</span>
        </button>

        <button
          onClick={() => setActiveTabSection('settings')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTabSection === 'settings'
              ? 'bg-slate-800 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-300/50 dark:hover:bg-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>System Settings & MFA</span>
        </button>

        <button
          onClick={() => setActiveTabSection('audit')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTabSection === 'audit'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-300/50 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Security Audit Logs</span>
        </button>

        <button
          onClick={() => setActiveTabSection('sessions')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTabSection === 'sessions'
              ? 'bg-rose-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-300/50 dark:hover:bg-slate-800'
          }`}
        >
          <UserX className="w-4 h-4" />
          <span>Active Sessions & Security Controls</span>
        </button>
      </div>

      {/* Stats Quick Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Tenants</span>
            <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{businesses.length}</div>
          <div className="text-[10px] text-slate-400 mt-1">Isolated Data Environments</div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Approvals</span>
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{pendingCount}</div>
          <div className="text-[10px] text-amber-700 dark:text-amber-300 font-medium mt-1">
            {pendingCount > 0 ? 'Requires Super Admin Action' : 'All Clear — No Pending Approvals'}
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Businesses</span>
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{activeCount}</div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-1">Active Accounts</div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Suspended</span>
            <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <Ban className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400">{suspendedCount}</div>
          <div className="text-[10px] text-rose-600 font-semibold mt-1">Access Revoked / Suspended</div>
        </div>
      </div>

      {/* SECTION 1: Pending Owner Approvals */}
      {activeTabSection === 'approvals' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-amber-200/80 dark:border-amber-900/60 shadow-md overflow-hidden">
          <div className="p-5 bg-amber-50/80 dark:bg-amber-950/30 border-b border-amber-200/60 dark:border-amber-900/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500 text-white rounded-xl shadow-xs">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-amber-950 dark:text-amber-100">
                  Pending Business Owner Registrations
                </h2>
                <p className="text-xs text-amber-800/80 dark:text-amber-300">
                  New Business Owners must be approved by Super Admin before they can log in.
                </p>
              </div>
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100">
              {pendingCount} Pending
            </span>
          </div>

          {pendingRegistrations.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2 opacity-80" />
              <p className="font-bold text-slate-700 dark:text-slate-300">No Pending Business Approvals</p>
              <p className="mt-1 text-[11px]">All new Business Owner signups have been processed.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-amber-100/40 dark:bg-amber-950/50 text-amber-950 dark:text-amber-200 font-bold uppercase">
                  <tr>
                    <th className="p-4">Business Name</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Owner Name</th>
                    <th className="p-4">Email / Phone</th>
                    <th className="p-4">Date Registered</th>
                    <th className="p-4 text-right">Super Admin Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100/60 dark:divide-slate-800">
                  {pendingRegistrations.map((item) => (
                    <tr key={item.businessId} className="hover:bg-amber-50/40 dark:hover:bg-slate-800/60 transition-colors">
                      <td className="p-4 font-bold text-slate-900 dark:text-slate-100">{item.businessName}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                          {item.type}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-slate-800 dark:text-slate-200">{item.ownerName}</td>
                      <td className="p-4 text-slate-600 dark:text-slate-400">
                        <div>{item.ownerEmail}</div>
                        <div className="text-[10px] text-slate-400">{item.ownerPhone}</div>
                      </td>
                      <td className="p-4 text-slate-500 font-mono text-[11px]">{item.dateRegistered}</td>
                      <td className="p-4 text-right">
                        <div className="inline-flex items-center gap-2 justify-end">
                          <button
                            onClick={() => updateBusinessAndOwnerStatus(item.businessId, 'active')}
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => updateBusinessAndOwnerStatus(item.businessId, 'rejected')}
                            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {pendingStaffUsers.length > 0 && (
            <div className="mt-6 border-t border-amber-200/60 dark:border-amber-900/60 pt-4 px-5 pb-5">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-600" />
                Pending Staff & Technician Account Requests ({pendingStaffUsers.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase">
                    <tr>
                      <th className="p-3">Staff Name</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Assigned Business</th>
                      <th className="p-3">Email / Phone</th>
                      <th className="p-3">Requested Date</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {pendingStaffUsers.map((usr) => {
                      const biz = businesses.find((b) => b.id === usr.businessId);
                      return (
                        <tr key={usr.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{usr.name}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 capitalize">
                              {usr.role.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">
                            {biz?.name || usr.businessId}
                          </td>
                          <td className="p-3 text-slate-600 dark:text-slate-400">
                            <div>{usr.email}</div>
                            <div className="text-[10px] text-slate-400">{usr.phone}</div>
                          </td>
                          <td className="p-3 font-mono text-[11px] text-slate-500">{usr.requestedDate || usr.joiningDate}</td>
                          <td className="p-3 text-right">
                            <div className="inline-flex items-center gap-2 justify-end">
                              <button
                                onClick={() => updateUserStatus(usr.id, 'active')}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                Approve
                              </button>
                              <button
                                onClick={() => updateUserStatus(usr.id, 'rejected')}
                                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                              >
                                <XCircle className="w-3 h-3" />
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: All Business Tenants */}
      {activeTabSection === 'tenants' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                Registered Business Tenants & Access Control
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                View onboarded companies, request audited time-limited support access, or suspend access.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-500">{businesses.length} Total</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 font-bold uppercase">
                <tr>
                  <th className="p-4">Business Name</th>
                  <th className="p-4">Industry Type</th>
                  <th className="p-4">Owner / Email</th>
                  <th className="p-4">GSTIN / Contact</th>
                  <th className="p-4">Platform Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {businesses.map((b) => {
                  const owner = users.find((u) => u.businessId === b.id && u.role === 'business_owner');
                  const isPending = b.status === 'pending' || owner?.approvalStatus === 'pending';
                  const isSuspended = b.status === 'suspended' || owner?.approvalStatus === 'suspended';
                  const isRejected = b.status === 'rejected' || owner?.approvalStatus === 'rejected';

                  return (
                    <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-4 font-extrabold text-slate-900 dark:text-slate-100">
                        <div>{b.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {b.id}</div>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                          {b.type}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          {owner?.name || (b.email ? b.email.split('@')[0] : 'Business Owner')}
                        </div>
                        <div className="text-[10px] text-slate-500">{owner?.email || b.email || 'N/A'}</div>
                      </td>
                      <td className="p-4 text-slate-500">
                        <div className="font-mono">{b.gstNumber || 'Unregistered'}</div>
                        <div className="text-[10px] text-slate-400">{b.mobile}</div>
                      </td>
                      <td className="p-4">
                        {isPending ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 uppercase tracking-wider">
                            PENDING APPROVAL
                          </span>
                        ) : isSuspended ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 uppercase tracking-wider">
                            SUSPENDED
                          </span>
                        ) : isRejected ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                            REJECTED
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 uppercase tracking-wider">
                            ACTIVE
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="inline-flex items-center gap-2 justify-end">
                          {/* Time-Limited Audited Support Request Button */}
                          <button
                            onClick={() => handleOpenSupportModal(b.id, b.name)}
                            className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                            title="Request temporary audited support access to customer data"
                          >
                            <Headphones className="w-3.5 h-3.5" />
                            <span>Support Access</span>
                          </button>

                          {/* Suspend / Restore Toggle Button */}
                          {isSuspended ? (
                            <button
                              onClick={() => updateBusinessAndOwnerStatus(b.id, 'active')}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Restore</span>
                            </button>
                          ) : isPending ? (
                            <button
                              onClick={() => updateBusinessAndOwnerStatus(b.id, 'active')}
                              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => updateBusinessAndOwnerStatus(b.id, 'suspended')}
                              className="px-3 py-1.5 rounded-xl border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/60 font-bold text-xs transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              <span>Suspend</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION: Clean State & Data Purge Console */}
      {activeTabSection === 'cleanup' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Top Info Banner */}
          <div className="bg-gradient-to-r from-rose-900 via-purple-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-rose-500/30 shadow-lg relative overflow-hidden">
            <div className="relative z-10 space-y-2">
              <div className="inline-flex items-center gap-2 bg-rose-500/20 text-rose-300 px-3 py-1 rounded-full border border-rose-500/30 text-xs font-semibold">
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Clean Testing Environment Utility</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black">
                Reset ServiFlow to Clean Testing State
              </h2>
              <p className="text-xs sm:text-sm text-rose-200/80 max-w-2xl leading-relaxed">
                Safely wipe out dummy sample transactions, test customers, demo jobs, mock invoices, and synthetic inventory history while strictly preserving all Super Admin credentials, Business Owner accounts, plans, roles, and security configs.
              </p>
            </div>
          </div>

          {/* Real-time Collections Footprint */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Transactional Data Status */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 rounded-xl">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                      Transactional & Demo Entities
                    </h3>
                    <p className="text-[11px] text-slate-500">Will be permanently erased during clean reset</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between">
                  <span className="text-slate-500 text-[11px]">Customers</span>
                  <span className="text-lg font-black text-slate-900 dark:text-slate-100 mt-1">{customers.length}</span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between">
                  <span className="text-slate-500 text-[11px]">Jobs / Orders</span>
                  <span className="text-lg font-black text-slate-900 dark:text-slate-100 mt-1">{jobs.length}</span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between">
                  <span className="text-slate-500 text-[11px]">Invoices</span>
                  <span className="text-lg font-black text-slate-900 dark:text-slate-100 mt-1">{invoices.length}</span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between">
                  <span className="text-slate-500 text-[11px]">Quotations</span>
                  <span className="text-lg font-black text-slate-900 dark:text-slate-100 mt-1">{quotations.length}</span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between">
                  <span className="text-slate-500 text-[11px]">Payments Recorded</span>
                  <span className="text-lg font-black text-slate-900 dark:text-slate-100 mt-1">{payments.length}</span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between">
                  <span className="text-slate-500 text-[11px]">Expenses</span>
                  <span className="text-lg font-black text-slate-900 dark:text-slate-100 mt-1">{expenses.length}</span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between">
                  <span className="text-slate-500 text-[11px]">Inventory Items</span>
                  <span className="text-lg font-black text-slate-900 dark:text-slate-100 mt-1">{inventory.length}</span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between">
                  <span className="text-slate-500 text-[11px]">Services Catalog</span>
                  <span className="text-lg font-black text-slate-900 dark:text-slate-100 mt-1">{services.length}</span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between">
                  <span className="text-slate-500 text-[11px]">AMC Contracts</span>
                  <span className="text-lg font-black text-slate-900 dark:text-slate-100 mt-1">{contracts.length}</span>
                </div>
              </div>

              {customers.length === 0 && jobs.length === 0 && invoices.length === 0 ? (
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-300 font-semibold">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>Transactional database is 100% clean & ready for real testing.</span>
                </div>
              ) : (
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-2xl flex items-center gap-2.5 text-xs text-amber-800 dark:text-amber-300 font-semibold">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  <span>Found {customers.length + jobs.length + invoices.length + quotations.length + payments.length + inventory.length} test records that can be purged.</span>
                </div>
              )}
            </div>

            {/* Preserved Master Data */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                      Preserved System Master Architecture
                    </h3>
                    <p className="text-[11px] text-slate-500">100% Protected & untouched during any reset</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Protected</span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200/60 dark:border-emerald-900/40 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-slate-800 dark:text-slate-200">Super Admin & Platform Admins</span>
                  </div>
                  <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">admin@serviflow.io</span>
                </div>

                <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200/60 dark:border-emerald-900/40 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-slate-800 dark:text-slate-200">Tenant Businesses & Master Profiles</span>
                  </div>
                  <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">{businesses.length} Businesses</span>
                </div>

                <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200/60 dark:border-emerald-900/40 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-slate-800 dark:text-slate-200">Business Owners & Registered Users</span>
                  </div>
                  <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">{users.length} Users</span>
                </div>

                <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200/60 dark:border-emerald-900/40 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-slate-800 dark:text-slate-200">Subscription Plans & Billing Config</span>
                  </div>
                  <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">{plans.length} Tier Plans</span>
                </div>

                <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200/60 dark:border-emerald-900/40 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-slate-800 dark:text-slate-200">System Roles & Permissions Matrix</span>
                  </div>
                  <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">{roles.length} Role Profiles</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Launchers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Option 1: Global Reset */}
            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-rose-300 dark:border-rose-900/60 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-rose-600 text-white rounded-2xl shadow-md">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                    Option A: Global Clean State Wipe
                  </h3>
                  <p className="text-xs text-slate-500">
                    Wipes dummy records across all collections for all test accounts simultaneously.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Recommended before initiating full end-to-end user acceptance testing. Resets all dashboards to zero without logging out your admin session.
              </div>

              <button
                onClick={() => {
                  setPurgeTargetMode('global');
                  setPurgeConfirmationText('');
                  setIsPurgeModalOpen(true);
                }}
                className="w-full py-3.5 px-4 bg-rose-600 hover:bg-rose-700 active:scale-[0.99] text-white font-extrabold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm"
              >
                <Trash2 className="w-4 h-4" />
                <span>Execute Global Clean Reset</span>
              </button>
            </div>

            {/* Option 2: Tenant-Specific Purge */}
            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-md">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                    Option B: Isolated Tenant Data Reset
                  </h3>
                  <p className="text-xs text-slate-500">
                    Target only one specific business workspace without affecting others.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Select Target Business Workspace:
                </label>
                <select
                  value={selectedTenantForPurge}
                  onChange={(e) => setSelectedTenantForPurge(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                >
                  {businesses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} (ID: {b.id})
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => {
                  setPurgeTargetMode('tenant');
                  setPurgeConfirmationText('');
                  setIsPurgeModalOpen(true);
                }}
                className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-extrabold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm"
              >
                <Sparkles className="w-4 h-4" />
                <span>Reset Selected Tenant Workspace</span>
              </button>
            </div>
          </div>

          {/* Last Purge Result Badge */}
          {lastPurgeResult && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-3xl flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-200">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <div>
                  <span className="font-extrabold">Clean State Activated Successfully: </span>
                  <span>
                    Purged {lastPurgeResult.totalDocsDeleted} documents across collections ({lastPurgeResult.clearedCollections.join(', ')}).
                  </span>
                </div>
              </div>
              <button
                onClick={() => setLastPurgeResult(null)}
                className="font-bold underline text-[11px] text-emerald-700 dark:text-emerald-300"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      )}

      {/* SECTION 3: Time-Limited Support Access Management */}
      {activeTabSection === 'support' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-purple-200/80 dark:border-purple-900/60 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-purple-600 text-white rounded-2xl shadow-md">
                <Headphones className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
                  Zero-Trust Audited Support Access Engine
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Super Admins do not possess permanent unrestricted backdoor access to tenant data. All support sessions require reason justification, are strictly time-bound, and default to Read-Only mode.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-2xl border border-purple-200/50 dark:border-purple-900/40">
                <div className="text-xs font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1.5 mb-1">
                  <Clock className="w-4 h-4 text-purple-600" />
                  Time-Limited Sessions
                </div>
                <p className="text-[11px] text-purple-800/80 dark:text-purple-300/80">
                  Sessions auto-expire after 15, 30, or 60 minutes with live top-bar countdown.
                </p>
              </div>

              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200/50 dark:border-amber-900/40">
                <div className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5 mb-1">
                  <Lock className="w-4 h-4 text-amber-600" />
                  Read-Only Default
                </div>
                <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80">
                  Default mode prevents unintended modifications to customer records during diagnostic checks.
                </p>
              </div>

              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200/50 dark:border-emerald-900/40">
                <div className="text-xs font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5 mb-1">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  Immutable Audit Log
                </div>
                <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80">
                  Every support access request, reason, duration, and action is permanently recorded in security logs.
                </p>
              </div>
            </div>
          </div>

          {/* Support Sessions Log Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                Recent Support Access History & Active Sessions
              </h3>
              <span className="text-xs text-slate-500 font-bold">{supportSessions.length} Total Sessions</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 font-bold uppercase">
                  <tr>
                    <th className="p-4">Target Business</th>
                    <th className="p-4">Admin Email</th>
                    <th className="p-4">Reason / Justification</th>
                    <th className="p-4">Mode</th>
                    <th className="p-4">Expiry Time</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {supportSessions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400">
                        No support sessions recorded yet.
                      </td>
                    </tr>
                  ) : (
                    supportSessions.map((session) => (
                      <tr key={session.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-4 font-bold text-slate-900 dark:text-slate-100">
                          {session.targetBusinessName}
                        </td>
                        <td className="p-4 text-slate-600 dark:text-slate-400">{session.superAdminEmail}</td>
                        <td className="p-4 text-slate-700 dark:text-slate-300 italic">"{session.reason}"</td>
                        <td className="p-4">
                          {session.accessMode === 'read_only' ? (
                            <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 font-bold text-[10px]">
                              READ-ONLY
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 font-bold text-[10px]">
                              FULL SUPPORT
                            </span>
                          )}
                        </td>
                        <td className="p-4 font-mono text-slate-500 text-[11px]">
                          {new Date(session.expiryTime).toLocaleTimeString()}
                        </td>
                        <td className="p-4">
                          {session.status === 'active' ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-purple-600 text-white animate-pulse">
                              ACTIVE NOW
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                              EXPIRED
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: Platform System Settings & MFA */}
      {activeTabSection === 'settings' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="p-2.5 bg-slate-800 text-white rounded-2xl">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                Global SaaS Platform Settings & Multi-Factor Auth (MFA)
              </h2>
              <p className="text-xs text-slate-500">
                Configure platform-wide security rules, MFA enforcement policies, and global system maintenance toggles.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Security Policies */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-4">
              <h3 className="font-bold text-xs uppercase text-slate-500 tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                MFA & Authentication Enforcements
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Multi-Factor Authentication (MFA) Enforcement
                  </label>
                  <select
                    value={systemSettings.mfaEnforcement}
                    onChange={(e) =>
                      updateSystemSettings({
                        mfaEnforcement: e.target.value as SystemSettings['mfaEnforcement'],
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-medium"
                  >
                    <option value="optional">Optional for All Users</option>
                    <option value="required_super_admin">Mandatory for Super Admins Only</option>
                    <option value="required_business_owners">Mandatory for Super Admins & Business Owners</option>
                    <option value="required_all">Mandatory Platform-Wide for All Staff</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Minimum Password Strength (Length)
                  </label>
                  <input
                    type="number"
                    min={6}
                    max={32}
                    value={systemSettings.minPasswordLength}
                    onChange={(e) => updateSystemSettings({ minPasswordLength: parseInt(e.target.value) || 8 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Session Inactivity Timeout (Minutes)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={480}
                    value={systemSettings.sessionTimeoutMinutes}
                    onChange={(e) =>
                      updateSystemSettings({ sessionTimeoutMinutes: parseInt(e.target.value) || 60 })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
            </div>

            {/* Platform Operational Toggles */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-4">
              <h3 className="font-bold text-xs uppercase text-slate-500 tracking-wider flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-amber-600" />
                Operational System Switches
              </h3>

              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-slate-100">Maintenance Mode</div>
                    <div className="text-[10px] text-slate-500">Temporarily block non-admin logins</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={systemSettings.maintenanceMode}
                    onChange={(e) => updateSystemSettings({ maintenanceMode: e.target.checked })}
                    className="w-5 h-5 accent-purple-600 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-slate-100 font-sans">Allow New Business Signups</div>
                    <div className="text-[10px] text-slate-500">Enable self-service Business Owner onboarding</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={systemSettings.allowNewRegistrations}
                    onChange={(e) => updateSystemSettings({ allowNewRegistrations: e.target.checked })}
                    className="w-5 h-5 accent-purple-600 rounded cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Global System Announcement Banner Text
                  </label>
                  <input
                    type="text"
                    value={systemSettings.globalNoticeBanner}
                    onChange={(e) => updateSystemSettings({ globalNoticeBanner: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5: Security Audit Logs */}
      {activeTabSection === 'audit' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                Security Audit Logs & Compliance Trail
              </h2>
              <p className="text-xs text-slate-500">
                Real-time immutable security logs for all platform admin events, support access requests, and user status changes.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-500">{securityAuditLogs.length} Events</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 font-bold uppercase">
                <tr>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Actor</th>
                  <th className="p-4">Action Event</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Target Business</th>
                  <th className="p-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {securityAuditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-4 font-mono text-[11px] text-slate-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-800 dark:text-slate-200">{log.actorName}</div>
                      <div className="text-[10px] text-slate-400">{log.actorRole}</div>
                    </td>
                    <td className="p-4 font-mono font-bold text-purple-700 dark:text-purple-300">
                      {log.action}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-bold text-[10px] text-slate-700 dark:text-slate-300">
                        {log.category}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-slate-700 dark:text-slate-300">
                      {log.targetBusinessName || 'N/A'}
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-400">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 6: Active User Sessions & Security Controls */}
      {activeTabSection === 'sessions' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                User Session Invalidation & Password Reset Controls
              </h2>
              <p className="text-xs text-slate-500">
                Revoke active user sessions, block suspicious logins, or issue emergency password resets.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 font-bold uppercase">
                <tr>
                  <th className="p-4">User Name</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Email / Phone</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Emergency Security Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-4 font-bold text-slate-900 dark:text-slate-100">{u.name}</td>
                    <td className="p-4 font-semibold text-indigo-600 dark:text-indigo-400 uppercase text-[10px]">
                      {u.role}
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-400">{u.email}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                        {u.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="inline-flex items-center gap-2 justify-end">
                        <button
                          onClick={() => forcePasswordReset(u.id)}
                          className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                          <span>Reset Password</span>
                        </button>

                        <button
                          onClick={() => revokeUserSession(u.id)}
                          className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>Revoke Session</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUPPORT ACCESS REASON MODAL */}
      {supportModalBiz && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-purple-500/30 max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="p-2 bg-purple-600 text-white rounded-xl">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 dark:text-slate-100 text-base">
                  Request Audited Support Session
                </h3>
                <p className="text-xs text-slate-500">Target Tenant: {supportModalBiz.name}</p>
              </div>
            </div>

            <form onSubmit={handleConfirmStartSupportSession} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Support Request Reason / Ticket ID <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={supportReason}
                  onChange={(e) => setSupportReason(e.target.value)}
                  placeholder="e.g. Support Ticket #8492 — Customer reported invoice calculation query needing diagnostic inspection"
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Access Duration
                </label>
                <select
                  value={supportDuration}
                  onChange={(e) => setSupportDuration(parseInt(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                >
                  <option value={15}>15 Minutes</option>
                  <option value={30}>30 Minutes (Recommended)</option>
                  <option value={60}>60 Minutes</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Access Mode Permission
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSupportAccessMode('read_only')}
                    className={`p-3 rounded-xl border font-bold text-left transition-all ${
                      supportAccessMode === 'read_only'
                        ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Lock className="w-3.5 h-3.5 text-amber-500" />
                      <span>Read-Only</span>
                    </div>
                    <p className="text-[10px] font-normal text-slate-500">Safest mode. Inspect data without mutating records.</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSupportAccessMode('full_support')}
                    className={`p-3 rounded-xl border font-bold text-left transition-all ${
                      supportAccessMode === 'full_support'
                        ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Unlock className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Full Support</span>
                    </div>
                    <p className="text-[10px] font-normal text-slate-500">Allows record edits to resolve configuration issues.</p>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSupportModalBiz(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md"
                >
                  Start Audited Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLEAN STATE DATA PURGE CONFIRMATION MODAL */}
      {isPurgeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-rose-500/40 max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="p-2.5 bg-rose-600 text-white rounded-2xl shadow-md">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 dark:text-slate-100 text-base">
                  Confirm Clean State Reset
                </h3>
                <p className="text-xs text-rose-600 dark:text-rose-400 font-bold">
                  {purgeTargetMode === 'global'
                    ? 'Global Platform Test Data Wipe'
                    : `Workspace: ${businesses.find((b) => b.id === selectedTenantForPurge)?.name || selectedTenantForPurge}`}
                </p>
              </div>
            </div>

            <form onSubmit={handleExecutePurge} className="space-y-4 text-xs">
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 rounded-2xl border border-rose-200 dark:border-rose-900/60 text-slate-700 dark:text-slate-300 space-y-2">
                <div className="font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Permanent Purge Warning</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  {purgeTargetMode === 'global'
                    ? 'This action will permanently delete all customers, jobs, invoices, quotations, payments, stock logs, and expenses. Super Admin, Business Owners, plans, and roles will remain intact.'
                    : 'This action will wipe transactional records for the chosen tenant only. Other businesses will NOT be affected.'}
                </p>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Type <span className="font-mono text-rose-600 dark:text-rose-400 font-black">RESET</span> to confirm:
                </label>
                <input
                  type="text"
                  required
                  value={purgeConfirmationText}
                  onChange={(e) => setPurgeConfirmationText(e.target.value)}
                  placeholder="RESET"
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono font-bold tracking-widest text-center"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  disabled={isPurgingInProgress}
                  onClick={() => {
                    setIsPurgeModalOpen(false);
                    setPurgeConfirmationText('');
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isPurgingInProgress || purgeConfirmationText.trim().toUpperCase() !== 'RESET'}
                  className={`px-5 py-2 rounded-xl font-extrabold text-white flex items-center gap-2 shadow-md cursor-pointer transition-all ${
                    purgeConfirmationText.trim().toUpperCase() === 'RESET' && !isPurgingInProgress
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed opacity-60'
                  }`}
                >
                  {isPurgingInProgress ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Purging Data...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Confirm & Purge</span>
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

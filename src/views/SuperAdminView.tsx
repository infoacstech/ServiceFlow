import React from 'react';
import { useApp } from '../context/AppContext';
import {
  ShieldCheck,
  Building2,
  Users,
  DollarSign,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Ban,
  RotateCcw,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const SuperAdminView: React.FC = () => {
  const { businesses, users, switchBusiness, updateBusinessAndOwnerStatus } = useApp();

  // Find pending owner/business registrations
  const pendingOwners = users.filter((u) => u.role === 'business_owner' && u.approvalStatus === 'pending');
  const pendingBusinessIds = Array.from(
    new Set([
      ...businesses.filter((b) => b.status === 'pending').map((b) => b.id),
      ...pendingOwners.map((u) => u.businessId),
    ])
  );

  const pendingRegistrations = pendingBusinessIds.map((bId) => {
    const biz = businesses.find((b) => b.id === bId);
    const owner = users.find((u) => u.businessId === bId && u.role === 'business_owner');
    return {
      businessId: bId,
      businessName: biz?.name || owner?.name ? `${owner?.name}'s Business` : 'New Business',
      type: biz?.type || 'General Service',
      ownerName: owner?.name || 'Unknown Owner',
      ownerEmail: owner?.email || biz?.email || 'N/A',
      ownerPhone: owner?.phone || biz?.mobile || 'N/A',
      dateRegistered: owner?.requestedDate || owner?.joiningDate || biz?.createdAt || new Date().toISOString().split('T')[0],
      ownerId: owner?.id,
    };
  });

  const activeCount = businesses.filter((b) => b.status === 'active' || b.status === 'trial').length;
  const suspendedCount = businesses.filter((b) => b.status === 'suspended').length;
  const pendingCount = pendingRegistrations.length;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-1">
          <div className="inline-flex items-center gap-2 bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full border border-purple-500/30 text-xs font-semibold mb-1">
            <ShieldCheck className="w-4 h-4 text-purple-300" />
            <span>SaaS Super Administrator Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Platform Master Control & Owner Approvals
          </h1>
          <p className="text-xs sm:text-sm text-purple-200/80 max-w-xl">
            Review new Business Owner signups, approve tenant activations, and suspend or restore platform access.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
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

      {/* SECTION 1: Pending Business Owner Approvals Panel */}
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
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs transition-all flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => updateBusinessAndOwnerStatus(item.businessId, 'rejected')}
                          className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-xs transition-all flex items-center gap-1.5"
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
      </div>

      {/* SECTION 2: All Registered Business Tenants & Access Revocation Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
              Registered Business Tenants & Access Control
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              View all onboarded companies, inspect tenant contexts, or suspend / restore access.
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
                      <div className="font-bold text-slate-800 dark:text-slate-200">{owner?.name || b.email.split('@')[0]}</div>
                      <div className="text-[10px] text-slate-500">{owner?.email || b.email}</div>
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
                        {/* Suspend / Restore Toggle Button */}
                        {isSuspended ? (
                          <button
                            onClick={() => updateBusinessAndOwnerStatus(b.id, 'active')}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1"
                            title="Restore access for this business owner"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Restore Access</span>
                          </button>
                        ) : isPending ? (
                          <button
                            onClick={() => updateBusinessAndOwnerStatus(b.id, 'active')}
                            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                        ) : isRejected ? (
                          <button
                            onClick={() => updateBusinessAndOwnerStatus(b.id, 'active')}
                            className="px-3 py-1.5 rounded-xl bg-slate-600 hover:bg-slate-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Reactivate</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => updateBusinessAndOwnerStatus(b.id, 'suspended')}
                            className="px-3 py-1.5 rounded-xl border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/60 font-bold text-xs transition-all flex items-center gap-1"
                            title="Block / suspend account access for this business owner"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            <span>Suspend Access</span>
                          </button>
                        )}

                        {/* Inspect Tenant Context Button */}
                        <button
                          onClick={() => switchBusiness(b.id)}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-xs transition-all"
                        >
                          Inspect Tenant
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
    </div>
  );
};

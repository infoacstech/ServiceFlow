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
  ShieldCheck,
  Building2,
  Clock,
  Bell,
  Layers,
  Headphones,
  Users,
  Wallet,
  XCircle,
  Sparkles,
} from 'lucide-react';

interface QuickActionFabProps {
  onOpenNewJob: () => void;
  onNavigate: (tab: string) => void;
  activeTab?: string;
}

export const QuickActionFab: React.FC<QuickActionFabProps> = ({
  onOpenNewJob,
  onNavigate,
  activeTab,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isOnboardTenantModalOpen, setIsOnboardTenantModalOpen] = useState(false);
  const [isCreatingTenant, setIsCreatingTenant] = useState(false);

  const [tenantForm, setTenantForm] = useState({
    businessName: '',
    industryType: 'CCTV & Security',
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    ownerPassword: 'ServiFlow@123',
    initialStatus: 'active' as 'active' | 'pending',
  });

  const {
    currentUser,
    businesses,
    users,
    triggerManualSync,
    getRolePermissions,
    createBusiness,
    showToast,
  } = useApp();

  // If user is logged out or on attendance, jobs, customers, staff, or super admin tab, don't show FAB
  if (
    !currentUser ||
    activeTab === 'attendance' ||
    activeTab === 'jobs' ||
    activeTab === 'customers' ||
    activeTab === 'staff' ||
    activeTab === 'super_admin' ||
    (currentUser.role as string) === 'super_admin'
  )
    return null;

  const isSuperAdmin = (currentUser.role as string) === 'super_admin';
  const isOwner = currentUser.role === 'business_owner';
  const isManager = currentUser.role === 'manager';
  const isTech = currentUser.role === 'technician';

  const permissions = getRolePermissions(currentUser.role);

  // Compute pending approvals for Super Admin
  const pendingOwners = users.filter(
    (u) =>
      u.role === 'business_owner' &&
      (u.approvalStatus === 'pending' || (u.status === 'inactive' && u.approvalStatus !== 'rejected' && u.approvalStatus !== 'blocked'))
  );
  const pendingStaffUsers = users.filter(
    (u) =>
      u.role !== 'business_owner' &&
      u.role !== 'super_admin' &&
      (u.approvalStatus === 'pending' || (u.status === 'inactive' && u.approvalStatus !== 'rejected' && u.approvalStatus !== 'blocked'))
  );
  const pendingBusinesses = businesses.filter((b) => b.status === 'pending');
  const pendingApprovalsCount = pendingBusinesses.length + pendingOwners.length + pendingStaffUsers.length;

  const handleOnboardTenantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantForm.businessName.trim() || !tenantForm.ownerName.trim() || !tenantForm.ownerEmail.trim()) {
      showToast('Please fill in business name, owner name, and owner email', 'error');
      return;
    }

    setIsCreatingTenant(true);
    try {
      const isPending = tenantForm.initialStatus === 'pending';
      const createdBiz = createBusiness(
        {
          name: tenantForm.businessName.trim(),
          type: tenantForm.industryType,
          email: tenantForm.ownerEmail.trim(),
          mobile: tenantForm.ownerPhone.trim() || '+91 98765 00000',
        },
        'General Service',
        isPending,
        {
          name: tenantForm.ownerName.trim(),
          email: tenantForm.ownerEmail.trim(),
          phone: tenantForm.ownerPhone.trim() || '+91 98765 00000',
          password: tenantForm.ownerPassword.trim() || 'ServiFlow@123',
        }
      );

      setIsOnboardTenantModalOpen(false);
      setTenantForm({
        businessName: '',
        industryType: 'CCTV & Security',
        ownerName: '',
        ownerEmail: '',
        ownerPhone: '',
        ownerPassword: 'ServiFlow@123',
        initialStatus: 'active',
      });

      showToast(
        isPending
          ? `Tenant "${createdBiz.name}" registered and pending approval.`
          : `Tenant "${createdBiz.name}" onboarded and active immediately!`,
        'success'
      );
      onNavigate('super_admin_tenants');
    } catch (err) {
      console.error('Failed to onboard tenant:', err);
      showToast('Error creating tenant', 'error');
    } finally {
      setIsCreatingTenant(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-22 sm:bottom-8 right-4 sm:right-6 z-40 flex flex-col items-end">
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
            {/* ========================================================= */}
            {/* 1. SUPER ADMIN / PLATFORM ADMIN ACTIONS ONLY */}
            {/* ========================================================= */}
            {isSuperAdmin && (
              <>
                {/* Super Admin Action 1: Onboard New Tenant */}
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setIsOnboardTenantModalOpen(true);
                  }}
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-lg hover:shadow-purple-500/25 transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Building2 className="w-4 h-4" />
                  <span>+ Onboard New Tenant</span>
                </button>

                {/* Super Admin Action 2: Review Pending Approvals */}
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onNavigate('super_admin_approvals');
                  }}
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 font-bold text-xs shadow-lg border border-slate-200 dark:border-slate-700 transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Clock className="w-4 h-4 text-amber-500" />
                  <div className="flex items-center gap-1.5">
                    <span>Review Approvals</span>
                    {pendingApprovalsCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                        {pendingApprovalsCount}
                      </span>
                    )}
                  </div>
                </button>

                {/* Super Admin Action 3: Platform Broadcast Announcement */}
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onNavigate('super_admin_notifications');
                  }}
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 font-bold text-xs shadow-lg border border-slate-200 dark:border-slate-700 transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Bell className="w-4 h-4 text-indigo-500" />
                  <span>Platform Broadcast</span>
                </button>

                {/* Super Admin Action 4: Manage SaaS Plans & Pricing */}
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onNavigate('super_admin_plans');
                  }}
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 font-bold text-xs shadow-lg border border-slate-200 dark:border-slate-700 transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Layers className="w-4 h-4 text-blue-500" />
                  <span>Manage SaaS Plans</span>
                </button>

                {/* Super Admin Action 5: Audited Support Sessions */}
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onNavigate('super_admin_support');
                  }}
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 font-bold text-xs shadow-lg border border-slate-200 dark:border-slate-700 transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Headphones className="w-4 h-4 text-purple-500" />
                  <span>Audited Support Mode</span>
                </button>

                {/* Super Admin Action 6: Security & Audit Trail */}
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onNavigate('super_admin_audit');
                  }}
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs shadow-lg transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
                  <span>Security & Audit Trail</span>
                </button>
              </>
            )}

            {/* ========================================================= */}
            {/* 2. BUSINESS OWNER / WORKSPACE ADMIN ACTIONS ONLY */}
            {/* ========================================================= */}
            {isOwner && (
              <>
                {/* Action 1: Schedule New Job */}
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

                {/* Action 2: Add Customer */}
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

                {/* Action 3: New Invoice */}
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

                {/* Action 4: New Quotation */}
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

                {/* Action 5: Add Staff Member */}
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onNavigate('staff');
                  }}
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 font-bold text-xs shadow-lg border border-slate-200 dark:border-slate-700 transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>+ Add Staff Member</span>
                </button>

                {/* Action 6: Instant Realtime Cloud Sync */}
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
              </>
            )}

            {/* ========================================================= */}
            {/* 3. MANAGER / FIELD DISPATCHER ACTIONS (PERMISSION-GATED) */}
            {/* ========================================================= */}
            {isManager && (
              <>
                {permissions.canManageJobs && (
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
                )}

                {(permissions.canManageJobs || permissions.canManageStaff) && (
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

                {permissions.canViewFinancials && (
                  <>
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
                  </>
                )}

                {permissions.canManageStaff && (
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      onNavigate('staff');
                    }}
                    className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 font-bold text-xs shadow-lg border border-slate-200 dark:border-slate-700 transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Manage Team</span>
                  </button>
                )}

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
              </>
            )}

            {/* ========================================================= */}
            {/* 4. TECHNICIAN / FIELD STAFF ACTIONS */}
            {/* ========================================================= */}
            {isTech && (
              <>
                {/* Tech Action 1: Assigned Jobs */}
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onNavigate('jobs');
                  }}
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg hover:shadow-indigo-500/25 transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Briefcase className="w-4 h-4" />
                  <span>My Active Jobs</span>
                </button>

                {/* Tech Action 2: Record Field Expense */}
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onNavigate('expenses');
                  }}
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 font-bold text-xs shadow-lg border border-slate-200 dark:border-slate-700 transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Wallet className="w-4 h-4 text-amber-500" />
                  <span>+ Record Field Expense</span>
                </button>

                {/* Tech Action 3: Instant Cloud Sync */}
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
              </>
            )}
          </div>
        )}

        {/* Main Floating Trigger Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isSuperAdmin ? 'Super Admin Quick Actions' : 'Quick Actions'}
          title={isSuperAdmin ? 'Platform Admin Quick Actions' : 'Quick Actions'}
          className={`w-13 h-13 rounded-2xl flex items-center justify-center text-white shadow-xl transition-all transform hover:scale-110 active:scale-90 z-40 cursor-pointer ${
            isOpen
              ? 'bg-slate-800 dark:bg-slate-700 rotate-90 shadow-slate-900/40'
              : isSuperAdmin
              ? 'bg-gradient-to-tr from-purple-700 to-indigo-600 hover:from-purple-800 hover:to-indigo-700 shadow-purple-600/40 ring-4 ring-purple-500/20'
              : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/40 ring-4 ring-indigo-500/20'
          }`}
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : isSuperAdmin ? (
            <div className="relative flex items-center justify-center">
              <Plus className="w-6 h-6" />
              {pendingApprovalsCount > 0 && (
                <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-amber-400 text-slate-950 font-black text-[9px] flex items-center justify-center ring-2 ring-purple-700">
                  {pendingApprovalsCount}
                </span>
              )}
            </div>
          ) : (
            <Plus className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* SUPER ADMIN ONBOARD TENANT MODAL */}
      {isOnboardTenantModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-purple-500/30 max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-tr from-purple-600 to-indigo-600 text-white rounded-2xl shadow-md">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-slate-100 text-base">
                    Onboard New Business Tenant
                  </h3>
                  <p className="text-xs text-slate-500">
                    Platform Super Admin • Provision workspace & owner credentials
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOnboardTenantModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleOnboardTenantSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Company / Business Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={tenantForm.businessName}
                    onChange={(e) => setTenantForm({ ...tenantForm, businessName: e.target.value })}
                    placeholder="e.g. Apex Security Solutions"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium outline-hidden focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Industry Domain
                  </label>
                  <select
                    value={tenantForm.industryType}
                    onChange={(e) => setTenantForm({ ...tenantForm, industryType: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold outline-hidden focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="CCTV & Security">CCTV & Security</option>
                    <option value="HVAC & AC Repair">HVAC & AC Repair</option>
                    <option value="Electrical Services">Electrical Services</option>
                    <option value="Plumbing & Sanitary">Plumbing & Sanitary</option>
                    <option value="Solar Power Systems">Solar Power Systems</option>
                    <option value="Commercial Cleaning">Commercial Cleaning</option>
                    <option value="Home Appliance Repair">Home Appliance Repair</option>
                    <option value="IT & Networking">IT & Networking</option>
                    <option value="Pest Control">Pest Control</option>
                    <option value="General Field Service">General Field Service</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-purple-50/50 dark:bg-purple-950/20 rounded-2xl border border-purple-200/60 dark:border-purple-900/40 space-y-2.5">
                <span className="font-extrabold text-[11px] text-purple-900 dark:text-purple-200 uppercase tracking-wider block">
                  Business Owner Account Details
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      Owner Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={tenantForm.ownerName}
                      onChange={(e) => setTenantForm({ ...tenantForm, ownerName: e.target.value })}
                      placeholder="e.g. Ramesh Sharma"
                      className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      Owner Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={tenantForm.ownerEmail}
                      onChange={(e) => setTenantForm({ ...tenantForm, ownerEmail: e.target.value })}
                      placeholder="ramesh@apexsecurity.com"
                      className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      Mobile Phone Number
                    </label>
                    <input
                      type="tel"
                      value={tenantForm.ownerPhone}
                      onChange={(e) => setTenantForm({ ...tenantForm, ownerPhone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      Initial Password *
                    </label>
                    <input
                      type="text"
                      required
                      value={tenantForm.ownerPassword}
                      onChange={(e) => setTenantForm({ ...tenantForm, ownerPassword: e.target.value })}
                      placeholder="ServiFlow@123"
                      className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                  Initial Provisioning Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTenantForm({ ...tenantForm, initialStatus: 'active' })}
                    className={`p-2.5 rounded-xl border font-bold text-center transition-all cursor-pointer ${
                      tenantForm.initialStatus === 'active'
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Active Immediately
                  </button>
                  <button
                    type="button"
                    onClick={() => setTenantForm({ ...tenantForm, initialStatus: 'pending' })}
                    className={`p-2.5 rounded-xl border font-bold text-center transition-all cursor-pointer ${
                      tenantForm.initialStatus === 'pending'
                        ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Pending Approval
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsOnboardTenantModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingTenant}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isCreatingTenant ? 'Creating Tenant...' : 'Onboard Tenant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};


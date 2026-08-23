import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { SystemSettings, Business } from '../types';
import { FirestoreService } from '../services/FirestoreService';
import {
  ShieldCheck,
  Building2,
  Users,
  CheckCircle2,
  XCircle,
  X,
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
  Plus,
  UserPlus,
  Gift,
  Tag,
  Wallet,
  Banknote,
  Copy,
  Search,
  ArrowUpRight,
  CheckCheck,
  CreditCard,
  TrendingUp,
  Coins,
  Award,
  ExternalLink,
  QrCode,
  Activity,
  BarChart3,
  Bell,
  Send,
  Globe,
  PackageCheck,
  SlidersHorizontal,
  Radio,
  Zap,
  Filter,
} from 'lucide-react';
import { ReferralRecord, ReferralPayoutRequest } from '../types';
import { ReferralAnalytics } from '../components/ReferralAnalytics';

export interface SuperAdminViewProps {
  activeSubSection?: string;
  onNavigate?: (tab: string) => void;
}

export const SuperAdminView: React.FC<SuperAdminViewProps> = ({
  activeSubSection = 'super_admin_dashboard',
  onNavigate,
}) => {
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
    createBusiness,
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
    wipeAllExceptSuperAdmin,
    cleanupOrphanUsers,
    deleteBusinessTenant,
    deleteUserAccount,
    showToast,
    referralRecords,
    referralPayoutRequests,
    processReferralPayout,
  } = useApp();

  const [isCleaningOrphans, setIsCleaningOrphans] = useState(false);

  // Exact registered tenant users who belong to active, existing businesses
  const registeredTenantUsers = useMemo(() => {
    if (!businesses || businesses.length === 0) return [];
    const validBizIds = new Set(businesses.map((b) => b.id));
    return users.filter((u) => {
      const uEmail = (u.email || '').trim().toLowerCase();
      const isSuper =
        u.role === 'super_admin' ||
        uEmail === 'admin@serviflow.io' ||
        uEmail === 'superadmin@serviflow.io' ||
        u.id === 'usr-admin';
      if (isSuper) return false;
      return Boolean(u.businessId && validBizIds.has(u.businessId));
    });
  }, [users, businesses]);

  const [activeTabSection, setActiveTabSection] = useState<
    | 'overview'
    | 'approvals'
    | 'tenants'
    | 'analytics'
    | 'referrals'
    | 'cleanup'
    | 'support'
    | 'notifications'
    | 'settings'
    | 'plans'
    | 'audit'
    | 'sessions'
  >('overview');

  // Tenant Filters & Search State
  const [tenantStatusFilter, setTenantStatusFilter] = useState<'all' | 'active' | 'pending' | 'suspended' | 'trial'>('all');
  const [tenantSearchQuery, setTenantSearchQuery] = useState('');
  const [tenantPlanFilter, setTenantPlanFilter] = useState<string>('all');
  const [selectedTenantDetails, setSelectedTenantDetails] = useState<Business | null>(null);

  // Sync sub-section routing when activeSubSection prop changes
  useEffect(() => {
    if (!activeSubSection) return;
    switch (activeSubSection) {
      case 'super_admin':
      case 'super_admin_dashboard':
        setActiveTabSection('overview');
        break;
      case 'super_admin_tenants':
        setActiveTabSection('tenants');
        setTenantStatusFilter('all');
        break;
      case 'super_admin_pending':
      case 'super_admin_approvals':
        setActiveTabSection('approvals');
        break;
      case 'super_admin_suspended':
        setActiveTabSection('tenants');
        setTenantStatusFilter('suspended');
        break;
      case 'super_admin_analytics':
        setActiveTabSection('analytics');
        break;
      case 'super_admin_referrals':
        setActiveTabSection('referrals');
        break;
      case 'super_admin_support':
        setActiveTabSection('support');
        break;
      case 'super_admin_notifications':
        setActiveTabSection('notifications');
        break;
      case 'super_admin_audit':
        setActiveTabSection('audit');
        break;
      case 'super_admin_security':
      case 'super_admin_access_history':
        setActiveTabSection('sessions');
        break;
      case 'super_admin_settings':
        setActiveTabSection('settings');
        break;
      case 'super_admin_plans':
        setActiveTabSection('plans');
        break;
      case 'super_admin_data_maintenance':
        setActiveTabSection('cleanup');
        break;
      default:
        break;
    }
  }, [activeSubSection]);

  // Payout Process Modal State
  const [selectedPayoutForAction, setSelectedPayoutForAction] = useState<ReferralPayoutRequest | null>(null);
  const [payoutActionType, setPayoutActionType] = useState<'completed' | 'approved' | 'rejected'>('completed');
  const [payoutTxnRef, setPayoutTxnRef] = useState('');
  const [payoutAdminNote, setPayoutAdminNote] = useState('');
  const [isProcessingPayoutAction, setIsProcessingPayoutAction] = useState(false);
  const [auditLogsLimit, setAuditLogsLimit] = useState<number | 'all'>(10);

  // Referral System Sub-tab & Filters
  const [referralSubTab, setReferralSubTab] = useState<'conversions' | 'payouts' | 'leaderboard'>('conversions');
  const [referralSearchTerm, setReferralSearchTerm] = useState('');
  const [payoutStatusFilter, setPayoutStatusFilter] = useState<'all' | 'pending' | 'approved' | 'completed' | 'rejected'>('all');

  // Add / Onboard Tenant Modal State
  const [isAddTenantModalOpen, setIsAddTenantModalOpen] = useState(false);
  const [isCreatingTenant, setIsCreatingTenant] = useState(false);
  const [newTenantForm, setNewTenantForm] = useState({
    businessName: '',
    industryType: 'CCTV & Security',
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    ownerPassword: '1234',
    initialStatus: 'active' as 'active' | 'pending',
  });

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

  // Business & Owner Deletion State
  const [tenantToDelete, setTenantToDelete] = useState<{ id: string; name: string } | null>(null);
  const [deleteTenantConfirmText, setDeleteTenantConfirmText] = useState('');
  const [isDeletingTenant, setIsDeletingTenant] = useState(false);

  const [isDeleteAllTenantsModalOpen, setIsDeleteAllTenantsModalOpen] = useState(false);
  const [deleteAllConfirmText, setDeleteAllConfirmText] = useState('');
  const [isDeletingAllTenants, setIsDeletingAllTenants] = useState(false);

  // Quick Simulation of Test Registration Request
  const handleSimulateTestRegistration = () => {
    const timestamp = Date.now().toString().slice(-4);
    const testBiz = createBusiness(
      {
        name: `Apex Smart Security ${timestamp}`,
        type: 'CCTV & Security',
        email: `contact${timestamp}@apexsmart.com`,
        mobile: `987654${timestamp}`,
      },
      'CCTV Installation',
      true,
      {
        name: `Ramesh Sharma ${timestamp}`,
        email: `ramesh${timestamp}@apexsmart.com`,
        phone: `987654${timestamp}`,
        password: '1234',
      }
    );
    showToast(`Test registration for "${testBiz.name}" created and pending approval!`, 'success');
  };

  // Execute Payout Decision (Mark as Paid, Approve, or Reject & Refund)
  const handleExecutePayoutAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayoutForAction) return;

    setIsProcessingPayoutAction(true);
    try {
      const noteDetails = payoutTxnRef.trim()
        ? `Txn Ref / UTR: ${payoutTxnRef.trim()}${payoutAdminNote.trim() ? ` | Note: ${payoutAdminNote.trim()}` : ''}`
        : payoutAdminNote.trim() || undefined;

      processReferralPayout(selectedPayoutForAction.id, payoutActionType, noteDetails);
      setSelectedPayoutForAction(null);
      setPayoutTxnRef('');
      setPayoutAdminNote('');
    } catch (err) {
      console.error('Failed to process referral payout action:', err);
    } finally {
      setIsProcessingPayoutAction(false);
    }
  };

  // Quick Simulation of a Referral Signup for Testing
  const handleSimulateTestReferral = async () => {
    if (businesses.length === 0) {
      showToast('Please onboard at least 1 business tenant first.', 'error');
      return;
    }

    const referrerBiz = businesses[0];
    const cleanRefCode = referrerBiz.referralCode || `SF-${referrerBiz.name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase()}10`;
    const timestamp = Date.now().toString().slice(-4);
    const planPrice = 1299;
    const discountAmount = 130;
    const bonusEarned = 130;

    const testRecord: ReferralRecord = {
      id: `ref-tx-${Date.now()}`,
      referrerBusinessId: referrerBiz.id,
      referrerCode: cleanRefCode,
      referrerBusinessName: referrerBiz.name,
      referredBusinessId: `biz-ref-${timestamp}`,
      referredBusinessName: `Smart Solar Power ${timestamp}`,
      referredOwnerName: `Ajay Deshmukh ${timestamp}`,
      referredOwnerPhone: `+91 98450${timestamp}`,
      planId: 'plan-pro',
      planName: 'Professional Plan (10% Referral Discount)',
      planPrice,
      discountPercent: 10,
      discountAmount,
      bonusPercent: 10,
      bonusEarned,
      status: 'credited',
      createdAt: new Date().toISOString(),
      notes: `10% discount (-₹${discountAmount}) applied. 10% referral bonus (+₹${bonusEarned}) credited to ${referrerBiz.name}.`,
    };

    await FirestoreService.saveDocument('referrals', testRecord.id, testRecord);

    // Update referrer balance & earnings in Firestore
    const updatedEarnings = (referrerBiz.referralEarnings || 0) + bonusEarned;
    const updatedBalance = (referrerBiz.referralBalance || 0) + bonusEarned;
    await FirestoreService.saveDocument<Business>('businesses', referrerBiz.id, {
      referralCode: cleanRefCode,
      referralEarnings: updatedEarnings,
      referralBalance: updatedBalance,
    });

    showToast(`Test Referral Simulated: "${referrerBiz.name}" referred "Smart Solar Power ${timestamp}" and earned +₹${bonusEarned} bonus!`, 'success');
  };

  // Quick Simulation of a Payout Request for Testing
  const handleSimulatePayoutRequest = async () => {
    if (businesses.length === 0) {
      showToast('Please onboard at least 1 business tenant first.', 'error');
      return;
    }
    const biz = businesses[0];
    const testReq: ReferralPayoutRequest = {
      id: `payout-${Date.now()}`,
      businessId: biz.id,
      businessName: biz.name,
      ownerName: 'Ramesh Sharma',
      ownerPhone: '+91 9876543210',
      amount: 260,
      payoutMethod: 'upi',
      upiId: 'ramesh.sharma@okaxis',
      status: 'pending',
      requestedAt: new Date().toISOString(),
      notes: 'Sample bonus payout request via UPI for testing',
    };
    await FirestoreService.saveDocument('referralPayouts', testReq.id, testReq);
    showToast(`Sample payout request of ₹260 submitted for ${biz.name}!`, 'success');
  };

  const handleOnboardTenantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenantForm.businessName.trim()) {
      showToast('Please enter business name', 'error');
      return;
    }
    if (!newTenantForm.ownerName.trim()) {
      showToast('Please enter owner name', 'error');
      return;
    }
    if (!newTenantForm.ownerEmail.trim()) {
      showToast('Please enter owner email', 'error');
      return;
    }

    setIsCreatingTenant(true);
    try {
      const isPending = newTenantForm.initialStatus === 'pending';
      const createdBiz = createBusiness(
        {
          name: newTenantForm.businessName.trim(),
          type: newTenantForm.industryType,
          email: newTenantForm.ownerEmail.trim(),
          mobile: newTenantForm.ownerPhone.trim() || '9876543210',
        },
        'General Service',
        isPending,
        {
          name: newTenantForm.ownerName.trim(),
          email: newTenantForm.ownerEmail.trim(),
          phone: newTenantForm.ownerPhone.trim() || '9876543210',
          password: newTenantForm.ownerPassword.trim() || '1234',
        }
      );

      setIsAddTenantModalOpen(false);
      setNewTenantForm({
        businessName: '',
        industryType: 'CCTV & Security',
        ownerName: '',
        ownerEmail: '',
        ownerPhone: '',
        ownerPassword: '1234',
        initialStatus: 'active',
      });

      showToast(
        isPending
          ? `Tenant "${createdBiz.name}" submitted as Pending Approval.`
          : `Tenant "${createdBiz.name}" onboarded and active immediately!`,
        'success'
      );
    } catch (err) {
      console.error('Failed to onboard tenant:', err);
      showToast('Error creating tenant', 'error');
    } finally {
      setIsCreatingTenant(false);
    }
  };

  // Find pending owner/business registrations & pending staff
  const pendingOwners = users.filter(
    (u) =>
      u.role === 'business_owner' &&
      (u.approvalStatus === 'pending' ||
        (u.status === 'inactive' && u.approvalStatus !== 'rejected' && u.approvalStatus !== 'blocked'))
  );
  const pendingStaffUsers = users.filter(
    (u) =>
      u.role !== 'business_owner' &&
      u.role !== 'super_admin' &&
      (u.approvalStatus === 'pending' ||
        (u.status === 'inactive' && u.approvalStatus !== 'rejected' && u.approvalStatus !== 'blocked'))
  );
  const pendingBusinessIds = Array.from(
    new Set([
      ...businesses.filter((b) => b.status === 'pending').map((b) => b.id).filter(Boolean),
      ...pendingOwners.map((u) => u.businessId).filter(Boolean),
    ])
  ) as string[];

  const pendingRegistrations = pendingBusinessIds.map((bId) => {
    const biz = businesses.find((b) => b.id === bId);
    const owner =
      users.find((u) => u.businessId === bId && u.role === 'business_owner' && u.approvalStatus === 'pending') ||
      users.find((u) => u.businessId === bId && u.role === 'business_owner') ||
      users.find((u) => u.businessId === bId);
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
        result = await wipeAllExceptSuperAdmin();
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

  const handleDeleteSingleTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantToDelete) return;
    if (deleteTenantConfirmText.trim().toUpperCase() !== 'DELETE') {
      showToast('Safety Check Failed: Please type "DELETE" to confirm business removal.', 'error');
      return;
    }

    setIsDeletingTenant(true);
    try {
      await deleteBusinessTenant(tenantToDelete.id);
      setTenantToDelete(null);
      setDeleteTenantConfirmText('');
    } catch (err) {
      console.error('Failed to delete tenant:', err);
    } finally {
      setIsDeletingTenant(false);
    }
  };

  const handleDeleteAllTenants = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteAllConfirmText.trim().toUpperCase() !== 'DELETE ALL') {
      showToast('Safety Check Failed: Please type "DELETE ALL" to confirm wipe.', 'error');
      return;
    }

    setIsDeletingAllTenants(true);
    try {
      const res = await FirestoreService.wipeAllExceptSuperAdmin();
      setIsDeleteAllTenantsModalOpen(false);
      setDeleteAllConfirmText('');
      showToast(`100% Clean Slate: Purged ${res.totalDocsDeleted} documents. Only Super Admin preserved.`, 'success');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      console.error('Failed to wipe all tenants:', err);
      showToast('Purge error: ' + String(err), 'error');
    } finally {
      setIsDeletingAllTenants(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* 3. HERO SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-1.5">
          <div className="inline-flex items-center gap-2 bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full border border-purple-500/30 text-xs font-semibold mb-0.5">
            <ShieldCheck className="w-4 h-4 text-purple-300" />
            <span>SaaS Super Administrator Master Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Platform Administration
          </h1>
          <p className="text-xs sm:text-sm text-purple-200/80 max-w-2xl">
            Manage tenants, platform operations, security, subscriptions and global settings.
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
              className="mt-1 px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-[11px] transition-all cursor-pointer shadow-xs"
            >
              End Support Access
            </button>
          </div>
        )}
      </div>

      {/* 2. DASHBOARD TABS - High-Value Platform Views */}
      <div className="flex items-center gap-1.5 overflow-x-auto p-1.5 bg-slate-200/60 dark:bg-slate-900/80 rounded-2xl border border-slate-300/60 dark:border-slate-800 text-xs font-bold scrollbar-none">
        <button
          onClick={() => setActiveTabSection('overview')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTabSection === 'overview'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-300/50 dark:hover:bg-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Platform Overview</span>
        </button>

        <button
          onClick={() => setActiveTabSection('approvals')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTabSection === 'approvals'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-300/50 dark:hover:bg-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Pending Approvals</span>
          {pendingCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-200 dark:bg-amber-950 text-amber-950 dark:text-amber-200 animate-pulse">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            setActiveTabSection('tenants');
            setTenantStatusFilter('all');
          }}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTabSection === 'tenants'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-300/50 dark:hover:bg-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Tenant Directory</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-300/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {businesses.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTabSection('analytics')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTabSection === 'analytics'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-300/50 dark:hover:bg-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Platform Analytics</span>
        </button>

        <button
          onClick={() => setActiveTabSection('referrals')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTabSection === 'referrals'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-300/50 dark:hover:bg-slate-800'
          }`}
        >
          <Gift className="w-4 h-4" />
          <span>Referral Analytics</span>
          {referralPayoutRequests.filter((p) => p.status === 'pending').length > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full font-black bg-rose-500 text-white animate-pulse">
              {referralPayoutRequests.filter((p) => p.status === 'pending').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTabSection('audit')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTabSection === 'audit'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-300/50 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Security / Audit</span>
        </button>

        {/* Secondary section active indicator when navigated via sidebar */}
        {!['overview', 'approvals', 'tenants', 'analytics', 'referrals', 'audit'].includes(activeTabSection) && (
          <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-600/15 border border-purple-500/30 text-purple-700 dark:text-purple-300 font-bold text-xs">
            <span className="capitalize">
              {activeTabSection === 'support' && 'Audited Support View'}
              {activeTabSection === 'notifications' && 'System Notifications View'}
              {activeTabSection === 'plans' && 'Plans & Pricing View'}
              {activeTabSection === 'settings' && 'Global Settings View'}
              {activeTabSection === 'sessions' && 'Security & Access View'}
              {activeTabSection === 'cleanup' && 'Data & Maintenance View'}
            </span>
            <button
              onClick={() => setActiveTabSection('overview')}
              className="p-0.5 rounded-md hover:bg-purple-500/20 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
              title="Return to Overview"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* SECTION 0: Master Platform Overview */}
      {activeTabSection === 'overview' && (
        <div className="space-y-6 animate-in fade-in">
          {/* 4. KPI CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Tenants</span>
                  <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                    <Building2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{businesses.length}</div>
              </div>
              <div className="text-[11px] text-slate-400 font-medium mt-2">Isolated Data Workspaces</div>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Approvals</span>
                  <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{pendingCount}</div>
              </div>
              <div className="text-[11px] text-amber-700 dark:text-amber-300 font-medium mt-2">
                {pendingCount > 0 ? 'Requires Super Admin Action' : 'All Clear — No Pending Approvals'}
              </div>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Businesses</span>
                  <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{activeCount}</div>
              </div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-2">Active ERP Workspaces</div>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Suspended Businesses</span>
                  <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                    <Ban className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-rose-600 dark:text-rose-400">{suspendedCount}</div>
              </div>
              <div className="text-[11px] text-rose-600 dark:text-rose-400 font-medium mt-2">Access Restricted / Blocked</div>
            </div>
          </div>

          {/* 5. QUICK ADMINISTRATION ACTIONS */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                  Quick Administration Actions
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Frequently executed Super Admin operations and tenant onboarding
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {/* Primary Action */}
                <button
                  type="button"
                  onClick={() => {
                    setNewTenantForm({
                      businessName: '',
                      industryType: 'CCTV & Security',
                      ownerName: '',
                      ownerEmail: '',
                      ownerPhone: '',
                      ownerPassword: '1234',
                      initialStatus: 'active',
                    });
                    setIsAddTenantModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Onboard New Tenant</span>
                </button>

                {/* Secondary Action 1 */}
                <button
                  type="button"
                  onClick={handleSimulateTestRegistration}
                  className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 dark:text-amber-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all border border-amber-200/80 dark:border-amber-800"
                  title="Simulate a new incoming business owner signup request"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Simulate Signup Request</span>
                </button>

                {/* Secondary Action 2 */}
                <button
                  type="button"
                  onClick={() => setActiveTabSection('notifications')}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all border border-slate-200/70 dark:border-slate-700"
                >
                  <Bell className="w-3.5 h-3.5 text-slate-500" />
                  <span>Broadcast Notice</span>
                </button>

                {/* Visually Separated Danger / Demo Function */}
                <div className="pl-1 sm:pl-2 border-l border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setActiveTabSection('cleanup')}
                    className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 dark:text-rose-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all border border-rose-200/80 dark:border-rose-900/50"
                    title="Development/Demo only: Wipe database records except Super Admin"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Reset Demo Data</span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-rose-200/70 dark:bg-rose-900 text-rose-900 dark:text-rose-200 font-extrabold uppercase">
                      Dev
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Pending Registrations Preview if any */}
          {pendingCount > 0 && (
            <div className="bg-amber-50/80 dark:bg-amber-950/30 rounded-3xl border border-amber-200/80 dark:border-amber-900/60 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-500 text-white rounded-xl shadow-xs">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-amber-950 dark:text-amber-100">
                      Pending Approvals Action Queue ({pendingCount})
                    </h4>
                    <p className="text-[11px] text-amber-800 dark:text-amber-300">
                      New businesses awaiting your Super Admin verification
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTabSection('approvals')}
                  className="text-xs font-bold text-amber-900 dark:text-amber-200 underline hover:no-underline"
                >
                  View All Pending ({pendingCount}) →
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {pendingRegistrations.slice(0, 4).map((item, idx) => (
                  <div
                    key={item.businessId || `pending-summary-${idx}`}
                    className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-extrabold text-slate-900 dark:text-slate-100">{item.businessName}</div>
                      <div className="text-[11px] text-slate-500">
                        {item.ownerName} • {item.type}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{item.ownerEmail}</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateBusinessAndOwnerStatus(item.businessId, 'active')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] flex items-center gap-1 cursor-pointer shadow-xs"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        Approve
                      </button>
                      <button
                        onClick={() => updateBusinessAndOwnerStatus(item.businessId, 'rejected')}
                        className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-[11px] flex items-center gap-1 cursor-pointer shadow-xs"
                      >
                        <XCircle className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. ACTIVE TENANT WORKSPACES */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                  Active Tenant Workspaces
                </h3>
                <p className="text-xs text-slate-500">
                  Recently active businesses running on the ServiFlow platform
                </p>
              </div>
              <button
                onClick={() => {
                  setActiveTabSection('tenants');
                  setTenantStatusFilter('all');
                }}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                View Full Directory ({businesses.length}) →
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {businesses.slice(0, 6).map((b, idx) => {
                const owner = users.find((u) => u.businessId === b.id && u.role === 'business_owner');
                const staffCount = users.filter((u) => u.businessId === b.id).length;
                const tenantJobs = jobs.filter((j) => j.businessId === b.id);
                const tenantInvoices = invoices.filter((i) => i.businessId === b.id);

                return (
                  <div
                    key={b.id || `quick-biz-${idx}`}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex flex-col justify-between space-y-3 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100 truncate">
                          {b.name}
                        </span>
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase shrink-0 ${
                            b.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : b.status === 'suspended'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {b.status}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                        <span>{b.type}</span>
                        <span className="px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[10px] font-bold capitalize">
                          {b.plan || 'Professional'}
                        </span>
                      </div>

                      <div className="text-[10px] text-slate-400 font-mono mt-1 truncate">
                        Owner: {owner?.name || b.email?.split('@')[0] || 'N/A'}
                      </div>

                      {/* Operational metrics tags */}
                      <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/40 text-[10px] text-slate-500 font-semibold">
                        <span className="px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {staffCount} Staff
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                          {tenantJobs.length} Jobs
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                          {tenantInvoices.length} Invoices
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700/60">
                      <button
                        onClick={() => setSelectedTenantDetails(b)}
                        className="text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Inspect
                      </button>
                      <button
                        onClick={() => handleOpenSupportModal(b.id, b.name)}
                        className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] flex items-center gap-1 cursor-pointer shadow-xs"
                      >
                        <Headphones className="w-3 h-3" />
                        Support Access
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Security Logs Feed */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                  Live Security & Governance Activity Stream
                </h3>
              </div>
              <button
                onClick={() => setActiveTabSection('audit')}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Full Audit Trail ({securityAuditLogs.length}) →
              </button>
            </div>

            {securityAuditLogs.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No security audit events recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {securityAuditLogs.slice(0, 5).map((log, idx) => (
                  <div key={log.id || `stream-log-${idx}`} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-[10px] text-slate-400">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <span className="font-bold text-purple-700 dark:text-purple-300">{log.action}</span>
                      <span className="text-slate-600 dark:text-slate-400 text-[11px] truncate max-w-md">
                        {log.details}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">{log.actorName}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 1: Pending Owner Approvals */}
      {activeTabSection === 'approvals' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-amber-200/80 dark:border-amber-900/60 shadow-md overflow-hidden">
          <div className="p-5 bg-amber-50/80 dark:bg-amber-950/30 border-b border-amber-200/60 dark:border-amber-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSimulateTestRegistration}
                className="px-3 py-1.5 rounded-xl bg-amber-200/80 hover:bg-amber-300 text-amber-950 dark:bg-amber-900/80 dark:hover:bg-amber-800 dark:text-amber-100 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                title="Create a sample pending registration request to test approval flow"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-700 dark:text-amber-300" />
                <span>Simulate Test Request</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setNewTenantForm({
                    businessName: '',
                    industryType: 'CCTV & Security',
                    ownerName: '',
                    ownerEmail: '',
                    ownerPhone: '',
                    ownerPassword: '1234',
                    initialStatus: 'pending',
                  });
                  setIsAddTenantModalOpen(true);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Onboard / Add Tenant</span>
              </button>

              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100">
                {pendingCount} Pending
              </span>
            </div>
          </div>

          {pendingRegistrations.length === 0 ? (
            <div className="p-10 text-center text-slate-500 dark:text-slate-400 space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">No Pending Business Approvals</p>
                <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
                  All business signup requests have been reviewed. When a new business registers from the login page, their request will appear here for 1-click approval.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setNewTenantForm({
                      businessName: '',
                      industryType: 'CCTV & Security',
                      ownerName: '',
                      ownerEmail: '',
                      ownerPhone: '',
                      ownerPassword: '',
                      initialStatus: 'active',
                    });
                    setIsAddTenantModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Onboard New Tenant Directly</span>
                </button>
              </div>
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
                  {pendingRegistrations.map((item, idx) => (
                    <tr key={item.businessId || item.ownerId || `pending-reg-${idx}`} className="hover:bg-amber-50/40 dark:hover:bg-slate-800/60 transition-colors">
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
                          <button
                            onClick={() => {
                              setTenantToDelete({ id: item.businessId, name: item.businessName });
                              setDeleteTenantConfirmText('');
                            }}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-950/60 dark:hover:text-rose-400 font-bold transition-all cursor-pointer"
                            title="Delete this registration and remove owner"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
                    {pendingStaffUsers.map((usr, idx) => {
                      const biz = businesses.find((b) => b.id === usr.businessId);
                      return (
                        <tr key={usr.id || `pending-staff-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
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
                              <button
                                onClick={() => deleteUserAccount(usr.id)}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-950/60 dark:hover:text-rose-400 font-bold transition-all cursor-pointer"
                                title="Delete user"
                              >
                                <Trash2 className="w-3 h-3" />
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

      {/* SECTION 2: All Business Tenants with Enhanced Search & Filters */}
      {activeTabSection === 'tenants' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Tenant Search & Filter Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                  Registered Business Tenants Directory
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Manage multi-tenant isolated workspaces, inspect configurations, and control platform access.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setNewTenantForm({
                      businessName: '',
                      industryType: 'CCTV & Security',
                      ownerName: '',
                      ownerEmail: '',
                      ownerPhone: '',
                      ownerPassword: '1234',
                      initialStatus: 'active',
                    });
                    setIsAddTenantModalOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Onboard New Tenant</span>
                </button>
              </div>
            </div>

            {/* Filters Row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={tenantSearchQuery}
                  onChange={(e) => setTenantSearchQuery(e.target.value)}
                  placeholder="Search by business name, ID, owner email, phone, or industry..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Status Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold scrollbar-none">
                <button
                  onClick={() => setTenantStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    tenantStatusFilter === 'all'
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  All ({businesses.length})
                </button>
                <button
                  onClick={() => setTenantStatusFilter('active')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    tenantStatusFilter === 'active'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Active ({activeCount})
                </button>
                <button
                  onClick={() => setTenantStatusFilter('pending')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    tenantStatusFilter === 'pending'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Pending ({pendingCount})
                </button>
                <button
                  onClick={() => setTenantStatusFilter('suspended')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    tenantStatusFilter === 'suspended'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Suspended ({suspendedCount})
                </button>
              </div>
            </div>
          </div>

          {/* Tenants Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 font-bold uppercase">
                  <tr>
                    <th className="p-4">Business Profile</th>
                    <th className="p-4">Industry / Category</th>
                    <th className="p-4">Owner & Contact</th>
                    <th className="p-4">Staff & Plan</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(() => {
                    const filtered = businesses.filter((b) => {
                      const owner = users.find((u) => u.businessId === b.id && u.role === 'business_owner');
                      // Status filter
                      if (tenantStatusFilter === 'active' && b.status !== 'active' && b.status !== 'trial') return false;
                      if (tenantStatusFilter === 'pending' && b.status !== 'pending' && owner?.approvalStatus !== 'pending') return false;
                      if (tenantStatusFilter === 'suspended' && b.status !== 'suspended' && owner?.approvalStatus !== 'suspended') return false;
                      if (tenantStatusFilter === 'trial' && b.status !== 'trial') return false;

                      // Search query
                      if (tenantSearchQuery.trim()) {
                        const q = tenantSearchQuery.toLowerCase();
                        const matchName = b.name.toLowerCase().includes(q);
                        const matchId = b.id.toLowerCase().includes(q);
                        const matchType = b.type?.toLowerCase().includes(q);
                        const matchOwner = owner?.name?.toLowerCase().includes(q);
                        const matchEmail = owner?.email?.toLowerCase().includes(q) || b.email?.toLowerCase().includes(q);
                        const matchPhone = owner?.phone?.includes(q) || b.mobile?.includes(q);
                        if (!matchName && !matchId && !matchType && !matchOwner && !matchEmail && !matchPhone) {
                          return false;
                        }
                      }
                      return true;
                    });

                    if (filtered.length === 0) {
                      return (
                        <tr>
                          <td colSpan={6} className="p-8 text-center">
                            <div className="flex flex-col items-center justify-center space-y-2 text-slate-400">
                              <Building2 className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                              <span className="font-bold text-sm text-slate-600 dark:text-slate-400">No matching business tenants found</span>
                              <p className="text-xs text-slate-400 max-w-sm">
                                {tenantSearchQuery ? `No results matching "${tenantSearchQuery}". Try adjusting your search or filters.` : `No tenants found in this category.`}
                              </p>
                              {(tenantSearchQuery || tenantStatusFilter !== 'all') && (
                                <button
                                  onClick={() => {
                                    setTenantSearchQuery('');
                                    setTenantStatusFilter('all');
                                  }}
                                  className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                                >
                                  Reset Filters
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    return filtered.map((b, idx) => {
                      const owner = users.find((u) => u.businessId === b.id && u.role === 'business_owner');
                      const staffCount = users.filter((u) => u.businessId === b.id).length;
                      const isPending = b.status === 'pending' || owner?.approvalStatus === 'pending';
                      const isSuspended = b.status === 'suspended' || owner?.approvalStatus === 'suspended';
                      const isRejected = b.status === 'rejected' || owner?.approvalStatus === 'rejected';

                      return (
                        <tr key={b.id || `biz-row-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="p-4 font-extrabold text-slate-900 dark:text-slate-100">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-black text-xs shrink-0">
                                {b.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-bold">{b.name}</div>
                                <div className="text-[10px] text-slate-400 font-mono">ID: {b.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-900/50">
                              {b.type}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-slate-800 dark:text-slate-200">
                              {owner?.name || (b.email ? b.email.split('@')[0] : 'Business Owner')}
                            </div>
                            <div className="text-[10px] text-slate-500">{owner?.email || b.email || 'N/A'}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{b.mobile || owner?.phone}</div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                {staffCount} Staff
                              </span>
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 capitalize">
                                {b.plan || 'Professional'}
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            {isPending ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 uppercase tracking-wider">
                                PENDING
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
                            <div className="inline-flex items-center gap-1.5 justify-end">
                              {/* Inspect Details Button */}
                              <button
                                onClick={() => setSelectedTenantDetails(b)}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
                                title="Inspect Tenant Details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* Time-Limited Audited Support Request Button */}
                              <button
                                onClick={() => handleOpenSupportModal(b.id, b.name)}
                                className="px-2.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                                title="Request temporary audited support access to customer data"
                              >
                                <Headphones className="w-3.5 h-3.5" />
                                <span>Support</span>
                              </button>

                              {/* Suspend / Restore Toggle Button */}
                              {isSuspended ? (
                                <button
                                  onClick={() => updateBusinessAndOwnerStatus(b.id, 'active')}
                                  className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  <span>Restore</span>
                                </button>
                              ) : isPending ? (
                                <button
                                  onClick={() => updateBusinessAndOwnerStatus(b.id, 'active')}
                                  className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Approve</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => updateBusinessAndOwnerStatus(b.id, 'suspended')}
                                  className="px-2.5 py-1.5 rounded-xl border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/60 font-bold text-[11px] transition-all flex items-center gap-1 cursor-pointer"
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                  <span>Suspend</span>
                                </button>
                              )}

                              {/* Delete Business Tenant & Owner Button */}
                              <button
                                onClick={() => {
                                  setTenantToDelete({ id: b.id, name: b.name });
                                  setDeleteTenantConfirmText('');
                                }}
                                className="p-1.5 rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-950/60 dark:hover:text-rose-400 font-bold transition-all cursor-pointer"
                                title="Delete this business tenant, owner account, and all records"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2.5: Platform Analytics */}
      {activeTabSection === 'analytics' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
              <div className="p-2.5 bg-blue-600 text-white rounded-2xl">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
                  Platform Growth & Tenant Distribution Analytics
                </h2>
                <p className="text-xs text-slate-500">
                  Real-time operational volume, industry vertical distribution, and platform adoption metrics
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                <div className="text-xs font-bold text-slate-500">Total Registered Tenants</div>
                <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{businesses.length}</div>
                <div className="text-[10px] text-emerald-600 font-bold mt-1">100% Isolated Partitions</div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                <div className="text-xs font-bold text-slate-500">Tenant Users & Staff</div>
                <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                  {users.filter((u) => u.role !== 'super_admin' && u.email !== 'admin@serviflow.io').length}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">Owners, Techs & Staff</div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                <div className="text-xs font-bold text-slate-500">Total Jobs Dispatched</div>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{jobs.length}</div>
                <div className="text-[10px] text-slate-400 mt-1">Across all active businesses</div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                <div className="text-xs font-bold text-slate-500">Invoices Generated</div>
                <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">{invoices.length}</div>
                <div className="text-[10px] text-slate-400 mt-1">Billing records logged</div>
              </div>
            </div>

            {/* Industry Breakdown */}
            <div className="space-y-4">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                Industry Vertical Distribution
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {['CCTV & Security', 'Solar & Renewable', 'HVAC & AC Service', 'Electrical Contracting', 'Plumbing & Water', 'IT & Computer Networking'].map((ind) => {
                  const count = businesses.filter((b) => b.type === ind).length;
                  const pct = businesses.length > 0 ? Math.round((count / businesses.length) * 100) : 0;
                  return (
                    <div key={ind} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                        <span>{ind}</span>
                        <span className="text-indigo-600 dark:text-indigo-400">{count} ({pct}%)</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full mt-2 overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(pct, 5)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION: Global Broadcast Notifications */}
      {activeTabSection === 'notifications' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="p-2.5 bg-violet-600 text-white rounded-2xl">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
                  Global Platform Announcements & Broadcast Alerts
                </h2>
                <p className="text-xs text-slate-500">
                  Broadcast real-time announcement banners, system update notices, or maintenance alerts to all tenant users.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Active Global System Notice Banner:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={systemSettings.globalNoticeBanner || ''}
                    onChange={(e) => updateSystemSettings({ globalNoticeBanner: e.target.value })}
                    placeholder="e.g. Scheduled maintenance on Sunday 2:00 AM IST. ServiFlow remains operational."
                    className="flex-1 p-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      showToast('Broadcast notice published successfully across all tenant portals.', 'success');
                    }}
                    className="px-5 py-3 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-xs flex items-center gap-2 cursor-pointer shadow-md transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Broadcast Notice</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  When set, this banner is displayed immediately across all active Business Owner and Technician views.
                </p>
              </div>

              {systemSettings.globalNoticeBanner && (
                <div className="p-4 bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800 rounded-2xl flex items-center justify-between text-xs text-violet-900 dark:text-violet-200">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-violet-600 animate-pulse" />
                    <span className="font-bold">Live Banner Preview: </span>
                    <span>{systemSettings.globalNoticeBanner}</span>
                  </div>
                  <button
                    onClick={() => updateSystemSettings({ globalNoticeBanner: '' })}
                    className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                  >
                    Clear Banner
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SECTION: Plans & Subscriptions Management */}
      {activeTabSection === 'plans' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="p-2.5 bg-teal-600 text-white rounded-2xl">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
                  Subscription Plans & Tier Entitlements
                </h2>
                <p className="text-xs text-slate-500">
                  Manage plan feature limits, pricing tiers, technician capacity quotas, and premium add-ons
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Starter Plan */}
              <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-teal-600">Starter Plan</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 font-bold">
                    Active
                  </span>
                </div>
                <div>
                  <div className="text-2xl font-black text-slate-900 dark:text-slate-100">₹299 <span className="text-xs font-normal text-slate-500">/ mo</span></div>
                  <div className="text-xs text-slate-500 mt-1">For small service businesses</div>
                </div>
                <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-teal-600" /> Up to 2 Staff / Technicians</div>
                  <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-teal-600" /> Up to 100 Jobs / month</div>
                  <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-teal-600" /> Enquiries, Follow-ups & Jobs</div>
                  <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-teal-600" /> Basic Quotations & Reports</div>
                </div>
                <div className="pt-2 text-xs font-bold text-slate-500">
                  {businesses.filter(b => b.plan === 'Starter' || b.planId === 'plan-starter').length} Tenants Subscribed
                </div>
              </div>

              {/* Professional Plan */}
              <div className="p-6 rounded-3xl border-2 border-indigo-600 bg-white dark:bg-slate-900 shadow-md space-y-4 relative">
                <div className="absolute -top-3 right-6 bg-indigo-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  MOST POPULAR
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-indigo-600">Professional Plan</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 font-bold">
                    Active
                  </span>
                </div>
                <div>
                  <div className="text-2xl font-black text-slate-900 dark:text-slate-100">₹599 <span className="text-xs font-normal text-slate-500">/ mo</span></div>
                  <div className="text-xs text-slate-500 mt-1">For growing service teams</div>
                </div>
                <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-indigo-600" /> Up to 7 Staff / Technicians</div>
                  <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-indigo-600" /> Up to 500 Jobs / month</div>
                  <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-indigo-600" /> Advanced Scheduling & Portal</div>
                  <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-indigo-600" /> Priority Support & Analytics</div>
                </div>
                <div className="pt-2 text-xs font-bold text-slate-500">
                  {businesses.filter(b => b.plan === 'Professional' || b.planId === 'plan-pro' || (!b.plan && !b.planId)).length} Tenants Subscribed
                </div>
              </div>

              {/* Business Plan */}
              <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-purple-600">Business Plan</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 font-bold">
                    Active
                  </span>
                </div>
                <div>
                  <div className="text-2xl font-black text-slate-900 dark:text-slate-100">₹999 <span className="text-xs font-normal text-slate-500">/ mo</span></div>
                  <div className="text-xs text-slate-500 mt-1">For larger service operations</div>
                </div>
                <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-purple-600" /> Up to 15 Staff / Technicians</div>
                  <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-purple-600" /> Up to 1,500 Jobs / month</div>
                  <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-purple-600" /> Multi-Location Support</div>
                  <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-purple-600" /> Advanced Staff & Business Controls</div>
                </div>
                <div className="pt-2 text-xs font-bold text-slate-500">
                  {businesses.filter(b => b.plan === 'Business' || b.planId === 'plan-biz' || b.plan === 'Enterprise').length} Tenants Subscribed
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION: Referral Analytics & Bonus Management Console */}
      {activeTabSection === 'referrals' && (
        <div className="space-y-6 animate-in fade-in">
          <ReferralAnalytics />
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
                  <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                    {registeredTenantUsers.length} Users
                  </span>
                </div>

                <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200/60 dark:border-emerald-900/40 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-slate-800 dark:text-slate-200">Subscription Plans & Billing Config</span>
                  </div>
                  <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">{plans.length} Tier Plans</span>
                </div>

                <div className="pt-2 flex items-center justify-end">
                  <button
                    type="button"
                    disabled={isCleaningOrphans}
                    onClick={async () => {
                      setIsCleaningOrphans(true);
                      try {
                        await cleanupOrphanUsers();
                      } finally {
                        setIsCleaningOrphans(false);
                      }
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isCleaningOrphans ? 'animate-spin' : ''}`} />
                    <span>{isCleaningOrphans ? 'Cleaning Orphans...' : 'Clean Orphan Users & Sync (to 0)'}</span>
                  </button>
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
                  {businesses.map((b, idx) => (
                    <option key={b.id || `purge-opt-${idx}`} value={b.id}>
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

            {/* Option 3: Permanently Delete Specific Business & Owner */}
            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-rose-200 dark:border-rose-900/60 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-rose-700 text-white rounded-2xl shadow-md">
                  <UserX className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                    Option C: Delete Business & Owner Account
                  </h3>
                  <p className="text-xs text-slate-500">
                    Permanently delete an unwanted test business, its owner, and all linked data.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Select Business / Owner to Delete:
                </label>
                <select
                  value={selectedTenantForPurge}
                  onChange={(e) => setSelectedTenantForPurge(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100"
                >
                  {businesses.map((b, idx) => {
                    const owner = users.find((u) => u.businessId === b.id && u.role === 'business_owner');
                    return (
                      <option key={b.id || `del-opt-${idx}`} value={b.id}>
                        {b.name} — Owner: {owner?.name || 'N/A'} ({owner?.email || b.email || b.id})
                      </option>
                    );
                  })}
                </select>
              </div>

              <button
                onClick={() => {
                  const target = businesses.find((b) => b.id === selectedTenantForPurge) || businesses[0];
                  if (target) {
                    setTenantToDelete({ id: target.id, name: target.name });
                    setDeleteTenantConfirmText('');
                  }
                }}
                disabled={businesses.length === 0}
                className="w-full py-3.5 px-4 bg-rose-700 hover:bg-rose-800 active:scale-[0.99] text-white font-extrabold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Selected Business & Owner</span>
              </button>
            </div>

            {/* Option 4: Delete ALL Test Businesses & Owners */}
            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-red-400 dark:border-red-900 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-800 text-white rounded-2xl shadow-md">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                    Option D: Delete All {businesses.length} Test Businesses & Owners
                  </h3>
                  <p className="text-xs text-slate-500">
                    Wipes all test businesses & owners, leaving only 1 clean Super Admin account.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-red-50 dark:bg-red-950/40 rounded-2xl text-xs text-red-700 dark:text-red-300 leading-relaxed font-medium">
                Instantly clears all {businesses.length} test businesses and their owners in 1 step. Perfect for starting completely fresh with a clean system.
              </div>

              <button
                onClick={() => {
                  setDeleteAllConfirmText('');
                  setIsDeleteAllTenantsModalOpen(true);
                }}
                disabled={businesses.length === 0}
                className="w-full py-3.5 px-4 bg-red-800 hover:bg-red-900 active:scale-[0.99] text-white font-extrabold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete All {businesses.length} Test Businesses & Reset</span>
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
                    supportSessions.map((session, idx) => (
                      <tr key={session.id || `support-session-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
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
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                Security Audit Logs & Compliance Trail
              </h2>
              <p className="text-xs text-slate-500">
                Real-time immutable security logs for all platform admin events, support access requests, and user status changes.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs font-bold text-slate-500">
                Showing{' '}
                <strong>
                  {auditLogsLimit === 'all'
                    ? securityAuditLogs.length
                    : Math.min(auditLogsLimit, securityAuditLogs.length)}
                </strong>{' '}
                of {securityAuditLogs.length} Events
              </span>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 pl-1 font-bold">Limit:</span>
                {([10, 25, 50, 'all'] as const).map((lim) => (
                  <button
                    key={String(lim)}
                    type="button"
                    onClick={() => setAuditLogsLimit(lim)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                      auditLogsLimit === lim
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {lim === 'all' ? 'All' : lim}
                  </button>
                ))}
              </div>
            </div>
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
                {(auditLogsLimit === 'all'
                  ? securityAuditLogs
                  : securityAuditLogs.slice(0, auditLogsLimit)
                ).map((log, idx) => (
                  <tr key={log.id || `audit-log-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
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
                {users.map((u, idx) => (
                  <tr key={u.id || `usr-session-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
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

      {/* SINGLE TENANT & OWNER DELETE CONFIRMATION MODAL */}
      {tenantToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-rose-600/40 max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="p-2.5 bg-rose-600 text-white rounded-2xl shadow-md">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 dark:text-slate-100 text-base">
                  Delete Business & Owner Account
                </h3>
                <p className="text-xs text-rose-600 dark:text-rose-400 font-bold truncate max-w-[260px]">
                  {tenantToDelete.name} (ID: {tenantToDelete.id})
                </p>
              </div>
            </div>

            <form onSubmit={handleDeleteSingleTenant} className="space-y-4 text-xs">
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 rounded-2xl border border-rose-200 dark:border-rose-900/60 text-slate-700 dark:text-slate-300 space-y-2">
                <div className="font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Permanent Business Removal Warning</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  This action will permanently delete business <strong>{tenantToDelete.name}</strong>, its Business Owner account, staff users, and all associated customers, jobs, and invoices from Firestore.
                </p>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Type <span className="font-mono text-rose-600 dark:text-rose-400 font-black">DELETE</span> to confirm:
                </label>
                <input
                  type="text"
                  required
                  value={deleteTenantConfirmText}
                  onChange={(e) => setDeleteTenantConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono font-bold tracking-widest text-center"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  disabled={isDeletingTenant}
                  onClick={() => {
                    setTenantToDelete(null);
                    setDeleteTenantConfirmText('');
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isDeletingTenant || deleteTenantConfirmText.trim().toUpperCase() !== 'DELETE'}
                  className={`px-5 py-2 rounded-xl font-extrabold text-white flex items-center gap-2 shadow-md cursor-pointer transition-all ${
                    deleteTenantConfirmText.trim().toUpperCase() === 'DELETE' && !isDeletingTenant
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed opacity-60'
                  }`}
                >
                  {isDeletingTenant ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Deleting Business...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Permanently Delete</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ALL TENANTS & OWNERS PURGE CONFIRMATION MODAL */}
      {isDeleteAllTenantsModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-red-600/40 max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="p-2.5 bg-red-800 text-white rounded-2xl shadow-md">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 dark:text-slate-100 text-base">
                  Delete All {businesses.length} Test Businesses & Owners
                </h3>
                <p className="text-xs text-red-600 dark:text-red-400 font-bold">
                  Reset SaaS System to 1 Fresh Super Admin
                </p>
              </div>
            </div>

            <form onSubmit={handleDeleteAllTenants} className="space-y-4 text-xs">
              <div className="p-3.5 bg-red-50 dark:bg-red-950/40 rounded-2xl border border-red-200 dark:border-red-900/60 text-slate-700 dark:text-slate-300 space-y-2">
                <div className="font-bold text-red-700 dark:text-red-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span>Master Platform Purge Warning</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  This will permanently delete all {businesses.length} registered business tenants, all test owner and staff accounts, and all operational records from Firestore. Your <strong>Super Admin (admin@serviflow.io)</strong> master account will remain 100% safe.
                </p>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Type <span className="font-mono text-red-600 dark:text-red-400 font-black">DELETE ALL</span> to confirm:
                </label>
                <input
                  type="text"
                  required
                  value={deleteAllConfirmText}
                  onChange={(e) => setDeleteAllConfirmText(e.target.value)}
                  placeholder="DELETE ALL"
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono font-bold tracking-widest text-center"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  disabled={isDeletingAllTenants}
                  onClick={() => {
                    setIsDeleteAllTenantsModalOpen(false);
                    setDeleteAllConfirmText('');
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isDeletingAllTenants || deleteAllConfirmText.trim().toUpperCase() !== 'DELETE ALL'}
                  className={`px-5 py-2 rounded-xl font-extrabold text-white flex items-center gap-2 shadow-md cursor-pointer transition-all ${
                    deleteAllConfirmText.trim().toUpperCase() === 'DELETE ALL' && !isDeletingAllTenants
                      ? 'bg-red-800 hover:bg-red-900'
                      : 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed opacity-60'
                  }`}
                >
                  {isDeletingAllTenants ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Deleting All Tenants...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Confirm & Purge All</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ONBOARD NEW TENANT / BUSINESS OWNER MODAL */}
      {isAddTenantModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-indigo-200 dark:border-indigo-900/60 max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-md">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-slate-100 text-base">
                    Onboard New Business Tenant
                  </h3>
                  <p className="text-xs text-slate-500">
                    Create a company profile and business owner login credentials
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddTenantModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
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
                    value={newTenantForm.businessName}
                    onChange={(e) => setNewTenantForm({ ...newTenantForm, businessName: e.target.value })}
                    placeholder="e.g. Apex Security Solutions"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Industry / Service Category
                  </label>
                  <select
                    value={newTenantForm.industryType}
                    onChange={(e) => setNewTenantForm({ ...newTenantForm, industryType: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="CCTV & Security">CCTV & Security</option>
                    <option value="Solar Installation">Solar Installation</option>
                    <option value="AC & HVAC Service">AC & HVAC Service</option>
                    <option value="Electrical Contracting">Electrical Contracting</option>
                    <option value="Plumbing & Sanitation">Plumbing & Sanitation</option>
                    <option value="Fire Safety & Alarms">Fire Safety & Alarms</option>
                    <option value="IT & Networking">IT & Networking</option>
                    <option value="Home Automation">Home Automation</option>
                    <option value="General Field Service">General Field Service</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-2">
                  Business Owner Credentials
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      Owner Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newTenantForm.ownerName}
                      onChange={(e) => setNewTenantForm({ ...newTenantForm, ownerName: e.target.value })}
                      placeholder="e.g. Rajesh Kumar"
                      className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      Owner Mobile Phone
                    </label>
                    <input
                      type="tel"
                      value={newTenantForm.ownerPhone}
                      onChange={(e) => setNewTenantForm({ ...newTenantForm, ownerPhone: e.target.value })}
                      placeholder="9876543210"
                      className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      Owner Email (Login ID) *
                    </label>
                    <input
                      type="email"
                      required
                      value={newTenantForm.ownerEmail}
                      onChange={(e) => setNewTenantForm({ ...newTenantForm, ownerEmail: e.target.value })}
                      placeholder="owner@business.com"
                      className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      Default Password
                    </label>
                    <input
                      type="text"
                      value={newTenantForm.ownerPassword}
                      onChange={(e) => setNewTenantForm({ ...newTenantForm, ownerPassword: e.target.value })}
                      placeholder="1234"
                      className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Initial Approval Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label
                    className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                      newTenantForm.initialStatus === 'active'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="initialStatus"
                      value="active"
                      checked={newTenantForm.initialStatus === 'active'}
                      onChange={() => setNewTenantForm({ ...newTenantForm, initialStatus: 'active' })}
                      className="hidden"
                    />
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Active Immediately</span>
                  </label>

                  <label
                    className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                      newTenantForm.initialStatus === 'pending'
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-100 font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="initialStatus"
                      value="pending"
                      checked={newTenantForm.initialStatus === 'pending'}
                      onChange={() => setNewTenantForm({ ...newTenantForm, initialStatus: 'pending' })}
                      className="hidden"
                    />
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>Pending Approval</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  disabled={isCreatingTenant}
                  onClick={() => setIsAddTenantModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isCreatingTenant}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-extrabold text-white flex items-center gap-2 shadow-md cursor-pointer transition-all"
                >
                  {isCreatingTenant ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Creating Tenant...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Create & Onboard Tenant</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payout Processing Decision Modal */}
      {selectedPayoutForAction && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    Process Referral Bonus Payout
                  </h3>
                  <p className="text-xs text-slate-500">
                    Settle or reject withdrawal demand for {selectedPayoutForAction.businessName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPayoutForAction(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Recipient Details Summary */}
            <div className="bg-slate-50 dark:bg-slate-950/70 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Business / Owner:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {selectedPayoutForAction.businessName} ({selectedPayoutForAction.ownerName})
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Bonus Payout Amount:</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                  ₹{selectedPayoutForAction.amount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Destination Method:</span>
                <span className="font-bold uppercase text-slate-700 dark:text-slate-300">
                  {selectedPayoutForAction.payoutMethod.replace('_', ' ')}
                </span>
              </div>
              {selectedPayoutForAction.upiId && (
                <div className="flex justify-between items-center font-mono">
                  <span className="text-slate-500">UPI ID:</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    {selectedPayoutForAction.upiId}
                  </span>
                </div>
              )}
              {selectedPayoutForAction.bankAccount && (
                <div className="space-y-1 font-mono pt-1 border-t border-slate-200 dark:border-slate-800 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Bank A/C:</span>
                    <span className="font-bold">{selectedPayoutForAction.bankAccount.accountNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">IFSC Code:</span>
                    <span className="font-bold">{selectedPayoutForAction.bankAccount.ifsc}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Holder:</span>
                    <span className="font-bold font-sans">{selectedPayoutForAction.bankAccount.holderName}</span>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleExecutePayoutAction} className="space-y-3.5 text-xs">
              {/* Action Decision Selector */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Payout Status Decision *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayoutActionType('completed')}
                    className={`py-2 px-3 rounded-xl border text-center font-bold cursor-pointer transition-all ${
                      payoutActionType === 'completed'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    Mark as Paid
                  </button>

                  <button
                    type="button"
                    onClick={() => setPayoutActionType('approved')}
                    className={`py-2 px-3 rounded-xl border text-center font-bold cursor-pointer transition-all ${
                      payoutActionType === 'approved'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    Approve Request
                  </button>

                  <button
                    type="button"
                    onClick={() => setPayoutActionType('rejected')}
                    className={`py-2 px-3 rounded-xl border text-center font-bold cursor-pointer transition-all ${
                      payoutActionType === 'rejected'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    Reject & Refund
                  </button>
                </div>
              </div>

              {payoutActionType === 'completed' && (
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Bank UTR / Transaction Reference Number
                  </label>
                  <input
                    type="text"
                    value={payoutTxnRef}
                    onChange={(e) => setPayoutTxnRef(e.target.value)}
                    placeholder="e.g. UPI/41239841289 or NEFT-AXIS908123"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-xs"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Admin Audit Note
                </label>
                <textarea
                  rows={2}
                  value={payoutAdminNote}
                  onChange={(e) => setPayoutAdminNote(e.target.value)}
                  placeholder={
                    payoutActionType === 'rejected'
                      ? 'State reason for rejection (balance will be refunded to business wallet automatically)...'
                      : 'Optional confirmation note for the tenant...'
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedPayoutForAction(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isProcessingPayoutAction}
                  className={`px-5 py-2 rounded-xl font-extrabold text-white flex items-center gap-2 shadow-md cursor-pointer transition-all ${
                    payoutActionType === 'rejected'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {isProcessingPayoutAction ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Confirm & Apply Decision</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TENANT DETAILS INSPECTION MODAL */}
      {selectedTenantDetails && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-md">
                  {selectedTenantDetails.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-slate-100">
                    {selectedTenantDetails.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">Workspace ID: {selectedTenantDetails.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTenantDetails(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Industry Category</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-200 mt-0.5 block">
                  {selectedTenantDetails.type || 'General Services'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Plan Tier</span>
                <span className="font-extrabold text-purple-600 dark:text-purple-400 mt-0.5 block capitalize">
                  {selectedTenantDetails.plan || 'Professional'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Workspace Status</span>
                <span
                  className={`font-extrabold mt-0.5 block uppercase ${
                    selectedTenantDetails.status === 'active'
                      ? 'text-emerald-600'
                      : selectedTenantDetails.status === 'suspended'
                      ? 'text-rose-600'
                      : 'text-amber-600'
                  }`}
                >
                  {selectedTenantDetails.status || 'Active'}
                </span>
              </div>
            </div>

            {/* Owner & Contact Details */}
            {(() => {
              const owner = users.find(
                (u) => u.businessId === selectedTenantDetails.id && u.role === 'business_owner'
              );
              const staff = users.filter((u) => u.businessId === selectedTenantDetails.id);
              const tenantJobs = jobs.filter((j) => j.businessId === selectedTenantDetails.id);
              const tenantInvoices = invoices.filter((i) => i.businessId === selectedTenantDetails.id);

              return (
                <div className="space-y-3 text-xs">
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-2">
                    <h4 className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <Users className="w-4 h-4 text-indigo-600" />
                      Business Owner & Identity
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-400">Owner Name:</span>{' '}
                        <strong className="text-slate-800 dark:text-slate-200">
                          {owner?.name || selectedTenantDetails.name}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400">Email:</span>{' '}
                        <strong className="text-slate-800 dark:text-slate-200">
                          {owner?.email || selectedTenantDetails.email || 'N/A'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400">Phone:</span>{' '}
                        <strong className="text-slate-800 dark:text-slate-200">
                          {selectedTenantDetails.mobile || owner?.phone || 'N/A'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400">GSTIN / Tax:</span>{' '}
                        <strong className="text-slate-800 dark:text-slate-200 font-mono">
                          {selectedTenantDetails.gstNumber || 'Unregistered'}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Volume Counters */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/40">
                      <div className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                        {staff.length}
                      </div>
                      <div className="text-[10px] font-bold text-slate-500">Staff Members</div>
                    </div>
                    <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/40">
                      <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                        {tenantJobs.length}
                      </div>
                      <div className="text-[10px] font-bold text-slate-500">Active Jobs</div>
                    </div>
                    <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-900/40">
                      <div className="text-lg font-black text-purple-600 dark:text-purple-400">
                        {tenantInvoices.length}
                      </div>
                      <div className="text-[10px] font-bold text-slate-500">Invoices</div>
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        const target = selectedTenantDetails;
                        setSelectedTenantDetails(null);
                        handleOpenSupportModal(target.id, target.name);
                      }}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <Headphones className="w-3.5 h-3.5" />
                      <span>Start Audited Support</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedTenantDetails(null)}
                      className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
                    >
                      Close Inspection
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

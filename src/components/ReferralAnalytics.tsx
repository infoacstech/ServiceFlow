import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Business, ReferralRecord, ReferralPayoutRequest, User } from '../types';
import {
  Gift,
  Building2,
  Users,
  Coins,
  Wallet,
  ArrowUpRight,
  TrendingUp,
  Tag,
  Copy,
  Search,
  CheckCircle2,
  Clock,
  Banknote,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronRight,
  UserCheck,
  CreditCard,
  QrCode,
  Plus,
  Trash2,
  Info,
  CheckCheck,
  XCircle,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';

export const ReferralAnalytics: React.FC = () => {
  const {
    businesses,
    users,
    referralRecords,
    referralPayoutRequests,
    processReferralPayout,
    createManualReferralLink,
    deleteReferralRecord,
    settleReferralBonusDirectly,
    showToast,
  } = useApp();

  // Active view tabs within Referral Analytics
  const [activeSubView, setActiveSubView] = useState<'bonuses_owed' | 'parent_child_tree' | 'all_conversions' | 'payout_requests'>('bonuses_owed');
  const [searchTerm, setSearchTerm] = useState('');
  const [owedFilter, setOwedFilter] = useState<'all' | 'owed_only' | 'pending_only' | 'settled_only'>('owed_only');
  const [expandedParents, setExpandedParents] = useState<Record<string, boolean>>({});

  // Settle Bonus Direct Modal State
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [settleTargetBiz, setSettleTargetBiz] = useState<Business | null>(null);
  const [settleAmount, setSettleAmount] = useState<number>(0);
  const [settleMethod, setSettleMethod] = useState<'upi' | 'bank_transfer' | 'subscription_credit'>('upi');
  const [settleUpiId, setSettleUpiId] = useState('');
  const [settleBankDetails, setSettleBankDetails] = useState({
    accountNumber: '',
    ifsc: '',
    holderName: '',
  });
  const [settleTxnRef, setSettleTxnRef] = useState('');
  const [settleNotes, setSettleNotes] = useState('');
  const [isProcessingSettlement, setIsProcessingSettlement] = useState(false);

  // Manual Parent-Child Link Modal State
  const [isManualLinkModalOpen, setIsManualLinkModalOpen] = useState(false);
  const [manualParentId, setManualParentId] = useState(businesses[0]?.id || '');
  const [manualChildId, setManualChildId] = useState(businesses[1]?.id || '');
  const [manualBonusAmount, setManualBonusAmount] = useState(130);
  const [manualDiscountAmount, setManualDiscountAmount] = useState(130);
  const [manualNotes, setManualNotes] = useState('');
  const [isCreatingManualLink, setIsCreatingManualLink] = useState(false);

  // Process Payout Request Modal State
  const [selectedPayoutReq, setSelectedPayoutReq] = useState<ReferralPayoutRequest | null>(null);
  const [payoutDecision, setPayoutDecision] = useState<'completed' | 'approved' | 'rejected'>('completed');
  const [payoutDecisionTxnRef, setPayoutDecisionTxnRef] = useState('');
  const [payoutDecisionNotes, setPayoutDecisionNotes] = useState('');
  const [isProcessingPayoutDecision, setIsProcessingPayoutDecision] = useState(false);

  // Delete Referral Confirmation
  const [referralToDelete, setReferralToDelete] = useState<ReferralRecord | null>(null);

  // Compute Parent-Child Summary Data
  const parentSummaries = useMemo(() => {
    return businesses.map((biz) => {
      const owner = users.find((u) => u.businessId === biz.id && u.role === 'business_owner');
      const childrenReferrals = referralRecords.filter((r) => r.referrerBusinessId === biz.id);
      const totalBonusEarned = biz.referralEarnings || childrenReferrals.reduce((sum, r) => sum + (r.bonusEarned || 0), 0);
      
      // Calculate total paid out to this business
      const completedPayouts = referralPayoutRequests
        .filter((p) => p.businessId === biz.id && p.status === 'completed')
        .reduce((sum, p) => sum + p.amount, 0);

      const pendingPayoutRequests = referralPayoutRequests.filter(
        (p) => p.businessId === biz.id && (p.status === 'pending' || p.status === 'approved')
      );
      const pendingPayoutAmount = pendingPayoutRequests.reduce((sum, p) => sum + p.amount, 0);

      // Current balance owed is the available wallet balance
      const currentBalanceOwed = biz.referralBalance !== undefined ? biz.referralBalance : Math.max(0, totalBonusEarned - completedPayouts);

      // Unique code
      const referralCode = biz.referralCode || `SF-${biz.name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase()}10`;

      return {
        business: biz,
        owner,
        referralCode,
        childrenReferrals,
        totalChildrenCount: childrenReferrals.length,
        totalBonusEarned,
        totalBonusPaid: completedPayouts,
        currentBalanceOwed,
        pendingPayoutRequests,
        pendingPayoutAmount,
      };
    });
  }, [businesses, users, referralRecords, referralPayoutRequests]);

  // High-Level KPIs
  const metrics = useMemo(() => {
    const totalCommissionsEarned = parentSummaries.reduce((sum, p) => sum + p.totalBonusEarned, 0);
    const totalBonusesOwed = parentSummaries.reduce((sum, p) => sum + p.currentBalanceOwed, 0);
    const totalBonusesPaid = parentSummaries.reduce((sum, p) => sum + p.totalBonusPaid, 0);
    const parentsWithReferralsCount = parentSummaries.filter((p) => p.totalChildrenCount > 0).length;
    const parentsWithOwedBonusCount = parentSummaries.filter((p) => p.currentBalanceOwed > 0).length;
    const totalParentChildRelationships = referralRecords.length;

    return {
      totalCommissionsEarned,
      totalBonusesOwed,
      totalBonusesPaid,
      parentsWithReferralsCount,
      parentsWithOwedBonusCount,
      totalParentChildRelationships,
    };
  }, [parentSummaries, referralRecords]);

  // Filtered Parents for Bonus Summary Table
  const filteredParents = useMemo(() => {
    return parentSummaries.filter((item) => {
      if (owedFilter === 'owed_only' && item.currentBalanceOwed <= 0) return false;
      if (owedFilter === 'pending_only' && item.pendingPayoutRequests.length === 0) return false;
      if (owedFilter === 'settled_only' && (item.currentBalanceOwed > 0 || item.totalBonusEarned === 0)) return false;

      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      const matchBiz = item.business.name.toLowerCase().includes(term);
      const matchOwner = item.owner?.name.toLowerCase().includes(term) || item.owner?.phone.includes(term);
      const matchCode = item.referralCode.toLowerCase().includes(term);
      const matchChildren = item.childrenReferrals.some((c) => c.referredBusinessName.toLowerCase().includes(term));
      return matchBiz || matchOwner || matchCode || matchChildren;
    });
  }, [parentSummaries, owedFilter, searchTerm]);

  // Toggle tree expansion
  const toggleParentExpand = (bizId: string) => {
    setExpandedParents((prev) => ({ ...prev, [bizId]: !prev[bizId] }));
  };

  // Open Settle Modal for a Business
  const handleOpenSettleModal = (biz: Business, prefilledAmount?: number) => {
    setSettleTargetBiz(biz);
    setSettleAmount(prefilledAmount !== undefined ? prefilledAmount : biz.referralBalance || 0);
    setSettleMethod('upi');
    setSettleUpiId('');
    setSettleBankDetails({ accountNumber: '', ifsc: '', holderName: biz.name });
    setSettleTxnRef('');
    setSettleNotes('');
    setIsSettleModalOpen(true);
  };

  // Submit Settlement
  const handleExecuteSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settleTargetBiz) return;
    if (settleAmount <= 0) {
      showToast('Please enter a valid settlement amount greater than 0.', 'error');
      return;
    }

    setIsProcessingSettlement(true);
    try {
      await settleReferralBonusDirectly({
        businessId: settleTargetBiz.id,
        amount: settleAmount,
        payoutMethod: settleMethod,
        upiId: settleMethod === 'upi' ? settleUpiId.trim() : undefined,
        bankAccount: settleMethod === 'bank_transfer' ? settleBankDetails : undefined,
        transactionReference: settleTxnRef.trim(),
        notes: settleNotes.trim() || undefined,
      });
      setIsSettleModalOpen(false);
      setSettleTargetBiz(null);
    } catch (err: any) {
      console.error('Error settling bonus:', err);
      showToast(err.message || 'Settlement failed', 'error');
    } finally {
      setIsProcessingSettlement(false);
    }
  };

  // Submit Manual Parent-Child Referral Link
  const handleExecuteManualLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (manualParentId === manualChildId) {
      showToast('Parent referrer and child referred business cannot be the same business.', 'error');
      return;
    }

    setIsCreatingManualLink(true);
    try {
      await createManualReferralLink({
        referrerBusinessId: manualParentId,
        referredBusinessId: manualChildId,
        bonusAmount: manualBonusAmount,
        discountAmount: manualDiscountAmount,
        notes: manualNotes.trim() || undefined,
      });
      setIsManualLinkModalOpen(false);
      setManualNotes('');
    } catch (err: any) {
      console.error('Failed to create parent-child referral link:', err);
      showToast(err.message || 'Failed to create link', 'error');
    } finally {
      setIsCreatingManualLink(false);
    }
  };

  // Submit Payout Decision (Mark as Paid or Reject)
  const handleExecutePayoutDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayoutReq) return;

    setIsProcessingPayoutDecision(true);
    try {
      const noteDetails = payoutDecisionTxnRef.trim()
        ? `Txn Ref / UTR: ${payoutDecisionTxnRef.trim()}${payoutDecisionNotes.trim() ? ` | Note: ${payoutDecisionNotes.trim()}` : ''}`
        : payoutDecisionNotes.trim() || undefined;

      processReferralPayout(selectedPayoutReq.id, payoutDecision, noteDetails);
      setSelectedPayoutReq(null);
      setPayoutDecisionTxnRef('');
      setPayoutDecisionNotes('');
    } catch (err) {
      console.error('Failed to process referral payout action:', err);
    } finally {
      setIsProcessingPayoutDecision(false);
    }
  };

  // Delete Referral Document from Firestore
  const handleConfirmDeleteReferral = async () => {
    if (!referralToDelete) return;
    try {
      await deleteReferralRecord(referralToDelete.id);
      setReferralToDelete(null);
    } catch (err) {
      console.error('Failed to delete referral record:', err);
    }
  };

  return (
    <div className="space-y-6" id="referral-analytics-dashboard">
      {/* Top Welcome & Context Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-amber-100 text-xs font-black tracking-wide border border-white/20">
              <Gift className="w-3.5 h-3.5 text-amber-200" />
              <span>Parent-Child Referral Engine & Firestore Ledger</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Referral Analytics & Bonus Management
            </h2>
            <p className="text-xs sm:text-sm text-amber-100/90 leading-relaxed font-medium">
              Track business-to-business referral partnerships, view live child tenant conversion trees, calculate 10% partner commissions, and settle outstanding bonuses with verifiable audit proof stored in Firestore.
            </p>
          </div>

          {/* Quick Top Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsManualLinkModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-white text-slate-900 hover:bg-amber-50 font-black text-xs inline-flex items-center gap-2 shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-amber-600" />
              <span>Establish Parent-Child Link</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Bonuses Owed */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-amber-300 dark:border-amber-900/60 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              Total Bonuses Owed
            </span>
            <div className="p-2.5 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              ₹{metrics.totalBonusesOwed.toLocaleString()}
            </div>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-semibold flex items-center gap-1">
              <Coins className="w-3.5 h-3.5" />
              <span>Owed to {metrics.parentsWithOwedBonusCount} partner businesses</span>
            </p>
          </div>
        </div>

        {/* Total Commissions Earned (Lifetime) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              Total Bonus Generated
            </span>
            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              ₹{metrics.totalCommissionsEarned.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">
              10% reward per referred signup
            </p>
          </div>
        </div>

        {/* Total Settled / Paid Out */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              Total Bonuses Settled
            </span>
            <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <CheckCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
              ₹{metrics.totalBonusesPaid.toLocaleString()}
            </div>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
              Disbursed via UPI, Bank & Credit
            </p>
          </div>
        </div>

        {/* Total Parent-Child Relationships */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              Parent-Child Links
            </span>
            <div className="p-2.5 rounded-2xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {metrics.totalParentChildRelationships}
            </div>
            <p className="text-[11px] text-purple-600 dark:text-purple-400 mt-1 font-medium">
              Across {metrics.parentsWithReferralsCount} active referrers
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs & Search Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveSubView('bonuses_owed')}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeSubView === 'bonuses_owed'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Summary Table of Bonuses Owed</span>
            {metrics.parentsWithOwedBonusCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                activeSubView === 'bonuses_owed' ? 'bg-amber-800 text-amber-100' : 'bg-amber-200 dark:bg-amber-950 text-amber-900 dark:text-amber-300'
              }`}>
                {metrics.parentsWithOwedBonusCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubView('parent_child_tree')}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeSubView === 'parent_child_tree'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Parent-Child Relationship Tree</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
              activeSubView === 'parent_child_tree' ? 'bg-indigo-800 text-indigo-100' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}>
              {referralRecords.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubView('all_conversions')}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeSubView === 'all_conversions'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            <span>Firestore 'referrals' Log</span>
          </button>

          <button
            onClick={() => setActiveSubView('payout_requests')}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeSubView === 'payout_requests'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Banknote className="w-3.5 h-3.5" />
            <span>Payout Requests Queue</span>
            {referralPayoutRequests.filter((p) => p.status === 'pending').length > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-black bg-rose-500 text-white animate-pulse">
                {referralPayoutRequests.filter((p) => p.status === 'pending').length}
              </span>
            )}
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search business, owner, code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* VIEW 1: SUMMARY TABLE OF BONUSES OWED (MAIN REQUIREMENT) */}
      {activeSubView === 'bonuses_owed' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-4 p-6">
          {/* Header & Filter Chips */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Wallet className="w-5 h-5 text-amber-500" />
                <span>Partner Bonuses Owed & Settlement Ledger</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Exact breakdown of commissions earned by referring parent businesses, settled payouts, and outstanding bonuses currently owed by the platform.
              </p>
            </div>

            {/* Quick Status Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-400">Filter:</span>
              <button
                onClick={() => setOwedFilter('owed_only')}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
                  owedFilter === 'owed_only'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                Owed Only (&gt; ₹0) ({parentSummaries.filter((p) => p.currentBalanceOwed > 0).length})
              </button>
              <button
                onClick={() => setOwedFilter('pending_only')}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
                  owedFilter === 'pending_only'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                Pending Requests ({parentSummaries.filter((p) => p.pendingPayoutRequests.length > 0).length})
              </button>
              <button
                onClick={() => setOwedFilter('settled_only')}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
                  owedFilter === 'settled_only'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                Fully Settled
              </button>
              <button
                onClick={() => setOwedFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
                  owedFilter === 'all'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                All Businesses ({businesses.length})
              </button>
            </div>
          </div>

          {/* Table of Bonuses Owed */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-extrabold text-[11px]">
                  <th className="py-3.5 px-4">Parent Referrer Business</th>
                  <th className="py-3.5 px-4">Referral Code</th>
                  <th className="py-3.5 px-4">Child Referrals</th>
                  <th className="py-3.5 px-4">Total Earned</th>
                  <th className="py-3.5 px-4">Total Settled</th>
                  <th className="py-3.5 px-4">Outstanding Bonus Owed</th>
                  <th className="py-3.5 px-4">Status & Requests</th>
                  <th className="py-3.5 px-4 text-right">Super Admin Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredParents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-2 text-slate-400">
                        <Wallet className="w-6 h-6" />
                      </div>
                      <p className="font-bold text-sm text-slate-700 dark:text-slate-300">
                        No businesses match the current filter.
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Try selecting "All Businesses" or establish a new parent-child referral link.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredParents.map((item) => {
                    const hasOwed = item.currentBalanceOwed > 0;
                    const hasPendingReq = item.pendingPayoutRequests.length > 0;

                    return (
                      <tr
                        key={item.business.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        {/* Parent Business */}
                        <td className="py-4 px-4 align-top">
                          <div className="space-y-1">
                            <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 text-sm">
                              <Building2 className="w-4 h-4 text-indigo-500" />
                              <span>{item.business.name}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-2">
                              <span>Owner: {item.owner?.name || 'Owner'}</span>
                              <span>•</span>
                              <span className="font-mono text-slate-400">{item.owner?.phone || item.business.mobile}</span>
                            </div>
                          </div>
                        </td>

                        {/* Referral Code */}
                        <td className="py-4 px-4 align-top">
                          <div className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-950/80 px-2 py-1 rounded-lg border border-amber-300/40 font-mono font-bold text-amber-800 dark:text-amber-300 text-xs">
                            <Tag className="w-3 h-3 text-amber-600" />
                            <span>{item.referralCode}</span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(item.referralCode);
                                showToast(`Copied ${item.business.name}'s referral code: ${item.referralCode}`, 'success');
                              }}
                              className="p-0.5 text-slate-400 hover:text-amber-600"
                              title="Copy code"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        </td>

                        {/* Child Referrals Count */}
                        <td className="py-4 px-4 align-top">
                          <div className="space-y-0.5">
                            <span className="font-black text-slate-800 dark:text-slate-200 text-sm">
                              {item.totalChildrenCount}
                            </span>
                            <span className="text-[11px] text-slate-400 ml-1">child tenants</span>
                            {item.totalChildrenCount > 0 && (
                              <button
                                onClick={() => {
                                  setActiveSubView('parent_child_tree');
                                  setExpandedParents((prev) => ({ ...prev, [item.business.id]: true }));
                                }}
                                className="block text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                              >
                                View Children Tree &rarr;
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Total Bonus Earned */}
                        <td className="py-4 px-4 align-top">
                          <span className="font-extrabold text-slate-900 dark:text-white">
                            ₹{item.totalBonusEarned.toLocaleString()}
                          </span>
                        </td>

                        {/* Total Settled */}
                        <td className="py-4 px-4 align-top">
                          <span className="font-medium text-slate-600 dark:text-slate-400">
                            ₹{item.totalBonusPaid.toLocaleString()}
                          </span>
                        </td>

                        {/* Net Bonus Owed (Outstanding ₹) */}
                        <td className="py-4 px-4 align-top">
                          <div className="inline-flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950 px-3 py-1.5 rounded-xl border border-amber-300/50">
                            <Coins className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            <span className="text-base font-black text-amber-700 dark:text-amber-300">
                              ₹{item.currentBalanceOwed.toLocaleString()}
                            </span>
                          </div>
                        </td>

                        {/* Status & Payout Requests */}
                        <td className="py-4 px-4 align-top">
                          <div className="space-y-1">
                            {hasPendingReq ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-300/40 animate-pulse">
                                <Clock className="w-3 h-3" />
                                <span>Pending Request: ₹{item.pendingPayoutAmount}</span>
                              </span>
                            ) : hasOwed ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300/40">
                                <Info className="w-3 h-3" />
                                <span>Bonus Owed</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300/40">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Fully Settled</span>
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Super Admin Actions */}
                        <td className="py-4 px-4 align-top text-right">
                          <div className="flex items-center justify-end gap-2">
                            {hasOwed && (
                              <button
                                onClick={() => handleOpenSettleModal(item.business, item.currentBalanceOwed)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs inline-flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                              >
                                <Banknote className="w-3.5 h-3.5" />
                                <span>Settle / Pay</span>
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setManualParentId(item.business.id);
                                setIsManualLinkModalOpen(true);
                              }}
                              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
                              title="Link a new child tenant to this parent"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: PARENT-CHILD RELATIONSHIP TREE & NETWORK EXPLORER */}
      {activeSubView === 'parent_child_tree' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-500" />
                  <span>Parent-Child Referral Relationship Network</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Visual hierarchy of parent referrer businesses and all child businesses they brought onto the ServiFlow platform.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const allOpen: Record<string, boolean> = {};
                    businesses.forEach((b) => (allOpen[b.id] = true));
                    setExpandedParents(allOpen);
                  }}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300"
                >
                  Expand All
                </button>
                <button
                  onClick={() => setExpandedParents({})}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300"
                >
                  Collapse All
                </button>
              </div>
            </div>

            {/* Tree Cards */}
            <div className="mt-6 space-y-4">
              {parentSummaries.map((parent) => {
                const isExpanded = !!expandedParents[parent.business.id];
                const hasChildren = parent.childrenReferrals.length > 0;

                return (
                  <div
                    key={parent.business.id}
                    className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-4 transition-all"
                  >
                    {/* Parent Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleParentExpand(parent.business.id)}
                          className="p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer hover:bg-indigo-50"
                        >
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>

                        <div className="p-2.5 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300">
                          <Building2 className="w-5 h-5" />
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm text-slate-900 dark:text-white">
                              {parent.business.name}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-[10px] font-extrabold uppercase border border-indigo-200/50">
                              PARENT REFERRER
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-2 mt-0.5">
                            <span>Code: <strong className="font-mono text-amber-600">{parent.referralCode}</strong></span>
                            <span>•</span>
                            <span>{parent.business.type}</span>
                            <span>•</span>
                            <span>Owner: {parent.owner?.name || 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Parent Stats Badges */}
                      <div className="flex flex-wrap items-center gap-3 sm:self-center">
                        <div className="px-3 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                          <span className="text-slate-400 font-bold">Children: </span>
                          <span className="font-black text-slate-800 dark:text-slate-200">
                            {parent.totalChildrenCount}
                          </span>
                        </div>

                        <div className="px-3 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300/40 text-xs">
                          <span className="text-amber-700 dark:text-amber-300 font-bold">Bonus Owed: </span>
                          <span className="font-black text-amber-800 dark:text-amber-200">
                            ₹{parent.currentBalanceOwed}
                          </span>
                        </div>

                        {parent.currentBalanceOwed > 0 && (
                          <button
                            onClick={() => handleOpenSettleModal(parent.business, parent.currentBalanceOwed)}
                            className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs cursor-pointer"
                          >
                            Settle Bonus
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Expanded Child Nodes (Referred Businesses) */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 pl-4 sm:pl-10 space-y-3">
                        {!hasChildren ? (
                          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-400">
                            No child businesses referred by this parent yet.
                          </div>
                        ) : (
                          parent.childrenReferrals.map((childRef) => {
                            const childBiz = businesses.find((b) => b.id === childRef.referredBusinessId);
                            const childOwner = users.find(
                              (u) => u.businessId === childRef.referredBusinessId && u.role === 'business_owner'
                            );

                            return (
                              <div
                                key={childRef.id}
                                className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs relative"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                                        {childRef.referredBusinessName}
                                      </span>
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                                        CHILD TENANT
                                      </span>
                                    </div>
                                    <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-2 mt-0.5">
                                      <span>Owner: {childRef.referredOwnerName || childOwner?.name || 'Owner'}</span>
                                      {childRef.referredOwnerPhone && <span>({childRef.referredOwnerPhone})</span>}
                                      <span>•</span>
                                      <span>Plan: {childRef.planName}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2.5">
                                  <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300/40">
                                    Child Discount: -₹{childRef.discountAmount || 130} (10%)
                                  </span>
                                  <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300/40">
                                    Parent Commission: +₹{childRef.bonusEarned || 130} (10%)
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    Joined: {new Date(childRef.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: FIRESTORE 'referrals' COLLECTION DIRECTORY */}
      {activeSubView === 'all_conversions' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Gift className="w-4 h-4 text-amber-500" />
                <span>Firestore 'referrals' Collection Documents</span>
              </h3>
              <p className="text-xs text-slate-500">
                Live authoritative records stored inside the 'referrals' collection in Firestore.
              </p>
            </div>

            <button
              onClick={() => setIsManualLinkModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Referral Document</span>
            </button>
          </div>

          {referralRecords.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-3">
              <Gift className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="font-bold text-sm text-slate-700 dark:text-slate-300">
                No referral documents found in Firestore 'referrals' collection.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-extrabold text-[11px]">
                    <th className="py-3 px-4">Doc ID & Timestamp</th>
                    <th className="py-3 px-4">Parent Referrer</th>
                    <th className="py-3 px-4">Child Referred</th>
                    <th className="py-3 px-4">Plan & Discount</th>
                    <th className="py-3 px-4">Bonus Credited</th>
                    <th className="py-3 px-4">Notes</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {referralRecords.map((ref) => (
                    <tr key={ref.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 align-top">
                        <div className="font-bold text-slate-700 dark:text-slate-300">{ref.id}</div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(ref.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </td>
                      <td className="py-3 px-4 align-top">
                        <div className="font-bold text-slate-900 dark:text-white">{ref.referrerBusinessName}</div>
                        <div className="font-mono text-[10px] text-amber-600">{ref.referrerCode}</div>
                      </td>
                      <td className="py-3 px-4 align-top">
                        <div className="font-bold text-slate-900 dark:text-white">{ref.referredBusinessName}</div>
                        <div className="text-[11px] text-slate-500">{ref.referredOwnerName}</div>
                      </td>
                      <td className="py-3 px-4 align-top">
                        <div className="text-slate-800 dark:text-slate-200 font-medium">{ref.planName}</div>
                        <div className="text-[10px] text-emerald-600 font-bold">-₹{ref.discountAmount || 130} (10%)</div>
                      </td>
                      <td className="py-3 px-4 align-top font-black text-amber-600 dark:text-amber-400">
                        +₹{ref.bonusEarned || 130}
                      </td>
                      <td className="py-3 px-4 align-top text-slate-500 italic max-w-xs truncate text-[11px]">
                        {ref.notes || '10% signup referral bonus'}
                      </td>
                      <td className="py-3 px-4 align-top text-right">
                        <button
                          onClick={() => setReferralToDelete(ref)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg transition-colors cursor-pointer"
                          title="Delete referral document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* VIEW 4: PAYOUT REQUESTS & DISBURSEMENTS */}
      {activeSubView === 'payout_requests' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Banknote className="w-5 h-5 text-emerald-500" />
                <span>Tenant Withdrawal Requests & Bonus Disbursements</span>
              </h3>
              <p className="text-xs text-slate-500">
                Incoming withdrawal requests submitted by business owners via UPI or Direct Bank Transfer.
              </p>
            </div>
          </div>

          {referralPayoutRequests.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Banknote className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="font-bold text-sm text-slate-700 dark:text-slate-300">
                No payout requests submitted yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {referralPayoutRequests.map((payout) => (
                <div
                  key={payout.id}
                  className="bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {payout.businessName}
                      </span>
                      <span className="text-xs text-slate-500">
                        ({payout.ownerName} • {payout.ownerPhone})
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                          payout.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : payout.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {payout.status}
                      </span>
                    </div>

                    {/* Details box */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200/80 dark:border-slate-800 text-xs space-y-1 max-w-xl">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-600 dark:text-slate-400 uppercase">
                          Method: {payout.payoutMethod.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(payout.requestedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {payout.payoutMethod === 'upi' && payout.upiId && (
                        <div className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                          UPI ID: {payout.upiId}
                        </div>
                      )}
                      {payout.payoutMethod === 'bank_transfer' && payout.bankAccount && (
                        <div className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                          A/C: {payout.bankAccount.accountNumber} | IFSC: {payout.bankAccount.ifsc} | Name: {payout.bankAccount.holderName}
                        </div>
                      )}
                      {payout.notes && (
                        <div className="text-[11px] text-slate-500 italic">
                          Note: {payout.notes}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2 border-t sm:border-t-0 pt-3 sm:pt-0">
                    <div className="text-right">
                      <span className="text-[10px] uppercase text-slate-400 font-extrabold block">Amount</span>
                      <span className="text-xl font-black text-emerald-600">₹{payout.amount}</span>
                    </div>

                    {payout.status === 'pending' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedPayoutReq(payout);
                            setPayoutDecision('completed');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs cursor-pointer shadow-sm"
                        >
                          Mark Paid
                        </button>
                        <button
                          onClick={() => {
                            setSelectedPayoutReq(payout);
                            setPayoutDecision('rejected');
                          }}
                          className="px-3 py-1.5 rounded-xl border border-rose-300 text-rose-600 text-xs font-bold hover:bg-rose-50 cursor-pointer"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: SETTLE BONUS DIRECTLY (SUPER ADMIN) */}
      {/* ========================================================================= */}
      {isSettleModalOpen && settleTargetBiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    Settle Bonus for {settleTargetBiz.name}
                  </h3>
                  <p className="text-xs text-slate-500">Record payout and update wallet balance in Firestore</p>
                </div>
              </div>
              <button
                onClick={() => setIsSettleModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExecuteSettlement} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Settlement Amount (₹)
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={settleTargetBiz.referralBalance || 100000}
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-sm text-slate-900 dark:text-white"
                />
                <div className="text-[11px] text-slate-500 mt-1">
                  Available Owed Balance: ₹{settleTargetBiz.referralBalance || 0}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Disbursement Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['upi', 'bank_transfer', 'subscription_credit'] as const).map((m) => (
                    <button
                      type="button"
                      key={m}
                      onClick={() => setSettleMethod(m)}
                      className={`p-2.5 rounded-xl font-extrabold text-center uppercase tracking-wider text-[10px] border cursor-pointer ${
                        settleMethod === m
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600'
                      }`}
                    >
                      {m.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {settleMethod === 'upi' && (
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Beneficiary UPI ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. owner@okhdfcbank"
                    value={settleUpiId}
                    onChange={(e) => setSettleUpiId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-slate-900 dark:text-white"
                  />
                </div>
              )}

              {settleMethod === 'bank_transfer' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      value={settleBankDetails.holderName}
                      onChange={(e) => setSettleBankDetails((prev) => ({ ...prev, holderName: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      Account Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 5010049281928"
                      value={settleBankDetails.accountNumber}
                      onChange={(e) => setSettleBankDetails((prev) => ({ ...prev, accountNumber: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      IFSC Code
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. HDFC0001234"
                      value={settleBankDetails.ifsc}
                      onChange={(e) => setSettleBankDetails((prev) => ({ ...prev, ifsc: e.target.value.toUpperCase() }))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-slate-900 dark:text-white uppercase"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Bank Reference / UTR Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. UPI/4281938192 or NEFT-491829"
                  value={settleTxnRef}
                  onChange={(e) => setSettleTxnRef(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Admin Internal Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Settled weekly partner commission"
                  value={settleNotes}
                  onChange={(e) => setSettleNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSettleModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessingSettlement}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-extrabold text-white shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isProcessingSettlement ? 'Recording Payout...' : `Confirm & Pay ₹${settleAmount}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: MANUAL PARENT-CHILD REFERRAL LINK */}
      {/* ========================================================================= */}
      {isManualLinkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 rounded-xl">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    Establish Parent-Child Referral Link
                  </h3>
                  <p className="text-xs text-slate-500">Record attribution in Firestore 'referrals' collection</p>
                </div>
              </div>
              <button
                onClick={() => setIsManualLinkModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExecuteManualLink} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  1. Parent Referrer Business (Who gets the bonus)
                </label>
                <select
                  value={manualParentId}
                  onChange={(e) => setManualParentId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                >
                  {businesses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.referralCode || b.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  2. Child Referred Business (Who joined via referral)
                </label>
                <select
                  value={manualChildId}
                  onChange={(e) => setManualChildId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                >
                  {businesses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} (Joined: {new Date(b.createdAt).toLocaleDateString('en-IN')})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Bonus Credited to Parent (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={manualBonusAmount}
                    onChange={(e) => setManualBonusAmount(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Discount Given to Child (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={manualDiscountAmount}
                    onChange={(e) => setManualDiscountAmount(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Attribution Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Offline referral link approved by Super Admin"
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsManualLinkModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingManualLink}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 font-extrabold text-white shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isCreatingManualLink ? 'Saving to Firestore...' : 'Establish Link & Credit Bonus'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: PROCESS PAYOUT REQUEST MODAL */}
      {/* ========================================================================= */}
      {selectedPayoutReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    Process Payout: {selectedPayoutReq.businessName}
                  </h3>
                  <p className="text-xs text-slate-500">Amount: ₹{selectedPayoutReq.amount}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPayoutReq(null)}
                className="p-1 text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExecutePayoutDecision} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Decision
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayoutDecision('completed')}
                    className={`p-3 rounded-xl font-black text-center text-xs border cursor-pointer ${
                      payoutDecision === 'completed'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    Mark as Paid (Disbursed)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayoutDecision('rejected')}
                    className={`p-3 rounded-xl font-black text-center text-xs border cursor-pointer ${
                      payoutDecision === 'rejected'
                        ? 'border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    Reject & Refund Wallet
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Transaction Reference / UTR Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. UPI/3910291039 or NEFT-491029"
                  value={payoutDecisionTxnRef}
                  onChange={(e) => setPayoutDecisionTxnRef(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Note to Business Owner
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bonus transferred successfully to your registered UPI ID"
                  value={payoutDecisionNotes}
                  onChange={(e) => setPayoutDecisionNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedPayoutReq(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessingPayoutDecision}
                  className={`px-5 py-2.5 rounded-xl font-extrabold text-white shadow-md cursor-pointer disabled:opacity-50 ${
                    payoutDecision === 'completed' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {isProcessingPayoutDecision ? 'Processing...' : 'Confirm Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: DELETE REFERRAL RECORD CONFIRMATION */}
      {/* ========================================================================= */}
      {referralToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-rose-300 dark:border-rose-900 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-100 dark:bg-rose-950 text-rose-600 rounded-2xl">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Delete Referral Document?
                </h3>
                <p className="text-xs text-slate-500 font-mono">{referralToDelete.id}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Are you sure you want to permanently delete this referral record between{' '}
              <strong>{referralToDelete.referrerBusinessName}</strong> and{' '}
              <strong>{referralToDelete.referredBusinessName}</strong> from Firestore?
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setReferralToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteReferral}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md cursor-pointer"
              >
                Delete from Firestore
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

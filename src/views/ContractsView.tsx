import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { RecurringContract, VisitFrequency } from '../types';
import {
  Repeat,
  Plus,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ArrowRight,
  MessageSquare,
  Search,
  Filter,
  X,
  Sparkles,
  DollarSign,
  UserCheck,
  FileCheck,
} from 'lucide-react';
import { sendContractRenewalWhatsApp } from '../utils/whatsappHelper';

export const ContractsView: React.FC = () => {
  const { contracts, customers, addJob, currentBusiness, showToast } = useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'expiring' | 'expired' | 'active'>('all');
  const [isNewContractOpen, setIsNewContractOpen] = useState(false);

  // New Contract Form State
  const [name, setName] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [contractAmount, setContractAmount] = useState(12000);
  const [visitFrequency, setVisitFrequency] = useState<VisitFrequency>('quarterly');
  const [visitsAllowed, setVisitsAllowed] = useState(4);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  });

  const getDaysRemaining = (endDateStr: string) => {
    if (!endDateStr) return 999;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(endDateStr);
    end.setHours(0, 0, 0, 0);
    const diffTime = end.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const filteredContracts = useMemo(() => {
    return (contracts || []).filter((c) => {
      const customer = (customers || []).find((cust) => cust.id === c.customerId);
      const matchesSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.contractNumber.toLowerCase().includes(search.toLowerCase()) ||
        customer?.name.toLowerCase().includes(search.toLowerCase()) ||
        customer?.companyName?.toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;

      const days = getDaysRemaining(c.endDate);

      if (statusFilter === 'expiring') return days >= 0 && days <= 30;
      if (statusFilter === 'expired') return days < 0;
      if (statusFilter === 'active') return days > 30;
      return true;
    });
  }, [contracts, customers, search, statusFilter]);

  // Expiry statistics
  const stats = useMemo(() => {
    let expiringCount = 0;
    let expiredCount = 0;
    let activeCount = 0;
    let totalValue = 0;

    (contracts || []).forEach((c) => {
      totalValue += c.contractAmount || 0;
      const days = getDaysRemaining(c.endDate);
      if (days < 0) expiredCount++;
      else if (days <= 30) expiringCount++;
      else activeCount++;
    });

    return { expiringCount, expiredCount, activeCount, totalValue };
  }, [contracts]);

  const handleScheduleNextVisit = (c: RecurringContract) => {
    const cust = (customers || []).find((cust) => cust.id === c.customerId);
    addJob({
      customerId: c.customerId,
      serviceId: 'srv-1',
      description: `AMC Contract Scheduled Visit: ${c.name} (${c.contractNumber})`,
      priority: 'medium',
      assignedStaffId: 'user-tech-1',
      scheduledDate: new Date().toISOString().split('T')[0],
      scheduledTime: '11:00 AM',
      location: cust?.address || 'Site Location',
      estimatedAmount: 0,
      status: 'assigned',
    });
    showToast(`New maintenance job scheduled for contract ${c.contractNumber}!`, 'success');
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              Contract Lifecycle Engine
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Repeat className="w-6 h-6 text-indigo-600" /> Recurring AMC & Warranty Tracker
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated expiry alerts, WhatsApp renewal reminders, visit quotas, and preventive maintenance dispatch.
          </p>
        </div>

        <button
          onClick={() => setIsNewContractOpen(true)}
          className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> New AMC Contract
        </button>
      </div>

      {/* Expiry Status Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div
          onClick={() => setStatusFilter('all')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-500 shadow-xs ring-2 ring-indigo-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Total Active AMCs</span>
            <Repeat className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
            {contracts.length}
          </div>
          <div className="text-[11px] font-bold text-indigo-600 mt-0.5">
            {currentBusiness.currency}{stats.totalValue.toLocaleString()} Portfolio Value
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('expiring')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'expiring'
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 shadow-xs ring-2 ring-amber-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-amber-600">
            <span>Expiring Soon (&lt;30 Days)</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-600 mt-1">
            {stats.expiringCount}
          </div>
          <div className="text-[11px] font-medium text-slate-500 mt-0.5">
            Renewal Reminders Due
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('expired')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'expired'
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 shadow-xs ring-2 ring-rose-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-rose-600">
            <span>Expired AMCs</span>
            <Clock className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-600 mt-1">
            {stats.expiredCount}
          </div>
          <div className="text-[11px] font-medium text-slate-500 mt-0.5">
            Follow up for Re-contract
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('active')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'active'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-xs ring-2 ring-emerald-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-600">
            <span>Healthy / Long Term</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 mt-1">
            {stats.activeCount}
          </div>
          <div className="text-[11px] font-medium text-slate-500 mt-0.5">
            Coverage in good standing
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search AMC, Contract #, Customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {(['all', 'expiring', 'expired', 'active'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                statusFilter === tab
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {tab === 'all' ? 'All Contracts' : tab === 'expiring' ? 'Expiring Soon' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Contracts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredContracts.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400">
            <Repeat className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-bold">No AMC contracts found matching your filters</p>
          </div>
        ) : (
          filteredContracts.map((contract) => {
            const customer = (customers || []).find((c) => c.id === contract.customerId);
            const percentUsed = (contract.visitsUsed / contract.visitsAllowed) * 100;
            const daysLeft = getDaysRemaining(contract.endDate);
            const isExpired = daysLeft < 0;
            const isExpiringSoon = daysLeft >= 0 && daysLeft <= 30;

            return (
              <div
                key={contract.id}
                className={`p-5 rounded-3xl bg-white dark:bg-slate-900 border transition-all flex flex-col justify-between space-y-4 shadow-xs ${
                  isExpired
                    ? 'border-rose-300 dark:border-rose-900/60 ring-1 ring-rose-500/20'
                    : isExpiringSoon
                    ? 'border-amber-300 dark:border-amber-900/60 ring-1 ring-amber-500/20'
                    : 'border-slate-200/80 dark:border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-indigo-600 font-mono">{contract.contractNumber}</span>
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1 ${
                        isExpired
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          : isExpiringSoon
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 animate-pulse'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}
                    >
                      {isExpired
                        ? `Expired (${Math.abs(daysLeft)}d ago)`
                        : isExpiringSoon
                        ? `Expiring in ${daysLeft} days`
                        : `${daysLeft} days active`}
                    </span>
                  </div>

                  <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">{contract.name}</h3>
                  <div className="text-xs font-semibold text-indigo-600 mt-0.5">
                    {customer?.name} {customer?.companyName ? `(${customer.companyName})` : ''}
                  </div>

                  {/* Progress bar of visits */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-400">
                      <span>Visits Rendered</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {contract.visitsUsed} of {contract.visitsAllowed} ({contract.visitFrequency})
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full transition-all"
                        style={{ width: `${Math.min(100, percentUsed)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <div className="text-[10px] text-slate-400">Contract Period</div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        {contract.startDate} → {contract.endDate}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400">Annual Value</div>
                      <div className="font-black text-slate-900 dark:text-slate-100">
                        {currentBusiness.currency}{contract.contractAmount || 0}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons: WhatsApp Renewal Alert & Schedule Next Visit */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => {
                        sendContractRenewalWhatsApp(contract, customer, currentBusiness);
                        showToast(`WhatsApp renewal reminder sent to ${customer?.name || 'customer'}`, 'success');
                      }}
                      className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> WhatsApp Renewal
                    </button>

                    <button
                      onClick={() => handleScheduleNextVisit(contract)}
                      className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
                    >
                      Schedule Visit <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal for creating a new AMC */}
      {isNewContractOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Repeat className="w-4 h-4 text-indigo-600" /> Create New AMC Contract
              </h3>
              <button onClick={() => setIsNewContractOpen(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Select Customer *</label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-medium"
                >
                  <option value="">Choose Customer...</option>
                  {(customers || []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.companyName ? `(${c.companyName})` : ''} - {c.mobile}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold block mb-1">Contract / AMC Plan Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Comprehensive HVAC Annual Maintenance"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block mb-1">Annual Fee ({currentBusiness.currency})</label>
                  <input
                    type="number"
                    value={contractAmount}
                    onChange={(e) => setContractAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Visits Quota</label>
                  <input
                    type="number"
                    value={visitsAllowed}
                    onChange={(e) => setVisitsAllowed(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setIsNewContractOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!customerId || !name) {
                    showToast('Please select customer and enter contract name', 'error');
                    return;
                  }
                  // We simulate adding the new contract to the mock/real contracts state
                  const newContract: RecurringContract = {
                    id: 'amc-' + Date.now(),
                    businessId: currentBusiness?.id || 'biz-default',
                    contractNumber: 'AMC-' + Math.floor(1000 + Math.random() * 9000),
                    customerId,
                    serviceId: 'srv-1',
                    name,
                    contractAmount,
                    visitFrequency,
                    visitsAllowed,
                    visitsUsed: 0,
                    visitsRemaining: visitsAllowed,
                    startDate,
                    endDate,
                    renewalDate: endDate,
                    status: 'active',
                  };
                  contracts.push(newContract);
                  showToast('New AMC contract registered successfully!', 'success');
                  setIsNewContractOpen(false);
                }}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md"
              >
                Save AMC Contract
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

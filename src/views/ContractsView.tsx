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
  Wrench,
  Phone,
  Send,
  Check,
  Edit3,
  Trash2,
  ChevronRight,
  Layers,
  HardHat,
  Cpu,
  MoreVertical,
} from 'lucide-react';
import {
  sendContractRenewalWhatsApp,
  sendAmcVisitReminderWhatsApp,
} from '../utils/whatsappHelper';
import {
  getAmcVisitStatus,
  generateVisitScheduleMilestones,
  getUpcomingDueAmcContracts,
  getFrequencyIntervalMonths,
  addMonthsToDateString,
} from '../utils/amcHelper';

export const ContractsView: React.FC = () => {
  const {
    contracts,
    customers,
    users,
    currentBusiness,
    showToast,
    addContract,
    updateContract,
    deleteContract,
    scheduleAmcVisit,
    batchScheduleDueAmcVisits,
  } = useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'due_visits' | 'expiring' | 'expired' | 'active'>('all');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  React.useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // Modals
  const [isNewContractOpen, setIsNewContractOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<RecurringContract | null>(null);
  const [isBatchSchedulerOpen, setIsBatchSchedulerOpen] = useState(false);
  const [dispatchModalContract, setDispatchModalContract] = useState<RecurringContract | null>(null);

  // Single Visit Dispatch Form State
  const [dispatchDate, setDispatchDate] = useState(new Date().toISOString().split('T')[0]);
  const [dispatchTimeSlot, setDispatchTimeSlot] = useState('10:00 AM - 12:00 PM');
  const [dispatchTechId, setDispatchTechId] = useState('');
  const [dispatchNotes, setDispatchNotes] = useState('');
  const [dispatchSendWhatsApp, setDispatchSendWhatsApp] = useState(true);

  // Batch Scheduler Selection State
  const [selectedBatchContractIds, setSelectedBatchContractIds] = useState<string[]>([]);
  const [batchTechMap, setBatchTechMap] = useState<Record<string, string>>({});
  const [batchDateMap, setBatchDateMap] = useState<Record<string, string>>({});
  const [batchSlotMap, setBatchSlotMap] = useState<Record<string, string>>({});

  // New/Edit Contract Form State
  const [formName, setFormName] = useState('');
  const [formCustomerId, setFormCustomerId] = useState('');
  const [formContractAmount, setFormContractAmount] = useState(12000);
  const [formVisitFrequency, setFormVisitFrequency] = useState<VisitFrequency>('quarterly');
  const [formVisitsAllowed, setFormVisitsAllowed] = useState(4);
  const [formStartDate, setFormStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [formEndDate, setFormEndDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  });
  const [formNextVisitDate, setFormNextVisitDate] = useState('');
  const [formEquipmentDetails, setFormEquipmentDetails] = useState('');
  const [formAssignedTechId, setFormAssignedTechId] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Available Technicians
  const technicians = useMemo(() => {
    return (users || []).filter((u) => u.role === 'technician' || u.role === 'manager');
  }, [users]);

  // Days remaining helper
  const getDaysRemaining = (endDateStr: string) => {
    if (!endDateStr) return 999;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(endDateStr);
    end.setHours(0, 0, 0, 0);
    const diffTime = end.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Due AMC contracts for preventive maintenance
  const dueContracts = useMemo(() => {
    return getUpcomingDueAmcContracts(contracts || [], 7);
  }, [contracts]);

  // Filtered Contracts
  const filteredContracts = useMemo(() => {
    return (contracts || []).filter((c) => {
      const customer = (customers || []).find((cust) => cust.id === c.customerId);
      const matchesSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.contractNumber.toLowerCase().includes(search.toLowerCase()) ||
        (c.equipmentDetails && c.equipmentDetails.toLowerCase().includes(search.toLowerCase())) ||
        customer?.name.toLowerCase().includes(search.toLowerCase()) ||
        customer?.companyName?.toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;

      const days = getDaysRemaining(c.endDate);
      const visitStatus = getAmcVisitStatus(c);

      if (statusFilter === 'due_visits') return visitStatus.isOverdue || visitStatus.isDueSoon;
      if (statusFilter === 'expiring') return days >= 0 && days <= 30;
      if (statusFilter === 'expired') return days < 0;
      if (statusFilter === 'active') return days > 30 && c.status === 'active';
      return true;
    });
  }, [contracts, customers, search, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    let expiringCount = 0;
    let expiredCount = 0;
    let activeCount = 0;
    let totalValue = 0;
    let visitsDueCount = 0;

    (contracts || []).forEach((c) => {
      totalValue += c.contractAmount || 0;
      const days = getDaysRemaining(c.endDate);
      const visitStatus = getAmcVisitStatus(c);

      if (visitStatus.isOverdue || visitStatus.isDueSoon) {
        visitsDueCount++;
      }

      if (days < 0) expiredCount++;
      else if (days <= 30) expiringCount++;
      else activeCount++;
    });

    return { expiringCount, expiredCount, activeCount, totalValue, visitsDueCount };
  }, [contracts]);

  // Open single visit dispatch modal
  const openSingleDispatchModal = (contract: RecurringContract) => {
    const visitStatus = getAmcVisitStatus(contract);
    setDispatchModalContract(contract);
    setDispatchDate(visitStatus.nextVisitDate || new Date().toISOString().split('T')[0]);
    setDispatchTimeSlot('10:00 AM - 12:00 PM');
    setDispatchTechId(contract.assignedTechnicianId || technicians[0]?.id || 'user-tech-1');
    setDispatchNotes(contract.equipmentDetails ? `AMC Service for: ${contract.equipmentDetails}` : '');
    setDispatchSendWhatsApp(true);
  };

  // Submit single visit dispatch
  const handleConfirmSingleDispatch = () => {
    if (!dispatchModalContract) return;
    const contract = dispatchModalContract;
    const cust = customers.find((c) => c.id === contract.customerId);
    const tech = users.find((u) => u.id === dispatchTechId);

    const job = scheduleAmcVisit(contract.id, {
      scheduledDate: dispatchDate,
      scheduledTime: dispatchTimeSlot,
      technicianId: dispatchTechId,
      notes: dispatchNotes,
    });

    if (job && dispatchSendWhatsApp) {
      sendAmcVisitReminderWhatsApp(
        contract,
        cust,
        currentBusiness,
        dispatchDate,
        dispatchTimeSlot,
        tech?.name
      );
    }

    setDispatchModalContract(null);
  };

  // Open Batch Scheduler Modal
  const openBatchScheduler = () => {
    const ids = dueContracts.map((c) => c.id);
    setSelectedBatchContractIds(ids);

    // Seed default tech, date, slot maps
    const techMap: Record<string, string> = {};
    const dateMap: Record<string, string> = {};
    const slotMap: Record<string, string> = {};

    dueContracts.forEach((c) => {
      const vStatus = getAmcVisitStatus(c);
      techMap[c.id] = c.assignedTechnicianId || technicians[0]?.id || 'user-tech-1';
      dateMap[c.id] = vStatus.nextVisitDate || new Date().toISOString().split('T')[0];
      slotMap[c.id] = '10:00 AM - 12:00 PM';
    });

    setBatchTechMap(techMap);
    setBatchDateMap(dateMap);
    setBatchSlotMap(slotMap);
    setIsBatchSchedulerOpen(true);
  };

  // Submit Batch Auto-Schedule
  const handleExecuteBatchSchedule = () => {
    if (selectedBatchContractIds.length === 0) {
      showToast('Please select at least one contract to schedule.', 'error');
      return;
    }

    let successCount = 0;

    selectedBatchContractIds.forEach((id) => {
      const contract = contracts.find((c) => c.id === id);
      if (!contract) return;

      const job = scheduleAmcVisit(id, {
        scheduledDate: batchDateMap[id] || new Date().toISOString().split('T')[0],
        scheduledTime: batchSlotMap[id] || '10:00 AM - 12:00 PM',
        technicianId: batchTechMap[id] || contract.assignedTechnicianId,
        silentToast: true,
      });

      if (job) successCount++;
    });

    if (successCount > 0) {
      showToast(`Successfully dispatched ${successCount} AMC routine maintenance visits!`, 'success');
    }

    setIsBatchSchedulerOpen(false);
  };

  // Open Edit Contract Modal
  const openEditContract = (c: RecurringContract) => {
    setEditingContract(c);
    setFormName(c.name);
    setFormCustomerId(c.customerId);
    setFormContractAmount(c.contractAmount || 12000);
    setFormVisitFrequency(c.visitFrequency || 'quarterly');
    setFormVisitsAllowed(c.visitsAllowed || 4);
    setFormStartDate(c.startDate);
    setFormEndDate(c.endDate);
    setFormNextVisitDate(c.nextVisitDate || '');
    setFormEquipmentDetails(c.equipmentDetails || '');
    setFormAssignedTechId(c.assignedTechnicianId || '');
    setFormNotes(c.notes || '');
    setIsNewContractOpen(true);
  };

  // Reset & Open New Contract Modal
  const openNewContractModal = () => {
    setEditingContract(null);
    setFormName('');
    setFormCustomerId(customers[0]?.id || '');
    setFormContractAmount(12000);
    setFormVisitFrequency('quarterly');
    setFormVisitsAllowed(4);
    const today = new Date().toISOString().split('T')[0];
    setFormStartDate(today);
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    setFormEndDate(d.toISOString().split('T')[0]);
    setFormNextVisitDate(today);
    setFormEquipmentDetails('');
    setFormAssignedTechId(technicians[0]?.id || '');
    setFormNotes('');
    setIsNewContractOpen(true);
  };

  // Handle Frequency Change in Form (updates default visits)
  const handleFrequencyChange = (freq: VisitFrequency) => {
    setFormVisitFrequency(freq);
    switch (freq) {
      case 'monthly':
        setFormVisitsAllowed(12);
        break;
      case 'quarterly':
        setFormVisitsAllowed(4);
        break;
      case 'bi_annual':
        setFormVisitsAllowed(2);
        break;
      case 'annual':
        setFormVisitsAllowed(1);
        break;
    }
  };

  // Save Contract (Create or Update)
  const handleSaveContract = () => {
    if (!formCustomerId || !formName.trim()) {
      showToast('Please select a customer and enter a contract name.', 'error');
      return;
    }

    if (editingContract) {
      // Update existing contract
      updateContract(editingContract.id, {
        name: formName.trim(),
        customerId: formCustomerId,
        contractAmount: formContractAmount,
        visitFrequency: formVisitFrequency,
        visitsAllowed: formVisitsAllowed,
        visitsRemaining: Math.max(0, formVisitsAllowed - (editingContract.visitsUsed || 0)),
        startDate: formStartDate,
        endDate: formEndDate,
        renewalDate: formEndDate,
        nextVisitDate: formNextVisitDate || formStartDate,
        equipmentDetails: formEquipmentDetails.trim(),
        assignedTechnicianId: formAssignedTechId,
        notes: formNotes.trim(),
      });
    } else {
      // Create new contract
      addContract({
        customerId: formCustomerId,
        serviceId: 'srv-1',
        name: formName.trim(),
        contractAmount: formContractAmount,
        visitFrequency: formVisitFrequency,
        visitsAllowed: formVisitsAllowed,
        visitsUsed: 0,
        visitsRemaining: formVisitsAllowed,
        startDate: formStartDate,
        endDate: formEndDate,
        renewalDate: formEndDate,
        nextVisitDate: formNextVisitDate || formStartDate,
        equipmentDetails: formEquipmentDetails.trim(),
        assignedTechnicianId: formAssignedTechId,
        notes: formNotes.trim(),
        status: 'active',
      });
    }

    setIsNewContractOpen(false);
    setEditingContract(null);
  };

  // Seed Sample Contracts if empty
  const handleSeedDemoContracts = () => {
    const cust1 = customers[0]?.id || 'cust-1';
    const cust2 = customers[1]?.id || cust1;
    const cust3 = customers[2]?.id || cust1;

    const today = new Date();
    const pastDate = new Date();
    pastDate.setDate(today.getDate() - 3); // Overdue by 3 days
    const pastDateStr = pastDate.toISOString().split('T')[0];

    const todayStr = today.toISOString().split('T')[0];

    const futureExp = new Date();
    futureExp.setFullYear(today.getFullYear() + 1);
    const expStr = futureExp.toISOString().split('T')[0];

    const expiringEnd = new Date();
    expiringEnd.setDate(today.getDate() + 14); // Expiring in 14 days
    const expiringEndStr = expiringEnd.toISOString().split('T')[0];

    addContract({
      customerId: cust1,
      serviceId: 'srv-1',
      name: 'Comprehensive HVAC Annual Maintenance',
      contractAmount: 18500,
      visitFrequency: 'quarterly',
      visitsAllowed: 4,
      visitsUsed: 1,
      visitsRemaining: 3,
      startDate: '2026-01-15',
      endDate: expStr,
      renewalDate: expStr,
      nextVisitDate: pastDateStr, // Overdue visit
      equipmentDetails: 'Daikin 2.0T Inverter AC x 3, Voltas Cassette x 1',
      assignedTechnicianId: technicians[0]?.id || 'user-tech-1',
      status: 'active',
    });

    addContract({
      customerId: cust2,
      serviceId: 'srv-1',
      name: 'Commercial Water Purifier & RO System AMC',
      contractAmount: 12000,
      visitFrequency: 'bi_annual',
      visitsAllowed: 2,
      visitsUsed: 0,
      visitsRemaining: 2,
      startDate: todayStr,
      endDate: expStr,
      renewalDate: expStr,
      nextVisitDate: todayStr, // Due today
      equipmentDetails: 'Kent 50 LPH Industrial RO Plant + Pre-filtration Candle',
      assignedTechnicianId: technicians[1]?.id || technicians[0]?.id || 'user-tech-1',
      status: 'active',
    });

    addContract({
      customerId: cust3,
      serviceId: 'srv-1',
      name: 'Corporate Electrical Safety & DG Set Warranty',
      contractAmount: 35000,
      visitFrequency: 'monthly',
      visitsAllowed: 12,
      visitsUsed: 10,
      visitsRemaining: 2,
      startDate: '2025-09-15',
      endDate: expiringEndStr,
      renewalDate: expiringEndStr,
      nextVisitDate: todayStr,
      equipmentDetails: 'Kirloskar 40kVA Silent DG Genset + Schneider APFC Panel',
      assignedTechnicianId: technicians[0]?.id || 'user-tech-1',
      status: 'expiring_soon',
    });

    showToast('Loaded 3 realistic sample AMC contracts with scheduled visits!', 'success');
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              Contract Lifecycle & Auto-Scheduler Engine
            </span>
            {stats.visitsDueCount > 0 && (
              <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500 text-white shadow-xs animate-pulse">
                {stats.visitsDueCount} Visits Due
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Repeat className="w-6 h-6 text-indigo-600" /> AMC Maintenance & Warranty Tracker
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-2xl">
            Automated preventive visit scheduling, WhatsApp reminder bot, quota tracking, and 1-click batch maintenance dispatch.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {dueContracts.length > 0 && (
            <button
              onClick={openBatchScheduler}
              className="px-3.5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" /> Auto-Schedule Due ({dueContracts.length})
            </button>
          )}

          <button
            onClick={openNewContractModal}
            className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> New AMC Contract
          </button>
        </div>
      </div>

      {/* ⚡ High-Impact Due Maintenance Visits Banner */}
      {dueContracts.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-indigo-500/10 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-slate-900 p-4 sm:p-5 rounded-3xl border-2 border-amber-300 dark:border-amber-700/70 shadow-md flex flex-col gap-3.5 animate-in fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-md shadow-amber-500/30 shrink-0">
                <Wrench className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-black uppercase tracking-wider bg-amber-500 text-white px-2 py-0.5 rounded-full">
                    Action Required
                  </span>
                  <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100">
                    {dueContracts.length} Preventive Maintenance Visits Due / Overdue
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  Clients are scheduled for routine servicing under their AMC. Auto-generate service jobs and notify customers via WhatsApp.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                type="button"
                onClick={openBatchScheduler}
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                Review & Customize
              </button>
              <button
                type="button"
                onClick={() => batchScheduleDueAmcVisits()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs shadow-md shadow-amber-500/20 transition-all active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" /> 1-Click Auto-Dispatch All
              </button>
            </div>
          </div>

          {/* Quick List of Top 3 Due Contracts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
            {dueContracts.slice(0, 3).map((dueC) => {
              const cust = customers.find((c) => c.id === dueC.customerId);
              const vStatus = getAmcVisitStatus(dueC);

              return (
                <div
                  key={dueC.id}
                  className="p-3 rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-amber-200 dark:border-amber-900/60 shadow-xs flex flex-col justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] font-black text-indigo-600 dark:text-indigo-400">
                        {dueC.contractNumber}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${vStatus.badgeClass}`}>
                        {vStatus.statusLabel}
                      </span>
                    </div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 mt-1 line-clamp-1">
                      {cust?.name || 'Customer'}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                      {dueC.name} • Visit #{vStatus.visitNumber} of {dueC.visitsAllowed}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                    <button
                      type="button"
                      onClick={() => sendAmcVisitReminderWhatsApp(dueC, cust, currentBusiness)}
                      className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <MessageSquare className="w-3 h-3" /> WhatsApp
                    </button>

                    <button
                      type="button"
                      onClick={() => openSingleDispatchModal(dueC)}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] transition-colors cursor-pointer"
                    >
                      Dispatch Job →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Expiry & Due Status Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div
          onClick={() => setStatusFilter('all')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-500 shadow-xs ring-2 ring-indigo-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Total AMCs</span>
            <Repeat className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
            {contracts.length}
          </div>
          <div className="text-[11px] font-bold text-indigo-600 mt-0.5">
            {currentBusiness.currency}{stats.totalValue.toLocaleString()} Portfolio
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('due_visits')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'due_visits'
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 shadow-xs ring-2 ring-amber-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-amber-600">
            <span>Visits Due Now</span>
            <Wrench className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-600 mt-1">
            {stats.visitsDueCount}
          </div>
          <div className="text-[11px] font-medium text-slate-500 mt-0.5">
            Preventive Maintenance
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('expiring')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'expiring'
              ? 'bg-orange-50 dark:bg-orange-950/40 border-orange-500 shadow-xs ring-2 ring-orange-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-orange-600">
            <span>Expiring &lt;30d</span>
            <AlertTriangle className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-orange-600 mt-1">
            {stats.expiringCount}
          </div>
          <div className="text-[11px] font-medium text-slate-500 mt-0.5">
            Renewals Pending
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
            Re-contract Required
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
            <span>Active & Healthy</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 mt-1">
            {stats.activeCount}
          </div>
          <div className="text-[11px] font-medium text-slate-500 mt-0.5">
            Coverage Good
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search AMC, Contract #, Customer, Equipment..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {(
            [
              { id: 'all', label: 'All Contracts' },
              { id: 'due_visits', label: `Visits Due (${stats.visitsDueCount})` },
              { id: 'expiring', label: `Expiring Soon (${stats.expiringCount})` },
              { id: 'active', label: 'Active' },
              { id: 'expired', label: 'Expired' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contracts Grid / Mobile List */}
      <div>
        {filteredContracts.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400 space-y-3">
            <Repeat className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
            <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
              No AMC contracts found matching your filters
            </div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Create your first AMC contract or load sample data to test the preventive visit scheduler and WhatsApp reminder bot.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              {contracts.length === 0 && (
                <button
                  type="button"
                  onClick={handleSeedDemoContracts}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs cursor-pointer"
                >
                  Load Sample Contracts
                </button>
              )}
              <button
                type="button"
                onClick={openNewContractModal}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 inline mr-1" /> Create AMC Contract
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* 1. Mobile Compact Cards (md:hidden) - Ultra-compact, clean, perfectly aligned */}
            <div className="md:hidden space-y-2">
              {filteredContracts.map((contract) => {
                const customer = (customers || []).find((c) => c.id === contract.customerId);
                const daysLeft = getDaysRemaining(contract.endDate);
                const isExpired = daysLeft < 0;
                const isExpiringSoon = daysLeft >= 0 && daysLeft <= 30;
                const visitStatus = getAmcVisitStatus(contract);
                const isMenuOpen = openMenuId === contract.id;

                return (
                  <div
                    key={contract.id}
                    onClick={() => openEditContract(contract)}
                    className={`p-3 rounded-2xl bg-white dark:bg-slate-900 border transition-all cursor-pointer space-y-2 active:scale-[0.99] relative shadow-2xs ${
                      visitStatus.isOverdue
                        ? 'border-rose-300 dark:border-rose-900/60'
                        : visitStatus.isDueSoon
                        ? 'border-amber-300 dark:border-amber-900/60'
                        : 'border-slate-200/80 dark:border-slate-800'
                    }`}
                  >
                    {/* Top Row: Fixed height h-7 for exact vertical center alignment */}
                    <div className="h-7 flex items-center justify-between gap-1.5 min-w-0">
                      {/* Left: Contract # + Frequency + Visit Status */}
                      <div className="flex items-center gap-1.5 min-w-0 flex-1 h-7">
                        <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 font-mono truncate">
                          {contract.contractNumber}
                        </span>
                        <span className="h-5 inline-flex items-center px-1.5 rounded-md text-[9px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                          {contract.visitFrequency}
                        </span>
                        <span className={`h-5 inline-flex items-center px-2 rounded-md text-[9.5px] font-black uppercase shrink-0 border ${visitStatus.badgeClass}`}>
                          {visitStatus.statusLabel}
                        </span>
                        {isExpired && (
                          <span className="h-5 inline-flex items-center px-1.5 rounded-md text-[9px] font-black uppercase shrink-0 bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                            Expired
                          </span>
                        )}
                      </div>

                      {/* Right: Contract Amount + 3-Dot Action Menu */}
                      <div className="flex items-center gap-1.5 shrink-0 h-7">
                        <span className="h-5 inline-flex items-center text-xs font-mono font-black text-slate-800 dark:text-slate-200">
                          {currentBusiness.currency}{contract.contractAmount || 0}
                        </span>

                        {/* 3-Dot Action Menu */}
                        <div className="relative shrink-0 flex items-center justify-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(isMenuOpen ? null : contract.id);
                            }}
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                            aria-label="Contract options"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>

                          {isMenuOpen && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-0 top-8 z-30 w-52 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1 animate-in fade-in zoom-in-95 text-xs text-slate-700 dark:text-slate-200"
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  sendAmcVisitReminderWhatsApp(contract, customer, currentBusiness);
                                  showToast(`WhatsApp reminder prepared for ${customer?.name || 'customer'}`, 'success');
                                }}
                                className="w-full px-3.5 py-2 text-left hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-2"
                              >
                                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                                <span>WhatsApp Visit Reminder</span>
                              </button>

                              {contract.visitsRemaining > 0 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    openSingleDispatchModal(contract);
                                  }}
                                  className="w-full px-3.5 py-2 text-left hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-2"
                                >
                                  <Wrench className="w-3.5 h-3.5 text-indigo-600" />
                                  <span>Dispatch Next Visit</span>
                                </button>
                              )}

                              {(isExpiringSoon || isExpired) && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    sendContractRenewalWhatsApp(contract, customer, currentBusiness);
                                    showToast(`WhatsApp renewal reminder sent to ${customer?.name || 'customer'}`, 'success');
                                  }}
                                  className="w-full px-3.5 py-2 text-left hover:bg-orange-50 dark:hover:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-bold flex items-center gap-2"
                                >
                                  <Repeat className="w-3.5 h-3.5 text-orange-600" />
                                  <span>Send Renewal Quote</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  openEditContract(contract);
                                }}
                                className="w-full px-3.5 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700/60 font-semibold flex items-center gap-2"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                                <span>Edit AMC Details</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  if (window.confirm(`Are you sure you want to remove contract ${contract.contractNumber}?`)) {
                                    deleteContract(contract.id);
                                  }
                                }}
                                className="w-full px-3.5 py-2 text-left hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-2"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                <span>Delete Contract</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Row 2: Customer Name + Plan */}
                    <div className="flex items-center justify-between text-xs min-w-0">
                      <span className="font-extrabold text-slate-800 dark:text-slate-200 truncate">
                        {customer?.name || 'Customer'}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[50%] shrink-0 ml-2">
                        {contract.name}
                      </span>
                    </div>

                    {/* Row 3: Visits Quota & Next Visit Date */}
                    <div className="pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span>Visits: {contract.visitsUsed}/{contract.visitsAllowed} done ({contract.visitsRemaining} left)</span>
                      </div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        Next: {visitStatus.nextVisitDate || '-'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 2. Desktop Expanded Grid View (hidden md:grid) */}
            <div className="hidden md:grid md:grid-cols-2 gap-4">
              {filteredContracts.map((contract) => {
                const customer = (customers || []).find((c) => c.id === contract.customerId);
                const assignedTech = (users || []).find((u) => u.id === contract.assignedTechnicianId);
                const percentUsed = (contract.visitsUsed / contract.visitsAllowed) * 100;
                const daysLeft = getDaysRemaining(contract.endDate);
                const isExpired = daysLeft < 0;
                const isExpiringSoon = daysLeft >= 0 && daysLeft <= 30;
                const visitStatus = getAmcVisitStatus(contract);
                const milestones = generateVisitScheduleMilestones(contract);

                return (
                  <div
                    key={contract.id}
                    className={`p-5 rounded-3xl bg-white dark:bg-slate-900 border transition-all flex flex-col justify-between space-y-4 shadow-xs ${
                      visitStatus.isOverdue
                        ? 'border-rose-300 dark:border-rose-900/60 ring-2 ring-rose-500/20'
                        : visitStatus.isDueSoon
                        ? 'border-amber-300 dark:border-amber-900/60 ring-2 ring-amber-500/20'
                        : isExpiringSoon
                        ? 'border-orange-300 dark:border-orange-900/60'
                        : 'border-slate-200/80 dark:border-slate-800'
                    }`}
                  >
                    <div>
                      {/* Top Bar: Contract # & Badges */}
                      <div className="flex items-center justify-between mb-2 flex-wrap gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-indigo-600 font-mono">
                            {contract.contractNumber}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 capitalize">
                            {contract.visitFrequency}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border uppercase ${visitStatus.badgeClass}`}>
                            {visitStatus.statusLabel}
                          </span>

                          {isExpired ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                              Expired
                            </span>
                          ) : isExpiringSoon ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300">
                              {daysLeft}d left
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {/* Plan Name & Customer */}
                      <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                        {contract.name}
                      </h3>

                      <div className="flex items-center justify-between text-xs font-semibold text-indigo-600 mt-1 flex-wrap gap-1">
                        <span>
                          {customer?.name} {customer?.companyName ? `(${customer.companyName})` : ''}
                        </span>
                        {customer?.mobile && (
                          <a
                            href={`tel:${customer.mobile}`}
                            className="text-[11px] text-slate-500 hover:text-indigo-600 flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3" /> {customer.mobile}
                          </a>
                        )}
                      </div>

                      {/* Equipment / Machine Details */}
                      {contract.equipmentDetails && (
                        <div className="mt-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-[11px] text-slate-700 dark:text-slate-300 flex items-start gap-1.5">
                          <Cpu className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{contract.equipmentDetails}</span>
                        </div>
                      )}

                      {/* Progress bar of visits */}
                      <div className="mt-3.5 space-y-1.5">
                        <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-400">
                          <span>Maintenance Visits Quota</span>
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            {contract.visitsUsed} of {contract.visitsAllowed} rendered ({contract.visitsRemaining} remaining)
                          </span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-600 rounded-full transition-all"
                            style={{ width: `${Math.min(100, percentUsed)}%` }}
                          />
                        </div>
                      </div>

                      {/* Visual Milestones / Steps */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                          Preventive Visit Milestones
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                          {milestones.map((m) => (
                            <div
                              key={m.visitNumber}
                              className={`p-1.5 rounded-lg border text-center transition-all ${
                                m.status === 'completed'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                                  : m.status === 'due' || m.status === 'overdue'
                                  ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 font-bold'
                                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-500'
                              }`}
                            >
                              <div className="flex items-center justify-center gap-1 text-[10px]">
                                {m.status === 'completed' ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : m.status === 'due' || m.status === 'overdue' ? (
                                  <Wrench className="w-3 h-3 text-amber-600" />
                                ) : (
                                  <Calendar className="w-3 h-3 text-slate-400" />
                                )}
                                <span className="font-bold">V{m.visitNumber}</span>
                              </div>
                              <div className="text-[9px] truncate mt-0.5">{m.date}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Footer Details & Action Buttons */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <div className="text-[10px] text-slate-400">Coverage Period</div>
                          <div className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">
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

                      {assignedTech && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                          <HardHat className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Preferred Tech: <strong className="text-slate-700 dark:text-slate-300">{assignedTech.name}</strong></span>
                        </div>
                      )}

                      {/* Action Buttons: WhatsApp Reminder & Dispatch Next Visit */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            sendAmcVisitReminderWhatsApp(contract, customer, currentBusiness);
                            showToast(`WhatsApp reminder prepared for ${customer?.name || 'customer'}`, 'success');
                          }}
                          className="px-2.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
                          title="Send WhatsApp Preventive Maintenance Alert"
                        >
                          <MessageSquare className="w-3.5 h-3.5" /> Visit Reminder
                        </button>

                        <button
                          type="button"
                          onClick={() => openSingleDispatchModal(contract)}
                          disabled={contract.visitsRemaining <= 0}
                          className={`px-2.5 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer ${
                            contract.visitsRemaining > 0
                              ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          <Wrench className="w-3.5 h-3.5" /> Dispatch Visit
                        </button>
                      </div>

                      {/* Secondary Row: WhatsApp Renewal & Edit/Delete */}
                      <div className="flex items-center justify-between pt-1 text-xs">
                        {(isExpiringSoon || isExpired) ? (
                          <button
                            type="button"
                            onClick={() => {
                              sendContractRenewalWhatsApp(contract, customer, currentBusiness);
                              showToast(`WhatsApp renewal reminder sent to ${customer?.name || 'customer'}`, 'success');
                            }}
                            className="text-[11px] font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
                          >
                            <Repeat className="w-3 h-3" /> Send Renewal Quote
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400">
                            Next Due: <strong className="text-slate-700 dark:text-slate-300">{visitStatus.nextVisitDate}</strong>
                          </span>
                        )}

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditContract(contract)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
                            title="Edit Contract"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to remove contract ${contract.contractNumber}?`)) {
                                deleteContract(contract.id);
                              }
                            }}
                            className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Delete Contract"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 🚀 MODAL: Single Visit Dispatch Popover */}
      {/* ========================================================================= */}
      {dispatchModalContract && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                    Dispatch AMC Maintenance Visit
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {dispatchModalContract.contractNumber} • Visit #{(dispatchModalContract.visitsUsed || 0) + 1} of {dispatchModalContract.visitsAllowed}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDispatchModalContract(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 flex items-start gap-3">
                <div className="text-indigo-600 mt-0.5">
                  <Repeat className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-slate-100">
                    {dispatchModalContract.name}
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                    Customer: <strong>{customers.find((c) => c.id === dispatchModalContract.customerId)?.name}</strong>
                  </div>
                  {dispatchModalContract.equipmentDetails && (
                    <div className="text-[11px] text-indigo-700 dark:text-indigo-300 font-medium mt-1">
                      Equipment: {dispatchModalContract.equipmentDetails}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Scheduled Visit Date *</label>
                  <input
                    type="date"
                    value={dispatchDate}
                    onChange={(e) => setDispatchDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1">Preferred Time Slot *</label>
                  <select
                    value={dispatchTimeSlot}
                    onChange={(e) => setDispatchTimeSlot(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-medium"
                  >
                    <option value="10:00 AM - 12:00 PM">Morning (10 AM - 12 PM)</option>
                    <option value="12:00 PM - 03:00 PM">Afternoon (12 PM - 3 PM)</option>
                    <option value="03:00 PM - 06:00 PM">Evening (3 PM - 6 PM)</option>
                    <option value="Flexible All Day">Flexible All Day</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Assign Field Technician *</label>
                <select
                  value={dispatchTechId}
                  onChange={(e) => setDispatchTechId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-medium"
                >
                  <option value="">Select Technician...</option>
                  {technicians.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.role}) - {t.phone || 'No phone'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold block mb-1">Visit / Equipment Notes</label>
                <textarea
                  rows={2}
                  placeholder="Special instructions for service engineer..."
                  value={dispatchNotes}
                  onChange={(e) => setDispatchNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-medium"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="sendWhatsAppCheck"
                  checked={dispatchSendWhatsApp}
                  onChange={(e) => setDispatchSendWhatsApp(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="sendWhatsAppCheck" className="font-medium text-slate-700 dark:text-slate-300 select-none cursor-pointer">
                  Send WhatsApp Visit Reminder alert to customer immediately
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setDispatchModalContract(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSingleDispatch}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Wrench className="w-3.5 h-3.5" /> Confirm & Dispatch Job
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🚀 MODAL: Batch Auto-Scheduler & Reminder Bot */}
      {/* ========================================================================= */}
      {isBatchSchedulerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                    Batch AMC Auto-Scheduler & Reminder Bot
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Select due contracts to dispatch maintenance jobs and notify customers simultaneously
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBatchSchedulerOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-between text-xs py-1 px-1 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  if (selectedBatchContractIds.length === dueContracts.length) {
                    setSelectedBatchContractIds([]);
                  } else {
                    setSelectedBatchContractIds(dueContracts.map((c) => c.id));
                  }
                }}
                className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                {selectedBatchContractIds.length === dueContracts.length ? 'Deselect All' : 'Select All Due Contracts'}
              </button>
              <span className="font-bold text-slate-700 dark:text-slate-300">
                {selectedBatchContractIds.length} of {dueContracts.length} selected
              </span>
            </div>

            {/* List of Due Contracts */}
            <div className="overflow-y-auto space-y-2.5 flex-1 pr-1 text-xs">
              {dueContracts.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  No maintenance visits are currently due.
                </div>
              ) : (
                dueContracts.map((c) => {
                  const cust = customers.find((cust) => cust.id === c.customerId);
                  const isSelected = selectedBatchContractIds.includes(c.id);
                  const vStatus = getAmcVisitStatus(c);

                  return (
                    <div
                      key={c.id}
                      className={`p-3.5 rounded-2xl border transition-all space-y-2.5 ${
                        isSelected
                          ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedBatchContractIds((prev) => [...prev, c.id]);
                              } else {
                                setSelectedBatchContractIds((prev) => prev.filter((id) => id !== c.id));
                              }
                            }}
                            className="w-4 h-4 mt-0.5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-indigo-600">{c.contractNumber}</span>
                              <span className={`text-[10px] px-2 py-0.2 rounded-full border ${vStatus.badgeClass}`}>
                                {vStatus.statusLabel}
                              </span>
                            </div>
                            <h4 className="font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                              {c.name}
                            </h4>
                            <div className="text-slate-600 dark:text-slate-300">
                              Client: <strong>{cust?.name}</strong> • Visit #{vStatus.visitNumber} of {c.visitsAllowed}
                            </div>
                            {c.equipmentDetails && (
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                Units: {c.equipmentDetails}
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => sendAmcVisitReminderWhatsApp(c, cust, currentBusiness)}
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-2xs shrink-0 cursor-pointer"
                        >
                          <MessageSquare className="w-3 h-3" /> WhatsApp Reminder
                        </button>
                      </div>

                      {/* Editable Date, Slot & Tech */}
                      {isSelected && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Date</label>
                            <input
                              type="date"
                              value={batchDateMap[c.id] || vStatus.nextVisitDate}
                              onChange={(e) =>
                                setBatchDateMap((prev) => ({ ...prev, [c.id]: e.target.value }))
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg border bg-white dark:bg-slate-800 text-xs font-medium"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Slot</label>
                            <select
                              value={batchSlotMap[c.id] || '10:00 AM - 12:00 PM'}
                              onChange={(e) =>
                                setBatchSlotMap((prev) => ({ ...prev, [c.id]: e.target.value }))
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg border bg-white dark:bg-slate-800 text-xs font-medium"
                            >
                              <option value="10:00 AM - 12:00 PM">Morning (10-12)</option>
                              <option value="12:00 PM - 03:00 PM">Afternoon (12-3)</option>
                              <option value="03:00 PM - 06:00 PM">Evening (3-6)</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Technician</label>
                            <select
                              value={batchTechMap[c.id] || c.assignedTechnicianId || technicians[0]?.id || ''}
                              onChange={(e) =>
                                setBatchTechMap((prev) => ({ ...prev, [c.id]: e.target.value }))
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg border bg-white dark:bg-slate-800 text-xs font-medium"
                            >
                              {technicians.map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t">
              <button
                type="button"
                onClick={() => setIsBatchSchedulerOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleExecuteBatchSchedule}
                disabled={selectedBatchContractIds.length === 0}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-black text-xs shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" /> Batch Dispatch {selectedBatchContractIds.length} Due Jobs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🚀 MODAL: Create / Edit AMC Contract */}
      {/* ========================================================================= */}
      {isNewContractOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Repeat className="w-4 h-4 text-indigo-600" />
                {editingContract ? 'Edit AMC Contract' : 'Create New AMC Contract'}
              </h3>
              <button
                onClick={() => setIsNewContractOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Select Customer *</label>
                <select
                  value={formCustomerId}
                  onChange={(e) => setFormCustomerId(e.target.value)}
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
                <label className="font-bold block mb-1">Contract / Plan Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Comprehensive HVAC Annual Maintenance"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Covered Equipment / Units</label>
                <input
                  type="text"
                  placeholder="e.g. Daikin 1.5T Split AC x 2, Blue Star Cassette x 1"
                  value={formEquipmentDetails}
                  onChange={(e) => setFormEquipmentDetails(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block mb-1">Visit Frequency</label>
                  <select
                    value={formVisitFrequency}
                    onChange={(e) => handleFrequencyChange(e.target.value as VisitFrequency)}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-medium capitalize"
                  >
                    <option value="monthly">Monthly (12 visits/yr)</option>
                    <option value="quarterly">Quarterly (4 visits/yr)</option>
                    <option value="bi_annual">Bi-Annual (2 visits/yr)</option>
                    <option value="annual">Annual (1 visit/yr)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold block mb-1">Total Visits Allowed</label>
                  <input
                    type="number"
                    value={formVisitsAllowed}
                    onChange={(e) => setFormVisitsAllowed(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block mb-1">Contract Amount ({currentBusiness.currency})</label>
                  <input
                    type="number"
                    value={formContractAmount}
                    onChange={(e) => setFormContractAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1">Preferred Technician</label>
                  <select
                    value={formAssignedTechId}
                    onChange={(e) => setFormAssignedTechId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-medium"
                  >
                    <option value="">Default Assignee...</option>
                    {technicians.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold block mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">First Visit Due</label>
                  <input
                    type="date"
                    value={formNextVisitDate}
                    onChange={(e) => setFormNextVisitDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Notes / Terms</label>
                <textarea
                  rows={2}
                  placeholder="Terms, exclusions, emergency breakdown coverage terms..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-medium"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setIsNewContractOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveContract}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md cursor-pointer"
              >
                {editingContract ? 'Update Contract' : 'Save AMC Contract'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

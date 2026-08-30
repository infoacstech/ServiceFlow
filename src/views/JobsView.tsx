import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Job, JobPriority, JobStatus } from '../types';
import { DateRangePicker, DateRange, getPresetDates, getLocalDateString, formatDateDisplay } from '../components/DateRangePicker';
import { VoiceNotesRecorder } from '../components/VoiceNotesRecorder';
import { JobServiceProgressBar } from '../components/JobServiceProgressBar';
import { CustomerSearchSelect } from '../components/CustomerSearchSelect';
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  MapPin,
  UserCheck,
  AlertCircle,
  X,
  CheckCircle2,
  Phone,
  LayoutGrid,
  List,
  Eye,
  Volume2,
  Navigation,
  MessageSquare,
  Send,
  TrendingUp,
  Coins,
  Share2,
  History,
  Sparkles,
} from 'lucide-react';
import { playJobVoiceNotification, speakText } from '../utils/audioNotification';
import {
  sendJobDispatchToTechnician,
  sendTechnicianOnTheWayAlert,
  sendJobCompletionSummaryToCustomer,
} from '../utils/whatsappHelper';

export interface JobInitialFilter {
  datePreset?: string;
  statusFilter?: string;
  priorityFilter?: string;
}

export const TIME_SLOT_PRESETS = [
  '09:00 AM - 11:00 AM (Morning 1)',
  '11:00 AM - 01:00 PM (Morning 2)',
  '01:00 PM - 03:00 PM (Afternoon 1)',
  '03:00 PM - 05:00 PM (Afternoon 2)',
  '05:00 PM - 07:00 PM (Evening)',
  '07:00 PM - 09:00 PM (Night / Emergency)',
];

interface JobsViewProps {
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (v: boolean) => void;
  initialFilter?: JobInitialFilter | null;
}

export const JobsView: React.FC<JobsViewProps> = ({
  isCreateModalOpen,
  setIsCreateModalOpen,
  initialFilter,
}) => {
  const {
    jobs,
    customers,
    services,
    staff,
    inventory,
    addJob,
    addCustomer,
    addService,
    updateJobStatus,
    currentBusiness,
    showToast,
  } = useApp();

  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialFilter?.statusFilter || 'all');
  const [priorityFilter, setPriorityFilter] = useState<string>(initialFilter?.priorityFilter || 'all');
  const [staffFilter, setStaffFilter] = useState<string>('all');
  
  // Requirement: Jobs page open hote hi DEFAULT mein sirf TODAY ki jobs show honi chahiye.
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    if (initialFilter?.datePreset) {
      return getPresetDates(initialFilter.datePreset);
    }
    return getPresetDates('today');
  });

  useEffect(() => {
    if (initialFilter) {
      if (initialFilter.statusFilter !== undefined) {
        setStatusFilter(initialFilter.statusFilter);
      }
      if (initialFilter.priorityFilter !== undefined) {
        setPriorityFilter(initialFilter.priorityFilter);
      }
      if (initialFilter.datePreset) {
        setDateRange(getPresetDates(initialFilter.datePreset));
      }
    }
  }, [initialFilter]);

  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  // Customer & Staff Lookups for fast filtering and matching
  const customerMap = useMemo(() => {
    const map = new Map<string, (typeof customers)[0]>();
    (customers || []).forEach((c) => map.set(c.id, c));
    return map;
  }, [customers]);

  const staffMap = useMemo(() => {
    const map = new Map<string, (typeof staff)[0]>();
    (staff || []).forEach((s) => map.set(s.id, s));
    return map;
  }, [staff]);

  // Lock body scroll and touch behavior when modals are open
  useEffect(() => {
    if (isCreateModalOpen || selectedJob) {
      const originalOverflow = document.body.style.overflow;
      const originalTouchAction = document.body.style.touchAction;
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      return () => {
        document.body.style.overflow = originalOverflow || '';
        document.body.style.touchAction = originalTouchAction || '';
      };
    }
  }, [isCreateModalOpen, selectedJob]);

  // New Job Form State
  const [newJobData, setNewJobData] = useState({
    customerId: customers?.[0]?.id || '',
    serviceId: services?.[0]?.id || '',
    description: services?.[0]?.name || '',
    priority: 'medium' as JobPriority,
    assignedStaffId: (staff || []).find((s) => s.role === 'technician')?.id || '',
    scheduledDate: getLocalDateString(),
    scheduledTime: '09:00 AM - 11:00 AM',
    location: customers?.[0]?.address ? `${customers[0].address}, ${customers[0].city || ''}`.trim() : '',
    estimatedAmount: services?.[0]?.price ?? 1500,
    status: 'assigned' as JobStatus,
  });

  // Quick Customer Creation Mode within Job Wizard
  const [isQuickAddCustomer, setIsQuickAddCustomer] = useState(false);
  const [quickCustomer, setQuickCustomer] = useState({
    name: '',
    mobile: '',
    address: '',
    city: currentBusiness.city || 'Mumbai',
    companyName: '',
  });

  // Keep newJobData synchronized when modal opens or lists load
  useEffect(() => {
    if (isCreateModalOpen) {
      if (!newJobData.customerId && customers.length > 0) {
        const firstCust = customers[0];
        setNewJobData((prev) => ({
          ...prev,
          customerId: firstCust.id,
          location: prev.location || `${firstCust.address || ''}, ${firstCust.city || ''}`.trim() || 'Site Address',
        }));
      }
      if (!newJobData.serviceId && services.length > 0) {
        const firstSrv = services[0];
        setNewJobData((prev) => ({
          ...prev,
          serviceId: firstSrv.id,
          description: prev.description || firstSrv.name,
          estimatedAmount: prev.estimatedAmount !== undefined && prev.estimatedAmount > 0 ? prev.estimatedAmount : (firstSrv.price || 1500),
        }));
      }
      if (!newJobData.assignedStaffId && staff.length > 0) {
        const firstTech = staff.find((s) => s.role === 'technician') || staff[0];
        if (firstTech) {
          setNewJobData((prev) => ({
            ...prev,
            assignedStaffId: firstTech.id,
          }));
        }
      }
    }
  }, [isCreateModalOpen, customers, services, staff]);

  const statuses: JobStatus[] = [
    'new',
    'assigned',
    'accepted',
    'on_the_way',
    'started',
    'in_progress',
    'completed',
    'verified',
    'closed',
  ];

  /**
   * Determine the effective date of a job:
   * - If completed/verified/closed and has completionTime, use the date it was completed.
   * - Otherwise use scheduledDate or createdAt.
   */
  const getJobEffectiveDate = (job: Job): string => {
    if ((job.status === 'completed' || job.status === 'closed' || job.status === 'verified')) {
      const compTime = job.completionTime || (job as any).completedAt;
      if (compTime) {
        try {
          const compDate = new Date(compTime);
          if (!isNaN(compDate.getTime())) {
            return getLocalDateString(compDate);
          }
        } catch {
          // ignore and fallback
        }
      }
    }
    if (job.scheduledDate) {
      if (job.scheduledDate.includes('T')) {
        try {
          const d = new Date(job.scheduledDate);
          if (!isNaN(d.getTime())) return getLocalDateString(d);
        } catch {
          // ignore
        }
      }
      return job.scheduledDate.slice(0, 10);
    }
    if ((job as any).date) {
      const dStr = String((job as any).date);
      if (dStr.includes('T')) {
        try {
          const d = new Date(dStr);
          if (!isNaN(d.getTime())) return getLocalDateString(d);
        } catch {
          // ignore
        }
      }
      return dStr.slice(0, 10);
    }
    if (job.createdAt) {
      try {
        const d = new Date(job.createdAt);
        if (!isNaN(d.getTime())) {
          return getLocalDateString(d);
        }
      } catch {
        // ignore
      }
      return job.createdAt.slice(0, 10);
    }
    return getLocalDateString();
  };

  /**
   * Matches search across Job ID, customer name, customer mobile/phone, description, technician, location
   */
  const isJobMatchingSearch = (job: Job, query: string): boolean => {
    if (!query) return true;
    const q = query.trim().toLowerCase();
    const rawDigits = q.replace(/[^0-9]/g, '');

    if ((job.jobId || '').toLowerCase().includes(q)) return true;
    if ((job.description || '').toLowerCase().includes(q)) return true;
    if ((job.location || '').toLowerCase().includes(q)) return true;

    const cust = job.customerId ? customerMap.get(job.customerId) : undefined;
    if (cust) {
      if ((cust.name || '').toLowerCase().includes(q)) return true;
      if (cust.companyName && (cust.companyName || '').toLowerCase().includes(q)) return true;
      if (cust.mobile) {
        const mobileClean = cust.mobile.replace(/[^0-9]/g, '');
        if (rawDigits && mobileClean.includes(rawDigits)) return true;
        if (cust.mobile.toLowerCase().includes(q)) return true;
      }
      if (cust.whatsapp) {
        const waClean = cust.whatsapp.replace(/[^0-9]/g, '');
        if (rawDigits && waClean.includes(rawDigits)) return true;
        if (cust.whatsapp.toLowerCase().includes(q)) return true;
      }
      if (cust.address && cust.address.toLowerCase().includes(q)) return true;
      if (cust.city && cust.city.toLowerCase().includes(q)) return true;
    }

    const tech = job.assignedStaffId ? staffMap.get(job.assignedStaffId) : undefined;
    if (tech) {
      if ((tech.name || '').toLowerCase().includes(q)) return true;
      if (tech.phone && rawDigits && tech.phone.replace(/[^0-9]/g, '').includes(rawDigits)) return true;
    }

    return false;
  };

  /**
   * Date range filter check
   */
  const isJobInSelectedDateRange = (job: Job, range: DateRange): boolean => {
    if (!range.startDate && !range.endDate) return true; // All time
    const jobDate = getJobEffectiveDate(job);
    if (range.startDate && jobDate < range.startDate) return false;
    if (range.endDate && jobDate > range.endDate) return false;
    return true;
  };

  // Filtered jobs list based on active filters
  const filteredJobs = useMemo(() => {
    return (jobs || []).filter((j) => {
      const matchesSearch = isJobMatchingSearch(j, search);
      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'pending_active'
          ? j.status !== 'completed' && j.status !== 'closed' && j.status !== 'cancelled'
          : j.status === statusFilter;
      const matchesPriority =
        priorityFilter === 'all'
          ? true
          : priorityFilter === 'urgent_high'
          ? j.priority === 'urgent' || j.priority === 'high'
          : j.priority === priorityFilter;
      const matchesStaff = staffFilter === 'all' || j.assignedStaffId === staffFilter;
      const matchesDate = isJobInSelectedDateRange(j, dateRange);

      return matchesSearch && matchesStatus && matchesPriority && matchesStaff && matchesDate;
    });
  }, [jobs, search, statusFilter, priorityFilter, staffFilter, dateRange, customerMap, staffMap]);

  // Count matches in entire history when search is non-empty
  const allHistoryMatchCount = useMemo(() => {
    if (!search.trim()) return 0;
    return (jobs || []).filter((j) => isJobMatchingSearch(j, search)).length;
  }, [jobs, search, customerMap, staffMap]);

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();

    let targetCustomerId = newJobData.customerId;
    let targetLocation = newJobData.location;

    // If Quick Add Customer mode is active
    if (isQuickAddCustomer) {
      if (!quickCustomer.name.trim() || !quickCustomer.mobile.trim()) {
        showToast('Please enter customer name and mobile number', 'error');
        return;
      }

      const createdCustomer = addCustomer({
        name: quickCustomer.name.trim(),
        mobile: quickCustomer.mobile.trim(),
        address: quickCustomer.address.trim() || 'Site Address',
        city: quickCustomer.city.trim() || currentBusiness.city || 'Mumbai',
        state: currentBusiness.state || 'Maharashtra',
        pin: currentBusiness.pin || '400001',
        companyName: quickCustomer.companyName.trim() || undefined,
        customerType: quickCustomer.companyName.trim() ? 'commercial' : 'individual',
      });

      if (createdCustomer && createdCustomer.id) {
        targetCustomerId = createdCustomer.id;
        targetLocation = `${quickCustomer.address || ''}, ${quickCustomer.city || ''}`.trim() || 'Site Address';
      }
    }

    if (!targetCustomerId) {
      showToast('Please select an existing customer or create a new customer', 'error');
      return;
    }

    if (!newJobData.serviceId && !newJobData.description.trim()) {
      showToast('Please select a service or enter job instructions', 'error');
      return;
    }

    if (!newJobData.description.trim()) {
      showToast('Please describe the work / instructions for the technician', 'error');
      return;
    }

    const parsedAmount = typeof newJobData.estimatedAmount === 'number'
      ? Math.max(0, newJobData.estimatedAmount)
      : Math.max(0, parseFloat(String(newJobData.estimatedAmount)) || 0);

    addJob({
      ...newJobData,
      customerId: targetCustomerId,
      location: targetLocation || newJobData.location || 'Site Location',
      estimatedAmount: parsedAmount,
    });

    showToast('Job scheduled and assigned successfully!', 'success');
    setIsCreateModalOpen(false);
    setIsQuickAddCustomer(false);
    setQuickCustomer({
      name: '',
      mobile: '',
      address: '',
      city: currentBusiness.city || 'Mumbai',
      companyName: '',
    });
  };

  return (
    <div className="space-y-3.5 sm:space-y-4 pb-8 animate-in fade-in">
      {/* Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 px-4 py-3.5 sm:px-5 sm:py-4 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100/60 dark:border-indigo-900/40 shadow-2xs">
            <Briefcase className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2 tracking-tight">
              Job Management Board <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full font-mono">({jobs.length})</span>
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
              Dispatch field technicians, track multi-stage status, & capture site reports
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('board')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'board'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Board</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex-1 sm:flex-none justify-center flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Job</span>
          </button>
        </div>
      </div>

      {/* Compact Mobile-First Filters Section */}
      <div className="flex flex-col gap-2">
        {/* 1. Date Filter Row - Single Horizontal Scrollable Row */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5 w-full flex-nowrap">
          {[
            { id: 'today', label: 'Today' },
            { id: 'last_7_days', label: 'Last 7 Days' },
            { id: 'this_month', label: 'This Month' },
            { id: 'all', label: 'All History' },
          ].map((preset) => {
            const isActive = dateRange.preset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => setDateRange(getPresetDates(preset.id))}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200/90 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {preset.label}
              </button>
            );
          })}

          <div className="shrink-0">
            <DateRangePicker value={dateRange} onChange={setDateRange} align="right" />
          </div>
        </div>

        {/* 2. Full Width Search Bar */}
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Job ID, Customer Name, Mobile Number, Service..."
            className="w-full pl-9 pr-8 py-2 bg-white dark:bg-slate-900 rounded-xl font-medium text-slate-800 dark:text-slate-200 placeholder:text-slate-400 border border-slate-200/90 dark:border-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-xs shadow-2xs"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 3. Status, Priority & Staff Filter Row - Single Horizontal Scrollable Row */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none pb-0.5 w-full flex-nowrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 cursor-pointer shadow-2xs transition-all ${
              statusFilter !== 'all'
                ? 'bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-500 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-500/30'
                : 'bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <option value="all">All Statuses</option>
            <option value="pending_active">Pending / Active</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s.replace('_', ' ').toUpperCase()}
              </option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 cursor-pointer shadow-2xs transition-all ${
              priorityFilter !== 'all'
                ? 'bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-500 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-500/30'
                : 'bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <option value="all">All Priorities</option>
            <option value="urgent_high">Urgent & High</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={staffFilter}
            onChange={(e) => setStaffFilter(e.target.value)}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 max-w-[150px] truncate cursor-pointer shadow-2xs transition-all ${
              staffFilter !== 'all'
                ? 'bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-500 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-500/30'
                : 'bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <option value="all">All Staff</option>
            {staff.map((st) => (
              <option key={st.id} value={st.id}>
                {st.name}
              </option>
            ))}
          </select>

          {(statusFilter !== 'all' || priorityFilter !== 'all' || staffFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter('all');
                setPriorityFilter('all');
                setStaffFilter('all');
              }}
              className="px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 dark:hover:bg-rose-900/40 shrink-0 cursor-pointer flex items-center gap-1 transition-all"
              title="Reset Status, Priority & Staff filters"
            >
              <X className="w-3 h-3" /> Reset
            </button>
          )}
        </div>

        {/* 4. Active Date & Results Summary Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 bg-indigo-50/60 dark:bg-slate-900/60 rounded-xl border border-indigo-100/80 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              {dateRange.preset === 'today' || (dateRange.startDate && dateRange.startDate === getLocalDateString() && dateRange.endDate === getLocalDateString())
                ? `Today’s Jobs (${formatDateDisplay(getLocalDateString())})`
                : dateRange.preset === 'yesterday'
                ? `Yesterday’s Jobs (${formatDateDisplay(dateRange.startDate)})`
                : dateRange.startDate && dateRange.endDate && dateRange.startDate === dateRange.endDate
                ? `Jobs on ${formatDateDisplay(dateRange.startDate)}`
                : dateRange.preset === 'last_7_days'
                ? 'Last 7 Days Jobs'
                : dateRange.preset === 'this_month'
                ? 'This Month Jobs'
                : dateRange.preset === 'all' || (!dateRange.startDate && !dateRange.endDate)
                ? 'All Historical Jobs'
                : `Jobs (${formatDateDisplay(dateRange.startDate)} to ${formatDateDisplay(dateRange.endDate)})`}
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-slate-600 dark:text-slate-400 font-semibold">
              <strong className="text-slate-900 dark:text-slate-100 font-mono">{filteredJobs.length}</strong> total
            </span>
            <span className="text-emerald-700 dark:text-emerald-400 font-medium">
              (<strong>{filteredJobs.filter((j) => j.status === 'completed' || j.status === 'verified' || j.status === 'closed').length}</strong> Completed)
            </span>
          </div>

          {/* Prompt if user search has matches in other dates */}
          {Boolean(search.trim() && dateRange.preset !== 'all' && allHistoryMatchCount > filteredJobs.length) && (
            <button
              type="button"
              onClick={() => setDateRange(getPresetDates('all'))}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-[11px] font-bold shadow-2xs hover:bg-indigo-700 transition-all cursor-pointer shrink-0"
            >
              <History className="w-3 h-3" />
              <span>
                Found {allHistoryMatchCount} matches across All History — Show All
              </span>
            </button>
          )}
        </div>
      </div>


      {/* Board View (Kanban style columns for key workflow stages) */}
      {viewMode === 'board' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5 items-start">
          {[
            {
              stage: 'assigned',
              title: 'Assigned / Scheduled',
              color: 'bg-amber-50 dark:bg-amber-950/50 border-amber-200/80 dark:border-amber-900/60 text-amber-800 dark:text-amber-300',
              dot: 'bg-amber-500',
            },
            {
              stage: 'started',
              title: 'On Site / Started',
              color: 'bg-blue-50 dark:bg-blue-950/50 border-blue-200/80 dark:border-blue-900/60 text-blue-800 dark:text-blue-300',
              dot: 'bg-blue-500',
            },
            {
              stage: 'in_progress',
              title: 'In Progress',
              color: 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200/80 dark:border-indigo-900/60 text-indigo-800 dark:text-indigo-300',
              dot: 'bg-indigo-500',
            },
            {
              stage: 'completed',
              title: 'Completed Work',
              color: 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200/80 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300',
              dot: 'bg-emerald-500',
            },
          ].map((col) => {
            const colJobs = filteredJobs.filter(
              (j) =>
                j.status === col.stage ||
                (col.stage === 'assigned' &&
                  (j.status === 'new' || j.status === 'accepted' || j.status === 'on_the_way')) ||
                (col.stage === 'completed' &&
                  (j.status === 'verified' || j.status === 'closed'))
            );

            const isEmpty = colJobs.length === 0;

            return (
              <div
                key={col.stage}
                className={`bg-slate-100/70 dark:bg-slate-900/60 p-2.5 sm:p-3 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 transition-all ${
                  isEmpty ? 'space-y-2' : 'space-y-2.5'
                }`}
              >
                {/* Stage Header */}
                <div className="flex items-center justify-between px-1.5 py-0.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${col.dot}`} />
                    <span
                      className={`text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border truncate ${col.color}`}
                    >
                      {col.title}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full shadow-2xs border border-slate-200/60 dark:border-slate-700/60">
                    {colJobs.length}
                  </span>
                </div>

                {/* Compact Empty State or Job Cards */}
                {isEmpty ? (
                  <div className="py-3 px-2 text-center text-xs text-slate-400 dark:text-slate-500 font-medium bg-white/60 dark:bg-slate-800/40 rounded-xl sm:rounded-2xl border border-dashed border-slate-200/90 dark:border-slate-800/80 flex items-center justify-center min-h-[46px]">
                    No jobs in this stage
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {colJobs.map((job) => {
                      const customer = (customers || []).find((c) => c.id === job.customerId);
                      const tech = (staff || []).find((s) => s.id === job.assignedStaffId);

                      return (
                        <div
                          key={job.id}
                          onClick={() => setSelectedJob(job)}
                          className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer space-y-2 group"
                        >
                          <div className="flex items-center justify-between gap-1.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 group-hover:underline font-mono truncate">
                                {job.jobId}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  playJobVoiceNotification(
                                    job.jobId,
                                    job.description || 'Service Task',
                                    job.location,
                                    tech?.name
                                  );
                                }}
                                className="p-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 transition-colors shrink-0 cursor-pointer"
                                title="Play voice alert for this job"
                              >
                                <Volume2 className="w-3 h-3" />
                              </button>
                            </div>
                            <span
                              className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md shrink-0 ${
                                job.priority === 'urgent'
                                  ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60'
                                  : job.priority === 'high'
                                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              {job.priority}
                            </span>
                          </div>

                          <div className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-100 line-clamp-1 break-words">
                            {customer?.name || 'Customer'}
                          </div>

                          <div className="text-[11.5px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed break-words">
                            {job.description}
                          </div>

                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                            <div className="flex items-center gap-1 min-w-0 max-w-[60%]">
                              <UserCheck className="w-3 h-3 text-indigo-500 shrink-0" />
                              <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                                {tech?.name || 'Unassigned'}
                              </span>
                            </div>
                            <span className="font-extrabold text-slate-900 dark:text-slate-100 font-mono shrink-0">
                              {currentBusiness.currency || '₹'}
                              {job.estimatedAmount}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Job ID</th>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">Service Description</th>
                  <th className="p-3.5">Assigned Tech</th>
                  <th className="p-3.5">Date & Time</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(filteredJobs || []).map((job) => {
                  const cust = (customers || []).find((c) => c.id === job.customerId);
                  const tech = (staff || []).find((s) => s.id === job.assignedStaffId);

                  return (
                    <tr
                      key={job.id}
                      onClick={() => setSelectedJob(job)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                    >
                      <td className="p-3.5 font-extrabold text-indigo-600">
                        <div className="flex items-center gap-1.5">
                          <span>{job.jobId}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              playJobVoiceNotification(
                                job.jobId,
                                job.description || 'Service Task',
                                job.location,
                                tech?.name
                              );
                            }}
                            className="p-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 transition-colors"
                            title="Play voice alert for this job"
                          >
                            <Volume2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">{cust?.name}</td>
                      <td className="p-3.5 text-slate-600 max-w-xs truncate">{job.description}</td>
                      <td className="p-3.5 text-slate-700 font-medium">{tech?.name || 'Unassigned'}</td>
                      <td className="p-3.5 text-slate-500">{job.scheduledDate} {job.scheduledTime}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-600 uppercase">
                          {job.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-bold text-slate-900 dark:text-slate-100">
                        {currentBusiness.currency}{job.estimatedAmount}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Selected Job Detail Modal */}
      {selectedJob && (
        <div
          role="dialog"
          aria-modal="true"
          data-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto overscroll-contain"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedJob(null);
            }
          }}
          onTouchMove={(e) => {
            if (e.target === e.currentTarget) {
              e.preventDefault();
            }
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 my-auto max-h-[90vh] flex flex-col overscroll-contain"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-indigo-600">{selectedJob.jobId}</span>
                  <button
                    onClick={() => {
                      const custName = (customers || []).find((c) => c.id === selectedJob.customerId)?.name || '';
                      const techName = (staff || []).find((s) => s.id === selectedJob.assignedStaffId)?.name || 'Unassigned';
                      speakText(
                        `Job Number ${selectedJob.jobId} for ${custName}. Service issue: ${selectedJob.description}. Assigned technician: ${techName}. Location: ${selectedJob.location}. Scheduled: ${selectedJob.scheduledDate}.`
                      );
                    }}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 font-semibold text-[11px] transition-all cursor-pointer"
                    title="Listen to job summary voice voice"
                  >
                    <Volume2 className="w-3.5 h-3.5" /> Speak Voice Details
                  </button>
                </div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                  {(customers || []).find((c) => c.id === selectedJob.customerId)?.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs overflow-y-auto pr-1 flex-1 overscroll-contain">
              {/* Visual Horizontal Progress Stepper Component */}
              <JobServiceProgressBar
                job={selectedJob}
                status={selectedJob.status}
                onStatusChange={(newStatus, reason) => {
                  updateJobStatus(selectedJob.id, newStatus, reason);
                  setSelectedJob((prev) => (prev ? { ...prev, status: newStatus } : null));
                }}
              />

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl space-y-1">
                <div className="font-bold text-slate-900 dark:text-slate-100">Service Description</div>
                <div className="text-slate-600">{selectedJob.description}</div>
              </div>

              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                <div>
                  <span className="text-slate-400">Assigned Technician:</span>
                  <div className="font-bold">{(staff || []).find((s) => s.id === selectedJob.assignedStaffId)?.name || 'Unassigned'}</div>
                </div>
                <div>
                  <span className="text-slate-400">Scheduled Date:</span>
                  <div className="font-bold">{selectedJob.scheduledDate} ({selectedJob.scheduledTime})</div>
                </div>
                <div className="col-span-2 flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                  <div className="min-w-0 flex-1">
                    <span className="text-slate-400 block text-[10px]">Site Location:</span>
                    <div className="font-bold truncate text-slate-800 dark:text-slate-200">{selectedJob.location || 'Site Address'}</div>
                  </div>
                  {selectedJob.location && (
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(selectedJob.location)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 font-bold text-[11px] inline-flex items-center gap-1.5 shrink-0 border border-indigo-200 dark:border-indigo-800 shadow-2xs"
                    >
                      <Navigation className="w-3.5 h-3.5" /> Start GPS Route
                    </a>
                  )}
                </div>
              </div>

              {/* Smart WhatsApp Actions Hub */}
              <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/60 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-emerald-900 dark:text-emerald-300">
                  <span className="flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                    Smart WhatsApp Action Center
                  </span>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">1-Click Dispatch</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      const cust = (customers || []).find((c) => c.id === selectedJob.customerId);
                      const tech = (staff || []).find((s) => s.id === selectedJob.assignedStaffId);
                      sendJobDispatchToTechnician(selectedJob, cust, tech, currentBusiness);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" /> Send Job to Tech's WhatsApp
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const cust = (customers || []).find((c) => c.id === selectedJob.customerId);
                      const tech = (staff || []).find((s) => s.id === selectedJob.assignedStaffId);
                      if (selectedJob.status === 'completed' || selectedJob.status === 'closed') {
                        sendJobCompletionSummaryToCustomer(selectedJob, cust, tech, currentBusiness);
                      } else {
                        sendTechnicianOnTheWayAlert(selectedJob, cust, tech, currentBusiness);
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-emerald-50 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                    {selectedJob.status === 'completed' ? 'Send Report to Customer' : 'Alert: Tech On The Way'}
                  </button>
                </div>
              </div>

              {/* Real-Time Job Profit & Costing Breakdown Widget */}
              {(() => {
                const materialsUsed = selectedJob.materialsUsed || [];
                const materialCost = materialsUsed.reduce((acc, m) => {
                  const inv = (inventory || []).find((i) => i.id === m.inventoryItemId);
                  const unitCost = inv?.purchasePrice || (m.unitPrice * 0.65);
                  return acc + (unitCost * m.quantity);
                }, 0);
                const billedAmount = selectedJob.estimatedAmount || 0;
                const laborCostEst = Math.round(billedAmount * 0.15); // Estimated 15% technician/labor allocation
                const totalJobCost = materialCost + laborCostEst;
                const grossProfit = Math.max(0, billedAmount - totalJobCost);
                const marginPercent = billedAmount > 0 ? Math.round((grossProfit / billedAmount) * 100) : 0;

                return (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-200">
                      <span className="flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                        Job Profit & Costing Breakdown
                      </span>
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                          marginPercent >= 40
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : marginPercent >= 20
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {marginPercent}% Margin
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5 text-center pt-1">
                      <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Billed</span>
                        <span className="font-extrabold text-slate-900 dark:text-slate-100">
                          {currentBusiness.currency}{billedAmount}
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Parts Cost</span>
                        <span className="font-bold text-slate-600 dark:text-slate-300">
                          {currentBusiness.currency}{materialCost}
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Labor Est.</span>
                        <span className="font-bold text-slate-600 dark:text-slate-300">
                          {currentBusiness.currency}{laborCostEst}
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800">
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-semibold">Net Profit</span>
                        <span className="font-black text-emerald-700 dark:text-emerald-300">
                          {currentBusiness.currency}{grossProfit}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div>
                <label className="font-bold block mb-1">Update Status:</label>
                <select
                  value={selectedJob.status}
                  onChange={(e) => {
                    updateJobStatus(selectedJob.id, e.target.value as JobStatus);
                    setSelectedJob({ ...selectedJob, status: e.target.value as JobStatus });
                  }}
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 font-bold uppercase"
                >
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      {s.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Voice-To-Text Notes Recording Component */}
              <div className="pt-1">
                <VoiceNotesRecorder
                  job={selectedJob}
                  onNotesSaved={(updatedNotes) => {
                    setSelectedJob({ ...selectedJob, notes: updatedNotes });
                  }}
                />
              </div>

              {/* Service Completion Summary */}
              {selectedJob.problemFound && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 rounded-2xl border border-emerald-200 dark:border-emerald-900 space-y-1">
                  <div className="font-bold mb-1 flex items-center justify-between">
                    <span>Service Completion Summary</span>
                    {selectedJob.customerRating && (
                      <span className="text-amber-600 dark:text-amber-400 font-black">
                        ⭐ {selectedJob.customerRating}/5 Rating
                      </span>
                    )}
                  </div>
                  <div><strong>Problem Diagnosed:</strong> {selectedJob.problemFound}</div>
                  <div><strong>Solution Provided:</strong> {selectedJob.solutionProvided}</div>
                </div>
              )}

              {/* Photo Evidence & Digital Audit Gallery */}
              {((selectedJob.beforePhotos && selectedJob.beforePhotos.length > 0) ||
                (selectedJob.afterPhotos && selectedJob.afterPhotos.length > 0) ||
                selectedJob.customerSignature) && (
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-200">
                    <span>Field Photo Evidence & Signature</span>
                    <span className="text-[10px] text-slate-400 font-normal">On-Site Verification</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Before Photo */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Before Work Photo
                      </span>
                      {selectedJob.beforePhotos && selectedJob.beforePhotos.length > 0 ? (
                        <a
                          href={selectedJob.beforePhotos[0]}
                          target="_blank"
                          rel="noreferrer"
                          className="block rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-video group relative bg-black/5"
                        >
                          <img
                            src={selectedJob.beforePhotos[0]}
                            alt="Before Work"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition-opacity">
                            View Full Photo
                          </div>
                        </a>
                      ) : (
                        <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 aspect-video flex items-center justify-center text-slate-400 text-[10px]">
                          No initial photo
                        </div>
                      )}
                    </div>

                    {/* After Photo */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        After Work Photo
                      </span>
                      {selectedJob.afterPhotos && selectedJob.afterPhotos.length > 0 ? (
                        <a
                          href={selectedJob.afterPhotos[0]}
                          target="_blank"
                          rel="noreferrer"
                          className="block rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-video group relative bg-black/5"
                        >
                          <img
                            src={selectedJob.afterPhotos[0]}
                            alt="After Work"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition-opacity">
                            View Full Photo
                          </div>
                        </a>
                      ) : (
                        <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 aspect-video flex items-center justify-center text-slate-400 text-[10px]">
                          No completion photo
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Customer Signature */}
                  {selectedJob.customerSignature && (
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Customer Signoff Signature
                      </span>
                      <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center max-h-24 overflow-hidden">
                        <img
                          src={selectedJob.customerSignature}
                          alt="Customer Signature"
                          className="max-h-16 object-contain dark:invert"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end pt-3 border-t">
              <button onClick={() => setSelectedJob(null)} className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Job Wizard Modal */}
      {isCreateModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          data-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto overscroll-contain"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsCreateModalOpen(false);
            }
          }}
          onTouchMove={(e) => {
            if (e.target === e.currentTarget) {
              e.preventDefault();
            }
          }}
        >
          <form
            onSubmit={handleCreateJob}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 my-auto max-h-[90vh] flex flex-col overscroll-contain"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 shrink-0">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Schedule & Dispatch New Job
                </h3>
                <p className="text-xs text-slate-500">Fill in job specifics, site location, and assign a technician</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Fields Grid */}
            <div className="space-y-4 text-xs overflow-y-auto pr-1 flex-1 overscroll-contain">
              {/* SECTION: Customer Selection or Quick Add */}
              <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-indigo-600" />
                    Customer Details *
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsQuickAddCustomer(!isQuickAddCustomer)}
                    className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {isQuickAddCustomer ? '← Choose Existing Customer' : '+ New Customer'}
                  </button>
                </div>

                {!isQuickAddCustomer ? (
                  <div>
                    <CustomerSearchSelect
                      id="job-customer-search-select"
                      customers={customers}
                      value={newJobData.customerId}
                      onChange={(custId, cust) => {
                        setNewJobData({
                          ...newJobData,
                          customerId: custId,
                          location: cust
                            ? `${cust.address || ''}, ${cust.city || ''}`.trim() || newJobData.location
                            : newJobData.location,
                        });
                      }}
                      placeholder="Search 100+ customers by name, phone (e.g. 987...), company..."
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                        Customer / Client Name *
                      </label>
                      <input
                        type="text"
                        required={isQuickAddCustomer}
                        placeholder="e.g. Rajesh Sharma"
                        value={quickCustomer.name}
                        onChange={(e) => setQuickCustomer({ ...quickCustomer, name: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                        Mobile Phone Number *
                      </label>
                      <input
                        type="tel"
                        required={isQuickAddCustomer}
                        placeholder="e.g. 9876543210"
                        value={quickCustomer.mobile}
                        onChange={(e) => setQuickCustomer({ ...quickCustomer, mobile: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                        Company / Business Name (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Apex Towers Soc."
                        value={quickCustomer.companyName}
                        onChange={(e) => setQuickCustomer({ ...quickCustomer, companyName: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                        City / Area
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Mumbai"
                        value={quickCustomer.city}
                        onChange={(e) => setQuickCustomer({ ...quickCustomer, city: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                        Premises / Site Address
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Flat 402, Building A, Main Road"
                        value={quickCustomer.address}
                        onChange={(e) => setQuickCustomer({ ...quickCustomer, address: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION: Service Type & Description */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="font-semibold block mb-1 text-slate-800 dark:text-slate-200">
                    Select Service Category *
                  </label>
                  <select
                    value={newJobData.serviceId}
                    onChange={(e) => {
                      const s = (services || []).find((srv) => srv.id === e.target.value);
                      setNewJobData({
                        ...newJobData,
                        serviceId: e.target.value,
                        description: s ? s.name : newJobData.description,
                        estimatedAmount: s ? s.price : newJobData.estimatedAmount,
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="" disabled>-- Select a Service --</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} - {currentBusiness.currency}{s.price}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="font-semibold block mb-1 text-slate-800 dark:text-slate-200">
                    Job Instructions / Site Work Description *
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={newJobData.description}
                    onChange={(e) => setNewJobData({ ...newJobData, description: e.target.value })}
                    placeholder="Type detailed instructions for the field technician (e.g. CCTV Camera 3 repair & wire reconnection)..."
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* SECTION: Site Location & Estimated Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1 text-slate-800 dark:text-slate-200 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    Site Location / Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={newJobData.location}
                    onChange={(e) => setNewJobData({ ...newJobData, location: e.target.value })}
                    placeholder="Enter site address or landmark..."
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-slate-800 dark:text-slate-200">
                    Estimated Amount ({currentBusiness.currency}) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={newJobData.estimatedAmount}
                    onChange={(e) =>
                      setNewJobData({ ...newJobData, estimatedAmount: parseFloat(e.target.value) || 0 })
                    }
                    placeholder="1500"
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* SECTION: Assignment & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1 text-slate-800 dark:text-slate-200">
                    Assign Technician
                  </label>
                  <select
                    value={newJobData.assignedStaffId}
                    onChange={(e) => setNewJobData({ ...newJobData, assignedStaffId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- Unassigned (Pool) --</option>
                    {staff.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} ({st.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-slate-800 dark:text-slate-200">
                    Job Priority
                  </label>
                  <select
                    value={newJobData.priority}
                    onChange={(e) => setNewJobData({ ...newJobData, priority: e.target.value as JobPriority })}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="low">🟢 Low Priority</option>
                    <option value="medium">🟡 Medium Priority</option>
                    <option value="high">🟠 High Priority</option>
                    <option value="urgent">🔴 Urgent / Emergency</option>
                  </select>
                </div>
              </div>

              {/* SECTION: Scheduled Date & Time Slot Selection */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                        Scheduled Date *
                      </label>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            setNewJobData({
                              ...newJobData,
                              scheduledDate: new Date().toISOString().split('T')[0],
                            })
                          }
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 cursor-pointer"
                        >
                          Today
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const tom = new Date();
                            tom.setDate(tom.getDate() + 1);
                            setNewJobData({
                              ...newJobData,
                              scheduledDate: tom.toISOString().split('T')[0],
                            });
                          }}
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 cursor-pointer"
                        >
                          Tomorrow
                        </button>
                      </div>
                    </div>
                    <input
                      type="date"
                      required
                      value={newJobData.scheduledDate}
                      onChange={(e) => setNewJobData({ ...newJobData, scheduledDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="font-bold block mb-1 text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-indigo-600" />
                      Select Time Slot *
                    </label>
                    <select
                      value={newJobData.scheduledTime}
                      onChange={(e) => setNewJobData({ ...newJobData, scheduledTime: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {TIME_SLOT_PRESETS.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                      <option value="CUSTOM">Custom Time Slot...</option>
                    </select>
                  </div>
                </div>

                {/* Quick Time Slot Chips */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Quick Time Slot Presets:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {TIME_SLOT_PRESETS.map((preset) => {
                      const isSelected = newJobData.scheduledTime === preset;
                      const shortLabel = preset.split(' ')[0] + ' ' + preset.split(' ')[1] + ' - ' + preset.split(' ')[3] + ' ' + preset.split(' ')[4];
                      return (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setNewJobData({ ...newJobData, scheduledTime: preset })}
                          className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                          }`}
                        >
                          {shortLabel}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Time Slot Text Override Input */}
                <div className="pt-1">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    Custom / Specific Time Note:
                  </label>
                  <input
                    type="text"
                    value={newJobData.scheduledTime}
                    onChange={(e) => setNewJobData({ ...newJobData, scheduledTime: e.target.value })}
                    placeholder="e.g. 10:30 AM or Exact 02:00 PM"
                    className="w-full px-3 py-1.5 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Dispatch & Schedule Job
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { speakText } from '../utils/audioNotification';
import {
  isJobPending,
  isJobInProgress,
  isJobCompleted,
  isJobActive,
  isJobActivePending,
} from '../utils/jobWorkflow';
import { EnquiryFormModal } from '../components/enquiries/EnquiryFormModal';
import { CustomerSearchSelect } from '../components/CustomerSearchSelect';
import {
  Briefcase,
  Users,
  User,
  CheckCircle2,
  Clock,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Phone,
  MapPin,
  ArrowRight,
  Plus,
  Repeat,
  Package,
  History,
  UserPlus,
  FileText,
  RefreshCw,
  Sparkles,
  Zap,
  Receipt,
  X,
  Star,
  Target,
  ShieldCheck,
  Search,
  Filter,
  ExternalLink,
  HelpCircle,
  CalendarClock,
  Megaphone,
  Volume2,
  Radio,
  Wrench,
} from 'lucide-react';
import { getUpcomingDueAmcContracts } from '../utils/amcHelper';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface DashboardViewProps {
  setActiveTab: (tab: string) => void;
  onOpenNewJob: () => void;
  onNavigateWithFilter?: (tab: string, filter?: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  setActiveTab,
  onOpenNewJob,
  onNavigateWithFilter,
}) => {
  const navigate = (tab: string, filter?: any) => {
    if (onNavigateWithFilter) {
      onNavigateWithFilter(tab, filter);
    } else {
      setActiveTab(tab);
    }
  };
  const {
    jobs,
    customers,
    invoices,
    inventory,
    contracts,
    batchScheduleDueAmcVisits,
    staff,
    enquiries,
    attendanceIssues,
    currentBusiness,
    setIsActivityLogOpen,
    addCustomer,
    addQuotation,
    isOffline,
    syncOfflineQueue,
    pendingSyncQueue,
    showToast,
    systemSettings,
    t,
  } = useApp();

  // Quick Action Modal States
  const [isNewEnquiryOpen, setIsNewEnquiryOpen] = useState(false);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [custName, setCustName] = useState('');
  const [custMobile, setCustMobile] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custCompany, setCustCompany] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [custType, setCustType] = useState<'commercial' | 'individual'>('commercial');

  const [isQuickQuoteOpen, setIsQuickQuoteOpen] = useState(false);
  const [quoteCustomerId, setQuoteCustomerId] = useState('');
  const [quoteDescription, setQuoteDescription] = useState('');
  const [quoteRate, setQuoteRate] = useState<number>(0);
  const [quoteTax, setQuoteTax] = useState<number>(18);
  const [quoteNotes, setQuoteNotes] = useState('Payment 50% advance upon quotation approval.');

  const [isSyncing, setIsSyncing] = useState(false);

  // Urgent Jobs & Today's Revenue Quick Access Filtered List Modal States
  const [isUrgentModalOpen, setIsUrgentModalOpen] = useState(false);
  const [urgentTabFilter, setUrgentTabFilter] = useState<'all' | 'pending' | 'unassigned'>('all');
  const [urgentSearch, setUrgentSearch] = useState('');

  const [isRevenueModalOpen, setIsRevenueModalOpen] = useState(false);
  const [revenueTabFilter, setRevenueTabFilter] = useState<'all' | 'paid' | 'pending'>('all');
  const [revenueSearch, setRevenueSearch] = useState('');

  const handleAddCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName || !custMobile) return;

    addCustomer({
      name: custName,
      mobile: custMobile,
      email: custEmail,
      companyName: custCompany,
      address: custAddress || 'On-site address',
      city: 'Local',
      state: 'State',
      pin: '000000',
      customerType: custType === 'commercial' ? 'commercial' : 'individual',
      notes: 'Added via Dashboard Quick Actions',
    });

    showToast(`Customer "${custName}" created successfully!`, 'success');
    setCustName('');
    setCustMobile('');
    setCustEmail('');
    setCustCompany('');
    setCustAddress('');
    setIsAddCustomerOpen(false);
  };

  const handleQuickQuoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedCustId = quoteCustomerId || customers[0]?.id;
    if (!selectedCustId || !quoteDescription) return;

    const rate = Number(quoteRate) || 0;
    const tax = Number(quoteTax) || 0;
    const totalAmount = rate + (rate * tax) / 100;

    addQuotation({
      customerId: selectedCustId,
      date: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      items: [
        {
          id: `item-${Date.now()}`,
          description: quoteDescription,
          quantity: 1,
          rate,
          taxPercent: tax,
          amount: totalAmount,
        },
      ],
      subtotal: rate,
      taxTotal: (rate * tax) / 100,
      discountTotal: 0,
      grandTotal: totalAmount,
      status: 'sent',
      notes: quoteNotes,
    });

    showToast('Quotation generated and saved successfully!', 'success');
    setQuoteDescription('');
    setQuoteRate(0);
    setIsQuickQuoteOpen(false);
  };

  const handleSyncData = () => {
    setIsSyncing(true);
    try {
      syncOfflineQueue(false);
      setTimeout(() => {
        setIsSyncing(false);
        showToast(
          isOffline
            ? 'Local changes saved offline.'
            : 'Data refreshed & cloud-synced!',
          'success'
        );
      }, 600);
    } catch (err) {
      console.error('Dashboard sync error:', err);
      setIsSyncing(false);
      showToast('Failed to refresh data. Please try again.', 'error');
    }
  };

  const curr = currentBusiness.currency;

  // KPI Calculations
  const todayStr = new Date().toISOString().split('T')[0];
  const todaysJobs = jobs.filter(
    (j) => (j.scheduledDate === todayStr || isJobInProgress(j.status) || j.status === 'assigned') && isJobActive(j.status)
  );
  const pendingJobs = jobs.filter((j) => isJobActive(j.status));
  const completedJobs = jobs.filter((j) => isJobCompleted(j.status));
  
  const todayPayments = invoices
    .filter((inv) => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.paidAmount, 0);

  const totalSales = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const pendingPayments = invoices.reduce((sum, inv) => sum + inv.balanceAmount, 0);

  // Enquiries & Intake calculations
  const todayDateStr = new Date().toISOString().split('T')[0];
  const newEnquiriesCount = (enquiries || []).filter((e) => e.status === 'new').length;
  const followUpsDueTodayCount = (enquiries || []).filter((e) => {
    return (e.status === 'follow_up' || e.status === 'new' || e.status === 'contacted') && e.followUpDate === todayDateStr;
  }).length;
  const qualifiedEnquiriesCount = (enquiries || []).filter((e) => e.status === 'qualified').length;
  const quotedEnquiriesCount = (enquiries || []).filter((e) => e.status === 'quoted').length;
  const convertedEnquiriesCount = (enquiries || []).filter((e) => e.status === 'converted').length;

  // Urgent Jobs calculations & modal filters
  const urgentJobsList = jobs.filter((j) => j.priority === 'urgent' || j.priority === 'high');
  const activeUrgentJobs = urgentJobsList.filter((j) => isJobActive(j.status));
  const activePendingUrgentJobs = urgentJobsList.filter((j) => isJobActivePending(j.status));
  const unassignedUrgentJobs = urgentJobsList.filter((j) => !j.assignedStaffId && isJobActive(j.status));
  const activeUrgentValue = activeUrgentJobs.reduce((sum, j) => sum + (j.estimatedAmount || 0), 0);

  // Incoming Customer Service Requests (From Customer Portal / QR / Direct Requests)
  const incomingCustomerRequests = (jobs || []).filter(
    (j) =>
      (j.status === 'new' || j.status === 'scheduled') &&
      (!j.assignedStaffId || j.description?.includes('[Portal Booking]') || (j as any).source === 'customer_portal')
  );

  // Due AMC Preventive Maintenance Visits (due now or within 7 days)
  const dueAmcContracts = React.useMemo(() => {
    return getUpcomingDueAmcContracts(contracts || [], 7);
  }, [contracts]);

  const filteredUrgentModalJobs = urgentJobsList.filter((job) => {
    const customer = customers.find((c) => c.id === job.customerId);
    const searchLow = urgentSearch.toLowerCase();
    const matchesSearch =
      !urgentSearch ||
      job.jobId.toLowerCase().includes(searchLow) ||
      job.description.toLowerCase().includes(searchLow) ||
      job.location.toLowerCase().includes(searchLow) ||
      (customer?.name || '').toLowerCase().includes(searchLow) ||
      (customer?.companyName || '').toLowerCase().includes(searchLow);

    const matchesTab =
      urgentTabFilter === 'all'
        ? true
        : urgentTabFilter === 'pending'
        ? isJobActive(job.status)
        : !job.assignedStaffId && isJobActive(job.status);

    return matchesSearch && matchesTab;
  });

  // Revenue Invoices calculation & modal filters
  const todayPaidInvoices = invoices.filter((inv) => inv.status === 'paid' || inv.paidAmount > 0);

  const filteredRevenueModalInvoices = invoices.filter((inv) => {
    const customer = customers.find((c) => c.id === inv.customerId);
    const searchLow = revenueSearch.toLowerCase();
    const matchesSearch =
      !revenueSearch ||
      inv.invoiceNumber.toLowerCase().includes(searchLow) ||
      (customer?.name || '').toLowerCase().includes(searchLow) ||
      (customer?.companyName || '').toLowerCase().includes(searchLow) ||
      (inv.notes || '').toLowerCase().includes(searchLow);

    const matchesTab =
      revenueTabFilter === 'all'
        ? true
        : revenueTabFilter === 'paid'
        ? inv.status === 'paid' || inv.paidAmount > 0
        : inv.status !== 'paid' && inv.balanceAmount > 0;

    return matchesSearch && matchesTab;
  });

  const lowStockItems = inventory.filter((item) => item.currentStock <= item.minStock);
  const expiringContracts = contracts.filter((c) => c.status === 'expiring_soon' || c.status === 'expired');

  // Dynamic Rolling Monthly Sales & Collections Chart Data
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const salesChartData = Array.from({ length: 5 }).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (4 - i), 1);
    const mIndex = d.getMonth();
    const yStr = d.getFullYear();
    const monthLabel = monthNames[mIndex];
    const prefix = `${yStr}-${String(mIndex + 1).padStart(2, '0')}`;

    const monthSales = invoices
      .filter((inv) => (inv.date || '').startsWith(prefix))
      .reduce((sum, inv) => sum + (Number(inv.grandTotal) || 0), 0);

    const monthCollections = invoices
      .filter((inv) => (inv.date || '').startsWith(prefix))
      .reduce((sum, inv) => sum + (Number(inv.paidAmount) || 0), 0);

    return {
      month: monthLabel,
      sales: monthSales,
      collections: monthCollections,
    };
  });

  const hasRevenueData = salesChartData.some((d) => d.sales > 0 || d.collections > 0) || totalSales > 0 || todayPayments > 0;

  const completedJobsCount = jobs.filter((j) => isJobCompleted(j.status)).length;
  const inProgressJobsCount = jobs.filter((j) => isJobInProgress(j.status)).length;
  const assignedJobsCount = jobs.filter((j) => j.status === 'assigned' || j.status === 'accepted').length;
  const newJobsCount = jobs.filter((j) => j.status === 'new' || j.status === 'scheduled').length;
  const totalWorkflowJobs = completedJobsCount + inProgressJobsCount + assignedJobsCount + newJobsCount;

  const jobStatusData = [
    { name: 'Completed', value: completedJobsCount, color: '#10b981' },
    { name: 'In Progress', value: inProgressJobsCount, color: '#3b82f6' },
    { name: 'Assigned', value: assignedJobsCount, color: '#f59e0b' },
    { name: 'New', value: newJobsCount, color: '#8b5cf6' },
  ];

  return (
    <div className="space-y-4 lg:space-y-4.5 pb-8 animate-in fade-in w-full max-w-full overflow-x-hidden">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 sm:p-4.5 lg:py-3.5 lg:px-5 rounded-2xl shadow-lg w-full max-w-full overflow-hidden">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-xs bg-indigo-500/20 text-indigo-300 font-bold px-2.5 py-0.5 rounded-full border border-indigo-500/30 truncate max-w-full">
              {currentBusiness.type || "Service Business"}
            </span>
            <span className="text-xs text-slate-400 font-medium">{t('dashboard.overviewSubtitle', undefined, "Today's Operations")}</span>
          </div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-black tracking-tight break-words">{currentBusiness.name}</h1>
          <p className="text-xs text-slate-300 mt-0.5 max-w-3xl">
            {t('dashboard.subtitle', undefined, 'Overview of jobs, enquiries, technician activity & business performance for today.')}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsActivityLogOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition-all active:scale-95 cursor-pointer"
          >
            <History className="w-4 h-4 text-indigo-300" /> {t('common.activityLog', undefined, 'Activity Log')}
          </button>
          <button
            onClick={() => navigate('jobs', { datePreset: 'today' })}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Calendar className="w-4 h-4" /> {t('dashboard.todayJobs', undefined, "Today's Schedule")}
          </button>
        </div>
      </div>

      {/* Super Admin Platform Announcement Broadcast Card (If Active) */}
      {systemSettings?.isNoticeActive && systemSettings?.globalNoticeBanner?.trim() && (
        <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-blue-50 dark:from-indigo-950/60 dark:via-purple-950/40 dark:to-slate-900 p-3.5 sm:p-4 rounded-2xl border border-indigo-200/80 dark:border-indigo-800/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs shrink-0 mt-0.5 sm:mt-0">
              <Megaphone className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                  Super Admin Broadcast
                </span>
                <span className="text-[11px] text-slate-500 font-medium hidden xs:inline">
                  {systemSettings.noticeTitle || 'Official Platform Notice'}
                </span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 mt-1 leading-snug">
                {systemSettings.globalNoticeBanner}
              </p>
            </div>
          </div>
          <button
            onClick={() => speakText(`Platform Broadcast: ${systemSettings.globalNoticeBanner}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold text-xs border border-indigo-200 dark:border-indigo-800 shadow-2xs transition-all active:scale-95 shrink-0 self-end sm:self-center cursor-pointer"
            title="Listen to broadcast"
          >
            <Volume2 className="w-3.5 h-3.5" /> Listen Audio
          </button>
        </div>
      )}

      {/* Pending Attendance Correction Requests Alert Banner */}
      {(attendanceIssues || []).filter((i) => i.status === 'pending').length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-indigo-500/10 dark:from-amber-950/40 dark:via-rose-950/30 dark:to-slate-900 p-4 rounded-2xl border border-amber-300 dark:border-amber-700/60 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-md shadow-amber-500/20 shrink-0">
              <AlertTriangle className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider bg-rose-600 text-white px-2 py-0.5 rounded-full">
                  Action Required
                </span>
                <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
                  {(attendanceIssues || []).filter((i) => i.status === 'pending').length} Attendance Correction Request(s) Pending
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                Staff have submitted shift check-in or GPS boundary adjustment requests that require your review.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('attendance')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-md transition-all active:scale-95 cursor-pointer shrink-0 self-end sm:self-center"
          >
            <Clock className="w-4 h-4" /> Review in Attendance & GPS
          </button>
        </div>
      )}

      {/* Incoming Customer Service Requests Alert Card (Self-Service Portal / QR Bookings) */}
      {incomingCustomerRequests.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-emerald-500/10 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-slate-900 p-4 sm:p-5 rounded-2xl border-2 border-indigo-300 dark:border-indigo-700/70 shadow-md flex flex-col gap-3.5 animate-in fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-600/30 shrink-0">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-black uppercase tracking-wider bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                    Portal Booking
                  </span>
                  <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100">
                    {incomingCustomerRequests.length} New Customer Service Call Request(s)
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  Customers have requested service visits online. Review details, contact clients, and assign field technicians.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                type="button"
                onClick={() => navigate('portal')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                Portal View
              </button>
              <button
                type="button"
                onClick={() => navigate('jobs', { statusFilter: 'new' })}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-600/20 transition-all active:scale-95 cursor-pointer"
              >
                <Briefcase className="w-4 h-4" /> Dispatch in Jobs
              </button>
            </div>
          </div>

          {/* Quick List of Latest 3 Incoming Requests */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
            {incomingCustomerRequests.slice(0, 3).map((reqJob) => {
              const reqCustomer = customers.find((c) => c.id === reqJob.customerId);
              return (
                <div
                  key={reqJob.id}
                  className="p-3 rounded-xl bg-white/90 dark:bg-slate-800/90 border border-indigo-100 dark:border-indigo-900/60 shadow-xs flex flex-col justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] font-black text-indigo-600 dark:text-indigo-400">
                        {reqJob.jobId}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                        {reqJob.scheduledDate}
                      </span>
                    </div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 mt-1 line-clamp-1">
                      {reqCustomer?.name || 'Customer'}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                      {reqJob.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-700/60">
                    {reqCustomer?.mobile ? (
                      <a
                        href={`tel:${reqCustomer.mobile}`}
                        className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" /> {reqCustomer.mobile}
                      </a>
                    ) : (
                      <span className="text-[10px] text-slate-400">No mobile</span>
                    )}

                    <button
                      type="button"
                      onClick={() => navigate('jobs', { statusFilter: 'new' })}
                      className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-[11px] transition-colors cursor-pointer"
                    >
                      Assign Staff →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Due AMC Maintenance Visits Alert Card */}
      {dueAmcContracts.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-indigo-500/10 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-slate-900 p-4 sm:p-5 rounded-2xl border-2 border-amber-300 dark:border-amber-700/70 shadow-md flex flex-col gap-3.5 animate-in fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-md shadow-amber-500/30 shrink-0">
                <Wrench className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-black uppercase tracking-wider bg-amber-500 text-white px-2 py-0.5 rounded-full">
                    AMC Preventive Visits Due
                  </span>
                  <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100">
                    {dueAmcContracts.length} Preventive Maintenance Visit(s) Due
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  Scheduled preventive visits under AMC contracts are due for servicing. 1-click auto-dispatch to assign field technicians.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                type="button"
                onClick={() => navigate('contracts')}
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                View All AMCs
              </button>
              <button
                type="button"
                onClick={() => batchScheduleDueAmcVisits()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs shadow-md shadow-amber-500/20 transition-all active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" /> 1-Click Auto-Dispatch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions Bar */}
      <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                {t('dashboard.quickActions', undefined, 'Quick Actions')}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {t('dashboard.quickActionsSubtitle', undefined, 'Direct access to core field service & administrative tasks')}
              </p>
            </div>
          </div>
          {pendingSyncQueue.length > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              {pendingSyncQueue.length} Pending Sync{pendingSyncQueue.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          {/* Action 1: New Enquiry (Primary Entry Point) */}
          <button
            onClick={() => setIsNewEnquiryOpen(true)}
            className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl bg-slate-50/80 hover:bg-blue-50 dark:bg-slate-800/60 dark:hover:bg-blue-950/40 border border-slate-200/60 dark:border-slate-700/60 hover:border-blue-300 dark:hover:border-blue-600/50 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-300 transition-all group active:scale-95 cursor-pointer min-h-[78px] sm:min-h-[82px]"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 mb-1 flex items-center justify-center group-hover:scale-110 transition-transform">
              <HelpCircle className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{t('enquiries.newEnquiry', undefined, 'New Enquiry')}</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 text-center line-clamp-1">{t('dashboard.captureIntake', undefined, 'Capture intake')}</span>
          </button>

          {/* Action 2: Add Customer */}
          <button
            onClick={() => setIsAddCustomerOpen(true)}
            className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl bg-slate-50/80 hover:bg-indigo-50 dark:bg-slate-800/60 dark:hover:bg-indigo-950/40 border border-slate-200/60 dark:border-slate-700/60 hover:border-indigo-300 dark:hover:border-indigo-600/50 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-300 transition-all group active:scale-95 cursor-pointer min-h-[78px] sm:min-h-[82px]"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 mb-1 flex items-center justify-center group-hover:scale-110 transition-transform">
              <UserPlus className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{t('customers.addCustomer', undefined, 'Add Customer')}</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 text-center line-clamp-1">{t('dashboard.createCrmEntry', undefined, 'Create CRM entry')}</span>
          </button>

          {/* Action 3: Schedule Job */}
          <button
            onClick={onOpenNewJob}
            className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl bg-slate-50/80 hover:bg-purple-50 dark:bg-slate-800/60 dark:hover:bg-purple-950/40 border border-slate-200/60 dark:border-slate-700/60 hover:border-purple-300 dark:hover:border-purple-600/50 text-slate-700 dark:text-slate-200 hover:text-purple-600 dark:hover:text-purple-300 transition-all group active:scale-95 cursor-pointer min-h-[78px] sm:min-h-[82px]"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 mb-1 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{t('jobs.createJob', undefined, 'Schedule Job')}</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 text-center line-clamp-1">{t('dashboard.dispatchTechnician', undefined, 'Dispatch technician')}</span>
          </button>

          {/* Action 4: Quick Quote */}
          <button
            onClick={() => setIsQuickQuoteOpen(true)}
            className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl bg-slate-50/80 hover:bg-emerald-50 dark:bg-slate-800/60 dark:hover:bg-emerald-950/40 border border-slate-200/60 dark:border-slate-700/60 hover:border-emerald-300 dark:hover:border-emerald-600/50 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-300 transition-all group active:scale-95 cursor-pointer min-h-[78px] sm:min-h-[82px]"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 mb-1 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{t('quotations.createQuotation', undefined, 'Quick Quote')}</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 text-center line-clamp-1">{t('dashboard.generateEstimate', undefined, 'Generate estimate')}</span>
          </button>
        </div>
      </div>

      {/* Interactive Featured Summary Cards: Urgent Jobs & Today's Revenue */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 items-stretch">
        {/* Urgent Jobs Summary Card (Consistent 2-column height, padding, & alignment) */}
        {activeUrgentJobs.length === 0 ? (
          <div
            onClick={() => navigate('jobs', { statusFilter: 'all' })}
            className="p-4 sm:p-4.5 rounded-2xl bg-gradient-to-br from-emerald-50/70 via-teal-50/30 to-white dark:from-emerald-950/30 dark:via-teal-950/15 dark:to-slate-900 border-2 border-emerald-200/80 dark:border-emerald-800/80 hover:border-emerald-400 dark:hover:border-emerald-600 shadow-xs hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between h-full overflow-hidden"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/30 shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/60">
                      All Normal
                    </span>
                  </div>
                  <h3 className="text-base font-black text-slate-900 dark:text-slate-100 mt-0.5 group-hover:text-emerald-600 transition-colors">
                    Urgent Jobs Summary
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    All service requests are on schedule with 0 active urgent flags
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  0
                </div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Total Urgent
                </div>
              </div>
            </div>

            {/* Metric Quick Stats Pills */}
            <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-emerald-200/60 dark:border-emerald-900/40">
              <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold truncate">Active Pending</div>
                <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">0</div>
              </div>

              <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold truncate">Unassigned Techs</div>
                <div className="text-sm font-extrabold text-slate-900 dark:text-slate-100">0</div>
              </div>

              <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold truncate">Est. Job Value</div>
                <div className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                  {curr}0
                </div>
              </div>
            </div>

            {/* Quick Action Footer */}
            <div className="mt-2.5 flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400 pt-1 border-t border-emerald-200/40 dark:border-emerald-900/30">
              <span className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5" /> Quick Access Filtered List
              </span>
              <span className="inline-flex items-center gap-1 bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-xl group-hover:bg-emerald-700 transition-colors shadow-xs">
                View List <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </div>
        ) : (
          <div
            onClick={() => setIsUrgentModalOpen(true)}
            className="relative p-4 sm:p-4.5 rounded-2xl bg-gradient-to-br from-rose-50 via-amber-50/40 to-white dark:from-rose-950/40 dark:via-amber-950/20 dark:to-slate-900 border-2 border-rose-200 dark:border-rose-800/80 hover:border-rose-400 dark:hover:border-rose-600 shadow-xs hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between h-full overflow-hidden"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="relative p-2.5 rounded-xl bg-rose-600 text-white shadow-md shadow-rose-600/30 shrink-0">
                  <AlertTriangle className="w-5 h-5 animate-pulse" />
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600 border-2 border-white dark:border-slate-900"></span>
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/80 px-2 py-0.5 rounded-full">
                      High Priority Dispatch
                    </span>
                  </div>
                  <h3 className="text-base font-black text-slate-900 dark:text-slate-100 mt-0.5 group-hover:text-rose-600 transition-colors">
                    Urgent Jobs Summary
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Critical tickets requiring immediate technician dispatch & resolution
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">
                  {activeUrgentJobs.length}
                </div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Total Urgent
                </div>
              </div>
            </div>

            {/* Metric Quick Stats Pills */}
            <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-rose-200/60 dark:border-rose-900/40">
              <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold truncate">Active Pending</div>
                <div className="text-sm font-extrabold text-amber-600 dark:text-amber-400">{activePendingUrgentJobs.length}</div>
              </div>

              <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold truncate">Unassigned Techs</div>
                <div className="text-sm font-extrabold text-rose-600 dark:text-rose-400">{unassignedUrgentJobs.length}</div>
              </div>

              <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold truncate">Est. Job Value</div>
                <div className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                  {curr}{activeUrgentValue.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Quick Action Footer */}
            <div className="mt-2.5 flex items-center justify-between text-xs font-bold text-rose-600 dark:text-rose-400 pt-1 border-t border-rose-200/40 dark:border-rose-900/30">
              <span className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5" /> Quick Access Filtered List
              </span>
              <span className="inline-flex items-center gap-1 bg-rose-600 text-white text-[11px] font-bold px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-xl group-hover:bg-rose-700 transition-colors shadow-xs">
                View List <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </div>
        )}

        {/* Today's Revenue Interactive Summary Card */}
        <div
          onClick={() => setIsRevenueModalOpen(true)}
          className="relative p-4 sm:p-4.5 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50/40 to-white dark:from-emerald-950/40 dark:via-teal-950/20 dark:to-slate-900 border-2 border-emerald-200 dark:border-emerald-800/80 hover:border-emerald-400 dark:hover:border-emerald-600 shadow-xs hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between h-full overflow-hidden"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/30 shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full">
                    Live Billing Collections
                  </span>
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100 mt-0.5 group-hover:text-emerald-600 transition-colors">
                  Today's Revenue Summary
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Payment receipts, paid invoices, & real-time daily cash inflows
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {curr}{todayPayments.toLocaleString()}
              </div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Collected Revenue
              </div>
            </div>
          </div>

          {/* Metric Quick Stats Pills */}
          <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-emerald-200/60 dark:border-emerald-900/40">
            <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold truncate">Paid Invoices</div>
              <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">{todayPaidInvoices.length}</div>
            </div>

            <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold truncate">Total Invoiced</div>
              <div className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                {curr}{totalSales.toLocaleString()}
              </div>
            </div>

            <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold truncate">Pending Due</div>
              <div className="text-sm font-extrabold text-rose-600 dark:text-rose-400">
                {curr}{pendingPayments.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Quick Action Footer */}
          <div className="mt-2.5 flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400 pt-1 border-t border-emerald-200/40 dark:border-emerald-900/30">
            <span className="flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5" /> Quick Access Receipts & Transactions
            </span>
            <span className="inline-flex items-center gap-1 bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-xl group-hover:bg-emerald-700 transition-colors shadow-xs">
              View Receipts <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </span>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
        {/* Today's Jobs */}
        <div
          onClick={() => navigate('jobs', { datePreset: 'today', statusFilter: 'all' })}
          className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-pointer group"
          title="Click to view Today's Jobs"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-semibold group-hover:text-indigo-600 transition-colors truncate">{t('dashboard.todayJobs', undefined, "Today's Jobs")}</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all shrink-0">
              <Briefcase className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">{todaysJobs.length}</div>
          <div className="text-[10px] text-indigo-600 font-medium mt-0.5 flex items-center justify-between">
            <span className="truncate">{t('dashboard.scheduled', undefined, 'Scheduled')}</span>
            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </div>
        </div>

        {/* Pending Jobs */}
        <div
          onClick={() => navigate('jobs', { datePreset: 'all', statusFilter: 'pending_active' })}
          className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-amber-300 dark:hover:border-amber-700 transition-all cursor-pointer group"
          title="Click to view Pending Jobs"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-semibold group-hover:text-amber-600 transition-colors truncate">{t('dashboard.pendingJobs', undefined, 'Pending Jobs')}</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-all shrink-0">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">{pendingJobs.length}</div>
          <div className="text-[10px] text-amber-600 font-medium mt-0.5 flex items-center justify-between">
            <span className="truncate">{t('dashboard.inProgress', undefined, 'In progress')}</span>
            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </div>
        </div>

        {/* Completed */}
        <div
          onClick={() => navigate('jobs', { datePreset: 'all', statusFilter: 'completed' })}
          className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 transition-all cursor-pointer group"
          title="Click to view Completed Jobs"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-semibold group-hover:text-emerald-600 transition-colors truncate">{t('dashboard.completedJobs', undefined, 'Completed')}</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">{completedJobs.length}</div>
          <div className="text-[10px] text-emerald-600 font-medium mt-0.5 flex items-center justify-between">
            <span className="truncate">{t('dashboard.resolved', undefined, 'Resolved')}</span>
            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </div>
        </div>

        {/* Total Revenue */}
        <div
          onClick={() => navigate('invoices', { statusFilter: 'all' })}
          className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer group"
          title="Click to view Invoices & Total Revenue"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-semibold group-hover:text-blue-600 transition-colors truncate">{t('dashboard.totalSales', undefined, 'Total Revenue')}</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
            {curr}{totalSales.toLocaleString()}
          </div>
          <div className="text-[10px] text-blue-600 font-medium mt-0.5 flex items-center justify-between">
            <span className="truncate">{t('dashboard.invoiced', undefined, 'Invoiced')}</span>
            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </div>
        </div>

        {/* Pending Payments / Pending Due */}
        <div
          onClick={() => navigate('invoices', { statusFilter: 'pending' })}
          className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-rose-300 dark:hover:border-rose-700 transition-all cursor-pointer group"
          title="Click to view Pending Payments & Unpaid Invoices"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-semibold group-hover:text-rose-600 transition-colors truncate">{t('dashboard.pendingPayments', undefined, 'Pending Due')}</span>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-all shrink-0">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
            {curr}{pendingPayments.toLocaleString()}
          </div>
          <div className="text-[10px] text-rose-600 font-medium mt-0.5 flex items-center justify-between">
            <span className="truncate">{t('dashboard.awaitingCollection', undefined, 'Awaiting collection')}</span>
            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </div>
        </div>

        {/* Active Customers */}
        <div
          onClick={() => navigate('customers')}
          className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-purple-300 dark:hover:border-purple-700 transition-all cursor-pointer group"
          title="Click to view Active Customers CRM"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-semibold group-hover:text-purple-600 transition-colors truncate">{t('dashboard.totalCustomers', undefined, 'Customers')}</span>
            <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all shrink-0">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">{customers.length}</div>
          <div className="text-[10px] text-purple-600 font-medium mt-0.5 flex items-center justify-between">
            <span className="truncate">{t('dashboard.crmDatabase', undefined, 'CRM Database')}</span>
            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </div>
        </div>
      </div>

      {/* Enquiries & Intake Module Quick Conversion Banner */}
      <div className="p-4 sm:p-4.5 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-xs border border-blue-800/60 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/30 shrink-0 flex items-center justify-center self-center">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-0.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-300 bg-blue-500/20 px-2.5 py-0.5 rounded-full border border-blue-400/30">
                Service Enquiries & Intake
              </span>
              {followUpsDueTodayCount > 0 && (
                <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-400/30 flex items-center gap-1">
                  <CalendarClock className="w-3 h-3" /> {followUpsDueTodayCount} Follow-up{followUpsDueTodayCount > 1 ? 's' : ''} Due Today
                </span>
              )}
            </div>
            <h3 className="text-sm sm:text-base font-black text-white leading-tight">
              Prospective Customer Intake & Job Conversion
            </h3>
            <p className="text-xs text-blue-200/80 mt-0.5 leading-relaxed">
              Manage incoming calls, qualify requests, prepare quotes, and convert directly into scheduled field jobs.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap lg:flex-nowrap shrink-0 justify-between lg:justify-end">
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2 shrink-0">
            <div className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15 text-center min-w-[58px] sm:min-w-[66px] flex flex-col items-center justify-center">
              <div className="text-[9px] sm:text-[10px] text-blue-200 uppercase font-bold tracking-wider">New</div>
              <div className="text-xs sm:text-sm font-black text-white">{newEnquiriesCount}</div>
            </div>
            <div className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15 text-center min-w-[58px] sm:min-w-[66px] flex flex-col items-center justify-center">
              <div className="text-[9px] sm:text-[10px] text-blue-200 uppercase font-bold tracking-wider">Qualified</div>
              <div className="text-xs sm:text-sm font-black text-purple-300">{qualifiedEnquiriesCount}</div>
            </div>
            <div className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15 text-center min-w-[58px] sm:min-w-[66px] flex flex-col items-center justify-center">
              <div className="text-[9px] sm:text-[10px] text-blue-200 uppercase font-bold tracking-wider">Quoted</div>
              <div className="text-xs sm:text-sm font-black text-sky-300">{quotedEnquiriesCount}</div>
            </div>
            <div className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15 text-center min-w-[58px] sm:min-w-[66px] flex flex-col items-center justify-center">
              <div className="text-[9px] sm:text-[10px] text-blue-200 uppercase font-bold tracking-wider">Converted</div>
              <div className="text-xs sm:text-sm font-black text-emerald-300">{convertedEnquiriesCount}</div>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('enquiries')}
            className="px-3.5 sm:px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95 shrink-0"
          >
            <span>Open Enquiries</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Critical Alerts Bar (Low Stock & Contract Expiry) */}
      {(lowStockItems.length > 0 || expiringContracts.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
          {lowStockItems.length > 0 && (
            <div
              onClick={() => setActiveTab('inventory')}
              className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between cursor-pointer hover:bg-amber-100/80 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-amber-500 text-white shrink-0">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-amber-900 dark:text-amber-200">
                    Low Stock Alert ({lowStockItems.length} items)
                  </div>
                  <div className="text-[11px] text-amber-700 dark:text-amber-300 line-clamp-1">
                    {lowStockItems.map((i) => `${i.name} (${i.currentStock} ${i.unit})`).join(', ')}
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-700 shrink-0 ml-2" />
            </div>
          )}

          {expiringContracts.length > 0 && (
            <div
              onClick={() => setActiveTab('contracts')}
              className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between cursor-pointer hover:bg-indigo-100/80 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-indigo-600 text-white shrink-0">
                  <Repeat className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                    Service Contracts Expiring Soon ({expiringContracts.length})
                  </div>
                  <div className="text-[11px] text-indigo-700 dark:text-indigo-300 line-clamp-1">
                    {expiringContracts.map((c) => `${c.name} (${c.contractNumber})`).join(', ')}
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-indigo-700 shrink-0 ml-2" />
            </div>
          )}
        </div>
      )}

      {/* Main Charts & Today's Dispatch Schedule Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 sm:gap-4">
        {/* Sales & Collections Trend Chart */}
        <div className="lg:col-span-2 p-4 sm:p-4.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2.5">
            <div>
              <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-100">Revenue & Collections Overview</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Monthly billing vs payment receipts</p>
            </div>
            <span className="text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
              {now.getFullYear()} Trend
            </span>
          </div>

          <div className="h-48 sm:h-52 w-full flex items-center justify-center">
            {!hasRevenueData ? (
              <div className="h-full w-full flex flex-col items-center justify-center text-center p-4 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-1.5 shadow-2xs">
                  <TrendingUp className="w-4.5 h-4.5" />
                </div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">No Revenue & Billing Activity Yet</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm mt-0.5">
                  Monthly invoices and payments collected will automatically graph here once transactions are recorded.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesChartData} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#1e293b',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                    formatter={(value: any) => [`${curr}${Number(value).toLocaleString()}`, '']}
                  />
                  <Area type="monotone" dataKey="sales" name="Sales Invoiced" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#salesGrad)" />
                  <Area type="monotone" dataKey="collections" name="Payments Collected" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Job Status Breakdown Chart */}
        <div className="p-4 sm:p-4.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-100 mb-0.5">Jobs Distribution</h2>
            <p className="text-[11px] text-slate-500 mb-2">Breakdown by current workflow status</p>

            <div className="h-36 sm:h-40 w-full">
              {totalWorkflowJobs === 0 ? (
                <div className="h-full w-full flex flex-col items-center justify-center text-center p-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-1.5">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">0 Active Jobs</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">All test/dummy data has been cleaned</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={jobStatusData.filter((d) => d.value > 0)} cx="50%" cy="50%" innerRadius={40} outerRadius={58} paddingAngle={4} dataKey="value">
                      {jobStatusData.filter((d) => d.value > 0).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#1e293b',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '11px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            {jobStatusData.map((item) => {
              const statusKey = (item.name || '').toLowerCase().replace(' ', '_');
              return (
                <div
                  key={item.name}
                  onClick={() => navigate('jobs', { statusFilter: statusKey })}
                  className="flex items-center gap-1.5 text-xs p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title={`View ${item.name} jobs`}
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600 dark:text-slate-400 text-[10px] truncate">{item.name}:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-[10px]">{item.value}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Today's Dispatch Schedule - 2-Column Responsive Grid on Desktop */}
      <div className="p-4 sm:p-4.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-100">Today's Dispatch Schedule</h2>
            <p className="text-[11px] text-slate-500">Live technician assignments and appointment timeline</p>
          </div>
          <button
            onClick={() => setActiveTab('jobs')}
            className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
          >
            View All Jobs <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div>
          {(jobs || []).length === 0 ? (
            <div className="p-6 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
              No dispatch jobs scheduled for today.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 sm:gap-3">
              {(jobs || []).slice(0, 4).map((job) => {
                const customer = (customers || []).find((c) => c.id === job.customerId);
                const assignedTech = (staff || []).find((s) => s.id === job.assignedStaffId);

                // Parse scheduled time and slot name cleanly
                const rawTime = (job.scheduledTime || job.scheduledTimeSlot || '09:00 AM – 11:00 AM').trim();
                const parenMatch = rawTime.match(/^(.*?)(?:\s*\((.*?)\))?$/);
                const displayTime = parenMatch
                  ? parenMatch[1].trim().replace(/\s*-\s*/, ' – ')
                  : rawTime.replace(/\s*-\s*/, ' – ');
                const displaySlot = parenMatch && parenMatch[2]
                  ? parenMatch[2].trim()
                  : (job.scheduledTimeSlot && job.scheduledTimeSlot !== displayTime && !displayTime.includes(job.scheduledTimeSlot)
                    ? job.scheduledTimeSlot
                    : undefined);

                // Clean leading commas / whitespace from location
                const cleanLocation = (job.location || 'On-site address, Local').replace(/^[\s,]+/, '').trim() || 'On-site address';

                return (
                  <div
                    key={job.id}
                    id={`dispatch-job-${job.id}`}
                    onClick={() => setActiveTab('jobs')}
                    className="p-2.5 sm:p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 hover:border-indigo-300 dark:hover:border-indigo-700 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                  >
                    {/* TOP SECTION: Horizontal Time Box + Job Details */}
                    <div className="flex items-center gap-2.5">
                      {/* LEFT: Compact Time Box */}
                      <div className="w-[90px] sm:w-[105px] shrink-0 px-2 py-1 rounded-lg bg-indigo-50/90 dark:bg-indigo-950/70 border border-indigo-100 dark:border-indigo-900/60 flex flex-col items-center justify-center text-center self-stretch">
                        <div className="text-[10px] font-bold text-indigo-900 dark:text-indigo-200 leading-tight text-center">
                          {displayTime}
                        </div>
                        {displaySlot ? (
                          <div className="text-[9px] font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5 text-center leading-tight">
                            {displaySlot}
                          </div>
                        ) : (
                          <div className="text-[8.5px] font-medium text-indigo-500/80 dark:text-indigo-400/80 mt-0.5 text-center leading-tight">
                            Scheduled
                          </div>
                        )}
                      </div>

                      {/* RIGHT: Job ID, Status, Customer, Location */}
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-100 tracking-tight truncate">
                            {job.jobId}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider shrink-0 ${
                              job.status === 'completed'
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                                : job.status === 'in_progress'
                                ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 animate-pulse'
                                : job.status === 'cancelled'
                                ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                                : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                            }`}
                          >
                            {job.status.replace('_', ' ')}
                          </span>
                        </div>

                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                          {customer?.name || 'Customer'}
                          <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400 ml-1">
                            ({customer?.companyName || (customer?.customerType === 'commercial' ? 'Commercial' : 'Individual')})
                          </span>
                        </div>

                        <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{cleanLocation}</span>
                        </div>
                      </div>
                    </div>

                    {/* BOTTOM SECTION: Single Compact Row (Technician + Amount) */}
                    <div className="mt-2 pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 min-w-0">
                        <User className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="text-[10px] text-slate-400 font-medium shrink-0">Tech:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate">
                          {assignedTech ? assignedTech.name : 'Unassigned'}
                        </span>
                      </div>

                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-lg border border-indigo-200/50 dark:border-indigo-800/60 shrink-0">
                        {curr}{job.estimatedAmount}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* New Enquiry Modal */}
      <EnquiryFormModal
        isOpen={isNewEnquiryOpen}
        onClose={() => setIsNewEnquiryOpen(false)}
      />

      {/* Add Customer Modal */}
      {isAddCustomerOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Add New Customer</h3>
                  <p className="text-xs text-slate-500">Create a customer profile for jobs & billing</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddCustomerOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomerSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Customer / Contact Name *
                </label>
                <input
                  type="text"
                  required
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  placeholder="e.g. Apex Tech Solutions or Sarah Jenkins"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mobile Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={custMobile}
                    onChange={(e) => setCustMobile(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={custEmail}
                    onChange={(e) => setCustEmail(e.target.value)}
                    placeholder="contact@company.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Customer Type
                  </label>
                  <select
                    value={custType}
                    onChange={(e) => setCustType(e.target.value as 'commercial' | 'individual')}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
                  >
                    <option value="commercial">Commercial / Business</option>
                    <option value="individual">Individual / Residential</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={custCompany}
                    onChange={(e) => setCustCompany(e.target.value)}
                    placeholder="Company name (optional)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Service Location Address
                </label>
                <input
                  type="text"
                  value={custAddress}
                  onChange={(e) => setCustAddress(e.target.value)}
                  placeholder="Complete street address, site location"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddCustomerOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Quote Modal */}
      {isQuickQuoteOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Quick Quotation</h3>
                  <p className="text-xs text-slate-500">Generate an instant service estimate</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickQuoteOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickQuoteSubmit} className="space-y-3">
              <div>
                <CustomerSearchSelect
                  id="quick-quote-customer-select"
                  customers={customers}
                  value={quoteCustomerId}
                  onChange={(id) => setQuoteCustomerId(id)}
                  label="Select Customer"
                  required
                  placeholder="Type to search customers by name, phone, company..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Service / Item Description *
                </label>
                <input
                  type="text"
                  required
                  value={quoteDescription}
                  onChange={(e) => setQuoteDescription(e.target.value)}
                  placeholder="e.g. 4K Camera Installation & Cable Laying"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Estimated Rate ({curr}) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={quoteRate || ''}
                    onChange={(e) => setQuoteRate(Number(e.target.value))}
                    placeholder="e.g. 2500"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tax Percentage (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={quoteTax}
                    onChange={(e) => setQuoteTax(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Notes / Payment Terms
                </label>
                <input
                  type="text"
                  value={quoteNotes}
                  onChange={(e) => setQuoteNotes(e.target.value)}
                  placeholder="e.g. Valid for 15 days. 50% advance."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Estimated Calculation summary */}
              <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40 text-xs flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Estimated Total:</span>
                <span className="font-extrabold text-emerald-700 dark:text-emerald-400 text-sm">
                  {curr}{((Number(quoteRate) || 0) * (1 + (Number(quoteTax) || 0) / 100)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsQuickQuoteOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  Create Quotation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Urgent Jobs Quick Access Modal */}
      {isUrgentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col border border-slate-200 dark:border-slate-800 shadow-2xl relative overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-rose-500/10 via-amber-500/5 to-transparent dark:from-rose-950/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-rose-600 text-white shadow-md shadow-rose-600/30">
                  <AlertTriangle className="w-5 h-5 animate-bounce" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-lg">Urgent & High Priority Jobs</h3>
                    <span className="text-xs bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 font-bold px-2.5 py-0.5 rounded-full">
                      {filteredUrgentModalJobs.length} Tickets
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Quick dispatch list for high priority service calls</p>
                </div>
              </div>
              <button
                onClick={() => setIsUrgentModalOpen(false)}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Tabs & Search Bar */}
            <div className="p-4 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 space-y-3 shrink-0">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                {/* Tabs */}
                <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-700/80">
                  <button
                    onClick={() => setUrgentTabFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      urgentTabFilter === 'all'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                  >
                    All Urgent ({urgentJobsList.length})
                  </button>
                  <button
                    onClick={() => setUrgentTabFilter('pending')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      urgentTabFilter === 'pending'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                  >
                    Active Pending ({activeUrgentJobs.length})
                  </button>
                  <button
                    onClick={() => setUrgentTabFilter('unassigned')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      urgentTabFilter === 'unassigned'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                  >
                    Unassigned ({unassignedUrgentJobs.length})
                  </button>
                </div>

                {/* Search Input */}
                <div className="relative flex-1 max-w-xs">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={urgentSearch}
                    onChange={(e) => setUrgentSearch(e.target.value)}
                    placeholder="Search urgent job ID, customer..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-rose-500 outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* List Scroll Area */}
            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              {filteredUrgentModalJobs.length === 0 ? (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400 space-y-2">
                  <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto opacity-50" />
                  <p className="text-xs font-bold">No urgent jobs matching your criteria.</p>
                </div>
              ) : (
                filteredUrgentModalJobs.map((job) => {
                  const customer = customers.find((c) => c.id === job.customerId);
                  const tech = staff.find((s) => s.id === job.assignedStaffId);

                  return (
                    <div
                      key={job.id}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 hover:border-rose-300 dark:hover:border-rose-700 transition-all space-y-2.5 shadow-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-900 dark:text-slate-100">{job.jobId}</span>
                          <span
                            className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                              job.priority === 'urgent'
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 animate-pulse'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                            }`}
                          >
                            {job.priority} priority
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              job.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                            }`}
                          >
                            {job.status.replace('_', ' ')}
                          </span>
                        </div>

                        <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                          {curr}{job.estimatedAmount}
                        </span>
                      </div>

                      <div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {customer?.name || 'Customer'} {customer?.companyName && `(${customer.companyName})`}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-1">
                          {job.description}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {job.scheduledDate} ({job.scheduledTime})
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {job.location}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            Tech: {tech ? tech.name : <span className="text-rose-600 dark:text-rose-400 font-bold">⚠️ Unassigned</span>}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Showing <span className="font-bold text-slate-800 dark:text-slate-200">{filteredUrgentModalJobs.length}</span> urgent tickets
              </div>

              <button
                onClick={() => {
                  setIsUrgentModalOpen(false);
                  navigate('jobs', { priorityFilter: 'urgent_high' });
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all shadow-md active:scale-95 cursor-pointer"
              >
                Open Full Jobs Board (Filtered) <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Today's Revenue Quick Access Modal */}
      {isRevenueModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col border border-slate-200 dark:border-slate-800 shadow-2xl relative overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent dark:from-emerald-950/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/30">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-lg">Today's Revenue & Receipts</h3>
                    <span className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-bold px-2.5 py-0.5 rounded-full">
                      {curr}{filteredRevenueModalInvoices.reduce((sum, i) => sum + i.paidAmount, 0).toLocaleString()} Collected
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Paid billing transactions and customer payment receipts</p>
                </div>
              </div>
              <button
                onClick={() => setIsRevenueModalOpen(false)}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Tabs & Search Bar */}
            <div className="p-4 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 space-y-3 shrink-0">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                {/* Tabs */}
                <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-700/80">
                  <button
                    onClick={() => setRevenueTabFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      revenueTabFilter === 'all'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                  >
                    All Invoices ({invoices.length})
                  </button>
                  <button
                    onClick={() => setRevenueTabFilter('paid')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      revenueTabFilter === 'paid'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                  >
                    Paid Receipts ({todayPaidInvoices.length})
                  </button>
                  <button
                    onClick={() => setRevenueTabFilter('pending')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      revenueTabFilter === 'pending'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                  >
                    Pending Collection ({invoices.filter((i) => i.status !== 'paid').length})
                  </button>
                </div>

                {/* Search Input */}
                <div className="relative flex-1 max-w-xs">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={revenueSearch}
                    onChange={(e) => setRevenueSearch(e.target.value)}
                    placeholder="Search invoice #, customer name..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* List Scroll Area */}
            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              {filteredRevenueModalInvoices.length === 0 ? (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400 space-y-2">
                  <Receipt className="w-8 h-8 text-emerald-400 mx-auto opacity-50" />
                  <p className="text-xs font-bold">No invoice transactions matching your filter.</p>
                </div>
              ) : (
                filteredRevenueModalInvoices.map((inv) => {
                  const customer = customers.find((c) => c.id === inv.customerId);

                  return (
                    <div
                      key={inv.id}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all space-y-2 shadow-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-900 dark:text-slate-100">{inv.invoiceNumber}</span>
                          <span
                            className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                              inv.status === 'paid'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                : inv.status === 'partial'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                            }`}
                          >
                            {inv.status}
                          </span>
                        </div>

                        <div className="text-right">
                          <div className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                            Collected: {curr}{inv.paidAmount}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Grand Total: {curr}{inv.grandTotal}
                          </div>
                        </div>
                      </div>

                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {customer?.name || 'Customer'} {customer?.companyName && `(${customer.companyName})`}
                      </div>

                      <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                        <span>Issued Date: {inv.date} (Due: {inv.dueDate})</span>
                        {inv.notes && <span className="truncate max-w-xs text-slate-400">{inv.notes}</span>}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Total Filtered Revenue: <span className="font-extrabold text-emerald-600">{curr}{filteredRevenueModalInvoices.reduce((sum, i) => sum + i.paidAmount, 0).toLocaleString()}</span>
              </div>

              <button
                onClick={() => {
                  setIsRevenueModalOpen(false);
                  navigate('invoices', { statusFilter: 'paid' });
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md active:scale-95 cursor-pointer"
              >
                Open Invoices Module (Filtered) <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

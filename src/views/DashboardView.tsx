import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Briefcase,
  Users,
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
} from 'lucide-react';
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
    staff,
    currentBusiness,
    setIsActivityLogOpen,
    addCustomer,
    addQuotation,
    syncOfflineQueue,
    pendingSyncQueue,
    showToast,
  } = useApp();

  // Quick Action Modal States
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
  const [quoteRate, setQuoteRate] = useState<number>(1500);
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
    setQuoteRate(1500);
    setIsQuickQuoteOpen(false);
  };

  const handleSyncData = () => {
    setIsSyncing(true);
    syncOfflineQueue();
    setTimeout(() => {
      setIsSyncing(false);
      showToast(
        pendingSyncQueue.length > 0
          ? 'Synchronized offline queue with server database!'
          : 'All field technician data is synchronized and up-to-date!',
        'success'
      );
    }, 600);
  };

  const curr = currentBusiness.currency;

  // KPI Calculations
  const todayStr = new Date().toISOString().split('T')[0];
  const todaysJobs = jobs.filter((j) => j.scheduledDate === todayStr || j.status === 'in_progress' || j.status === 'assigned');
  const pendingJobs = jobs.filter((j) => j.status !== 'completed' && j.status !== 'closed' && j.status !== 'cancelled');
  const completedJobs = jobs.filter((j) => j.status === 'completed' || j.status === 'closed');
  
  const todayPayments = invoices
    .filter((inv) => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.paidAmount, 0);

  const totalSales = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const pendingPayments = invoices.reduce((sum, inv) => sum + inv.balanceAmount, 0);

  // Urgent Jobs calculations & modal filters
  const urgentJobsList = jobs.filter((j) => j.priority === 'urgent' || j.priority === 'high');
  const activeUrgentJobs = urgentJobsList.filter(
    (j) => j.status !== 'completed' && j.status !== 'closed' && j.status !== 'cancelled'
  );
  const unassignedUrgentJobs = urgentJobsList.filter(
    (j) => !j.assignedStaffId && j.status !== 'completed' && j.status !== 'closed' && j.status !== 'cancelled'
  );

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
        ? job.status !== 'completed' && job.status !== 'closed' && job.status !== 'cancelled'
        : !job.assignedStaffId && job.status !== 'completed' && job.status !== 'closed' && job.status !== 'cancelled';

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

  const completedJobsCount = jobs.filter((j) => j.status === 'completed' || j.status === 'closed').length;
  const inProgressJobsCount = jobs.filter((j) => j.status === 'in_progress').length;
  const assignedJobsCount = jobs.filter((j) => j.status === 'assigned').length;
  const newJobsCount = jobs.filter((j) => j.status === 'new').length;
  const totalWorkflowJobs = completedJobsCount + inProgressJobsCount + assignedJobsCount + newJobsCount;

  const jobStatusData = [
    { name: 'Completed', value: completedJobsCount, color: '#10b981' },
    { name: 'In Progress', value: inProgressJobsCount, color: '#3b82f6' },
    { name: 'Assigned', value: assignedJobsCount, color: '#f59e0b' },
    { name: 'New', value: newJobsCount, color: '#8b5cf6' },
  ];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs bg-indigo-500/20 text-indigo-300 font-bold px-2.5 py-0.5 rounded-full border border-indigo-500/30">
              {currentBusiness.type}
            </span>
            <span className="text-xs text-slate-400">Live Operations Dashboard</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">{currentBusiness.name}</h1>
          <p className="text-xs text-slate-300 mt-0.5">
            Overview of jobs, dispatches, technician tracking, & financial metrics for today.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsActivityLogOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition-all active:scale-95"
          >
            <History className="w-4 h-4 text-indigo-300" /> Activity Log
          </button>
          <button
            onClick={onOpenNewJob}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" /> Schedule New Job
          </button>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="bg-white dark:bg-slate-900 p-4.5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Quick Actions
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Direct access to core field service & administrative tasks
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

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Action 1: Add Customer */}
          <button
            onClick={() => setIsAddCustomerOpen(true)}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50/80 hover:bg-indigo-50 dark:bg-slate-800/60 dark:hover:bg-indigo-950/40 border border-slate-200/60 dark:border-slate-700/60 hover:border-indigo-300 dark:hover:border-indigo-600/50 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-300 transition-all group active:scale-95 cursor-pointer"
          >
            <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 mb-1.5 group-hover:scale-110 transition-transform">
              <UserPlus className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold">Add Customer</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">Create CRM entry</span>
          </button>

          {/* Action 2: Quick Quote */}
          <button
            onClick={() => setIsQuickQuoteOpen(true)}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50/80 hover:bg-emerald-50 dark:bg-slate-800/60 dark:hover:bg-emerald-950/40 border border-slate-200/60 dark:border-slate-700/60 hover:border-emerald-300 dark:hover:border-emerald-600/50 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-300 transition-all group active:scale-95 cursor-pointer"
          >
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 mb-1.5 group-hover:scale-110 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold">Quick Quote</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">Generate estimate</span>
          </button>

          {/* Action 3: Schedule Job */}
          <button
            onClick={onOpenNewJob}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50/80 hover:bg-purple-50 dark:bg-slate-800/60 dark:hover:bg-purple-950/40 border border-slate-200/60 dark:border-slate-700/60 hover:border-purple-300 dark:hover:border-purple-600/50 text-slate-700 dark:text-slate-200 hover:text-purple-600 dark:hover:text-purple-300 transition-all group active:scale-95 cursor-pointer"
          >
            <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 mb-1.5 group-hover:scale-110 transition-transform">
              <Plus className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold">Schedule Job</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">Dispatch tech</span>
          </button>

          {/* Action 4: Create Invoice */}
          <button
            onClick={() => navigate('invoices', { statusFilter: 'all' })}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50/80 hover:bg-rose-50 dark:bg-slate-800/60 dark:hover:bg-rose-950/40 border border-slate-200/60 dark:border-slate-700/60 hover:border-rose-300 dark:hover:border-rose-600/50 text-slate-700 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-300 transition-all group active:scale-95 cursor-pointer"
          >
            <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 mb-1.5 group-hover:scale-110 transition-transform">
              <Receipt className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold">Create Invoice</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">Bill & payment</span>
          </button>
        </div>
      </div>

      {/* Interactive Featured Summary Cards: Urgent Jobs & Today's Revenue */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Urgent Jobs Interactive Summary Card */}
        <div
          onClick={() => setIsUrgentModalOpen(true)}
          className="relative p-5 rounded-3xl bg-gradient-to-br from-rose-50 via-amber-50/40 to-white dark:from-rose-950/40 dark:via-amber-950/20 dark:to-slate-900 border-2 border-rose-200 dark:border-rose-800/80 hover:border-rose-400 dark:hover:border-rose-600 shadow-sm hover:shadow-xl transition-all cursor-pointer group overflow-hidden"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative p-3 rounded-2xl bg-rose-600 text-white shadow-md shadow-rose-600/30 shrink-0">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-600 border-2 border-white dark:border-slate-900"></span>
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/80 px-2.5 py-0.5 rounded-full">
                    High Priority Dispatch
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 mt-0.5 group-hover:text-rose-600 transition-colors">
                  Urgent Jobs Summary
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Critical tickets requiring immediate technician dispatch & resolution
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
                {urgentJobsList.length}
              </div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Total Urgent
              </div>
            </div>
          </div>

          {/* Metric Quick Stats Pills */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-rose-200/60 dark:border-rose-900/40">
            <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">Active Pending</div>
              <div className="text-sm font-extrabold text-amber-600 dark:text-amber-400">{activeUrgentJobs.length}</div>
            </div>

            <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">Unassigned Techs</div>
              <div className="text-sm font-extrabold text-rose-600 dark:text-rose-400">{unassignedUrgentJobs.length}</div>
            </div>

            <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">Est. Job Value</div>
              <div className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                {curr}{urgentJobsList.reduce((sum, j) => sum + j.estimatedAmount, 0).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Quick Action Footer */}
          <div className="mt-3 flex items-center justify-between text-xs font-bold text-rose-600 dark:text-rose-400 pt-1">
            <span className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5" /> Quick Access Filtered List
            </span>
            <span className="inline-flex items-center gap-1 bg-rose-600 text-white text-[11px] font-bold px-3 py-1 rounded-xl group-hover:bg-rose-700 transition-colors shadow-xs">
              View List <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </span>
          </div>
        </div>

        {/* Today's Revenue Interactive Summary Card */}
        <div
          onClick={() => setIsRevenueModalOpen(true)}
          className="relative p-5 rounded-3xl bg-gradient-to-br from-emerald-50 via-teal-50/40 to-white dark:from-emerald-950/40 dark:via-teal-950/20 dark:to-slate-900 border-2 border-emerald-200 dark:border-emerald-800/80 hover:border-emerald-400 dark:hover:border-emerald-600 shadow-sm hover:shadow-xl transition-all cursor-pointer group overflow-hidden"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/30 shrink-0">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-2.5 py-0.5 rounded-full">
                    Live Billing Collections
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 mt-0.5 group-hover:text-emerald-600 transition-colors">
                  Today's Revenue Summary
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Payment receipts, paid invoices, & real-time daily cash inflows
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {curr}{todayPayments.toLocaleString()}
              </div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Collected Revenue
              </div>
            </div>
          </div>

          {/* Metric Quick Stats Pills */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-emerald-200/60 dark:border-emerald-900/40">
            <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">Paid Invoices</div>
              <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">{todayPaidInvoices.length}</div>
            </div>

            <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">Total Invoiced</div>
              <div className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                {curr}{totalSales.toLocaleString()}
              </div>
            </div>

            <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">Pending Due</div>
              <div className="text-sm font-extrabold text-rose-600 dark:text-rose-400">
                {curr}{pendingPayments.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Quick Action Footer */}
          <div className="mt-3 flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400 pt-1">
            <span className="flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5" /> Quick Access Receipts & Transactions
            </span>
            <span className="inline-flex items-center gap-1 bg-emerald-600 text-white text-[11px] font-bold px-3 py-1 rounded-xl group-hover:bg-emerald-700 transition-colors shadow-xs">
              View Receipts <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </span>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Today's Jobs */}
        <div
          onClick={() => navigate('jobs', { datePreset: 'today', statusFilter: 'all' })}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-pointer group"
          title="Click to view Today's Jobs"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold group-hover:text-indigo-600 transition-colors">Today's Jobs</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-slate-100">{todaysJobs.length}</div>
          <div className="text-[10px] text-indigo-600 font-medium mt-1 flex items-center justify-between">
            <span>Scheduled / Active</span>
            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </div>
        </div>

        {/* Pending Jobs */}
        <div
          onClick={() => navigate('jobs', { datePreset: 'all', statusFilter: 'pending_active' })}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-amber-300 dark:hover:border-amber-700 transition-all cursor-pointer group"
          title="Click to view Pending Jobs"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold group-hover:text-amber-600 transition-colors">Pending Jobs</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-all">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-slate-100">{pendingJobs.length}</div>
          <div className="text-[10px] text-amber-600 font-medium mt-1 flex items-center justify-between">
            <span>Awaiting completion</span>
            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </div>
        </div>

        {/* Completed */}
        <div
          onClick={() => navigate('jobs', { datePreset: 'all', statusFilter: 'completed' })}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 transition-all cursor-pointer group"
          title="Click to view Completed Jobs"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold group-hover:text-emerald-600 transition-colors">Completed</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-slate-100">{completedJobs.length}</div>
          <div className="text-[10px] text-emerald-600 font-medium mt-1 flex items-center justify-between">
            <span>Jobs resolved</span>
            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </div>
        </div>

        {/* Total Revenue */}
        <div
          onClick={() => navigate('invoices', { statusFilter: 'all' })}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer group"
          title="Click to view Invoices & Total Revenue"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold group-hover:text-blue-600 transition-colors">Total Revenue</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {curr}{totalSales.toLocaleString()}
          </div>
          <div className="text-[10px] text-blue-600 font-medium mt-1 flex items-center justify-between">
            <span>Invoiced this period</span>
            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </div>
        </div>

        {/* Pending Payments / Pending Due */}
        <div
          onClick={() => navigate('invoices', { statusFilter: 'pending' })}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-rose-300 dark:hover:border-rose-700 transition-all cursor-pointer group"
          title="Click to view Pending Payments & Unpaid Invoices"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold group-hover:text-rose-600 transition-colors">Pending Payments</span>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-all">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {curr}{pendingPayments.toLocaleString()}
          </div>
          <div className="text-[10px] text-rose-600 font-medium mt-1 flex items-center justify-between">
            <span>Awaiting collection</span>
            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </div>
        </div>

        {/* Active Customers */}
        <div
          onClick={() => navigate('customers')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-purple-300 dark:hover:border-purple-700 transition-all cursor-pointer group"
          title="Click to view Active Customers CRM"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold group-hover:text-purple-600 transition-colors">Active Customers</span>
            <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-slate-100">{customers.length}</div>
          <div className="text-[10px] text-purple-600 font-medium mt-1 flex items-center justify-between">
            <span>CRM Database</span>
            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </div>
        </div>
      </div>

      {/* Critical Alerts Bar (Low Stock & Contract Expiry) */}
      {(lowStockItems.length > 0 || expiringContracts.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {lowStockItems.length > 0 && (
            <div
              onClick={() => setActiveTab('inventory')}
              className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between cursor-pointer hover:bg-amber-100/80 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500 text-white shrink-0">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-amber-900 dark:text-amber-200">
                    Low Stock Alert ({lowStockItems.length} items)
                  </div>
                  <div className="text-[11px] text-amber-700 dark:text-amber-300">
                    {lowStockItems.map((i) => `${i.name} (${i.currentStock} ${i.unit})`).join(', ')}
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-700" />
            </div>
          )}

          {expiringContracts.length > 0 && (
            <div
              onClick={() => setActiveTab('contracts')}
              className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between cursor-pointer hover:bg-indigo-100/80 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-600 text-white shrink-0">
                  <Repeat className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                    Service Contracts Expiring Soon ({expiringContracts.length})
                  </div>
                  <div className="text-[11px] text-indigo-700 dark:text-indigo-300">
                    {expiringContracts.map((c) => `${c.name} (${c.contractNumber})`).join(', ')}
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-indigo-700" />
            </div>
          )}
        </div>
      )}

      {/* Main Charts & Today's Dispatch Schedule Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales & Collections Trend Chart */}
        <div className="lg:col-span-2 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Revenue & Collections Overview</h2>
              <p className="text-xs text-slate-500">Monthly billing vs payment receipts</p>
            </div>
            <span className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 px-2.5 py-1 rounded-lg">
              2026 Trend
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                />
                <Area type="monotone" dataKey="sales" name="Sales Invoiced" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#salesGrad)" />
                <Area type="monotone" dataKey="collections" name="Payments Collected" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Job Status Breakdown Chart */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 mb-1">Jobs Distribution</h2>
            <p className="text-xs text-slate-500 mb-4">Breakdown by current workflow status</p>

            <div className="h-44 w-full">
              {totalWorkflowJobs === 0 ? (
                <div className="h-full w-full flex flex-col items-center justify-center text-center p-4">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-2">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">0 Active Jobs</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">All test/dummy data has been cleaned</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={jobStatusData.filter((d) => d.value > 0)} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={4} dataKey="value">
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

          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            {jobStatusData.map((item) => {
              const statusKey = (item.name || '').toLowerCase().replace(' ', '_');
              return (
                <div
                  key={item.name}
                  onClick={() => navigate('jobs', { statusFilter: statusKey })}
                  className="flex items-center gap-2 text-xs p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title={`View ${item.name} jobs`}
                >
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600 dark:text-slate-400 text-[11px] truncate">{item.name}:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-[11px]">{item.value}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>


      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">Today's Dispatch Schedule</h2>
            <p className="text-xs text-slate-500">Live technician assignments and appointment timeline</p>
          </div>
          <button
            onClick={() => setActiveTab('jobs')}
            className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
          >
            View All Jobs <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-3">
          {(jobs || []).slice(0, 4).map((job) => {
            const customer = (customers || []).find((c) => c.id === job.customerId);
            const assignedTech = (staff || []).find((s) => s.id === job.assignedStaffId);

            return (
              <div
                key={job.id}
                onClick={() => setActiveTab('jobs')}
                className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/70 hover:border-indigo-300 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold text-xs shrink-0 flex flex-col items-center justify-center w-16">
                    <Calendar className="w-3.5 h-3.5 mb-0.5" />
                    <span>{job.scheduledTime || '09:30 AM'}</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100">{job.jobId}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          job.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-700'
                            : job.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-700 animate-pulse'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {job.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {customer?.name || 'Customer'} ({customer?.companyName || 'Individual'})
                    </div>

                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate max-w-sm">{job.location}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-0 border-slate-200/60 dark:border-slate-700/60">
                  <div className="text-left sm:text-right">
                    <div className="text-[11px] text-slate-400 font-medium">Technician</div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      {assignedTech ? assignedTech.name : 'Unassigned'}
                    </div>
                  </div>

                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1.5 rounded-xl border border-indigo-200/50">
                    {curr}{job.estimatedAmount}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

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
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Select Customer *
                </label>
                <select
                  required
                  value={quoteCustomerId}
                  onChange={(e) => setQuoteCustomerId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100"
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.companyName || c.mobile})
                    </option>
                  ))}
                </select>
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

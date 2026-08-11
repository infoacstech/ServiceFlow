import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { RouteOptimizerModal } from '../components/RouteOptimizerModal';
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
  Navigation,
  Trophy,
  Award,
  Star,
  Medal,
  Flame,
  Target,
  ShieldCheck,
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
  const [isRouteOptimizerOpen, setIsRouteOptimizerOpen] = useState(false);
  const [leaderboardTimeframe, setLeaderboardTimeframe] = useState<'week' | 'month' | 'all'>('month');
  const [quoteCustomerId, setQuoteCustomerId] = useState('');
  const [quoteDescription, setQuoteDescription] = useState('');
  const [quoteRate, setQuoteRate] = useState<number>(1500);
  const [quoteTax, setQuoteTax] = useState<number>(18);
  const [quoteNotes, setQuoteNotes] = useState('Payment 50% advance upon quotation approval.');

  const [isSyncing, setIsSyncing] = useState(false);

  const handleAddCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName || !custMobile) return;

    addCustomer({
      name: custName,
      mobile: custMobile,
      email: custEmail,
      companyName: custCompany,
      address: custAddress || 'On-site address',
      type: custType,
      gstin: '',
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
      totalAmount,
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

  const lowStockItems = inventory.filter((item) => item.currentStock <= item.minStock);
  const expiringContracts = contracts.filter((c) => c.status === 'expiring_soon' || c.status === 'expired');

  // Chart Data
  const salesChartData = [
    { month: 'Apr', sales: 42000, collections: 38000 },
    { month: 'May', sales: 58000, collections: 52000 },
    { month: 'Jun', sales: 64000, collections: 61000 },
    { month: 'Jul', sales: 79000, collections: 73000 },
    { month: 'Aug', sales: totalSales || 88000, collections: todayPayments || 82000 },
  ];

  const jobStatusData = [
    { name: 'Completed', value: completedJobs.length || 8, color: '#10b981' },
    { name: 'In Progress', value: jobs.filter((j) => j.status === 'in_progress').length || 4, color: '#3b82f6' },
    { name: 'Assigned', value: jobs.filter((j) => j.status === 'assigned').length || 3, color: '#f59e0b' },
    { name: 'New', value: jobs.filter((j) => j.status === 'new').length || 2, color: '#8b5cf6' },
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

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
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

          {/* Action 3: Sync Offline Data */}
          <button
            onClick={handleSyncData}
            disabled={isSyncing}
            className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all group active:scale-95 cursor-pointer ${
              pendingSyncQueue.length > 0
                ? 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-900/50 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200'
                : 'bg-slate-50/80 hover:bg-blue-50 dark:bg-slate-800/60 dark:hover:bg-blue-950/40 border-slate-200/60 dark:border-slate-700/60 hover:border-blue-300 dark:hover:border-blue-600/50 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-300'
            }`}
          >
            <div
              className={`p-2 rounded-xl mb-1.5 group-hover:scale-110 transition-transform ${
                pendingSyncQueue.length > 0
                  ? 'bg-amber-200 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300'
                  : 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            </div>
            <span className="text-xs font-bold">Sync Offline Data</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">
              {pendingSyncQueue.length > 0 ? `${pendingSyncQueue.length} items queued` : 'Cache synced'}
            </span>
          </button>

          {/* Action 4: Schedule Job */}
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

          {/* Action 5: Create Invoice */}
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

          {/* Action 6: AI Route Optimizer */}
          <button
            onClick={() => setIsRouteOptimizerOpen(true)}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 hover:from-indigo-500 hover:to-purple-600 text-white transition-all group active:scale-95 cursor-pointer shadow-md hover:shadow-lg"
          >
            <div className="p-2 rounded-xl bg-white/20 text-amber-300 mb-1.5 group-hover:scale-110 transition-transform">
              <Navigation className="w-4 h-4 animate-pulse" />
            </div>
            <span className="text-xs font-black">AI Route Optimizer</span>
            <span className="text-[10px] text-indigo-200">Google Maps Dispatch</span>
          </button>
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
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={jobStatusData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={4} dataKey="value">
                    {jobStatusData.map((entry, index) => (
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
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            {jobStatusData.map((item) => {
              const statusKey = item.name.toLowerCase().replace(' ', '_');
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

      {/* AI Technician Route Dispatch Banner / Card */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white shadow-lg relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-indigo-800/50">
        <div className="space-y-1.5 max-w-2xl relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/30 text-amber-300 font-extrabold text-[11px] flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-300" /> AI Route Optimization & Google Maps
            </span>
            <span className="text-xs text-indigo-200/80">Real-Time Field Logistics</span>
          </div>

          <h2 className="text-base font-black tracking-tight">
            Sequence Daily Field Routes for Maximum Efficiency
          </h2>
          <p className="text-xs text-indigo-200/90 leading-relaxed">
            Use Gemini AI & Google Maps to optimize technician drive times, avoid traffic congestion, reduce fuel consumption by up to 35%, and ensure high-priority sites are serviced first.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] text-indigo-300 font-semibold">
            <span className="flex items-center gap-1">
              <Navigation className="w-3.5 h-3.5 text-amber-300" /> Multi-Stop Sequencing
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Interactive Map Pins
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-cyan-300" /> Turn-by-Turn GPS Navigation
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsRouteOptimizerOpen(true)}
          className="py-3 px-5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs shadow-lg hover:shadow-xl transition-all flex items-center gap-2 shrink-0 active:scale-95 cursor-pointer relative z-10"
        >
          <Navigation className="w-4 h-4 text-slate-950" />
          <span>Launch AI Route Optimizer</span>
        </button>
      </div>

      {/* Performance Highlights & Technician Leaderboard */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black shadow-md">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900 dark:text-slate-100">
                  Performance Highlights
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1 border border-amber-300 dark:border-amber-700">
                  <Flame className="w-3 h-3 text-amber-600 fill-amber-500 animate-pulse" /> Field Gamification
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Top-performing field technicians ranked by completed service jobs, CSAT, & efficiency
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 self-start sm:self-auto">
            {(['week', 'month', 'all'] as const).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setLeaderboardTimeframe(tf)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  leaderboardTimeframe === tf
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {tf === 'week' ? 'This Week' : tf === 'month' ? 'This Month' : 'All-Time'}
              </button>
            ))}
          </div>
        </div>

        {/* Highlight Quick Stats Header */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-50 to-slate-50 dark:from-indigo-950/40 dark:to-slate-800/40 border border-indigo-100 dark:border-indigo-900/40">
            <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 text-xs font-bold mb-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Total Completed Jobs
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-slate-100">
              {jobs.filter((j) => j.status === 'completed' || j.status === 'verified').length}
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
              +18% vs last month
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-50 to-slate-50 dark:from-amber-950/40 dark:to-slate-800/40 border border-amber-100 dark:border-amber-900/40">
            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-xs font-bold mb-1">
              <Star className="w-3.5 h-3.5 fill-amber-400" /> Avg CSAT Rating
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-slate-100">
              4.92 / 5.0
            </div>
            <div className="text-[10px] text-amber-700 dark:text-amber-300 font-bold mt-0.5">
              98.4% satisfied clients
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50 to-slate-50 dark:from-emerald-950/40 dark:to-slate-800/40 border border-emerald-100 dark:border-emerald-900/40">
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-1">
              <Clock className="w-3.5 h-3.5" /> Avg Service Speed
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-slate-100">
              42 mins
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
              -12 mins response time
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-50 to-slate-50 dark:from-purple-950/40 dark:to-slate-800/40 border border-purple-100 dark:border-purple-900/40">
            <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 text-xs font-bold mb-1">
              <Award className="w-3.5 h-3.5" /> First-Time Fix Rate
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-slate-100">
              96.8%
            </div>
            <div className="text-[10px] text-purple-600 dark:text-purple-400 font-bold mt-0.5">
              Zero recall record
            </div>
          </div>
        </div>

        {/* Technician Leaderboard Cards List */}
        <div className="space-y-3 pt-2">
          <div className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Technician Leaderboard Standings</span>
            <span>Performance Badges & Score</span>
          </div>

          {staff
            .filter((s) => s.role === 'technician' || s.role === 'business_owner')
            .map((tech, idx) => {
              const techJobs = jobs.filter((j) => j.assignedStaffId === tech.id);
              const completedJobs = techJobs.filter(
                (j) => j.status === 'completed' || j.status === 'verified' || j.status === 'closed'
              );
              const totalRevenue = completedJobs.reduce((sum, j) => sum + (j.estimatedAmount || 0), 0);

              const rankIcons = ['🏆', '🥈', '🥉'];
              const rankColors = [
                'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 border-amber-300 shadow-md',
                'bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-700 dark:text-slate-200',
                'bg-amber-800/20 text-amber-900 dark:text-amber-300 border-amber-700/40',
              ];

              const rating = (4.85 + (idx % 3) * 0.05).toFixed(1);
              const speedMins = 38 + idx * 4;
              const onTime = 98 - idx * 2;

              return (
                <div
                  key={tech.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    idx === 0
                      ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60 shadow-xs'
                      : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    {/* Rank Badge */}
                    <div
                      className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-sm border shrink-0 ${
                        rankColors[idx] || 'bg-slate-100 dark:bg-slate-800 text-slate-600 border-slate-200'
                      }`}
                    >
                      {rankIcons[idx] || `#${idx + 1}`}
                    </div>

                    {/* Technician Info */}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                          {tech.name}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                          {tech.skillCategory || 'Field Specialist'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <span className="flex items-center gap-1 font-bold text-slate-800 dark:text-slate-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          {completedJobs.length} Completed Jobs
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          {rating} / 5.0
                        </span>
                        <span>•</span>
                        <span className="text-slate-600 dark:text-slate-300 font-medium">
                          {curr}{totalRevenue.toLocaleString()} revenue
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Gamification Badges & Performance Bar */}
                  <div className="flex flex-wrap items-center gap-2 md:justify-end">
                    {idx === 0 && (
                      <span className="px-2.5 py-1 rounded-xl bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 font-bold text-[11px] border border-amber-300 dark:border-amber-700 flex items-center gap-1">
                        🏆 Top Service Leader
                      </span>
                    )}
                    {idx === 1 && (
                      <span className="px-2.5 py-1 rounded-xl bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200 font-bold text-[11px] border border-blue-300 dark:border-blue-700 flex items-center gap-1">
                        ⚡ Speed Master ({speedMins}m avg)
                      </span>
                    )}
                    {idx === 2 && (
                      <span className="px-2.5 py-1 rounded-xl bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-200 font-bold text-[11px] border border-purple-300 dark:border-purple-700 flex items-center gap-1">
                        ⭐ 100% Client Rating
                      </span>
                    )}
                    <div className="text-right pl-2 border-l border-slate-200 dark:border-slate-700">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Efficiency Rate</div>
                      <div className="text-xs font-black text-indigo-600 dark:text-indigo-400">{onTime}% On-Time</div>
                    </div>
                  </div>
                </div>
              );
            })}
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
          {jobs.slice(0, 4).map((job) => {
            const customer = customers.find((c) => c.id === job.customerId);
            const assignedTech = staff.find((s) => s.id === job.assignedStaffId);

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
      {/* Route Optimizer Modal */}
      <RouteOptimizerModal
        isOpen={isRouteOptimizerOpen}
        onClose={() => setIsRouteOptimizerOpen(false)}
      />
    </div>
  );
};

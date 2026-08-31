import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Customer, Job, Invoice, RecurringContract } from '../types';
import { CustomerPortalShareModal } from './CustomerPortalShareModal';
import {
  Wrench,
  Receipt,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  ChevronDown,
  ChevronUp,
  User,
  CreditCard,
  FileText,
  Repeat,
  DollarSign,
  Briefcase,
  AlertTriangle,
  ArrowUpRight,
  Sparkles,
  QrCode,
  Share2,
} from 'lucide-react';

interface CustomerServiceSummaryProps {
  customer?: Customer | null;
  onClose?: () => void;
}

export const CustomerServiceSummary: React.FC<CustomerServiceSummaryProps> = ({ customer }) => {
  const {
    jobs,
    invoices,
    contracts,
    staff,
    services,
    currentBusiness,
    addJob,
    showToast,
  } = useApp();

  const currencySymbol = currentBusiness?.currency || '₹';

  const [activeTab, setActiveTab] = useState<'all' | 'maintenance' | 'history' | 'invoices'>('all');
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(null);

  // New Maintenance Job Form state
  const [newJobServiceId, setNewJobServiceId] = useState(services[0]?.id || '');
  const [newJobDescription, setNewJobDescription] = useState('Routine Scheduled Maintenance');
  const [newJobDate, setNewJobDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [newJobTime, setNewJobTime] = useState('10:00');
  const [newJobPriority, setNewJobPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [newJobStaffId, setNewJobStaffId] = useState('');

  const todayStr = new Date().toISOString().slice(0, 10);

  if (!customer) {
    return (
      <div className="p-8 text-center text-xs text-slate-400">
        Select a customer to view service history and maintenance records.
      </div>
    );
  }

  // Customer specific data
  const customerJobs = (jobs || []).filter((j) => j.customerId === customer.id);
  const customerInvoices = (invoices || []).filter((i) => i.customerId === customer.id);
  const customerContracts = (contracts || []).filter((c) => c.customerId === customer.id);

  // Categorize jobs
  const upcomingJobs = customerJobs.filter((j) => {
    const isFutureOrToday = j.scheduledDate >= todayStr;
    const isActiveStatus = ['new', 'assigned', 'accepted', 'on_the_way', 'started', 'in_progress'].includes(j.status);
    return isFutureOrToday || isActiveStatus;
  }).sort((a, b) => (a.scheduledDate || '').localeCompare(b.scheduledDate || ''));

  const historyJobs = customerJobs.filter((j) => {
    const isCompleted = ['completed', 'verified', 'closed', 'cancelled'].includes(j.status);
    return isCompleted;
  }).sort((a, b) => (b.scheduledDate || '').localeCompare(a.scheduledDate || ''));

  // Financial stats
  const totalInvoiced = customerInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
  const totalPaid = customerInvoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
  const totalBalance = customerInvoices.reduce((sum, inv) => sum + (inv.balanceAmount || 0), 0);

  const handleCreateMaintenanceJob = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedSvc = services.find((s) => s.id === newJobServiceId);

    addJob({
      customerId: customer.id,
      serviceId: newJobServiceId || services[0]?.id || 'svc-1',
      description: newJobDescription || 'Routine Scheduled Maintenance',
      priority: newJobPriority,
      assignedStaffId: newJobStaffId || undefined,
      scheduledDate: newJobDate,
      scheduledTime: newJobTime,
      location: `${customer.address || ''}, ${customer.city || ''}`,
      estimatedAmount: selectedSvc ? selectedSvc.price : 0,
      status: newJobStaffId ? 'assigned' : 'new',
    });

    showToast(`Maintenance job scheduled for ${customer.name} on ${newJobDate}!`, 'success');
    setIsScheduleModalOpen(false);
  };

  const getJobStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'verified':
      case 'closed':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">Completed</span>;
      case 'in_progress':
      case 'started':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">In Progress</span>;
      case 'on_the_way':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 font-semibold">On The Way</span>;
      case 'assigned':
      case 'accepted':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">Assigned</span>;
      case 'cancelled':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">Cancelled</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">New / Pending</span>;
    }
  };

  const getInvoiceStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">Paid</span>;
      case 'partial':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">Partially Paid</span>;
      case 'overdue':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">Overdue</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200">Pending</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top KPI Quick Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/50 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Scheduled Jobs</div>
            <div className="text-xl font-black text-indigo-950 dark:text-indigo-100 mt-0.5">
              {upcomingJobs.length} <span className="text-xs font-normal text-indigo-700 dark:text-indigo-300">Upcoming</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/50 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Service History</div>
            <div className="text-xl font-black text-emerald-950 dark:text-emerald-100 mt-0.5">
              {historyJobs.length} <span className="text-xs font-normal text-emerald-700 dark:text-emerald-300">Completed</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
            <Wrench className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/50 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Outstanding Balance</div>
            <div className="text-xl font-black text-amber-950 dark:text-amber-100 mt-0.5">
              {currencySymbol}{totalBalance.toLocaleString()}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold shrink-0">
            <Receipt className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Tabs & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-100 dark:bg-slate-800/80 p-2 rounded-2xl">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {[
            { id: 'all', label: `All Sections (${customerJobs.length + customerInvoices.length})` },
            { id: 'maintenance', label: `Upcoming Jobs (${upcomingJobs.length})` },
            { id: 'history', label: `Service History (${historyJobs.length})` },
            { id: 'invoices', label: `Invoices (${customerInvoices.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setIsShareModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all shadow-xs"
          >
            <QrCode className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Portal & QR
          </button>

          <button
            type="button"
            onClick={() => setIsScheduleModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Schedule Maintenance
          </button>
        </div>
      </div>

      {/* SECTION 1: UPCOMING SCHEDULED MAINTENANCE JOBS & AMC CONTRACTS */}
      {(activeTab === 'all' || activeTab === 'maintenance') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              Upcoming Scheduled Maintenance Jobs ({upcomingJobs.length})
            </h3>
            {customerContracts.length > 0 && (
              <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Repeat className="w-3 h-3" /> {customerContracts.length} Active AMC Contract(s)
              </span>
            )}
          </div>

          {/* AMC Contracts Summary Banner if any */}
          {customerContracts.length > 0 && (
            <div className="space-y-2">
              {customerContracts.map((contract) => (
                <div
                  key={contract.id}
                  className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-200/80 dark:border-purple-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                      {contract.contractNumber} - {contract.name}
                    </div>
                    <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                      Frequency: <span className="font-semibold text-slate-700 dark:text-slate-300 capitalize">{contract.visitFrequency.replace('_', ' ')}</span> • Renewal: {contract.renewalDate}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-black text-purple-700 dark:text-purple-300">{contract.visitsRemaining} visits remaining</div>
                      <div className="text-[10px] text-slate-400">{contract.visitsUsed} of {contract.visitsAllowed} completed</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {upcomingJobs.length === 0 ? (
            <div className="p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
              <Clock className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500 font-medium">No upcoming maintenance jobs scheduled for this customer.</p>
              <button
                onClick={() => setIsScheduleModalOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700"
              >
                <Plus className="w-3.5 h-3.5" /> Book Next Service Visit Now
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {upcomingJobs.map((job) => {
                const assignedStaff = staff.find((s) => s.id === job.assignedStaffId);
                const serviceObj = services.find((s) => s.id === job.serviceId);

                return (
                  <div
                    key={job.id}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-indigo-400 transition-all space-y-2"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-extrabold text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-md">
                          {job.jobId}
                        </span>
                        <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">
                          {serviceObj?.name || job.description}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2">
                        {getJobStatusBadge(job.status)}
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          job.priority === 'urgent' || job.priority === 'high'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {job.priority} priority
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400">{job.description}</p>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                          <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                          {job.scheduledDate} at {job.scheduledTime}
                        </span>
                        {assignedStaff ? (
                          <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            Tech: <strong className="text-slate-800 dark:text-slate-200">{assignedStaff.name}</strong>
                          </span>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400 font-medium">Unassigned</span>
                        )}
                      </div>
                      <span className="font-extrabold text-slate-900 dark:text-slate-100">
                        Estimated: {currencySymbol}{job.estimatedAmount}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: SERVICE HISTORY */}
      {(activeTab === 'all' || activeTab === 'history') && (
        <div className="space-y-3">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-emerald-600" />
            Completed Service History ({historyJobs.length})
          </h3>

          {historyJobs.length === 0 ? (
            <div className="p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
              No completed job history recorded yet for this customer.
            </div>
          ) : (
            <div className="space-y-2.5">
              {historyJobs.map((job) => {
                const isExpanded = expandedJobId === job.id;
                const assignedStaff = staff.find((s) => s.id === job.assignedStaffId);
                const serviceObj = services.find((s) => s.id === job.serviceId);

                return (
                  <div
                    key={job.id}
                    className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-md">
                          {job.jobId}
                        </span>
                        <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                          {serviceObj?.name || job.description}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2">
                        {getJobStatusBadge(job.status)}
                        <button
                          onClick={() => setExpandedJobId(isExpanded ? null : job.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Date: <strong className="text-slate-800 dark:text-slate-200">{job.scheduledDate}</strong></span>
                      {assignedStaff && <span>Technician: <strong className="text-slate-800 dark:text-slate-200">{assignedStaff.name}</strong></span>}
                      <span className="font-bold text-emerald-600">{currencySymbol}{job.estimatedAmount}</span>
                    </div>

                    {/* Detailed expandable history section */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2 text-xs text-slate-700 dark:text-slate-300 animate-in fade-in">
                        {job.problemFound && (
                          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 text-amber-900 dark:text-amber-200">
                            <strong>Problem Diagnosed:</strong> {job.problemFound}
                          </div>
                        )}
                        {job.solutionProvided && (
                          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 text-emerald-900 dark:text-emerald-200">
                            <strong>Work Completed / Solution:</strong> {job.solutionProvided}
                          </div>
                        )}
                        {job.materialsUsed && job.materialsUsed.length > 0 && (
                          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                            <strong className="block text-slate-900 dark:text-slate-100 mb-1">Spare Parts & Materials Used:</strong>
                            <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-600 dark:text-slate-400">
                              {job.materialsUsed.map((mat, idx) => (
                                <li key={idx}>
                                  {mat.name} x {mat.quantity} ({currencySymbol}{mat.unitPrice} each)
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {job.customerRating && (
                          <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
                            ⭐ Customer Rating: <span className="text-slate-900 dark:text-slate-100">{job.customerRating}/5</span>
                            {job.customerFeedback && <span className="italic">"{job.customerFeedback}"</span>}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SECTION 3: ASSOCIATED INVOICES */}
      {(activeTab === 'all' || activeTab === 'invoices') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-amber-600" />
              Associated Invoices ({customerInvoices.length})
            </h3>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
              Total Invoiced: <strong className="text-slate-900 dark:text-slate-100">{currencySymbol}{totalInvoiced.toLocaleString()}</strong>
            </span>
          </div>

          {customerInvoices.length === 0 ? (
            <div className="p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
              No invoices generated for this customer yet.
            </div>
          ) : (
            <div className="space-y-2.5">
              {customerInvoices.map((inv) => {
                const isExpanded = expandedInvoiceId === inv.id;

                return (
                  <div
                    key={inv.id}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-amber-400 transition-all space-y-2"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-extrabold text-amber-600 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-md">
                          {inv.invoiceNumber}
                        </span>
                        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Issued: {inv.date} • Due: <strong className="text-slate-900 dark:text-slate-100">{inv.dueDate}</strong>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getInvoiceStatusBadge(inv.status)}
                        <button
                          onClick={() => setExpandedInvoiceId(isExpanded ? null : inv.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <div>
                        Paid: <strong className="text-emerald-600">{currencySymbol}{inv.paidAmount}</strong>
                        {inv.balanceAmount > 0 && (
                          <span className="ml-2 text-rose-600 font-semibold">
                            (Due: {currencySymbol}{inv.balanceAmount})
                          </span>
                        )}
                      </div>
                      <div className="font-black text-sm text-slate-900 dark:text-slate-100">
                        {currencySymbol}{inv.grandTotal}
                      </div>
                    </div>

                    {/* Expandable Line Items */}
                    {isExpanded && inv.items && inv.items.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs space-y-1.5 animate-in fade-in">
                        <div className="font-bold text-slate-800 dark:text-slate-200 mb-1">Billed Line Items:</div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-2.5 space-y-1">
                          {inv.items.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300">
                              <span>{item.description} ({item.quantity} x {currencySymbol}{item.rate})</span>
                              <span className="font-semibold">{currencySymbol}{item.amount}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Schedule Maintenance Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <form
            onSubmit={handleCreateMaintenanceJob}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                  Schedule Maintenance Visit
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Customer</label>
                <input
                  type="text"
                  disabled
                  value={`${customer.name} (${customer.mobile})`}
                  className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl font-semibold text-slate-600 dark:text-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Service Type</label>
                <select
                  value={newJobServiceId}
                  onChange={(e) => setNewJobServiceId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-indigo-600"
                >
                  {services.map((svc) => (
                    <option key={svc.id} value={svc.id}>
                      {svc.name} ({currencySymbol}{svc.price})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Job Description / Notes</label>
                <textarea
                  rows={2}
                  value={newJobDescription}
                  onChange={(e) => setNewJobDescription(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-indigo-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Scheduled Date</label>
                  <input
                    type="date"
                    value={newJobDate}
                    onChange={(e) => setNewJobDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-indigo-600"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Time Slot</label>
                  <input
                    type="time"
                    value={newJobTime}
                    onChange={(e) => setNewJobTime(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-indigo-600"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Priority Level</label>
                  <select
                    value={newJobPriority}
                    onChange={(e) => setNewJobPriority(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-indigo-600"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Assign Technician</label>
                  <select
                    value={newJobStaffId}
                    onChange={(e) => setNewJobStaffId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-indigo-600"
                  >
                    <option value="">Auto / Unassigned</option>
                    {staff.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md"
              >
                Schedule Maintenance Job
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Customer Portal Share Modal */}
      {isShareModalOpen && customer && (
        <CustomerPortalShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          customer={customer}
          currentBusiness={currentBusiness}
        />
      )}
    </div>
  );
};

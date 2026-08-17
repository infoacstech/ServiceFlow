import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Job, JobPriority, JobStatus } from '../types';
import { DateRangePicker, DateRange, getPresetDates } from '../components/DateRangePicker';
import { VoiceNotesRecorder } from '../components/VoiceNotesRecorder';
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
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    if (initialFilter?.datePreset) {
      return getPresetDates(initialFilter.datePreset);
    }
    return { startDate: '', endDate: '', preset: 'all' };
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

  // New Job Form State
  const [newJobData, setNewJobData] = useState({
    customerId: customers?.[0]?.id || '',
    serviceId: services?.[0]?.id || '',
    description: services?.[0]?.name || '',
    priority: 'medium' as JobPriority,
    assignedStaffId: (staff || []).find((s) => s.role === 'technician')?.id || '',
    scheduledDate: new Date().toISOString().split('T')[0],
    scheduledTime: '09:00 AM - 11:00 AM (Morning 1)',
    location: customers?.[0]?.address ? `${customers[0].address}, ${customers[0].city}` : '',
    estimatedAmount: services?.[0]?.price || 1500,
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
          location: prev.location || `${firstCust.address || ''}, ${firstCust.city || ''}`,
        }));
      }
      if (!newJobData.serviceId && services.length > 0) {
        const firstSrv = services[0];
        setNewJobData((prev) => ({
          ...prev,
          serviceId: firstSrv.id,
          description: prev.description || firstSrv.name,
          estimatedAmount: prev.estimatedAmount || firstSrv.price,
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

  const filteredJobs = (jobs || []).filter((j) => {
    const s = (search || '').toLowerCase();
    const matchesSearch =
      (j.jobId || '').toLowerCase().includes(s) ||
      (j.description || '').toLowerCase().includes(s) ||
      (j.location || '').toLowerCase().includes(s);
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

    const matchesDate = (() => {
      if (!j.scheduledDate) return true;
      const d = j.scheduledDate.slice(0, 10);
      if (dateRange.startDate && d < dateRange.startDate) return false;
      if (dateRange.endDate && d > dateRange.endDate) return false;
      return true;
    })();

    return matchesSearch && matchesStatus && matchesPriority && matchesStaff && matchesDate;
  });

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

    addJob({
      ...newJobData,
      customerId: targetCustomerId,
      location: targetLocation || newJobData.location || 'Site Location',
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
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-indigo-600" /> Job Management Board ({jobs.length})
          </h1>
          <p className="text-xs text-slate-500">Dispatch field technicians, track multi-stage status, & capture site reports</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('board')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                viewMode === 'board' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xs' : 'text-slate-500'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Board
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                viewMode === 'list' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xs' : 'text-slate-500'
              }`}
            >
              <List className="w-3.5 h-3.5" /> List
            </button>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" /> Create Job
          </button>
        </div>
      </div>

      {/* Search & Filter Row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Job ID, address, description..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl font-medium focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <DateRangePicker value={dateRange} onChange={setDateRange} />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl font-semibold border"
          >
            <option value="all">All Statuses</option>
            <option value="pending_active">Pending / Active Jobs</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s.replace('_', ' ').toUpperCase()}
              </option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl font-semibold border"
          >
            <option value="all">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>

          <select
            value={staffFilter}
            onChange={(e) => setStaffFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl font-semibold border"
          >
            <option value="all">All Staff</option>
            {staff.map((st) => (
              <option key={st.id} value={st.id}>
                {st.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Board View (Kanban style columns for key workflow stages) */}
      {viewMode === 'board' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto pb-4">
          {[
            { stage: 'assigned', title: 'Assigned / Scheduled', color: 'bg-amber-50 border-amber-200 text-amber-800' },
            { stage: 'started', title: 'On Site / Started', color: 'bg-blue-50 border-blue-200 text-blue-800' },
            { stage: 'in_progress', title: 'In Progress', color: 'bg-indigo-50 border-indigo-200 text-indigo-800' },
            { stage: 'completed', title: 'Completed Work', color: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
          ].map((col) => {
            const colJobs = filteredJobs.filter(
              (j) =>
                j.status === col.stage ||
                (col.stage === 'assigned' && (j.status === 'new' || j.status === 'accepted' || j.status === 'on_the_way'))
            );

            return (
              <div key={col.stage} className="bg-slate-100/70 dark:bg-slate-900/60 p-3 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-3 min-w-[260px]">
                <div className="flex items-center justify-between px-2 py-1">
                  <span className={`text-xs font-black uppercase px-2.5 py-0.5 rounded-full border ${col.color}`}>
                    {col.title} ({colJobs.length})
                  </span>
                </div>

                <div className="space-y-3">
                  {colJobs.length === 0 ? (
                    <div className="text-center py-10 text-xs text-slate-400 font-medium">No jobs in stage</div>
                  ) : (
                    colJobs.map((job) => {
                      const customer = (customers || []).find((c) => c.id === job.customerId);
                      const tech = (staff || []).find((s) => s.id === job.assignedStaffId);

                      return (
                        <div
                          key={job.id}
                          onClick={() => setSelectedJob(job)}
                          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-indigo-500 transition-all cursor-pointer space-y-2 group"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 group-hover:underline">
                                {job.jobId}
                              </span>
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
                            <span
                              className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                                job.priority === 'urgent'
                                  ? 'bg-rose-100 text-rose-700'
                                  : job.priority === 'high'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {job.priority}
                            </span>
                          </div>

                          <div className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                            {customer?.name}
                          </div>

                          <div className="text-[11px] text-slate-500 line-clamp-2">{job.description}</div>

                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                            <div className="flex items-center gap-1">
                              <UserCheck className="w-3 h-3 text-indigo-500" />
                              <span className="font-medium text-slate-700 dark:text-slate-300">{tech?.name || 'Tech'}</span>
                            </div>
                            <span className="font-bold text-slate-900 dark:text-slate-100">
                              {currentBusiness.currency}{job.estimatedAmount}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
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
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 border shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
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
                    className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 font-semibold text-[11px] transition-all"
                    title="Listen to job summary voice voice"
                  >
                    <Volume2 className="w-3.5 h-3.5" /> Speak Voice Details
                  </button>
                </div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                  {(customers || []).find((c) => c.id === selectedJob.customerId)?.name}
                </h3>
              </div>
              <button onClick={() => setSelectedJob(null)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Visual Progress Stepper Component */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <span>Job Lifecycle Stage</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">
                    {selectedJob.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  {[
                    { key: 'new', label: 'New', icon: Briefcase },
                    { key: 'assigned', label: 'Assigned', icon: UserCheck },
                    { key: 'in_progress', label: 'In Progress', icon: Clock },
                    { key: 'completed', label: 'Completed', icon: CheckCircle2 },
                  ].map((step) => {
                    const stepOrder = ['new', 'assigned', 'on_the_way', 'started', 'in_progress', 'completed', 'verified', 'closed'];
                    const currentIdx = stepOrder.indexOf(selectedJob.status);
                    const targetIdx = stepOrder.indexOf(step.key);
                    const isPastOrCurrent = currentIdx >= targetIdx;
                    const isCurrent = selectedJob.status === step.key;

                    const IconComp = step.icon;

                    return (
                      <button
                        key={step.key}
                        type="button"
                        onClick={() => {
                          updateJobStatus(selectedJob.id, step.key as JobStatus);
                          setSelectedJob({ ...selectedJob, status: step.key as JobStatus });
                        }}
                        className={`p-2 rounded-xl text-center flex flex-col items-center justify-center transition-all cursor-pointer border ${
                          isCurrent
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm font-black scale-102'
                            : isPastOrCurrent
                            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 font-bold'
                            : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800 font-medium hover:border-slate-300'
                        }`}
                        title={`Click to set status to ${step.label}`}
                      >
                        <IconComp className={`w-3.5 h-3.5 mb-1 ${isCurrent ? 'animate-bounce' : ''}`} />
                        <span className="text-[10px] leading-tight truncate">{step.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

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

              {selectedJob.problemFound && (
                <div className="p-3 bg-emerald-50 text-emerald-900 rounded-2xl border border-emerald-200">
                  <div className="font-bold mb-1">Service Completion Summary</div>
                  <div><strong>Problem:</strong> {selectedJob.problemFound}</div>
                  <div><strong>Solution:</strong> {selectedJob.solutionProvided}</div>
                  {selectedJob.customerRating && <div><strong>Rating:</strong> ⭐ {selectedJob.customerRating}/5</div>}
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
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleCreateJob}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
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
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Fields Grid */}
            <div className="space-y-4 text-xs">
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
                    {customers.length === 0 ? (
                      <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-300 text-xs">
                        No registered customers found. Click <strong>"+ New Customer"</strong> to add one directly.
                      </div>
                    ) : (
                      <select
                        value={newJobData.customerId}
                        onChange={(e) => {
                          const c = (customers || []).find((cust) => cust.id === e.target.value);
                          setNewJobData({
                            ...newJobData,
                            customerId: e.target.value,
                            location: c ? `${c.address || ''}, ${c.city || ''}`.trim() : newJobData.location,
                          });
                        }}
                        className="w-full px-3 py-2 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="" disabled>-- Select a Customer ({customers.length} available) --</option>
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} {c.companyName ? `(${c.companyName})` : ''} - {c.mobile}
                          </option>
                        ))}
                      </select>
                    )}
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
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
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

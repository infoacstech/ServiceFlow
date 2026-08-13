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
} from 'lucide-react';
import { playJobVoiceNotification, speakText } from '../utils/audioNotification';

export interface JobInitialFilter {
  datePreset?: string;
  statusFilter?: string;
}

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
    addJob,
    updateJobStatus,
    currentBusiness,
  } = useApp();

  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialFilter?.statusFilter || 'all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
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
    description: '',
    priority: 'medium' as JobPriority,
    assignedStaffId: (staff || []).find((s) => s.role === 'technician')?.id || '',
    scheduledDate: new Date().toISOString().split('T')[0],
    scheduledTime: '10:00 AM',
    location: customers?.[0]?.address || 'Site Location',
    estimatedAmount: 1500,
    status: 'assigned' as JobStatus,
  });

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

  const filteredJobs = jobs.filter((j) => {
    const matchesSearch =
      j.jobId.toLowerCase().includes(search.toLowerCase()) ||
      j.description.toLowerCase().includes(search.toLowerCase()) ||
      j.location.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'pending_active'
        ? j.status !== 'completed' && j.status !== 'closed' && j.status !== 'cancelled'
        : j.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || j.priority === priorityFilter;
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
    if (!newJobData.customerId || !newJobData.serviceId) return;

    addJob(newJobData);
    setIsCreateModalOpen(false);
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
                <div>
                  <span className="text-slate-400">Location:</span>
                  <div className="font-bold truncate">{selectedJob.location}</div>
                </div>
                <div>
                  <span className="text-slate-400">Est. Amount:</span>
                  <div className="font-bold text-emerald-600">{currentBusiness.currency}{selectedJob.estimatedAmount}</div>
                </div>
              </div>

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
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateJob}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Schedule & Dispatch New Job</h3>
              <button type="button" onClick={() => setIsCreateModalOpen(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2">
                <label className="font-semibold block mb-1">Select Customer *</label>
                <select
                  value={newJobData.customerId}
                  onChange={(e) => {
                    const c = (customers || []).find((cust) => cust.id === e.target.value);
                    setNewJobData({
                      ...newJobData,
                      customerId: e.target.value,
                      location: c ? `${c.address}, ${c.city}` : newJobData.location,
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50"
                >
                  {(customers || []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.companyName || c.mobile})
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <label className="font-semibold block mb-1">Select Service *</label>
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
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50"
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} - {currentBusiness.currency}{s.price}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <label className="font-semibold block mb-1">Job Instructions / Site Work Description *</label>
                <textarea
                  required
                  value={newJobData.description}
                  onChange={(e) => setNewJobData({ ...newJobData, description: e.target.value })}
                  placeholder="Describe specific work requested..."
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 h-20"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Assign Technician</label>
                <select
                  value={newJobData.assignedStaffId}
                  onChange={(e) => setNewJobData({ ...newJobData, assignedStaffId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50"
                >
                  {staff.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Priority</label>
                <select
                  value={newJobData.priority}
                  onChange={(e) => setNewJobData({ ...newJobData, priority: e.target.value as JobPriority })}
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Date</label>
                <input
                  type="date"
                  value={newJobData.scheduledDate}
                  onChange={(e) => setNewJobData({ ...newJobData, scheduledDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Time Slot</label>
                <input
                  type="text"
                  value={newJobData.scheduledTime}
                  onChange={(e) => setNewJobData({ ...newJobData, scheduledTime: e.target.value })}
                  placeholder="10:00 AM"
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 rounded-xl border text-xs font-semibold"
              >
                Cancel
              </button>
              <button type="submit" className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs shadow-md">
                Dispatch & Schedule Job
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

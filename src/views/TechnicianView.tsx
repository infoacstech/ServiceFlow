import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Job, JobStatus, JobPriority } from '../types';
import { DigitalSignatureCanvas } from '../components/DigitalSignatureCanvas';
import { VoiceNotesRecorder } from '../components/VoiceNotesRecorder';
import { PhotoEvidenceUploader } from '../components/PhotoEvidenceUploader';
import { AttendanceCard } from '../components/AttendanceCard';
import {
  Briefcase,
  Navigation,
  CheckCircle2,
  Clock,
  Phone,
  MapPin,
  Star,
  FileCheck2,
  Play,
  Check,
  Search,
  Calendar,
  X,
  MessageSquare,
  Share2,
  Sparkles,
  ChevronRight,
  User,
  AlertCircle,
} from 'lucide-react';
import {
  sendTechnicianOnTheWayAlert,
  sendJobCompletionSummaryToCustomer,
  sendGoogleReviewRequest,
} from '../utils/whatsappHelper';
import {
  isJobPending,
  isJobInProgress,
  isJobCompleted,
} from '../utils/jobWorkflow';

export function formatJobSchedule(scheduledDate?: string, scheduledTimeSlot?: string): string {
  let dateStr = '';
  if (scheduledDate) {
    try {
      const parts = scheduledDate.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const d = new Date(year, month, day);
        dateStr = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      } else {
        dateStr = scheduledDate;
      }
    } catch {
      dateStr = scheduledDate;
    }
  } else {
    dateStr = 'Today';
  }

  if (scheduledTimeSlot) {
    return `${dateStr} • ${scheduledTimeSlot}`;
  }
  return dateStr;
}

export function formatPriorityLabel(priority?: JobPriority): string {
  if (!priority) return 'Medium priority';
  const cap = priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase();
  return `${cap} priority`;
}

export const TechnicianView: React.FC = () => {
  const {
    jobs,
    customers,
    staff,
    inventory,
    currentUser,
    updateJobStatus,
    completeJob,
    currentBusiness,
    showToast,
  } = useApp();

  // Filter jobs assigned to this technician
  const techJobs = useMemo(() => {
    return (jobs || []).filter((j) => {
      // If previewing as admin / owner / manager, show all business jobs
      if (currentUser?.role && currentUser.role !== 'technician') {
        return true;
      }
      if (!currentUser) return true;

      // 1. Direct ID match
      if (j.assignedStaffId === currentUser.id) return true;

      // 2. Email match
      if (j.assignedStaffId === currentUser.email) return true;

      // 3. Match against staff list record
      const matchedStaff = (staff || []).find((s) => s.id === j.assignedStaffId);
      if (matchedStaff) {
        if (currentUser.email && matchedStaff.email && matchedStaff.email.toLowerCase() === currentUser.email.toLowerCase()) {
          return true;
        }
        if (currentUser.name && matchedStaff.name && matchedStaff.name.toLowerCase() === currentUser.name.toLowerCase()) {
          return true;
        }
      }

      return false;
    });
  }, [jobs, staff, currentUser]);

  // Tab & Filter States
  const [filterTab, setFilterTab] = useState<'all' | 'in_progress' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [detailsJobId, setDetailsJobId] = useState<string | null>(null);
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [completionStep, setCompletionStep] = useState<1 | 2 | 3 | 4>(1);

  // Single reliable status counts
  const totalAssigned = techJobs.length;
  const pendingCount = useMemo(() => techJobs.filter((j) => isJobPending(j.status)).length, [techJobs]);
  const inProgressCount = useMemo(() => techJobs.filter((j) => isJobInProgress(j.status)).length, [techJobs]);
  const completedCount = useMemo(() => techJobs.filter((j) => isJobCompleted(j.status)).length, [techJobs]);

  // Filtered jobs according to tab and search
  const displayedJobs = useMemo(() => {
    return techJobs.filter((job) => {
      // Tab filter
      if (filterTab === 'in_progress') {
        if (!isJobInProgress(job.status)) return false;
      } else if (filterTab === 'completed') {
        if (!isJobCompleted(job.status)) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const cust = (customers || []).find((c) => c.id === job.customerId);
        const matchJobId = job.jobId?.toLowerCase().includes(query);
        const matchDesc = job.description?.toLowerCase().includes(query);
        const matchCust = cust?.name?.toLowerCase().includes(query) || cust?.companyName?.toLowerCase().includes(query);
        const matchLoc = job.location?.toLowerCase().includes(query);
        if (!matchJobId && !matchDesc && !matchCust && !matchLoc) return false;
      }

      return true;
    });
  }, [techJobs, filterTab, searchQuery, customers]);

  // Selected job for detail modal or completion workflow
  const activeSelectedJob = useMemo(() => {
    if (detailsJobId) {
      return (jobs || []).find((j) => j.id === detailsJobId) || null;
    }
    return null;
  }, [detailsJobId, jobs]);

  // Form State for Completing Job
  const [problemFound, setProblemFound] = useState('');
  const [solutionProvided, setSolutionProvided] = useState('');
  const [rating, setRating] = useState(5);
  const [signature, setSignature] = useState('');
  const [selectedMaterials, setSelectedMaterials] = useState<{ inventoryId: string; quantity: number }[]>([]);
  const [beforePhoto, setBeforePhoto] = useState<string>(
    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80'
  );
  const [afterPhoto, setAfterPhoto] = useState<string>(
    'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=500&auto=format&fit=crop&q=80'
  );

  const handleStatusChange = (jobId: string, newStatus: JobStatus) => {
    updateJobStatus(jobId, newStatus);
  };

  const handleOpenCompletionWorkflow = (job: Job) => {
    setDetailsJobId(job.id);
    setProblemFound(job.problemFound || job.notes || '');
    setSolutionProvided(job.solutionProvided || '');
    setBeforePhoto(
      job.beforePhotos?.[0] ||
        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80'
    );
    setAfterPhoto(
      job.afterPhotos?.[0] ||
        'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=500&auto=format&fit=crop&q=80'
    );
    setCompletionStep(1);
    setIsCompletionModalOpen(true);
  };

  const handleFinalSubmit = () => {
    if (!activeSelectedJob) return;
    completeJob(activeSelectedJob.id, {
      problemFound: problemFound || 'Service diagnostic performed on site equipment.',
      solutionProvided: solutionProvided || 'Repaired fault, calibrated components, and verified successful operation.',
      customerRating: rating,
      customerSignature: signature,
      materialsUsed: selectedMaterials.map((m) => {
        const invItem = (inventory || []).find((i) => i.id === m.inventoryId);
        return {
          inventoryItemId: m.inventoryId,
          name: invItem?.name || 'Spare Part',
          quantity: m.quantity,
          unitPrice: invItem?.sellingPrice || 0,
        };
      }),
      beforePhotos: beforePhoto ? [beforePhoto] : (activeSelectedJob.beforePhotos || []),
      afterPhotos: afterPhoto ? [afterPhoto] : [],
    });
    setIsCompletionModalOpen(false);
  };

  const addMaterialItem = (inventoryId: string) => {
    setSelectedMaterials((prev) => {
      const exists = prev.find((m) => m.inventoryId === inventoryId);
      if (exists) {
        return prev.map((m) => (m.inventoryId === inventoryId ? { ...m, quantity: m.quantity + 1 } : m));
      }
      return [...prev, { inventoryId, quantity: 1 }];
    });
  };

  const removeMaterialItem = (inventoryId: string) => {
    setSelectedMaterials((prev) => prev.filter((m) => m.inventoryId !== inventoryId));
  };

  // Render single prominent status badge
  const renderStatusBadge = (status: JobStatus) => {
    switch (status) {
      case 'verified':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            VERIFIED
          </span>
        );
      case 'completed':
      case 'closed':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            COMPLETED
          </span>
        );
      case 'started':
      case 'in_progress':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800 animate-pulse">
            IN PROGRESS
          </span>
        );
      case 'on_the_way':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            ON THE WAY
          </span>
        );
      case 'accepted':
      case 'assigned':
      case 'scheduled':
      case 'new':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            ASSIGNED
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            CANCELLED
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            {String(status).replace('_', ' ').toUpperCase()}
          </span>
        );
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-3.5 pb-24 animate-in fade-in" id="technician-view-container">
      {/* 0. GPS & Shift Attendance Card */}
      <AttendanceCard />

      {/* 1. Simplified Top Header & 3 Compact Counters */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-md border border-slate-800">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div>
            <h1 className="text-base sm:text-lg font-black text-white tracking-tight">
              My Assigned Field Jobs
            </h1>
            <p className="text-[11px] text-slate-400">
              {currentBusiness?.name || 'ServiFlow'} • {totalAssigned} assigned {totalAssigned === 1 ? 'task' : 'tasks'}
            </p>
          </div>
          {currentUser?.name && (
            <span className="text-[10px] font-bold text-indigo-300 bg-indigo-950/80 border border-indigo-800/80 px-2 py-0.5 rounded-full truncate max-w-[130px]">
              {currentUser.name}
            </span>
          )}
        </div>

        {/* 3 Compact Counters: Pending | In Progress | Completed */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <button
            type="button"
            onClick={() => setFilterTab('all')}
            className="bg-white/5 hover:bg-white/10 p-2 rounded-xl border border-white/10 transition-all cursor-pointer"
          >
            <div className="text-base font-black text-amber-300">{pendingCount}</div>
            <div className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">Pending</div>
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('in_progress')}
            className="bg-white/5 hover:bg-white/10 p-2 rounded-xl border border-white/10 transition-all cursor-pointer"
          >
            <div className="text-base font-black text-blue-300">{inProgressCount}</div>
            <div className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">In Progress</div>
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('completed')}
            className="bg-white/5 hover:bg-white/10 p-2 rounded-xl border border-white/10 transition-all cursor-pointer"
          >
            <div className="text-base font-black text-emerald-300">{completedCount}</div>
            <div className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">Completed</div>
          </button>
        </div>
      </div>

      {/* 2. Simplified Tabs & Search */}
      <div className="space-y-2">
        {/* Tabs: All Jobs (X) | In Progress (Y) | Completed (Z) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          <button
            type="button"
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              filterTab === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            All Jobs ({totalAssigned})
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('in_progress')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              filterTab === 'in_progress'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            In Progress ({inProgressCount})
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('completed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              filterTab === 'completed'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Completed ({completedCount})
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search job, client, address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-8 py-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* 3. Compact Mobile Job Cards List */}
      {displayedJobs.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
            {filterTab === 'in_progress'
              ? 'No Jobs In Progress'
              : filterTab === 'completed'
              ? 'No Completed Jobs'
              : 'No Jobs Found'}
          </h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            {totalAssigned > 0
              ? `You have ${totalAssigned} total assigned jobs. Tap another tab above to view them.`
              : 'No field tasks currently assigned to your account.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedJobs.map((job) => {
            const customer = (customers || []).find((c) => c.id === job.customerId);

            return (
              <div
                key={job.id}
                id={`tech-job-card-${job.id}`}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-800 transition-all space-y-2.5"
              >
                {/* Header Row: Job ID & Single Prominent Status Badge */}
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-black text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-lg border border-indigo-200/80 dark:border-indigo-800/80">
                    {job.jobId}
                  </span>
                  {renderStatusBadge(job.status)}
                </div>

                {/* Customer, Schedule & Priority */}
                <div className="space-y-0.5 text-left">
                  <div className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <span>{customer?.name || 'Client'}</span>
                    {customer?.companyName && (
                      <span className="text-xs font-normal text-slate-400">
                        • {customer.companyName}
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{formatJobSchedule(job.scheduledDate, job.scheduledTimeSlot)}</span>
                  </div>

                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pt-0.5">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        job.priority === 'urgent'
                          ? 'bg-rose-500'
                          : job.priority === 'high'
                          ? 'bg-amber-500'
                          : 'bg-blue-500'
                      }`}
                    />
                    <span>{formatPriorityLabel(job.priority)}</span>
                  </div>
                </div>

                {/* Primary & Secondary Action Buttons: [ Call Client ] [ View Details ] */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                  {customer?.mobile ? (
                    <a
                      href={`tel:${customer.mobile}`}
                      className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer text-center"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call Client</span>
                    </a>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 font-bold text-xs flex items-center justify-center gap-1.5 cursor-not-allowed"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>No Phone</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setDetailsJobId(job.id)}
                    className="py-2.5 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center gap-1.5 border border-indigo-200/80 dark:border-indigo-800/80 transition-all active:scale-95 cursor-pointer"
                  >
                    <span>View Details</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Full Job Details Modal */}
      {detailsJobId && activeSelectedJob && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800">
                  {activeSelectedJob.jobId}
                </span>
                {renderStatusBadge(activeSelectedJob.status)}
              </div>
              <button
                type="button"
                onClick={() => setDetailsJobId(null)}
                className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 text-xs">
              {/* Customer Info */}
              {(() => {
                const customer = (customers || []).find((c) => c.id === activeSelectedJob.customerId);
                const isCompleted = isJobCompleted(activeSelectedJob.status);

                return (
                  <>
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Client Details
                          </span>
                          <div className="text-sm font-black text-slate-900 dark:text-slate-100">
                            {customer?.name || 'Customer'}
                          </div>
                          {customer?.companyName && (
                            <div className="text-[11px] text-slate-500">{customer.companyName}</div>
                          )}
                        </div>

                        {customer?.mobile && (
                          <a
                            href={`tel:${customer.mobile}`}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-xs"
                          >
                            <Phone className="w-3.5 h-3.5" /> Call ({customer.mobile})
                          </a>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-2 text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Schedule: <strong>{formatJobSchedule(activeSelectedJob.scheduledDate, activeSelectedJob.scheduledTimeSlot)}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Site Location & GPS */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-2">
                      <div className="flex items-start gap-2 text-slate-700 dark:text-slate-300 min-w-0 flex-1">
                        <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 dark:text-slate-100 block text-[11px]">
                            Site Address:
                          </span>
                          <span className="truncate block">
                            {activeSelectedJob.location || customer?.address || 'Site address provided'}
                          </span>
                        </div>
                      </div>
                      {(activeSelectedJob.location || customer?.address) && (
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                            activeSelectedJob.location || customer?.address || ''
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shrink-0 shadow-2xs transition-all"
                        >
                          <Navigation className="w-3.5 h-3.5" /> Start GPS
                        </a>
                      )}
                    </div>

                    {/* Work Description & Instructions */}
                    <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/60 text-slate-700 dark:text-slate-300 space-y-1">
                      <span className="font-bold text-amber-900 dark:text-amber-200 block text-xs">
                        Work Description & Instructions:
                      </span>
                      <p className="leading-relaxed text-xs">
                        {activeSelectedJob.description || 'General Service & Equipment Maintenance'}
                      </p>
                    </div>

                    {/* Quick WhatsApp Alert Button */}
                    <button
                      type="button"
                      onClick={() => {
                        sendTechnicianOnTheWayAlert(activeSelectedJob, customer, currentUser, currentBusiness);
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      WhatsApp: Send "I'm On The Way" Alert
                    </button>

                    {/* Field Audio Notes Recorder */}
                    <VoiceNotesRecorder
                      job={activeSelectedJob}
                      onNotesSaved={() => {
                        showToast('Field audio notes saved for job ' + activeSelectedJob.jobId, 'success');
                      }}
                    />

                    {/* Primary Workflow Execution Buttons */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                      {activeSelectedJob.status === 'assigned' && (
                        <button
                          type="button"
                          onClick={() => {
                            handleStatusChange(activeSelectedJob.id, 'accepted');
                            setDetailsJobId(null);
                          }}
                          className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                        >
                          <Check className="w-4 h-4" /> Accept Assigned Job
                        </button>
                      )}

                      {activeSelectedJob.status === 'accepted' && (
                        <button
                          type="button"
                          onClick={() => {
                            handleStatusChange(activeSelectedJob.id, 'on_the_way');
                            setDetailsJobId(null);
                          }}
                          className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                        >
                          <Navigation className="w-4 h-4" /> Start Navigation (On The Way to Site)
                        </button>
                      )}

                      {activeSelectedJob.status === 'on_the_way' && (
                        <button
                          type="button"
                          onClick={() => {
                            handleStatusChange(activeSelectedJob.id, 'started');
                            setDetailsJobId(null);
                          }}
                          className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                        >
                          <Play className="w-4 h-4" /> Arrived at Site & Begin Work
                        </button>
                      )}

                      {(activeSelectedJob.status === 'started' || activeSelectedJob.status === 'in_progress') && (
                        <button
                          type="button"
                          onClick={() => handleOpenCompletionWorkflow(activeSelectedJob)}
                          className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                        >
                          <FileCheck2 className="w-4 h-4" /> Complete Job & Obtain Signoff →
                        </button>
                      )}

                      {isCompleted && (
                        <div className="space-y-2">
                          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-2xl flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-200">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span className="font-bold">
                                {activeSelectedJob.status === 'verified' ? 'Verified by QA / Admin' : 'Job Completed & Signed Off'}
                              </span>
                            </div>
                            {activeSelectedJob.customerRating && (
                              <span className="font-bold">⭐ {activeSelectedJob.customerRating}/5</span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                sendGoogleReviewRequest(customer, currentBusiness);
                              }}
                              className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5 fill-current" /> Request 5⭐ Google Review
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                sendJobCompletionSummaryToCustomer(activeSelectedJob, customer, currentUser, currentBusiness);
                              }}
                              className="py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                            >
                              <Share2 className="w-3.5 h-3.5 text-emerald-600" /> Share Report
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* 5. Complete Job 4-Step Modal Workflow */}
      {isCompletionModalOpen && activeSelectedJob && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md">
                  Field Job Signoff
                </span>
                <h3 className="font-black text-slate-900 dark:text-slate-100 text-sm sm:text-base mt-0.5">
                  Complete Job {activeSelectedJob.jobId}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCompletionModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Stepper Tabs */}
            <div className="grid grid-cols-4 text-center border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-500 bg-slate-50/50 dark:bg-slate-900/50">
              <button
                type="button"
                onClick={() => setCompletionStep(1)}
                className={`py-2.5 border-b-2 transition-all cursor-pointer ${
                  completionStep === 1 ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/30' : 'border-transparent'
                }`}
              >
                1. Diagnosis
              </button>
              <button
                type="button"
                onClick={() => setCompletionStep(2)}
                className={`py-2.5 border-b-2 transition-all cursor-pointer ${
                  completionStep === 2 ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/30' : 'border-transparent'
                }`}
              >
                2. Parts
              </button>
              <button
                type="button"
                onClick={() => setCompletionStep(3)}
                className={`py-2.5 border-b-2 transition-all cursor-pointer ${
                  completionStep === 3 ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/30' : 'border-transparent'
                }`}
              >
                3. Photos
              </button>
              <button
                type="button"
                onClick={() => setCompletionStep(4)}
                className={`py-2.5 border-b-2 transition-all cursor-pointer ${
                  completionStep === 4 ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/30' : 'border-transparent'
                }`}
              >
                4. Signoff
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
              {/* Step 1: Diagnosis & Solution */}
              {completionStep === 1 && (
                <div className="space-y-3.5 text-xs">
                  <div>
                    <label className="font-bold text-slate-900 dark:text-slate-100 block mb-1">
                      Problem Diagnosed on Site *
                    </label>
                    <textarea
                      value={problemFound}
                      onChange={(e) => setProblemFound(e.target.value)}
                      placeholder="e.g. Broken connector, power fluctuations, optical lens out of focus"
                      rows={3}
                      className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-900 dark:text-slate-100 block mb-1">
                      Solution & Work Carried Out *
                    </label>
                    <textarea
                      value={solutionProvided}
                      onChange={(e) => setSolutionProvided(e.target.value)}
                      placeholder="e.g. Replaced faulty wiring, tuned signal strength, calibrated settings and verified with client."
                      rows={3}
                      className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setCompletionStep(2)}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer shadow-xs transition-all"
                  >
                    Next: Add Spare Parts Used →
                  </button>
                </div>
              )}

              {/* Step 2: Inventory & Parts Used */}
              {completionStep === 2 && (
                <div className="space-y-3.5 text-xs">
                  <div className="font-bold text-slate-900 dark:text-slate-100">
                    Select Spare Parts / Materials Used
                  </div>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {inventory.length === 0 ? (
                      <div className="text-center py-4 text-slate-400">No inventory parts found in catalog.</div>
                    ) : (
                      inventory.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => addMaterialItem(item.id)}
                          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 flex items-center justify-between cursor-pointer transition-all"
                        >
                          <div>
                            <div className="font-bold text-slate-900 dark:text-slate-100">{item.name}</div>
                            <div className="text-[10px] text-slate-400">
                              Stock: {item.currentStock} {item.unit} • ₹{item.sellingPrice}
                            </div>
                          </div>
                          <span className="text-xs text-indigo-600 font-bold bg-indigo-50 dark:bg-indigo-950/60 px-2 py-1 rounded-lg">
                            + Add
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Selected Materials List */}
                  {selectedMaterials.length > 0 && (
                    <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-2xl border border-indigo-100 dark:border-indigo-800/60 space-y-1.5">
                      <div className="font-bold text-indigo-950 dark:text-indigo-200">
                        Parts to deduct from inventory:
                      </div>
                      {selectedMaterials.map((m) => {
                        const invItem = (inventory || []).find((i) => i.id === m.inventoryId);
                        return (
                          <div key={m.inventoryId} className="flex items-center justify-between text-indigo-700 dark:text-indigo-300">
                            <span>{invItem?.name || 'Part'}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold">x{m.quantity} {invItem?.unit}</span>
                              <button
                                type="button"
                                onClick={() => removeMaterialItem(m.inventoryId)}
                                className="text-rose-500 hover:text-rose-700 text-xs font-bold cursor-pointer"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setCompletionStep(1)}
                      className="w-1/2 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setCompletionStep(3)}
                      className="w-1/2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                    >
                      Next: Photos →
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Photos */}
              {completionStep === 3 && (
                <div className="space-y-4 text-xs">
                  <div className="p-2.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800/60 text-indigo-900 dark:text-indigo-200">
                    <p className="font-bold text-xs">Photo Evidence & Job Audit Trail</p>
                    <p className="text-[11px] text-indigo-700 dark:text-indigo-300 mt-0.5">
                      Capture high-resolution photos using your device camera or upload from gallery to document on-site equipment conditions.
                    </p>
                  </div>

                  <PhotoEvidenceUploader
                    id="before-photo-uploader"
                    label="Before Work Photo"
                    badge="Initial Condition"
                    subLabel="Initial site/fault photo"
                    value={beforePhoto}
                    onChange={(val) => setBeforePhoto(val)}
                  />

                  <PhotoEvidenceUploader
                    id="after-photo-uploader"
                    label="After Work Photo"
                    badge="Finished Service"
                    subLabel="Completed installation/repair photo"
                    value={afterPhoto}
                    onChange={(val) => setAfterPhoto(val)}
                  />

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setCompletionStep(2)}
                      className="w-1/2 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setCompletionStep(4)}
                      className="w-1/2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                    >
                      Next: Customer Signoff →
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4: Rating & Digital Signature */}
              {completionStep === 4 && (
                <div className="space-y-4 text-xs">
                  <div>
                    <label className="font-bold block mb-1.5 text-slate-900 dark:text-slate-100">
                      Customer Service Satisfaction Rating
                    </label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setRating(s)}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                            rating >= s
                              ? 'bg-amber-400 text-slate-950 border-amber-400 font-black scale-105'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <Star className="w-4 h-4 fill-current" />
                        </button>
                      ))}
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-2">
                        {rating} of 5 Stars
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold block mb-1 text-slate-900 dark:text-slate-100">
                      Customer Digital Signature Signoff *
                    </label>
                    <DigitalSignatureCanvas onSave={(sig) => setSignature(sig)} />
                  </div>

                  <button
                    type="button"
                    onClick={handleFinalSubmit}
                    className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
                  >
                    <FileCheck2 className="w-5 h-5" /> Submit Completed Job & Notify Owner
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

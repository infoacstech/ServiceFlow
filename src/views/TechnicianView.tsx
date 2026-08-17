import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Job, JobStatus, JobPriority } from '../types';
import { DigitalSignatureCanvas } from '../components/DigitalSignatureCanvas';
import { VoiceNotesRecorder } from '../components/VoiceNotesRecorder';
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
  UserCheck,
  Calendar,
  X,
  Mic,
} from 'lucide-react';

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

  // Filter jobs assigned to this technician with comprehensive matching (ID, email, name)
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
  const [filterTab, setFilterTab] = useState<'active' | 'in_progress' | 'all' | 'completed'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [completionStep, setCompletionStep] = useState<1 | 2 | 3 | 4>(1);

  // Filtered jobs according to tab and search
  const displayedJobs = useMemo(() => {
    return techJobs.filter((job) => {
      // Tab filter
      if (filterTab === 'active') {
        if (job.status === 'completed' || job.status === 'closed') return false;
      } else if (filterTab === 'in_progress') {
        if (job.status !== 'on_the_way' && job.status !== 'started' && job.status !== 'in_progress') return false;
      } else if (filterTab === 'completed') {
        if (job.status !== 'completed' && job.status !== 'closed') return false;
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

  // Selected job for detail / execution
  const activeSelectedJob = useMemo(() => {
    if (selectedJobId) {
      return (jobs || []).find((j) => j.id === selectedJobId) || techJobs[0] || null;
    }
    return techJobs.find((j) => j.status !== 'completed' && j.status !== 'closed') || techJobs[0] || null;
  }, [selectedJobId, jobs, techJobs]);

  // Form State for Completing Job
  const [problemFound, setProblemFound] = useState('');
  const [solutionProvided, setSolutionProvided] = useState('');

  // Dictation states for completion modal
  const [activeDictationField, setActiveDictationField] = useState<'problem' | 'solution' | null>(null);

  const startModalDictation = (field: 'problem' | 'solution') => {
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      showToast('Speech recognition not supported in this browser. Please type.', 'info');
      return;
    }

    try {
      const rec = new SpeechRecognitionAPI();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = 'en-IN';

      setActiveDictationField(field);
      showToast(`Listening for ${field === 'problem' ? 'problem diagnosis' : 'work solution'}... Speak now.`, 'info');

      rec.onresult = (event: any) => {
        let resultText = '';
        for (let i = 0; i < event.results.length; ++i) {
          resultText += event.results[i][0].transcript;
        }
        if (resultText) {
          if (field === 'problem') {
            setProblemFound((prev) => (prev ? `${prev} ${resultText}` : resultText));
          } else {
            setSolutionProvided((prev) => (prev ? `${prev} ${resultText}` : resultText));
          }
        }
      };

      rec.onerror = () => {
        setActiveDictationField(null);
      };

      rec.onend = () => {
        setActiveDictationField(null);
      };

      rec.start();
    } catch (e) {
      setActiveDictationField(null);
    }
  };
  const [rating, setRating] = useState(5);
  const [signature, setSignature] = useState('');
  const [selectedMaterials, setSelectedMaterials] = useState<{ inventoryId: string; quantity: number }[]>([]);
  const [beforePhoto, setBeforePhoto] = useState<string>(
    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80'
  );
  const [afterPhoto, setAfterPhoto] = useState<string>(
    'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=500&auto=format&fit=crop&q=80'
  );

  // Statistics calculation
  const totalAssigned = techJobs.length;
  const activeCount = techJobs.filter((j) => j.status !== 'completed' && j.status !== 'closed').length;
  const inProgressCount = techJobs.filter((j) => j.status === 'on_the_way' || j.status === 'started' || j.status === 'in_progress').length;
  const completedCount = techJobs.filter((j) => j.status === 'completed' || j.status === 'closed').length;

  const handleStatusChange = (jobId: string, newStatus: JobStatus) => {
    updateJobStatus(jobId, newStatus);
    showToast(`Job status changed to ${newStatus.replace('_', ' ').toUpperCase()}`, 'info');
  };

  const handleOpenCompletionWorkflow = (job: Job) => {
    setSelectedJobId(job.id);
    setProblemFound(job.notes || '');
    setSolutionProvided('');
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
      afterPhotos: [afterPhoto],
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

  const getPriorityBadge = (priority?: JobPriority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30';
      case 'high':
        return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
      case 'medium':
        return 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30';
      default:
        return 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30';
    }
  };

  const getStatusBadge = (status: JobStatus) => {
    switch (status) {
      case 'completed':
      case 'closed':
        return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
      case 'started':
      case 'in_progress':
        return 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30 animate-pulse';
      case 'on_the_way':
        return 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30';
      case 'accepted':
        return 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30';
      default:
        return 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-24 animate-in fade-in" id="technician-view-container">
      {/* Top Field Technician Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 rounded-3xl shadow-xl relative overflow-hidden border border-slate-800">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-[11px] font-extrabold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 px-3 py-0.5 rounded-full border border-indigo-500/30 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5" />
                {currentUser?.name || 'Field Technician'} ({currentUser?.role?.toUpperCase() || 'TECH'})
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live Dispatch Ready
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              My Assigned Field Jobs
            </h1>
            <p className="text-xs text-slate-300 mt-0.5">
              {currentBusiness?.name || 'ServiFlow'} • {totalAssigned} assigned tasks in schedule
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-2 w-full sm:w-auto">
            <div className="bg-white/10 backdrop-blur-xs px-3 py-2 rounded-2xl border border-white/10 text-center">
              <div className="text-lg font-black text-amber-300">{activeCount}</div>
              <div className="text-[10px] text-slate-300 font-semibold uppercase">Pending</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xs px-3 py-2 rounded-2xl border border-white/10 text-center">
              <div className="text-lg font-black text-blue-300">{inProgressCount}</div>
              <div className="text-[10px] text-slate-300 font-semibold uppercase">In Field</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xs px-3 py-2 rounded-2xl border border-white/10 text-center">
              <div className="text-lg font-black text-emerald-300">{completedCount}</div>
              <div className="text-[10px] text-slate-300 font-semibold uppercase">Done</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setFilterTab('active')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              filterTab === 'active'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Active / Pending ({activeCount})
          </button>

          <button
            onClick={() => setFilterTab('in_progress')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              filterTab === 'in_progress'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            In Progress ({inProgressCount})
          </button>

          <button
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              filterTab === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            All Assigned ({totalAssigned})
          </button>

          <button
            onClick={() => setFilterTab('completed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              filterTab === 'completed'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Completed ({completedCount})
          </button>
        </div>

        {/* Search Field */}
        <div className="relative min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search job, client, address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Jobs List */}
      {displayedJobs.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-10 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
            {filterTab === 'active'
              ? 'No Active Pending Jobs'
              : filterTab === 'completed'
              ? 'No Completed Jobs Yet'
              : 'No Jobs Found'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {totalAssigned > 0
              ? `You have ${totalAssigned} total jobs assigned across all tabs. Switch filter tabs above to view them.`
              : 'No tasks currently assigned to your technician account. New jobs assigned by dispatch will appear here immediately.'}
          </p>
          {totalAssigned > 0 && filterTab !== 'all' && (
            <button
              onClick={() => setFilterTab('all')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <Briefcase className="w-3.5 h-3.5" /> View All {totalAssigned} Assigned Jobs
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {displayedJobs.map((job) => {
            const customer = (customers || []).find((c) => c.id === job.customerId);
            const isCompleted = job.status === 'completed' || job.status === 'closed';

            return (
              <div
                key={job.id}
                id={`tech-job-card-${job.id}`}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-800/80 transition-all overflow-hidden"
              >
                {/* Job Card Header */}
                <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/60 flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-xs text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-xl border border-indigo-200 dark:border-indigo-800">
                      {job.jobId}
                    </span>
                    <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${getPriorityBadge(job.priority)}`}>
                      {job.priority || 'NORMAL'}
                    </span>
                    {job.scheduledTimeSlot && (
                      <span className="text-[10px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 px-2.5 py-0.5 rounded-full border border-purple-200 dark:border-purple-800 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {job.scheduledTimeSlot}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-black uppercase px-2.5 py-1 rounded-xl border ${getStatusBadge(job.status)}`}>
                      {job.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 sm:p-5 space-y-4">
                  {/* Customer and Contact Details */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        {customer?.name || 'Customer'}
                        {customer?.companyName && (
                          <span className="text-xs font-semibold text-slate-500">
                            • {customer.companyName}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                          Date: {job.scheduledDate || 'Today'}
                        </span>
                        {job.scheduledTimeSlot && (
                          <span className="flex items-center gap-1 font-semibold text-purple-600 dark:text-purple-400">
                            <Clock className="w-3.5 h-3.5" />
                            Slot: {job.scheduledTimeSlot}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quick Call Button */}
                    {customer?.mobile && (
                      <a
                        href={`tel:${customer.mobile}`}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all active:scale-95 shrink-0"
                      >
                        <Phone className="w-3.5 h-3.5" /> Call Client ({customer.mobile})
                      </a>
                    )}
                  </div>

                  {/* Site Address with Map Navigation Trigger */}
                  <div className="flex items-start justify-between gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                      <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-900 dark:text-slate-100 block">Site Location:</span>
                        <span>{job.location || customer?.address || 'On-site address provided'}</span>
                      </div>
                    </div>
                    {job.location && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.location)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-700 rounded-lg text-xs font-bold inline-flex items-center gap-1 shrink-0"
                        title="Open in Google Maps"
                      >
                        <Navigation className="w-3.5 h-3.5" /> Maps
                      </a>
                    )}
                  </div>

                  {/* Service Task Description / Instructions */}
                  <div className="text-xs p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/60 text-slate-700 dark:text-slate-300">
                    <span className="font-bold text-amber-900 dark:text-amber-200 block mb-0.5">
                      Work Description & Instructions:
                    </span>
                    {job.description || 'General Service & Equipment Maintenance'}
                  </div>

                  {/* Audio Notes Recorder for this job */}
                  <VoiceNotesRecorder
                    job={job}
                    onNotesSaved={() => {
                      showToast('Field audio notes saved for job ' + job.jobId, 'success');
                    }}
                  />

                  {/* Workflow Execution Action Bar */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    {/* Status 1: Assigned */}
                    {job.status === 'assigned' && (
                      <button
                        onClick={() => handleStatusChange(job.id, 'accepted')}
                        className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-98 cursor-pointer"
                      >
                        <Check className="w-4 h-4" /> Accept Assigned Job
                      </button>
                    )}

                    {/* Status 2: Accepted */}
                    {job.status === 'accepted' && (
                      <button
                        onClick={() => handleStatusChange(job.id, 'on_the_way')}
                        className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-98 cursor-pointer"
                      >
                        <Navigation className="w-4 h-4" /> Start Navigation (On The Way to Site)
                      </button>
                    )}

                    {/* Status 3: On The Way */}
                    {job.status === 'on_the_way' && (
                      <button
                        onClick={() => handleStatusChange(job.id, 'started')}
                        className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-98 cursor-pointer"
                      >
                        <Play className="w-4 h-4" /> Arrived at Site & Begin Diagnostic
                      </button>
                    )}

                    {/* Status 4: Started / In Progress */}
                    {(job.status === 'started' || job.status === 'in_progress') && (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => handleOpenCompletionWorkflow(job)}
                          className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 cursor-pointer"
                        >
                          <FileCheck2 className="w-4 h-4" /> Complete Job & Obtain Signoff →
                        </button>
                      </div>
                    )}

                    {/* Status 5: Completed */}
                    {isCompleted && (
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-2xl flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-200">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span className="font-bold">Job Completed & Signed Off</span>
                          {job.customerRating && (
                            <span>• ⭐ {job.customerRating}/5</span>
                          )}
                        </div>
                        {job.solutionProvided && (
                          <span className="text-[11px] text-emerald-700 dark:text-emerald-300 max-w-[200px] truncate">
                            {job.solutionProvided}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Complete Job Modal Workflow */}
      {isCompletionModalOpen && activeSelectedJob && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md">
                  Field Job Signoff
                </span>
                <h3 className="font-black text-slate-900 dark:text-slate-100 text-base mt-0.5">
                  Complete Job {activeSelectedJob.jobId}
                </h3>
              </div>
              <button
                onClick={() => setIsCompletionModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Stepper Tabs */}
            <div className="grid grid-cols-4 text-center border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-500 bg-slate-50/50 dark:bg-slate-900/50">
              <button
                onClick={() => setCompletionStep(1)}
                className={`py-2.5 border-b-2 transition-all cursor-pointer ${
                  completionStep === 1 ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/30' : 'border-transparent'
                }`}
              >
                1. Diagnosis
              </button>
              <button
                onClick={() => setCompletionStep(2)}
                className={`py-2.5 border-b-2 transition-all cursor-pointer ${
                  completionStep === 2 ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/30' : 'border-transparent'
                }`}
              >
                2. Parts
              </button>
              <button
                onClick={() => setCompletionStep(3)}
                className={`py-2.5 border-b-2 transition-all cursor-pointer ${
                  completionStep === 3 ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/30' : 'border-transparent'
                }`}
              >
                3. Photos
              </button>
              <button
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
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-slate-900 dark:text-slate-100 block">
                        Problem Diagnosed on Site *
                      </label>
                      <button
                        type="button"
                        onClick={() => startModalDictation('problem')}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                          activeDictationField === 'problem'
                            ? 'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-950 dark:text-rose-300 animate-pulse'
                            : 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-slate-200 dark:border-slate-700 hover:bg-indigo-50'
                        }`}
                      >
                        <Mic className="w-3 h-3" />
                        <span>{activeDictationField === 'problem' ? 'Listening...' : 'Dictate'}</span>
                      </button>
                    </div>
                    <textarea
                      value={problemFound}
                      onChange={(e) => setProblemFound(e.target.value)}
                      placeholder="e.g. Broken connector, power fluctuations, optical lens out of focus"
                      rows={3}
                      className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-slate-900 dark:text-slate-100 block">
                        Solution & Work Carried Out *
                      </label>
                      <button
                        type="button"
                        onClick={() => startModalDictation('solution')}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                          activeDictationField === 'solution'
                            ? 'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-950 dark:text-rose-300 animate-pulse'
                            : 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-slate-200 dark:border-slate-700 hover:bg-indigo-50'
                        }`}
                      >
                        <Mic className="w-3 h-3" />
                        <span>{activeDictationField === 'solution' ? 'Listening...' : 'Dictate'}</span>
                      </button>
                    </div>
                    <textarea
                      value={solutionProvided}
                      onChange={(e) => setSolutionProvided(e.target.value)}
                      placeholder="e.g. Replaced faulty wiring, tuned signal strength, calibrated settings and verified with client."
                      rows={3}
                      className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  <button
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
                      onClick={() => setCompletionStep(1)}
                      className="w-1/2 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
                    >
                      ← Back
                    </button>
                    <button
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
                <div className="space-y-3.5 text-xs">
                  <div>
                    <label className="font-bold block mb-1 text-slate-900 dark:text-slate-100">
                      Before Work Photo URL / Evidence
                    </label>
                    <div className="flex items-center gap-2">
                      <img src={beforePhoto} alt="Before" className="w-14 h-14 rounded-xl object-cover border" />
                      <input
                        type="text"
                        value={beforePhoto}
                        onChange={(e) => setBeforePhoto(e.target.value)}
                        className="flex-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[11px]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold block mb-1 text-slate-900 dark:text-slate-100">
                      After Work Photo URL / Evidence
                    </label>
                    <div className="flex items-center gap-2">
                      <img src={afterPhoto} alt="After" className="w-14 h-14 rounded-xl object-cover border" />
                      <input
                        type="text"
                        value={afterPhoto}
                        onChange={(e) => setAfterPhoto(e.target.value)}
                        className="flex-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[11px]"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setCompletionStep(2)}
                      className="w-1/2 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
                    >
                      ← Back
                    </button>
                    <button
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

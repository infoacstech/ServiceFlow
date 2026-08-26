import React, { useState } from 'react';
import {
  UserCheck,
  Wrench,
  CheckCircle2,
  ShieldCheck,
  AlertOctagon,
  Check,
  Clock,
  Sparkles,
  Lock,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  History,
  X,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { Job, JobStatus, UserRole } from '../types';
import { useApp } from '../context/AppContext';
import {
  JOB_SERVICE_STAGES,
  getJobStageIndex,
  getJobStatusLabel,
  validateJobStatusTransition,
  ServiceStage,
} from '../utils/jobWorkflow';

interface JobServiceProgressBarProps {
  id?: string;
  job?: Job;
  status: JobStatus;
  onStatusChange?: (newStatus: JobStatus, reason?: string) => void;
  isInteractive?: boolean;
  className?: string;
  userRole?: UserRole;
  showAuditHistory?: boolean;
}

export const JobServiceProgressBar: React.FC<JobServiceProgressBarProps> = ({
  id,
  job,
  status,
  onStatusChange,
  isInteractive = true,
  className = '',
  userRole: roleProp,
  showAuditHistory = true,
}) => {
  const { currentUser } = useApp();
  const activeRole: UserRole = roleProp || currentUser?.role || 'technician';
  const isOwnerOrAdmin = activeRole === 'business_owner' || activeRole === 'super_admin';
  const isManager = activeRole === 'manager';
  const isAuthorizedAdmin = isOwnerOrAdmin || isManager;

  const stages = JOB_SERVICE_STAGES;
  const currentStageIdx = getJobStageIndex(status);
  const isCancelled = status === 'cancelled';

  // Selected stage for inspection (tapping never changes status immediately)
  const [inspectedStageIdx, setInspectedStageIdx] = useState<number | null>(null);

  // Confirmation modal states
  const [pendingTargetStatus, setPendingTargetStatus] = useState<JobStatus | null>(null);
  const [changeReason, setChangeReason] = useState('');
  const [reasonError, setReasonError] = useState('');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Collapsible Audit History
  const [isAuditHistoryOpen, setIsAuditHistoryOpen] = useState(false);

  // Calculate track progress percentage
  const getProgressPercentage = (): number => {
    if (isCancelled) return 0;
    if (currentStageIdx === 0) {
      return status === 'new' ? 6 : 18;
    }
    if (currentStageIdx === 1) {
      if (status === 'on_the_way') return 38;
      if (status === 'started') return 48;
      return 52;
    }
    if (currentStageIdx === 2) return 82;
    if (currentStageIdx === 3) return 100;
    return 0;
  };

  const progressPercent = getProgressPercentage();

  // Helper to initiate controlled status transition
  const handleInitiateStatusTransition = (targetStatus: JobStatus) => {
    if (!isInteractive || !onStatusChange) return;

    const validation = validateJobStatusTransition(status, targetStatus, activeRole);
    if (!validation.allowed && !validation.isBackward) {
      return;
    }

    setPendingTargetStatus(targetStatus);
    setChangeReason('');
    setReasonError('');
    setIsConfirmModalOpen(true);
  };

  const handleConfirmTransition = () => {
    if (!pendingTargetStatus || !onStatusChange) return;

    const validation = validateJobStatusTransition(status, pendingTargetStatus, activeRole);
    if (!validation.allowed) {
      setReasonError(validation.reason || 'Permission denied.');
      return;
    }

    if (validation.requiresReason && !changeReason.trim()) {
      setReasonError('Please provide a mandatory reason for this backward or reopen change.');
      return;
    }

    onStatusChange(pendingTargetStatus, changeReason.trim() || undefined);
    setIsConfirmModalOpen(false);
    setPendingTargetStatus(null);
    setChangeReason('');
    setReasonError('');
    setInspectedStageIdx(null);
  };

  // Get active stage icon component
  const getStageIcon = (stage: ServiceStage) => {
    switch (stage.key) {
      case 'assigned':
        return UserCheck;
      case 'in_progress':
        return Wrench;
      case 'completed':
        return CheckCircle2;
      case 'verified':
        return ShieldCheck;
      default:
        return Wrench;
    }
  };

  // Audit history entries from job
  const activityItems = (job?.activityHistory || []).filter(
    (a) => a.fromStatus || a.toStatus || a.action.toLowerCase().includes('status')
  );

  if (isCancelled) {
    return (
      <div
        id={id}
        className={`p-4 bg-rose-50 dark:bg-rose-950/40 rounded-2xl border border-rose-200 dark:border-rose-900 flex items-center justify-between gap-3 ${className}`}
      >
        <div className="flex items-center gap-2.5 text-rose-800 dark:text-rose-200">
          <AlertOctagon className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
          <div>
            <div className="font-extrabold text-xs">Job Order Cancelled</div>
            <div className="text-[11px] text-rose-600 dark:text-rose-400">
              This service order has been marked as cancelled.
            </div>
          </div>
        </div>
        {isInteractive && onStatusChange && isAuthorizedAdmin && (
          <button
            type="button"
            onClick={() => handleInitiateStatusTransition('assigned')}
            className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Re-activate Job
          </button>
        )}
      </div>
    );
  }

  // Active inspected stage details
  const inspectedStage = inspectedStageIdx !== null ? stages[inspectedStageIdx] : null;

  return (
    <div
      id={id}
      className={`p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3.5 transition-all ${className}`}
    >
      {/* Header bar with current status badge and stage info */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
            Service Progress Tracker
          </span>
          <div className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5 mt-0.5">
            <span>Stage {currentStageIdx + 1} of 4:</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">
              {stages[currentStageIdx]?.title || 'Assigned'}
            </span>
          </div>
        </div>

        {/* Current status pill */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200/80 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-300 text-xs font-black">
          <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-ping" />
          <span>{getJobStatusLabel(status)}</span>
        </div>
      </div>

      {/* Horizontal Stepper Progress Bar */}
      <div className="relative pt-2 pb-1 px-2 sm:px-4">
        {/* Background Track Line */}
        <div className="absolute top-[28px] left-[12%] right-[12%] h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full z-0 pointer-events-none" />

        {/* Active Animated Progress Track Line */}
        <div
          className="absolute top-[28px] left-[12%] h-1.5 bg-gradient-to-r from-indigo-500 via-indigo-600 to-emerald-500 rounded-full z-0 transition-all duration-500 ease-out pointer-events-none"
          style={{ width: `${Math.min(progressPercent, 76)}%` }}
        />

        {/* Step Nodes Grid */}
        <div className="relative z-10 grid grid-cols-4 gap-1">
          {stages.map((stage, idx) => {
            const isCompleted = currentStageIdx > idx;
            const isCurrent = currentStageIdx === idx;
            const isPending = currentStageIdx < idx;
            const isInspected = inspectedStageIdx === idx;
            const IconComp = getStageIcon(stage);

            return (
              <div
                key={stage.key}
                className="flex flex-col items-center text-center group cursor-pointer"
                onClick={() => {
                  // Purely inspect stage details; NEVER change status on click
                  setInspectedStageIdx(inspectedStageIdx === idx ? null : idx);
                }}
              >
                {/* Node Circle */}
                <button
                  type="button"
                  aria-label={`${stage.title}: ${stage.description}`}
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-xs relative ${
                    isCompleted
                      ? 'bg-emerald-600 text-white ring-4 ring-emerald-50 dark:ring-emerald-950/60 font-black cursor-pointer hover:ring-emerald-200'
                      : isCurrent
                      ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 dark:ring-indigo-950 shadow-indigo-600/30 scale-110 font-black cursor-pointer'
                      : 'bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-300 cursor-pointer'
                  } ${isInspected ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}
                  title={`${stage.title}: ${stage.description} (Tap to view details)`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                  ) : (
                    <IconComp className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${isCurrent ? 'animate-pulse' : ''}`} />
                  )}

                  {/* Pulsing indicator for active stage */}
                  {isCurrent && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500" />
                    </span>
                  )}

                  {/* Completed lock indicator */}
                  {isCompleted && (
                    <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-slate-900 dark:bg-slate-800 text-white rounded-full flex items-center justify-center border border-white dark:border-slate-700">
                      <Lock className="w-2 h-2 text-emerald-400" />
                    </span>
                  )}
                </button>

                {/* Stage Title and Label */}
                <div className="mt-2 space-y-0.5 max-w-[85px] sm:max-w-[110px]">
                  <div
                    className={`text-[11px] sm:text-xs leading-tight font-extrabold transition-colors ${
                      isCurrent
                        ? 'text-indigo-600 dark:text-indigo-400 font-black'
                        : isCompleted
                        ? 'text-emerald-700 dark:text-emerald-400 font-bold'
                        : 'text-slate-400 dark:text-slate-500 font-medium'
                    }`}
                  >
                    {stage.title}
                  </div>
                  <div className="text-[9px] text-slate-400 dark:text-slate-500 hidden sm:block leading-tight line-clamp-1">
                    {stage.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stage Inspection Panel (Shown when a user taps any milestone) */}
      {inspectedStage && (
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5 animate-fadeIn">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100">
                  Stage {inspectedStageIdx! + 1}: {inspectedStage.title}
                </span>
                {inspectedStageIdx! < currentStageIdx && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Completed & Locked
                  </span>
                )}
                {inspectedStageIdx === currentStageIdx && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Current Active Stage
                  </span>
                )}
                {inspectedStageIdx! > currentStageIdx && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Pending Stage
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {inspectedStage.description}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setInspectedStageIdx(null)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Action buttons inside stage inspector */}
          {isInteractive && onStatusChange && (
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between flex-wrap gap-2">
              <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Info className="w-3 h-3 text-slate-400" />
                <span>
                  {inspectedStageIdx === currentStageIdx
                    ? 'Job is currently in this stage.'
                    : inspectedStageIdx! > currentStageIdx
                    ? 'Forward stage progression requires explicit confirmation.'
                    : 'Previous stage is locked to protect job history.'}
                </span>
              </div>

              {/* Action trigger depending on state and user authorization */}
              {inspectedStageIdx! > currentStageIdx && (
                <button
                  type="button"
                  id={`btn-progress-${inspectedStage.key}`}
                  onClick={() => handleInitiateStatusTransition(inspectedStage.targetStatus)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
                >
                  <span>Mark as {inspectedStage.title}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

              {inspectedStageIdx! < currentStageIdx && (
                <>
                  {isAuthorizedAdmin ? (
                    <button
                      type="button"
                      id={`btn-reopen-${inspectedStage.key}`}
                      onClick={() => handleInitiateStatusTransition(inspectedStage.targetStatus)}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reopen / Move to {inspectedStage.title}</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium italic">
                      <Lock className="w-3 h-3 text-slate-400" /> Locked (Requires Manager Permission)
                    </span>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Interactive Helper Text */}
      {isInteractive && (
        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/80 flex-wrap gap-2">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-500" />
            <span>Tap a stage to view details. Status transitions require confirmation & authorization.</span>
          </span>
          <span className="font-semibold text-slate-500 dark:text-slate-400">
            {progressPercent}% Service Flow
          </span>
        </div>
      )}

      {/* Expandable Status Audit History */}
      {showAuditHistory && activityItems.length > 0 && (
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setIsAuditHistoryOpen(!isAuditHistoryOpen)}
            className="w-full flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition-colors py-1 cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-indigo-500" />
              <span>Status Audit Trail ({activityItems.length} changes)</span>
            </span>
            {isAuditHistoryOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {isAuditHistoryOpen && (
            <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {activityItems.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 text-[11px] space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {item.action || `${item.fromStatus} → ${item.toStatus}`}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {item.timestamp ? new Date(item.timestamp).toLocaleString() : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 text-[10px]">
                    <span>By: <strong className="text-slate-700 dark:text-slate-300">{item.actorName}</strong> {item.actorRole && `(${item.actorRole})`}</span>
                    {item.reason && (
                      <span className="text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded">
                        Reason: {item.reason}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Confirmation & Authorization Modal */}
      {isConfirmModalOpen && pendingTargetStatus && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            {/* Modal Header */}
            {(() => {
              const validation = validateJobStatusTransition(status, pendingTargetStatus, activeRole);
              const isBackward = validation.isBackward;

              return (
                <>
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                        isBackward
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                          : 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                      }`}
                    >
                      {isBackward ? <AlertTriangle className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                        {isBackward
                          ? 'Change Job Status?'
                          : `Mark Job as ${getJobStatusLabel(pendingTargetStatus)}?`}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {isBackward
                          ? validation.warningMessage ||
                            `This job is already marked as ${getJobStatusLabel(status)}. Moving it back to ${getJobStatusLabel(
                              pendingTargetStatus
                            )} may affect job history, reports, billing, and workflow records.`
                          : `Are you sure you want to move this job to ${getJobStatusLabel(pendingTargetStatus)}?`}
                      </p>
                    </div>
                  </div>

                  {/* Backward Warning Banner */}
                  {isBackward && (
                    <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                      <div className="font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                        <ShieldAlert className="w-3.5 h-3.5" /> High-Risk Status Change
                      </div>
                      <p className="text-[11px] leading-relaxed">
                        An audit log entry will be permanently recorded with your name (
                        <strong>{currentUser?.name || 'Authorized User'}</strong>) and role (
                        <strong>{activeRole}</strong>).
                      </p>
                    </div>
                  )}

                  {/* Reason Textarea Input */}
                  {(isBackward || validation.requiresReason) && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                        <span>Reason for Status Change:</span>
                        <span className="text-[10px] text-amber-600 font-semibold">* Required for audit</span>
                      </label>
                      <textarea
                        value={changeReason}
                        onChange={(e) => {
                          setChangeReason(e.target.value);
                          if (reasonError) setReasonError('');
                        }}
                        placeholder="e.g. Customer requested additional work / QC inspection reopened"
                        rows={2}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                      {reasonError && <div className="text-[11px] font-semibold text-rose-600">{reasonError}</div>}
                    </div>
                  )}

                  {/* Modal Action Buttons */}
                  <div className="flex items-center justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsConfirmModalOpen(false);
                        setPendingTargetStatus(null);
                        setReasonError('');
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      id="btn-confirm-status-transition"
                      onClick={handleConfirmTransition}
                      className={`px-4 py-2 rounded-xl text-xs font-black text-white shadow-sm transition-all cursor-pointer ${
                        isBackward
                          ? 'bg-amber-600 hover:bg-amber-700'
                          : 'bg-indigo-600 hover:bg-indigo-700'
                      }`}
                    >
                      Confirm Transition
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

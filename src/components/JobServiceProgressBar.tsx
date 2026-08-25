import React from 'react';
import {
  UserCheck,
  Wrench,
  CheckCircle2,
  ShieldCheck,
  AlertOctagon,
  Check,
  Clock,
  Sparkles,
} from 'lucide-react';
import { JobStatus } from '../types';

interface JobServiceProgressBarProps {
  id?: string;
  status: JobStatus;
  onStatusChange?: (newStatus: JobStatus) => void;
  isInteractive?: boolean;
  className?: string;
}

interface ServiceStage {
  key: string;
  targetStatus: JobStatus;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  matchingStatuses: JobStatus[];
}

export const JobServiceProgressBar: React.FC<JobServiceProgressBarProps> = ({
  id,
  status,
  onStatusChange,
  isInteractive = true,
  className = '',
}) => {
  const stages: ServiceStage[] = [
    {
      key: 'assigned',
      targetStatus: 'assigned',
      title: 'Assigned',
      description: 'Scheduled & Tech Dispatched',
      icon: UserCheck,
      matchingStatuses: ['new', 'scheduled', 'assigned'],
    },
    {
      key: 'in_progress',
      targetStatus: 'in_progress',
      title: 'In Progress',
      description: 'On The Way / Work In Progress',
      icon: Wrench,
      matchingStatuses: ['on_the_way', 'started', 'in_progress', 'on_hold'],
    },
    {
      key: 'completed',
      targetStatus: 'completed',
      title: 'Completed',
      description: 'Work Done & Customer Signoff',
      icon: CheckCircle2,
      matchingStatuses: ['completed'],
    },
    {
      key: 'verified',
      targetStatus: 'verified',
      title: 'Verified',
      description: 'QC Checked & Invoice Closed',
      icon: ShieldCheck,
      matchingStatuses: ['verified', 'closed'],
    },
  ];

  // Calculate current stage index (0 to 3)
  const getStageIndex = (st: JobStatus): number => {
    if (st === 'cancelled') return -1;
    for (let i = stages.length - 1; i >= 0; i--) {
      if (stages[i].matchingStatuses.includes(st)) {
        return i;
      }
    }
    return 0;
  };

  const currentStageIdx = getStageIndex(status);
  const isCancelled = status === 'cancelled';

  // Calculate track progress percentage
  const getProgressPercentage = (): number => {
    if (isCancelled) return 0;
    if (currentStageIdx === 0) {
      return status === 'new' ? 5 : 16;
    }
    if (currentStageIdx === 1) {
      if (status === 'on_the_way') return 38;
      if (status === 'started') return 50;
      return 52;
    }
    if (currentStageIdx === 2) return 82;
    if (currentStageIdx === 3) return 100;
    return 0;
  };

  const progressPercent = getProgressPercentage();

  // Status human-readable label
  const getStatusHumanLabel = (st: JobStatus): string => {
    switch (st) {
      case 'new':
        return 'New Job Received';
      case 'scheduled':
        return 'Scheduled';
      case 'assigned':
        return 'Assigned to Technician';
      case 'on_the_way':
        return 'Technician On The Way';
      case 'started':
        return 'Work Started on Site';
      case 'in_progress':
        return 'In Progress';
      case 'on_hold':
        return 'On Hold / Waiting Parts';
      case 'completed':
        return 'Completed & Signed Off';
      case 'verified':
        return 'Verified by QA/Admin';
      case 'closed':
        return 'Closed & Billed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return (st as string).replace('_', ' ').toUpperCase();
    }
  };

  if (isCancelled) {
    return (
      <div
        id={id}
        className={`p-4 bg-rose-50 dark:bg-rose-950/40 rounded-2xl border border-rose-200 dark:border-rose-900 flex items-center justify-between gap-3 ${className}`}
      >
        <div className="flex items-center gap-2.5 text-rose-800 dark:text-rose-200">
          <AlertOctagon className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
          <div>
            <div className="font-extrabold text-xs">Job Cancelled</div>
            <div className="text-[11px] text-rose-600 dark:text-rose-400">
              This service order has been marked as cancelled.
            </div>
          </div>
        </div>
        {isInteractive && onStatusChange && (
          <button
            type="button"
            onClick={() => onStatusChange('assigned')}
            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs cursor-pointer"
          >
            Re-activate Job
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      id={id}
      className={`p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3.5 ${className}`}
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
          <span>{getStatusHumanLabel(status)}</span>
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
            const IconComp = stage.icon;

            return (
              <div
                key={stage.key}
                className="flex flex-col items-center text-center group cursor-pointer"
                onClick={() => {
                  if (isInteractive && onStatusChange) {
                    onStatusChange(stage.targetStatus);
                  }
                }}
              >
                {/* Node Circle */}
                <button
                  type="button"
                  disabled={!isInteractive || !onStatusChange}
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-xs relative ${
                    isCompleted
                      ? 'bg-emerald-600 text-white ring-4 ring-emerald-50 dark:ring-emerald-950/60 font-black'
                      : isCurrent
                      ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 dark:ring-indigo-950 shadow-indigo-600/30 scale-110 font-black'
                      : 'bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                  } ${isInteractive && onStatusChange ? 'cursor-pointer active:scale-95' : 'cursor-default'}`}
                  title={`${stage.title}: ${stage.description} (Click to change status)`}
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

      {/* Interactive Helper Text (If Interactive) */}
      {isInteractive && onStatusChange && (
        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/80">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-500" />
            <span>Click any stage milestone to update the job lifecycle</span>
          </span>
          <span className="font-semibold text-slate-500 dark:text-slate-400">
            {progressPercent}% Service Flow
          </span>
        </div>
      )}
    </div>
  );
};

import { Job, JobStatus, UserRole } from '../types';

export interface ServiceStage {
  key: string;
  targetStatus: JobStatus;
  title: string;
  description: string;
  stageLevel: number;
  matchingStatuses: JobStatus[];
}

export const JOB_SERVICE_STAGES: ServiceStage[] = [
  {
    key: 'assigned',
    targetStatus: 'assigned',
    title: 'Assigned',
    description: 'Scheduled & Tech Dispatched',
    stageLevel: 1,
    matchingStatuses: ['new', 'scheduled', 'assigned', 'accepted'],
  },
  {
    key: 'in_progress',
    targetStatus: 'in_progress',
    title: 'In Progress',
    description: 'On The Way / Work In Progress',
    stageLevel: 2,
    matchingStatuses: ['on_the_way', 'started', 'in_progress', 'on_hold'],
  },
  {
    key: 'completed',
    targetStatus: 'completed',
    title: 'Completed',
    description: 'Work Done & Customer Signoff',
    stageLevel: 3,
    matchingStatuses: ['completed'],
  },
  {
    key: 'verified',
    targetStatus: 'verified',
    title: 'Verified',
    description: 'QC Checked & Invoice Closed',
    stageLevel: 4,
    matchingStatuses: ['verified', 'closed'],
  },
];

/**
 * Get numerical stage index (0 to 3) for a given JobStatus
 */
export function getJobStageIndex(status: JobStatus): number {
  if (status === 'cancelled') return -1;
  for (let i = JOB_SERVICE_STAGES.length - 1; i >= 0; i--) {
    if (JOB_SERVICE_STAGES[i].matchingStatuses.includes(status)) {
      return i;
    }
  }
  return 0;
}

/**
 * Get human-friendly label for any JobStatus
 */
export function getJobStatusLabel(status: JobStatus): string {
  switch (status) {
    case 'new':
      return 'New Job Received';
    case 'scheduled':
      return 'Scheduled';
    case 'assigned':
      return 'Assigned to Technician';
    case 'accepted':
      return 'Accepted by Tech';
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
      return (status as string).replace('_', ' ').toUpperCase();
  }
}

export interface TransitionValidationResult {
  allowed: boolean;
  isNoOp?: boolean;
  isForward?: boolean;
  isBackward?: boolean;
  isReopen?: boolean;
  requiresReason?: boolean;
  warningMessage?: string;
  reason?: string;
}

/**
 * Central Transition Rule Validator:
 * Evaluates whether transitioning from currentStatus -> targetStatus is permitted for userRole.
 */
export function validateJobStatusTransition(
  currentStatus: JobStatus,
  targetStatus: JobStatus,
  userRole?: UserRole
): TransitionValidationResult {
  if (currentStatus === targetStatus) {
    return {
      allowed: false,
      isNoOp: true,
      reason: `Job is already in "${getJobStatusLabel(currentStatus)}" status.`,
    };
  }

  const isOwnerOrAdmin = userRole === 'business_owner' || userRole === 'super_admin';
  const isManager = userRole === 'manager';
  const isAuthorizedAdmin = isOwnerOrAdmin || isManager;

  const currentStageIdx = getJobStageIndex(currentStatus);
  const targetStageIdx = getJobStageIndex(targetStatus);

  // Special Case 1: Cancelled Job Reactivation
  if (currentStatus === 'cancelled') {
    if (!isAuthorizedAdmin) {
      return {
        allowed: false,
        reason: 'Only Business Owners or Managers can reactivate a cancelled job.',
      };
    }
    return {
      allowed: true,
      isForward: true,
      requiresReason: true,
      warningMessage: 'Reactivating this cancelled job will return it to active workflow scheduling.',
    };
  }

  // Special Case 2: Cancellation of an Active Job
  if (targetStatus === 'cancelled') {
    if (!isAuthorizedAdmin) {
      return {
        allowed: false,
        reason: 'Only Business Owners or Managers can cancel a job order.',
      };
    }
    return {
      allowed: true,
      isBackward: true,
      requiresReason: true,
      warningMessage: 'Cancelling this job will halt all technician dispatches and customer notifications.',
    };
  }

  // Special Case 3: Reopening Verified / Closed Jobs (Level 4 / Stage 3)
  if (currentStatus === 'verified' || currentStatus === 'closed') {
    if (!isAuthorizedAdmin) {
      return {
        allowed: false,
        reason: 'Verified and closed jobs are permanently locked. Only Business Owners or Managers can reopen verified jobs.',
      };
    }
    return {
      allowed: true,
      isBackward: true,
      isReopen: true,
      requiresReason: true,
      warningMessage:
        'This job has already been verified and closed for quality assurance. Reopening it will move it back to active status and record an audit entry.',
    };
  }

  // Case 4: Moving Backward from Completed (Level 3 / Stage 2)
  if (currentStatus === 'completed' && targetStageIdx < currentStageIdx) {
    if (!isAuthorizedAdmin) {
      return {
        allowed: false,
        reason:
          'This job is already marked as Completed. Technicians cannot revert completed jobs. Please contact a Business Owner or Manager to modify.',
      };
    }
    return {
      allowed: true,
      isBackward: true,
      requiresReason: true,
      warningMessage: `This job is already marked as Completed. Moving it back to ${getJobStatusLabel(
        targetStatus
      )} may affect job history, billing, warranty records, and workflow ledgers.`,
    };
  }

  // Case 5: Moving Backward in Earlier Stages (e.g., In Progress -> Assigned)
  if (targetStageIdx < currentStageIdx) {
    if (!isAuthorizedAdmin) {
      return {
        allowed: false,
        reason: 'Technicians cannot revert jobs to an earlier stage. Contact a manager to reassign.',
      };
    }
    return {
      allowed: true,
      isBackward: true,
      requiresReason: true,
      warningMessage: `Moving this job back to ${getJobStatusLabel(
        targetStatus
      )} will reset its progress stage.`,
    };
  }

  // Case 6: Standard Forward Progression
  // Assigned (0) -> In Progress (1) -> Completed (2) -> Verified (3)
  if (targetStageIdx > currentStageIdx) {
    // Normal forward transition
    if (targetStatus === 'verified' && !isAuthorizedAdmin) {
      return {
        allowed: false,
        reason: 'Only Quality Assurance Admins or Business Owners can mark a job as Verified.',
      };
    }

    return {
      allowed: true,
      isForward: true,
      requiresReason: false,
      warningMessage: `Are you sure you want to advance this job to "${getJobStatusLabel(targetStatus)}"?`,
    };
  }

  // Case 7: Same Stage Sub-Status Change (e.g., 'on_the_way' -> 'started' -> 'in_progress')
  return {
    allowed: true,
    isForward: true,
    requiresReason: false,
  };
}

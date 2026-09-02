import { RecurringContract, VisitFrequency } from '../types';

/**
 * Returns interval in months for a given visit frequency
 */
export function getFrequencyIntervalMonths(freq: VisitFrequency): number {
  switch (freq) {
    case 'monthly':
      return 1;
    case 'quarterly':
      return 3;
    case 'bi_annual':
      return 6;
    case 'annual':
      return 12;
    default:
      return 3;
  }
}

/**
 * Adds months to a YYYY-MM-DD date string safely preserving day of month
 */
export function addMonthsToDateString(dateStr: string, monthsToAdd: number): string {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return new Date().toISOString().split('T')[0];

  const currentDay = date.getDate();
  date.setMonth(date.getMonth() + monthsToAdd);

  // Handle month overflow (e.g. Jan 31 + 1 month -> Feb 28/29)
  if (date.getDate() < currentDay) {
    date.setDate(0);
  }

  return date.toISOString().split('T')[0];
}

/**
 * Calculates the next visit due date for an AMC contract
 */
export function calculateNextVisitDate(contract: RecurringContract): string {
  if (contract.nextVisitDate && contract.nextVisitDate.trim() !== '') {
    return contract.nextVisitDate;
  }

  if (contract.visitsRemaining <= 0) {
    return contract.endDate || new Date().toISOString().split('T')[0];
  }

  const intervalMonths = getFrequencyIntervalMonths(contract.visitFrequency);
  const visitsUsed = contract.visitsUsed || 0;

  // Next milestone is offset by visitsUsed * interval
  const nextDate = addMonthsToDateString(contract.startDate, visitsUsed * intervalMonths);
  return nextDate;
}

export interface AmcVisitStatus {
  nextVisitDate: string;
  daysUntilVisit: number;
  isOverdue: boolean;
  isDueSoon: boolean; // within 7 days
  isDueThisMonth: boolean; // within 30 days
  isCompleted: boolean;
  visitNumber: number;
  statusLabel: string;
  badgeClass: string;
}

/**
 * Computes status and due time for the contract's upcoming preventive maintenance visit
 */
export function getAmcVisitStatus(contract: RecurringContract): AmcVisitStatus {
  const isCompleted = (contract.visitsRemaining || 0) <= 0;
  const nextVisitDate = calculateNextVisitDate(contract);
  const visitNumber = Math.min((contract.visitsUsed || 0) + 1, contract.visitsAllowed || 1);

  if (isCompleted) {
    return {
      nextVisitDate: contract.lastVisitDate || contract.endDate,
      daysUntilVisit: 999,
      isOverdue: false,
      isDueSoon: false,
      isDueThisMonth: false,
      isCompleted: true,
      visitNumber: contract.visitsAllowed,
      statusLabel: 'All Visits Rendered',
      badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(nextVisitDate);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  const daysUntilVisit = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const isOverdue = daysUntilVisit < 0;
  const isDueSoon = daysUntilVisit >= 0 && daysUntilVisit <= 7;
  const isDueThisMonth = daysUntilVisit >= 0 && daysUntilVisit <= 30;

  let statusLabel = '';
  let badgeClass = '';

  if (isOverdue) {
    const daysLate = Math.abs(daysUntilVisit);
    statusLabel = daysLate === 1 ? 'Overdue by 1 day' : `Overdue by ${daysLate} days`;
    badgeClass = 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300 dark:border-rose-800 animate-pulse font-extrabold';
  } else if (daysUntilVisit === 0) {
    statusLabel = 'Due Today';
    badgeClass = 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-800 font-black animate-pulse';
  } else if (isDueSoon) {
    statusLabel = `Due in ${daysUntilVisit} ${daysUntilVisit === 1 ? 'day' : 'days'}`;
    badgeClass = 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800 font-bold';
  } else {
    statusLabel = `Scheduled: ${nextVisitDate}`;
    badgeClass = 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 font-medium';
  }

  return {
    nextVisitDate,
    daysUntilVisit,
    isOverdue,
    isDueSoon,
    isDueThisMonth,
    isCompleted: false,
    visitNumber,
    statusLabel,
    badgeClass,
  };
}

export interface VisitMilestone {
  visitNumber: number;
  date: string;
  status: 'completed' | 'due' | 'overdue' | 'upcoming';
  label: string;
}

/**
 * Generates all scheduled milestones for visual progress breakdown
 */
export function generateVisitScheduleMilestones(contract: RecurringContract): VisitMilestone[] {
  const milestones: VisitMilestone[] = [];
  const interval = getFrequencyIntervalMonths(contract.visitFrequency);
  const total = contract.visitsAllowed || 1;
  const used = contract.visitsUsed || 0;

  const today = new Date().toISOString().split('T')[0];

  for (let i = 0; i < total; i++) {
    const visitNum = i + 1;
    const date = addMonthsToDateString(contract.startDate, i * interval);
    let status: 'completed' | 'due' | 'overdue' | 'upcoming' = 'upcoming';

    if (i < used) {
      status = 'completed';
    } else if (i === used) {
      if (date < today) {
        status = 'overdue';
      } else if (date === today) {
        status = 'due';
      } else {
        status = 'upcoming';
      }
    } else {
      status = 'upcoming';
    }

    milestones.push({
      visitNumber: visitNum,
      date,
      status,
      label: `Visit #${visitNum}`,
    });
  }

  return milestones;
}

/**
 * Returns all contracts where next visit is due within given days or overdue
 */
export function getUpcomingDueAmcContracts(contracts: RecurringContract[], maxDaysAhead = 7): RecurringContract[] {
  return (contracts || []).filter((c) => {
    if (c.status === 'cancelled' || (c.visitsRemaining || 0) <= 0) return false;
    const status = getAmcVisitStatus(c);
    return status.isOverdue || status.daysUntilVisit <= maxDaysAhead;
  });
}

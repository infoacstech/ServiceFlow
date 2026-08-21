import { Plan } from '../types';

export const ANNUAL_DISCOUNT_PERCENT = 20;

export const PLANS: Plan[] = [
  {
    id: 'plan-starter',
    name: 'Starter',
    price: 299,
    yearlyPrice: 2870, // 299 * 12 * 0.8 = 2870.4
    billingCycle: 'monthly',
    maxStaff: 2,
    maxJobs: 100,
    maxCustomers: 500,
    targetAudience: 'For small service businesses',
    features: [
      'Enquiries & Intake',
      'Customer Management',
      'Follow-ups',
      'Basic Quotation',
      'Job Management',
      'Job Scheduling',
      'Technician Assignment',
      'Job Status Tracking',
      'Job History',
      'Basic Reports',
    ],
  },
  {
    id: 'plan-pro',
    name: 'Professional',
    price: 599,
    yearlyPrice: 5750, // 599 * 12 * 0.8 = 5750.4
    billingCycle: 'monthly',
    maxStaff: 7,
    maxJobs: 500,
    maxCustomers: 2500,
    popular: true,
    badge: 'MOST POPULAR',
    targetAudience: 'For growing service teams',
    features: [
      'Everything in Starter, plus:',
      'Advanced Enquiry Management',
      'Advanced Follow-up Management',
      'Advanced Quotations',
      'Customer Portal',
      'Advanced Job Scheduling',
      'Technician/Staff Management',
      'Advanced Reports & Analytics',
      'Customer Notifications',
      'Priority Support',
    ],
  },
  {
    id: 'plan-biz',
    name: 'Business',
    price: 999,
    yearlyPrice: 9590, // 999 * 12 * 0.8 = 9590.4
    billingCycle: 'monthly',
    maxStaff: 15,
    maxJobs: 1500,
    maxCustomers: 10000,
    targetAudience: 'For larger service operations',
    features: [
      'Everything in Professional, plus:',
      'Multi-location support',
      'Higher operational limits',
      'Advanced staff controls',
      'Advanced business reports',
      'Priority support',
      'Additional business-level controls',
    ],
  },
];

/**
 * Get plan configuration by plan ID or name, with safe fallback to Starter
 */
export function getPlanById(planIdOrName?: string): Plan {
  if (!planIdOrName) return PLANS[0];
  
  const normalized = planIdOrName.toLowerCase();
  const match = PLANS.find(
    (p) =>
      p.id.toLowerCase() === normalized ||
      p.name.toLowerCase() === normalized ||
      (normalized.includes('start') && p.id === 'plan-starter') ||
      (normalized.includes('pro') && p.id === 'plan-pro') ||
      ((normalized.includes('biz') || normalized.includes('business') || normalized.includes('enterprise')) && p.id === 'plan-biz')
  );

  return match || PLANS[0];
}

/**
 * Calculate annual pricing breakdown with standard 20% discount
 */
export function calculateAnnualPricing(monthlyPrice: number) {
  const originalAnnual = monthlyPrice * 12;
  const discountedAnnual = Math.round(originalAnnual * (1 - ANNUAL_DISCOUNT_PERCENT / 100));
  const savings = originalAnnual - discountedAnnual;
  return {
    originalAnnual,
    discountedAnnual,
    savings,
    discountPercent: ANNUAL_DISCOUNT_PERCENT,
  };
}

/**
 * Check if adding a staff member exceeds the plan limit
 */
export function checkStaffCapacity(currentStaffCount: number, planIdOrName?: string) {
  const plan = getPlanById(planIdOrName);
  const isAllowed = currentStaffCount < plan.maxStaff;
  return {
    allowed: isAllowed,
    currentCount: currentStaffCount,
    maxStaff: plan.maxStaff,
    planName: plan.name,
    message: isAllowed
      ? undefined
      : `You've reached your ${plan.name} plan limit of ${plan.maxStaff} technicians. Upgrade your plan to add more staff.`,
  };
}

/**
 * Check if creating a new job exceeds the monthly plan quota
 */
export function checkMonthlyJobCapacity(currentMonthlyJobs: number, planIdOrName?: string) {
  const plan = getPlanById(planIdOrName);
  const isAllowed = currentMonthlyJobs < plan.maxJobs;
  return {
    allowed: isAllowed,
    currentCount: currentMonthlyJobs,
    maxJobs: plan.maxJobs,
    planName: plan.name,
    message: isAllowed
      ? undefined
      : `You've reached your ${plan.name} plan limit of ${plan.maxJobs} jobs this month. Upgrade your plan to create more jobs.`,
  };
}

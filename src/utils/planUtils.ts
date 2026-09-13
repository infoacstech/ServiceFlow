import { Plan, Business } from '../types';

export const ANNUAL_DISCOUNT_PERCENT = 20;

export interface AddonPack {
  id: 'addon-staff-5' | 'addon-whatsapp-1000';
  name: string;
  type: 'staff_pack' | 'whatsapp_pack';
  price: number;
  yearlyPrice?: number;
  description: string;
  capacityIncrease: number;
  badge?: string;
}

export const ADDON_PACKS: AddonPack[] = [
  {
    id: 'addon-staff-5',
    name: '+5 Technicians Capacity Pack',
    type: 'staff_pack',
    price: 199,
    yearlyPrice: 1910,
    description: 'Add 5 extra technician & staff logins without upgrading to a higher plan tier',
    capacityIncrease: 5,
    badge: 'FLEXIBLE CAPACITY',
  },
  {
    id: 'addon-whatsapp-1000',
    name: '1,000 Automated WhatsApp Alerts Pack',
    type: 'whatsapp_pack',
    price: 299,
    yearlyPrice: 2870,
    description: '1,000 automated WhatsApp message credits for job bookings, status alerts & invoice PDFs',
    capacityIncrease: 1000,
    badge: 'CUSTOMER ENGAGEMENT',
  },
];

export const SAAS_UPI_CONFIG = {
  vpa: 'uniquesolutions108@okhdfcbank',
  payeeName: 'ServiFlow SaaS Software',
  bankName: 'HDFC Bank',
  accountNumber: '50200084920194',
  ifscCode: 'HDFC0001234',
  accountHolder: 'Unique Solutions ServiFlow',
};

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
      'AI Smart Dispatch & Routing Assistant',
      'AMC & Preventive Maintenance Contracts',
      'Automated WhatsApp Customer Alerts',
      'Advanced Enquiry & Follow-up Pipeline',
      'Customer Portal with Live Tracking',
      'Advanced Scheduling & Priority Support',
      'Advanced Reports & Analytics',
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
      'Multi-location & branch support',
      'Enterprise Audit Trail & CSV Export',
      'Unlimited WhatsApp automated queue',
      'Higher operational quotas',
      'Priority VIP Dedicated Support',
      'Custom invoice letterheads & branding',
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
 * Feature Gating Definition
 */
export type FeatureKey =
  | 'ai_assistant'
  | 'amc_contracts'
  | 'customer_portal'
  | 'whatsapp_automation'
  | 'audit_export';

/**
 * Check if a specific feature is unlocked on the tenant's current plan
 */
export function isFeatureAllowed(feature: FeatureKey, planIdOrName?: string): boolean {
  const plan = getPlanById(planIdOrName);
  if (plan.id === 'plan-biz') return true;
  if (plan.id === 'plan-pro') {
    return feature !== 'audit_export';
  }
  // Starter tier features allowed:
  return feature === 'customer_portal';
}

/**
 * Get requirement description for locked features
 */
export function getFeatureRequirement(feature: FeatureKey): {
  requiredPlan: 'Professional' | 'Business';
  title: string;
  description: string;
} {
  switch (feature) {
    case 'ai_assistant':
      return {
        requiredPlan: 'Professional',
        title: 'AI Smart Dispatch Assistant',
        description: 'AI-driven technician dispatch, intelligent job notes, and voice assistance require the Professional or Business plan.',
      };
    case 'amc_contracts':
      return {
        requiredPlan: 'Professional',
        title: 'AMC & Maintenance Contracts',
        description: 'Manage recurring AMC contracts, scheduled visits, and automatic renewals with the Professional plan.',
      };
    case 'whatsapp_automation':
      return {
        requiredPlan: 'Professional',
        title: 'Automated WhatsApp Customer Alerts',
        description: 'Send automated invoice receipts, technician dispatch alerts, and job completion notices via WhatsApp.',
      };
    case 'audit_export':
      return {
        requiredPlan: 'Business',
        title: 'Enterprise Audit Trail & CSV Export',
        description: 'Complete compliance audit logs and full system CSV export require the Business plan.',
      };
    default:
      return {
        requiredPlan: 'Professional',
        title: 'Premium SaaS Feature',
        description: 'Upgrade your subscription to unlock this feature for your team.',
      };
  }
}

/**
 * Calculate 14-Day Free Trial Status
 */
export function getTrialStatus(business?: Business | null): {
  isTrial: boolean;
  isExpired: boolean;
  daysRemaining: number;
  trialEndsAt?: string;
  isPaidActive: boolean;
  statusLabel: string;
} {
  if (!business) {
    return {
      isTrial: false,
      isExpired: false,
      daysRemaining: 0,
      isPaidActive: true,
      statusLabel: 'Active',
    };
  }

  const isPaidActive = business.subscriptionStatus === 'active';

  if (isPaidActive) {
    return {
      isTrial: false,
      isExpired: false,
      daysRemaining: 0,
      isPaidActive: true,
      statusLabel: 'Paid Active',
    };
  }

  // Calculate 14-day trial window based on creation date or trialEndsAt
  const createdAtMs = business.createdAt ? new Date(business.createdAt).getTime() : Date.now();
  const trialEndsMs = business.trialEndsAt
    ? new Date(business.trialEndsAt).getTime()
    : createdAtMs + 14 * 24 * 60 * 60 * 1000;

  const nowMs = Date.now();
  const diffMs = trialEndsMs - nowMs;
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const isExpired = diffMs <= 0;

  return {
    isTrial: !isPaidActive && !isExpired,
    isExpired,
    daysRemaining,
    trialEndsAt: new Date(trialEndsMs).toISOString(),
    isPaidActive: false,
    statusLabel: isExpired ? 'Trial Expired' : `Trial (${daysRemaining}d left)`,
  };
}

/**
 * Check if adding a staff member exceeds the plan limit (including purchased add-on staff)
 */
export function checkStaffCapacity(
  currentStaffCount: number,
  planIdOrName?: string,
  addonStaff = 0
) {
  const plan = getPlanById(planIdOrName);
  const totalMaxStaff = plan.maxStaff + (addonStaff || 0);
  const isAllowed = currentStaffCount < totalMaxStaff;
  return {
    allowed: isAllowed,
    currentCount: currentStaffCount,
    maxStaff: totalMaxStaff,
    baseMaxStaff: plan.maxStaff,
    addonStaff: addonStaff || 0,
    planName: plan.name,
    message: isAllowed
      ? undefined
      : `You've reached your ${plan.name} plan limit of ${totalMaxStaff} technicians (${plan.maxStaff} base + ${addonStaff} add-ons). Upgrade your plan or purchase an add-on pack to add more staff.`,
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

/**
 * Generate standard UPI Payment URL for QR Code and UPI Intent
 */
export function buildUpiPaymentUrl(params: {
  amount: number;
  note: string;
  transactionRef?: string;
}): string {
  const amountStr = params.amount.toFixed(2);
  const noteParam = encodeURIComponent(params.note.slice(0, 40));
  const refParam = params.transactionRef ? `&tr=${encodeURIComponent(params.transactionRef)}` : '';
  return `upi://pay?pa=${SAAS_UPI_CONFIG.vpa}&pn=${encodeURIComponent(SAAS_UPI_CONFIG.payeeName)}&am=${amountStr}&cu=INR&tn=${noteParam}${refParam}`;
}

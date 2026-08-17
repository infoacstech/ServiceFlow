import {
  Business,
  User,
  Role,
  Plan,
  Customer,
  ServiceCategory,
  Service,
  Job,
  InventoryItem,
  Quotation,
  Invoice,
  Payment,
  RecurringContract,
  Expense,
  Notification,
  ActivityLog,
  ReferralRecord,
  ReferralPayoutRequest,
} from '../types';

export const DEMO_ROLES: Role[] = [
  {
    id: 'role-superadmin',
    name: 'Super Admin',
    code: 'super_admin',
    description: 'SaaS Platform Owner with full multi-tenant control across all businesses & billing',
    isSystemRole: true,
    permissions: {
      canManageJobs: true,
      canViewFinancials: true,
      canManageStaff: true,
      canManageInventory: true,
      canAccessSettings: true,
      canAccessSuperAdmin: true,
      canAccessCustomerPortal: true,
      canManageServices: true,
      canManageContracts: true,
    },
  },
  {
    id: 'role-owner',
    name: 'Admin / Business Owner',
    code: 'business_owner',
    description: 'Full business operations, staff dispatch, invoices, quotations, settings & analytics',
    isSystemRole: true,
    permissions: {
      canManageJobs: true,
      canViewFinancials: true,
      canManageStaff: true,
      canManageInventory: true,
      canAccessSettings: true,
      canAccessSuperAdmin: false,
      canAccessCustomerPortal: true,
      canManageServices: true,
      canManageContracts: true,
    },
  },
  {
    id: 'role-manager',
    name: 'Service Operations Manager',
    code: 'manager',
    description: 'Manages field dispatch, customers, inventory stock, invoices, and team dispatch',
    isSystemRole: true,
    permissions: {
      canManageJobs: true,
      canViewFinancials: true,
      canManageStaff: true,
      canManageInventory: true,
      canAccessSettings: false,
      canAccessSuperAdmin: false,
      canAccessCustomerPortal: true,
      canManageServices: true,
      canManageContracts: true,
    },
  },
  {
    id: 'role-technician',
    name: 'Field Service Technician',
    code: 'technician',
    description: 'Field service worker focusing on assigned job tickets, status updates & material usage',
    isSystemRole: true,
    permissions: {
      canManageJobs: true,
      canViewFinancials: false,
      canManageStaff: false,
      canManageInventory: false,
      canAccessSettings: false,
      canAccessSuperAdmin: false,
      canAccessCustomerPortal: false,
      canManageServices: false,
      canManageContracts: false,
    },
  },
];

export const DEMO_PLANS: Plan[] = [
  {
    id: 'plan-starter',
    name: 'Starter',
    price: 499,
    yearlyPrice: 4999,
    billingCycle: 'monthly',
    maxJobs: 100,
    maxStaff: 2,
    maxCustomers: 250,
    targetAudience: 'Small Agencies / Freelancers (1 Owner + 2 Field Techs)',
    badge: 'CHHOTE BUSINESS',
    features: [
      'Up to 2 Field Staff / Technicians',
      'Job Scheduling & Real-time Dispatch',
      'GST Invoicing & Quotations with PDF',
      'In-App Audio Voice Announcements',
      'Basic Inventory (Up to 50 items/parts)',
      'Customer Digital Signature & Rating',
    ],
  },
  {
    id: 'plan-pro',
    name: 'Professional',
    price: 1299,
    yearlyPrice: 12499,
    billingCycle: 'monthly',
    maxJobs: 1000,
    maxStaff: 7,
    maxCustomers: 2000,
    popular: true,
    badge: 'MOST POPULAR',
    targetAudience: 'Mid-size Service Agencies (CCTV, AC, RO, Electrical, 5-10 Staff)',
    features: [
      'Up to 7 Field Staff / Technicians',
      'Unlimited Jobs, Invoices & Quotations',
      'Multi-Language Voice Alerts (Hindi, Marathi, Gujarati, English)',
      'Background Push & OS Notifications (Service Worker)',
      'Advanced Inventory & Auto-Parts Usage Deduction',
      'AMC & Recurring Service Maintenance Contracts',
      'Automated WhatsApp / SMS Customer Alerts',
      'Staff Performance Tracking & Financial P&L Reports',
    ],
  },
  {
    id: 'plan-biz',
    name: 'Business',
    price: 2999,
    yearlyPrice: 28999,
    billingCycle: 'monthly',
    maxJobs: 99999,
    maxStaff: 999,
    maxCustomers: 99999,
    badge: 'ENTERPRISE ELITE',
    targetAudience: 'Multi-Branch Service Companies & Security Enterprises',
    features: [
      'Unlimited Technicians & Office Staff',
      'Custom Business Branding & Logo on Invoices & Portals',
      'Complete Security Audit Logs & Multi-Tenant Management',
      'Multi-Branch & Location Dispatch Tracking',
      'Priority 24/7 Dedicated Support & Training',
      'Automated Cloud Backup & Single-Click Data Purge / Export',
    ],
  },
];

export const SUPER_ADMIN_USER: User = {
  id: 'usr-admin',
  name: 'SaaS Platform Admin',
  email: 'admin@serviflow.io',
  phone: '+91 90000 00000',
  role: 'super_admin',
  businessId: 'all',
  status: 'active',
  approvalStatus: 'active',
};

// No hardcoded sample tenant data - All tenant data is dynamically fetched from Firestore
export const DEMO_BUSINESSES: Business[] = [];
export const DEMO_USERS: User[] = [SUPER_ADMIN_USER];
export const DEMO_CUSTOMERS: Customer[] = [];
export const DEMO_CATEGORIES: ServiceCategory[] = [];
export const DEMO_SERVICES: Service[] = [];
export const DEMO_JOBS: Job[] = [];
export const DEMO_INVENTORY: InventoryItem[] = [];
export const DEMO_QUOTATIONS: Quotation[] = [];
export const DEMO_INVOICES: Invoice[] = [];
export const DEMO_PAYMENTS: Payment[] = [];
export const DEMO_CONTRACTS: RecurringContract[] = [];
export const DEMO_EXPENSES: Expense[] = [];
export const DEMO_NOTIFICATIONS: Notification[] = [];
export const DEMO_ACTIVITIES: ActivityLog[] = [];
export const DEMO_REFERRALS: ReferralRecord[] = [];
export const DEMO_REFERRAL_PAYOUTS: ReferralPayoutRequest[] = [];

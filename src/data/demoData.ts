import {
  Business,
  User,
  Role,
  Plan,
  Customer,
  Enquiry,
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
      canManageEnquiries: true,
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
      canManageEnquiries: true,
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
    description: 'Manages field dispatch, customer enquiries, inventory stock, invoices, and team dispatch',
    isSystemRole: true,
    permissions: {
      canManageEnquiries: true,
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
      canManageEnquiries: false,
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

import { PLANS } from '../utils/planUtils';

export const DEMO_PLANS: Plan[] = PLANS;

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
export const DEMO_ENQUIRIES: Enquiry[] = [];
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

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
    price: 999,
    billingCycle: 'monthly',
    maxJobs: 50,
    maxStaff: 2,
    maxCustomers: 100,
    features: ['Basic Customer CRM', 'Job Management', 'Direct WhatsApp Billing', 'Mobile Technician App'],
  },
  {
    id: 'plan-pro',
    name: 'Professional',
    price: 2499,
    billingCycle: 'monthly',
    maxJobs: 300,
    maxStaff: 10,
    maxCustomers: 1000,
    features: ['Everything in Starter', 'Inventory Tracking', 'Quotations & Invoices', 'Payment Collections', 'Staff Tracking & Analytics'],
  },
  {
    id: 'plan-biz',
    name: 'Business',
    price: 4999,
    billingCycle: 'monthly',
    maxJobs: 9999,
    maxStaff: 50,
    maxCustomers: 9999,
    features: ['Everything in Professional', 'Recurring Contracts / AMC', 'AI Assistant Insights', 'Customer Portal', 'Custom Branding'],
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

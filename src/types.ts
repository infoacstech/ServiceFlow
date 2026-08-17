export type UserRole = 'super_admin' | 'business_owner' | 'manager' | 'technician';

export interface RolePermission {
  canManageJobs: boolean;
  canViewFinancials: boolean; // Invoices, Quotations, Payments, Expenses
  canManageStaff: boolean;
  canManageInventory: boolean;
  canAccessSettings: boolean;
  canAccessSuperAdmin: boolean;
  canAccessCustomerPortal: boolean;
  canManageServices: boolean;
  canManageContracts: boolean;
}

export interface Role {
  id: string;
  name: string;
  code: UserRole;
  description: string;
  isSystemRole?: boolean;
  permissions: RolePermission;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  businessId: string; // Tenant ID ('all' for super_admin)
  avatar?: string;
  skills?: string[];
  joiningDate?: string;
  status: 'active' | 'inactive' | 'on_leave';
  approvalStatus?: 'active' | 'pending' | 'rejected' | 'blocked' | 'suspended';
  password?: string;
  requestedDate?: string;
}

export interface Business {
  id: string;
  name: string;
  type: string; // e.g. "CCTV & Security", "Solar", "AC Service", "Electrical", "Plumbing", "Computer Repair", "Cleaning", etc.
  logo?: string;
  mobile: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pin: string;
  gstNumber?: string;
  currency: string; // Default '₹' or '$', '€', '£', etc.
  createdAt: string;
  planId: string;
  status: 'active' | 'suspended' | 'pending' | 'rejected' | 'trial';
}

export interface Plan {
  id: string;
  name: 'Starter' | 'Professional' | 'Business';
  price: number;
  billingCycle: 'monthly' | 'yearly';
  maxJobs: number;
  maxStaff: number;
  maxCustomers: number;
  features: string[];
}

export interface Subscription {
  id: string;
  businessId: string;
  planId: string;
  status: 'active' | 'past_due' | 'canceled' | 'trialing';
  startDate: string;
  endDate: string;
  autoRenew: boolean;
}

export interface Customer {
  id: string;
  businessId: string;
  name: string;
  companyName?: string;
  mobile: string;
  whatsapp?: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  pin: string;
  gstNumber?: string;
  notes?: string;
  customerType: 'individual' | 'commercial';
  createdAt: string;
}

export interface ServiceCategory {
  id: string;
  businessId: string;
  name: string;
  description?: string;
}

export interface Service {
  id: string;
  businessId: string;
  categoryId: string;
  name: string;
  price: number;
  taxPercent: number;
  estimatedMinutes: number;
  description: string;
}

export type JobStatus =
  | 'new'
  | 'assigned'
  | 'accepted'
  | 'on_the_way'
  | 'started'
  | 'in_progress'
  | 'completed'
  | 'verified'
  | 'closed'
  | 'cancelled';

export type JobPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface JobMaterialUsed {
  inventoryItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface Job {
  id: string;
  businessId: string;
  jobId: string; // e.g., "JOB-1024"
  customerId: string;
  serviceId: string;
  description: string;
  priority: JobPriority;
  assignedStaffId?: string;
  scheduledDate: string;
  scheduledTime: string;
  scheduledTimeSlot?: string;
  location: string;
  estimatedAmount: number;
  status: JobStatus;
  notes?: string;
  beforePhotos?: string[];
  afterPhotos?: string[];
  startTime?: string;
  completionTime?: string;
  problemFound?: string;
  solutionProvided?: string;
  customerSignature?: string;
  customerRating?: number; // 1-5
  customerFeedback?: string;
  materialsUsed?: JobMaterialUsed[];
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  businessId: string;
  name: string;
  category: string;
  sku: string;
  purchasePrice: number;
  sellingPrice: number;
  currentStock: number;
  minStock: number;
  unit: string; // e.g. Pcs, Mtr, Box, Kg, Set
  supplier?: string;
}

export interface InventoryTransaction {
  id: string;
  businessId: string;
  inventoryItemId: string;
  type: 'stock_in' | 'stock_out' | 'job_use' | 'return' | 'adjustment';
  quantity: number;
  referenceId?: string;
  notes?: string;
  date: string;
  createdBy: string;
}

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  taxPercent: number;
  amount: number;
}

export type QuotationStatus = 'draft' | 'sent' | 'viewed' | 'approved' | 'rejected' | 'expired';

export interface Quotation {
  id: string;
  businessId: string;
  quotationNumber: string; // e.g. QT-2026-001
  customerId: string;
  date: string;
  validUntil: string;
  status: QuotationStatus;
  items: LineItem[];
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  grandTotal: number;
  notes?: string;
  terms?: string;
}

export type InvoiceStatus = 'paid' | 'partial' | 'pending' | 'overdue';

export interface Invoice {
  id: string;
  businessId: string;
  invoiceNumber: string; // e.g. INV-2026-102
  quotationId?: string;
  jobId?: string;
  customerId: string;
  date: string;
  dueDate: string;
  status: InvoiceStatus;
  items: LineItem[];
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  grandTotal: number;
  paidAmount: number;
  balanceAmount: number;
  notes?: string;
}

export type PaymentMethod = 'cash' | 'upi' | 'bank_transfer' | 'card' | 'cheque' | 'other';

export interface Payment {
  id: string;
  businessId: string;
  invoiceId: string;
  customerId: string;
  amount: number;
  date: string;
  method: PaymentMethod;
  referenceNumber?: string;
  notes?: string;
}

export type VisitFrequency = 'monthly' | 'quarterly' | 'bi_annual' | 'annual';

export interface RecurringContract {
  id: string;
  businessId: string;
  contractNumber: string; // e.g. AMC-2026-04
  customerId: string;
  serviceId: string;
  name: string;
  startDate: string;
  endDate: string;
  contractAmount: number;
  visitFrequency: VisitFrequency;
  visitsAllowed: number;
  visitsUsed: number;
  visitsRemaining: number;
  renewalDate: string;
  status: 'active' | 'expiring_soon' | 'expired' | 'cancelled';
}

export type ExpenseCategory =
  | 'travel'
  | 'fuel'
  | 'material'
  | 'salary'
  | 'office'
  | 'marketing'
  | 'other';

export interface Expense {
  id: string;
  businessId: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  description: string;
  paymentMethod: PaymentMethod;
  receiptUrl?: string;
}

export interface Notification {
  id: string;
  businessId: string;
  title: string;
  message: string;
  type: 'job' | 'payment' | 'inventory' | 'contract' | 'system';
  read: boolean;
  createdAt: string;
  targetRoleId?: UserRole;
  targetUserId?: string;
  jobId?: string;
  jobTitle?: string;
  jobLocation?: string;
  customerName?: string;
  customerPhone?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  priority?: JobPriority;
  actionType?: 'assigned' | 'accepted' | 'started' | 'completed' | 'general';
}

export interface ActivityLog {
  id: string;
  businessId: string;
  action: string;
  entityType: 'customer' | 'job' | 'invoice' | 'quotation' | 'payment' | 'inventory' | 'contract' | 'staff' | 'settings';
  entityId: string;
  description: string;
  timestamp: string;
  userName: string;
}

export interface OfflineSyncItem {
  id: string;
  action: 'update_job_status' | 'start_job' | 'complete_job' | 'update_job';
  jobId: string;
  timestamp: string;
  payload: any;
  description: string;
}

export interface ManualSyncItemDetail {
  jobId: string;
  description: string;
  action: string;
  timestamp: string;
}

export interface ManualSyncLog {
  id: string;
  timestamp: string;
  technicianName: string;
  status: 'SUCCESS' | 'FAILED' | 'NO_CHANGES' | 'OFFLINE_QUEUED';
  itemsProcessedCount: number;
  triggerType: 'MANUAL_BUTTON' | 'AUTO_RECONNECT' | 'FORCED_REFRESH';
  details: string;
  itemsSynced?: ManualSyncItemDetail[];
  networkLatencyMs?: number;
}

export interface SupportSession {
  id: string;
  superAdminId: string;
  superAdminName: string;
  superAdminEmail: string;
  targetBusinessId: string;
  targetBusinessName: string;
  reason: string;
  accessMode: 'read_only' | 'full_support';
  startTime: string; // ISO string
  expiryTime: string; // ISO string
  durationMinutes: number;
  status: 'active' | 'expired' | 'revoked';
  actionsPerformedCount: number;
}

export interface SystemSettings {
  id: string;
  maintenanceMode: boolean;
  allowNewRegistrations: boolean;
  defaultTrialDays: number;
  globalNoticeBanner: string;
  isNoticeActive: boolean;
  mfaEnforcement: 'optional' | 'required_super_admin' | 'required_all';
  minPasswordLength: number;
  sessionTimeoutMinutes: number;
  notificationTemplates: {
    jobAssigned: string;
    invoiceGenerated: string;
    paymentReceipt: string;
    welcomeMessage: string;
  };
}

export interface SecurityAuditLog {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  category: 'AUTH' | 'TENANT_ACCESS' | 'PERMISSION' | 'SUBSCRIPTION' | 'SETTINGS' | 'SUPPORT_SESSION' | 'SECURITY_POLICY';
  targetBusinessId?: string;
  targetBusinessName?: string;
  details: string;
  ipAddress?: string;
}



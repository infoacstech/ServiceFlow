export type UserRole = 'super_admin' | 'business_owner' | 'manager' | 'technician';

export interface RolePermission {
  canManageEnquiries?: boolean;
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
  referralCode?: string;
  employeeCode?: string; // e.g. EMP-0001
}

export interface Business {
  id: string;
  name: string;
  type: string; // e.g. "CCTV & Security Systems", "Other / Custom Service", or custom category
  serviceDomain?: string; // e.g. "Other / Custom Service" or "CCTV & Security Systems"
  customServiceName?: string | null; // e.g. "Home Appliance Repair" or null for predefined
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
  plan?: string;
  status: 'active' | 'suspended' | 'pending' | 'rejected' | 'trial';
  referralCode?: string; // Unique business referral code (e.g. SF-APEX10)
  referredBy?: string; // Code of the referrer who invited this business
  referralDiscountApplied?: boolean; // True if got 10% discount on registration
  referralEarnings?: number; // Total ₹ bonus earned from referring others (10% per referee)
  referralBalance?: number; // Available ₹ balance to redeem or use for renewals
  attendanceWorkingRules?: AttendanceWorkingRules;
  attendanceLocations?: AttendanceLocation[];
}

export interface Plan {
  id: string;
  name: 'Starter' | 'Professional' | 'Business';
  price: number; // Monthly price in INR
  yearlyPrice?: number; // Annual discounted price in INR
  billingCycle: 'monthly' | 'yearly';
  maxJobs: number;
  maxStaff: number;
  maxCustomers: number;
  features: string[];
  popular?: boolean;
  targetAudience?: string;
  badge?: string;
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
  isArchived?: boolean;
  archivedAt?: string;
  createdAt: string;
}

export type EnquiryStatus =
  | 'new'
  | 'contacted'
  | 'follow_up'
  | 'qualified'
  | 'quoted'
  | 'converted'
  | 'closed'
  | 'lost';

export type EnquiryPriority = 'low' | 'normal' | 'medium' | 'high' | 'urgent';

export type EnquirySource =
  | 'phone'
  | 'whatsapp'
  | 'walk_in'
  | 'website'
  | 'referral'
  | 'existing_customer'
  | 'google'
  | 'social_media'
  | 'other';

export interface EnquiryFollowUp {
  id: string;
  date: string;
  time?: string;
  channel?: 'phone' | 'whatsapp' | 'email' | 'visit' | 'other' | string;
  notes: string;
  outcome?: string;
  completed: boolean;
  createdAt: string;
  createdBy?: string;
  actorName?: string;
}

export interface EnquiryActivity {
  id: string;
  timestamp: string;
  action: string;
  actorName: string;
  details: string;
}

export interface Enquiry {
  id: string;
  businessId: string;
  enquiryId: string; // e.g. "ENQ-1001"
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerPhoneAlt?: string;
  customerEmail?: string;
  companyName?: string;
  serviceRequired: string;
  serviceId?: string;
  description: string;
  location?: string;
  address?: string;
  preferredDate?: string;
  preferredTimeSlot?: string;
  source: EnquirySource;
  priority: EnquiryPriority;
  assignedStaffId?: string;
  assignedStaffName?: string;
  enquiryDate?: string;
  createdAt: string;
  followUpDate?: string;
  followUpTime?: string;
  followUps?: EnquiryFollowUp[];
  notes?: string;
  status: EnquiryStatus;
  estimatedValue?: number;
  convertedJobId?: string;
  convertedJobNumber?: string;
  convertedQuotationId?: string;
  convertedQuotationNumber?: string;
  lostReason?: string;
  lostNotes?: string;
  activityHistory?: EnquiryActivity[];
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
  | 'scheduled'
  | 'on_the_way'
  | 'started'
  | 'in_progress'
  | 'on_hold'
  | 'completed'
  | 'verified'
  | 'closed'
  | 'cancelled';

export type JobPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface JobActivityItem {
  id: string;
  timestamp: string;
  action: string;
  actorName: string;
  actorRole?: string;
  details: string;
  status?: JobStatus;
  fromStatus?: JobStatus;
  toStatus?: JobStatus;
  reason?: string;
}

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
  relatedEnquiryId?: string;
  serviceId: string;
  description: string;
  priority: JobPriority;
  assignedStaffId?: string;
  assignedStaffName?: string;
  scheduledDate: string;
  scheduledTime: string;
  scheduledTimeSlot?: string;
  location: string;
  estimatedAmount: number;
  status: JobStatus;
  source?: 'manual' | 'customer_portal' | 'crm' | 'amc_auto_scheduler';
  contractId?: string;
  contractNumber?: string;
  amcVisitNumber?: number;
  notes?: string;
  completionNotes?: string;
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
  activityHistory?: JobActivityItem[];
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
  enquiryId?: string;
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
  nextVisitDate?: string;
  lastVisitDate?: string;
  assignedTechnicianId?: string;
  equipmentDetails?: string;
  notes?: string;
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
  type: 'job' | 'payment' | 'inventory' | 'contract' | 'system' | 'broadcast';
  read: boolean;
  createdAt: string;
  senderUserId?: string;
  senderRoleId?: UserRole | 'customer';
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
  actionType?: 'assigned' | 'accepted' | 'started' | 'completed' | 'general' | 'attendance_issue' | 'attendance_resolution' | 'customer_request';
  broadcastSeverity?: 'info' | 'warning' | 'critical' | 'success';
  authorName?: string;
}

export interface ActivityLog {
  id: string;
  businessId: string;
  action: string;
  entityType: 'enquiry' | 'customer' | 'job' | 'invoice' | 'quotation' | 'payment' | 'inventory' | 'contract' | 'staff' | 'settings' | 'financials';
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
  noticeSeverity?: 'info' | 'warning' | 'critical' | 'success';
  noticeTitle?: string;
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

export interface ReferralRecord {
  id: string;
  referrerBusinessId: string;
  referrerUserId?: string;
  referrerCode: string;
  referrerBusinessName: string;
  referredBusinessId: string;
  referredBusinessName: string;
  referredOwnerName: string;
  referredOwnerPhone?: string;
  planId: string;
  planName: string;
  planPrice: number;
  discountPercent: number; // 10%
  discountAmount: number; // In ₹ (10% of plan price)
  bonusPercent: number; // 10%
  bonusEarned: number; // In ₹ (10% bonus credited to referrer)
  bonusAmount?: number; // Alias for bonusEarned
  status: 'credited' | 'redeemed' | 'pending';
  createdAt: string;
  notes?: string;
}

export interface ReferralPayoutRequest {
  id: string;
  businessId: string;
  businessName: string;
  userName?: string;
  userPhone?: string;
  ownerName?: string;
  ownerPhone?: string;
  amount: number;
  payoutMethod: 'upi' | 'bank_transfer' | 'subscription_credit';
  upiId?: string;
  bankAccount?: {
    accountNumber: string;
    ifsc: string;
    holderName: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  requestedAt: string;
  processedAt?: string;
  notes?: string;
}

// ==========================================
// ATTENDANCE & GPS VERIFICATION DATA TYPES
// ==========================================

export type AttendanceStatus =
  | 'present'
  | 'late'
  | 'half_day'
  | 'absent'
  | 'leave'
  | 'holiday'
  | 'weekly_off';

export type AttendanceWorkingState = 'not_checked_in' | 'working' | 'completed';

export type AttendanceVerificationStatus =
  | 'verified'
  | 'failed'
  | 'accuracy_issue'
  | 'permission_denied'
  | 'manual_correction';

export type AttendanceLocationType = 'office' | 'branch' | 'field_job' | 'remote' | 'warehouse';

export interface AttendanceLocation {
  id: string;
  businessId: string;
  name: string;
  type: AttendanceLocationType;
  address: string;
  city?: string;
  state?: string;
  pincode?: string;
  latitude: number;
  longitude: number;
  radiusMeters: number; // e.g. 150m (allowed radius)
  isDefault?: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AttendanceWorkingRules {
  workStartTime: string; // "09:30"
  workEndTime: string; // "18:30"
  gracePeriodMinutes: number; // 15
  lateThresholdMinutes: number; // 15 (after grace period)
  halfDayThresholdMinutes: number; // 240 (4 hours)
  minimumWorkingHours: number; // 8
  allowFieldJobCheckIn: boolean; // Field technician can check in at assigned customer job site
  requireGPSVerification: boolean; // Enforce GPS verification
  maxAllowedGpsAccuracyMeters: number; // 100
  weeklyOffDays: number[]; // [0] = Sunday
}

export interface AttendanceAuditItem {
  id: string;
  attendanceId: string;
  businessId: string;
  eventType:
    | 'check_in'
    | 'check_out'
    | 'manual_correction'
    | 'location_verified'
    | 'location_failed'
    | 'status_override'
    | 'leave_marked'
    | 'location_config_changed';
  timestamp: string;
  userId: string;
  userName: string;
  userRole?: string;
  details: string;
  coordinates?: {
    lat: number;
    lng: number;
    accuracy?: number;
    distance?: number;
    targetLocationName?: string;
  };
  ipOrDevice?: string;
}

export type AttendanceIssueType =
  | 'wrong_check_in'
  | 'wrong_check_out'
  | 'wrong_status'
  | 'gps_issue'
  | 'missed_check_in_out'
  | 'duration_incorrect'
  | 'leave_adjustment'
  | 'other';

export interface AttendanceIssue {
  id: string;
  businessId: string;
  attendanceId?: string;
  staffId: string;
  staffName: string;
  staffEmployeeCode?: string;
  staffEmail?: string;
  staffPhone?: string;
  staffRole?: UserRole;
  date: string; // YYYY-MM-DD
  issueType: AttendanceIssueType;
  description: string;
  suggestedCheckInTime?: string;
  suggestedCheckOutTime?: string;
  suggestedStatus?: AttendanceStatus;
  status: 'pending' | 'resolved' | 'rejected';
  resolutionNotes?: string;
  resolvedBy?: string;
  resolvedByName?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AttendanceRecord {
  id: string;
  businessId: string;
  staffId: string;
  staffName: string;
  staffEmployeeCode?: string;
  staffRole?: UserRole;
  staffAvatar?: string;
  staffEmail?: string;
  staffPhone?: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  workingState: AttendanceWorkingState;

  // Check-In Details
  checkInTime?: string; // HH:mm or formatted
  checkInTimestamp?: number; // Epoch ms
  checkInLat?: number;
  checkInLng?: number;
  checkInAccuracy?: number; // in meters
  checkInVerificationStatus?: AttendanceVerificationStatus;
  checkInLocationName?: string;
  checkInDistance?: number; // in meters from permitted site
  checkInType?: AttendanceLocationType;
  checkInJobId?: string;
  checkInJobCode?: string;
  checkInNotes?: string;
  checkInAddress?: string;

  // Check-Out Details
  checkOutTime?: string;
  checkOutTimestamp?: number;
  checkOutLat?: number;
  checkOutLng?: number;
  checkOutAccuracy?: number;
  checkOutVerificationStatus?: AttendanceVerificationStatus;
  checkOutLocationName?: string;
  checkOutDistance?: number;
  checkOutType?: AttendanceLocationType;
  checkOutJobId?: string;
  checkOutJobCode?: string;
  checkOutNotes?: string;
  checkOutAddress?: string;

  // Working Time & Metric Calculations
  workingDurationMinutes?: number;
  workingDurationFormatted?: string;
  isLate?: boolean;
  lateMinutes?: number;
  isEarlyDeparture?: boolean;
  isHalfDay?: boolean;

  // Verification Summary
  overallVerificationStatus?: AttendanceVerificationStatus;

  // Manual Corrections & History
  manualCorrection?: {
    correctedBy: string;
    correctedByName: string;
    correctedAt: string;
    reason: string;
    previousRecord: {
      status?: AttendanceStatus;
      checkInTime?: string;
      checkOutTime?: string;
      workingDurationMinutes?: number;
    };
    changesDescription: string;
  };

  // Immutable Audit Trail
  auditTrail: AttendanceAuditItem[];

  createdAt: string;
  updatedAt: string;
}


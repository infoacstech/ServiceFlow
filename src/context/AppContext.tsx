import React, { createContext, useContext, useState, useEffect } from 'react';
import type {
  Business,
  User,
  UserRole,
  Role,
  RolePermission,
  Enquiry,
  EnquiryFollowUp,
  EnquiryActivity,
  Customer,
  ServiceCategory,
  Service,
  Job,
  JobStatus,
  JobPriority,
  InventoryItem,
  InventoryTransaction,
  Quotation,
  LineItem,
  Invoice,
  Payment,
  RecurringContract,
  Expense,
  Notification,
  ActivityLog,
  Plan,
  JobMaterialUsed,
  JobActivityItem,
  OfflineSyncItem,
  ManualSyncLog,
  SupportSession,
  SystemSettings,
  SecurityAuditLog,
  ReferralRecord,
  ReferralPayoutRequest,
  AttendanceRecord,
  AttendanceLocation,
  AttendanceWorkingRules,
  AttendanceAuditItem,
  AttendanceStatus,
  AttendanceLocationType,
  AttendanceVerificationStatus,
} from '../types';
import {
  getCurrentGpsPosition,
  verifyLocationAgainstRules,
  evaluatePunctuality,
  formatWorkingDuration,
  formatDistance,
  DEFAULT_ATTENDANCE_RULES,
} from '../utils/geolocation';
import {
  DEMO_BUSINESSES,
  DEMO_USERS,
  DEMO_ENQUIRIES,
  DEMO_CUSTOMERS,
  DEMO_CATEGORIES,
  DEMO_SERVICES,
  DEMO_JOBS,
  DEMO_INVENTORY,
  DEMO_QUOTATIONS,
  DEMO_INVOICES,
  DEMO_PAYMENTS,
  DEMO_CONTRACTS,
  DEMO_EXPENSES,
  DEMO_NOTIFICATIONS,
  DEMO_ACTIVITIES,
  DEMO_PLANS,
  DEMO_ROLES,
  SUPER_ADMIN_USER,
  DEMO_REFERRALS,
  DEMO_REFERRAL_PAYOUTS,
} from '../data/demoData';
import { checkStaffCapacity, checkMonthlyJobCapacity, getPlanById } from '../utils/planUtils';
import { auth, db, handleFirestoreError, OperationType, cleanFirestoreData } from '../lib/firebase';
import { AuthService } from '../services/AuthService';
import {
  updatePassword as firebaseUpdatePassword,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { FirestoreService, firestoreService } from '../services/FirestoreService';
import { validateJobStatusTransition, getJobStatusLabel } from '../utils/jobWorkflow';
import {
  playJobVoiceNotification,
  playJobCompletedVoiceNotification,
  playJobStatusVoiceNotification,
  playCustomVoiceNotification,
  sendBackgroundSystemNotification,
  requestBrowserNotificationPermission,
} from '../utils/audioNotification';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import {
  isBusinessOwnerOrAdmin,
  isManagerRole,
  isStaffOrTechnician,
  canCreateRecord,
  canUpdateRecord,
  canDeleteRecord,
  canManageStaffMembers,
  canManageBusinessSettings,
  validateTenantIsolation,
} from '../utils/rbac';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextType {
  // Active tenant & user state
  currentBusiness: Business;
  setCurrentBusiness: (b: Business) => void;
  businesses: Business[];
  users: User[];
  currentUser: User | null;
  setCurrentUser: (u: User | null) => void;
  isAuthInitializing: boolean;
  loginUser: (u: User, password?: string) => Promise<User>;
  logoutUser: () => Promise<void>;
  switchRole: (role: UserRole) => Promise<void>;
  switchBusiness: (businessId: string) => void;
  createBusiness: (
    bData: Partial<Business>,
    serviceCategoryName?: string,
    isPending?: boolean,
    ownerData?: { name?: string; email?: string; phone?: string; password?: string }
  ) => Business;
  updateUserStatus: (userId: string, status: 'active' | 'pending' | 'rejected' | 'blocked' | 'suspended') => void;
  updateBusinessAndOwnerStatus: (businessId: string, newStatus: 'active' | 'pending' | 'rejected' | 'suspended') => void;
  updateUserPassword: (userId: string, newPass: string) => Promise<void>;
  updateUserProfile: (userId: string, updates: Partial<User>) => Promise<void>;
  registerUser: (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: UserRole;
    businessId?: string;
    businessName?: string;
    businessType?: string;
    serviceDomain?: string;
    customServiceName?: string | null;
    referralCode?: string;
  }) => Promise<{ user: User; isPending: boolean }>;

  // Referral Bonus System
  referralRecords: ReferralRecord[];
  referralPayoutRequests: ReferralPayoutRequest[];
  validateReferralCode: (code: string) => {
    isValid: boolean;
    referrerBusiness?: Business;
    referrerUser?: User;
    discountPercent: number;
    bonusPercent: number;
    message: string;
  };
  requestReferralPayout: (params: {
    amount: number;
    payoutMethod: 'upi' | 'bank_transfer' | 'subscription_credit';
    upiId?: string;
    bankAccount?: {
      accountNumber: string;
      ifsc: string;
      holderName: string;
    };
    notes?: string;
  }) => Promise<ReferralPayoutRequest>;
  processReferralPayout: (
    requestId: string,
    newStatus: 'approved' | 'rejected' | 'completed',
    notes?: string
  ) => void;
  createManualReferralLink: (params: {
    referrerBusinessId: string;
    referredBusinessId: string;
    bonusAmount?: number;
    discountAmount?: number;
    notes?: string;
  }) => Promise<ReferralRecord>;
  deleteReferralRecord: (referralId: string) => Promise<void>;
  settleReferralBonusDirectly: (params: {
    businessId: string;
    amount: number;
    payoutMethod: 'upi' | 'bank_transfer' | 'subscription_credit';
    upiId?: string;
    bankAccount?: {
      accountNumber: string;
      ifsc: string;
      holderName: string;
    };
    transactionReference?: string;
    notes?: string;
  }) => Promise<ReferralPayoutRequest>;

  // Data collections (filtered by current business when applicable)
  enquiries: Enquiry[];
  customers: Customer[];
  categories: ServiceCategory[];
  services: Service[];
  jobs: Job[];
  inventory: InventoryItem[];
  inventoryTransactions: InventoryTransaction[];
  quotations: Quotation[];
  invoices: Invoice[];
  payments: Payment[];
  contracts: RecurringContract[];
  expenses: Expense[];
  notifications: Notification[];
  activityLogs: ActivityLog[];
  staff: User[];
  plans: Plan[];
  roles: Role[];
  getRolePermissions: (role: UserRole) => RolePermission;

  // Global UI & search state
  isSearchOpen: boolean;
  setIsSearchOpen: (v: boolean) => void;
  isActivityLogOpen: boolean;
  setIsActivityLogOpen: (v: boolean) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (v: boolean) => void;
  isProfileDrawerOpen: boolean;
  setIsProfileDrawerOpen: (v: boolean) => void;
  isInstallModalOpen: boolean;
  setIsInstallModalOpen: (v: boolean) => void;
  toasts: ToastMessage[];
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  dismissToast: (id: string) => void;
  resetDemoData: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  logActivity: (action: string, entityType: ActivityLog['entityType'], entityId: string, description: string) => void;

  firestoreService: typeof FirestoreService;

  // Actions
  addEnquiry: (enq: Omit<Enquiry, 'id' | 'businessId' | 'enquiryId' | 'createdAt'>) => Enquiry;
  updateEnquiry: (id: string, updates: Partial<Enquiry>) => void;
  deleteEnquiry: (id: string) => void;
  convertEnquiryToJob: (enquiryId: string, jobData?: Partial<Job>) => Promise<Job>;
  convertEnquiryToQuote: (
    enquiryId: string,
    quoteData: {
      items: LineItem[];
      validUntil?: string;
      notes?: string;
      terms?: string;
    }
  ) => Promise<Quotation>;
  addEnquiryFollowUp: (enquiryId: string, followUp: Omit<EnquiryFollowUp, 'id' | 'createdAt'>) => void;
  linkCustomerToEnquiry: (enquiryId: string, customerId: string) => void;
  createAndLinkCustomerFromEnquiry: (enquiryId: string, customerOverrides?: Partial<Customer>) => Customer;
  markEnquiryQualified: (enquiryId: string, notes?: string) => void;
  markEnquiryLost: (enquiryId: string, reason: string, notes?: string) => void;
  addEnquiryActivity: (enquiryId: string, action: string, details: string) => void;

  addCustomer: (c: Omit<Customer, 'id' | 'businessId' | 'createdAt'>) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => Promise<{ success: boolean; message: string; blockedByRecords?: boolean }>;
  archiveCustomer: (id: string) => Promise<{ success: boolean; message: string }>;
  unarchiveCustomer: (id: string) => Promise<{ success: boolean; message: string }>;

  addService: (s: Omit<Service, 'id' | 'businessId'>) => void;
  updateService: (id: string, updates: Partial<Service>) => void;
  deleteService: (id: string) => void;

  addServiceCategory: (name: string, description?: string) => ServiceCategory;

  addJob: (j: Omit<Job, 'id' | 'businessId' | 'jobId' | 'createdAt'>, options?: { silentToast?: boolean }) => Job;
  updateJob: (id: string, updates: Partial<Job>) => void;
  updateJobStatus: (id: string, status: JobStatus, reason?: string) => void;
  deleteJob: (id: string) => void;
  startJob: (id: string, beforePhotos: string[], notes?: string) => void;
  completeJob: (
    id: string,
    data: {
      problemFound: string;
      solutionProvided: string;
      beforePhotos?: string[];
      afterPhotos: string[];
      customerSignature?: string;
      customerRating?: number;
      customerFeedback?: string;
      materialsUsed?: JobMaterialUsed[];
    }
  ) => void;

  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'businessId'>) => void;
  updateInventoryStock: (
    id: string,
    qty: number,
    type: 'stock_in' | 'stock_out' | 'adjustment',
    notes?: string
  ) => void;

  addQuotation: (q: Omit<Quotation, 'id' | 'businessId' | 'quotationNumber'>, options?: { silentToast?: boolean }) => Quotation;
  updateQuotationStatus: (id: string, status: Quotation['status']) => void;
  convertQuotationToInvoice: (quotationId: string) => Invoice;

  addInvoice: (inv: Omit<Invoice, 'id' | 'businessId' | 'invoiceNumber'>) => Invoice;
  deleteInvoice: (id: string) => void;
  recordPayment: (p: Omit<Payment, 'id' | 'businessId'>) => Payment;

  addContract: (c: Omit<RecurringContract, 'id' | 'businessId' | 'contractNumber'>) => RecurringContract;
  addExpense: (e: Omit<Expense, 'id' | 'businessId'>) => void;
  addStaff: (st: Omit<User, 'id' | 'businessId'>) => Promise<User | undefined>;
  deleteStaff: (userId: string) => void;
  updateBusinessSettings: (updates: Partial<Business>) => void;
  updateBusinessProfile: (updates: Partial<Business>) => void;

  markNotificationRead: (id: string) => void;
  activeJobPopup: Notification | null;
  dismissJobPopup: () => void;
  triggerJobPopupAlert: (notification: Notification) => void;

  // Offline Sync Capabilities
  isOffline: boolean;
  isSimulatedOffline: boolean;
  pendingSyncQueue: OfflineSyncItem[];
  syncOfflineQueue: (showToastNotification?: boolean) => void;
  toggleSimulateOffline: () => void;
  manualSyncLogs: ManualSyncLog[];
  triggerManualSync: (
    triggerType?: 'MANUAL_BUTTON' | 'AUTO_RECONNECT' | 'FORCED_REFRESH',
    showToastNotification?: boolean
  ) => void;
  clearSyncLogs: () => void;

  // Super Admin Support Access & Security Engine
  supportSessions: SupportSession[];
  activeSupportSession: SupportSession | null;
  startSupportSession: (
    targetBusinessId: string,
    reason: string,
    durationMinutes?: number,
    accessMode?: 'read_only' | 'full_support'
  ) => void;
  endSupportSession: (reason?: string) => void;

  systemSettings: SystemSettings;
  updateSystemSettings: (updates: Partial<SystemSettings>) => void;
  sendBroadcastNotification: (params: {
    title: string;
    message: string;
    targetRole?: UserRole | 'all';
    targetBusinessId?: string | 'all';
    severity?: 'info' | 'warning' | 'critical' | 'success';
  }) => Promise<void>;

  securityAuditLogs: SecurityAuditLog[];
  logSecurityEvent: (
    action: string,
    category: SecurityAuditLog['category'],
    details: string,
    targetBusinessId?: string,
    targetBusinessName?: string
  ) => void;

  revokeUserSession: (userId: string) => void;
  forcePasswordReset: (userId: string) => void;

  // Safe Clean State Testing Data Purge
  purgeAllTransactionalData: () => Promise<{ clearedCollections: string[]; totalDocsDeleted: number }>;
  purgeTenantTransactionalData: (businessId?: string) => Promise<{ clearedCollections: string[]; totalDocsDeleted: number }>;
  wipeAllExceptSuperAdmin: () => Promise<{ clearedCollections: string[]; totalDocsDeleted: number }>;
  cleanupOrphanUsers: () => Promise<number>;

  // Tenant and User Deletion
  deleteBusinessTenant: (businessId: string) => Promise<void>;
  deleteUserAccount: (userId: string) => Promise<void>;

  // Attendance & GPS Verification Module
  attendanceRecords: AttendanceRecord[];
  attendanceLocations: AttendanceLocation[];
  attendanceWorkingRules: AttendanceWorkingRules;
  attendanceAuditLogs: AttendanceAuditItem[];
  checkInAttendance: (params: {
    staffId?: string;
    targetType: AttendanceLocationType;
    targetLocationIdOrJobId?: string;
    notes?: string;
    bypassGps?: boolean;
    overrideCoords?: { lat: number; lng: number };
  }) => Promise<{ success: boolean; message: string; record?: AttendanceRecord; errorType?: string }>;
  checkOutAttendance: (params: {
    staffId?: string;
    recordId?: string;
    targetType?: AttendanceLocationType;
    targetLocationIdOrJobId?: string;
    notes?: string;
    bypassGps?: boolean;
    overrideCoords?: { lat: number; lng: number };
  }) => Promise<{ success: boolean; message: string; record?: AttendanceRecord; errorType?: string }>;
  manualCorrectAttendance: (
    recordId: string,
    corrections: {
      status?: AttendanceStatus;
      checkInTime?: string;
      checkOutTime?: string;
      workingDurationMinutes?: number;
      notes?: string;
    },
    reason: string
  ) => Promise<{ success: boolean; message: string }>;
  markStaffLeaveOrHoliday: (
    staffId: string,
    date: string,
    type: 'leave' | 'holiday' | 'weekly_off',
    notes?: string
  ) => Promise<{ success: boolean; message: string }>;
  addAttendanceLocation: (loc: Omit<AttendanceLocation, 'id' | 'businessId'>) => Promise<AttendanceLocation>;
  updateAttendanceLocation: (id: string, updates: Partial<AttendanceLocation>) => Promise<void>;
  deleteAttendanceLocation: (id: string) => Promise<void>;
  updateAttendanceWorkingRules: (rules: Partial<AttendanceWorkingRules>) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('serviflow_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return 'light';
  });

  useEffect(() => {
    localStorage.setItem('serviflow_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Default System Settings for Super Admin Control
const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  id: 'global',
  maintenanceMode: false,
  allowNewRegistrations: true,
  defaultTrialDays: 14,
  globalNoticeBanner: 'ServiFlow Platform v2.4 Multi-Tenant Engine — All operational nodes green.',
  isNoticeActive: true,
  noticeSeverity: 'info',
  noticeTitle: 'Platform System Announcement',
  mfaEnforcement: 'required_super_admin',
  minPasswordLength: 8,
  sessionTimeoutMinutes: 60,
  notificationTemplates: {
    jobAssigned: 'New service task {{jobId}} has been assigned to you. Location: {{location}}.',
    invoiceGenerated: 'Invoice {{invoiceNumber}} for amount {{amount}} has been generated for your recent service.',
    paymentReceipt: 'Payment of {{amount}} received successfully for Invoice {{invoiceNumber}}.',
    welcomeMessage: 'Welcome to ServiFlow! Your business platform account is ready.',
  },
};

const DEMO_SECURITY_LOGS: SecurityAuditLog[] = [
  {
    id: 'sec-log-1',
    timestamp: new Date().toISOString(),
    actorId: 'usr-admin',
    actorName: 'SaaS Platform Admin',
    actorRole: 'super_admin',
    action: 'MFA_POLICY_ENFORCED',
    category: 'SECURITY_POLICY',
    details: 'Enforced MFA security policy for all Super Admin platform console accounts.',
  },
  {
    id: 'sec-log-2',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    actorId: 'usr-admin',
    actorName: 'SaaS Platform Admin',
    actorRole: 'super_admin',
    action: 'TENANT_APPROVAL',
    category: 'TENANT_ACCESS',
    targetBusinessId: 'biz-1',
    targetBusinessName: 'Apex Security & CCTV Systems',
    details: 'Approved Business Owner signup and activated tenant operational workspace.',
  },
];

// LocalStorage cache helpers for instant load & offline resiliency
const loadCache = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed !== undefined && parsed !== null) return parsed;
    }
  } catch (e) {
    console.warn(`Error loading cache for ${key}:`, e);
  }
  return fallback;
};

const saveCache = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn(`Error saving cache for ${key}:`, e);
  }
};

// Firestore helper wrappers
const saveToFirestore = async (colName: string, id: string, data: any) => {
  try {
    await setDoc(doc(db, colName, id), cleanFirestoreData(data), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${colName}/${id}`);
  }
};

const deleteFromFirestore = async (colName: string, id: string) => {
  try {
    await deleteDoc(doc(db, colName, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${colName}/${id}`);
  }
};

const DEFAULT_BLANK_BUSINESS: Business = {
  id: 'biz-default',
  name: 'ServiFlow Workspace',
  type: 'Field Service & Operations',
  mobile: '',
  whatsapp: '',
  email: '',
  address: '',
  city: '',
  state: '',
  pin: '',
  currency: '₹',
  createdAt: new Date().toISOString().split('T')[0],
  planId: 'plan-starter',
  status: 'active',
};

const AppContentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme, toggleTheme } = useTheme();

  // State arrays populated from cache and synchronized in real-time with Firestore
  const [businesses, setBusinesses] = useState<Business[]>(() =>
    loadCache('serviflow_businesses_cache', [])
  );
  const [currentBusiness, setCurrentBusiness] = useState<Business>(() =>
    loadCache('serviflow_current_biz_cache', DEFAULT_BLANK_BUSINESS)
  );

  const [users, setUsers] = useState<User[]>(() =>
    loadCache('serviflow_users_cache', [SUPER_ADMIN_USER])
  );
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const savedSession = localStorage.getItem('serviflow_user_session');
      if (savedSession) {
        return JSON.parse(savedSession) as User;
      }
    } catch (e) {
      console.warn('Could not parse stored session:', e);
    }
    return null;
  });
  const [isAuthInitializing, setIsAuthInitializing] = useState<boolean>(() => {
    try {
      return !localStorage.getItem('serviflow_user_session');
    } catch {
      return false;
    }
  });

  const [enquiries, setEnquiries] = useState<Enquiry[]>(() =>
    loadCache('serviflow_enquiries_cache', [])
  );
  const [customers, setCustomers] = useState<Customer[]>(() =>
    loadCache('serviflow_customers_cache', [])
  );
  const [categories, setCategories] = useState<ServiceCategory[]>(() =>
    loadCache('serviflow_categories_cache', [])
  );
  const [services, setServices] = useState<Service[]>(() =>
    loadCache('serviflow_services_cache', [])
  );
  const [jobs, setJobs] = useState<Job[]>(() =>
    loadCache('serviflow_jobs_cache', [])
  );
  const [inventory, setInventory] = useState<InventoryItem[]>(() =>
    loadCache('serviflow_inventory_cache', [])
  );
  const [inventoryTransactions, setInventoryTransactions] = useState<InventoryTransaction[]>(() =>
    loadCache('serviflow_inv_tx_cache', [])
  );
  const [quotations, setQuotations] = useState<Quotation[]>(() =>
    loadCache('serviflow_quotations_cache', [])
  );
  const [invoices, setInvoices] = useState<Invoice[]>(() =>
    loadCache('serviflow_invoices_cache', [])
  );
  const [payments, setPayments] = useState<Payment[]>(() =>
    loadCache('serviflow_payments_cache', [])
  );
  const [contracts, setContracts] = useState<RecurringContract[]>(() =>
    loadCache('serviflow_contracts_cache', [])
  );
  const [expenses, setExpenses] = useState<Expense[]>(() =>
    loadCache('serviflow_expenses_cache', [])
  );
  const [notifications, setNotifications] = useState<Notification[]>(() =>
    loadCache('serviflow_notifications_cache', [])
  );
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() =>
    loadCache('serviflow_activity_logs_cache', [])
  );
  const [roles, setRoles] = useState<Role[]>(() =>
    loadCache('serviflow_roles_cache', DEMO_ROLES)
  );

  // Attendance & GPS Verification States
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() =>
    loadCache('serviflow_attendance_cache', [])
  );
  const [attendanceLocations, setAttendanceLocations] = useState<AttendanceLocation[]>(() =>
    loadCache('serviflow_attendance_locations_cache', [])
  );
  const [attendanceAuditLogs, setAttendanceAuditLogs] = useState<AttendanceAuditItem[]>(() =>
    loadCache('serviflow_attendance_audit_cache', [])
  );

  // Referral Bonus States
  const [referralRecords, setReferralRecords] = useState<ReferralRecord[]>(() =>
    loadCache('serviflow_referrals_cache', DEMO_REFERRALS)
  );
  const [referralPayoutRequests, setReferralPayoutRequests] = useState<ReferralPayoutRequest[]>(() =>
    loadCache('serviflow_ref_payouts_cache', DEMO_REFERRAL_PAYOUTS)
  );

  // Super Admin Support Access & Security States
  const [supportSessions, setSupportSessions] = useState<SupportSession[]>(() =>
    loadCache('serviflow_support_sessions_cache', [])
  );
  const [activeSupportSession, setActiveSupportSession] = useState<SupportSession | null>(null);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(() =>
    loadCache('serviflow_system_settings_cache', DEFAULT_SYSTEM_SETTINGS)
  );
  const [securityAuditLogs, setSecurityAuditLogs] = useState<SecurityAuditLog[]>(() =>
    loadCache('serviflow_security_logs_cache', DEMO_SECURITY_LOGS)
  );

  // Offline Technician Sync States
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(false);
  const [pendingSyncQueue, setPendingSyncQueue] = useState<OfflineSyncItem[]>([]);
  const [manualSyncLogs, setManualSyncLogs] = useState<ManualSyncLog[]>(() =>
    loadCache('serviflow_manual_sync_logs_cache', [])
  );

  const isActuallyOffline = isOffline || isSimulatedOffline;

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isActivityLogOpen, setIsActivityLogOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [activeJobPopup, setActiveJobPopup] = useState<Notification | null>(null);

  const dismissJobPopup = () => {
    setActiveJobPopup(null);
  };

  const triggerJobPopupAlert = (notification: Notification) => {
    setActiveJobPopup(notification);
  };

  const isInitialJobsLoadRef = React.useRef(true);
  const isInitialNotifsLoadRef = React.useRef(true);
  const seenNotifIdsRef = React.useRef<Set<string>>(new Set());

  // Auto request browser notification permission on mount/user interaction
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      requestBrowserNotificationPermission().catch(() => {});
    }
  }, []);

  // -------------------------------------------------------------
  // REAL-TIME FIRESTORE SUBSCRIPTIONS (WITH PERSISTENT LOCAL CACHE)
  // -------------------------------------------------------------
  useEffect(() => {
    // 1. Businesses
    const unsubBiz = onSnapshot(
      collection(db, 'businesses'),
      (snapshot) => {
        const cloudItems = snapshot.docs
          .map((d) => ({ ...(d.data() as Business), id: d.id || (d.data() as Business).id }))
          .filter(
            (b) =>
              b.id &&
              b.id !== 'all' &&
              b.id !== 'biz-default' &&
              b.name !== 'ServiFlow Global Network' &&
              b.name !== 'ServiFlow Workspace'
          );
        setBusinesses(cloudItems);
        saveCache('serviflow_businesses_cache', cloudItems);
        if (cloudItems.length > 0) {
          setCurrentBusiness((prev) => {
            const found = cloudItems.find((b) => b.id === prev.id);
            const active = found || cloudItems[0];
            saveCache('serviflow_current_biz_cache', active);
            return active;
          });
        } else {
          setCurrentBusiness(DEFAULT_BLANK_BUSINESS);
          saveCache('serviflow_current_biz_cache', DEFAULT_BLANK_BUSINESS);
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'businesses')
    );

    // 2. Users
    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const cloudItems = snapshot.docs.map((d) => d.data() as User);

        // Security & Account Isolation Migration Routine:
        // Audit all user profiles and revert unauthorized super_admin roles to business_owner
        cloudItems.forEach((u) => {
          const uEmail = (u.email || '').trim().toLowerCase();
          const isAuthorizedSuperAdmin =
            uEmail === 'admin@serviflow.io' ||
            uEmail === 'superadmin@serviflow.io' ||
            u.id === SUPER_ADMIN_USER.id;

          if (u.role === 'super_admin' && !isAuthorizedSuperAdmin) {
            console.warn(
              `[Security Audit Auto-Correction] Account ${u.email || u.id} was inappropriately marked as super_admin. Correcting to business_owner.`
            );
            const correctedBizId = u.businessId && u.businessId !== 'all' ? u.businessId : `tenant-${u.id}`;
            saveToFirestore('users', u.id, {
              role: 'business_owner',
              businessId: correctedBizId,
            });
            u.role = 'business_owner';
            u.businessId = correctedBizId;
          } else if (u.role !== 'super_admin' && u.businessId === 'all') {
            const correctedBizId = `tenant-${u.id}`;
            saveToFirestore('users', u.id, { businessId: correctedBizId });
            u.businessId = correctedBizId;
          }
        });

        // Deduplicate and canonicalize Super Admin
        const superAdminRecord = cloudItems.find(
          (u) =>
            (u.email || '').trim().toLowerCase() === 'admin@serviflow.io' ||
            (u.email || '').trim().toLowerCase() === 'superadmin@serviflow.io' ||
            u.role === 'super_admin' ||
            u.id === SUPER_ADMIN_USER.id
        ) || SUPER_ADMIN_USER;

        const canonicalSuperAdmin: User = {
          ...SUPER_ADMIN_USER,
          ...superAdminRecord,
          id: SUPER_ADMIN_USER.id,
          role: 'super_admin',
          email: 'admin@serviflow.io',
          businessId: 'all',
          status: 'active',
          approvalStatus: 'active',
        };

        const map = new Map<string, User>();
        map.set(SUPER_ADMIN_USER.id, canonicalSuperAdmin);

        // Group non-superadmin users by business tenant identity to eliminate duplicate owner/staff records
        const tenantUserGroups = new Map<string, User[]>();

        cloudItems.forEach((u) => {
          const uEmail = (u.email || '').trim().toLowerCase();
          const isSuper =
            u.role === 'super_admin' ||
            uEmail === 'admin@serviflow.io' ||
            uEmail === 'superadmin@serviflow.io' ||
            u.id === SUPER_ADMIN_USER.id;

          if (isSuper) {
            // Already handled in canonicalSuperAdmin
            return;
          }

          const bizId = u.businessId || 'default';
          const cleanPhone = (u.phone || '').replace(/[^0-9]/g, '').slice(-10);

          // Identity grouping key per tenant
          let groupKey = '';
          if (uEmail) {
            groupKey = `${bizId}__email__${uEmail}`;
          } else if (cleanPhone) {
            groupKey = `${bizId}__phone__${cleanPhone}`;
          } else if (u.role === 'business_owner') {
            groupKey = `${bizId}__owner`;
          } else {
            groupKey = `${bizId}__id__${u.id}`;
          }

          if (!tenantUserGroups.has(groupKey)) {
            tenantUserGroups.set(groupKey, []);
          }
          tenantUserGroups.get(groupKey)!.push(u);
        });

        // Current active UID to prevent deleting current logged-in user doc
        const activeSessionUid = localStorage.getItem('serviflow_logged_in_uid') || auth.currentUser?.uid;

        tenantUserGroups.forEach((groupUsers) => {
          if (groupUsers.length === 1) {
            const single = groupUsers[0];
            map.set(single.id, single);
            return;
          }

          // More than 1 record found for the same identity in the same tenant!
          // Rank records to pick the single canonical user record:
          // 1. Matches active logged-in UID
          // 2. Is not a temporary prefix (e.g. valid Firebase UID vs 'usr-owner-')
          // 3. Has more populated fields / latest joiningDate
          const sorted = [...groupUsers].sort((a, b) => {
            const aIsActive = activeSessionUid && a.id === activeSessionUid ? 1 : 0;
            const bIsActive = activeSessionUid && b.id === activeSessionUid ? 1 : 0;
            if (aIsActive !== bIsActive) return bIsActive - aIsActive;

            const aIsTemp = a.id.startsWith('usr-owner-') ? 1 : 0;
            const bIsTemp = b.id.startsWith('usr-owner-') ? 1 : 0;
            if (aIsTemp !== bIsTemp) return aIsTemp - bIsTemp;

            const aDate = new Date(a.joiningDate || a.requestedDate || 0).getTime();
            const bDate = new Date(b.joiningDate || b.requestedDate || 0).getTime();
            return bDate - aDate;
          });

          const canonical = sorted[0];
          map.set(canonical.id, canonical);

          // Safe auto-repair: Remove obsolete duplicate documents from Firestore
          const duplicates = sorted.slice(1);
          duplicates.forEach((dup) => {
            console.log(
              `[Deduplication] Removing duplicate user document (${dup.id}) for ${dup.email || dup.name} in business (${dup.businessId})`
            );
            deleteFromFirestore('users', dup.id);
            if (dup.businessId) {
              deleteFromFirestore('tenantMembers', `${dup.businessId}_${dup.id}`);
            }
          });
        });

        const allUsers = Array.from(map.values());
        setUsers(allUsers);
        saveCache('serviflow_users_cache', allUsers);

        // Ensure Super Admin user exists in database
        const hasSuperAdmin = cloudItems.some(
          (u) =>
            (u.role === 'super_admin' && (u.email || '').trim().toLowerCase() === 'admin@serviflow.io') ||
            u.id === SUPER_ADMIN_USER.id
        );
        if (!hasSuperAdmin) {
          saveToFirestore('users', SUPER_ADMIN_USER.id, canonicalSuperAdmin);
        }

        setCurrentUser((prev) => {
          if (!prev) return null;
          const isSuperAdmin = prev.role === 'super_admin' || prev.email === 'admin@serviflow.io';
          if (isSuperAdmin) return prev;

          const prevEmail = (prev.email || '').trim().toLowerCase();
          const prevPhone = (prev.phone || '').replace(/[^0-9]/g, '');

          const found = allUsers.find((u) => {
            const uEmail = (u.email || '').trim().toLowerCase();
            const uPhone = (u.phone || '').replace(/[^0-9]/g, '');
            return (
              u.id === prev.id ||
              (Boolean(uEmail) && Boolean(prevEmail) && uEmail === prevEmail) ||
              (uPhone.length >= 10 && prevPhone.length >= 10 && uPhone.slice(-10) === prevPhone.slice(-10))
            );
          });

          if (!found) {
            // Only invalidate if we are certain cloud data loaded and user genuinely no longer exists
            if (cloudItems.length > 0) {
              const stillInCloud = cloudItems.some((u) => {
                const uEmail = (u.email || '').trim().toLowerCase();
                const uPhone = (u.phone || '').replace(/[^0-9]/g, '');
                return (
                  u.id === prev.id ||
                  (Boolean(uEmail) && Boolean(prevEmail) && uEmail === prevEmail) ||
                  (uPhone.length >= 10 && prevPhone.length >= 10 && uPhone.slice(-10) === prevPhone.slice(-10))
                );
              });

              if (!stillInCloud) {
                localStorage.removeItem('serviflow_user_session');
                localStorage.removeItem('serviflow_logged_in_email');
                localStorage.removeItem('serviflow_logged_in_uid');
                return null;
              }
            }
            return prev;
          }

          localStorage.setItem('serviflow_user_session', JSON.stringify(found));
          return found;
        });
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'users')
    );

    // 2.5 Enquiries
    const unsubEnquiries = onSnapshot(
      collection(db, 'enquiries'),
      (snapshot) => {
        const cloudItems = snapshot.docs.map((d) => d.data() as Enquiry);
        setEnquiries(cloudItems);
        saveCache('serviflow_enquiries_cache', cloudItems);
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'enquiries')
    );

    // 3. Customers
    const unsubCustomers = onSnapshot(
      collection(db, 'customers'),
      (snapshot) => {
        const cloudItems = snapshot.docs.map((d) => d.data() as Customer);
        setCustomers(cloudItems);
        saveCache('serviflow_customers_cache', cloudItems);
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'customers')
    );

    // 4. Categories
    const unsubCategories = onSnapshot(
      collection(db, 'categories'),
      (snapshot) => {
        const cloudItems = snapshot.docs.map((d) => d.data() as ServiceCategory);
        setCategories(cloudItems);
        saveCache('serviflow_categories_cache', cloudItems);
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'categories')
    );

    // 5. Services
    const unsubServices = onSnapshot(
      collection(db, 'services'),
      (snapshot) => {
        const cloudItems = snapshot.docs.map((d) => d.data() as Service);
        setServices(cloudItems);
        saveCache('serviflow_services_cache', cloudItems);
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'services')
    );

    // 6. Jobs
    const unsubJobs = onSnapshot(
      collection(db, 'jobs'),
      (snapshot) => {
        const loadedJobs = snapshot.docs.map((d) => d.data() as Job);

        if (isInitialJobsLoadRef.current) {
          isInitialJobsLoadRef.current = false;
        }

        setJobs(loadedJobs);
        saveCache('serviflow_jobs_cache', loadedJobs);
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'jobs')
    );

    // 7. Inventory
    const unsubInventory = onSnapshot(
      collection(db, 'inventory'),
      (snapshot) => {
        const cloudItems = snapshot.docs.map((d) => d.data() as InventoryItem);
        setInventory(cloudItems);
        saveCache('serviflow_inventory_cache', cloudItems);
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'inventory')
    );

    // 8. Inventory Transactions
    const unsubInvTx = onSnapshot(
      collection(db, 'inventoryTransactions'),
      (snapshot) => {
        const cloudItems = snapshot.docs.map((d) => d.data() as InventoryTransaction);
        setInventoryTransactions(cloudItems);
        saveCache('serviflow_inv_tx_cache', cloudItems);
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'inventoryTransactions')
    );

    // 9. Quotations
    const unsubQuotations = onSnapshot(
      collection(db, 'quotations'),
      (snapshot) => {
        const cloudItems = snapshot.docs.map((d) => d.data() as Quotation);
        setQuotations(cloudItems);
        saveCache('serviflow_quotations_cache', cloudItems);
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'quotations')
    );

    // 10. Invoices
    const unsubInvoices = onSnapshot(
      collection(db, 'invoices'),
      (snapshot) => {
        const cloudItems = snapshot.docs.map((d) => d.data() as Invoice);
        setInvoices(cloudItems);
        saveCache('serviflow_invoices_cache', cloudItems);
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'invoices')
    );

    // 11. Payments
    const unsubPayments = onSnapshot(
      collection(db, 'payments'),
      (snapshot) => {
        const cloudItems = snapshot.docs.map((d) => d.data() as Payment);
        setPayments(cloudItems);
        saveCache('serviflow_payments_cache', cloudItems);
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'payments')
    );

    // 12. Contracts
    const unsubContracts = onSnapshot(
      collection(db, 'contracts'),
      (snapshot) => {
        const cloudItems = snapshot.docs.map((d) => d.data() as RecurringContract);
        setContracts(cloudItems);
        saveCache('serviflow_contracts_cache', cloudItems);
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'contracts')
    );

    // 13. Expenses
    const unsubExpenses = onSnapshot(
      collection(db, 'expenses'),
      (snapshot) => {
        const cloudItems = snapshot.docs.map((d) => d.data() as Expense);
        setExpenses(cloudItems);
        saveCache('serviflow_expenses_cache', cloudItems);
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'expenses')
    );

    // 14. Notifications
    const unsubNotifications = onSnapshot(
      collection(db, 'notifications'),
      (snapshot) => {
        const cloudItems = snapshot.docs.map((d) => d.data() as Notification);

        // Process newly added notifications for real-time alert dispatch
        if (!isInitialNotifsLoadRef.current) {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const notif = change.doc.data() as Notification;
              if (seenNotifIdsRef.current.has(notif.id)) return;
              seenNotifIdsRef.current.add(notif.id);

              if (!currentUser) return;
              if (notif.businessId !== currentBusiness?.id && currentUser.role !== 'super_admin') return;

              // SELF-NOTIFICATION SUPPRESSION:
              // The user who performed this action should NEVER receive a banner popup or voice alert for their own action
              const curId = (currentUser.id || '').trim().toLowerCase();
              const curEmail = (currentUser.email || '').trim().toLowerCase();
              const senderId = (notif.senderUserId || '').trim().toLowerCase();

              if (senderId && (senderId === curId || senderId === curEmail)) {
                return;
              }

              // Check if notification is targeted to the current active user
              let isTargetedToMe = false;

              const isJobAssignment =
                notif.actionType === 'assigned' ||
                notif.title?.toLowerCase().includes('assigned') ||
                notif.title?.toLowerCase().includes('job issued') ||
                notif.title?.toLowerCase().includes('job reassigned');

              const isJobStatusUpdate =
                notif.actionType === 'accepted' ||
                notif.actionType === 'started' ||
                notif.actionType === 'completed' ||
                notif.title?.toLowerCase().includes('job accepted') ||
                notif.title?.toLowerCase().includes('job on the way') ||
                notif.title?.toLowerCase().includes('job started') ||
                notif.title?.toLowerCase().includes('job work started') ||
                notif.title?.toLowerCase().includes('job completed');

              if (isJobAssignment) {
                // Only the assigned technician receives the voice alert and popup
                if (currentUser.role === 'technician') {
                  if (notif.targetUserId) {
                    const curPhone = (currentUser.phone || '').replace(/\D/g, '');
                    const curName = (currentUser.name || '').trim().toLowerCase();
                    const targetId = (notif.targetUserId || '').trim().toLowerCase();

                    if (curId === targetId || curEmail === targetId) {
                      isTargetedToMe = true;
                    } else {
                      const matchedUser = (users || []).find((u) => u.id === notif.targetUserId);
                      if (matchedUser) {
                        const mEmail = (matchedUser.email || '').trim().toLowerCase();
                        const mPhone = (matchedUser.phone || '').replace(/\D/g, '');
                        const mName = (matchedUser.name || '').trim().toLowerCase();

                        if (curEmail && mEmail && curEmail === mEmail) {
                          isTargetedToMe = true;
                        } else if (curPhone && mPhone && curPhone === mPhone) {
                          isTargetedToMe = true;
                        } else if (curName && mName && curName === mName) {
                          isTargetedToMe = true;
                        }
                      }
                    }
                  } else if (notif.targetRoleId === 'technician') {
                    isTargetedToMe = true;
                  }
                }
              } else if (isJobStatusUpdate) {
                // Owner & Manager (and Super Admin) receive updates when field technician accepts, starts, or finishes jobs
                // Technicians / Staff NEVER receive this notification popup or sound
                if (currentUser.role === 'business_owner' || currentUser.role === 'manager' || currentUser.role === 'super_admin') {
                  isTargetedToMe = true;
                }
              } else {
                // General notifications
                if (notif.targetUserId) {
                  isTargetedToMe = notif.targetUserId === currentUser.id || notif.targetUserId === currentUser.email;
                } else if (notif.targetRoleId) {
                  isTargetedToMe = notif.targetRoleId === currentUser.role;
                } else {
                  isTargetedToMe = currentUser.role === 'business_owner' || currentUser.role === 'manager';
                }
              }

              if (isTargetedToMe) {
                // Show in-app banner popup card with full details
                setActiveJobPopup(notif);

                // Trigger Background OS System Notification (works when window is minimized/tab in background/PWA)
                sendBackgroundSystemNotification(notif.title, {
                  body: notif.message,
                  data: { jobId: notif.jobId, url: '/' },
                });

                // Trigger Voice Audio Alert
                if (notif.actionType === 'assigned') {
                  playJobVoiceNotification(
                    notif.jobId || 'NEW',
                    notif.jobTitle || notif.title,
                    notif.jobLocation
                  );
                } else if (notif.actionType === 'completed') {
                  playJobCompletedVoiceNotification(
                    notif.jobId || 'DONE',
                    notif.targetUserId || undefined,
                    notif.jobTitle
                  );
                } else if (notif.actionType === 'accepted' || notif.actionType === 'started') {
                  playJobStatusVoiceNotification(
                    notif.actionType,
                    notif.jobId || '',
                    notif.authorName || 'Staff Technician',
                    notif.jobTitle
                  );
                }
              }
            }
          });
        } else {
          isInitialNotifsLoadRef.current = false;
          cloudItems.forEach((n) => seenNotifIdsRef.current.add(n.id));
        }

        setNotifications(cloudItems);
        saveCache('serviflow_notifications_cache', cloudItems);
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'notifications')
    );

    // 15. Activity Logs
    const unsubActivities = onSnapshot(
      collection(db, 'activities'),
      (snapshot) => {
        const cloudItems = snapshot.docs.map((d) => d.data() as ActivityLog);
        setActivityLogs(cloudItems);
        saveCache('serviflow_activity_logs_cache', cloudItems);
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'activities')
    );

    // 16. Manual Sync Logs
    const unsubSyncLogs = onSnapshot(
      collection(db, 'manualSyncLogs'),
      (snapshot) => {
        const cloudItems = snapshot.docs.map((d) => d.data() as ManualSyncLog);
        setManualSyncLogs(cloudItems);
        saveCache('serviflow_manual_sync_logs_cache', cloudItems);
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'manualSyncLogs')
    );

    // 17. Roles
    const unsubRoles = onSnapshot(
      collection(db, 'roles'),
      (snapshot) => {
        if (!snapshot.empty) {
          const loadedRoles = snapshot.docs.map((d) => d.data() as Role);
          setRoles(loadedRoles);
          saveCache('serviflow_roles_cache', loadedRoles);
        } else {
          DEMO_ROLES.forEach((r) => saveToFirestore('roles', r.id, r));
          setRoles(DEMO_ROLES);
          saveCache('serviflow_roles_cache', DEMO_ROLES);
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'roles')
    );

    // 18. Support Sessions
    const unsubSupportSessions = onSnapshot(
      collection(db, 'supportSessions'),
      (snapshot) => {
        const sessions = snapshot.docs.map((d) => d.data() as SupportSession);
        setSupportSessions(sessions);
        saveCache('serviflow_support_sessions_cache', sessions);
        const active = sessions.find((s) => s.status === 'active' && new Date(s.expiryTime).getTime() > Date.now());
        setActiveSupportSession(active || null);
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'supportSessions')
    );

    // 19. System Settings
    const unsubSystemSettings = onSnapshot(
      doc(db, 'systemSettings', 'global'),
      (docSnap) => {
        if (docSnap.exists()) {
          const loaded = docSnap.data() as SystemSettings;
          setSystemSettings(loaded);
          saveCache('serviflow_system_settings_cache', loaded);
        } else {
          saveToFirestore('systemSettings', 'global', DEFAULT_SYSTEM_SETTINGS);
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'systemSettings/global')
    );

    // 20. Security Audit Logs
    const unsubSecurityLogs = onSnapshot(
      collection(db, 'securityAuditLogs'),
      (snapshot) => {
        const logs = snapshot.docs.map((d) => d.data() as SecurityAuditLog);
        setSecurityAuditLogs(logs);
        saveCache('serviflow_security_logs_cache', logs);
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'securityAuditLogs')
    );

    // 21. Referral Records
    const unsubReferrals = onSnapshot(
      collection(db, 'referrals'),
      (snapshot) => {
        const cloudItems = snapshot.docs.map((d) => d.data() as ReferralRecord);
        setReferralRecords(cloudItems);
        saveCache('serviflow_referrals_cache', cloudItems);
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'referrals')
    );

    // 22. Referral Payout Requests
    const unsubReferralPayouts = onSnapshot(
      collection(db, 'referralPayouts'),
      (snapshot) => {
        const cloudItems = snapshot.docs.map((d) => d.data() as ReferralPayoutRequest);
        setReferralPayoutRequests(cloudItems);
        saveCache('serviflow_ref_payouts_cache', cloudItems);
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'referralPayouts')
    );

    // 23. Attendance Records
    const unsubAttendance = onSnapshot(
      collection(db, 'attendance'),
      (snapshot) => {
        const cloudItems = snapshot.docs.map((d) => d.data() as AttendanceRecord);
        setAttendanceRecords(cloudItems);
        saveCache('serviflow_attendance_cache', cloudItems);
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'attendance')
    );

    // 24. Attendance Locations
    const unsubAttendanceLocations = onSnapshot(
      collection(db, 'attendanceLocations'),
      (snapshot) => {
        const cloudItems = snapshot.docs.map((d) => d.data() as AttendanceLocation);
        setAttendanceLocations(cloudItems);
        saveCache('serviflow_attendance_locations_cache', cloudItems);
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'attendanceLocations')
    );

    // 25. Attendance Audit Logs
    const unsubAttendanceAuditLogs = onSnapshot(
      collection(db, 'attendanceAuditLogs'),
      (snapshot) => {
        const cloudItems = snapshot.docs.map((d) => d.data() as AttendanceAuditItem);
        setAttendanceAuditLogs(cloudItems);
        saveCache('serviflow_attendance_audit_cache', cloudItems);
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'attendanceAuditLogs')
    );

    return () => {
      unsubBiz();
      unsubUsers();
      unsubEnquiries();
      unsubCustomers();
      unsubCategories();
      unsubServices();
      unsubJobs();
      unsubInventory();
      unsubInvTx();
      unsubQuotations();
      unsubInvoices();
      unsubPayments();
      unsubContracts();
      unsubExpenses();
      unsubNotifications();
      unsubActivities();
      unsubSyncLogs();
      unsubRoles();
      unsubSupportSessions();
      unsubSystemSettings();
      unsubSecurityLogs();
      unsubReferrals();
      unsubReferralPayouts();
      unsubAttendance();
      unsubAttendanceLocations();
      unsubAttendanceAuditLogs();
    };
  }, []);

  // Online / Offline Window Listener
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      showToast('Connection restored! Synchronizing pending offline updates...', 'success');
      syncOfflineQueue();
    };

    const handleOffline = () => {
      setIsOffline(true);
      showToast('You are offline. Technician updates will be cached locally.', 'info');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // -------------------------------------------------------------
  // FIREBASE AUTH PERSISTENCE & SESSION RESTORATION
  // -------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!isMounted) return;

      if (firebaseUser) {
        try {
          let userRecord: User | null = null;

          // 1. Fetch user document directly from Firestore by UID
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userDocRef);

          if (userSnap.exists()) {
            userRecord = { ...(userSnap.data() as User), id: firebaseUser.uid };
          } else {
            const targetEmail = firebaseUser.email || localStorage.getItem('serviflow_logged_in_email');
            if (targetEmail) {
              const q = query(collection(db, 'users'), where('email', '==', targetEmail.toLowerCase()));
              const qSnap = await getDocs(q);
              if (!qSnap.empty) {
                const oldDoc = qSnap.docs[0];
                const oldDocId = oldDoc.id;
                userRecord = { ...(oldDoc.data() as User), id: firebaseUser.uid };
                // Ensure document is keyed by UID
                await setDoc(doc(db, 'users', firebaseUser.uid), userRecord, { merge: true });

                // Safe cleanup of obsolete pre-auth document
                if (oldDocId && oldDocId !== firebaseUser.uid) {
                  try {
                    await deleteDoc(doc(db, 'users', oldDocId));
                    await deleteDoc(doc(db, 'tenantMembers', `${userRecord.businessId}_${oldDocId}`));
                    if (userRecord.role === 'business_owner' && userRecord.businessId && userRecord.businessId !== 'all') {
                      await setDoc(doc(db, 'tenants', userRecord.businessId), { ownerId: firebaseUser.uid }, { merge: true });
                    }
                  } catch (e) {
                    console.warn('Cleanup old user doc notice in onAuthStateChanged:', e);
                  }
                }
              }
            }
          }

          if (userRecord && isMounted) {
            setCurrentUser(userRecord);
            localStorage.setItem('serviflow_user_session', JSON.stringify(userRecord));
            localStorage.setItem('serviflow_logged_in_email', userRecord.email);
            localStorage.setItem('serviflow_logged_in_uid', userRecord.id);

            // Fetch and set tenant
            if (userRecord.businessId === 'all' || userRecord.role === 'super_admin') {
              const globalBiz: Business = {
                id: 'all',
                name: 'ServiFlow Global Network',
                type: 'Platform Management',
                logo: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=150&auto=format&fit=crop&q=80',
                mobile: '+91 90000 00000',
                whatsapp: '+91 90000 00000',
                email: 'admin@serviflow.io',
                address: 'Global Operations Centre',
                city: 'New Delhi',
                state: 'Delhi',
                pin: '110001',
                currency: '₹',
                createdAt: new Date().toISOString().split('T')[0],
                planId: 'plan-enterprise',
                status: 'active',
              };
              setCurrentBusiness(globalBiz);
            } else {
              const bizSnap = await getDoc(doc(db, 'businesses', userRecord.businessId));
              if (bizSnap.exists()) {
                setCurrentBusiness(bizSnap.data() as Business);
              } else {
                const tenantSnap = await getDoc(doc(db, 'tenants', userRecord.businessId));
                if (tenantSnap.exists()) {
                  setCurrentBusiness(tenantSnap.data() as Business);
                } else {
                  const biz = businesses.find((b) => b.id === userRecord?.businessId);
                  if (biz) setCurrentBusiness(biz);
                }
              }
            }
          } else if (!userRecord && isMounted) {
            // Check if there is a valid session in localStorage before signing out
            const savedSessionRaw = localStorage.getItem('serviflow_user_session');
            if (savedSessionRaw) {
              try {
                const parsed = JSON.parse(savedSessionRaw) as User;
                if (parsed && parsed.id) {
                  setCurrentUser(parsed);
                  if (isMounted) setIsAuthInitializing(false);
                  return;
                }
              } catch {}
            }
            try {
              await signOut(auth);
            } catch {}
            setCurrentUser(null);
            setCurrentBusiness(DEFAULT_BLANK_BUSINESS);
            localStorage.removeItem('serviflow_user_session');
            localStorage.removeItem('serviflow_logged_in_email');
            localStorage.removeItem('serviflow_logged_in_uid');
            localStorage.removeItem('serviflow_current_biz_cache');
          }
        } catch (err) {
          console.error('Error fetching user on auth change:', err);
        }
      } else {
        // Firebase Auth is null on this device / browser.
        // Check persistent local storage session (e.g. staff member or field technician)
        if (isMounted) {
          const savedSessionRaw = localStorage.getItem('serviflow_user_session');
          if (savedSessionRaw) {
            try {
              const savedUser = JSON.parse(savedSessionRaw) as User;
              if (savedUser && savedUser.id && (savedUser.email || savedUser.phone)) {
                setCurrentUser(savedUser);

                // Restore business tenant
                if (savedUser.businessId === 'all' || savedUser.role === 'super_admin') {
                  const globalBiz: Business = {
                    id: 'all',
                    name: 'ServiFlow Global Network',
                    type: 'Platform Management',
                    logo: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=150&auto=format&fit=crop&q=80',
                    mobile: '+91 90000 00000',
                    whatsapp: '+91 90000 00000',
                    email: 'admin@serviflow.io',
                    address: 'Global Operations Centre',
                    city: 'New Delhi',
                    state: 'Delhi',
                    pin: '110001',
                    currency: '₹',
                    createdAt: new Date().toISOString().split('T')[0],
                    planId: 'plan-enterprise',
                    status: 'active',
                  };
                  setCurrentBusiness(globalBiz);
                } else if (savedUser.businessId) {
                  try {
                    const bizSnap = await getDoc(doc(db, 'businesses', savedUser.businessId));
                    if (bizSnap.exists()) {
                      setCurrentBusiness(bizSnap.data() as Business);
                    } else {
                      const tenantSnap = await getDoc(doc(db, 'tenants', savedUser.businessId));
                      if (tenantSnap.exists()) {
                        setCurrentBusiness(tenantSnap.data() as Business);
                      }
                    }
                  } catch (e) {
                    console.warn('Tenant restore notice:', e);
                  }
                }
              } else {
                setCurrentUser(null);
                localStorage.removeItem('serviflow_user_session');
                localStorage.removeItem('serviflow_logged_in_email');
                localStorage.removeItem('serviflow_logged_in_uid');
              }
            } catch {
              setCurrentUser(null);
              localStorage.removeItem('serviflow_user_session');
              localStorage.removeItem('serviflow_logged_in_email');
              localStorage.removeItem('serviflow_logged_in_uid');
            }
          } else {
            setCurrentUser(null);
          }
        }
      }
      if (isMounted) {
        setIsAuthInitializing(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [businesses]);

  const loginUser = async (userToLogin: User, password?: string): Promise<User> => {
    try {
      const email = userToLogin.email || '';
      const pass = password || userToLogin.password || 'ServiFlow@123';
      
      const { user, tenant } = await AuthService.loginWithCredentials(email, pass);

      localStorage.setItem('serviflow_user_session', JSON.stringify(user));
      localStorage.setItem('serviflow_logged_in_email', user.email);
      localStorage.setItem('serviflow_logged_in_uid', user.id);

      setCurrentUser(user);
      setCurrentBusiness(tenant);

      showToast(`Welcome back, ${user.name}!`, 'success');
      return user;
    } catch (err: any) {
      console.error('Error logging in user:', err);
      showToast(err.message || 'Login failed', 'error');
      throw err;
    }
  };

  const logoutUser = async (): Promise<void> => {
    try {
      await AuthService.logOut();
    } catch (err) {
      console.warn('Error signing out:', err);
    }
    setCurrentUser(null);
    setCurrentBusiness(DEFAULT_BLANK_BUSINESS);
    localStorage.removeItem('serviflow_user_session');
    localStorage.removeItem('serviflow_logged_in_email');
    localStorage.removeItem('serviflow_logged_in_uid');
    localStorage.removeItem('serviflow_current_biz_cache');
    sessionStorage.removeItem('serviflow_active_tab');
    setActiveSupportSession(null);
    showToast('Signed out successfully.', 'info');
  };

  const toggleSimulateOffline = () => {
    setIsSimulatedOffline((prev) => {
      const nextVal = !prev;
      if (nextVal) {
        showToast('Offline Mode Simulated for Technician Testing', 'info');
      } else {
        showToast('Online Mode Restored! Synchronizing queued updates...', 'success');
        syncOfflineQueue();
      }
      return nextVal;
    });
  };

  const addToSyncQueue = (
    action: OfflineSyncItem['action'],
    jobId: string,
    payload: any,
    description: string
  ) => {
    const newItem: OfflineSyncItem = {
      id: `sync-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      action,
      jobId,
      timestamp: new Date().toISOString(),
      payload,
      description,
    };
    setPendingSyncQueue((prev) => [...prev, newItem]);
  };

  const triggerManualSync = (
    triggerType: 'MANUAL_BUTTON' | 'AUTO_RECONNECT' | 'FORCED_REFRESH' = 'MANUAL_BUTTON',
    showToastNotification: boolean = true
  ) => {
    const isOff = isOffline || isSimulatedOffline;
    const nowISO = new Date().toISOString();
    const simulatedLatency = Math.floor(Math.random() * 80) + 110;

    if (isOff) {
      const logEntry: ManualSyncLog = {
        id: `sync-log-${Date.now()}`,
        timestamp: nowISO,
        technicianName: currentUser?.name || 'Field Technician',
        status: 'OFFLINE_QUEUED',
        itemsProcessedCount: 0,
        triggerType,
        details: `Sync attempted while in Offline Mode. ${pendingSyncQueue.length} update(s) remain cached in local memory until network connection is restored.`,
        itemsSynced: [],
        networkLatencyMs: 0,
      };
      saveToFirestore('manualSyncLogs', logEntry.id, logEntry);
      if (showToastNotification) {
        showToast(`Device is Offline. ${pendingSyncQueue.length} update(s) remain queued in local storage.`, 'info');
      }
      return;
    }

    if (pendingSyncQueue.length > 0) {
      const syncedItems = pendingSyncQueue.map((item) => ({
        jobId: item.jobId,
        description: item.description,
        action: item.action,
        timestamp: item.timestamp,
      }));

      pendingSyncQueue.forEach((item) => {
        logActivity(
          'Offline Job Synchronized',
          'job',
          item.jobId,
          `[Synced from Offline Queue]: ${item.description}`
        );
        // Sync queued job updates directly to Firestore
        if (item.action === 'update_job' || item.action === 'update_job_status' || item.action === 'start_job' || item.action === 'complete_job') {
          saveToFirestore('jobs', item.jobId, item.payload);
        }
      });

      const logEntry: ManualSyncLog = {
        id: `sync-log-${Date.now()}`,
        timestamp: nowISO,
        technicianName: currentUser?.name || 'Field Technician',
        status: 'SUCCESS',
        itemsProcessedCount: pendingSyncQueue.length,
        triggerType,
        details: `Successfully uploaded ${pendingSyncQueue.length} pending offline job record(s) to cloud database.`,
        itemsSynced: syncedItems,
        networkLatencyMs: simulatedLatency,
      };

      saveToFirestore('manualSyncLogs', logEntry.id, logEntry);
      setPendingSyncQueue([]);
      if (showToastNotification) {
        showToast('Data refreshed & cloud-synced!', 'success');
      }
    } else {
      const logEntry: ManualSyncLog = {
        id: `sync-log-${Date.now()}`,
        timestamp: nowISO,
        technicianName: currentUser?.name || 'Field Technician',
        status: 'NO_CHANGES',
        itemsProcessedCount: 0,
        triggerType,
        details: 'Manual verification completed. All technician records & local state are fully synchronized with Firestore.',
        itemsSynced: [],
        networkLatencyMs: simulatedLatency,
      };

      saveToFirestore('manualSyncLogs', logEntry.id, logEntry);
      if (showToastNotification) {
        showToast('Data refreshed & cloud-synced!', 'success');
      }
    }
  };

  const syncOfflineQueue = (showToastNotification: boolean = false) => {
    triggerManualSync('AUTO_RECONNECT', showToastNotification);
  };

  const clearSyncLogs = () => {
    manualSyncLogs.forEach((log) => deleteFromFirestore('manualSyncLogs', log.id));
    setManualSyncLogs([]);
    showToast('Manual sync history logs cleared.', 'info');
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    setToasts((prev) => {
      // Prevent identical duplicate toast popups if the message is already active
      if (prev.some((t) => t.message === message)) {
        return prev;
      }
      // Replace existing toasts so only 1 clear, non-overlapping toast popup is shown at a time
      return [{ id, message, type }];
    });
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const resetDemoData = () => {
    showToast('Data synchronized with latest cloud Firestore state.', 'info');
  };

  const logActivity = (
    action: string,
    entityType: ActivityLog['entityType'],
    entityId: string,
    description: string
  ) => {
    const newLog: ActivityLog = {
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      businessId: currentBusiness.id,
      action,
      entityType,
      entityId,
      description,
      timestamp: new Date().toISOString(),
      userName: currentUser?.name || 'System User',
    };
    saveToFirestore('activities', newLog.id, newLog);
  };

  // -------------------------------------------------------------
  // SECURITY AUDIT LOGGING & SUPPORT ACCESS ENGINE
  // -------------------------------------------------------------
  const logSecurityEvent = (
    action: string,
    category: SecurityAuditLog['category'],
    details: string,
    targetBusinessId?: string,
    targetBusinessName?: string
  ) => {
    const secLog: SecurityAuditLog = {
      id: `sec-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      timestamp: new Date().toISOString(),
      actorId: currentUser?.id || 'sys-admin',
      actorName: currentUser?.name || 'System Administrator',
      actorRole: currentUser?.role || 'super_admin',
      action,
      category,
      targetBusinessId,
      targetBusinessName,
      details,
    };
    saveToFirestore('securityAuditLogs', secLog.id, secLog);
  };

  const startSupportSession = (
    targetBusinessId: string,
    reason: string,
    durationMinutes = 30,
    accessMode: 'read_only' | 'full_support' = 'read_only'
  ) => {
    if (currentUser?.role !== 'super_admin') {
      showToast('Unauthorized: Only Super Administrators can request support access.', 'error');
      return;
    }

    const targetBiz = businesses.find((b) => b.id === targetBusinessId);
    if (!targetBiz) {
      showToast('Target tenant business not found.', 'error');
      return;
    }

    const now = new Date();
    const startTime = now.toISOString();
    const expiryTime = new Date(now.getTime() + durationMinutes * 60000).toISOString();

    const newSession: SupportSession = {
      id: `supp-sess-${Date.now()}`,
      superAdminId: currentUser.id,
      superAdminName: currentUser.name,
      superAdminEmail: currentUser.email,
      targetBusinessId,
      targetBusinessName: targetBiz.name,
      reason: reason || 'Investigating customer support query',
      accessMode,
      startTime,
      expiryTime,
      durationMinutes,
      status: 'active',
      actionsPerformedCount: 0,
    };

    saveToFirestore('supportSessions', newSession.id, newSession);
    setActiveSupportSession(newSession);
    setCurrentBusiness(targetBiz);

    logSecurityEvent(
      'SUPPORT_SESSION_STARTED',
      'SUPPORT_SESSION',
      `Initiated ${accessMode === 'read_only' ? 'Read-Only' : 'Full Support'} session for duration of ${durationMinutes} mins. Reason: "${reason}"`,
      targetBiz.id,
      targetBiz.name
    );

    showToast(
      `Support Session active for ${targetBiz.name} (${accessMode === 'read_only' ? 'Read-Only Mode' : 'Full Support Mode'})`,
      'success'
    );
  };

  const endSupportSession = (reason = 'Support session completed by Super Admin') => {
    if (activeSupportSession) {
      const updatedSession: SupportSession = {
        ...activeSupportSession,
        status: 'expired',
      };
      saveToFirestore('supportSessions', updatedSession.id, updatedSession);

      logSecurityEvent(
        'SUPPORT_SESSION_ENDED',
        'SUPPORT_SESSION',
        `Ended support session for ${activeSupportSession.targetBusinessName}. Reason: ${reason}`,
        activeSupportSession.targetBusinessId,
        activeSupportSession.targetBusinessName
      );

      setActiveSupportSession(null);
      showToast('Support session ended. Reverted to Super Admin Master Control.', 'info');
    }
  };

  const updateSystemSettings = (updates: Partial<SystemSettings>) => {
    if (currentUser?.role !== 'super_admin') {
      showToast('Unauthorized: Only Super Administrators can modify system configuration.', 'error');
      return;
    }
    const updated = { ...systemSettings, ...updates };
    setSystemSettings(updated);
    saveToFirestore('systemSettings', 'global', updated);
    logSecurityEvent('SYSTEM_SETTINGS_UPDATED', 'SETTINGS', `Updated global platform configuration settings.`);
    showToast('Global system settings updated and synchronized to cloud.', 'success');
  };

  const sendBroadcastNotification = async (params: {
    title: string;
    message: string;
    targetRole?: UserRole | 'all';
    targetBusinessId?: string | 'all';
    severity?: 'info' | 'warning' | 'critical' | 'success';
  }) => {
    if (currentUser?.role !== 'super_admin') {
      showToast('Unauthorized: Only Super Admin can send platform broadcasts.', 'error');
      return;
    }

    try {
      const nowISO = new Date().toISOString();
      const targetBizs =
        params.targetBusinessId && params.targetBusinessId !== 'all'
          ? businesses.filter((b) => b.id === params.targetBusinessId)
          : businesses.length > 0
          ? businesses
          : [currentBusiness];

      const newNotifs: Notification[] = [];

      for (const biz of targetBizs) {
        const notif: Notification = {
          id: `notif-bc-${Date.now()}-${biz.id}-${Math.random().toString(36).substring(2, 6)}`,
          businessId: biz.id,
          title: params.title,
          message: params.message,
          type: 'broadcast',
          broadcastSeverity: params.severity || 'info',
          authorName: currentUser?.name || 'Super Admin',
          read: false,
          createdAt: nowISO,
          targetRoleId: params.targetRole !== 'all' ? params.targetRole : undefined,
        };
        newNotifs.push(notif);
        await saveToFirestore('notifications', notif.id, notif);
      }

      setNotifications((prev) => [...newNotifs, ...prev]);
      saveCache('serviflow_notifications_cache', [...newNotifs, ...notifications]);

      logSecurityEvent(
        'BROADCAST_ANNOUNCEMENT_SENT',
        'SETTINGS',
        `Dispatched broadcast "${params.title}" to ${targetBizs.length} tenant business(es). Severity: ${params.severity || 'info'}`
      );

      playCustomVoiceNotification('Platform Announcement', params.title);
      showToast(`Broadcast notification dispatched to ${targetBizs.length} tenant workspace(s)!`, 'success');
    } catch (err) {
      console.error('Error sending broadcast:', err);
      showToast('Failed to send broadcast notification: ' + String(err), 'error');
    }
  };

  const revokeUserSession = (userId: string) => {
    if (currentUser?.role !== 'super_admin') {
      showToast('Unauthorized: Only Super Admin can revoke active user sessions.', 'error');
      return;
    }
    const target = users.find((u) => u.id === userId);
    if (target) {
      const updated: User = { ...target, status: 'inactive', approvalStatus: 'blocked' };
      saveToFirestore('users', target.id, updated);
      logSecurityEvent('USER_SESSION_REVOKED', 'AUTH', `Revoked active session & blocked access for user ${target.name} (${target.email}).`, target.businessId);
      showToast(`Access revoked and session invalidated for ${target.name}`, 'info');
    }
  };

  const forcePasswordReset = (userId: string) => {
    if (currentUser?.role !== 'super_admin') {
      showToast('Unauthorized: Only Super Admin can trigger password resets.', 'error');
      return;
    }
    const target = users.find((u) => u.id === userId);
    if (target) {
      logSecurityEvent('PASSWORD_RESET_TRIGGERED', 'AUTH', `Triggered emergency password reset flow for user ${target.name} (${target.email}).`, target.businessId);
      showToast(`Password reset notification & token issued for ${target.email}`, 'success');
    }
  };

  // -------------------------------------------------------------
  // SAFE CLEAN TESTING DATA PURGE ENGINE
  // -------------------------------------------------------------
  const purgeAllTransactionalData = async (): Promise<{ clearedCollections: string[]; totalDocsDeleted: number }> => {
    try {
      const res = await FirestoreService.purgeAllTransactionalData();
      logSecurityEvent(
        'PURGE_ALL_TRANSACTIONAL_DATA',
        'SETTINGS',
        `Super Admin wiped ${res.totalDocsDeleted} dummy transactional records across collections: ${res.clearedCollections?.join(', ') || 'All Collections'}`
      );
      setEnquiries([]);
      setCustomers([]);
      setJobs([]);
      setServices([]);
      setCategories([]);
      setInventory([]);
      setInventoryTransactions([]);
      setQuotations([]);
      setInvoices([]);
      setPayments([]);
      setContracts([]);
      setExpenses([]);
      setNotifications([]);
      setActivityLogs([]);
      setManualSyncLogs([]);
      setAttendanceRecords([]);
      setAttendanceLocations([]);
      setAttendanceAuditLogs([]);

      showToast(`Clean State Active: Purged ${res.totalDocsDeleted} dummy records. Database is now in clean state for real testing.`, 'success');
      return res;
    } catch (err) {
      console.error('Purge error:', err);
      showToast('Failed to purge transactional data: ' + String(err), 'error');
      return { clearedCollections: [], totalDocsDeleted: 0 };
    }
  };

  const purgeTenantTransactionalData = async (
    businessId = currentBusiness.id
  ): Promise<{ clearedCollections: string[]; totalDocsDeleted: number }> => {
    try {
      const res = await FirestoreService.purgeTenantTransactionalData(businessId);
      logSecurityEvent(
        'PURGE_TENANT_TRANSACTIONAL_DATA',
        'TENANT_ACCESS',
        `Cleared ${res.totalDocsDeleted} tenant records for business ID: ${businessId}`,
        businessId,
        currentBusiness.name
      );
      if (businessId === currentBusiness.id) {
        setAttendanceRecords((prev) => prev.filter((a) => a.businessId !== businessId));
        setAttendanceLocations((prev) => prev.filter((l) => l.businessId !== businessId));
        setAttendanceAuditLogs((prev) => prev.filter((l) => l.businessId !== businessId));
      }
      showToast(`Clean State Active: Purged ${res.totalDocsDeleted} records for ${currentBusiness.name}.`, 'success');
      return res;
    } catch (err) {
      console.error('Tenant purge error:', err);
      showToast('Failed to purge tenant data: ' + String(err), 'error');
      return { clearedCollections: [], totalDocsDeleted: 0 };
    }
  };

  const wipeAllExceptSuperAdmin = async (): Promise<{ clearedCollections: string[]; totalDocsDeleted: number }> => {
    if (currentUser?.role !== 'super_admin') {
      showToast('Unauthorized: Only Super Administrators can wipe platform data.', 'error');
      return { clearedCollections: [], totalDocsDeleted: 0 };
    }
    try {
      const res = await FirestoreService.wipeAllExceptSuperAdmin();
      logSecurityEvent(
        'GLOBAL_PLATFORM_WIPE',
        'SETTINGS',
        `Super Admin wiped all test businesses, tenant users, and dummy transactional records (${res.totalDocsDeleted} documents).`
      );

      const canonicalAdmin: User = {
        ...SUPER_ADMIN_USER,
        id: SUPER_ADMIN_USER.id,
        role: 'super_admin',
        email: 'admin@serviflow.io',
        businessId: 'all',
        status: 'active',
        approvalStatus: 'active',
      };

      setBusinesses([]);
      setUsers([canonicalAdmin]);
      setCurrentBusiness(DEFAULT_BLANK_BUSINESS);
      setEnquiries([]);
      setCustomers([]);
      setJobs([]);
      setServices([]);
      setCategories([]);
      setInventory([]);
      setInventoryTransactions([]);
      setQuotations([]);
      setInvoices([]);
      setPayments([]);
      setContracts([]);
      setExpenses([]);
      setNotifications([]);
      setActivityLogs([]);
      setManualSyncLogs([]);
      setAttendanceRecords([]);
      setAttendanceLocations([]);
      setAttendanceAuditLogs([]);

      showToast(`Global Clean State Active: Database wiped to 0. 0 businesses, 0 tenant users. Only Super Admin preserved.`, 'success');
      return res;
    } catch (err) {
      console.error('Wipe error:', err);
      showToast('Failed to execute global wipe: ' + String(err), 'error');
      return { clearedCollections: [], totalDocsDeleted: 0 };
    }
  };

  const cleanupOrphanUsers = async (): Promise<number> => {
    try {
      const count = await FirestoreService.cleanupOrphanUsers();
      if (count > 0) {
        setUsers((prev) =>
          prev.filter((u) => {
            const uEmail = (u.email || '').trim().toLowerCase();
            const isSuper = u.role === 'super_admin' || uEmail === 'admin@serviflow.io';
            if (isSuper) return true;
            return businesses.some((b) => b.id === u.businessId);
          })
        );
        showToast(`Cleaned up ${count} orphaned test user record(s).`, 'success');
      } else {
        showToast('All user profiles are cleanly mapped to active businesses.', 'info');
      }
      return count;
    } catch (err) {
      console.error('Orphan user cleanup error:', err);
      return 0;
    }
  };

  const deleteBusinessTenant = async (businessId: string): Promise<void> => {
    if (currentUser?.role !== 'super_admin') {
      showToast('Unauthorized: Only Super Administrators can delete a business tenant.', 'error');
      return;
    }
    const targetBiz = businesses.find((b) => b.id === businessId);
    const bizName = targetBiz?.name || businessId;

    try {
      await FirestoreService.deleteBusinessAndTenant(businessId);
      logSecurityEvent(
        'BUSINESS_TENANT_DELETED',
        'TENANT_ACCESS',
        `Super Admin permanently deleted business tenant "${bizName}" (ID: ${businessId}) and all associated records.`,
        businessId,
        bizName
      );

      // Clean local memory and persistent caches immediately
      const remainingBizs = businesses.filter((b) => b.id !== businessId);
      const remainingUsers = users.filter((u) => u.businessId !== businessId || u.role === 'super_admin');
      setBusinesses(remainingBizs);
      setUsers(remainingUsers);
      saveCache('serviflow_businesses_cache', remainingBizs);
      saveCache('serviflow_users_cache', remainingUsers);

      // Clean operational tenant states
      setEnquiries((prev) => {
        const updated = prev.filter((e) => e.businessId !== businessId);
        saveCache('serviflow_enquiries_cache', updated);
        return updated;
      });
      setCustomers((prev) => {
        const updated = prev.filter((c) => c.businessId !== businessId);
        saveCache('serviflow_customers_cache', updated);
        return updated;
      });
      setJobs((prev) => {
        const updated = prev.filter((j) => j.businessId !== businessId);
        saveCache('serviflow_jobs_cache', updated);
        return updated;
      });
      setInvoices((prev) => {
        const updated = prev.filter((i) => i.businessId !== businessId);
        saveCache('serviflow_invoices_cache', updated);
        return updated;
      });
      setQuotations((prev) => {
        const updated = prev.filter((q) => q.businessId !== businessId);
        saveCache('serviflow_quotations_cache', updated);
        return updated;
      });
      setServices((prev) => {
        const updated = prev.filter((s) => s.businessId !== businessId);
        saveCache('serviflow_services_cache', updated);
        return updated;
      });
      setCategories((prev) => {
        const updated = prev.filter((c) => c.businessId !== businessId);
        saveCache('serviflow_categories_cache', updated);
        return updated;
      });
      setInventory((prev) => {
        const updated = prev.filter((i) => i.businessId !== businessId);
        saveCache('serviflow_inventory_cache', updated);
        return updated;
      });
      setInventoryTransactions((prev) => {
        const updated = prev.filter((t) => t.businessId !== businessId);
        saveCache('serviflow_inv_tx_cache', updated);
        return updated;
      });
      setPayments((prev) => {
        const updated = prev.filter((p) => p.businessId !== businessId);
        saveCache('serviflow_payments_cache', updated);
        return updated;
      });
      setContracts((prev) => {
        const updated = prev.filter((c) => c.businessId !== businessId);
        saveCache('serviflow_contracts_cache', updated);
        return updated;
      });
      setExpenses((prev) => {
        const updated = prev.filter((e) => e.businessId !== businessId);
        saveCache('serviflow_expenses_cache', updated);
        return updated;
      });

      if (currentBusiness.id === businessId) {
        if (remainingBizs.length > 0) {
          setCurrentBusiness(remainingBizs[0]);
          saveCache('serviflow_current_biz_cache', remainingBizs[0]);
        } else {
          setCurrentBusiness(DEFAULT_BLANK_BUSINESS);
          saveCache('serviflow_current_biz_cache', DEFAULT_BLANK_BUSINESS);
        }
      }
      showToast(`Business "${bizName}" and all associated data permanently deleted.`, 'success');
    } catch (err) {
      console.error('Error deleting business tenant:', err);
      showToast('Failed to delete business: ' + String(err), 'error');
      throw err;
    }
  };

  const deleteUserAccount = async (userId: string): Promise<void> => {
    if (currentUser?.role !== 'super_admin' && currentUser?.role !== 'business_owner') {
      showToast('Unauthorized: Insufficient permissions to delete user.', 'error');
      return;
    }
    const target = users.find((u) => u.id === userId);
    if (!target) return;
    if (target.role === 'super_admin' || target.email === 'admin@serviflow.io') {
      showToast('Action Forbidden: The SaaS Super Admin account cannot be deleted.', 'error');
      return;
    }

    try {
      await FirestoreService.deleteUser(userId);
      logSecurityEvent(
        'USER_ACCOUNT_DELETED',
        'AUTH',
        `Deleted user account "${target.name}" (${target.email}, Role: ${target.role})`,
        target.businessId
      );
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      showToast(`User "${target.name}" deleted successfully.`, 'success');
    } catch (err) {
      console.error('Error deleting user account:', err);
      showToast('Failed to delete user: ' + String(err), 'error');
      throw err;
    }
  };

  // Guard helper to block mutation actions in Read-Only Support mode or when tenant account is inactive/suspended
  const checkReadOnlySupportGuard = (): boolean => {
    if (activeSupportSession && activeSupportSession.accessMode === 'read_only') {
      showToast('Operation Restricted: You are in a Read-Only Support Session. Request Full Support access to perform modifications.', 'error');
      return true;
    }
    if (currentUser?.role !== 'super_admin' && (currentBusiness?.status === 'suspended' || currentBusiness?.status === 'rejected')) {
      showToast('Account Suspended: Your business tenant access is suspended. Please contact platform support.', 'error');
      return true;
    }
    return false;
  };

  // Switch role helper for role testing within authorized boundaries
  const switchRole = async (role: UserRole) => {
    if (role === 'super_admin') {
      const isCurrentlySuperAdmin =
        currentUser?.role === 'super_admin' &&
        ((currentUser?.email || '').trim().toLowerCase() === 'admin@serviflow.io' ||
          (currentUser?.email || '').trim().toLowerCase() === 'superadmin@serviflow.io');

      if (!isCurrentlySuperAdmin) {
        showToast(
          'Access Denied: Super Admin console requires dedicated credentials (admin@serviflow.io). Please log in via the Super Admin portal.',
          'error'
        );
        return;
      }
      return;
    }

    if (!currentBusiness?.id || currentBusiness.id === 'all') {
      showToast('Please select a business tenant first.', 'error');
      return;
    }

    let target = users.find((u) => u.businessId === currentBusiness.id && u.role === role);
    if (!target) {
      target = {
        id: `usr-${role}-${Date.now()}`,
        name: `${role.replace('_', ' ').toUpperCase()} User`,
        email: `${role}@${(currentBusiness?.name || 'business').toLowerCase().replace(/[^a-z0-9]/g, '') || 'service'}.com`,
        phone: currentBusiness.mobile,
        role: role,
        businessId: currentBusiness.id,
        status: 'active',
      };
    }
    await loginUser(target, target.password || 'ServiFlow@123');
  };

  // Switch business tenant
  const switchBusiness = (bId: string) => {
    // SECURITY GUARD: Only Super Admin or active Support Session can switch business tenants
    if (currentUser?.role !== 'super_admin' && (!activeSupportSession || activeSupportSession.targetBusinessId !== bId)) {
      showToast('Unauthorized: Only Super Administrators with an active support session can switch business tenants.', 'error');
      return;
    }

    const target = businesses.find((b) => b.id === bId);
    if (target) {
      setCurrentBusiness(target);
      if (currentUser?.role === 'super_admin') {
        logSecurityEvent('TENANT_SWITCHED', 'TENANT_ACCESS', `Super Admin switched context to business "${target.name}" (ID: ${bId})`, bId, target.name);
      } else {
        const bUser = users.find((u) => u.businessId === bId && u.role === 'business_owner') || {
          id: `usr-owner-${bId}`,
          name: `${target.name} Owner`,
          email: target.email,
          phone: target.mobile,
          role: 'business_owner' as UserRole,
          businessId: bId,
          status: 'active' as const,
        };
        setCurrentUser(bUser);
      }
      showToast(`Switched active tenant to: ${target.name}`, 'success');
    }
  };

  // Onboarding creation for a brand new business
  const createBusiness = (
    bData: Partial<Business>,
    initialCategoryName = 'General Service',
    isPending = false,
    ownerData?: { name?: string; email?: string; phone?: string; password?: string }
  ) => {
    const newBizId = bData.id || `biz-${Date.now()}`;
    const cleanEmail = (bData.email || ownerData?.email || 'contact@business.com').trim().toLowerCase();
    const cleanMobile = (bData.mobile || ownerData?.phone || '+91 99999 88888').trim();

    if (cleanEmail === 'admin@serviflow.io' || cleanEmail === 'superadmin@serviflow.io') {
      showToast('Cannot use Platform Super Admin email to create a business tenant.', 'error');
      throw new Error('Cannot use Platform Super Admin email to create a business tenant.');
    }

    const newBiz: Business = {
      id: newBizId,
      name: bData.name || 'New Service Business',
      type: bData.type || 'CCTV & Security',
      logo: bData.logo || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=150&auto=format&fit=crop&q=80',
      mobile: cleanMobile,
      whatsapp: bData.whatsapp || cleanMobile,
      email: cleanEmail,
      address: bData.address || 'Main Market Street',
      city: bData.city || 'Delhi',
      state: bData.state || 'Delhi',
      pin: bData.pin || '110001',
      gstNumber: bData.gstNumber,
      currency: bData.currency || '₹',
      createdAt: new Date().toISOString().split('T')[0],
      planId: 'plan-pro',
      status: isPending ? 'pending' : 'active',
    };

    const existingUser = users.find(
      (u) => (u.email || '').trim().toLowerCase() === cleanEmail && u.role !== 'super_admin'
    );

    const ownerName = ownerData?.name || (cleanEmail ? cleanEmail.split('@')[0] : `${newBiz.name} Admin`);
    const ownerEmail = cleanEmail;
    const rawPhone = ownerData?.phone || cleanMobile;
    const ownerPhone = rawPhone.startsWith('+') ? rawPhone : `+91 ${rawPhone}`;
    const ownerPassword = ownerData?.password || '1234';

    const ownerUser: User = {
      id: existingUser ? existingUser.id : `usr-owner-${newBizId}`,
      name: ownerName,
      email: ownerEmail,
      phone: ownerPhone,
      role: 'business_owner',
      businessId: newBizId,
      password: ownerPassword,
      status: isPending ? 'inactive' : 'active',
      approvalStatus: isPending ? 'pending' : 'active',
      requestedDate: new Date().toISOString().split('T')[0],
      joiningDate: new Date().toISOString().split('T')[0],
    };

    const defaultCategory: ServiceCategory = {
      id: `cat-${newBizId}-1`,
      businessId: newBizId,
      name: initialCategoryName,
      description: 'Default primary service category',
    };

    const defaultService: Service = {
      id: `srv-${newBizId}-1`,
      businessId: newBizId,
      categoryId: defaultCategory.id,
      name: `${initialCategoryName} Inspection & Repair`,
      price: 999,
      taxPercent: 18,
      estimatedMinutes: 60,
      description: 'Standard diagnostic and site inspection service',
    };

    saveToFirestore('businesses', newBiz.id, newBiz);
    saveToFirestore('tenants', newBiz.id, { ...newBiz, ownerId: ownerUser.id });
    saveToFirestore('users', ownerUser.id, ownerUser);
    saveToFirestore('tenantMembers', `${newBiz.id}_${ownerUser.id}`, {
      id: `${newBiz.id}_${ownerUser.id}`,
      tenantId: newBiz.id,
      userId: ownerUser.id,
      role: 'business_owner',
      status: isPending ? 'pending' : 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    saveToFirestore('categories', defaultCategory.id, defaultCategory);
    saveToFirestore('services', defaultService.id, defaultService);

    setBusinesses((prev) => {
      const updated = [...prev.filter((b) => b.id !== newBiz.id), newBiz];
      saveCache('serviflow_businesses_cache', updated);
      return updated;
    });
    setUsers((prev) => {
      const updated = [
        ...prev.filter(
          (u) =>
            u.id !== ownerUser.id &&
            (u.email || '').trim().toLowerCase() !== cleanEmail
        ),
        ownerUser,
      ];
      saveCache('serviflow_users_cache', updated);
      return updated;
    });
    setCategories((prev) => {
      const updated = [...prev.filter((c) => c.id !== defaultCategory.id), defaultCategory];
      saveCache('serviflow_categories_cache', updated);
      return updated;
    });
    setServices((prev) => {
      const updated = [...prev.filter((s) => s.id !== defaultService.id), defaultService];
      saveCache('serviflow_services_cache', updated);
      return updated;
    });

    if (!isPending) {
      if (currentUser?.role === 'super_admin') {
        showToast(`Business "${newBiz.name}" created and synced to Firestore.`, 'success');
      } else {
        setCurrentBusiness(newBiz);
        saveCache('serviflow_current_biz_cache', newBiz);
        setCurrentUser(ownerUser);
        localStorage.setItem('serviflow_user_session', JSON.stringify(ownerUser));
        showToast(`Welcome! Business "${newBiz.name}" onboarded and synced to Firestore.`, 'success');
      }
    }
    return newBiz;
  };

  // Business-filtered helpers
  const isSuperAdminUser = currentUser?.role === 'super_admin';
  const currBizId = currentBusiness?.id;
  const filteredEnquiries = isSuperAdminUser ? enquiries : enquiries.filter((e) => e.businessId === currBizId);
  const filteredCustomers = isSuperAdminUser ? customers : customers.filter((c) => c.businessId === currBizId);
  const filteredCategories = isSuperAdminUser ? categories : categories.filter((c) => c.businessId === currBizId);
  const filteredServices = isSuperAdminUser ? services : services.filter((s) => s.businessId === currBizId);
  const filteredJobs = isSuperAdminUser ? jobs : jobs.filter((j) => j.businessId === currBizId);
  const filteredInventory = isSuperAdminUser ? inventory : inventory.filter((i) => i.businessId === currBizId);
  const filteredQuotations = isSuperAdminUser ? quotations : quotations.filter((q) => q.businessId === currBizId);
  const filteredInvoices = isSuperAdminUser ? invoices : invoices.filter((inv) => inv.businessId === currBizId);
  const filteredPayments = isSuperAdminUser ? payments : payments.filter((p) => p.businessId === currBizId);
  const filteredContracts = isSuperAdminUser ? contracts : contracts.filter((c) => c.businessId === currBizId);
  const filteredExpenses = isSuperAdminUser ? expenses : expenses.filter((e) => e.businessId === currBizId);
  const filteredNotifications = (isSuperAdminUser
    ? notifications
    : notifications.filter((n) => {
        if (n.businessId !== currBizId) return false;
        if (!currentUser) return true;

        const isJobAssignment =
          n.actionType === 'assigned' ||
          n.title?.toLowerCase().includes('assigned') ||
          n.title?.toLowerCase().includes('job issued');

        if (currentUser.role === 'business_owner' || currentUser.role === 'manager' || currentUser.role === 'super_admin') {
          // Business owner, manager & super admin do not need to see technician assignment notifications
          if (isJobAssignment) return false;
          return true;
        }

        if (currentUser.role === 'technician') {
          // Technicians do not need to see status updates in their alert list (e.g. accepted, started, completed)
          const isStatusUpdate =
            n.actionType === 'accepted' ||
            n.actionType === 'started' ||
            n.actionType === 'completed' ||
            n.title?.toLowerCase().includes('job accepted') ||
            n.title?.toLowerCase().includes('job on the way') ||
            n.title?.toLowerCase().includes('job started') ||
            n.title?.toLowerCase().includes('job work started') ||
            n.title?.toLowerCase().includes('job completed');
          if (isStatusUpdate) return false;
          if (n.senderUserId === currentUser.id) return false;

          if (n.targetUserId) {
            if (n.targetUserId === currentUser.id || n.targetUserId === currentUser.email) return true;
            const matchedStaff = (users || []).find((u) => u.id === n.targetUserId);
            if (matchedStaff) {
              if (currentUser.email && matchedStaff.email && matchedStaff.email.toLowerCase() === currentUser.email.toLowerCase()) return true;
              if (currentUser.name && matchedStaff.name && matchedStaff.name.toLowerCase() === currentUser.name.toLowerCase()) return true;
            }
            return false;
          }
          if (n.targetRoleId) {
            return n.targetRoleId === 'technician';
          }
          return true;
        }

        if (n.targetUserId) {
          return n.targetUserId === currentUser.id || n.targetUserId === currentUser.email;
        }
        if (n.targetRoleId) {
          return currentUser.role === n.targetRoleId;
        }
        return true;
      }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);
  const filteredActivityLogs = isSuperAdminUser ? activityLogs : activityLogs.filter((a) => a.businessId === currBizId);
  const filteredStaff = isSuperAdminUser
    ? users
    : users
        .filter((u) => u.businessId === currBizId && u.role !== 'super_admin')
        .filter((u, index, self) => {
          const uEmail = (u.email || '').trim().toLowerCase();
          const uPhone = (u.phone || '').replace(/[^0-9]/g, '').slice(-10);
          return (
            index ===
            self.findIndex(
              (o) =>
                o.id === u.id ||
                (uEmail && (o.email || '').trim().toLowerCase() === uEmail) ||
                (uPhone && (o.phone || '').replace(/[^0-9]/g, '').slice(-10) === uPhone)
            )
          );
        });
  const filteredReferralRecords = isSuperAdminUser
    ? referralRecords
    : referralRecords.filter(
        (r) =>
          r.referrerBusinessId === currBizId ||
          r.referredBusinessId === currBizId
      );
  const filteredReferralPayouts = isSuperAdminUser
    ? referralPayoutRequests
    : referralPayoutRequests.filter((p) => p.businessId === currBizId);

  const filteredAttendanceRecords = isSuperAdminUser
    ? attendanceRecords
    : attendanceRecords.filter((a) => a.businessId === currBizId);
  const filteredAttendanceLocations = isSuperAdminUser
    ? attendanceLocations
    : attendanceLocations.filter((l) => l.businessId === currBizId);
  const filteredAttendanceAuditLogs = isSuperAdminUser
    ? attendanceAuditLogs
    : attendanceAuditLogs.filter((l) => l.businessId === currBizId);
  const attendanceWorkingRules: AttendanceWorkingRules =
    currentBusiness?.attendanceWorkingRules || DEFAULT_ATTENDANCE_RULES;

  // Enquiry Actions
  const addEnquiry = (data: Omit<Enquiry, 'id' | 'businessId' | 'enquiryId' | 'createdAt'>) => {
    if (checkReadOnlySupportGuard()) return {} as Enquiry;
    const perm = canCreateRecord(currentUser, 'enquiry');
    if (!perm.allowed) {
      showToast(perm.reason || 'Permission Denied: Cannot create enquiries.', 'error');
      return {} as Enquiry;
    }
    const count = filteredEnquiries.length + 101;
    const enquiryId = `ENQ-${new Date().getFullYear()}-${count}`;
    const id = `enq-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newEnquiry: Enquiry = {
      ...data,
      id,
      businessId: currentBusiness.id,
      enquiryId,
      createdAt: new Date().toISOString().split('T')[0],
      activityHistory: [
        {
          id: `act-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'Created',
          actorName: currentUser?.name || 'Staff User',
          details: `Enquiry recorded via ${data.source || 'Direct Contact'}`,
        },
      ],
    };
    firestoreService.saveDocument<Enquiry>('enquiries', newEnquiry.id, newEnquiry);
    logActivity('Enquiry Received', 'enquiry', newEnquiry.id, `New enquiry ${enquiryId} from ${newEnquiry.customerName}`);
    showToast(`Enquiry ${enquiryId} recorded successfully`, 'success');
    return newEnquiry;
  };

  const updateEnquiry = (id: string, updates: Partial<Enquiry>) => {
    if (checkReadOnlySupportGuard()) return;
    const perm = canUpdateRecord(currentUser, 'enquiry');
    if (!perm.allowed) {
      showToast(perm.reason || 'Permission Denied: Only Business Owners can edit enquiries.', 'error');
      return;
    }
    const target = enquiries.find((e) => e.id === id);
    if (target && target.businessId !== currentBusiness.id && !isSuperAdminUser) {
      showToast('Unauthorized: Cannot modify enquiry belonging to another tenant business.', 'error');
      return;
    }
    firestoreService.saveDocument<Enquiry>('enquiries', id, updates);
    logActivity('Enquiry Updated', 'enquiry', id, `Updated enquiry details for ${target?.enquiryId || id}`);
    showToast('Enquiry updated successfully', 'success');
  };

  const deleteEnquiry = (id: string) => {
    if (checkReadOnlySupportGuard()) return;
    const perm = canDeleteRecord(currentUser, 'enquiry');
    if (!perm.allowed) {
      showToast(perm.reason || 'Permission Denied: Only Business Owners can delete enquiries.', 'error');
      return;
    }
    const target = enquiries.find((e) => e.id === id);
    if (target && target.businessId !== currentBusiness.id && !isSuperAdminUser) {
      showToast('Unauthorized: Cannot delete enquiry belonging to another tenant business.', 'error');
      return;
    }
    firestoreService.deleteDocument('enquiries', id);
    logActivity('Enquiry Deleted', 'enquiry', id, `Deleted enquiry ${target?.enquiryId || id}`);
    showToast('Enquiry removed', 'info');
  };

  const addEnquiryActivity = (enquiryId: string, action: string, details: string) => {
    if (checkReadOnlySupportGuard()) return;
    const target = enquiries.find((e) => e.id === enquiryId);
    if (!target) return;

    const newActivity = {
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      timestamp: new Date().toISOString(),
      action,
      actorName: currentUser?.name || 'Staff User',
      details,
    };

    const updatedHistory = [...(target.activityHistory || []), newActivity];
    firestoreService.saveDocument<Enquiry>('enquiries', enquiryId, { activityHistory: updatedHistory });
    logActivity(`Enquiry: ${action}`, 'enquiry', enquiryId, details);
  };

  const addEnquiryFollowUp = (enquiryId: string, followUpData: Omit<EnquiryFollowUp, 'id' | 'createdAt'>) => {
    if (checkReadOnlySupportGuard()) return;
    const target = enquiries.find((e) => e.id === enquiryId);
    if (!target) return;
    if (target.businessId !== currentBusiness.id && !isSuperAdminUser) {
      showToast('Unauthorized: Cannot modify enquiry belonging to another tenant business.', 'error');
      return;
    }

    const newFollowUp: EnquiryFollowUp = {
      ...followUpData,
      id: `flw-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      createdAt: new Date().toISOString(),
      createdBy: currentUser?.name || 'Staff User',
    };

    const updatedFollowUps = [...(target.followUps || []), newFollowUp];
    const activityDetails = `Follow-up set for ${followUpData.date} ${followUpData.time || ''}. Note: ${followUpData.notes}${followUpData.outcome ? ` | Outcome: ${followUpData.outcome}` : ''}`;
    
    const newActivity: EnquiryActivity = {
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      timestamp: new Date().toISOString(),
      action: 'Follow-up Added',
      actorName: currentUser?.name || 'Staff User',
      details: activityDetails,
    };

    const updatedHistory = [...(target.activityHistory || []), newActivity];

    const updates: Partial<Enquiry> = {
      followUps: updatedFollowUps,
      followUpDate: followUpData.date,
      followUpTime: followUpData.time || '',
      activityHistory: updatedHistory,
    };

    if (target.status === 'new' || target.status === 'contacted') {
      updates.status = 'follow_up';
    }

    firestoreService.saveDocument<Enquiry>('enquiries', enquiryId, updates);
    logActivity('Enquiry Follow-up', 'enquiry', enquiryId, activityDetails);
    showToast('Follow-up recorded successfully', 'success');
  };

  const linkCustomerToEnquiry = (enquiryId: string, customerId: string) => {
    if (checkReadOnlySupportGuard()) return;
    const target = enquiries.find((e) => e.id === enquiryId);
    const cust = customers.find((c) => c.id === customerId);
    if (!target || !cust) return;
    if (target.businessId !== currentBusiness.id && !isSuperAdminUser) {
      showToast('Unauthorized: Cannot modify enquiry belonging to another tenant business.', 'error');
      return;
    }

    const linkActivity: EnquiryActivity = {
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      timestamp: new Date().toISOString(),
      action: 'Customer Linked',
      actorName: currentUser?.name || 'Staff User',
      details: `Linked to existing customer ${cust.name} (${cust.mobile})`,
    };

    const updatedHistory = [...(target.activityHistory || []), linkActivity];

    firestoreService.saveDocument<Enquiry>('enquiries', enquiryId, {
      customerId: cust.id,
      customerName: cust.name,
      customerPhone: cust.mobile,
      customerEmail: cust.email || target.customerEmail,
      companyName: cust.companyName || target.companyName,
      location: cust.address || target.location,
      activityHistory: updatedHistory,
    });

    logActivity('Enquiry Customer Linked', 'enquiry', enquiryId, `Linked enquiry ${target.enquiryId} to customer ${cust.name}`);
    showToast(`Linked enquiry to ${cust.name}`, 'success');
  };

  const createAndLinkCustomerFromEnquiry = (enquiryId: string, customerOverrides?: Partial<Customer>): Customer => {
    if (checkReadOnlySupportGuard()) return {} as Customer;
    const target = enquiries.find((e) => e.id === enquiryId);
    if (!target) throw new Error('Enquiry not found');

    const newCust = addCustomer({
      name: customerOverrides?.name || target.customerName,
      companyName: customerOverrides?.companyName || target.companyName || '',
      mobile: customerOverrides?.mobile || target.customerPhone,
      email: customerOverrides?.email || target.customerEmail || '',
      address: customerOverrides?.address || target.location || target.address || currentBusiness.address || 'Service Location',
      city: customerOverrides?.city || currentBusiness.city || 'City',
      state: customerOverrides?.state || currentBusiness.state || 'State',
      pin: customerOverrides?.pin || currentBusiness.pin || '000000',
      customerType: customerOverrides?.customerType || (target.companyName ? 'commercial' : 'individual'),
      notes: customerOverrides?.notes || `Created from Enquiry ${target.enquiryId}. ${target.notes || ''}`.trim(),
    });

    if (newCust) {
      const linkActivity: EnquiryActivity = {
        id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        timestamp: new Date().toISOString(),
        action: 'Customer Created & Linked',
        actorName: currentUser?.name || 'Staff User',
        details: `Created new customer record ${newCust.name} (${newCust.mobile}) and linked to enquiry`,
      };

      const updatedHistory = [...(target.activityHistory || []), linkActivity];

      firestoreService.saveDocument<Enquiry>('enquiries', enquiryId, {
        customerId: newCust.id,
        customerName: newCust.name,
        customerPhone: newCust.mobile,
        customerEmail: newCust.email,
        companyName: newCust.companyName,
        location: newCust.address,
        activityHistory: updatedHistory,
      });

      logActivity('Customer Created from Enquiry', 'customer', newCust.id, `Created customer ${newCust.name} from enquiry ${target.enquiryId}`);
    }

    return newCust || ({} as Customer);
  };

  const markEnquiryQualified = (enquiryId: string, notes?: string) => {
    if (checkReadOnlySupportGuard()) return;
    const target = enquiries.find((e) => e.id === enquiryId);
    if (!target) return;
    if (target.businessId !== currentBusiness.id && !isSuperAdminUser) {
      showToast('Unauthorized: Cannot modify enquiry belonging to another tenant business.', 'error');
      return;
    }

    const qualActivity: EnquiryActivity = {
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      timestamp: new Date().toISOString(),
      action: 'Qualified Enquiry',
      actorName: currentUser?.name || 'Staff User',
      details: `Enquiry marked as Qualified.${notes ? ` Note: ${notes}` : ''}`,
    };

    const updatedHistory = [...(target.activityHistory || []), qualActivity];

    firestoreService.saveDocument<Enquiry>('enquiries', enquiryId, {
      status: 'qualified',
      activityHistory: updatedHistory,
    });

    logActivity('Enquiry Qualified', 'enquiry', enquiryId, `Marked enquiry ${target.enquiryId} as Qualified`);
    showToast(`Enquiry ${target.enquiryId} marked as Qualified!`, 'success');
  };

  const markEnquiryLost = (enquiryId: string, reason: string, notes?: string) => {
    if (checkReadOnlySupportGuard()) return;
    const target = enquiries.find((e) => e.id === enquiryId);
    if (!target) return;
    if (target.businessId !== currentBusiness.id && !isSuperAdminUser) {
      showToast('Unauthorized: Cannot modify enquiry belonging to another tenant business.', 'error');
      return;
    }

    const lostActivity: EnquiryActivity = {
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      timestamp: new Date().toISOString(),
      action: 'Marked Lost',
      actorName: currentUser?.name || 'Staff User',
      details: `Reason: ${reason}${notes ? ` | Notes: ${notes}` : ''}`,
    };

    const updatedHistory = [...(target.activityHistory || []), lostActivity];

    firestoreService.saveDocument<Enquiry>('enquiries', enquiryId, {
      status: 'lost',
      lostReason: reason,
      lostNotes: notes || '',
      activityHistory: updatedHistory,
    });

    logActivity('Enquiry Lost', 'enquiry', enquiryId, `Marked enquiry ${target.enquiryId} as Lost: ${reason}`);
    showToast(`Enquiry ${target.enquiryId} marked as Lost`, 'info');
  };

  const convertEnquiryToQuote = async (
    enquiryId: string,
    quoteData: {
      items: LineItem[];
      validUntil?: string;
      notes?: string;
      terms?: string;
    }
  ): Promise<Quotation> => {
    if (checkReadOnlySupportGuard()) throw new Error('Read-only mode active');
    const enq = enquiries.find((e) => e.id === enquiryId);
    if (!enq) throw new Error('Enquiry not found');

    // 1. Ensure or find matching customer
    let custId = enq.customerId;
    if (!custId) {
      const existingCustomer = customers.find(
        (c) =>
          c.businessId === currentBusiness.id &&
          (c.mobile === enq.customerPhone || (c.email && c.email.toLowerCase() === enq.customerEmail?.toLowerCase()))
      );
      if (existingCustomer) {
        custId = existingCustomer.id;
      } else {
        const newCust = addCustomer({
          name: enq.customerName,
          companyName: enq.companyName,
          mobile: enq.customerPhone,
          email: enq.customerEmail || '',
          address: enq.location || enq.address || currentBusiness.address || 'Customer site location',
          city: currentBusiness.city || 'City',
          state: currentBusiness.state || 'State',
          pin: currentBusiness.pin || '000000',
          customerType: enq.companyName ? 'commercial' : 'individual',
          notes: `Created automatically from Enquiry ${enq.enquiryId}`,
        });
        if (newCust) {
          custId = newCust.id;
        }
      }
    }

    // Calculate totals
    const subtotal = quoteData.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    const taxTotal = quoteData.items.reduce((sum, item) => sum + ((item.quantity * item.rate * (item.taxPercent || 0)) / 100), 0);
    const grandTotal = subtotal + taxTotal;

    const validUntil = quoteData.validUntil || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];

    // 2. Create quotation
    const newQuotation = addQuotation(
      {
        customerId: custId || '',
        enquiryId: enq.id,
        date: new Date().toISOString().split('T')[0],
        validUntil,
        status: 'sent',
        items: quoteData.items,
        subtotal,
        taxTotal,
        discountTotal: 0,
        grandTotal,
        notes: quoteData.notes || `Generated from Enquiry ${enq.enquiryId} for ${enq.serviceRequired}`,
        terms: quoteData.terms || 'Standard service terms apply. Validity: 15 days.',
      },
      { silentToast: true }
    );

    // 3. Mark Enquiry as Quoted
    const quoteActivity: EnquiryActivity = {
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'Quote Created',
      actorName: currentUser?.name || 'Staff User',
      details: `Generated Quotation ${newQuotation.quotationNumber} for amount ${currentBusiness.currency}${grandTotal.toLocaleString()}`,
    };
    const updatedHistory = [...(enq.activityHistory || []), quoteActivity];

    firestoreService.saveDocument<Enquiry>('enquiries', enq.id, {
      status: 'quoted',
      convertedQuotationId: newQuotation.id,
      convertedQuotationNumber: newQuotation.quotationNumber,
      customerId: custId,
      activityHistory: updatedHistory,
    });

    logActivity('Enquiry Quoted', 'enquiry', enq.id, `Created quotation ${newQuotation.quotationNumber} for enquiry ${enq.enquiryId}`);
    showToast(`Quotation ${newQuotation.quotationNumber} created for ${enq.customerName}!`, 'success');
    return newQuotation;
  };

  const convertEnquiryToJob = async (enquiryId: string, jobOverrides?: Partial<Job>): Promise<Job> => {
    if (checkReadOnlySupportGuard()) throw new Error('Read-only mode active');
    const enq = enquiries.find((e) => e.id === enquiryId);
    if (!enq) throw new Error('Enquiry not found');

    // 1. Ensure or find matching customer
    let custId = enq.customerId;
    if (!custId) {
      const existingCustomer = customers.find(
        (c) => c.businessId === currentBusiness.id &&
               (c.mobile === enq.customerPhone || (c.email && c.email.toLowerCase() === enq.customerEmail?.toLowerCase()))
      );
      if (existingCustomer) {
        custId = existingCustomer.id;
      } else {
        const newCust = addCustomer({
          name: enq.customerName,
          companyName: enq.companyName,
          mobile: enq.customerPhone,
          email: enq.customerEmail || '',
          address: enq.location || enq.address || 'Customer site location',
          city: currentBusiness.city || 'City',
          state: currentBusiness.state || 'State',
          pin: currentBusiness.pin || '000000',
          customerType: enq.companyName ? 'commercial' : 'individual',
          notes: `Created automatically from Enquiry ${enq.enquiryId}`,
        });
        if (newCust) {
          custId = newCust.id;
        }
      }
    }

    // 2. Create the Job
    const newJob = addJob(
      {
        customerId: custId || '',
        assignedStaffId: jobOverrides?.assignedStaffId || enq.assignedStaffId || '',
        serviceId: jobOverrides?.serviceId || enq.serviceId || '',
        status: jobOverrides?.status || 'assigned',
        priority:
          jobOverrides?.priority ||
          (enq.priority === 'urgent'
            ? 'urgent'
            : enq.priority === 'high'
            ? 'high'
            : enq.priority === 'low'
            ? 'low'
            : 'medium'),
        scheduledDate: jobOverrides?.scheduledDate || enq.preferredDate || enq.followUpDate || new Date().toISOString().split('T')[0],
        scheduledTime: jobOverrides?.scheduledTime || enq.preferredTimeSlot || enq.followUpTime || '09:00 AM - 11:00 AM',
        scheduledTimeSlot: jobOverrides?.scheduledTimeSlot || enq.preferredTimeSlot || enq.followUpTime || '09:00 AM - 11:00 AM',
        location: jobOverrides?.location || enq.location || enq.address || currentBusiness.address || '',
        description: jobOverrides?.description || enq.serviceRequired || 'Field Service Job',
        estimatedAmount: jobOverrides?.estimatedAmount ?? (enq.estimatedValue || 0),
        notes: `Converted from Enquiry ${enq.enquiryId}. ${enq.notes || ''}\n${jobOverrides?.notes || ''}`.trim(),
        relatedEnquiryId: enq.id,
        activityHistory: [
          {
            id: `act-${Date.now()}`,
            timestamp: new Date().toISOString(),
            action: 'Converted from Enquiry',
            actorName: currentUser?.name || 'System',
            details: `Job created from Enquiry ${enq.enquiryId}`,
            status: 'assigned',
          },
        ],
      },
      { silentToast: true }
    );

    // 3. Mark Enquiry as converted
    const conversionActivity = {
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'Converted to Job',
      actorName: currentUser?.name || 'Staff User',
      details: `Enquiry converted into Job ${newJob.jobId}`,
    };
    const updatedHistory = [...(enq.activityHistory || []), conversionActivity];

    firestoreService.saveDocument<Enquiry>('enquiries', enq.id, {
      status: 'converted',
      convertedJobId: newJob.id,
      convertedJobNumber: newJob.jobId,
      customerId: custId,
      activityHistory: updatedHistory,
    });

    logActivity('Enquiry Converted', 'enquiry', enq.id, `Converted enquiry ${enq.enquiryId} to job ${newJob.jobId}`);
    showToast(`Converted enquiry to Job ${newJob.jobId}!`, 'success');
    return newJob;
  };

  // Customer Actions
  const addCustomer = (data: Omit<Customer, 'id' | 'businessId' | 'createdAt'>) => {
    if (checkReadOnlySupportGuard()) return;
    const perm = canCreateRecord(currentUser, 'customer');
    if (!perm.allowed) {
      showToast(perm.reason || 'Permission Denied: Cannot create customer records.', 'error');
      return;
    }
    const id = `cust-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newCust: Customer = {
      ...data,
      id,
      businessId: currentBusiness.id,
      createdAt: new Date().toISOString().split('T')[0],
    };
    firestoreService.saveDocument<Customer>('customers', newCust.id, newCust);
    logActivity('Customer Created', 'customer', newCust.id, `Created customer record for ${newCust.name}`);
    showToast(`Added customer: ${newCust.name}`, 'success');
    return newCust;
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    if (checkReadOnlySupportGuard()) return;
    const perm = canUpdateRecord(currentUser, 'customer');
    if (!perm.allowed) {
      showToast(perm.reason || 'Permission Denied: Only Business Owners can edit customer records.', 'error');
      return;
    }
    const target = customers.find((c) => c.id === id);
    if (target && target.businessId !== currentBusiness.id && !isSuperAdminUser) {
      showToast('Unauthorized: Cannot modify customer belonging to another tenant business.', 'error');
      return;
    }
    firestoreService.updateCustomer(id, updates);
    showToast('Customer information updated & synced to Firestore', 'success');
  };

  const deleteCustomer = async (id: string): Promise<{ success: boolean; message: string; blockedByRecords?: boolean }> => {
    if (checkReadOnlySupportGuard()) return { success: false, message: 'App is in read-only mode.' };
    const perm = canDeleteRecord(currentUser, 'customer');
    if (!perm.allowed) {
      const msg = perm.reason || 'Permission Denied: Only Business Owners can delete customer records.';
      showToast(msg, 'error');
      return { success: false, message: msg };
    }
    const target = customers.find((c) => c.id === id);
    if (!target) {
      const msg = 'Customer record not found.';
      showToast(msg, 'error');
      return { success: false, message: msg };
    }
    if (target.businessId !== currentBusiness.id && !isSuperAdminUser) {
      const msg = 'Unauthorized: Cannot delete customer belonging to another tenant business.';
      showToast(msg, 'error');
      return { success: false, message: msg };
    }

    // Comprehensive relational audit: check all transactional and operational collections
    const linkedJobs = (jobs || []).filter((j) => j.customerId === id);
    const linkedInvoices = (invoices || []).filter((inv) => inv.customerId === id);
    const linkedPayments = (payments || []).filter((p) => p.customerId === id);
    const linkedContracts = (contracts || []).filter((c) => c.customerId === id);
    const linkedQuotations = (quotations || []).filter((q) => q.customerId === id);
    const linkedEnquiries = (enquiries || []).filter((e) => e.customerId === id);

    const totalRelated =
      linkedJobs.length +
      linkedInvoices.length +
      linkedPayments.length +
      linkedContracts.length +
      linkedQuotations.length +
      linkedEnquiries.length;

    if (totalRelated > 0) {
      const recordTypes: string[] = [];
      if (linkedJobs.length > 0) recordTypes.push(`${linkedJobs.length} job(s)`);
      if (linkedInvoices.length > 0) recordTypes.push(`${linkedInvoices.length} invoice(s)`);
      if (linkedPayments.length > 0) recordTypes.push(`${linkedPayments.length} payment(s)`);
      if (linkedContracts.length > 0) recordTypes.push(`${linkedContracts.length} contract(s)`);
      if (linkedQuotations.length > 0) recordTypes.push(`${linkedQuotations.length} quote(s)`);
      if (linkedEnquiries.length > 0) recordTypes.push(`${linkedEnquiries.length} enquiry(s)`);

      const msg = `Customer Cannot Be Deleted: This customer has ${totalRelated} existing business record(s) (${recordTypes.join(', ')}). Deleting this customer could break historical accounting and service audit data. Please use "Archive Customer" instead.`;
      showToast('Customer cannot be deleted because related business records exist.', 'error');
      return { success: false, message: msg, blockedByRecords: true };
    }

    try {
      await firestoreService.deleteCustomer(id);
      logActivity(
        'Customer Deleted',
        'customer',
        id,
        `Permanently deleted customer "${target.name}" after verifying 0 linked transactional records.`
      );
      showToast('Customer deleted successfully.', 'success');
      return { success: true, message: 'Customer deleted successfully.' };
    } catch (err: any) {
      const errStr = err?.message || 'Failed to delete customer.';
      showToast(errStr, 'error');
      return { success: false, message: errStr };
    }
  };

  const archiveCustomer = async (id: string): Promise<{ success: boolean; message: string }> => {
    if (checkReadOnlySupportGuard()) return { success: false, message: 'App is in read-only mode.' };
    const perm = canUpdateRecord(currentUser, 'customer');
    if (!perm.allowed) {
      const msg = perm.reason || 'Permission Denied: Only Business Owners can archive customer records.';
      showToast(msg, 'error');
      return { success: false, message: msg };
    }
    const target = customers.find((c) => c.id === id);
    if (!target) {
      const msg = 'Customer record not found.';
      showToast(msg, 'error');
      return { success: false, message: msg };
    }
    if (target.businessId !== currentBusiness.id && !isSuperAdminUser) {
      const msg = 'Unauthorized: Cannot modify customer belonging to another tenant business.';
      showToast(msg, 'error');
      return { success: false, message: msg };
    }

    try {
      await firestoreService.updateCustomer(id, {
        isArchived: true,
        archivedAt: new Date().toISOString(),
      });
      logActivity(
        'Customer Archived',
        'customer',
        id,
        `Archived customer "${target.name}" to preserve audit history and deactivate active operations.`
      );
      showToast(`Customer "${target.name}" archived successfully. Historical records preserved.`, 'success');
      return { success: true, message: `Customer "${target.name}" archived successfully.` };
    } catch (err: any) {
      const errStr = err?.message || 'Failed to archive customer.';
      showToast(errStr, 'error');
      return { success: false, message: errStr };
    }
  };

  const unarchiveCustomer = async (id: string): Promise<{ success: boolean; message: string }> => {
    if (checkReadOnlySupportGuard()) return { success: false, message: 'App is in read-only mode.' };
    const perm = canUpdateRecord(currentUser, 'customer');
    if (!perm.allowed) {
      const msg = perm.reason || 'Permission Denied.';
      showToast(msg, 'error');
      return { success: false, message: msg };
    }
    const target = customers.find((c) => c.id === id);
    if (!target) {
      return { success: false, message: 'Customer not found.' };
    }
    try {
      await firestoreService.updateCustomer(id, {
        isArchived: false,
        archivedAt: undefined,
      });
      logActivity('Customer Restored', 'customer', id, `Restored customer "${target.name}" to active status.`);
      showToast(`Customer "${target.name}" restored to active status.`, 'success');
      return { success: true, message: `Customer "${target.name}" restored to active.` };
    } catch (err: any) {
      const errStr = err?.message || 'Failed to restore customer.';
      showToast(errStr, 'error');
      return { success: false, message: errStr };
    }
  };

  // Services Actions
  const addServiceCategory = (name: string, description?: string) => {
    if (checkReadOnlySupportGuard()) return;
    const perm = canCreateRecord(currentUser, 'category');
    if (!perm.allowed) {
      showToast(perm.reason || 'Permission Denied: Cannot create category.', 'error');
      return;
    }
    const newCat: ServiceCategory = {
      id: `cat-${Date.now()}`,
      businessId: currentBusiness.id,
      name,
      description,
    };
    firestoreService.saveDocument<ServiceCategory>('categories', newCat.id, newCat);
    showToast(`Added category: ${name}`, 'success');
    return newCat;
  };

  const addService = (data: Omit<Service, 'id' | 'businessId'>) => {
    if (checkReadOnlySupportGuard()) return;
    const perm = canCreateRecord(currentUser, 'service');
    if (!perm.allowed) {
      showToast(perm.reason || 'Permission Denied: Cannot create service.', 'error');
      return;
    }
    const newSrv: Service = {
      ...data,
      id: `srv-${Date.now()}`,
      businessId: currentBusiness.id,
    };
    firestoreService.saveDocument<Service>('services', newSrv.id, newSrv);
    showToast(`Service "${newSrv.name}" created`, 'success');
  };

  const updateService = (id: string, updates: Partial<Service>) => {
    if (checkReadOnlySupportGuard()) return;
    const perm = canUpdateRecord(currentUser, 'service');
    if (!perm.allowed) {
      showToast(perm.reason || 'Permission Denied: Only Business Owners can edit service offerings.', 'error');
      return;
    }
    const target = services.find((s) => s.id === id);
    if (target && target.businessId !== currentBusiness.id && !isSuperAdminUser) {
      showToast('Unauthorized: Cannot modify service belonging to another tenant business.', 'error');
      return;
    }
    firestoreService.saveDocument<Service>('services', id, updates);
    showToast('Service details updated', 'success');
  };

  const deleteService = (id: string) => {
    if (checkReadOnlySupportGuard()) return;
    const perm = canDeleteRecord(currentUser, 'service');
    if (!perm.allowed) {
      showToast(perm.reason || 'Permission Denied: Only Business Owners can delete service offerings.', 'error');
      return;
    }
    const target = services.find((s) => s.id === id);
    if (target && target.businessId !== currentBusiness.id && !isSuperAdminUser) {
      showToast('Unauthorized: Cannot delete service belonging to another tenant business.', 'error');
      return;
    }
    firestoreService.deleteDocument('services', id);
    showToast('Service removed', 'info');
  };

  // Job Actions
  const addJob = (
    data: Omit<Job, 'id' | 'businessId' | 'jobId' | 'createdAt'>,
    options?: { silentToast?: boolean }
  ) => {
    if (checkReadOnlySupportGuard()) return;
    const perm = canCreateRecord(currentUser, 'job');
    if (!perm.allowed) {
      showToast(perm.reason || 'Permission Denied: Cannot create jobs.', 'error');
      return;
    }

    if (currentBusiness.id !== 'all' && currentUser?.role !== 'super_admin') {
      const currentMonthPrefix = new Date().toISOString().substring(0, 7);
      const monthlyJobCount = (jobs || []).filter(
        (j) =>
          j.businessId === currentBusiness.id &&
          (j.createdAt?.startsWith(currentMonthPrefix) || j.scheduledDate?.startsWith(currentMonthPrefix))
      ).length;
      const capacity = checkMonthlyJobCapacity(monthlyJobCount, currentBusiness.planId || currentBusiness.plan);
      if (!capacity.allowed) {
        showToast(
          capacity.message ||
            `Monthly job limit reached (${monthlyJobCount}/${capacity.maxJobs}) for ${capacity.planName} plan. Upgrade to create more jobs.`,
          'error'
        );
        return;
      }
    }

    const count = filteredJobs.length + 101;
    const jobId = `JOB-${new Date().getFullYear()}-${count}`;
    const id = `job-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newJob: Job = {
      ...data,
      id,
      businessId: currentBusiness.id,
      jobId,
      scheduledTime: data.scheduledTime || '09:00 AM - 11:00 AM',
      scheduledTimeSlot: data.scheduledTimeSlot || data.scheduledTime || '09:00 AM - 11:00 AM',
      createdAt: new Date().toISOString().split('T')[0],
    };

    firestoreService.saveDocument<Job>('jobs', newJob.id, newJob);

    // Broadcast instant Notification doc in Firestore for staff members
    const assignedStaff = (users || []).find((u) => u.id === data.assignedStaffId);
    const customer = (customers || []).find((c) => c.id === data.customerId);
    const newNotif: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      businessId: currentBusiness.id,
      title: `New Job Assigned: ${jobId}`,
      message: `New service task ${jobId} (${data.description}) assigned${assignedStaff ? ' to ' + assignedStaff.name : ''}. Scheduled for ${data.scheduledDate} (${data.scheduledTime || data.scheduledTimeSlot || '09:00 AM'})`,
      type: 'job',
      read: false,
      createdAt: new Date().toISOString(),
      senderUserId: currentUser?.id,
      senderRoleId: currentUser?.role,
      targetRoleId: 'technician',
      targetUserId: data.assignedStaffId,
      jobId: jobId,
      jobTitle: data.description,
      jobLocation: data.location || customer?.address,
      customerName: customer?.name,
      customerPhone: customer?.mobile,
      scheduledDate: data.scheduledDate,
      scheduledTime: data.scheduledTimeSlot || data.scheduledTime,
      priority: data.priority,
      actionType: 'assigned',
    };
    saveToFirestore('notifications', newNotif.id, newNotif);
    seenNotifIdsRef.current.add(newNotif.id);

    logActivity('Job Created', 'job', newJob.id, `Created job ${jobId}`);

    // Voice notification and popup should ONLY trigger on the assigned technician's device (never for the business owner who created it)
    const isCurrentUserTheAssignedTechnician =
      currentUser?.role === 'technician' &&
      (currentUser?.id === data.assignedStaffId ||
        (Boolean(currentUser?.email) &&
          Boolean(assignedStaff?.email) &&
          currentUser?.email?.toLowerCase() === assignedStaff?.email?.toLowerCase()));

    if (isCurrentUserTheAssignedTechnician) {
      playJobVoiceNotification(jobId, data.description || 'New Service Task', data.location, assignedStaff?.name);
      setActiveJobPopup(newNotif);
    }

    if (!options?.silentToast) {
      showToast(`Job ${jobId} issued & assigned${assignedStaff ? ' to ' + assignedStaff.name : ''}!`, 'success');
    }
    return newJob;
  };

  const updateJob = (id: string, updates: Partial<Job>) => {
    if (checkReadOnlySupportGuard()) return;
    const perm = canUpdateRecord(currentUser, 'job');
    if (!perm.allowed) {
      showToast(perm.reason || 'Permission Denied: Only Business Owners can modify core job details and assignments.', 'error');
      return;
    }
    const target = jobs.find((j) => j.id === id);
    if (target && target.businessId !== currentBusiness.id && !isSuperAdminUser) {
      showToast('Unauthorized: Cannot modify job belonging to another tenant business.', 'error');
      return;
    }
    if (isActuallyOffline) {
      addToSyncQueue('update_job', id, updates, 'Updated job schedule/assignment');
      showToast('Offline Mode: Saved locally and queued for sync.', 'info');
    } else {
      firestoreService.updateJob(id, updates);

      // If technician was updated or reassigned, create targeted notification for the new assignee
      const existingJ = jobs.find((j) => j.id === id);
      if (existingJ && updates.assignedStaffId && updates.assignedStaffId !== existingJ.assignedStaffId) {
        const assignedStaff = (users || []).find((u) => u.id === updates.assignedStaffId);
        const customer = (customers || []).find((c) => c.id === (updates.customerId || existingJ.customerId));
        const reassignNotif: Notification = {
          id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          businessId: currentBusiness.id,
          title: `Job Reassigned: ${existingJ.jobId}`,
          message: `Job ${existingJ.jobId} (${updates.description || existingJ.description}) has been assigned to you. Scheduled for ${updates.scheduledDate || existingJ.scheduledDate} (${updates.scheduledTimeSlot || updates.scheduledTime || existingJ.scheduledTime || '09:00 AM'}).`,
          type: 'job',
          read: false,
          createdAt: new Date().toISOString(),
          senderUserId: currentUser?.id,
          senderRoleId: currentUser?.role,
          targetRoleId: 'technician',
          targetUserId: updates.assignedStaffId,
          jobId: existingJ.jobId,
          jobTitle: updates.description || existingJ.description,
          jobLocation: updates.location || existingJ.location || customer?.address,
          customerName: customer?.name,
          customerPhone: customer?.mobile,
          scheduledDate: updates.scheduledDate || existingJ.scheduledDate,
          scheduledTime: updates.scheduledTimeSlot || updates.scheduledTime || existingJ.scheduledTime,
          priority: updates.priority || existingJ.priority,
          actionType: 'assigned',
        };
        saveToFirestore('notifications', reassignNotif.id, reassignNotif);
        seenNotifIdsRef.current.add(reassignNotif.id);
      }

      logActivity('Job Updated', 'job', id, 'Updated job assignment and schedule');
      showToast('Job updated & synced to Firestore', 'success');
    }
  };

  const getJobStatusSuccessMsg = (st: JobStatus): string => {
    switch (st) {
      case 'accepted':
        return 'Job accepted successfully';
      case 'on_the_way':
        return 'Status updated: On the way to customer site';
      case 'started':
        return 'Job started successfully';
      case 'in_progress':
        return 'Job marked as in progress';
      case 'completed':
        return 'Job completed successfully';
      case 'closed':
        return 'Job marked as closed';
      case 'cancelled':
        return 'Job marked as cancelled';
      case 'new':
        return 'Job marked as new';
      case 'scheduled':
        return 'Job scheduled successfully';
      case 'on_hold':
        return 'Job put on hold';
      case 'verified':
        return 'Job verified successfully';
      case 'assigned':
        return 'Job assigned successfully';
      default:
        return `Job status updated to ${(st as string).replace('_', ' ').toUpperCase()}`;
    }
  };

  const updateJobStatus = (id: string, status: JobStatus, reason?: string) => {
    if (checkReadOnlySupportGuard()) return;
    const target = jobs.find((j) => j.id === id);
    if (!target) {
      showToast('Job record not found.', 'error');
      return;
    }
    if (target.businessId !== currentBusiness.id && !isSuperAdminUser) {
      showToast('Unauthorized: Cannot update job belonging to another tenant business.', 'error');
      return;
    }

    // Central Transition Rule Validation
    const validation = validateJobStatusTransition(target.status, status, currentUser?.role);
    if (!validation.allowed) {
      showToast(validation.reason || 'Unauthorized status transition.', 'error');
      return;
    }

    const techUser = (users || []).find((u) => u.id === target?.assignedStaffId) || currentUser;
    const techName = techUser?.name || currentUser?.name || 'Staff Technician';
    const actorName = currentUser?.name || 'Staff User';
    const actorRole = currentUser?.role || 'staff';

    // Construct immutable audit activity entry
    const newActivityItem: JobActivityItem = {
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      action: `Status Changed: ${target.status} → ${status}`,
      actorName,
      actorRole,
      fromStatus: target.status,
      toStatus: status,
      reason: reason || undefined,
      details: `Status changed from ${target.status.toUpperCase()} to ${status.toUpperCase()}${
        reason ? ` (Reason: ${reason})` : ''
      }`,
    };

    const updatedHistory = [...(target.activityHistory || []), newActivityItem];

    if (isActuallyOffline) {
      addToSyncQueue(
        'update_job_status',
        id,
        { status, activityHistory: updatedHistory },
        `Job status changed to ${status.replace('_', ' ')}`
      );
      showToast(`Offline: ${getJobStatusSuccessMsg(status)} (queued for sync)`, 'info');
    } else {
      firestoreService.updateJob(id, { status, activityHistory: updatedHistory });

      // If status changed to accepted, on_the_way, or started, notify Business Owner & Managers
      if (status === 'accepted' || status === 'on_the_way' || status === 'started') {
        const customer = (customers || []).find((c) => c.id === target?.customerId);
        const statusLabel =
          status === 'accepted'
            ? 'Accepted'
            : status === 'on_the_way'
            ? 'On The Way'
            : 'Started Work';

        const statusNotif: Notification = {
          id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          businessId: currentBusiness.id,
          title: `Job ${statusLabel}: ${target?.jobId || id}`,
          message: `Technician ${techName} has marked job ${target?.jobId || id} as "${statusLabel.toUpperCase()}". Client: ${customer?.name || 'Customer'}.`,
          type: 'job',
          read: false,
          createdAt: new Date().toISOString(),
          senderUserId: currentUser?.id,
          senderRoleId: currentUser?.role,
          authorName: techName,
          targetRoleId: 'business_owner',
          jobId: target?.jobId || id,
          jobTitle: target?.description,
          jobLocation: target?.location || customer?.address,
          customerName: customer?.name,
          customerPhone: customer?.mobile,
          scheduledDate: target?.scheduledDate,
          scheduledTime: target?.scheduledTimeSlot || target?.scheduledTime,
          priority: target?.priority,
          actionType: status === 'accepted' ? 'accepted' : status === 'started' ? 'started' : 'general',
        };
        saveToFirestore('notifications', statusNotif.id, statusNotif);
        seenNotifIdsRef.current.add(statusNotif.id);
      }

      logActivity(
        'Job Status Updated',
        'job',
        id,
        `Changed job status to ${status.replace('_', ' ').toUpperCase()}${reason ? ` | Reason: ${reason}` : ''}`
      );
      showToast(getJobStatusSuccessMsg(status), 'success');
    }
  };

  const deleteJob = (id: string) => {
    if (checkReadOnlySupportGuard()) return;
    const perm = canDeleteRecord(currentUser, 'job');
    if (!perm.allowed) {
      showToast(perm.reason || 'Permission Denied: Only Business Owners can delete jobs.', 'error');
      return;
    }
    const target = jobs.find((j) => j.id === id);
    if (target && target.businessId !== currentBusiness.id && !isSuperAdminUser) {
      showToast('Unauthorized: Cannot delete job belonging to another tenant business.', 'error');
      return;
    }
    firestoreService.deleteJob(id);
    logActivity('Job Deleted', 'job', id, 'Deleted job record from Firestore');
    showToast('Job deleted from Firestore', 'info');
  };

  const startJob = (id: string, beforePhotos: string[], notes?: string) => {
    if (checkReadOnlySupportGuard()) return;
    const existingJob = jobs.find((j) => j.id === id);
    if (existingJob && existingJob.businessId !== currentBusiness.id && !isSuperAdminUser) {
      showToast('Unauthorized: Cannot start job belonging to another tenant business.', 'error');
      return;
    }
    const startUpdates = {
      status: 'started' as const,
      beforePhotos: beforePhotos.length > 0 ? beforePhotos : (existingJob?.beforePhotos || []),
      startTime: new Date().toISOString(),
      notes: notes ? `${existingJob?.notes || ''}\nStart Notes: ${notes}` : (existingJob?.notes || ''),
    };

    const techUser = (users || []).find((u) => u.id === existingJob?.assignedStaffId) || currentUser;
    const techName = techUser?.name || 'Staff Technician';
    const customer = (customers || []).find((c) => c.id === existingJob?.customerId);

    if (isActuallyOffline) {
      addToSyncQueue('start_job', id, { beforePhotos, notes }, 'Technician started job work on site');
      showToast('Offline Mode: Job start logged locally & queued for sync.', 'info');
    } else {
      firestoreService.saveDocument<Job>('jobs', id, startUpdates);

      // Notify Business Owner that job execution has begun
      const startNotif: Notification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        businessId: currentBusiness.id,
        title: `Job Work Started: ${existingJob?.jobId || id}`,
        message: `Technician ${techName} has arrived at site and started work on ${existingJob?.jobId || id}.`,
        type: 'job',
        read: false,
        createdAt: new Date().toISOString(),
        senderUserId: currentUser?.id,
        senderRoleId: currentUser?.role,
        authorName: techName,
        targetRoleId: 'business_owner',
        jobId: existingJob?.jobId || id,
        jobTitle: existingJob?.description,
        jobLocation: existingJob?.location || customer?.address,
        customerName: customer?.name,
        customerPhone: customer?.mobile,
        scheduledDate: existingJob?.scheduledDate,
        scheduledTime: existingJob?.scheduledTimeSlot || existingJob?.scheduledTime,
        priority: existingJob?.priority,
        actionType: 'started',
      };
      saveToFirestore('notifications', startNotif.id, startNotif);
      seenNotifIdsRef.current.add(startNotif.id);

      logActivity('Job Work Started', 'job', id, 'Technician initiated work on site');
      showToast('Job started successfully', 'success');
    }
  };

  const completeJob = (
    id: string,
    data: {
      problemFound: string;
      solutionProvided: string;
      beforePhotos?: string[];
      afterPhotos: string[];
      customerSignature?: string;
      customerRating?: number;
      customerFeedback?: string;
      materialsUsed?: JobMaterialUsed[];
    }
  ) => {
    if (checkReadOnlySupportGuard()) return;
    const existingJob = jobs.find((j) => j.id === id);
    if (existingJob && existingJob.businessId !== currentBusiness.id && !isSuperAdminUser) {
      showToast('Unauthorized: Cannot complete job belonging to another tenant business.', 'error');
      return;
    }
    if (data.materialsUsed && data.materialsUsed.length > 0) {
      data.materialsUsed.forEach((used) => {
        const item = inventory.find((i) => i.id === used.inventoryItemId);
        if (item) {
          const newStock = Math.max(0, item.currentStock - used.quantity);
          firestoreService.saveDocument<InventoryItem>('inventory', item.id, { currentStock: newStock });
        }
      });
    }

    const completionData = {
      status: 'completed' as const,
      completionTime: new Date().toISOString(),
      problemFound: data.problemFound,
      solutionProvided: data.solutionProvided,
      beforePhotos: data.beforePhotos || existingJob?.beforePhotos || [],
      afterPhotos: data.afterPhotos,
      customerSignature: data.customerSignature || '',
      customerRating: data.customerRating || 5,
      customerFeedback: data.customerFeedback || '',
      materialsUsed: data.materialsUsed || [],
    };

    const assignedTech = (users || []).find((u) => u.id === existingJob?.assignedStaffId) || currentUser;
    const techName = assignedTech?.name || currentUser?.name || 'Staff Member';
    const customer = (customers || []).find((c) => c.id === existingJob?.customerId);

    // Create Notification doc in Firestore for Business Owner & Managers
    const completeNotif: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      businessId: currentBusiness.id,
      title: `Job Completed: ${existingJob?.jobId || id}`,
      message: `Staff ${techName} has completed job ${existingJob?.jobId || id} (${existingJob?.description || 'Service'}). Customer rating: ${data.customerRating || 5}★.`,
      type: 'job',
      read: false,
      createdAt: new Date().toISOString(),
      senderUserId: currentUser?.id,
      senderRoleId: currentUser?.role,
      authorName: techName,
      targetRoleId: 'business_owner',
      jobId: existingJob?.jobId || id,
      jobTitle: existingJob?.description,
      jobLocation: existingJob?.location || customer?.address,
      customerName: customer?.name,
      customerPhone: customer?.mobile,
      scheduledDate: existingJob?.scheduledDate,
      scheduledTime: existingJob?.scheduledTimeSlot || existingJob?.scheduledTime,
      priority: existingJob?.priority,
      actionType: 'completed',
    };
    saveToFirestore('notifications', completeNotif.id, completeNotif);
    seenNotifIdsRef.current.add(completeNotif.id);

    if (isActuallyOffline) {
      addToSyncQueue('complete_job', id, data, 'Technician completed job & recorded customer report/signature');
      showToast('Offline Mode: Job report saved locally & queued for sync!', 'success');
    } else {
      firestoreService.saveDocument<Job>('jobs', id, completionData);
      logActivity('Job Completed', 'job', id, `Technician ${techName} completed job work & obtained customer signature`);
      showToast('Job completed successfully', 'success');
    }
  };

  // Inventory Actions
  const addInventoryItem = (data: Omit<InventoryItem, 'id' | 'businessId'>) => {
    if (checkReadOnlySupportGuard()) return;
    const perm = canCreateRecord(currentUser, 'inventory');
    if (!perm.allowed) {
      showToast(perm.reason || 'Permission Denied: Cannot create inventory items.', 'error');
      return;
    }
    const newItem: InventoryItem = {
      ...data,
      id: `inv-${Date.now()}`,
      businessId: currentBusiness.id,
    };
    firestoreService.saveDocument<InventoryItem>('inventory', newItem.id, newItem);
    showToast(`Added inventory item: ${newItem.name}`, 'success');
  };

  const updateInventoryStock = (
    id: string,
    qty: number,
    type: 'stock_in' | 'stock_out' | 'adjustment',
    notes?: string
  ) => {
    if (checkReadOnlySupportGuard()) return;
    const item = inventory.find((i) => i.id === id);
    if (item && item.businessId !== currentBusiness.id && !isSuperAdminUser) {
      showToast('Unauthorized: Cannot adjust inventory belonging to another tenant business.', 'error');
      return;
    }
    if (item) {
      const diff = type === 'stock_out' ? -qty : qty;
      const newStock = Math.max(0, item.currentStock + diff);
      firestoreService.saveDocument<InventoryItem>('inventory', id, { currentStock: newStock });
    }
    const newTx: InventoryTransaction = {
      id: `tx-${Date.now()}`,
      businessId: currentBusiness.id,
      inventoryItemId: id,
      type,
      quantity: qty,
      notes,
      date: new Date().toISOString().split('T')[0],
      createdBy: currentUser?.name || 'System User',
    };
    firestoreService.saveDocument<InventoryTransaction>('inventoryTransactions', newTx.id, newTx);
    showToast(`Inventory stock adjusted (${type.replace('_', ' ')})`, 'success');
  };

  // Quotation Actions
  const addQuotation = (
    data: Omit<Quotation, 'id' | 'businessId' | 'quotationNumber'>,
    options?: { silentToast?: boolean }
  ) => {
    if (checkReadOnlySupportGuard()) return;
    const perm = canCreateRecord(currentUser, 'quotation');
    if (!perm.allowed) {
      showToast(perm.reason || 'Permission Denied: Cannot create quotations.', 'error');
      return;
    }
    const num = `QT-${new Date().getFullYear()}-${filteredQuotations.length + 101}`;
    const newQt: Quotation = {
      ...data,
      id: `qt-${Date.now()}`,
      businessId: currentBusiness.id,
      quotationNumber: num,
    };
    firestoreService.saveDocument<Quotation>('quotations', newQt.id, newQt);
    logActivity('Quotation Created', 'quotation', newQt.id, `Created quotation ${num}`);
    if (!options?.silentToast) {
      showToast(`Quotation ${num} created`, 'success');
    }
    return newQt;
  };

  const updateQuotationStatus = (id: string, status: Quotation['status']) => {
    if (checkReadOnlySupportGuard()) return;
    const perm = canUpdateRecord(currentUser, 'quotation');
    if (!perm.allowed) {
      showToast(perm.reason || 'Permission Denied: Only Business Owners can edit quotations.', 'error');
      return;
    }
    const target = quotations.find((q) => q.id === id);
    if (target && target.businessId !== currentBusiness.id && !isSuperAdminUser) {
      showToast('Unauthorized: Cannot modify quotation belonging to another tenant business.', 'error');
      return;
    }
    firestoreService.saveDocument<Quotation>('quotations', id, { status });
    showToast(`Quotation status changed to ${status}`, 'info');
  };

  const convertQuotationToInvoice = (quotationId: string) => {
    if (checkReadOnlySupportGuard()) return;
    const perm = canCreateRecord(currentUser, 'invoice');
    if (!perm.allowed) {
      showToast(perm.reason || 'Permission Denied: Cannot generate invoices.', 'error');
      return;
    }
    const qt = quotations.find((q) => q.id === quotationId);
    if (!qt) throw new Error('Quotation not found');
    if (qt.businessId !== currentBusiness.id && !isSuperAdminUser) {
      showToast('Unauthorized: Cannot convert quotation belonging to another tenant business.', 'error');
      return;
    }

    const invNum = `INV-${new Date().getFullYear()}-${filteredInvoices.length + 101}`;
    const newInv: Invoice = {
      id: `invc-${Date.now()}`,
      businessId: currentBusiness.id,
      invoiceNumber: invNum,
      quotationId: qt.id,
      customerId: qt.customerId,
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'pending',
      items: qt.items,
      subtotal: qt.subtotal,
      taxTotal: qt.taxTotal,
      discountTotal: qt.discountTotal,
      grandTotal: qt.grandTotal,
      paidAmount: 0,
      balanceAmount: qt.grandTotal,
      notes: `Converted from Quotation ${qt.quotationNumber}. ${qt.notes || ''}`,
    };

    firestoreService.saveDocument<Invoice>('invoices', newInv.id, newInv);
    firestoreService.saveDocument<Quotation>('quotations', quotationId, { status: 'approved' });
    logActivity('Converted Quote to Invoice', 'invoice', newInv.id, `Generated invoice ${invNum} from quote ${qt.quotationNumber}`);
    showToast(`Invoice ${invNum} created from Quotation ${qt.quotationNumber}!`, 'success');
    return newInv;
  };

  // Invoice Actions
  const addInvoice = (data: Omit<Invoice, 'id' | 'businessId' | 'invoiceNumber'>) => {
    if (checkReadOnlySupportGuard()) return;
    const perm = canCreateRecord(currentUser, 'invoice');
    if (!perm.allowed) {
      showToast(perm.reason || 'Permission Denied: Cannot create invoices.', 'error');
      return;
    }
    const num = `INV-${new Date().getFullYear()}-${filteredInvoices.length + 101}`;
    const id = `invc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newInv: Invoice = {
      ...data,
      id,
      businessId: currentBusiness.id,
      invoiceNumber: num,
    };
    firestoreService.saveDocument<Invoice>('invoices', newInv.id, newInv);
    logActivity('Invoice Created', 'invoice', newInv.id, `Created invoice ${num}`);
    showToast(`Invoice ${num} generated & synced to Firestore`, 'success');
    return newInv;
  };

  const deleteInvoice = (id: string) => {
    if (checkReadOnlySupportGuard()) return;
    const perm = canDeleteRecord(currentUser, 'invoice');
    if (!perm.allowed) {
      showToast(perm.reason || 'Permission Denied: Only Business Owners can delete invoices.', 'error');
      return;
    }
    const target = invoices.find((i) => i.id === id);
    if (target && target.businessId !== currentBusiness.id && !isSuperAdminUser) {
      showToast('Unauthorized: Cannot delete invoice belonging to another tenant business.', 'error');
      return;
    }
    firestoreService.deleteInvoice(id);
    logActivity('Invoice Deleted', 'invoice', id, 'Deleted invoice record from Firestore');
    showToast('Invoice deleted from Firestore', 'info');
  };

  const recordPayment = (data: Omit<Payment, 'id' | 'businessId'>) => {
    if (checkReadOnlySupportGuard()) return;
    const perm = canCreateRecord(currentUser, 'payment');
    if (!perm.allowed) {
      showToast(perm.reason || 'Permission Denied: Cannot record payment.', 'error');
      return;
    }
    const newPmt: Payment = {
      ...data,
      id: `pmt-${Date.now()}`,
      businessId: currentBusiness.id,
    };

    firestoreService.saveDocument<Payment>('payments', newPmt.id, newPmt);

    const inv = invoices.find((i) => i.id === data.invoiceId);
    if (inv) {
      if (inv.businessId !== currentBusiness.id && !isSuperAdminUser) {
        showToast('Unauthorized: Cannot record payment for invoice belonging to another tenant business.', 'error');
        return;
      }
      const newPaid = inv.paidAmount + data.amount;
      const newBalance = Math.max(0, inv.grandTotal - newPaid);
      const newStatus: Invoice['status'] =
        newBalance <= 0 ? 'paid' : newPaid > 0 ? 'partial' : 'pending';
      firestoreService.saveDocument<Invoice>('invoices', inv.id, {
        paidAmount: newPaid,
        balanceAmount: newBalance,
        status: newStatus,
      });
    }

    logActivity('Payment Recorded', 'payment', newPmt.id, `Recorded payment of ${currentBusiness.currency}${data.amount}`);
    showToast(`Payment of ${currentBusiness.currency}${data.amount} recorded!`, 'success');
    return newPmt;
  };

  // Contract Actions
  const addContract = (data: Omit<RecurringContract, 'id' | 'businessId' | 'contractNumber'>) => {
    if (checkReadOnlySupportGuard()) return;
    const perm = canCreateRecord(currentUser, 'contract');
    if (!perm.allowed) {
      showToast(perm.reason || 'Permission Denied: Cannot create service contracts.', 'error');
      return;
    }
    const num = `AMC-${new Date().getFullYear()}-${filteredContracts.length + 101}`;
    const newContract: RecurringContract = {
      ...data,
      id: `amc-${Date.now()}`,
      businessId: currentBusiness.id,
      contractNumber: num,
    };
    saveToFirestore('contracts', newContract.id, newContract);
    logActivity('Service Contract Created', 'contract', newContract.id, `Created contract ${num}`);
    showToast(`Service contract ${num} registered`, 'success');
    return newContract;
  };

  // Expense Actions
  const addExpense = (data: Omit<Expense, 'id' | 'businessId'>) => {
    if (checkReadOnlySupportGuard()) return;
    const perm = canCreateRecord(currentUser, 'expense');
    if (!perm.allowed) {
      showToast(perm.reason || 'Permission Denied: Cannot record expenses.', 'error');
      return;
    }
    const newExp: Expense = {
      ...data,
      id: `exp-${Date.now()}`,
      businessId: currentBusiness.id,
    };
    saveToFirestore('expenses', newExp.id, newExp);
    showToast(`Recorded expense: ${currentBusiness.currency}${newExp.amount}`, 'success');
  };

  // Staff & User Auth Actions
  const addStaff = async (data: Omit<User, 'id' | 'businessId'>): Promise<User | undefined> => {
    if (checkReadOnlySupportGuard()) return;
    const perm = canManageStaffMembers(currentUser);
    if (!perm.allowed) {
      showToast(perm.reason || 'Permission Denied: Only Business Owners can add staff members.', 'error');
      throw new Error(perm.reason || 'Permission Denied: Only Business Owners can add staff members.');
    }

    const normalizedEmail = (data.email || '').trim().toLowerCase();
    const cleanPhoneDigits = (data.phone || '').replace(/[^0-9]/g, '');

    // 1. Check against current Business Owner and Business Contact Info
    const bizEmail = (currentBusiness.email || '').trim().toLowerCase();
    const bizPhoneDigits = (currentBusiness.mobile || '').replace(/[^0-9]/g, '');

    if (bizEmail && normalizedEmail && bizEmail === normalizedEmail) {
      const msg = `Cannot use Business Owner's email address (${data.email}) for a staff member. Please provide a unique email address.`;
      showToast(msg, 'error');
      throw new Error(msg);
    }

    if (
      cleanPhoneDigits.length >= 10 &&
      bizPhoneDigits.length >= 10 &&
      bizPhoneDigits.slice(-10) === cleanPhoneDigits.slice(-10)
    ) {
      const msg = `Cannot use Business Owner's phone number (${data.phone}) for a staff member. Please provide a unique mobile number.`;
      showToast(msg, 'error');
      throw new Error(msg);
    }

    if (currentBusiness.id !== 'all' && currentUser?.role !== 'super_admin') {
      const activeTenantStaff = (users || []).filter(
        (u) =>
          u.businessId === currentBusiness.id &&
          (u.status === 'active' || !u.status) &&
          u.role !== 'super_admin' &&
          u.role !== 'business_owner'
      );
      const capacity = checkStaffCapacity(activeTenantStaff.length, currentBusiness.planId || currentBusiness.plan);
      if (!capacity.allowed) {
        showToast(
          capacity.message ||
            `Staff limit reached (${activeTenantStaff.length}/${capacity.maxStaff}) for ${capacity.planName} plan. Upgrade to add more staff.`,
          'error'
        );
        return;
      }
    }

    try {
      const result = await AuthService.createStaffMember({
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: (data.role === 'manager' ? 'manager' : 'technician'),
        businessId: currentBusiness.id,
        skills: data.skills,
        password: data.password || 'ServiFlow@123',
      });

      const newStaff: User = {
        ...result.user,
        ...data,
        id: result.user.id,
        businessId: currentBusiness.id,
        approvalStatus: 'active',
        status: data.status || 'active',
      };

      setUsers((prev) => [...prev.filter((u) => u.id !== newStaff.id), newStaff]);
      showToast(`Staff member "${newStaff.name}" added and assigned to ${currentBusiness.name}`, 'success');
      logActivity('Staff Created', 'staff', newStaff.id, `Created staff member ${newStaff.name} as ${newStaff.role}`);
      return newStaff;
    } catch (err: any) {
      console.error('Error creating staff member:', err);
      showToast(err.message || 'Failed to create staff member. Please check details.', 'error');
      throw err;
    }
  };

  const deleteStaff = async (userId: string) => {
    if (checkReadOnlySupportGuard()) return;
    const perm = canManageStaffMembers(currentUser);
    if (!perm.allowed) {
      showToast(perm.reason || 'Permission Denied: Only Business Owners can delete staff members.', 'error');
      return;
    }
    const target = users.find((u) => u.id === userId);
    if (!target) return;
    if (target.businessId !== currentBusiness.id && !isSuperAdminUser) {
      showToast('Unauthorized: Cannot delete staff account belonging to another tenant business.', 'error');
      return;
    }
    
    // Update local state immediately so UI and limits reflect deletion without delay
    setUsers((prev) => {
      const updated = prev.filter((u) => u.id !== userId);
      saveCache('serviflow_users_cache', updated);
      return updated;
    });

    // Delete user and membership docs from Firestore
    deleteFromFirestore('users', userId);
    deleteFromFirestore('tenantMembers', `${target.businessId}_${userId}`);

    // If any legacy docs match target email for this tenant, clean them up as well
    if (target.email) {
      try {
        const q = query(
          collection(db, 'users'),
          where('email', '==', target.email.toLowerCase()),
          where('businessId', '==', target.businessId)
        );
        const snap = await getDocs(q);
        snap.docs.forEach((d) => {
          if (d.id !== userId) {
            deleteFromFirestore('users', d.id);
            deleteFromFirestore('tenantMembers', `${target.businessId}_${d.id}`);
          }
        });
      } catch (cleanErr) {
        console.warn('Staff cleanup note:', cleanErr);
      }
    }

    logActivity('Staff Deleted', 'staff', userId, `Deleted staff member ${target.name || target.email}`);
    showToast(`Deleted staff account "${target.name || target.email}"`, 'info');
  };

  const updateBusinessAndOwnerStatus = (
    businessId: string,
    newStatus: 'active' | 'pending' | 'rejected' | 'suspended'
  ) => {
    saveToFirestore('businesses', businessId, { status: newStatus });
    saveToFirestore('tenants', businessId, { status: newStatus });
    setBusinesses((prev) => {
      const updated = prev.map((b) => (b.id === businessId ? { ...b, status: newStatus } : b));
      saveCache('serviflow_businesses_cache', updated);
      return updated;
    });

    const targetStatus: 'active' | 'inactive' = newStatus === 'active' ? 'active' : 'inactive';
    const ownerUsers = users.filter((u) => u.businessId === businessId && u.role === 'business_owner');
    ownerUsers.forEach((owner) => {
      const userUpdates: Partial<User> = {
        approvalStatus: newStatus,
        status: targetStatus,
      };
      saveToFirestore('users', owner.id, userUpdates);
      saveToFirestore('tenantMembers', `${businessId}_${owner.id}`, {
        status: newStatus === 'active' ? 'active' : 'suspended',
        updatedAt: new Date().toISOString(),
      });
    });

    setUsers((prev) => {
      const updated = prev.map((u) =>
        u.businessId === businessId && u.role === 'business_owner'
          ? {
              ...u,
              approvalStatus: newStatus,
              status: targetStatus,
            }
          : u
      );
      saveCache('serviflow_users_cache', updated);
      return updated;
    });

    const targetBiz = businesses.find((b) => b.id === businessId);
    const bizName = targetBiz?.name || businessId;

    if (newStatus === 'active') {
      showToast(`Approved business registration for "${bizName}". Owner can now log in.`, 'success');
      logActivity('Business Approved', 'staff', businessId, `Super Admin approved business ${bizName}`);
    } else if (newStatus === 'rejected') {
      showToast(`Rejected business registration for "${bizName}".`, 'info');
      logActivity('Business Rejected', 'staff', businessId, `Super Admin rejected business ${bizName}`);
    } else if (newStatus === 'suspended') {
      showToast(`Suspended account access for business "${bizName}".`, 'error');
      logActivity('Business Suspended', 'staff', businessId, `Super Admin suspended business ${bizName}`);
    }
  };

  const updateUserStatus = (
    userId: string,
    newApprovalStatus: 'active' | 'pending' | 'rejected' | 'blocked' | 'suspended'
  ) => {
    const perm = canManageStaffMembers(currentUser);
    if (!perm.allowed) {
      showToast(perm.reason || 'Permission Denied: Only Business Owners can approve or change staff status.', 'error');
      return;
    }
    const target = users.find((u) => u.id === userId);
    if (!target) return;

    const targetStatus: 'active' | 'inactive' = newApprovalStatus === 'active' ? 'active' : 'inactive';
    const updates: Partial<User> = {
      approvalStatus: newApprovalStatus,
      status: targetStatus,
    };

    saveToFirestore('users', userId, updates);
    setUsers((prev) => {
      const updated = prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              approvalStatus: newApprovalStatus,
              status: targetStatus,
            }
          : u
      );
      saveCache('serviflow_users_cache', updated);
      return updated;
    });

    if (newApprovalStatus === 'active') {
      showToast(`Approved & activated account for ${target.name}`, 'success');
      logActivity('User Approved', 'staff', userId, `Approved account access for ${target.name} (${target.role})`);
    } else if (newApprovalStatus === 'rejected') {
      showToast(`Rejected registration for ${target.name}`, 'info');
      logActivity('User Rejected', 'staff', userId, `Rejected registration request for ${target.name}`);
    } else if (newApprovalStatus === 'blocked') {
      showToast(`Blocked account access for ${target.name}`, 'error');
      logActivity('User Blocked', 'staff', userId, `Blocked user access for ${target.name}`);
    } else {
      showToast(`Updated user status for ${target.name}`, 'info');
    }
  };

  const updateUserPassword = async (userId: string, newPassword: string) => {
    const cleanPass = newPassword.trim();
    await saveToFirestore('users', userId, { password: cleanPass });

    setUsers((prev) => {
      const updated = prev.map((u) => (u.id === userId ? { ...u, password: cleanPass } : u));
      saveCache('serviflow_users_cache', updated);
      return updated;
    });

    if (currentUser?.id === userId) {
      const updatedUser = { ...currentUser, password: cleanPass };
      setCurrentUser(updatedUser);
      localStorage.setItem('serviflow_user_session', JSON.stringify(updatedUser));
    }

    if (auth.currentUser && currentUser?.id === userId) {
      try {
        await firebaseUpdatePassword(auth.currentUser, cleanPass);
      } catch (err) {
        console.warn('Firebase Auth update password notice:', err);
      }
    }

    showToast('Password updated successfully!', 'success');
    logActivity('Password Changed', 'staff', userId, 'User updated account password');
  };

  const updateUserProfile = async (userId: string, updates: Partial<User>) => {
    await saveToFirestore('users', userId, updates);
    setUsers((prev) => {
      const updated = prev.map((u) => (u.id === userId ? { ...u, ...updates } : u));
      saveCache('serviflow_users_cache', updated);
      return updated;
    });

    if (currentUser?.id === userId) {
      const updatedUser = { ...currentUser, ...updates };
      setCurrentUser(updatedUser);
      localStorage.setItem('serviflow_user_session', JSON.stringify(updatedUser));
    }

    logActivity('Profile Updated', 'staff', userId, `Updated user profile details for ${updates.name || currentUser?.name}`);
    showToast('Profile information updated successfully!', 'success');
  };

  const registerUser = async (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: UserRole;
    businessId?: string;
    businessName?: string;
    businessType?: string;
    serviceDomain?: string;
    customServiceName?: string | null;
    referralCode?: string;
  }): Promise<{ user: User; isPending: boolean }> => {
    const normalizedEmail = (data.email || '').trim().toLowerCase();
    const cleanPhoneDigits = (data.phone || '').replace(/[^0-9]/g, '');

    if (normalizedEmail === 'admin@serviflow.io' || normalizedEmail === 'superadmin@serviflow.io') {
      const errorMsg = 'This email address is reserved for Platform Super Admin. Please use your business email address.';
      showToast(errorMsg, 'error');
      throw new Error(errorMsg);
    }

    // 1. Duplicate Account Check - Only flag as duplicate if the user belongs to an active existing business tenant
    const existingAccount = users.find((u) => {
      const uEmail = (u.email || '').trim().toLowerCase();
      const uPhoneDigits = (u.phone || '').replace(/[^0-9]/g, '');
      const isEmailMatch = uEmail && normalizedEmail && uEmail === normalizedEmail;
      const isPhoneMatch =
        cleanPhoneDigits.length >= 10 &&
        uPhoneDigits.length >= 10 &&
        uPhoneDigits.slice(-10) === cleanPhoneDigits.slice(-10);

      if (!isEmailMatch && !isPhoneMatch) return false;
      if (u.role === 'super_admin') return false;

      // If the user's business tenant was deleted, this is not an active duplicate
      const hasActiveBusiness = businesses.some((b) => b.id === u.businessId);
      return hasActiveBusiness;
    });

    if (existingAccount) {
      const matchedField =
        existingAccount.email?.trim().toLowerCase() === normalizedEmail
          ? `Email address (${data.email})`
          : `Mobile number (${data.phone})`;
      const errorMsg = `${matchedField} is already registered with an active business. Please login to your account.`;
      showToast(errorMsg, 'error');
      throw new Error(errorMsg);
    }

    if (data.role === 'business_owner') {
      try {
        const cleanRefCode = (data.referralCode || '').trim().toUpperCase();

        const { user: newOwner, tenant: newTenant } = await AuthService.signUpOwner({
          name: data.name,
          email: data.email,
          phone: data.phone,
          password: data.password,
          businessName: data.businessName || `${data.name}'s Business`,
          businessType: data.businessType || 'CCTV & Security Systems',
          serviceDomain: data.serviceDomain || data.businessType || 'CCTV & Security Systems',
          customServiceName: data.customServiceName || null,
          referredBy: cleanRefCode || undefined,
        });

        // If registered with referral code, find referrer and process 10% discount & 10% bonus
        if (cleanRefCode) {
          const referrerBiz = businesses.find(
            (b) => (b.referralCode || '').trim().toUpperCase() === cleanRefCode
          );
          const referrerUser = users.find(
            (u) => (u.referralCode || '').trim().toUpperCase() === cleanRefCode
          );
          const matchedBiz = referrerBiz || (referrerUser?.businessId ? businesses.find((b) => b.id === referrerUser?.businessId) : undefined);

          if (matchedBiz) {
            // Plan default value calculation: Standard Pro plan (₹1,299/mo)
            const planPrice = 1299;
            const discountPercent = 10;
            const discountAmount = Math.round((planPrice * discountPercent) / 100); // ₹130
            const bonusPercent = 10;
            const bonusEarned = Math.round((planPrice * bonusPercent) / 100); // ₹130

            const newReferralRecord: ReferralRecord = {
              id: `ref-tx-${Date.now()}`,
              referrerBusinessId: matchedBiz.id,
              referrerUserId: referrerUser?.id,
              referrerCode: matchedBiz.referralCode || cleanRefCode,
              referrerBusinessName: matchedBiz.name,
              referredBusinessId: newTenant.id,
              referredBusinessName: newTenant.name,
              referredOwnerName: newOwner.name,
              referredOwnerPhone: newOwner.phone,
              planId: newTenant.planId || 'plan-pro',
              planName: 'Professional Plan (10% Referral Discount)',
              planPrice,
              discountPercent,
              discountAmount,
              bonusPercent,
              bonusEarned,
              status: 'credited',
              createdAt: new Date().toISOString(),
              notes: `10% discount (-₹${discountAmount}) applied for ${newTenant.name}. 10% referral bonus (+₹${bonusEarned}) credited to ${matchedBiz.name}.`,
            };

            await saveToFirestore('referrals', newReferralRecord.id, newReferralRecord);
            setReferralRecords((prev) => [newReferralRecord, ...prev.filter((r) => r.id !== newReferralRecord.id)]);

            // Update referrer business balance & earnings
            const updatedEarnings = (matchedBiz.referralEarnings || 0) + bonusEarned;
            const updatedBalance = (matchedBiz.referralBalance || 0) + bonusEarned;
            await saveToFirestore('businesses', matchedBiz.id, {
              referralEarnings: updatedEarnings,
              referralBalance: updatedBalance,
            });

            // Send Realtime In-App Notification to Referrer
            const bonusNotification: Notification = {
              id: `notif-ref-${Date.now()}`,
              businessId: matchedBiz.id,
              title: `🎉 10% Referral Bonus Credited: +₹${bonusEarned}!`,
              message: `${newOwner.name} ("${newTenant.name}") registered using your referral code "${cleanRefCode}". ₹${bonusEarned} bonus has been credited to your referral wallet!`,
              type: 'payment',
              read: false,
              createdAt: new Date().toISOString(),
            };
            await saveToFirestore('notifications', bonusNotification.id, bonusNotification);

            logActivity(
              'Referral Bonus Credited',
              'financials',
              newReferralRecord.id,
              `Referrer "${matchedBiz.name}" earned ₹${bonusEarned} (10%) from signup of "${newTenant.name}"`
            );
          }
        }

        // Set active session
        localStorage.setItem('serviflow_user_session', JSON.stringify(newOwner));
        localStorage.setItem('serviflow_logged_in_email', newOwner.email);
        localStorage.setItem('serviflow_logged_in_uid', newOwner.id);

        setCurrentUser(newOwner);
        setCurrentBusiness(newTenant);

        // Update local caches
        setBusinesses((prev) => [...prev.filter((b) => b.id !== newTenant.id), newTenant]);
        setUsers((prev) => [...prev.filter((u) => u.id !== newOwner.id), newOwner]);

        if (cleanRefCode) {
          showToast(`Welcome to ServiFlow! 10% Referral Discount applied to your account.`, 'success');
        } else {
          showToast(`Business "${newTenant.name}" registered successfully! Welcome to ServiFlow.`, 'success');
        }
        return { user: newOwner, isPending: false };
      } catch (err: any) {
        console.error('Sign up error:', err);
        showToast(err.message || 'Registration failed', 'error');
        throw err;
      }
    } else {
      const errorMsg = 'Staff and field executives cannot self-register. Please ask your Business Owner to add you from their ServiFlow dashboard.';
      showToast(errorMsg, 'error');
      throw new Error(errorMsg);
    }
  };

  // Referral System Actions
  const validateReferralCode = (code: string) => {
    const clean = (code || '').trim().toUpperCase();
    if (!clean) {
      return {
        isValid: false,
        discountPercent: 0,
        bonusPercent: 0,
        message: 'Please enter a referral code.',
      };
    }

    const matchedBiz = businesses.find(
      (b) => (b.referralCode || '').trim().toUpperCase() === clean
    );
    const matchedUser = users.find(
      (u) => (u.referralCode || '').trim().toUpperCase() === clean
    );

    if (matchedBiz || matchedUser) {
      const bizName = matchedBiz?.name || matchedUser?.name || 'Verified Partner';
      return {
        isValid: true,
        referrerBusiness: matchedBiz,
        referrerUser: matchedUser,
        discountPercent: 10,
        bonusPercent: 10,
        message: `Valid code from ${bizName}! 10% Discount will be applied at signup & subscription.`,
      };
    }

    return {
      isValid: false,
      discountPercent: 0,
      bonusPercent: 0,
      message: 'Invalid referral code. Please check and try again.',
    };
  };

  const requestReferralPayout = async (params: {
    amount: number;
    payoutMethod: 'upi' | 'bank_transfer' | 'subscription_credit';
    upiId?: string;
    bankAccount?: {
      accountNumber: string;
      ifsc: string;
      holderName: string;
    };
    notes?: string;
  }): Promise<ReferralPayoutRequest> => {
    if (!currentBusiness) throw new Error('No active business tenant found.');
    const currentBal = currentBusiness.referralBalance || 0;

    if (params.amount > currentBal) {
      throw new Error(`Insufficient referral wallet balance. Available: ₹${currentBal}`);
    }
    if (params.amount <= 0) {
      throw new Error('Please enter a valid payout amount greater than 0.');
    }

    const newPayoutReq: ReferralPayoutRequest = {
      id: `payout-${Date.now()}`,
      businessId: currentBusiness.id,
      businessName: currentBusiness.name,
      ownerName: currentUser?.name || currentBusiness.name,
      ownerPhone: currentUser?.phone || currentBusiness.mobile || '',
      amount: params.amount,
      payoutMethod: params.payoutMethod,
      upiId: params.upiId,
      bankAccount: params.bankAccount,
      status: params.payoutMethod === 'subscription_credit' ? 'completed' : 'pending',
      requestedAt: new Date().toISOString(),
      processedAt: params.payoutMethod === 'subscription_credit' ? new Date().toISOString() : undefined,
      notes: params.notes,
    };

    // Deduct balance from business
    const newBal = currentBal - params.amount;
    await saveToFirestore('businesses', currentBusiness.id, { referralBalance: newBal });
    setCurrentBusiness((prev) => (prev ? { ...prev, referralBalance: newBal } : null));

    await saveToFirestore('referralPayouts', newPayoutReq.id, newPayoutReq);
    setReferralPayoutRequests((prev) => [newPayoutReq, ...prev.filter((p) => p.id !== newPayoutReq.id)]);

    if (params.payoutMethod === 'subscription_credit') {
      showToast(`₹${params.amount} credited directly towards your upcoming subscription bill!`, 'success');
    } else {
      showToast(`Payout request for ₹${params.amount} submitted successfully! Admin will process via ${params.payoutMethod.toUpperCase()}.`, 'success');
    }

    logActivity(
      'Referral Payout Requested',
      'financials',
      newPayoutReq.id,
      `Requested ₹${params.amount} via ${params.payoutMethod}`
    );

    return newPayoutReq;
  };

  const processReferralPayout = (
    requestId: string,
    newStatus: 'approved' | 'rejected' | 'completed',
    notes?: string
  ) => {
    const req = referralPayoutRequests.find((p) => p.id === requestId);
    if (!req) return;

    const updates: Partial<ReferralPayoutRequest> = {
      status: newStatus,
      processedAt: new Date().toISOString(),
      notes: notes || req.notes,
    };

    // If rejected, refund balance back to business
    if (newStatus === 'rejected' && req.status === 'pending') {
      const biz = businesses.find((b) => b.id === req.businessId);
      if (biz) {
        const restoredBal = (biz.referralBalance || 0) + req.amount;
        saveToFirestore('businesses', biz.id, { referralBalance: restoredBal });
        if (currentBusiness?.id === biz.id) {
          setCurrentBusiness((prev) => (prev ? { ...prev, referralBalance: restoredBal } : null));
        }
      }
    }

    saveToFirestore('referralPayouts', requestId, updates);
    setReferralPayoutRequests((prev) =>
      prev.map((p) => (p.id === requestId ? { ...p, ...updates } : p))
    );
    showToast(`Payout request ${requestId} updated to ${newStatus}.`, 'success');
    logActivity('Referral Payout Processed', 'financials', requestId, `Status updated to ${newStatus}`);
  };

  const createManualReferralLink = async (params: {
    referrerBusinessId: string;
    referredBusinessId: string;
    bonusAmount?: number;
    discountAmount?: number;
    notes?: string;
  }): Promise<ReferralRecord> => {
    const referrer = businesses.find((b) => b.id === params.referrerBusinessId);
    const referred = businesses.find((b) => b.id === params.referredBusinessId);
    const referredOwner = users.find((u) => u.businessId === params.referredBusinessId && u.role === 'business_owner');

    if (!referrer || !referred) {
      throw new Error('Both parent (referrer) and child (referred) businesses must be valid.');
    }

    const bonusVal = params.bonusAmount !== undefined ? params.bonusAmount : 130;
    const discountVal = params.discountAmount !== undefined ? params.discountAmount : 130;

    const refRecord: ReferralRecord = {
      id: `ref-tx-${Date.now()}`,
      referrerBusinessId: referrer.id,
      referrerCode: referrer.referralCode || `SF-${referrer.name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase()}10`,
      referrerBusinessName: referrer.name,
      referredBusinessId: referred.id,
      referredBusinessName: referred.name,
      referredOwnerName: referredOwner?.name || referred.name,
      referredOwnerPhone: referredOwner?.phone || referred.mobile,
      planId: referred.planId || 'plan-pro',
      planName: 'Professional Plan (Parent-Child Link)',
      planPrice: 1299,
      discountPercent: 10,
      discountAmount: discountVal,
      bonusPercent: 10,
      bonusEarned: bonusVal,
      status: 'credited',
      createdAt: new Date().toISOString(),
      notes: params.notes || `Manual parent-child relationship established by Super Admin.`,
    };

    await saveToFirestore('referrals', refRecord.id, refRecord);
    setReferralRecords((prev) => [refRecord, ...prev.filter((r) => r.id !== refRecord.id)]);

    // Update referrer business balance & earnings in Firestore and local state
    const newEarnings = (referrer.referralEarnings || 0) + bonusVal;
    const newBalance = (referrer.referralBalance || 0) + bonusVal;
    await saveToFirestore('businesses', referrer.id, {
      referralEarnings: newEarnings,
      referralBalance: newBalance,
    });
    setBusinesses((prev) =>
      prev.map((b) =>
        b.id === referrer.id ? { ...b, referralEarnings: newEarnings, referralBalance: newBalance } : b
      )
    );

    // Also mark referred business as referredBy
    await saveToFirestore('businesses', referred.id, {
      referredBy: refRecord.referrerCode,
      referralDiscountApplied: true,
    });
    setBusinesses((prev) =>
      prev.map((b) =>
        b.id === referred.id
          ? { ...b, referredBy: refRecord.referrerCode, referralDiscountApplied: true }
          : b
      )
    );

    showToast(`Referral partnership created: ${referrer.name} -> ${referred.name} (+₹${bonusVal} credited)`, 'success');
    logActivity('Manual Referral Created', 'financials', refRecord.id, `Linked parent ${referrer.name} to child ${referred.name}`);
    return refRecord;
  };

  const deleteReferralRecord = async (referralId: string): Promise<void> => {
    const target = referralRecords.find((r) => r.id === referralId);
    if (!target) return;

    try {
      await FirestoreService.deleteReferral(referralId);
      setReferralRecords((prev) => prev.filter((r) => r.id !== referralId));
      showToast(`Referral record deleted from Firestore.`, 'success');
      logActivity('Referral Deleted', 'financials', referralId, `Deleted referral record between ${target.referrerBusinessName} and ${target.referredBusinessName}`);
    } catch (err) {
      console.error('Error deleting referral record:', err);
      showToast('Failed to delete referral record', 'error');
    }
  };

  const settleReferralBonusDirectly = async (params: {
    businessId: string;
    amount: number;
    payoutMethod: 'upi' | 'bank_transfer' | 'subscription_credit';
    upiId?: string;
    bankAccount?: {
      accountNumber: string;
      ifsc: string;
      holderName: string;
    };
    transactionReference?: string;
    notes?: string;
  }): Promise<ReferralPayoutRequest> => {
    const targetBiz = businesses.find((b) => b.id === params.businessId);
    if (!targetBiz) throw new Error('Target business not found.');
    const owner = users.find((u) => u.businessId === targetBiz.id && u.role === 'business_owner');

    const payoutReq: ReferralPayoutRequest = {
      id: `payout-${Date.now()}`,
      businessId: targetBiz.id,
      businessName: targetBiz.name,
      ownerName: owner?.name || targetBiz.name,
      ownerPhone: owner?.phone || targetBiz.mobile || '',
      amount: params.amount,
      payoutMethod: params.payoutMethod,
      upiId: params.upiId,
      bankAccount: params.bankAccount,
      status: 'completed',
      requestedAt: new Date().toISOString(),
      processedAt: new Date().toISOString(),
      notes: params.transactionReference
        ? `Settled by Super Admin. Ref / UTR: ${params.transactionReference}${params.notes ? ` | Note: ${params.notes}` : ''}`
        : params.notes || 'Settled directly by Super Admin',
    };

    // Deduct balance from business
    const curBal = targetBiz.referralBalance || 0;
    const newBal = Math.max(0, curBal - params.amount);
    await saveToFirestore('businesses', targetBiz.id, { referralBalance: newBal });
    setBusinesses((prev) =>
      prev.map((b) => (b.id === targetBiz.id ? { ...b, referralBalance: newBal } : b))
    );
    if (currentBusiness?.id === targetBiz.id) {
      setCurrentBusiness((prev) => (prev ? { ...prev, referralBalance: newBal } : null));
    }

    await saveToFirestore('referralPayouts', payoutReq.id, payoutReq);
    setReferralPayoutRequests((prev) => [payoutReq, ...prev.filter((p) => p.id !== payoutReq.id)]);

    showToast(`Successfully settled ₹${params.amount} bonus for ${targetBiz.name}!`, 'success');
    logActivity('Referral Bonus Settled', 'financials', payoutReq.id, `Settled ₹${params.amount} for ${targetBiz.name} via ${params.payoutMethod.toUpperCase()}`);
    return payoutReq;
  };

  const updateBusinessSettings = async (updates: Partial<Business>): Promise<void> => {
    const perm = canManageBusinessSettings(currentUser);
    if (!perm.allowed) {
      showToast(perm.reason || 'Permission Denied: Only Business Owners can modify business settings.', 'error');
      throw new Error(perm.reason || 'Permission Denied: Only Business Owners can modify business settings.');
    }

    const targetBizId = currentBusiness?.id;
    if (!targetBizId || targetBizId === 'all') {
      showToast('No active business selected.', 'error');
      return;
    }

    const updated: Business = { ...currentBusiness, ...updates };
    setCurrentBusiness(updated);
    saveCache('serviflow_current_biz_cache', updated);

    setBusinesses((prev) => {
      const updatedList = prev.map((b) => (b.id === updated.id ? updated : b));
      saveCache('serviflow_businesses_cache', updatedList);
      return updatedList;
    });

    try {
      await saveToFirestore('businesses', targetBizId, updates);
      await saveToFirestore('tenants', targetBizId, updates);
      logActivity('Business Settings Updated', 'staff', targetBizId, `Updated business profile for ${updated.name}`);
      showToast('Business profile & settings updated successfully!', 'success');
    } catch (err: any) {
      console.error('Error persisting business profile update to Firestore:', err);
      showToast('Business profile updated locally. Sync warning: ' + (err?.message || 'Check network'), 'info');
    }
  };

  const markNotificationRead = (id: string) => {
    saveToFirestore('notifications', id, { read: true });
  };

  // -------------------------------------------------------------
  // ATTENDANCE & GPS VERIFICATION ENGINE
  // -------------------------------------------------------------
  const checkInAttendance = async (params: {
    staffId?: string;
    targetType: AttendanceLocationType;
    targetLocationIdOrJobId?: string;
    notes?: string;
    bypassGps?: boolean;
    overrideCoords?: { lat: number; lng: number };
  }): Promise<{ success: boolean; message: string; record?: AttendanceRecord; errorType?: string }> => {
    try {
      const activeStaffId = params.staffId || currentUser?.id;
      if (!activeStaffId) {
        return { success: false, message: 'No staff user specified for attendance check-in.', errorType: 'NO_STAFF' };
      }
      const staffUser = users.find((u) => u.id === activeStaffId) || (currentUser?.id === activeStaffId ? currentUser : null);
      if (!staffUser) {
        return { success: false, message: 'Staff member record not found.', errorType: 'STAFF_NOT_FOUND' };
      }

      const tenantId = staffUser.businessId || currentBusiness?.id || 'biz-default';
      const todayDate = new Date().toISOString().split('T')[0];

      // Check if already checked in today and workingState is 'working'
      const existingToday = attendanceRecords.find(
        (a) => a.staffId === activeStaffId && a.date === todayDate && a.workingState === 'working'
      );
      if (existingToday) {
        return {
          success: false,
          message: `Already checked in today at ${existingToday.checkInTime || 'work'}.`,
          record: existingToday,
          errorType: 'ALREADY_CHECKED_IN',
        };
      }

      const rules: AttendanceWorkingRules = currentBusiness?.attendanceWorkingRules || DEFAULT_ATTENDANCE_RULES;

      // 1. Acquire GPS position
      let lat = 0;
      let lng = 0;
      let accuracy = 10;

      if (params.overrideCoords) {
        lat = params.overrideCoords.lat;
        lng = params.overrideCoords.lng;
        accuracy = 10;
      } else if (params.bypassGps && (currentUser?.role === 'business_owner' || currentUser?.role === 'super_admin')) {
        lat = 0;
        lng = 0;
        accuracy = 0;
      } else {
        try {
          const gpsRes = await getCurrentGpsPosition();
          lat = gpsRes.latitude;
          lng = gpsRes.longitude;
          accuracy = gpsRes.accuracy;
        } catch (gpsErr: any) {
          const errMsg = gpsErr?.userFriendlyMessage || gpsErr?.message || 'Unable to capture GPS location. Please ensure Location services are enabled.';
          return {
            success: false,
            message: errMsg,
            errorType: gpsErr?.code || 'GPS_FAILED',
          };
        }
      }

      // 2. Perform Geofence and Location verification
      let verification = verifyLocationAgainstRules(
        lat,
        lng,
        accuracy,
        attendanceLocations.filter((l) => l.businessId === tenantId && l.isActive),
        params.targetType,
        params.targetLocationIdOrJobId,
        jobs.filter((j) => j.businessId === tenantId),
        rules
      );

      // If bypassing GPS as admin
      if (params.bypassGps && (currentUser?.role === 'business_owner' || currentUser?.role === 'super_admin')) {
        verification = {
          isValid: true,
          verificationStatus: 'verified',
          matchedLocationName: 'Administrative Manual Check-In',
          matchedLocationType: params.targetType,
          distanceMeters: 0,
          allowedRadiusMeters: 500,
          accuracyMeters: 0,
          reason: 'Verified via Administrative Override',
        };
      }

      // If requireGPSVerification is enabled and verification failed -> Block action
      if (rules.requireGPSVerification && !verification.isValid) {
        return {
          success: false,
          message: `Location Verification Failed: You are ${formatDistance(verification.distanceMeters)} away from ${verification.matchedLocationName || 'the assigned work area'} (Max allowed: ${verification.allowedRadiusMeters}m).`,
          errorType: 'OUT_OF_GEOFENCE',
        };
      }

      // 3. Evaluate punctuality
      const now = new Date();
      const nowIso = now.toISOString();
      const punctuality = evaluatePunctuality(now, rules);

      const recordId = `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newRecord: AttendanceRecord = {
        id: recordId,
        businessId: tenantId,
        staffId: activeStaffId,
        staffName: staffUser.name,
        staffRole: staffUser.role,
        staffEmail: staffUser.email,
        staffPhone: staffUser.phone,
        date: todayDate,
        status: punctuality.isLate ? 'late' : 'present',
        workingState: 'working',
        checkInTime: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        checkInTimestamp: now.getTime(),
        checkInLat: lat,
        checkInLng: lng,
        checkInAccuracy: accuracy,
        checkInVerificationStatus: verification.verificationStatus,
        checkInType: verification.matchedLocationType,
        checkInLocationName: verification.matchedLocationName,
        checkInDistance: verification.distanceMeters,
        checkInNotes: params.notes,
        isLate: punctuality.isLate,
        lateMinutes: punctuality.lateMinutes,
        overallVerificationStatus: verification.verificationStatus,
        createdAt: nowIso,
        updatedAt: nowIso,
        auditTrail: [
          {
            id: `audit-${Date.now()}`,
            attendanceId: recordId,
            businessId: tenantId,
            eventType: 'check_in',
            timestamp: nowIso,
            userId: currentUser?.id || activeStaffId,
            userName: currentUser?.name || staffUser.name,
            userRole: currentUser?.role || staffUser.role,
            details: `Checked in at ${verification.matchedLocationName || 'Location'} (Status: ${verification.verificationStatus}, Distance: ${formatDistance(verification.distanceMeters)}${punctuality.isLate ? `, Late by ${punctuality.lateMinutes}m` : ''})`,
            coordinates: {
              lat,
              lng,
              accuracy,
              distance: verification.distanceMeters,
              targetLocationName: verification.matchedLocationName,
            },
          },
        ],
      };

      // Save to state and Firestore
      setAttendanceRecords((prev) => [newRecord, ...prev.filter((r) => r.id !== recordId)]);
      await saveToFirestore('attendance', recordId, newRecord);

      // Save audit log
      const auditEntry: AttendanceAuditItem = {
        id: `aud-att-${Date.now()}`,
        attendanceId: recordId,
        businessId: tenantId,
        eventType: 'check_in',
        timestamp: nowIso,
        userId: currentUser?.id || activeStaffId,
        userName: currentUser?.name || staffUser.name,
        userRole: currentUser?.role || staffUser.role,
        details: `Staff ${staffUser.name} checked in at ${verification.matchedLocationName || 'Location'} (${punctuality.isLate ? 'Late Arrival' : 'On-Time'})`,
        coordinates: {
          lat,
          lng,
          accuracy,
          distance: verification.distanceMeters,
          targetLocationName: verification.matchedLocationName,
        },
      };
      setAttendanceAuditLogs((prev) => [auditEntry, ...prev]);
      await saveToFirestore('attendanceAuditLogs', auditEntry.id, auditEntry);

      logActivity(
        'Attendance Checked In',
        'staff',
        recordId,
        `${staffUser.name} checked in (${punctuality.isLate ? 'Late' : 'On-time'}) at ${verification.matchedLocationName || 'Office'}`
      );

      showToast(
        `Check-In Recorded! Status: ${punctuality.isLate ? `Late by ${punctuality.lateMinutes} mins` : 'On Time'} (${verification.matchedLocationName})`,
        punctuality.isLate ? 'info' : 'success'
      );

      return { success: true, message: 'Check-in successful', record: newRecord };
    } catch (err: any) {
      console.error('Check-in error:', err);
      showToast(err.message || 'Check-in failed due to an unexpected error.', 'error');
      return { success: false, message: err.message || 'Check-in failed', errorType: 'INTERNAL_ERROR' };
    }
  };

  const checkOutAttendance = async (params: {
    staffId?: string;
    recordId?: string;
    targetType?: AttendanceLocationType;
    targetLocationIdOrJobId?: string;
    notes?: string;
    bypassGps?: boolean;
    overrideCoords?: { lat: number; lng: number };
  }): Promise<{ success: boolean; message: string; record?: AttendanceRecord; errorType?: string }> => {
    try {
      const activeStaffId = params.staffId || currentUser?.id;
      if (!activeStaffId) {
        return { success: false, message: 'No staff user specified for check-out.', errorType: 'NO_STAFF' };
      }

      const staffUser = users.find((u) => u.id === activeStaffId) || (currentUser?.id === activeStaffId ? currentUser : null);
      const tenantId = staffUser?.businessId || currentBusiness?.id || 'biz-default';
      const todayDate = new Date().toISOString().split('T')[0];

      let targetRecord: AttendanceRecord | undefined;
      if (params.recordId) {
        targetRecord = attendanceRecords.find((a) => a.id === params.recordId);
      } else {
        targetRecord = attendanceRecords.find(
          (a) => a.staffId === activeStaffId && a.date === todayDate && a.workingState === 'working'
        );
        if (!targetRecord) {
          targetRecord = attendanceRecords.find(
            (a) => a.staffId === activeStaffId && a.workingState === 'working'
          );
        }
      }

      if (!targetRecord) {
        return {
          success: false,
          message: 'No active check-in session found for today. Please check in first.',
          errorType: 'NO_ACTIVE_SESSION',
        };
      }

      const rules: AttendanceWorkingRules = currentBusiness?.attendanceWorkingRules || DEFAULT_ATTENDANCE_RULES;

      let lat = 0;
      let lng = 0;
      let accuracy = 10;

      if (params.overrideCoords) {
        lat = params.overrideCoords.lat;
        lng = params.overrideCoords.lng;
        accuracy = 10;
      } else if (params.bypassGps && (currentUser?.role === 'business_owner' || currentUser?.role === 'super_admin')) {
        lat = 0;
        lng = 0;
        accuracy = 0;
      } else {
        try {
          const gpsRes = await getCurrentGpsPosition();
          lat = gpsRes.latitude;
          lng = gpsRes.longitude;
          accuracy = gpsRes.accuracy;
        } catch (gpsErr: any) {
          const errMsg = gpsErr?.userFriendlyMessage || gpsErr?.message || 'Unable to capture GPS location for check-out.';
          return {
            success: false,
            message: errMsg,
            errorType: gpsErr?.code || 'GPS_FAILED',
          };
        }
      }

      const verification = verifyLocationAgainstRules(
        lat,
        lng,
        accuracy,
        attendanceLocations.filter((l) => l.businessId === tenantId && l.isActive),
        params.targetType || targetRecord.checkInType || 'office',
        params.targetLocationIdOrJobId,
        jobs.filter((j) => j.businessId === tenantId),
        rules
      );

      const now = new Date();
      const nowIso = now.toISOString();
      const checkInMs = targetRecord.checkInTimestamp || (targetRecord.checkInTime ? new Date(`${targetRecord.date}T${targetRecord.checkInTime}`).getTime() : now.getTime());
      const checkOutMs = now.getTime();
      const durationMins = Math.max(1, Math.round((checkOutMs - checkInMs) / (1000 * 60)));
      const durationFormatted = formatWorkingDuration(durationMins);

      // Check if half day threshold violated
      let status = targetRecord.status;
      if (rules.halfDayThresholdMinutes && durationMins < rules.halfDayThresholdMinutes) {
        status = 'half_day';
      }

      const updatedRecord: AttendanceRecord = {
        ...targetRecord,
        status,
        workingState: 'completed',
        checkOutTime: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        checkOutTimestamp: checkOutMs,
        checkOutLat: lat,
        checkOutLng: lng,
        checkOutAccuracy: accuracy,
        checkOutVerificationStatus: verification.verificationStatus,
        checkOutType: verification.matchedLocationType,
        checkOutLocationName: verification.matchedLocationName,
        checkOutDistance: verification.distanceMeters,
        checkOutNotes: params.notes,
        workingDurationMinutes: durationMins,
        workingDurationFormatted: durationFormatted,
        updatedAt: nowIso,
        auditTrail: [
          ...(targetRecord.auditTrail || []),
          {
            id: `audit-${Date.now()}`,
            attendanceId: targetRecord.id,
            businessId: tenantId,
            eventType: 'check_out',
            timestamp: nowIso,
            userId: currentUser?.id || activeStaffId,
            userName: currentUser?.name || staffUser?.name || 'Staff',
            userRole: currentUser?.role || staffUser?.role,
            details: `Checked out after ${durationFormatted} at ${verification.matchedLocationName || 'Location'} (Status: ${verification.verificationStatus})`,
            coordinates: {
              lat,
              lng,
              accuracy,
              distance: verification.distanceMeters,
              targetLocationName: verification.matchedLocationName,
            },
          },
        ],
      };

      setAttendanceRecords((prev) =>
        prev.map((r) => (r.id === targetRecord!.id ? updatedRecord : r))
      );
      await saveToFirestore('attendance', targetRecord.id, updatedRecord);

      const auditEntry: AttendanceAuditItem = {
        id: `aud-att-${Date.now()}`,
        attendanceId: targetRecord.id,
        businessId: tenantId,
        eventType: 'check_out',
        timestamp: nowIso,
        userId: currentUser?.id || activeStaffId,
        userName: currentUser?.name || staffUser?.name || 'Staff',
        userRole: currentUser?.role || staffUser?.role,
        details: `Staff ${staffUser?.name || 'Staff'} completed shift. Working duration: ${durationFormatted}.`,
        coordinates: {
          lat,
          lng,
          accuracy,
          distance: verification.distanceMeters,
          targetLocationName: verification.matchedLocationName,
        },
      };
      setAttendanceAuditLogs((prev) => [auditEntry, ...prev]);
      await saveToFirestore('attendanceAuditLogs', auditEntry.id, auditEntry);

      logActivity(
        'Attendance Checked Out',
        'staff',
        targetRecord.id,
        `${staffUser?.name || 'Staff'} checked out. Total duration: ${durationFormatted}`
      );

      showToast(`Checked out successfully! Total duration: ${durationFormatted}`, 'success');
      return { success: true, message: 'Check-out successful', record: updatedRecord };
    } catch (err: any) {
      console.error('Check-out error:', err);
      showToast(err.message || 'Check-out failed.', 'error');
      return { success: false, message: err.message || 'Check-out failed', errorType: 'INTERNAL_ERROR' };
    }
  };

  const manualCorrectAttendance = async (
    recordId: string,
    corrections: {
      status?: AttendanceStatus;
      checkInTime?: string;
      checkOutTime?: string;
      workingDurationMinutes?: number;
      notes?: string;
    },
    reason: string
  ): Promise<{ success: boolean; message: string }> => {
    if (currentUser?.role !== 'business_owner' && currentUser?.role !== 'manager' && currentUser?.role !== 'super_admin') {
      showToast('Unauthorized: Only Managers and Business Owners can modify attendance records.', 'error');
      return { success: false, message: 'Unauthorized' };
    }

    if (!reason || reason.trim().length < 5) {
      showToast('Please provide a descriptive reason for the manual attendance adjustment.', 'error');
      return { success: false, message: 'Reason required' };
    }

    const target = attendanceRecords.find((a) => a.id === recordId);
    if (!target) {
      showToast('Attendance record not found.', 'error');
      return { success: false, message: 'Record not found' };
    }

    const nowIso = new Date().toISOString();
    let durationMins = corrections.workingDurationMinutes !== undefined ? corrections.workingDurationMinutes : target.workingDurationMinutes;

    if (corrections.checkInTime && corrections.checkOutTime) {
      const inMs = new Date(`${target.date}T${corrections.checkInTime}`).getTime();
      const outMs = new Date(`${target.date}T${corrections.checkOutTime}`).getTime();
      if (outMs > inMs) {
        durationMins = Math.round((outMs - inMs) / (1000 * 60));
      }
    }

    const updated: AttendanceRecord = {
      ...target,
      status: corrections.status || target.status,
      checkInTime: corrections.checkInTime || target.checkInTime,
      checkOutTime: corrections.checkOutTime !== undefined ? corrections.checkOutTime : target.checkOutTime,
      workingDurationMinutes: durationMins,
      workingDurationFormatted: durationMins ? formatWorkingDuration(durationMins) : target.workingDurationFormatted,
      manualCorrection: {
        correctedBy: currentUser.id,
        correctedByName: currentUser.name,
        correctedAt: nowIso,
        reason: reason.trim(),
        previousRecord: {
          status: target.status,
          checkInTime: target.checkInTime,
          checkOutTime: target.checkOutTime,
          workingDurationMinutes: target.workingDurationMinutes,
        },
        changesDescription: `Status: ${corrections.status || target.status}, In: ${corrections.checkInTime || target.checkInTime}, Out: ${corrections.checkOutTime || target.checkOutTime}`,
      },
      auditTrail: [
        ...(target.auditTrail || []),
        {
          id: `audit-${Date.now()}`,
          attendanceId: recordId,
          businessId: target.businessId,
          eventType: 'manual_correction',
          timestamp: nowIso,
          userId: currentUser.id,
          userName: currentUser.name,
          userRole: currentUser.role,
          details: `Manual adjustment by ${currentUser.name}: ${reason.trim()} (Status: ${corrections.status || target.status})`,
        },
      ],
    };

    setAttendanceRecords((prev) => prev.map((r) => (r.id === recordId ? updated : r)));
    await saveToFirestore('attendance', recordId, updated);

    const auditEntry: AttendanceAuditItem = {
      id: `aud-att-${Date.now()}`,
      attendanceId: recordId,
      businessId: target.businessId,
      eventType: 'manual_correction',
      timestamp: nowIso,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      details: `Manual correction applied to ${target.staffName}'s attendance for ${target.date}. Reason: ${reason.trim()}`,
    };
    setAttendanceAuditLogs((prev) => [auditEntry, ...prev]);
    await saveToFirestore('attendanceAuditLogs', auditEntry.id, auditEntry);

    showToast('Attendance record updated with permanent audit log entry.', 'success');
    logActivity('Attendance Record Corrected', 'staff', recordId, `Adjusted by ${currentUser.name}: ${reason}`);
    return { success: true, message: 'Record updated' };
  };

  const markStaffLeaveOrHoliday = async (
    staffId: string,
    date: string,
    type: 'leave' | 'holiday' | 'weekly_off',
    notes?: string
  ): Promise<{ success: boolean; message: string }> => {
    const staffUser = users.find((u) => u.id === staffId);
    if (!staffUser) {
      showToast('Staff member not found.', 'error');
      return { success: false, message: 'Staff not found' };
    }

    const tenantId = staffUser.businessId || currentBusiness.id;
    const recordId = `att-${staffId}-${date}`;
    const nowIso = new Date().toISOString();

    const record: AttendanceRecord = {
      id: recordId,
      businessId: tenantId,
      staffId: staffId,
      staffName: staffUser.name,
      staffRole: staffUser.role,
      staffEmail: staffUser.email,
      staffPhone: staffUser.phone,
      date: date,
      status: type,
      workingState: 'completed',
      checkInTime: '00:00',
      checkInVerificationStatus: 'verified',
      checkInLocationName: type === 'leave' ? 'Approved Leave' : type === 'holiday' ? 'Public Holiday' : 'Weekly Off',
      checkInDistance: 0,
      checkInNotes: notes,
      createdAt: nowIso,
      updatedAt: nowIso,
      auditTrail: [
        {
          id: `audit-${Date.now()}`,
          attendanceId: recordId,
          businessId: tenantId,
          eventType: 'status_override',
          timestamp: nowIso,
          userId: currentUser?.id || staffId,
          userName: currentUser?.name || staffUser.name,
          userRole: currentUser?.role || staffUser.role,
          details: `Marked as ${type.toUpperCase()}${notes ? `: ${notes}` : ''}`,
        },
      ],
    };

    setAttendanceRecords((prev) => [record, ...prev.filter((r) => r.id !== recordId)]);
    await saveToFirestore('attendance', recordId, record);
    showToast(`Marked ${staffUser.name} as ${type} for ${date}.`, 'success');
    return { success: true, message: 'Saved' };
  };

  const addAttendanceLocation = async (
    loc: Omit<AttendanceLocation, 'id' | 'businessId'>
  ): Promise<AttendanceLocation> => {
    const perm = canManageBusinessSettings(currentUser);
    if (!perm.allowed) {
      showToast(perm.reason || 'Unauthorized: Only Business Owners can add attendance locations.', 'error');
      throw new Error('Unauthorized');
    }

    const tenantId = currentBusiness?.id || 'biz-default';
    const newLoc: AttendanceLocation = {
      ...loc,
      id: `loc-${Date.now()}`,
      businessId: tenantId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setAttendanceLocations((prev) => [newLoc, ...prev.filter((l) => l.id !== newLoc.id)]);
    await saveToFirestore('attendanceLocations', newLoc.id, newLoc);
    showToast(`Permitted location "${newLoc.name}" saved and active for GPS verification.`, 'success');
    return newLoc;
  };

  const updateAttendanceLocation = async (id: string, updates: Partial<AttendanceLocation>): Promise<void> => {
    const perm = canManageBusinessSettings(currentUser);
    if (!perm.allowed) {
      showToast(perm.reason || 'Unauthorized: Only Business Owners can update locations.', 'error');
      return;
    }

    const updated = { ...updates, updatedAt: new Date().toISOString() };
    setAttendanceLocations((prev) => prev.map((l) => (l.id === id ? { ...l, ...updated } : l)));
    await saveToFirestore('attendanceLocations', id, updated);
    showToast('Permitted location updated.', 'success');
  };

  const deleteAttendanceLocation = async (id: string): Promise<void> => {
    const perm = canManageBusinessSettings(currentUser);
    if (!perm.allowed) {
      showToast(perm.reason || 'Unauthorized: Only Business Owners can delete locations.', 'error');
      return;
    }

    setAttendanceLocations((prev) => prev.filter((l) => l.id !== id));
    await deleteFromFirestore('attendanceLocations', id);
    showToast('Permitted location removed.', 'info');
  };

  const updateAttendanceWorkingRules = async (rules: Partial<AttendanceWorkingRules>): Promise<void> => {
    const perm = canManageBusinessSettings(currentUser);
    if (!perm.allowed) {
      showToast(perm.reason || 'Unauthorized: Only Business Owners can update working rules.', 'error');
      return;
    }

    const currentRules = currentBusiness?.attendanceWorkingRules || DEFAULT_ATTENDANCE_RULES;
    const mergedRules: AttendanceWorkingRules = { ...currentRules, ...rules };

    updateBusinessSettings({ attendanceWorkingRules: mergedRules });
    showToast('Attendance & shift working rules updated successfully.', 'success');
  };

  const getRolePermissions = (roleCode?: UserRole): RolePermission => {
    if (!roleCode) {
      return {
        canManageJobs: false,
        canViewFinancials: false,
        canManageStaff: false,
        canManageInventory: false,
        canAccessSettings: false,
        canAccessSuperAdmin: false,
        canAccessCustomerPortal: false,
        canManageServices: false,
        canManageContracts: false,
      };
    }
    const r = (roles || []).find((role) => role.code === roleCode);
    if (r) return r.permissions;
    if (roleCode === 'super_admin') {
      return {
        canManageJobs: true,
        canViewFinancials: true,
        canManageStaff: true,
        canManageInventory: true,
        canAccessSettings: true,
        canAccessSuperAdmin: true,
        canAccessCustomerPortal: true,
        canManageServices: true,
        canManageContracts: true,
      };
    }
    if (roleCode === 'business_owner') {
      return {
        canManageJobs: true,
        canViewFinancials: true,
        canManageStaff: true,
        canManageInventory: true,
        canAccessSettings: true,
        canAccessSuperAdmin: false,
        canAccessCustomerPortal: true,
        canManageServices: true,
        canManageContracts: true,
      };
    }
    if (roleCode === 'manager') {
      return {
        canManageJobs: true,
        canViewFinancials: true,
        canManageStaff: true,
        canManageInventory: true,
        canAccessSettings: false,
        canAccessSuperAdmin: false,
        canAccessCustomerPortal: true,
        canManageServices: true,
        canManageContracts: true,
      };
    }
    return {
      canManageJobs: true,
      canViewFinancials: false,
      canManageStaff: false,
      canManageInventory: false,
      canAccessSettings: false,
      canAccessSuperAdmin: false,
      canAccessCustomerPortal: false,
      canManageServices: false,
      canManageContracts: false,
    };
  };

  return (
    <AppContext.Provider
      value={{
        currentBusiness,
        setCurrentBusiness,
        businesses,
        users,
        currentUser,
        setCurrentUser,
        isAuthInitializing,
        loginUser,
        logoutUser,
        switchRole,
        switchBusiness,
        createBusiness,
        updateUserStatus,
        updateBusinessAndOwnerStatus,
        updateUserPassword,
        updateUserProfile,
        registerUser,

        enquiries: filteredEnquiries,
        customers: filteredCustomers,
        categories: filteredCategories,
        services: filteredServices,
        jobs: filteredJobs,
        inventory: filteredInventory,
        inventoryTransactions,
        quotations: filteredQuotations,
        invoices: filteredInvoices,
        payments: filteredPayments,
        contracts: filteredContracts,
        expenses: filteredExpenses,
        notifications: filteredNotifications,
        activityLogs: filteredActivityLogs,
        staff: filteredStaff,
        plans: DEMO_PLANS,
        roles,
        getRolePermissions,

        isSearchOpen,
        setIsSearchOpen,
        isActivityLogOpen,
        setIsActivityLogOpen,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isProfileDrawerOpen,
        setIsProfileDrawerOpen,
        isInstallModalOpen,
        setIsInstallModalOpen,
        toasts,
        showToast,
        dismissToast,
        resetDemoData,
        theme,
        toggleTheme,
        logActivity,

        firestoreService,

        addEnquiry,
        updateEnquiry,
        deleteEnquiry,
        convertEnquiryToJob,
        convertEnquiryToQuote,
        addEnquiryFollowUp,
        linkCustomerToEnquiry,
        createAndLinkCustomerFromEnquiry,
        markEnquiryQualified,
        markEnquiryLost,
        addEnquiryActivity,

        addCustomer,
        updateCustomer,
        deleteCustomer,
        archiveCustomer,
        unarchiveCustomer,

        addServiceCategory,
        addService,
        updateService,
        deleteService,

        addJob,
        updateJob,
        updateJobStatus,
        deleteJob,
        startJob,
        completeJob,

        addInventoryItem,
        updateInventoryStock,

        addQuotation,
        updateQuotationStatus,
        convertQuotationToInvoice,

        addInvoice,
        deleteInvoice,
        recordPayment,

        addContract,
        addExpense,
        addStaff,
        deleteStaff,
        updateBusinessSettings,
        updateBusinessProfile: updateBusinessSettings,
        markNotificationRead,
        activeJobPopup,
        dismissJobPopup,
        triggerJobPopupAlert,

        isOffline: isActuallyOffline,
        isSimulatedOffline,
        pendingSyncQueue,
        syncOfflineQueue,
        toggleSimulateOffline,
        manualSyncLogs,
        triggerManualSync,
        clearSyncLogs,

        // Super Admin Support Access & Security Engine
        supportSessions,
        activeSupportSession,
        startSupportSession,
        endSupportSession,
        systemSettings,
        updateSystemSettings,
        sendBroadcastNotification,
        securityAuditLogs,
        logSecurityEvent,
        revokeUserSession,
        forcePasswordReset,

        // Safe Clean State Testing Data Purge
        purgeAllTransactionalData,
        purgeTenantTransactionalData,
        wipeAllExceptSuperAdmin,
        cleanupOrphanUsers,

        // Tenant and User Deletion
        deleteBusinessTenant,
        deleteUserAccount,

        // Referral Bonus System
        referralRecords: filteredReferralRecords,
        referralPayoutRequests: filteredReferralPayouts,
        validateReferralCode,
        requestReferralPayout,
        processReferralPayout,
        createManualReferralLink,
        deleteReferralRecord,
        settleReferralBonusDirectly,

        // Attendance & GPS Verification Module
        attendanceRecords: filteredAttendanceRecords,
        attendanceLocations: filteredAttendanceLocations,
        attendanceWorkingRules,
        attendanceAuditLogs: filteredAttendanceAuditLogs,
        checkInAttendance,
        checkOutAttendance,
        manualCorrectAttendance,
        markStaffLeaveOrHoliday,
        addAttendanceLocation,
        updateAttendanceLocation,
        deleteAttendanceLocation,
        updateAttendanceWorkingRules,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ThemeProvider>
      <AppContentProvider>{children}</AppContentProvider>
    </ThemeProvider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

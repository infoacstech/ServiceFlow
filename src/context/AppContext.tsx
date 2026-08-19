import React, { createContext, useContext, useState, useEffect } from 'react';
import type {
  Business,
  User,
  UserRole,
  Role,
  RolePermission,
  Customer,
  ServiceCategory,
  Service,
  Job,
  JobStatus,
  JobPriority,
  InventoryItem,
  InventoryTransaction,
  Quotation,
  Invoice,
  Payment,
  RecurringContract,
  Expense,
  Notification,
  ActivityLog,
  Plan,
  JobMaterialUsed,
  OfflineSyncItem,
  ManualSyncLog,
  SupportSession,
  SystemSettings,
  SecurityAuditLog,
  ReferralRecord,
  ReferralPayoutRequest,
} from '../types';
import {
  DEMO_BUSINESSES,
  DEMO_USERS,
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
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { AuthService } from '../services/AuthService';
import {
  updatePassword as firebaseUpdatePassword,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { FirestoreService, firestoreService } from '../services/FirestoreService';
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
  resetDemoData: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  logActivity: (action: string, entityType: ActivityLog['entityType'], entityId: string, description: string) => void;

  firestoreService: typeof FirestoreService;

  // Actions
  addCustomer: (c: Omit<Customer, 'id' | 'businessId' | 'createdAt'>) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  addService: (s: Omit<Service, 'id' | 'businessId'>) => void;
  updateService: (id: string, updates: Partial<Service>) => void;
  deleteService: (id: string) => void;

  addServiceCategory: (name: string, description?: string) => ServiceCategory;

  addJob: (j: Omit<Job, 'id' | 'businessId' | 'jobId' | 'createdAt'>) => Job;
  updateJob: (id: string, updates: Partial<Job>) => void;
  updateJobStatus: (id: string, status: JobStatus) => void;
  deleteJob: (id: string) => void;
  startJob: (id: string, beforePhotos: string[], notes?: string) => void;
  completeJob: (
    id: string,
    data: {
      problemFound: string;
      solutionProvided: string;
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

  addQuotation: (q: Omit<Quotation, 'id' | 'businessId' | 'quotationNumber'>) => Quotation;
  updateQuotationStatus: (id: string, status: Quotation['status']) => void;
  convertQuotationToInvoice: (quotationId: string) => Invoice;

  addInvoice: (inv: Omit<Invoice, 'id' | 'businessId' | 'invoiceNumber'>) => Invoice;
  deleteInvoice: (id: string) => void;
  recordPayment: (p: Omit<Payment, 'id' | 'businessId'>) => Payment;

  addContract: (c: Omit<RecurringContract, 'id' | 'businessId' | 'contractNumber'>) => RecurringContract;
  addExpense: (e: Omit<Expense, 'id' | 'businessId'>) => void;
  addStaff: (st: Omit<User, 'id' | 'businessId'>) => User;
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
  syncOfflineQueue: () => void;
  toggleSimulateOffline: () => void;
  manualSyncLogs: ManualSyncLog[];
  triggerManualSync: (triggerType?: 'MANUAL_BUTTON' | 'AUTO_RECONNECT' | 'FORCED_REFRESH') => void;
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

  // Tenant and User Deletion
  deleteBusinessTenant: (businessId: string) => Promise<void>;
  deleteUserAccount: (userId: string) => Promise<void>;
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
    await setDoc(doc(db, colName, id), data, { merge: true });
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
  const [isAuthInitializing, setIsAuthInitializing] = useState<boolean>(true);

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
        const cloudItems = snapshot.docs.map((d) => d.data() as Business);
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
        const map = new Map<string, User>();
        map.set(SUPER_ADMIN_USER.id, SUPER_ADMIN_USER);
        cloudItems.forEach((u) => map.set(u.id, u));
        const allUsers = Array.from(map.values());
        setUsers(allUsers);
        saveCache('serviflow_users_cache', allUsers);

        // Ensure Super Admin user exists in database
        const hasSuperAdmin = cloudItems.some(
          (u) => u.role === 'super_admin' || u.email === 'admin@serviflow.io'
        );
        if (!hasSuperAdmin) {
          saveToFirestore('users', SUPER_ADMIN_USER.id, SUPER_ADMIN_USER);
        }

        setCurrentUser((prev) => {
          if (!prev) return null;
          const found = allUsers.find(
            (u) =>
              u.id === prev.id ||
              (Boolean(u.email) &&
                Boolean(prev.email) &&
                (u.email || '').trim().toLowerCase() === (prev.email || '').trim().toLowerCase())
          );
          return found || prev;
        });
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'users')
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

        if (!isInitialJobsLoadRef.current) {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const newJ = change.doc.data() as Job;
              const assignedStaffName = (users || []).find((u) => u.id === newJ.assignedStaffId)?.name;
              playJobVoiceNotification(
                newJ.jobId,
                newJ.description || 'New Service Task',
                newJ.location,
                assignedStaffName
              );
            }
          });
        } else {
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

              // Check if notification is targeted to the current active user
              let isTargetedToMe = false;

              const isJobAssignment =
                notif.actionType === 'assigned' ||
                notif.title?.toLowerCase().includes('assigned') ||
                notif.title?.toLowerCase().includes('job issued');

              if (isJobAssignment) {
                // Business Owner, Manager & Super Admin NEVER receive audio alerts or popups when assigning jobs
                if (currentUser.role !== 'technician') {
                  isTargetedToMe = false;
                } else {
                  // Only the specifically assigned technician receives the voice alert and popup
                  if (notif.targetUserId) {
                    if (notif.targetUserId === currentUser.id || notif.targetUserId === currentUser.email) {
                      isTargetedToMe = true;
                    } else {
                      const matchedUser = (users || []).find((u) => u.id === notif.targetUserId);
                      if (matchedUser) {
                        if (currentUser.email && matchedUser.email && currentUser.email.toLowerCase() === matchedUser.email.toLowerCase()) {
                          isTargetedToMe = true;
                        } else if (currentUser.name && matchedUser.name && currentUser.name.toLowerCase() === matchedUser.name.toLowerCase()) {
                          isTargetedToMe = true;
                        }
                      }
                    }
                  }
                }
              } else if (notif.actionType === 'accepted' || notif.actionType === 'started' || notif.actionType === 'completed') {
                // Owner & Manager receive updates when technician accepts, starts, or finishes jobs
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
                    currentUser?.name,
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

    return () => {
      unsubBiz();
      unsubUsers();
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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
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
                userRecord = { ...(qSnap.docs[0].data() as User), id: firebaseUser.uid };
                // Ensure document is keyed by UID
                await setDoc(doc(db, 'users', firebaseUser.uid), userRecord, { merge: true });
              }
            }
          }

          if (userRecord) {
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
          }
        } catch (err) {
          console.error('Error fetching user on auth change:', err);
        }
      } else {
        // Clear session on sign out
        localStorage.removeItem('serviflow_user_session');
        localStorage.removeItem('serviflow_logged_in_email');
        localStorage.removeItem('serviflow_logged_in_uid');
        setCurrentUser(null);
      }
      setIsAuthInitializing(false);
    });

    return () => unsubscribe();
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
    triggerType: 'MANUAL_BUTTON' | 'AUTO_RECONNECT' | 'FORCED_REFRESH' = 'MANUAL_BUTTON'
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
      showToast(`Device is Offline. ${pendingSyncQueue.length} update(s) remain queued in local storage.`, 'info');
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
      showToast(`Successfully synchronized ${syncedItems.length} queued update(s) to Firestore!`, 'success');
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
      showToast('Sync check complete! All records are in sync with Firestore.', 'info');
    }
  };

  const syncOfflineQueue = () => {
    triggerManualSync('AUTO_RECONNECT');
  };

  const clearSyncLogs = () => {
    manualSyncLogs.forEach((log) => deleteFromFirestore('manualSyncLogs', log.id));
    setManualSyncLogs([]);
    showToast('Manual sync history logs cleared.', 'info');
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
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
        `Super Admin wiped ${res.totalDocsDeleted} dummy transactional records across collections: ${res.clearedCollections.join(', ')}`
      );
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
      showToast(`Clean State Active: Purged ${res.totalDocsDeleted} records for ${currentBusiness.name}.`, 'success');
      return res;
    } catch (err) {
      console.error('Tenant purge error:', err);
      showToast('Failed to purge tenant data: ' + String(err), 'error');
      return { clearedCollections: [], totalDocsDeleted: 0 };
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

  // Switch role helper for live demo toggling
  const switchRole = async (role: UserRole) => {
    if (role === 'super_admin') {
      const adminUser = users.find((u) => u.role === 'super_admin') || {
        id: 'usr-admin',
        name: 'SaaS Platform Admin',
        email: 'admin@serviflow.io',
        phone: '+91 90000 00000',
        role: 'super_admin' as const,
        businessId: 'all',
        status: 'active' as const,
      };
      await loginUser(adminUser, 'ServiFlow@123');
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
    const newBiz: Business = {
      id: newBizId,
      name: bData.name || 'New Service Business',
      type: bData.type || 'CCTV & Security',
      logo: bData.logo || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=150&auto=format&fit=crop&q=80',
      mobile: bData.mobile || '+91 99999 88888',
      whatsapp: bData.whatsapp || bData.mobile || '+91 99999 88888',
      email: bData.email || 'contact@business.com',
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

    const ownerName = ownerData?.name || (newBiz.email ? newBiz.email.split('@')[0] : `${newBiz.name} Admin`);
    const ownerEmail = ownerData?.email || newBiz.email;
    const rawPhone = ownerData?.phone || newBiz.mobile;
    const ownerPhone = rawPhone.startsWith('+') ? rawPhone : `+91 ${rawPhone}`;
    const ownerPassword = ownerData?.password || '1234';

    const ownerUser: User = {
      id: `usr-owner-${newBizId}`,
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
    saveToFirestore('users', ownerUser.id, ownerUser);
    saveToFirestore('categories', defaultCategory.id, defaultCategory);
    saveToFirestore('services', defaultService.id, defaultService);

    setBusinesses((prev) => {
      const updated = [...prev.filter((b) => b.id !== newBiz.id), newBiz];
      saveCache('serviflow_businesses_cache', updated);
      return updated;
    });
    setUsers((prev) => {
      const updated = [...prev.filter((u) => u.id !== ownerUser.id), ownerUser];
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
  const filteredStaff = isSuperAdminUser ? users : users.filter((u) => u.businessId === currBizId && u.role !== 'super_admin');
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

  // Customer Actions
  const addCustomer = (data: Omit<Customer, 'id' | 'businessId' | 'createdAt'>) => {
    if (checkReadOnlySupportGuard()) return;
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
    const target = customers.find((c) => c.id === id);
    if (target && target.businessId !== currentBusiness.id && !isSuperAdminUser) {
      showToast('Unauthorized: Cannot modify customer belonging to another tenant business.', 'error');
      return;
    }
    firestoreService.updateCustomer(id, updates);
    showToast('Customer information updated & synced to Firestore', 'success');
  };

  const deleteCustomer = (id: string) => {
    if (checkReadOnlySupportGuard()) return;
    const target = customers.find((c) => c.id === id);
    if (target && target.businessId !== currentBusiness.id && !isSuperAdminUser) {
      showToast('Unauthorized: Cannot delete customer belonging to another tenant business.', 'error');
      return;
    }
    firestoreService.deleteCustomer(id);
    showToast('Customer deleted from Firestore', 'info');
  };

  // Services Actions
  const addServiceCategory = (name: string, description?: string) => {
    if (checkReadOnlySupportGuard()) return;
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
    const target = services.find((s) => s.id === id);
    if (target && target.businessId !== currentBusiness.id && !isSuperAdminUser) {
      showToast('Unauthorized: Cannot delete service belonging to another tenant business.', 'error');
      return;
    }
    firestoreService.deleteDocument('services', id);
    showToast('Service removed', 'info');
  };

  // Job Actions
  const addJob = (data: Omit<Job, 'id' | 'businessId' | 'jobId' | 'createdAt'>) => {
    if (checkReadOnlySupportGuard()) return;
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

    showToast(`Job ${jobId} issued & assigned${assignedStaff ? ' to ' + assignedStaff.name : ''}!`, 'success');
    return newJob;
  };

  const updateJob = (id: string, updates: Partial<Job>) => {
    if (checkReadOnlySupportGuard()) return;
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

  const updateJobStatus = (id: string, status: JobStatus) => {
    if (checkReadOnlySupportGuard()) return;
    const target = jobs.find((j) => j.id === id);
    if (target && target.businessId !== currentBusiness.id && !isSuperAdminUser) {
      showToast('Unauthorized: Cannot update job belonging to another tenant business.', 'error');
      return;
    }

    const techUser = (users || []).find((u) => u.id === target?.assignedStaffId) || currentUser;
    const techName = techUser?.name || 'Staff Technician';

    if (isActuallyOffline) {
      addToSyncQueue('update_job_status', id, { status }, `Job status changed to ${status.replace('_', ' ')}`);
      showToast(`Offline Mode: Status updated to ${status.replace('_', ' ')} (queued)`, 'info');
    } else {
      firestoreService.updateJob(id, { status });

      // If status changed to accepted, on_the_way, or started, notify Business Owner
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

        // If current user is Business Owner, speak alert
        if (currentUser?.role === 'business_owner' || isSuperAdminUser) {
          playJobStatusVoiceNotification(status, target?.jobId || id, techName, target?.description);
          setActiveJobPopup(statusNotif);
        }
      }

      logActivity('Job Status Updated', 'job', id, `Changed job status to ${status.replace('_', ' ').toUpperCase()}`);
      showToast(`Job status updated to ${status.replace('_', ' ')}`, 'info');
    }
  };

  const deleteJob = (id: string) => {
    if (checkReadOnlySupportGuard()) return;
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

      logActivity('Job Work Started', 'job', id, 'Technician initiated work on site');
      showToast('Job work started & synced!', 'success');
    }
  };

  const completeJob = (
    id: string,
    data: {
      problemFound: string;
      solutionProvided: string;
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
      afterPhotos: data.afterPhotos,
      customerSignature: data.customerSignature || '',
      customerRating: data.customerRating || 5,
      customerFeedback: data.customerFeedback || '',
      materialsUsed: data.materialsUsed || [],
    };

    const assignedTech = (users || []).find((u) => u.id === existingJob?.assignedStaffId) || currentUser;
    const techName = assignedTech?.name || currentUser?.name || 'Staff Member';
    const customer = (customers || []).find((c) => c.id === existingJob?.customerId);

    // Create Notification doc in Firestore for Business Owner
    const completeNotif: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      businessId: currentBusiness.id,
      title: `Job Completed: ${existingJob?.jobId || id}`,
      message: `Staff ${techName} has completed job ${existingJob?.jobId || id} (${existingJob?.description || 'Service'}). Customer rating: ${data.customerRating || 5}★.`,
      type: 'job',
      read: false,
      createdAt: new Date().toISOString(),
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

    if (isActuallyOffline) {
      addToSyncQueue('complete_job', id, data, 'Technician completed job & recorded customer report/signature');
      showToast('Offline Mode: Job report saved locally & queued for sync!', 'success');
    } else {
      firestoreService.saveDocument<Job>('jobs', id, completionData);
      logActivity('Job Completed', 'job', id, `Technician ${techName} completed job work & obtained customer signature`);
      showToast('Job marked as completed & synced to Firestore!', 'success');
    }

    // Trigger multi-language voice alert and popup for Business Owner
    if (currentUser?.role === 'business_owner' || isSuperAdminUser) {
      playJobCompletedVoiceNotification(
        existingJob?.jobId || id,
        techName,
        existingJob?.description,
        data.customerRating || 5
      );
      setActiveJobPopup(completeNotif);
    }
  };

  // Inventory Actions
  const addInventoryItem = (data: Omit<InventoryItem, 'id' | 'businessId'>) => {
    if (checkReadOnlySupportGuard()) return;
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
  const addQuotation = (data: Omit<Quotation, 'id' | 'businessId' | 'quotationNumber'>) => {
    if (checkReadOnlySupportGuard()) return;
    const num = `QT-${new Date().getFullYear()}-${filteredQuotations.length + 101}`;
    const newQt: Quotation = {
      ...data,
      id: `qt-${Date.now()}`,
      businessId: currentBusiness.id,
      quotationNumber: num,
    };
    firestoreService.saveDocument<Quotation>('quotations', newQt.id, newQt);
    logActivity('Quotation Created', 'quotation', newQt.id, `Created quotation ${num}`);
    showToast(`Quotation ${num} created`, 'success');
    return newQt;
  };

  const updateQuotationStatus = (id: string, status: Quotation['status']) => {
    if (checkReadOnlySupportGuard()) return;
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
    const newExp: Expense = {
      ...data,
      id: `exp-${Date.now()}`,
      businessId: currentBusiness.id,
    };
    saveToFirestore('expenses', newExp.id, newExp);
    showToast(`Recorded expense: ${currentBusiness.currency}${newExp.amount}`, 'success');
  };

  // Staff & User Auth Actions
  const addStaff = (data: Omit<User, 'id' | 'businessId'>) => {
    if (checkReadOnlySupportGuard()) return;
    const newStaff: User = {
      ...data,
      id: `usr-${Date.now()}`,
      businessId: currentBusiness.id,
      approvalStatus: data.approvalStatus || 'active',
      status: data.status || 'active',
    };
    saveToFirestore('users', newStaff.id, newStaff);
    saveToFirestore('tenantMembers', `${currentBusiness.id}_${newStaff.id}`, {
      id: `${currentBusiness.id}_${newStaff.id}`,
      tenantId: currentBusiness.id,
      userId: newStaff.id,
      role: newStaff.role,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    showToast(`Staff member "${newStaff.name}" added`, 'success');
    return newStaff;
  };

  const deleteStaff = (userId: string) => {
    if (checkReadOnlySupportGuard()) return;
    const target = users.find((u) => u.id === userId);
    if (!target) return;
    if (target.businessId !== currentBusiness.id && !isSuperAdminUser) {
      showToast('Unauthorized: Cannot delete staff account belonging to another tenant business.', 'error');
      return;
    }
    deleteFromFirestore('users', userId);
    logActivity('Staff Deleted', 'staff', userId, `Deleted staff member ${target.name || target.email}`);
    showToast(`Deleted staff account "${target.name || target.email}"`, 'info');
  };

  const updateBusinessAndOwnerStatus = (
    businessId: string,
    newStatus: 'active' | 'pending' | 'rejected' | 'suspended'
  ) => {
    saveToFirestore('businesses', businessId, { status: newStatus });
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
    saveToFirestore('users', userId, { password: newPassword });

    if (auth.currentUser && currentUser?.id === userId) {
      try {
        await firebaseUpdatePassword(auth.currentUser, newPassword);
      } catch (err) {
        console.warn('Firebase Auth update password warning:', err);
      }
    }

    if (currentUser?.id === userId) {
      setCurrentUser((prev) => (prev ? { ...prev, password: newPassword } : null));
    }

    showToast('Password updated successfully in Firebase Authentication & Firestore!', 'success');
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
    referralCode?: string;
  }): Promise<{ user: User; isPending: boolean }> => {
    const normalizedEmail = (data.email || '').trim().toLowerCase();
    const cleanPhoneDigits = (data.phone || '').replace(/[^0-9]/g, '');

    // 1. Strict Duplicate Account Check
    const existingAccount = users.find((u) => {
      const uEmail = (u.email || '').trim().toLowerCase();
      const uPhoneDigits = (u.phone || '').replace(/[^0-9]/g, '');
      const isEmailMatch = uEmail && normalizedEmail && uEmail === normalizedEmail;
      const isPhoneMatch =
        cleanPhoneDigits.length >= 10 &&
        uPhoneDigits.length >= 10 &&
        uPhoneDigits.slice(-10) === cleanPhoneDigits.slice(-10);
      return isEmailMatch || isPhoneMatch;
    });

    if (existingAccount) {
      const matchedField =
        existingAccount.email?.trim().toLowerCase() === normalizedEmail
          ? `Email address (${data.email})`
          : `Mobile number (${data.phone})`;
      const errorMsg = `${matchedField} is already registered. Please login to your account.`;
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
          businessType: data.businessType || 'CCTV & Security',
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
      // Staff account registration
      const bId = data.businessId || currentBusiness.id;
      let newStaffUid = `usr-${Date.now()}`;
      
      try {
        const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
        newStaffUid = cred.user.uid;
      } catch (authErr: any) {
        if (authErr.code !== 'auth/email-already-in-use') {
          console.warn('Firebase Auth user creation note for staff:', authErr);
        }
      }

      const newStaff: User = {
        id: newStaffUid,
        name: data.name,
        email: data.email,
        phone: data.phone.startsWith('+') ? data.phone : `+91 ${data.phone}`,
        role: data.role,
        businessId: bId,
        joiningDate: new Date().toISOString().split('T')[0],
        requestedDate: new Date().toISOString().split('T')[0],
        status: 'active',
        approvalStatus: 'active',
      };

      await saveToFirestore('users', newStaff.id, newStaff);
      await saveToFirestore('tenantMembers', `${bId}_${newStaff.id}`, {
        id: `${bId}_${newStaff.id}`,
        tenantId: bId,
        userId: newStaff.id,
        role: data.role,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      setUsers((prev) => {
        const updated = [...prev.filter((u) => u.id !== newStaff.id), newStaff];
        saveCache('serviflow_users_cache', updated);
        return updated;
      });

      showToast(`Account created for ${newStaff.name}.`, 'success');
      return { user: newStaff, isPending: false };
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

  const updateBusinessSettings = (updates: Partial<Business>) => {
    const updated = { ...currentBusiness, ...updates };
    setCurrentBusiness(updated);
    saveCache('serviflow_current_biz_cache', updated);
    setBusinesses((prev) => {
      const updatedList = prev.map((b) => (b.id === updated.id ? updated : b));
      saveCache('serviflow_businesses_cache', updatedList);
      return updatedList;
    });
    saveToFirestore('businesses', currentBusiness.id, updates);
    showToast('Business profile & settings updated and synced to Firestore', 'success');
  };

  const markNotificationRead = (id: string) => {
    saveToFirestore('notifications', id, { read: true });
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
        resetDemoData,
        theme,
        toggleTheme,
        logActivity,

        firestoreService,

        addCustomer,
        updateCustomer,
        deleteCustomer,

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
        securityAuditLogs,
        logSecurityEvent,
        revokeUserSession,
        forcePasswordReset,

        // Safe Clean State Testing Data Purge
        purgeAllTransactionalData,
        purgeTenantTransactionalData,

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

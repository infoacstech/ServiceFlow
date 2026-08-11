import React, { createContext, useContext, useState, useEffect } from 'react';
import {
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
} from '../data/demoData';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { FirestoreService, firestoreService } from '../services/FirestoreService';
import {
  collection,
  doc,
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
  currentUser: User;
  setCurrentUser: (u: User) => void;
  switchRole: (role: UserRole) => void;
  switchBusiness: (businessId: string) => void;
  createBusiness: (bData: Partial<Business>, serviceCategoryName?: string) => Business;

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
  updateBusinessSettings: (updates: Partial<Business>) => void;
  updateBusinessProfile: (updates: Partial<Business>) => void;

  markNotificationRead: (id: string) => void;

  // Offline Sync Capabilities
  isOffline: boolean;
  isSimulatedOffline: boolean;
  pendingSyncQueue: OfflineSyncItem[];
  syncOfflineQueue: () => void;
  toggleSimulateOffline: () => void;
  manualSyncLogs: ManualSyncLog[];
  triggerManualSync: (triggerType?: 'MANUAL_BUTTON' | 'AUTO_RECONNECT' | 'FORCED_REFRESH') => void;
  clearSyncLogs: () => void;
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

const AppContentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme, toggleTheme } = useTheme();

  // State arrays populated directly via real-time Firestore onSnapshot listeners
  const [businesses, setBusinesses] = useState<Business[]>(DEMO_BUSINESSES);
  const [currentBusiness, setCurrentBusiness] = useState<Business>(DEMO_BUSINESSES[0]);

  const [users, setUsers] = useState<User[]>(DEMO_USERS);
  const [currentUser, setCurrentUser] = useState<User>(DEMO_USERS[1]); // Rajesh (Owner)

  const [customers, setCustomers] = useState<Customer[]>(DEMO_CUSTOMERS);
  const [categories, setCategories] = useState<ServiceCategory[]>(DEMO_CATEGORIES);
  const [services, setServices] = useState<Service[]>(DEMO_SERVICES);
  const [jobs, setJobs] = useState<Job[]>(DEMO_JOBS);
  const [inventory, setInventory] = useState<InventoryItem[]>(DEMO_INVENTORY);
  const [inventoryTransactions, setInventoryTransactions] = useState<InventoryTransaction[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>(DEMO_QUOTATIONS);
  const [invoices, setInvoices] = useState<Invoice[]>(DEMO_INVOICES);
  const [payments, setPayments] = useState<Payment[]>(DEMO_PAYMENTS);
  const [contracts, setContracts] = useState<RecurringContract[]>(DEMO_CONTRACTS);
  const [expenses, setExpenses] = useState<Expense[]>(DEMO_EXPENSES);
  const [notifications, setNotifications] = useState<Notification[]>(DEMO_NOTIFICATIONS);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(DEMO_ACTIVITIES);
  const [roles, setRoles] = useState<Role[]>(DEMO_ROLES);

  // Offline Technician Sync States
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(false);
  const [pendingSyncQueue, setPendingSyncQueue] = useState<OfflineSyncItem[]>([]);
  const [manualSyncLogs, setManualSyncLogs] = useState<ManualSyncLog[]>([]);

  const isActuallyOffline = isOffline || isSimulatedOffline;

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isActivityLogOpen, setIsActivityLogOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // -------------------------------------------------------------
  // REAL-TIME FIRESTORE SUBSCRIPTIONS & AUTOMATIC SEEDING
  // -------------------------------------------------------------
  useEffect(() => {
    // 1. Businesses
    const unsubBiz = onSnapshot(
      collection(db, 'businesses'),
      (snapshot) => {
        if (snapshot.empty) {
          DEMO_BUSINESSES.forEach((b) => saveToFirestore('businesses', b.id, b));
        } else {
          const items = snapshot.docs.map((d) => d.data() as Business);
          setBusinesses(items);
          setCurrentBusiness((prev) => items.find((b) => b.id === prev.id) || items[0] || prev);
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'businesses')
    );

    // 2. Users
    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        if (snapshot.empty) {
          DEMO_USERS.forEach((u) => saveToFirestore('users', u.id, u));
        } else {
          const items = snapshot.docs.map((d) => d.data() as User);
          setUsers(items);
          setCurrentUser((prev) => items.find((u) => u.id === prev.id) || items[1] || items[0] || prev);
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'users')
    );

    // 3. Customers
    const unsubCustomers = onSnapshot(
      collection(db, 'customers'),
      (snapshot) => {
        if (snapshot.empty) {
          DEMO_CUSTOMERS.forEach((c) => saveToFirestore('customers', c.id, c));
        } else {
          setCustomers(snapshot.docs.map((d) => d.data() as Customer));
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'customers')
    );

    // 4. Categories
    const unsubCategories = onSnapshot(
      collection(db, 'categories'),
      (snapshot) => {
        if (snapshot.empty) {
          DEMO_CATEGORIES.forEach((cat) => saveToFirestore('categories', cat.id, cat));
        } else {
          setCategories(snapshot.docs.map((d) => d.data() as ServiceCategory));
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'categories')
    );

    // 5. Services
    const unsubServices = onSnapshot(
      collection(db, 'services'),
      (snapshot) => {
        if (snapshot.empty) {
          DEMO_SERVICES.forEach((s) => saveToFirestore('services', s.id, s));
        } else {
          setServices(snapshot.docs.map((d) => d.data() as Service));
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'services')
    );

    // 6. Jobs
    const unsubJobs = onSnapshot(
      collection(db, 'jobs'),
      (snapshot) => {
        if (snapshot.empty) {
          DEMO_JOBS.forEach((j) => saveToFirestore('jobs', j.id, j));
        } else {
          setJobs(snapshot.docs.map((d) => d.data() as Job));
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'jobs')
    );

    // 7. Inventory
    const unsubInventory = onSnapshot(
      collection(db, 'inventory'),
      (snapshot) => {
        if (snapshot.empty) {
          DEMO_INVENTORY.forEach((i) => saveToFirestore('inventory', i.id, i));
        } else {
          setInventory(snapshot.docs.map((d) => d.data() as InventoryItem));
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'inventory')
    );

    // 8. Inventory Transactions
    const unsubInvTx = onSnapshot(
      collection(db, 'inventoryTransactions'),
      (snapshot) => {
        if (!snapshot.empty) {
          setInventoryTransactions(snapshot.docs.map((d) => d.data() as InventoryTransaction));
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'inventoryTransactions')
    );

    // 9. Quotations
    const unsubQuotations = onSnapshot(
      collection(db, 'quotations'),
      (snapshot) => {
        if (snapshot.empty) {
          DEMO_QUOTATIONS.forEach((q) => saveToFirestore('quotations', q.id, q));
        } else {
          setQuotations(snapshot.docs.map((d) => d.data() as Quotation));
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'quotations')
    );

    // 10. Invoices
    const unsubInvoices = onSnapshot(
      collection(db, 'invoices'),
      (snapshot) => {
        if (snapshot.empty) {
          DEMO_INVOICES.forEach((inv) => saveToFirestore('invoices', inv.id, inv));
        } else {
          setInvoices(snapshot.docs.map((d) => d.data() as Invoice));
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'invoices')
    );

    // 11. Payments
    const unsubPayments = onSnapshot(
      collection(db, 'payments'),
      (snapshot) => {
        if (snapshot.empty) {
          DEMO_PAYMENTS.forEach((p) => saveToFirestore('payments', p.id, p));
        } else {
          setPayments(snapshot.docs.map((d) => d.data() as Payment));
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'payments')
    );

    // 12. Contracts
    const unsubContracts = onSnapshot(
      collection(db, 'contracts'),
      (snapshot) => {
        if (snapshot.empty) {
          DEMO_CONTRACTS.forEach((c) => saveToFirestore('contracts', c.id, c));
        } else {
          setContracts(snapshot.docs.map((d) => d.data() as RecurringContract));
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'contracts')
    );

    // 13. Expenses
    const unsubExpenses = onSnapshot(
      collection(db, 'expenses'),
      (snapshot) => {
        if (snapshot.empty) {
          DEMO_EXPENSES.forEach((e) => saveToFirestore('expenses', e.id, e));
        } else {
          setExpenses(snapshot.docs.map((d) => d.data() as Expense));
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'expenses')
    );

    // 14. Notifications
    const unsubNotifications = onSnapshot(
      collection(db, 'notifications'),
      (snapshot) => {
        if (snapshot.empty) {
          DEMO_NOTIFICATIONS.forEach((n) => saveToFirestore('notifications', n.id, n));
        } else {
          setNotifications(snapshot.docs.map((d) => d.data() as Notification));
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'notifications')
    );

    // 15. Activity Logs
    const unsubActivities = onSnapshot(
      collection(db, 'activities'),
      (snapshot) => {
        if (snapshot.empty) {
          DEMO_ACTIVITIES.forEach((a) => saveToFirestore('activities', a.id, a));
        } else {
          setActivityLogs(snapshot.docs.map((d) => d.data() as ActivityLog));
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'activities')
    );

    // 16. Manual Sync Logs
    const unsubSyncLogs = onSnapshot(
      collection(db, 'manualSyncLogs'),
      (snapshot) => {
        if (!snapshot.empty) {
          setManualSyncLogs(snapshot.docs.map((d) => d.data() as ManualSyncLog));
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'manualSyncLogs')
    );

    // 17. Roles
    const unsubRoles = onSnapshot(
      collection(db, 'roles'),
      (snapshot) => {
        if (snapshot.empty) {
          DEMO_ROLES.forEach((r) => saveToFirestore('roles', r.id, r));
        } else {
          setRoles(snapshot.docs.map((d) => d.data() as Role));
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'roles')
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
        technicianName: currentUser.name,
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
        technicianName: currentUser.name,
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
        technicianName: currentUser.name,
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
    DEMO_BUSINESSES.forEach((b) => saveToFirestore('businesses', b.id, b));
    DEMO_USERS.forEach((u) => saveToFirestore('users', u.id, u));
    DEMO_CUSTOMERS.forEach((c) => saveToFirestore('customers', c.id, c));
    DEMO_CATEGORIES.forEach((cat) => saveToFirestore('categories', cat.id, cat));
    DEMO_SERVICES.forEach((s) => saveToFirestore('services', s.id, s));
    DEMO_JOBS.forEach((j) => saveToFirestore('jobs', j.id, j));
    DEMO_INVENTORY.forEach((i) => saveToFirestore('inventory', i.id, i));
    DEMO_QUOTATIONS.forEach((q) => saveToFirestore('quotations', q.id, q));
    DEMO_INVOICES.forEach((inv) => saveToFirestore('invoices', inv.id, inv));
    DEMO_PAYMENTS.forEach((p) => saveToFirestore('payments', p.id, p));
    DEMO_CONTRACTS.forEach((ct) => saveToFirestore('contracts', ct.id, ct));
    DEMO_EXPENSES.forEach((e) => saveToFirestore('expenses', e.id, e));
    DEMO_NOTIFICATIONS.forEach((n) => saveToFirestore('notifications', n.id, n));
    DEMO_ACTIVITIES.forEach((a) => saveToFirestore('activities', a.id, a));
    showToast('Reset data to initial state & synced to Firestore', 'success');
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
      userName: currentUser.name,
    };
    saveToFirestore('activities', newLog.id, newLog);
  };

  // Switch role helper for live demo toggling
  const switchRole = (role: UserRole) => {
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
      setCurrentUser(adminUser);
      saveToFirestore('users', adminUser.id, adminUser);
      showToast('Switched to Super Admin Role', 'info');
      return;
    }

    let target = users.find((u) => u.businessId === currentBusiness.id && u.role === role);
    if (!target) {
      target = {
        id: `usr-${role}-${Date.now()}`,
        name: `${role.replace('_', ' ').toUpperCase()} User`,
        email: `${role}@${currentBusiness.name.toLowerCase().replace(/[^a-z]/g, '')}.com`,
        phone: currentBusiness.mobile,
        role: role,
        businessId: currentBusiness.id,
        status: 'active',
      };
      saveToFirestore('users', target.id, target);
    }
    setCurrentUser(target);
    showToast(`Switched active role to: ${role.replace('_', ' ').toUpperCase()}`, 'info');
  };

  // Switch business tenant
  const switchBusiness = (bId: string) => {
    const target = businesses.find((b) => b.id === bId);
    if (target) {
      setCurrentBusiness(target);
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
      showToast(`Switched active tenant to: ${target.name}`, 'success');
    }
  };

  // Onboarding creation for a brand new business
  const createBusiness = (bData: Partial<Business>, initialCategoryName = 'General Service') => {
    const newBizId = `biz-${Date.now()}`;
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
      status: 'active',
    };

    const ownerUser: User = {
      id: `usr-owner-${newBizId}`,
      name: `${newBiz.name} Admin`,
      email: newBiz.email,
      phone: newBiz.mobile,
      role: 'business_owner',
      businessId: newBizId,
      status: 'active',
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

    setCurrentBusiness(newBiz);
    setCurrentUser(ownerUser);
    showToast(`Welcome! Business "${newBiz.name}" onboarded and synced to Firestore.`, 'success');
    return newBiz;
  };

  // Business-filtered helpers
  const filteredCustomers = currentUser.role === 'super_admin' ? customers : customers.filter((c) => c.businessId === currentBusiness.id);
  const filteredCategories = currentUser.role === 'super_admin' ? categories : categories.filter((c) => c.businessId === currentBusiness.id);
  const filteredServices = currentUser.role === 'super_admin' ? services : services.filter((s) => s.businessId === currentBusiness.id);
  const filteredJobs = currentUser.role === 'super_admin' ? jobs : jobs.filter((j) => j.businessId === currentBusiness.id);
  const filteredInventory = currentUser.role === 'super_admin' ? inventory : inventory.filter((i) => i.businessId === currentBusiness.id);
  const filteredQuotations = currentUser.role === 'super_admin' ? quotations : quotations.filter((q) => q.businessId === currentBusiness.id);
  const filteredInvoices = currentUser.role === 'super_admin' ? invoices : invoices.filter((inv) => inv.businessId === currentBusiness.id);
  const filteredPayments = currentUser.role === 'super_admin' ? payments : payments.filter((p) => p.businessId === currentBusiness.id);
  const filteredContracts = currentUser.role === 'super_admin' ? contracts : contracts.filter((c) => c.businessId === currentBusiness.id);
  const filteredExpenses = currentUser.role === 'super_admin' ? expenses : expenses.filter((e) => e.businessId === currentBusiness.id);
  const filteredNotifications = currentUser.role === 'super_admin' ? notifications : notifications.filter((n) => n.businessId === currentBusiness.id);
  const filteredActivityLogs = currentUser.role === 'super_admin' ? activityLogs : activityLogs.filter((a) => a.businessId === currentBusiness.id);
  const filteredStaff = currentUser.role === 'super_admin' ? users : users.filter((u) => u.businessId === currentBusiness.id && u.role !== 'super_admin');

  // Customer Actions
  const addCustomer = (data: Omit<Customer, 'id' | 'businessId' | 'createdAt'>) => {
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
    firestoreService.updateCustomer(id, updates);
    showToast('Customer information updated & synced to Firestore', 'success');
  };

  const deleteCustomer = (id: string) => {
    firestoreService.deleteCustomer(id);
    showToast('Customer deleted from Firestore', 'info');
  };

  // Services Actions
  const addServiceCategory = (name: string, description?: string) => {
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
    const newSrv: Service = {
      ...data,
      id: `srv-${Date.now()}`,
      businessId: currentBusiness.id,
    };
    firestoreService.saveDocument<Service>('services', newSrv.id, newSrv);
    showToast(`Service "${newSrv.name}" created`, 'success');
  };

  const updateService = (id: string, updates: Partial<Service>) => {
    firestoreService.saveDocument<Service>('services', id, updates);
    showToast('Service details updated', 'success');
  };

  const deleteService = (id: string) => {
    firestoreService.deleteDocument('services', id);
    showToast('Service removed', 'info');
  };

  // Job Actions
  const addJob = (data: Omit<Job, 'id' | 'businessId' | 'jobId' | 'createdAt'>) => {
    const count = filteredJobs.length + 101;
    const jobId = `JOB-${new Date().getFullYear()}-${count}`;
    const id = `job-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newJob: Job = {
      ...data,
      id,
      businessId: currentBusiness.id,
      jobId,
      createdAt: new Date().toISOString().split('T')[0],
    };
    firestoreService.saveDocument<Job>('jobs', newJob.id, newJob);
    logActivity('Job Created', 'job', newJob.id, `Created job ${jobId}`);
    showToast(`Job ${jobId} created & synced to Firestore!`, 'success');
    return newJob;
  };

  const updateJob = (id: string, updates: Partial<Job>) => {
    if (isActuallyOffline) {
      addToSyncQueue('update_job', id, updates, 'Updated job schedule/assignment');
      showToast('Offline Mode: Saved locally and queued for sync.', 'info');
    } else {
      firestoreService.updateJob(id, updates);
      logActivity('Job Updated', 'job', id, 'Updated job assignment and schedule');
      showToast('Job updated & synced to Firestore', 'success');
    }
  };

  const updateJobStatus = (id: string, status: JobStatus) => {
    if (isActuallyOffline) {
      addToSyncQueue('update_job_status', id, { status }, `Job status changed to ${status.replace('_', ' ')}`);
      showToast(`Offline Mode: Status updated to ${status.replace('_', ' ')} (queued)`, 'info');
    } else {
      firestoreService.updateJob(id, { status });
      logActivity('Job Status Updated', 'job', id, `Changed job status to ${status.replace('_', ' ').toUpperCase()}`);
      showToast(`Job status updated to ${status.replace('_', ' ')}`, 'info');
    }
  };

  const deleteJob = (id: string) => {
    firestoreService.deleteJob(id);
    logActivity('Job Deleted', 'job', id, 'Deleted job record from Firestore');
    showToast('Job deleted from Firestore', 'info');
  };

  const startJob = (id: string, beforePhotos: string[], notes?: string) => {
    const existingJob = jobs.find((j) => j.id === id);
    const startUpdates = {
      status: 'started' as const,
      beforePhotos: beforePhotos.length > 0 ? beforePhotos : (existingJob?.beforePhotos || []),
      startTime: new Date().toISOString(),
      notes: notes ? `${existingJob?.notes || ''}\nStart Notes: ${notes}` : (existingJob?.notes || ''),
    };

    if (isActuallyOffline) {
      addToSyncQueue('start_job', id, { beforePhotos, notes }, 'Technician started job work on site');
      showToast('Offline Mode: Job start logged locally & queued for sync.', 'info');
    } else {
      firestoreService.saveDocument<Job>('jobs', id, startUpdates);
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

    if (isActuallyOffline) {
      addToSyncQueue('complete_job', id, data, 'Technician completed job & recorded customer report/signature');
      showToast('Offline Mode: Job report saved locally & queued for sync!', 'success');
    } else {
      firestoreService.saveDocument<Job>('jobs', id, completionData);
      logActivity('Job Completed', 'job', id, 'Technician completed job work & obtained customer signature');
      showToast('Job marked as completed & synced to Firestore!', 'success');
    }
  };

  // Inventory Actions
  const addInventoryItem = (data: Omit<InventoryItem, 'id' | 'businessId'>) => {
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
    const item = inventory.find((i) => i.id === id);
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
      createdBy: currentUser.name,
    };
    firestoreService.saveDocument<InventoryTransaction>('inventoryTransactions', newTx.id, newTx);
    showToast(`Inventory stock adjusted (${type.replace('_', ' ')})`, 'success');
  };

  // Quotation Actions
  const addQuotation = (data: Omit<Quotation, 'id' | 'businessId' | 'quotationNumber'>) => {
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
    firestoreService.saveDocument<Quotation>('quotations', id, { status });
    showToast(`Quotation status changed to ${status}`, 'info');
  };

  const convertQuotationToInvoice = (quotationId: string) => {
    const qt = quotations.find((q) => q.id === quotationId);
    if (!qt) throw new Error('Quotation not found');

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
    firestoreService.saveDocument<Quotation>(quotationId, quotationId, { status: 'approved' });
    logActivity('Converted Quote to Invoice', 'invoice', newInv.id, `Generated invoice ${invNum} from quote ${qt.quotationNumber}`);
    showToast(`Invoice ${invNum} created from Quotation ${qt.quotationNumber}!`, 'success');
    return newInv;
  };

  // Invoice Actions
  const addInvoice = (data: Omit<Invoice, 'id' | 'businessId' | 'invoiceNumber'>) => {
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
    firestoreService.deleteInvoice(id);
    logActivity('Invoice Deleted', 'invoice', id, 'Deleted invoice record from Firestore');
    showToast('Invoice deleted from Firestore', 'info');
  };

  const recordPayment = (data: Omit<Payment, 'id' | 'businessId'>) => {
    const newPmt: Payment = {
      ...data,
      id: `pmt-${Date.now()}`,
      businessId: currentBusiness.id,
    };

    firestoreService.saveDocument<Payment>('payments', newPmt.id, newPmt);

    const inv = invoices.find((i) => i.id === data.invoiceId);
    if (inv) {
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
    const newExp: Expense = {
      ...data,
      id: `exp-${Date.now()}`,
      businessId: currentBusiness.id,
    };
    saveToFirestore('expenses', newExp.id, newExp);
    showToast(`Recorded expense: ${currentBusiness.currency}${newExp.amount}`, 'success');
  };

  // Staff Actions
  const addStaff = (data: Omit<User, 'id' | 'businessId'>) => {
    const newStaff: User = {
      ...data,
      id: `usr-${Date.now()}`,
      businessId: currentBusiness.id,
    };
    saveToFirestore('users', newStaff.id, newStaff);
    showToast(`Staff member "${newStaff.name}" added`, 'success');
    return newStaff;
  };

  const updateBusinessSettings = (updates: Partial<Business>) => {
    const updated = { ...currentBusiness, ...updates };
    setCurrentBusiness(updated);
    saveToFirestore('businesses', currentBusiness.id, updates);
    showToast('Business profile & settings updated and synced to Firestore', 'success');
  };

  const markNotificationRead = (id: string) => {
    saveToFirestore('notifications', id, { read: true });
  };

  const getRolePermissions = (roleCode: UserRole): RolePermission => {
    const r = roles.find((role) => role.code === roleCode);
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
        currentUser,
        setCurrentUser,
        switchRole,
        switchBusiness,
        createBusiness,

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
        updateBusinessSettings,
        updateBusinessProfile: updateBusinessSettings,
        markNotificationRead,

        isOffline: isActuallyOffline,
        isSimulatedOffline,
        pendingSyncQueue,
        syncOfflineQueue,
        toggleSimulateOffline,
        manualSyncLogs,
        triggerManualSync,
        clearSyncLogs,
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

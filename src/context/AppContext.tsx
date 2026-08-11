import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Business,
  User,
  UserRole,
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
} from '../data/demoData';

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

  // Global UI & search state
  isSearchOpen: boolean;
  setIsSearchOpen: (v: boolean) => void;
  isActivityLogOpen: boolean;
  setIsActivityLogOpen: (v: boolean) => void;
  toasts: ToastMessage[];
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  resetDemoData: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  logActivity: (action: string, entityType: ActivityLog['entityType'], entityId: string, description: string) => void;

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

const LOCAL_STORAGE_KEY = 'serviflow_saas_v1_data';

const AppContentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme, toggleTheme } = useTheme();

  // Load from LocalStorage or initialize with DEMO
  const [businesses, setBusinesses] = useState<Business[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_businesses`);
    return saved ? JSON.parse(saved) : DEMO_BUSINESSES;
  });

  const [currentBusiness, setCurrentBusiness] = useState<Business>(() => businesses[0]);

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_users`);
    return saved ? JSON.parse(saved) : DEMO_USERS;
  });

  const [currentUser, setCurrentUser] = useState<User>(() => users[1]); // Default to Rajesh (Business Owner)

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_customers`);
    return saved ? JSON.parse(saved) : DEMO_CUSTOMERS;
  });

  const [categories, setCategories] = useState<ServiceCategory[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_categories`);
    return saved ? JSON.parse(saved) : DEMO_CATEGORIES;
  });

  const [services, setServices] = useState<Service[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_services`);
    return saved ? JSON.parse(saved) : DEMO_SERVICES;
  });

  const [jobs, setJobs] = useState<Job[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_jobs`);
    return saved ? JSON.parse(saved) : DEMO_JOBS;
  });

  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_inventory`);
    return saved ? JSON.parse(saved) : DEMO_INVENTORY;
  });

  const [inventoryTransactions, setInventoryTransactions] = useState<InventoryTransaction[]>([]);

  const [quotations, setQuotations] = useState<Quotation[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_quotations`);
    return saved ? JSON.parse(saved) : DEMO_QUOTATIONS;
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_invoices`);
    return saved ? JSON.parse(saved) : DEMO_INVOICES;
  });

  const [payments, setPayments] = useState<Payment[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_payments`);
    return saved ? JSON.parse(saved) : DEMO_PAYMENTS;
  });

  const [contracts, setContracts] = useState<RecurringContract[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_contracts`);
    return saved ? JSON.parse(saved) : DEMO_CONTRACTS;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_expenses`);
    return saved ? JSON.parse(saved) : DEMO_EXPENSES;
  });

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_notifications`);
    return saved ? JSON.parse(saved) : DEMO_NOTIFICATIONS;
  });

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_activities`);
    return saved ? JSON.parse(saved) : DEMO_ACTIVITIES;
  });

  // Offline Technician Sync States & Manual Sync Logs
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(false);
  const [pendingSyncQueue, setPendingSyncQueue] = useState<OfflineSyncItem[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_pending_sync`);
    return saved ? JSON.parse(saved) : [];
  });

  const [manualSyncLogs, setManualSyncLogs] = useState<ManualSyncLog[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_sync_logs`);
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'sync-log-101',
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        technicianName: 'Suresh Kumar',
        status: 'SUCCESS',
        itemsProcessedCount: 3,
        triggerType: 'MANUAL_BUTTON',
        details: '3 job status updates and digital signatures synchronized with Cloud DB.',
        itemsSynced: [
          { jobId: 'JOB-1024', description: 'Updated status to Completed & Customer Signature saved', action: 'complete_job', timestamp: new Date(Date.now() - 1000 * 60 * 20).toISOString() },
          { jobId: 'JOB-1025', description: 'Added voice note & updated problem diagnosis', action: 'update_job', timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString() },
          { jobId: 'JOB-1026', description: 'Updated technician status to On The Way', action: 'update_job_status', timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString() },
        ],
        networkLatencyMs: 142,
      },
      {
        id: 'sync-log-100',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
        technicianName: 'Suresh Kumar',
        status: 'SUCCESS',
        itemsProcessedCount: 1,
        triggerType: 'AUTO_RECONNECT',
        details: 'Auto-sync upon cellular network reconnection. 1 cached material record uploaded.',
        itemsSynced: [
          { jobId: 'JOB-1022', description: 'Recorded inventory parts used (2x 100A MCB Breaker)', action: 'update_job', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3.5).toISOString() },
        ],
        networkLatencyMs: 210,
      },
      {
        id: 'sync-log-099',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        technicianName: 'Rajesh Sharma',
        status: 'NO_CHANGES',
        itemsProcessedCount: 0,
        triggerType: 'MANUAL_BUTTON',
        details: 'Manual sync check executed. All local offline queues already in sync.',
        itemsSynced: [],
        networkLatencyMs: 88,
      },
    ];
  });

  const isActuallyOffline = isOffline || isSimulatedOffline;

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isActivityLogOpen, setIsActivityLogOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Persist state to localStorage
  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_businesses`, JSON.stringify(businesses));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_users`, JSON.stringify(users));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_customers`, JSON.stringify(customers));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_categories`, JSON.stringify(categories));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_services`, JSON.stringify(services));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_jobs`, JSON.stringify(jobs));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_inventory`, JSON.stringify(inventory));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_quotations`, JSON.stringify(quotations));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_invoices`, JSON.stringify(invoices));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_payments`, JSON.stringify(payments));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_contracts`, JSON.stringify(contracts));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_expenses`, JSON.stringify(expenses));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_notifications`, JSON.stringify(notifications));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_activities`, JSON.stringify(activityLogs));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_pending_sync`, JSON.stringify(pendingSyncQueue));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_sync_logs`, JSON.stringify(manualSyncLogs));
  }, [
    businesses,
    users,
    customers,
    categories,
    services,
    jobs,
    inventory,
    quotations,
    invoices,
    payments,
    contracts,
    expenses,
    notifications,
    activityLogs,
    pendingSyncQueue,
    manualSyncLogs,
  ]);

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
      setManualSyncLogs((prev) => [logEntry, ...prev]);
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

      setManualSyncLogs((prev) => [logEntry, ...prev]);
      setPendingSyncQueue([]);
      showToast(`Successfully synchronized ${syncedItems.length} queued update(s)!`, 'success');
    } else {
      const logEntry: ManualSyncLog = {
        id: `sync-log-${Date.now()}`,
        timestamp: nowISO,
        technicianName: currentUser.name,
        status: 'NO_CHANGES',
        itemsProcessedCount: 0,
        triggerType,
        details: 'Manual verification completed. All technician records & local state are fully synchronized.',
        itemsSynced: [],
        networkLatencyMs: simulatedLatency,
      };

      setManualSyncLogs((prev) => [logEntry, ...prev]);
      showToast('Sync check complete! All local offline records are up-to-date.', 'info');
    }
  };

  const syncOfflineQueue = () => {
    triggerManualSync('AUTO_RECONNECT');
  };

  const clearSyncLogs = () => {
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
    localStorage.clear();
    setBusinesses(DEMO_BUSINESSES);
    setCurrentBusiness(DEMO_BUSINESSES[0]);
    setUsers(DEMO_USERS);
    setCurrentUser(DEMO_USERS[1]);
    setCustomers(DEMO_CUSTOMERS);
    setCategories(DEMO_CATEGORIES);
    setServices(DEMO_SERVICES);
    setJobs(DEMO_JOBS);
    setInventory(DEMO_INVENTORY);
    setQuotations(DEMO_QUOTATIONS);
    setInvoices(DEMO_INVOICES);
    setPayments(DEMO_PAYMENTS);
    setContracts(DEMO_CONTRACTS);
    setExpenses(DEMO_EXPENSES);
    setNotifications(DEMO_NOTIFICATIONS);
    setActivityLogs(DEMO_ACTIVITIES);
    showToast('Reset data to initial demo state', 'success');
  };

  const logActivity = (action: string, entityType: ActivityLog['entityType'], entityId: string, description: string) => {
    const newLog: ActivityLog = {
      id: `act-${Date.now()}`,
      businessId: currentBusiness.id,
      action,
      entityType,
      entityId,
      description,
      timestamp: new Date().toISOString(),
      userName: currentUser.name,
    };
    setActivityLogs((prev) => [newLog, ...prev]);
  };

  // Switch role helper for live demo toggling
  const switchRole = (role: UserRole) => {
    if (role === 'super_admin') {
      const adminUser = users.find((u) => u.role === 'super_admin') || {
        id: 'usr-admin',
        name: 'SaaS Platform Admin',
        email: 'admin@serviflow.io',
        phone: '+91 90000 00000',
        role: 'super_admin',
        businessId: 'all',
        status: 'active',
      };
      setCurrentUser(adminUser);
      showToast('Switched to Super Admin Role', 'info');
      return;
    }

    // Find first user with target role in current business or create mock
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
      setUsers((prev) => [...prev, target!]);
    }
    setCurrentUser(target);
    showToast(`Switched active role to: ${role.replace('_', ' ').toUpperCase()}`, 'info');
  };

  // Switch business tenant
  const switchBusiness = (bId: string) => {
    const target = businesses.find((b) => b.id === bId);
    if (target) {
      setCurrentBusiness(target);
      // Auto assign user context to owner or tech of that business
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

    setBusinesses((prev) => [newBiz, ...prev]);
    setUsers((prev) => [...prev, ownerUser]);
    setCategories((prev) => [...prev, defaultCategory]);
    setServices((prev) => [...prev, defaultService]);

    setCurrentBusiness(newBiz);
    setCurrentUser(ownerUser);
    showToast(`Welcome! Business "${newBiz.name}" onboarded successfully.`, 'success');
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
    const newCust: Customer = {
      ...data,
      id: `cust-${Date.now()}`,
      businessId: currentBusiness.id,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setCustomers((prev) => [newCust, ...prev]);
    logActivity('Customer Created', 'customer', newCust.id, `Created customer record for ${newCust.name}`);
    showToast(`Added customer: ${newCust.name}`, 'success');
    return newCust;
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    showToast('Customer information updated', 'success');
  };

  const deleteCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    showToast('Customer deleted', 'info');
  };

  // Services Actions
  const addServiceCategory = (name: string, description?: string) => {
    const newCat: ServiceCategory = {
      id: `cat-${Date.now()}`,
      businessId: currentBusiness.id,
      name,
      description,
    };
    setCategories((prev) => [...prev, newCat]);
    showToast(`Added category: ${name}`, 'success');
    return newCat;
  };

  const addService = (data: Omit<Service, 'id' | 'businessId'>) => {
    const newSrv: Service = {
      ...data,
      id: `srv-${Date.now()}`,
      businessId: currentBusiness.id,
    };
    setServices((prev) => [...prev, newSrv]);
    showToast(`Service "${newSrv.name}" created`, 'success');
  };

  const updateService = (id: string, updates: Partial<Service>) => {
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
    showToast('Service details updated', 'success');
  };

  const deleteService = (id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
    showToast('Service removed', 'info');
  };

  // Job Actions
  const addJob = (data: Omit<Job, 'id' | 'businessId' | 'jobId' | 'createdAt'>) => {
    const count = filteredJobs.length + 101;
    const jobId = `JOB-${new Date().getFullYear()}-${count}`;
    const newJob: Job = {
      ...data,
      id: `job-${Date.now()}`,
      businessId: currentBusiness.id,
      jobId,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setJobs((prev) => [newJob, ...prev]);
    logActivity('Job Created', 'job', newJob.id, `Created job ${jobId}`);
    showToast(`Job ${jobId} created successfully!`, 'success');
    return newJob;
  };

  const updateJob = (id: string, updates: Partial<Job>) => {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...updates } : j)));
    if (isActuallyOffline) {
      addToSyncQueue('update_job', id, updates, 'Updated job schedule/assignment');
      showToast('Offline Mode: Saved locally and queued for sync.', 'info');
    } else {
      logActivity('Job Updated', 'job', id, 'Updated job assignment and schedule');
      showToast('Job updated successfully', 'success');
    }
  };

  const updateJobStatus = (id: string, status: JobStatus) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === id ? { ...j, status } : j))
    );
    if (isActuallyOffline) {
      addToSyncQueue('update_job_status', id, { status }, `Job status changed to ${status.replace('_', ' ')}`);
      showToast(`Offline Mode: Status updated to ${status.replace('_', ' ')} (queued)`, 'info');
    } else {
      logActivity('Job Status Updated', 'job', id, `Changed job status to ${status.replace('_', ' ').toUpperCase()}`);
      showToast(`Job status updated to ${status.replace('_', ' ')}`, 'info');
    }
  };

  const startJob = (id: string, beforePhotos: string[], notes?: string) => {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === id
          ? {
              ...j,
              status: 'started',
              beforePhotos: beforePhotos.length > 0 ? beforePhotos : j.beforePhotos,
              startTime: new Date().toISOString(),
              notes: notes ? `${j.notes || ''}\nStart Notes: ${notes}` : j.notes,
            }
          : j
      )
    );
    if (isActuallyOffline) {
      addToSyncQueue('start_job', id, { beforePhotos, notes }, 'Technician started job work on site');
      showToast('Offline Mode: Job start logged locally & queued for sync.', 'info');
    } else {
      logActivity('Job Work Started', 'job', id, 'Technician initiated work on site');
      showToast('Job work started!', 'success');
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
    // Reduce stock for materials used
    if (data.materialsUsed && data.materialsUsed.length > 0) {
      setInventory((prev) =>
        prev.map((item) => {
          const used = data.materialsUsed?.find((m) => m.inventoryItemId === item.id);
          if (used) {
            const newStock = Math.max(0, item.currentStock - used.quantity);
            return { ...item, currentStock: newStock };
          }
          return item;
        })
      );
    }

    setJobs((prev) =>
      prev.map((j) =>
        j.id === id
          ? {
              ...j,
              status: 'completed',
              completionTime: new Date().toISOString(),
              problemFound: data.problemFound,
              solutionProvided: data.solutionProvided,
              afterPhotos: data.afterPhotos,
              customerSignature: data.customerSignature,
              customerRating: data.customerRating || 5,
              customerFeedback: data.customerFeedback,
              materialsUsed: data.materialsUsed,
            }
          : j
      )
    );
    if (isActuallyOffline) {
      addToSyncQueue('complete_job', id, data, 'Technician completed job & recorded customer report/signature');
      showToast('Offline Mode: Job report saved locally & queued for sync!', 'success');
    } else {
      logActivity('Job Completed', 'job', id, 'Technician completed job work & obtained customer signature');
      showToast('Job marked as completed & Service Report generated!', 'success');
    }
  };

  // Inventory Actions
  const addInventoryItem = (data: Omit<InventoryItem, 'id' | 'businessId'>) => {
    const newItem: InventoryItem = {
      ...data,
      id: `inv-${Date.now()}`,
      businessId: currentBusiness.id,
    };
    setInventory((prev) => [...prev, newItem]);
    showToast(`Added inventory item: ${newItem.name}`, 'success');
  };

  const updateInventoryStock = (
    id: string,
    qty: number,
    type: 'stock_in' | 'stock_out' | 'adjustment',
    notes?: string
  ) => {
    setInventory((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const diff = type === 'stock_out' ? -qty : qty;
          const newStock = Math.max(0, item.currentStock + diff);
          return { ...item, currentStock: newStock };
        }
        return item;
      })
    );
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
    setInventoryTransactions((prev) => [newTx, ...prev]);
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
    setQuotations((prev) => [newQt, ...prev]);
    logActivity('Quotation Created', 'quotation', newQt.id, `Created quotation ${num}`);
    showToast(`Quotation ${num} created`, 'success');
    return newQt;
  };

  const updateQuotationStatus = (id: string, status: Quotation['status']) => {
    setQuotations((prev) => prev.map((q) => (q.id === id ? { ...q, status } : q)));
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

    setInvoices((prev) => [newInv, ...prev]);
    setQuotations((prev) => prev.map((q) => (q.id === quotationId ? { ...q, status: 'approved' } : q)));
    logActivity('Converted Quote to Invoice', 'invoice', newInv.id, `Generated invoice ${invNum} from quote ${qt.quotationNumber}`);
    showToast(`Invoice ${invNum} created from Quotation ${qt.quotationNumber}!`, 'success');
    return newInv;
  };

  // Invoice Actions
  const addInvoice = (data: Omit<Invoice, 'id' | 'businessId' | 'invoiceNumber'>) => {
    const num = `INV-${new Date().getFullYear()}-${filteredInvoices.length + 101}`;
    const newInv: Invoice = {
      ...data,
      id: `invc-${Date.now()}`,
      businessId: currentBusiness.id,
      invoiceNumber: num,
    };
    setInvoices((prev) => [newInv, ...prev]);
    logActivity('Invoice Created', 'invoice', newInv.id, `Created invoice ${num}`);
    showToast(`Invoice ${num} generated`, 'success');
    return newInv;
  };

  const recordPayment = (data: Omit<Payment, 'id' | 'businessId'>) => {
    const newPmt: Payment = {
      ...data,
      id: `pmt-${Date.now()}`,
      businessId: currentBusiness.id,
    };

    setPayments((prev) => [newPmt, ...prev]);

    // Update Invoice balances
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id === data.invoiceId) {
          const newPaid = inv.paidAmount + data.amount;
          const newBalance = Math.max(0, inv.grandTotal - newPaid);
          const newStatus: Invoice['status'] =
            newBalance <= 0 ? 'paid' : newPaid > 0 ? 'partial' : 'pending';
          return {
            ...inv,
            paidAmount: newPaid,
            balanceAmount: newBalance,
            status: newStatus,
          };
        }
        return inv;
      })
    );

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
    setContracts((prev) => [newContract, ...prev]);
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
    setExpenses((prev) => [newExp, ...prev]);
    showToast(`Recorded expense: ${currentBusiness.currency}${newExp.amount}`, 'success');
  };

  // Staff Actions
  const addStaff = (data: Omit<User, 'id' | 'businessId'>) => {
    const newStaff: User = {
      ...data,
      id: `usr-${Date.now()}`,
      businessId: currentBusiness.id,
    };
    setUsers((prev) => [...prev, newStaff]);
    showToast(`Staff member "${newStaff.name}" added`, 'success');
    return newStaff;
  };

  const updateBusinessSettings = (updates: Partial<Business>) => {
    const updated = { ...currentBusiness, ...updates };
    setCurrentBusiness(updated);
    setBusinesses((prev) => prev.map((b) => (b.id === currentBusiness.id ? updated : b)));
    showToast('Business settings updated', 'success');
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
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

        isSearchOpen,
        setIsSearchOpen,
        isActivityLogOpen,
        setIsActivityLogOpen,
        toasts,
        showToast,
        resetDemoData,
        theme,
        toggleTheme,
        logActivity,

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
        startJob,
        completeJob,

        addInventoryItem,
        updateInventoryStock,

        addQuotation,
        updateQuotationStatus,
        convertQuotationToInvoice,

        addInvoice,
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

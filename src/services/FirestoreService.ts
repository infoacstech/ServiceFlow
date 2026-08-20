import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  getDoc,
  writeBatch,
  query,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, cleanFirestoreData } from '../lib/firebase';
import {
  Customer,
  Job,
  Invoice,
  Quotation,
  Payment,
  RecurringContract,
  Expense,
  ServiceCategory,
  Service,
  InventoryItem,
  InventoryTransaction,
  Business,
  User,
  Notification,
  ActivityLog,
  Role,
  ManualSyncLog,
  ReferralRecord,
  ReferralPayoutRequest,
} from '../types';

/**
 * Centralized FirestoreService that forces all CRUD operations for customers, jobs, invoices,
 * and workspace data to interact exclusively with Firestore, guaranteeing real-time synchronization
 * and persistence across multiple sessions.
 */
export class FirestoreService {
  /**
   * Generic real-time collection subscription wrapper
   */
  static subscribeCollection<T>(
    collectionName: string,
    onData: (items: T[]) => void,
    onError?: (error: unknown) => void
  ): () => void {
    return onSnapshot(
      collection(db, collectionName),
      (snapshot) => {
        const items = snapshot.docs.map((doc) => doc.data() as T);
        onData(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, collectionName);
        if (onError) onError(error);
      }
    );
  }

  /**
   * Generic document save (Create or Merge Update) directly in Firestore
   */
  static async saveDocument<T extends { id: string }>(
    collectionName: string,
    id: string,
    data: Partial<T>
  ): Promise<void> {
    try {
      await setDoc(doc(db, collectionName, id), cleanFirestoreData(data), { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${collectionName}/${id}`);
    }
  }

  /**
   * Generic document deletion directly in Firestore
   */
  static async deleteDocument(collectionName: string, id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, collectionName, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${collectionName}/${id}`);
    }
  }

  /**
   * Safely purges all dummy/test transactional records across all transactional collections,
   * PRESERVING Super Admin accounts, Business Owner users, Business settings, Roles, and System policies.
   */
  static async purgeAllTransactionalData(): Promise<{ clearedCollections: string[]; totalDocsDeleted: number }> {
    const transactionalCollections = [
      'customers',
      'jobs',
      'services',
      'categories',
      'inventory',
      'inventoryTransactions',
      'quotations',
      'invoices',
      'payments',
      'contracts',
      'expenses',
      'notifications',
      'activities',
      'manualSyncLogs',
    ];

    let totalDeleted = 0;
    const cleared: string[] = [];

    for (const colName of transactionalCollections) {
      try {
        const snap = await getDocs(collection(db, colName));
        if (!snap.empty) {
          const batch = writeBatch(db);
          snap.docs.forEach((d) => {
            batch.delete(d.ref);
            totalDeleted++;
          });
          await batch.commit();
          cleared.push(colName);
        }
      } catch (err) {
        console.error(`Error purging collection ${colName}:`, err);
      }
    }

    return { clearedCollections: cleared, totalDocsDeleted: totalDeleted };
  }

  /**
   * Performs a 100% complete database wipe, deleting all dummy businesses, tenant associations,
   * all dummy staff/owners/customers/records, and preserving ONLY the Super Admin account.
   */
  static async wipeAllExceptSuperAdmin(): Promise<{ totalDocsDeleted: number }> {
    let totalDocsDeleted = 0;

    // 1. Purge all transactional and operational collections
    const collectionsToWipe = [
      'customers',
      'jobs',
      'services',
      'categories',
      'inventory',
      'inventoryTransactions',
      'quotations',
      'invoices',
      'payments',
      'contracts',
      'expenses',
      'notifications',
      'activities',
      'manualSyncLogs',
      'tenantMembers',
      'tenants',
      'businesses',
    ];

    for (const colName of collectionsToWipe) {
      try {
        const snap = await getDocs(collection(db, colName));
        if (!snap.empty) {
          const batch = writeBatch(db);
          snap.docs.forEach((d) => {
            // Keep 'all' platform business if present, wipe everything else
            if (colName === 'businesses' && d.id === 'all') return;
            batch.delete(d.ref);
            totalDocsDeleted++;
          });
          await batch.commit();
        }
      } catch (err) {
        console.error(`Error wiping collection ${colName}:`, err);
      }
    }

    // 2. Wipe all non-SuperAdmin users
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      if (!usersSnap.empty) {
        const batch = writeBatch(db);
        usersSnap.docs.forEach((d) => {
          const u = d.data() as User;
          if (u.role !== 'super_admin' && u.email !== 'admin@serviflow.io' && d.id !== 'usr-admin') {
            batch.delete(d.ref);
            totalDocsDeleted++;
          }
        });
        await batch.commit();
      }
    } catch (err) {
      console.error('Error wiping users:', err);
    }

    // 3. Clear all browser local cached state
    try {
      localStorage.removeItem('serviflow_businesses_cache');
      localStorage.removeItem('serviflow_users_cache');
      localStorage.removeItem('serviflow_customers_cache');
      localStorage.removeItem('serviflow_jobs_cache');
      localStorage.removeItem('serviflow_invoices_cache');
      localStorage.removeItem('serviflow_inventory_cache');
      localStorage.removeItem('serviflow_quotations_cache');
      localStorage.removeItem('serviflow_payments_cache');
      localStorage.removeItem('serviflow_contracts_cache');
      localStorage.removeItem('serviflow_expenses_cache');
    } catch (e) {
      console.warn('Cache clear error:', e);
    }

    return { totalDocsDeleted };
  }

  /**
   * Tenant-isolated data purge: clears transactional records belonging only to the specified business ID.
   */
  static async purgeTenantTransactionalData(businessId: string): Promise<{ clearedCollections: string[]; totalDocsDeleted: number }> {
    if (!businessId || businessId === 'all') return { clearedCollections: [], totalDocsDeleted: 0 };

    const tenantCollections = [
      'customers',
      'jobs',
      'services',
      'categories',
      'inventory',
      'inventoryTransactions',
      'quotations',
      'invoices',
      'payments',
      'contracts',
      'expenses',
      'notifications',
      'activities',
      'manualSyncLogs',
    ];

    let totalDeleted = 0;
    const cleared: string[] = [];

    for (const colName of tenantCollections) {
      try {
        const q = query(collection(db, colName), where('businessId', '==', businessId));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const batch = writeBatch(db);
          snap.docs.forEach((d) => {
            batch.delete(d.ref);
            totalDeleted++;
          });
          await batch.commit();
          cleared.push(colName);
        }
      } catch (err) {
        console.error(`Error purging tenant collection ${colName} for business ${businessId}:`, err);
      }
    }

    return { clearedCollections: cleared, totalDocsDeleted: totalDeleted };
  }

  /**
   * Safely deletes a business tenant entirely, including all its associated users and transactional data,
   * while strictly safeguarding the Super Admin account.
   */
  static async deleteBusinessAndTenant(businessId: string): Promise<void> {
    if (!businessId || businessId === 'all') return;

    // 1. Purge all transactional records for this business
    await this.purgeTenantTransactionalData(businessId);

    // 2. Delete all non-admin users and memberships for this business
    try {
      const allUsersSnap = await getDocs(collection(db, 'users'));
      if (!allUsersSnap.empty) {
        const batch = writeBatch(db);
        let count = 0;
        allUsersSnap.docs.forEach((d) => {
          const uData = d.data() as User;
          if (
            uData.businessId === businessId &&
            uData.role !== 'super_admin' &&
            uData.email !== 'admin@serviflow.io' &&
            d.id !== 'usr-admin'
          ) {
            batch.delete(d.ref);
            count++;
          }
        });
        if (count > 0) {
          await batch.commit();
        }
      }
    } catch (err) {
      console.error(`Error deleting users for business ${businessId}:`, err);
    }

    // 2b. Delete tenantMemberships
    try {
      const memSnap = await getDocs(collection(db, 'tenantMembers'));
      if (!memSnap.empty) {
        const batch = writeBatch(db);
        let memCount = 0;
        memSnap.docs.forEach((d) => {
          const mData = d.data() as any;
          if (mData.tenantId === businessId || d.id.startsWith(`${businessId}_`)) {
            batch.delete(d.ref);
            memCount++;
          }
        });
        if (memCount > 0) {
          await batch.commit();
        }
      }
    } catch (err) {
      console.warn(`Error deleting memberships for business ${businessId}:`, err);
    }

    // 3. Delete referral records and payout requests associated with this business
    try {
      const refQuery1 = query(collection(db, 'referrals'), where('referrerBusinessId', '==', businessId));
      const refSnap1 = await getDocs(refQuery1);
      if (!refSnap1.empty) {
        const batch = writeBatch(db);
        refSnap1.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
      const refQuery2 = query(collection(db, 'referrals'), where('referredBusinessId', '==', businessId));
      const refSnap2 = await getDocs(refQuery2);
      if (!refSnap2.empty) {
        const batch = writeBatch(db);
        refSnap2.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
      const pQuery = query(collection(db, 'referralPayouts'), where('businessId', '==', businessId));
      const pSnap = await getDocs(pQuery);
      if (!pSnap.empty) {
        const batch = writeBatch(db);
        pSnap.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
    } catch (err) {
      console.warn(`Error cleaning up referral records for ${businessId}:`, err);
    }

    // 4. Delete the business document itself (from 'businesses' and 'tenants')
    try {
      await deleteDoc(doc(db, 'businesses', businessId));
    } catch (err) {
      console.error(`Error deleting business doc ${businessId}:`, err);
    }
    try {
      await deleteDoc(doc(db, 'tenants', businessId));
    } catch (err) {}
  }

  /**
   * Safely deletes a single user, preventing deletion of Super Admin.
   */
  static async deleteUser(userId: string): Promise<void> {
    if (!userId) return;
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const u = userSnap.data() as User;
        if (u.role === 'super_admin' || u.email === 'admin@serviflow.io' || u.id === 'usr-admin') {
          throw new Error('Cannot delete Super Admin account.');
        }
      }
      await deleteDoc(userRef);
    } catch (err) {
      console.error(`Error deleting user ${userId}:`, err);
      throw err;
    }
  }

  // =========================================================================
  // CUSTOMER CRUD OPERATIONS
  // =========================================================================
  static subscribeCustomers(onData: (customers: Customer[]) => void): () => void {
    return this.subscribeCollection<Customer>('customers', onData);
  }

  static async createCustomer(
    data: Omit<Customer, 'id' | 'businessId' | 'createdAt'>,
    businessId: string
  ): Promise<Customer> {
    const id = `cust-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newCustomer: Customer = {
      ...data,
      id,
      businessId,
      createdAt: new Date().toISOString().split('T')[0],
    };
    await this.saveDocument<Customer>('customers', id, newCustomer);
    return newCustomer;
  }

  static async updateCustomer(id: string, updates: Partial<Customer>): Promise<void> {
    await this.saveDocument<Customer>('customers', id, updates);
  }

  static async deleteCustomer(id: string): Promise<void> {
    await this.deleteDocument('customers', id);
  }

  // =========================================================================
  // JOB CRUD OPERATIONS
  // =========================================================================
  static subscribeJobs(onData: (jobs: Job[]) => void): () => void {
    return this.subscribeCollection<Job>('jobs', onData);
  }

  static async createJob(
    data: Omit<Job, 'id' | 'businessId' | 'jobId' | 'createdAt'>,
    businessId: string,
    jobCount: number
  ): Promise<Job> {
    const id = `job-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const jobId = `JOB-${new Date().getFullYear()}-${jobCount + 101}`;
    const newJob: Job = {
      ...data,
      id,
      businessId,
      jobId,
      createdAt: new Date().toISOString().split('T')[0],
    };
    await this.saveDocument<Job>('jobs', id, newJob);
    return newJob;
  }

  static async updateJob(id: string, updates: Partial<Job>): Promise<void> {
    await this.saveDocument<Job>('jobs', id, updates);
  }

  static async deleteJob(id: string): Promise<void> {
    await this.deleteDocument('jobs', id);
  }

  // =========================================================================
  // INVOICE CRUD OPERATIONS
  // =========================================================================
  static subscribeInvoices(onData: (invoices: Invoice[]) => void): () => void {
    return this.subscribeCollection<Invoice>('invoices', onData);
  }

  static async createInvoice(
    data: Omit<Invoice, 'id' | 'businessId' | 'invoiceNumber'>,
    businessId: string,
    invoiceCount: number
  ): Promise<Invoice> {
    const id = `invc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const invoiceNumber = `INV-${new Date().getFullYear()}-${invoiceCount + 101}`;
    const newInvoice: Invoice = {
      ...data,
      id,
      businessId,
      invoiceNumber,
    };
    await this.saveDocument<Invoice>('invoices', id, newInvoice);
    return newInvoice;
  }

  static async updateInvoice(id: string, updates: Partial<Invoice>): Promise<void> {
    await this.saveDocument<Invoice>('invoices', id, updates);
  }

  static async deleteInvoice(id: string): Promise<void> {
    await this.deleteDocument('invoices', id);
  }

  // =========================================================================
  // ADDITIONAL WORKSPACE ENTITY OPERATIONS
  // =========================================================================
  static async createQuotation(
    data: Omit<Quotation, 'id' | 'businessId' | 'quotationNumber'>,
    businessId: string,
    quoteCount: number
  ): Promise<Quotation> {
    const id = `qt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const quotationNumber = `QT-${new Date().getFullYear()}-${quoteCount + 101}`;
    const newQt: Quotation = {
      ...data,
      id,
      businessId,
      quotationNumber,
    };
    await this.saveDocument<Quotation>('quotations', id, newQt);
    return newQt;
  }

  static async createPayment(
    data: Omit<Payment, 'id' | 'businessId'>,
    businessId: string
  ): Promise<Payment> {
    const id = `pmt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newPayment: Payment = {
      ...data,
      id,
      businessId,
    };
    await this.saveDocument<Payment>('payments', id, newPayment);
    return newPayment;
  }

  static async createContract(
    data: Omit<RecurringContract, 'id' | 'businessId' | 'contractNumber'>,
    businessId: string,
    contractCount: number
  ): Promise<RecurringContract> {
    const id = `amc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const contractNumber = `AMC-${new Date().getFullYear()}-${contractCount + 101}`;
    const newContract: RecurringContract = {
      ...data,
      id,
      businessId,
      contractNumber,
    };
    await this.saveDocument<RecurringContract>('contracts', id, newContract);
    return newContract;
  }

  static async createExpense(
    data: Omit<Expense, 'id' | 'businessId'>,
    businessId: string
  ): Promise<Expense> {
    const id = `exp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newExpense: Expense = {
      ...data,
      id,
      businessId,
    };
    await this.saveDocument<Expense>('expenses', id, newExpense);
    return newExpense;
  }

  static async createStaffUser(
    data: Omit<User, 'id' | 'businessId'>,
    businessId: string
  ): Promise<User> {
    const id = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newUser: User = {
      ...data,
      id,
      businessId,
    };
    await this.saveDocument<User>('users', id, newUser);
    return newUser;
  }

  static async createServiceCategory(
    name: string,
    description: string | undefined,
    businessId: string
  ): Promise<ServiceCategory> {
    const id = `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newCat: ServiceCategory = {
      id,
      businessId,
      name,
      description,
    };
    await this.saveDocument<ServiceCategory>('categories', id, newCat);
    return newCat;
  }

  static async createService(
    data: Omit<Service, 'id' | 'businessId'>,
    businessId: string
  ): Promise<Service> {
    const id = `srv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newSrv: Service = {
      ...data,
      id,
      businessId,
    };
    await this.saveDocument<Service>('services', id, newSrv);
    return newSrv;
  }

  static async createInventoryItem(
    data: Omit<InventoryItem, 'id' | 'businessId'>,
    businessId: string
  ): Promise<InventoryItem> {
    const id = `inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newItem: InventoryItem = {
      ...data,
      id,
      businessId,
    };
    await this.saveDocument<InventoryItem>('inventory', id, newItem);
    return newItem;
  }

  static async logActivity(log: ActivityLog): Promise<void> {
    await this.saveDocument<ActivityLog>('activities', log.id, log);
  }

  // =========================================================================
  // SUPPORT SESSIONS & SECURITY AUDIT LOGGING
  // =========================================================================
  static async logSecurityAudit(log: any): Promise<void> {
    await this.saveDocument('securityAuditLogs', log.id, log);
  }

  static async saveSupportSession(session: any): Promise<void> {
    await this.saveDocument('supportSessions', session.id, session);
  }

  static async saveSystemSettings(settings: any): Promise<void> {
    await this.saveDocument('systemSettings', settings.id || 'global', settings);
  }

  // =========================================================================
  // REFERRAL SYSTEM & BONUS SETTLEMENT
  // =========================================================================
  static async saveReferral(referral: ReferralRecord): Promise<void> {
    await this.saveDocument<ReferralRecord>('referrals', referral.id, referral);
  }

  static async deleteReferral(referralId: string): Promise<void> {
    await this.deleteDocument('referrals', referralId);
  }

  static async saveReferralPayout(payout: ReferralPayoutRequest): Promise<void> {
    await this.saveDocument<ReferralPayoutRequest>('referralPayouts', payout.id, payout);
  }
}

export const firestoreService = FirestoreService;

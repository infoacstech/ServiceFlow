import { User, UserRole } from '../types';

/**
 * Strict Role-Based Access Control (RBAC) Engine for ServiFlow
 *
 * Rules:
 * 1. BUSINESS OWNER (and Super Admin):
 *    - Full control (CREATE, READ, UPDATE, DELETE) across all tenant records
 *    - Manage Staff, change roles, approve/reject/delete staff accounts
 *    - Manage Business Profile, Subscription, and Configurations
 *
 * 2. MANAGER:
 *    - Operational Additions: CREATE Customers, Jobs, Services, Invoices, Quotations, Contracts, Expenses, Inventory
 *    - Read all tenant operational data
 *    - STRICTLY FORBIDDEN: Modifying/Editing existing business data, Deleting any records, Managing staff/roles, Changing business settings
 *
 * 3. STAFF / TECHNICIAN:
 *    - Operational Additions: CREATE Customers, Jobs, Services, Invoices, Quotations, Contracts, Expenses, Inventory
 *    - Operational Execution: Update job lifecycle status (accept, on-the-way, start, complete with photos/ratings)
 *    - STRICTLY FORBIDDEN: Modifying core existing business data, Deleting any records, Managing staff/roles, Changing business settings
 */

export type RBACOperation = 'create' | 'read' | 'update' | 'delete';
export type RBACObject =
  | 'customer'
  | 'job'
  | 'service'
  | 'category'
  | 'invoice'
  | 'quotation'
  | 'payment'
  | 'contract'
  | 'expense'
  | 'inventory'
  | 'enquiry'
  | 'staff'
  | 'business_settings';

/**
 * Returns true if the user is a Platform Super Admin or Business Owner of the tenant
 */
export function isBusinessOwnerOrAdmin(user: User | null | undefined): boolean {
  if (!user) return false;
  return user.role === 'business_owner' || user.role === 'super_admin';
}

/**
 * Returns true if the user is a Manager
 */
export function isManagerRole(user: User | null | undefined): boolean {
  if (!user) return false;
  return user.role === 'manager';
}

/**
 * Returns true if the user is a Field Staff / Technician
 */
export function isStaffOrTechnician(user: User | null | undefined): boolean {
  if (!user) return false;
  return user.role === 'technician';
}

/**
 * Checks if the user is authorized to CREATE a record of the specified entity type
 */
export function canCreateRecord(
  user: User | null | undefined,
  entity: RBACObject
): { allowed: boolean; reason?: string } {
  if (!user) {
    return { allowed: false, reason: 'Authentication required' };
  }

  // Super Admin & Business Owner can create anything
  if (isBusinessOwnerOrAdmin(user)) {
    return { allowed: true };
  }

  // Staff and Manager cannot create/add staff or configure business settings
  if (entity === 'staff' || entity === 'business_settings') {
    return {
      allowed: false,
      reason: `Only Business Owners can add staff members or modify business settings.`,
    };
  }

  // Managers and Staff can create all operational records (Customers, Jobs, Invoices, Services, Quotes, Inventory, etc.)
  return { allowed: true };
}

/**
 * Checks if the user is authorized to UPDATE/MODIFY an existing record
 */
export function canUpdateRecord(
  user: User | null | undefined,
  entity: RBACObject,
  isJobExecutionLifecycle = false
): { allowed: boolean; reason?: string } {
  if (!user) {
    return { allowed: false, reason: 'Authentication required' };
  }

  // Super Admin & Business Owner have full modification permissions
  if (isBusinessOwnerOrAdmin(user)) {
    return { allowed: true };
  }

  // Authorized staff (Managers) can edit customer records
  if (entity === 'customer' && isManagerRole(user)) {
    return { allowed: true };
  }

  // Job execution lifecycle updates (technician starting, reporting, completing assigned jobs)
  if (entity === 'job' && isJobExecutionLifecycle) {
    return { allowed: true };
  }

  // Otherwise, field staff/technicians have read-only access to customer & master data
  return {
    allowed: false,
    reason: `Permission Denied: Only Business Owners and authorized managers can edit ${entity.replace('_', ' ')} records.`,
  };
}

/**
 * Checks if the user is authorized to DELETE a record
 */
export function canDeleteRecord(
  user: User | null | undefined,
  entity: RBACObject
): { allowed: boolean; reason?: string } {
  if (!user) {
    return { allowed: false, reason: 'Authentication required' };
  }

  // Super Admin & Business Owner have exclusive delete authority
  if (isBusinessOwnerOrAdmin(user)) {
    return { allowed: true };
  }

  // Managers and Staff are strictly prohibited from deleting any business records
  return {
    allowed: false,
    reason: `Permission Denied: Deletion restricted to Business Owners only. You do not have permission to delete ${entity.replace('_', ' ')} records.`,
  };
}

/**
 * Checks if the user has permission to manage staff members (add, delete, approve, block)
 */
export function canManageStaffMembers(user: User | null | undefined): { allowed: boolean; reason?: string } {
  if (!user) return { allowed: false, reason: 'Authentication required' };
  if (isBusinessOwnerOrAdmin(user)) return { allowed: true };
  return {
    allowed: false,
    reason: 'Permission Denied: Only Business Owners can add, edit, or remove staff members.',
  };
}

/**
 * Checks if the user has permission to change business configurations / settings
 */
export function canManageBusinessSettings(user: User | null | undefined): { allowed: boolean; reason?: string } {
  if (!user) return { allowed: false, reason: 'Authentication required' };
  if (isBusinessOwnerOrAdmin(user)) return { allowed: true };
  return {
    allowed: false,
    reason: 'Permission Denied: Only Business Owners can modify business profile and settings.',
  };
}

/**
 * Validates tenant isolation to ensure no cross-tenant modification or access occurs
 */
export function validateTenantIsolation(
  currentUser: User | null | undefined,
  currentBusinessId: string | undefined,
  targetBusinessId: string | undefined
): { allowed: boolean; reason?: string } {
  if (!currentUser) {
    return { allowed: false, reason: 'Authentication required' };
  }

  // Super Admin can access all tenants
  if (currentUser.role === 'super_admin') {
    return { allowed: true };
  }

  // The record's businessId must match the user's current business tenant
  if (targetBusinessId && currentBusinessId && targetBusinessId !== currentBusinessId) {
    return {
      allowed: false,
      reason: 'Multi-Tenant Security Violation: Cannot access or modify data belonging to another business.',
    };
  }

  return { allowed: true };
}

import { User } from '../types';

/**
 * Deterministically retrieves or derives a unique Employee Code (e.g., EMP-0001, EMP-0012)
 * for any staff member, ensuring existing employees have consistent, unambiguous identification.
 */
export function getEmployeeCode(
  user: Partial<User> | null | undefined,
  allStaff?: User[]
): string {
  if (!user) return '';

  // 1. If explicit employeeCode exists on user profile, use it
  if (user.employeeCode && user.employeeCode.trim() !== '') {
    const raw = user.employeeCode.trim().toUpperCase();
    return raw.startsWith('EMP-') ? raw : `EMP-${raw}`;
  }

  // 2. If staff list is provided, generate a deterministic sequential code based on stable sort order
  if (allStaff && allStaff.length > 0) {
    const sorted = [...allStaff].sort((a, b) => {
      const dateA = a.joiningDate || a.requestedDate || '';
      const dateB = b.joiningDate || b.requestedDate || '';
      if (dateA && dateB && dateA !== dateB) return dateA.localeCompare(dateB);
      return (a.id || '').localeCompare(b.id || '');
    });

    const index = sorted.findIndex(
      (s) =>
        (user.id && s.id === user.id) ||
        (user.email && s.email && s.email.toLowerCase() === user.email.toLowerCase())
    );

    if (index >= 0) {
      return `EMP-${String(index + 1).padStart(4, '0')}`;
    }
  }

  // 3. Fallback: Deterministic hash from ID or email ensuring non-empty 4-digit code
  const seed = (user.id || user.email || user.name || '1').trim();
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const positiveHash = (Math.abs(hash) % 9000) + 1000;
  return `EMP-${positiveHash}`;
}

/**
 * Computes the next unique sequential Employee Code for new staff creation.
 */
export function generateNextEmployeeCode(existingStaff: User[] = []): string {
  let maxNumber = 0;

  existingStaff.forEach((s, idx) => {
    if (s.employeeCode) {
      const match = s.employeeCode.match(/EMP-(\d+)/i);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNumber) {
          maxNumber = num;
        }
      }
    } else {
      if (idx + 1 > maxNumber) {
        maxNumber = idx + 1;
      }
    }
  });

  const nextNumber = Math.max(maxNumber + 1, existingStaff.length + 1, 1);
  return `EMP-${String(nextNumber).padStart(4, '0')}`;
}

/**
 * Checks if a staff member matches a search query across:
 * - Employee Name
 * - Employee Code (EMP-XXXX or numeric part)
 * - Phone Number
 * - Role Display Name
 * - Email
 */
export function matchesStaffSearch(
  user: User,
  query: string,
  allStaff?: User[]
): boolean {
  const q = (query || '').trim().toLowerCase();
  if (!q) return true;

  const name = (user.name || '').toLowerCase();
  const phone = (user.phone || '').replace(/[^0-9]/g, '');
  const cleanQueryPhone = q.replace(/[^0-9]/g, '');
  const email = (user.email || '').toLowerCase();
  const role = (user.role || '').replace(/_/g, ' ').toLowerCase();
  const code = getEmployeeCode(user, allStaff).toLowerCase();
  const codeDigits = code.replace(/[^0-9]/g, '');

  // Direct matches
  if (name.includes(q)) return true;
  if (code.includes(q)) return true;
  if (email.includes(q)) return true;
  if (role.includes(q)) return true;

  // Phone match
  if (cleanQueryPhone && phone.includes(cleanQueryPhone)) return true;

  // Code digits match (e.g. user typed "12" matching "EMP-0012")
  if (cleanQueryPhone && codeDigits.includes(cleanQueryPhone)) return true;

  return false;
}

/**
 * Format standard role display label.
 */
export function formatRoleLabel(role?: string): string {
  if (!role) return 'Staff';
  return role
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Centralized Service & Industry Domain Architecture for ServiFlow.
 * Provides a scalable single source of truth for predefined categories,
 * custom service fallback, and helper utilities.
 */

export const PREDEFINED_SERVICE_DOMAINS = [
  'CCTV & Security Systems',
  'Solar & Renewable Energy',
  'AC Service & HVAC',
  'Electrical Services',
  'Plumbing Services',
  'Computer & IT Repair',
] as const;

export const OTHER_CUSTOM_SERVICE_DOMAIN = 'Other / Custom Service';

export const ALL_SERVICE_DOMAINS = [
  ...PREDEFINED_SERVICE_DOMAINS,
  OTHER_CUSTOM_SERVICE_DOMAIN,
] as const;

export type PredefinedServiceDomain = (typeof PREDEFINED_SERVICE_DOMAINS)[number];
export type ServiceDomainOption = (typeof ALL_SERVICE_DOMAINS)[number] | string;

/**
 * Check if the given service domain represents the "Other / Custom Service" fallback
 */
export function isOtherCustomService(domain?: string | null): boolean {
  if (!domain) return false;
  return domain === OTHER_CUSTOM_SERVICE_DOMAIN;
}

/**
 * Resolve display name for a business profile across the app
 */
export function resolveServiceDisplay(business?: {
  type?: string;
  serviceDomain?: string;
  customServiceName?: string | null;
} | null): string {
  if (!business) return 'Field Services';
  if (business.customServiceName && business.customServiceName.trim()) {
    return business.customServiceName.trim();
  }
  if (business.serviceDomain && business.serviceDomain !== OTHER_CUSTOM_SERVICE_DOMAIN) {
    return business.serviceDomain;
  }
  if (business.type && business.type !== OTHER_CUSTOM_SERVICE_DOMAIN) {
    return business.type;
  }
  return 'Field Services';
}

/**
 * Normalize and parse existing business records into domain + customServiceName
 */
export function parseBusinessServiceDomain(business?: {
  type?: string;
  serviceDomain?: string;
  customServiceName?: string | null;
} | null): {
  serviceDomain: string;
  customServiceName: string;
} {
  if (!business) {
    return {
      serviceDomain: PREDEFINED_SERVICE_DOMAINS[0],
      customServiceName: '',
    };
  }

  // 1. If explicit serviceDomain is already stored
  if (business.serviceDomain) {
    if (business.serviceDomain === OTHER_CUSTOM_SERVICE_DOMAIN) {
      return {
        serviceDomain: OTHER_CUSTOM_SERVICE_DOMAIN,
        customServiceName: business.customServiceName || (business.type !== OTHER_CUSTOM_SERVICE_DOMAIN ? business.type || '' : ''),
      };
    }
    return {
      serviceDomain: business.serviceDomain,
      customServiceName: '',
    };
  }

  // 2. Check if business.type matches one of the predefined domains
  const existingType = (business.type || '').trim();
  const directMatch = PREDEFINED_SERVICE_DOMAINS.find(
    (d) => d.toLowerCase() === existingType.toLowerCase()
  );
  if (directMatch) {
    return {
      serviceDomain: directMatch,
      customServiceName: '',
    };
  }

  // Check common legacy partial matches
  if (/cctv|security/i.test(existingType)) {
    return { serviceDomain: 'CCTV & Security Systems', customServiceName: '' };
  }
  if (/solar|renewable|energy/i.test(existingType)) {
    return { serviceDomain: 'Solar & Renewable Energy', customServiceName: '' };
  }
  if (/ac|hvac|air cond/i.test(existingType)) {
    return { serviceDomain: 'AC Service & HVAC', customServiceName: '' };
  }
  if (/electric/i.test(existingType)) {
    return { serviceDomain: 'Electrical Services', customServiceName: '' };
  }
  if (/plumb/i.test(existingType)) {
    return { serviceDomain: 'Plumbing Services', customServiceName: '' };
  }
  if (/computer|it|network/i.test(existingType)) {
    return { serviceDomain: 'Computer & IT Repair', customServiceName: '' };
  }

  // 3. Otherwise, if it has a custom type, treat as Other / Custom Service
  if (existingType) {
    return {
      serviceDomain: OTHER_CUSTOM_SERVICE_DOMAIN,
      customServiceName: existingType,
    };
  }

  return {
    serviceDomain: PREDEFINED_SERVICE_DOMAINS[0],
    customServiceName: '',
  };
}

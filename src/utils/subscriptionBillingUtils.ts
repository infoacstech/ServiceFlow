import { SubscriptionPayment, Business } from '../types';

export const SAAS_LEGAL_ENTITY = 'ServiFlow Technologies Pvt. Ltd.';
export const SAAS_BRAND_NAME = 'ServiFlow SaaS';
export const SAAS_TAGLINE = 'Cloud Service Management & FSM Platform';
export const SAAS_GSTIN = '07AAACU9821Q1Z4';
export const SAAS_STATE = 'Delhi';
export const SAAS_STATE_CODE = '07';
export const SAAS_SUPPORT_EMAIL = 'support@serviflow.io';
export const SAAS_SAC_CODE = '998313'; // SAC for Cloud Software / SaaS Services
export const SAAS_GST_RATE = 18;

/**
 * Generate a collision-resistant unique document number
 */
export function generateUniqueInvoiceNumber(date = new Date()): string {
  const year = date.getFullYear();
  const timeSuffix = Date.now().toString().slice(-5);
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  return `SF-INV-${year}-${timeSuffix}${randomSuffix}`;
}

export function generateUniqueReceiptNumber(date = new Date()): string {
  const year = date.getFullYear();
  const timeSuffix = Date.now().toString().slice(-5);
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  return `SF-REC-${year}-${timeSuffix}${randomSuffix}`;
}

/**
 * Determine whether supply is Intra-State (Delhi to Delhi) or Inter-State
 */
export function isDelhiIntraState(buyerGstin?: string, buyerState?: string): boolean {
  if (buyerGstin && buyerGstin.trim().length >= 2) {
    return buyerGstin.trim().startsWith(SAAS_STATE_CODE);
  }
  if (buyerState) {
    const s = buyerState.trim().toLowerCase();
    return s === 'delhi' || s === 'nct of delhi' || s === 'new delhi';
  }
  return false;
}

/**
 * Validate customer GSTIN format (15 characters: 2 state + 10 PAN + 1 entity + 1 'Z' + 1 checksum)
 */
export function isValidGstin(gstin?: string): boolean {
  if (!gstin) return false;
  const clean = gstin.trim().toUpperCase();
  if (clean.length !== 15) return false;
  // Ignore known mock placeholders
  if (clean === '09AAAAA0000A1Z5' || clean === '07AAACU9821Q1Z4') return false;
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(clean);
}

export interface SubscriptionFinancials {
  grossPlanPrice: number;
  discountAmount: number;
  hasDiscount: boolean;
  netPayable: number;
  taxableValue: number;
  totalGst: number;
  gstRate: number;
  isIntraState: boolean;
  supplyType: string;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  status: 'pending' | 'verified' | 'rejected' | 'failed' | 'refunded' | 'cancelled';
  statusLabel: string;
  statusColorClass: {
    badge: string;
    text: string;
    border: string;
    bg: string;
  };
  documentHeaderTitle: string;
  documentSubtitle: string;
  documentNumberLabel: string;
  documentNumber: string;
  totalAmountLabel: string;
  isPaid: boolean;
  isPending: boolean;
  isRejected: boolean;
  isRefunded: boolean;
  isCancelled: boolean;
  submissionDateFormatted: string;
  submissionDateTimeFormatted: string;
  verifiedDateTimeFormatted: string | null;
  customerGstin: string | null;
  isCustomerGstRegistered: boolean;
}

/**
 * Authoritative financial calculation for SaaS Subscription Payments & Receipts.
 * 
 * Mathematical Guarantee:
 *   Plan Price (incl. GST) - Discount = Net Payable (Grand Total)
 *   Taxable Value = Math.round(Net Payable / 1.18)
 *   Total GST = Net Payable - Taxable Value
 *   Taxable Value + Total GST === Net Payable (Grand Total)
 */
export function calculateSubscriptionFinancials(
  payment: SubscriptionPayment,
  tenantBusiness?: Business | null
): SubscriptionFinancials {
  const grossPlanPrice = payment.amount || 0;
  const discountAmount = payment.discountAmount || 0;
  const hasDiscount = discountAmount > 0;
  
  // Net Payable is the authoritative final amount submitted/paid
  const netPayable = payment.netPayable !== undefined && payment.netPayable >= 0
    ? payment.netPayable
    : Math.max(0, grossPlanPrice - discountAmount);

  const gstRate = payment.gstRate || SAAS_GST_RATE;

  // Authoritative Taxable Value from GST-inclusive amount
  // E.g. For ₹2,870: Taxable Value = Math.round(2870 / 1.18) = ₹2,432
  const taxableValue = payment.taxableAmount !== undefined && payment.taxableAmount > 0
    ? payment.taxableAmount
    : Math.round(netPayable / (1 + gstRate / 100));

  // Authoritative Total GST
  // E.g. For ₹2,870: Total GST = 2870 - 2432 = ₹438
  const totalGst = payment.gstAmount !== undefined && payment.gstAmount >= 0
    ? payment.gstAmount
    : (netPayable - taxableValue);

  // Customer Tax Profile
  const buyerGstin = payment.customerGstin || tenantBusiness?.gstNumber;
  const buyerState = payment.customerState || tenantBusiness?.state;
  const isCustomerGstRegistered = isValidGstin(buyerGstin);
  const cleanCustomerGstin = isCustomerGstRegistered ? buyerGstin!.trim().toUpperCase() : null;

  const isIntraState = isDelhiIntraState(cleanCustomerGstin || undefined, buyerState);

  // Tax Split (CGST + SGST vs IGST)
  let cgstRate = 0;
  let cgstAmount = 0;
  let sgstRate = 0;
  let sgstAmount = 0;
  let igstRate = 0;
  let igstAmount = 0;
  let supplyType = '';

  if (isIntraState) {
    cgstRate = gstRate / 2;
    sgstRate = gstRate / 2;
    cgstAmount = Math.round(totalGst / 2);
    sgstAmount = totalGst - cgstAmount;
    supplyType = 'Intra-State Supply (Delhi to Delhi: 9% CGST + 9% SGST)';
  } else {
    igstRate = gstRate;
    igstAmount = totalGst;
    supplyType = 'Inter-State Supply (18% Integrated GST - IGST)';
  }

  // Normalized Status Handling
  const rawStatus = payment.status || 'pending';
  let status: 'pending' | 'verified' | 'rejected' | 'failed' | 'refunded' | 'cancelled' = 'pending';
  if (rawStatus === 'verified') status = 'verified';
  else if (rawStatus === 'rejected') status = 'rejected';
  else if (rawStatus === 'failed') status = 'failed';
  else if (rawStatus === 'refunded') status = 'refunded';
  else if (rawStatus === 'cancelled') status = 'cancelled';

  const isPaid = status === 'verified';
  const isPending = status === 'pending';
  const isRejected = status === 'rejected' || status === 'failed';
  const isRefunded = status === 'refunded';
  const isCancelled = status === 'cancelled';

  // Status Labels & Color Schemes
  let statusLabel = 'PAYMENT PENDING';
  let statusColorClass = {
    badge: 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-200 border-amber-300 dark:border-amber-800',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-300 dark:border-amber-800/80',
    bg: 'bg-amber-500/10',
  };

  if (isPaid) {
    statusLabel = 'PAYMENT VERIFIED / PAID';
    statusColorClass = {
      badge: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800',
      text: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-300 dark:border-emerald-800/80',
      bg: 'bg-emerald-500/10',
    };
  } else if (isRejected) {
    statusLabel = 'PAYMENT FAILED';
    statusColorClass = {
      badge: 'bg-rose-100 text-rose-900 dark:bg-rose-950/80 dark:text-rose-200 border-rose-300 dark:border-rose-800',
      text: 'text-rose-600 dark:text-rose-400',
      border: 'border-rose-300 dark:border-rose-800/80',
      bg: 'bg-rose-500/10',
    };
  } else if (isRefunded) {
    statusLabel = 'REFUNDED';
    statusColorClass = {
      badge: 'bg-purple-100 text-purple-900 dark:bg-purple-950/80 dark:text-purple-200 border-purple-300 dark:border-purple-800',
      text: 'text-purple-600 dark:text-purple-400',
      border: 'border-purple-300 dark:border-purple-800/80',
      bg: 'bg-purple-500/10',
    };
  } else if (isCancelled) {
    statusLabel = 'CANCELLED';
    statusColorClass = {
      badge: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700',
      text: 'text-slate-600 dark:text-slate-400',
      border: 'border-slate-300 dark:border-slate-700',
      bg: 'bg-slate-500/10',
    };
  }

  // Document Terminology
  let documentHeaderTitle = 'SUBSCRIPTION INVOICE / PAYMENT SUBMISSION';
  let documentSubtitle = 'Subscription Invoice & Verification Submission';
  let documentNumberLabel = 'INVOICE #';
  let totalAmountLabel = 'Amount Submitted';

  if (isPaid) {
    documentHeaderTitle = 'TAX INVOICE / PAYMENT RECEIPT';
    documentSubtitle = 'Official SaaS Subscription Tax Receipt';
    documentNumberLabel = 'RECEIPT #';
    totalAmountLabel = 'Total Paid';
  } else if (isRejected) {
    documentHeaderTitle = 'SUBSCRIPTION INVOICE / PAYMENT FAILED';
    documentSubtitle = 'Payment Verification Rejected';
    documentNumberLabel = 'INVOICE #';
    totalAmountLabel = 'Amount Not Credited';
  } else if (isRefunded) {
    documentHeaderTitle = 'REFUND RECEIPT / CREDIT MEMO';
    documentSubtitle = 'Official Refund Documentation';
    documentNumberLabel = 'REFUND #';
    totalAmountLabel = 'Total Refunded';
  } else if (isCancelled) {
    documentHeaderTitle = 'CANCELLED SUBSCRIPTION INVOICE';
    documentSubtitle = 'Invoice Cancelled';
    documentNumberLabel = 'INVOICE #';
    totalAmountLabel = 'Cancelled Amount';
  }

  // Deterministic Document Number Resolution (Never invent or overwrite existing)
  const documentNumber = isPaid
    ? (payment.receiptNumber || payment.invoiceNumber || `SF-REC-${payment.id.slice(-6)}`)
    : (payment.invoiceNumber || payment.receiptNumber || `SF-INV-${payment.id.slice(-6)}`);

  // Date Formatting
  const createdDateObj = new Date(payment.createdAt);
  const isValidCreatedDate = !isNaN(createdDateObj.getTime());
  
  const submissionDateFormatted = isValidCreatedDate
    ? createdDateObj.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'N/A';

  const submissionDateTimeFormatted = isValidCreatedDate
    ? createdDateObj.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    : 'N/A';

  let verifiedDateTimeFormatted: string | null = null;
  if (isPaid && payment.verifiedAt) {
    const verifiedDateObj = new Date(payment.verifiedAt);
    if (!isNaN(verifiedDateObj.getTime())) {
      verifiedDateTimeFormatted = verifiedDateObj.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    }
  }

  return {
    grossPlanPrice,
    discountAmount,
    hasDiscount,
    netPayable,
    taxableValue,
    totalGst,
    gstRate,
    isIntraState,
    supplyType,
    cgstRate,
    cgstAmount,
    sgstRate,
    sgstAmount,
    igstRate,
    igstAmount,
    status,
    statusLabel,
    statusColorClass,
    documentHeaderTitle,
    documentSubtitle,
    documentNumberLabel,
    documentNumber,
    totalAmountLabel,
    isPaid,
    isPending,
    isRejected,
    isRefunded,
    isCancelled,
    submissionDateFormatted,
    submissionDateTimeFormatted,
    verifiedDateTimeFormatted,
    customerGstin: cleanCustomerGstin,
    isCustomerGstRegistered,
  };
}

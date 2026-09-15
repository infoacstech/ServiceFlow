import React from 'react';
import {
  X,
  Printer,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  ShieldCheck,
  CreditCard,
  Copy,
  Calendar,
  FileText,
  BadgePercent,
  Receipt,
  User,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';
import { SubscriptionPayment } from '../types';
import { useApp } from '../context/AppContext';
import {
  calculateSubscriptionFinancials,
  SAAS_LEGAL_ENTITY,
  SAAS_BRAND_NAME,
  SAAS_TAGLINE,
  SAAS_GSTIN,
  SAAS_STATE,
  SAAS_STATE_CODE,
  SAAS_SUPPORT_EMAIL,
  SAAS_SAC_CODE,
} from '../utils/subscriptionBillingUtils';

interface SubscriptionReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: SubscriptionPayment | null;
}

export const SubscriptionReceiptModal: React.FC<SubscriptionReceiptModalProps> = ({
  isOpen,
  onClose,
  payment,
}) => {
  const { businesses, currentBusiness, showToast } = useApp();

  if (!isOpen || !payment) return null;

  const targetBiz =
    businesses.find((b) => b.id === payment.businessId) ||
    (currentBusiness?.id === payment.businessId ? currentBusiness : null);

  const fin = calculateSubscriptionFinancials(payment, targetBiz);

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    if (showToast) {
      showToast(`${label} copied to clipboard`, 'success');
    }
  };

  // Customer Address details
  const customerAddress =
    payment.customerAddress || targetBiz?.address || null;
  const customerCity = payment.customerCity || targetBiz?.city || null;
  const customerState = payment.customerState || targetBiz?.state || null;
  const customerPin = payment.customerPin || targetBiz?.pin || null;
  const hasFullAddress = customerAddress || customerCity || customerState;

  return (
    <div
      id="subscription-receipt-modal-backdrop"
      className="fixed inset-0 z-[110] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white print:static print:overflow-visible"
    >
      <div
        id="subscription-receipt-modal-container"
        className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto print:border-none print:shadow-none print:w-full print:max-w-none print:rounded-none print:my-0"
      >
        {/* Modal Action Bar (Hidden in Print) */}
        <div
          id="subscription-receipt-action-bar"
          className="px-4 py-3 sm:px-6 sm:py-3.5 bg-slate-100 dark:bg-slate-800/90 flex items-center justify-between border-b border-slate-200 dark:border-slate-700/80 print:hidden"
        >
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Receipt className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200 truncate block">
                {fin.isPaid
                  ? 'Official SaaS Subscription Tax Receipt'
                  : 'Subscription Invoice & Payment Submission'}
              </span>
              <span className="text-[11px] text-slate-500 font-mono hidden sm:inline-block">
                {fin.documentNumber}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              id="subscription-receipt-print-btn"
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
              title="Print Document or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              id="subscription-receipt-close-btn"
              type="button"
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div
          id="subscription-receipt-document-body"
          className="p-4 sm:p-8 space-y-6 text-slate-900 dark:text-slate-100 print:p-6 print:text-black print:bg-white"
        >
          {/* Header Block with Clean Hierarchy */}
          <div className="border-b border-slate-200 dark:border-slate-800 pb-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              {/* Left: Supplier Info */}
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-md shadow-indigo-600/30">
                    SF
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white print:text-black">
                      {SAAS_BRAND_NAME}
                    </h1>
                    <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 print:text-slate-700">
                      {SAAS_TAGLINE}
                    </p>
                  </div>
                </div>

                <div className="pt-2 text-xs text-slate-500 dark:text-slate-400 print:text-slate-600 space-y-0.5 leading-relaxed">
                  <div className="font-bold text-slate-700 dark:text-slate-300 print:text-black">
                    {SAAS_LEGAL_ENTITY}
                  </div>
                  <div>
                    GSTIN:{' '}
                    <strong className="font-mono text-slate-800 dark:text-slate-200 print:text-black">
                      {SAAS_GSTIN}
                    </strong>{' '}
                    • State: {SAAS_STATE} ({SAAS_STATE_CODE})
                  </div>
                  <div>
                    Email: <span className="font-medium">{SAAS_SUPPORT_EMAIL}</span> • SAC Code: <strong>{SAAS_SAC_CODE}</strong>
                  </div>
                </div>
              </div>

              {/* Right: Document Identity & Authoritative Single Status */}
              <div className="sm:text-right space-y-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 dark:border-slate-800">
                <div>
                  <div className="text-xs sm:text-sm font-black tracking-wide text-indigo-600 dark:text-indigo-400 print:text-indigo-800 uppercase">
                    {fin.documentHeaderTitle}
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium">
                    {fin.documentSubtitle}
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex sm:justify-end items-center gap-1.5">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">
                      {fin.documentNumberLabel}:
                    </span>
                    <span className="font-mono font-black text-slate-900 dark:text-white print:text-black text-sm">
                      {fin.documentNumber}
                    </span>
                  </div>

                  <div className="flex sm:justify-end items-center gap-1.5 text-slate-500 dark:text-slate-400 print:text-slate-600">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Date:</span>
                    <span className="font-medium">{fin.submissionDateFormatted}</span>
                  </div>
                </div>

                {/* Single, Clear, Authoritative Status Pill */}
                <div className="sm:flex sm:justify-end pt-1">
                  <span
                    id="subscription-receipt-status-badge"
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide border ${fin.statusColorClass.badge}`}
                  >
                    {fin.isPaid ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : fin.isPending ? (
                      <Clock className="w-3.5 h-3.5" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5" />
                    )}
                    <span>{fin.statusLabel}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Status Notice Banner for Pending or Rejected */}
            {fin.isPending && (
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-black">Payment Verification In Progress</div>
                  <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90 mt-0.5">
                    Your UTR transaction reference has been submitted and is awaiting confirmation by our billing team. Once verified, this document automatically updates to an official <strong>Tax Invoice & Payment Receipt</strong> with full quota activation.
                  </p>
                </div>
              </div>
            )}

            {fin.isRejected && (
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-black">Payment Verification Rejected</div>
                  <p className="text-[11px] text-rose-800/90 dark:text-rose-300/90 mt-0.5">
                    This payment submission could not be verified against our bank statement. Please submit a valid transaction reference or contact our support team.
                  </p>
                  {payment.notes && (
                    <p className="text-[11px] font-semibold mt-1">
                      Reason: {payment.notes}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Billed To (Customer) & Payment Particulars */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Customer Information */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 print:bg-slate-50 print:border-slate-300 space-y-2">
              <div className="flex items-center gap-1.5 text-slate-400 font-black text-[10px] uppercase tracking-wider">
                <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                <span>Billed To (Customer / Tenant)</span>
              </div>

              <div>
                <div className="font-black text-sm text-slate-900 dark:text-white print:text-black">
                  {payment.businessName}
                </div>
                <div className="text-slate-600 dark:text-slate-300 print:text-slate-700 font-medium flex items-center gap-1.5 mt-0.5">
                  <User className="w-3 h-3 text-slate-400" />
                  <span>Attn: {payment.ownerName}</span>
                </div>
              </div>

              <div className="space-y-1 text-slate-500 dark:text-slate-400 print:text-slate-600 pt-1 border-t border-slate-200/80 dark:border-slate-700/80">
                {payment.ownerPhone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span className="font-mono">{payment.ownerPhone}</span>
                  </div>
                )}
                {payment.ownerEmail && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3 h-3 text-slate-400" />
                    <span>{payment.ownerEmail}</span>
                  </div>
                )}
                {hasFullAddress && (
                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-3 h-3 text-slate-400 mt-0.5 shrink-0" />
                    <span>
                      {[customerAddress, customerCity, customerState, customerPin]
                        .filter(Boolean)
                        .join(', ')}
                    </span>
                  </div>
                )}
                <div className="pt-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 mr-1">
                    GSTIN:
                  </span>
                  {fin.customerGstin ? (
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200 print:text-black">
                      {fin.customerGstin}
                    </span>
                  ) : (
                    <span className="text-slate-500 italic">
                      Unregistered (Consumer / B2C)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Particulars */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 print:bg-slate-50 print:border-slate-300 space-y-2">
              <div className="flex items-center gap-1.5 text-slate-400 font-black text-[10px] uppercase tracking-wider">
                <CreditCard className="w-3.5 h-3.5 text-indigo-500" />
                <span>Payment Particulars</span>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Payment Method:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 print:text-black uppercase">
                    {payment.paymentMethod === 'upi' || payment.paymentMethod === 'qr_code'
                      ? 'UPI QR Payment'
                      : 'Bank Transfer (NEFT/IMPS)'}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500">UTR / Reference No:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 print:text-black text-xs bg-indigo-50 dark:bg-indigo-950/60 print:bg-transparent px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-900/60 print:border-none">
                      {payment.utrNumber || 'N/A'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(payment.utrNumber, 'UTR Number')}
                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-slate-600 print:hidden cursor-pointer"
                      title="Copy UTR"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Transaction ID:</span>
                  <span className="font-mono text-slate-600 dark:text-slate-400 text-[11px]">
                    {payment.id}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Submitted At:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300 print:text-black">
                    {fin.submissionDateTimeFormatted}
                  </span>
                </div>

                {/* Verified Date & Time ONLY when actually verified */}
                {fin.isPaid && fin.verifiedDateTimeFormatted && (
                  <div className="flex justify-between items-center pt-1 border-t border-slate-200/80 dark:border-slate-700/80">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      Verified At:
                    </span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-300">
                      {fin.verifiedDateTimeFormatted}
                    </span>
                  </div>
                )}
                {fin.isPaid && payment.verifiedBy && (
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400">Verified By:</span>
                    <span className="font-medium text-slate-600 dark:text-slate-300">
                      {payment.verifiedBy}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Line Items: Responsive Table & Mobile Cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span>Subscription Line Items</span>
              <span className="text-[11px] text-slate-400 font-normal">
                {fin.supplyType}
              </span>
            </div>

            {/* Desktop & Print Table (hidden on small screens, forced visible in print) */}
            <div className="hidden sm:block print:block border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden print:rounded-none">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-black uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-3">Item & Description</th>
                    <th className="p-3 text-center">Billing Cycle</th>
                    <th className="p-3 text-right">Plan Price (incl. GST)</th>
                    <th className="p-3 text-right">Discount</th>
                    <th className="p-3 text-right">Taxable Value</th>
                    <th className="p-3 text-right">GST ({fin.gstRate}%)</th>
                    <th className="p-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  <tr>
                    <td className="p-3">
                      <div className="font-black text-sm text-slate-900 dark:text-white print:text-black">
                        {payment.planName}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {payment.isAddon
                          ? 'SaaS Quota Expansion Add-on'
                          : 'Cloud Software as a Service'}{' '}
                        (SAC Code: <strong>{SAAS_SAC_CODE}</strong>)
                      </div>
                    </td>
                    <td className="p-3 text-center capitalize font-bold text-slate-700 dark:text-slate-300">
                      {payment.isAddon ? 'Quota Pack' : `${payment.billingCycle}`}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-800 dark:text-slate-200 print:text-black">
                      ₹{fin.grossPlanPrice.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3 text-right font-mono">
                      {fin.hasDiscount ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          -₹{fin.discountAmount.toLocaleString('en-IN')}
                        </span>
                      ) : (
                        <span className="text-slate-400">₹0</span>
                      )}
                    </td>
                    <td className="p-3 text-right font-mono font-semibold text-slate-800 dark:text-slate-200 print:text-black">
                      ₹{fin.taxableValue.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-700 dark:text-slate-300 print:text-black">
                      ₹{fin.totalGst.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3 text-right font-mono font-black text-slate-900 dark:text-white print:text-black text-sm">
                      ₹{fin.netPayable.toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Mobile Responsive Item Card (Hidden on Desktop & Print to prevent duplicate table) */}
            <div className="block sm:hidden print:hidden space-y-3">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-start justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-2.5">
                  <div>
                    <div className="font-black text-sm text-slate-900 dark:text-white">
                      {payment.planName}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      SAC Code: {SAAS_SAC_CODE} • {payment.isAddon ? 'Add-on Pack' : 'Cloud SaaS'}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] uppercase shrink-0">
                    {payment.isAddon ? 'Add-on' : payment.billingCycle}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Plan Price (incl. GST):</span>
                    <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                      ₹{fin.grossPlanPrice.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Discount:</span>
                    {fin.hasDiscount ? (
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        -₹{fin.discountAmount.toLocaleString('en-IN')}
                      </span>
                    ) : (
                      <span className="font-mono text-slate-400">₹0</span>
                    )}
                  </div>

                  <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                    <span>Taxable Value:</span>
                    <span className="font-mono font-semibold">
                      ₹{fin.taxableValue.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                    <span>GST @ {fin.gstRate}%:</span>
                    <span className="font-mono font-semibold">
                      ₹{fin.totalGst.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700 font-black text-slate-900 dark:text-white text-sm">
                    <span>Grand Total:</span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400">
                      ₹{fin.netPayable.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Calculation Breakdown Box */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
            {/* Left: Tax Note & Indian GST Compliance statement */}
            <div className="max-w-xs space-y-1 text-[11px] text-slate-400 print:text-slate-600 leading-relaxed">
              <div className="font-bold text-slate-600 dark:text-slate-300 print:text-black">
                Tax Compliance Information:
              </div>
              <p>
                GST is charged in accordance with Indian Goods & Services Tax (GST) Act.
                Place of supply is considered based on recipient location and billing particulars.
              </p>
              <p className="font-mono text-[10px] text-slate-500">
                Reverse Charge Applicable: <strong>NO</strong>
              </p>
            </div>

            {/* Right: Unambiguous Calculation Structure */}
            <div className="w-full sm:w-80 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 print:bg-slate-50 print:border-slate-300 space-y-2 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Plan Price (incl. GST):</span>
                <span className="font-mono font-semibold text-slate-700 dark:text-slate-300 print:text-black">
                  ₹{fin.grossPlanPrice.toLocaleString('en-IN')}
                </span>
              </div>

              {fin.hasDiscount ? (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span className="flex items-center gap-1">
                    <BadgePercent className="w-3.5 h-3.5" />
                    <span>Referral / Promo Discount:</span>
                  </span>
                  <span className="font-mono font-bold">
                    -₹{fin.discountAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              ) : (
                <div className="flex justify-between text-slate-400">
                  <span>Discount:</span>
                  <span className="font-mono">₹0</span>
                </div>
              )}

              <div className="flex justify-between text-slate-700 dark:text-slate-300 pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60">
                <span className="font-semibold">Taxable Value:</span>
                <span className="font-mono font-bold">
                  ₹{fin.taxableValue.toLocaleString('en-IN')}
                </span>
              </div>

              {/* GST Breakdown (CGST + SGST vs IGST) */}
              {fin.isIntraState ? (
                <>
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>Central GST (CGST @ {fin.cgstRate}%):</span>
                    <span className="font-mono">
                      ₹{fin.cgstAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>State GST (SGST @ {fin.sgstRate}%):</span>
                    <span className="font-mono">
                      ₹{fin.sgstAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>Integrated GST (IGST @ {fin.igstRate}%):</span>
                  <span className="font-mono">
                    ₹{fin.igstAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              )}

              {/* Grand Total Row */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-bold text-sm">
                <span className="text-slate-700 dark:text-slate-300">Grand Total:</span>
                <span className="font-mono font-black text-slate-900 dark:text-white print:text-black">
                  ₹{fin.netPayable.toLocaleString('en-IN')}
                </span>
              </div>

              {/* Payment Status Row (Crucial: Never show "Total Paid" if pending) */}
              <div
                id="subscription-receipt-payment-status-row"
                className={`p-2.5 rounded-xl border flex justify-between items-center font-black ${
                  fin.isPaid
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                    : fin.isPending
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs">
                  {fin.isPaid ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : fin.isPending ? (
                    <Clock className="w-4 h-4 text-amber-600 shrink-0 animate-spin" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{fin.totalAmountLabel}:</span>
                </div>
                <span className="font-mono text-base tracking-tight">
                  ₹{fin.netPayable.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Notes & Legal */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400 print:text-slate-600">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>
                System generated official digital SaaS financial document. No physical signature required.
              </span>
            </div>
            <div className="font-medium font-mono text-[10px]">
              {SAAS_LEGAL_ENTITY} • CIN: U72900DL2024PTC392810
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

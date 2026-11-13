import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  QrCode,
  Copy,
  Check,
  Building2,
  Sparkles,
  ShieldCheck,
  Clock,
  ArrowRight,
  ExternalLink,
  Receipt,
  FileCheck,
  Tag,
  AlertCircle,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Plan, SubscriptionPayment, SubscriptionCoupon } from '../types';
import {
  AddonPack,
  SAAS_UPI_CONFIG,
  buildUpiPaymentUrl,
  calculateAnnualPricing,
} from '../utils/planUtils';
import {
  generateUniqueInvoiceNumber,
  generateUniqueReceiptNumber,
  isDelhiIntraState,
} from '../utils/subscriptionBillingUtils';
import { useApp } from '../context/AppContext';

interface SubscriptionCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan?: Plan | null;
  addon?: AddonPack | null;
  defaultBillingCycle?: 'monthly' | 'yearly';
  onPaymentSuccess?: (payment: SubscriptionPayment) => void;
  onViewReceipt?: (payment: SubscriptionPayment) => void;
}

export const SubscriptionCheckoutModal: React.FC<SubscriptionCheckoutModalProps> = ({
  isOpen,
  onClose,
  plan,
  addon,
  onPaymentSuccess,
  onViewReceipt,
}) => {
  const {
    currentBusiness,
    currentUser,
    showToast,
    submitSubscriptionPayment,
    subscriptionPayments,
    validateCoupon,
  } = useApp();

  const billingCycle: 'yearly' = 'yearly';
  const [activePaymentTab, setActivePaymentTab] = useState<'upi_qr' | 'bank_transfer'>('upi_qr');
  const [utrNumber, setUtrNumber] = useState('');
  const [senderName, setSenderName] = useState(currentUser?.name || currentBusiness?.name || '');
  const [senderPhone, setSenderPhone] = useState(currentUser?.phone || currentBusiness?.mobile || '');
  const [notes, setNotes] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedBank, setCopiedBank] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedPayment, setSubmittedPayment] = useState<SubscriptionPayment | null>(null);

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<SubscriptionCoupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Reset checkout form when modal opens or selected item changes
  useEffect(() => {
    if (isOpen) {
      setUtrNumber('');
      setNotes('');
      setSubmittedPayment(null);
      setIsSubmitting(false);
      setCouponInput('');
      setAppliedCoupon(null);
      setCouponError(null);
      setSenderName(currentUser?.name || currentBusiness?.name || '');
      setSenderPhone(currentUser?.phone || currentBusiness?.mobile || '');
    }
  }, [isOpen, plan?.id, addon?.id]);

  if (!isOpen || (!plan && !addon)) return null;

  const isPlan = Boolean(plan);
  const itemName = isPlan ? `${plan!.name} Plan` : addon!.name;

  // Pricing Calculation (Live Customizable Plan / Add-on Pricing)
  let basePrice = 0;
  if (isPlan) {
    const annualCalc = calculateAnnualPricing(plan!.price, plan!.originalPrice, plan!.billingCycle);
    basePrice = annualCalc.discountedAnnual;
  } else {
    basePrice = addon!.yearlyPrice ?? addon!.price;
  }

  // Referral + Coupon Discount Resolution
  const hasReferralEligibility = Boolean(currentBusiness?.referralDiscountApplied);
  const rawReferralDiscount = hasReferralEligibility ? Math.round((basePrice * 10) / 100) : 0;

  const liveCouponEval = appliedCoupon
    ? validateCoupon(appliedCoupon.code, {
        itemPrice: basePrice,
        itemType: isPlan ? 'plan' : 'addon',
        planId: plan?.id,
      })
    : null;

  const activeCoupon = liveCouponEval?.valid ? liveCouponEval.coupon : null;
  const rawCouponDiscount = liveCouponEval?.valid ? liveCouponEval.discountAmount : 0;

  let referralDiscountAmount = rawReferralDiscount;
  let couponDiscountAmount = 0;
  let discountNote: string | null = null;

  if (activeCoupon && rawCouponDiscount > 0) {
    if (activeCoupon.allowWithReferral) {
      referralDiscountAmount = rawReferralDiscount;
      couponDiscountAmount = Math.min(Math.max(0, basePrice - referralDiscountAmount), rawCouponDiscount);
    } else if (hasReferralEligibility) {
      if (rawCouponDiscount >= rawReferralDiscount) {
        referralDiscountAmount = 0;
        couponDiscountAmount = rawCouponDiscount;
        discountNote = 'Coupon discount applied (replaces 10% referral discount as it gives higher savings).';
      } else {
        referralDiscountAmount = rawReferralDiscount;
        couponDiscountAmount = 0;
        discountNote = '10% Referral Discount kept because it saves more than this non-stackable coupon.';
      }
    } else {
      referralDiscountAmount = 0;
      couponDiscountAmount = rawCouponDiscount;
    }
  }

  const discountPercent = referralDiscountAmount > 0 ? 10 : 0;
  const discountAmount = referralDiscountAmount + couponDiscountAmount;
  const netPayable = Math.max(0, basePrice - discountAmount);

  const handleApplyCoupon = () => {
    const result = validateCoupon(couponInput, {
      itemPrice: basePrice,
      itemType: isPlan ? 'plan' : 'addon',
      planId: plan?.id,
    });

    if (!result.valid || !result.coupon) {
      setAppliedCoupon(null);
      setCouponError(result.error || 'Coupon code is not valid.');
      return;
    }

    setAppliedCoupon(result.coupon);
    setCouponError(null);
    showToast(
      `Coupon ${result.coupon.code} applied! Savings: ₹${result.discountAmount.toLocaleString('en-IN')}`,
      'success'
    );
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError(null);
  };

  // Generate UPI URI
  const upiTxNote = `ServiFlow ${itemName} (Annual)`;
  const upiUrl = buildUpiPaymentUrl({
    amount: netPayable,
    note: upiTxNote,
  });

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(SAAS_UPI_CONFIG.vpa);
    setCopiedUpi(true);
    showToast('UPI ID copied to clipboard: ' + SAAS_UPI_CONFIG.vpa, 'success');
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleCopyBank = () => {
    const bankDetails = `Bank: ${SAAS_UPI_CONFIG.bankName}\nA/C No: ${SAAS_UPI_CONFIG.accountNumber}\nIFSC: ${SAAS_UPI_CONFIG.ifscCode}\nName: ${SAAS_UPI_CONFIG.accountHolder}`;
    navigator.clipboard.writeText(bankDetails);
    setCopiedBank(true);
    showToast('Bank details copied to clipboard', 'success');
    setTimeout(() => setCopiedBank(false), 2000);
  };

  const handleSubmitUtr = (e: React.FormEvent) => {
    e.preventDefault();
    const isFreeWithCoupon = netPayable === 0 && Boolean(activeCoupon);
    const cleanUtr = isFreeWithCoupon
      ? (utrNumber.trim() || `CPN-${activeCoupon!.code}-${Date.now().toString().slice(-6)}`)
      : utrNumber.trim();

    if (!isFreeWithCoupon && (!cleanUtr || cleanUtr.length < 6)) {
      showToast('Please enter a valid 12-digit UPI UTR / Bank Reference Number', 'error');
      return;
    }

    // Check for duplicate UTR submission to prevent duplicate financial records
    const isDuplicateUtr = (subscriptionPayments || []).some(
      (p) => p.utrNumber && p.utrNumber.trim().toUpperCase() === cleanUtr.toUpperCase()
    );
    if (isDuplicateUtr) {
      showToast('This UTR / Reference number has already been submitted. Please check your payment history.', 'error');
      return;
    }

    setIsSubmitting(true);

    const now = new Date();
    const invoiceNum = generateUniqueInvoiceNumber(now);
    const receiptNum = generateUniqueReceiptNumber(now);

    const taxableAmount = Math.round(netPayable / 1.18);
    const gstAmount = netPayable - taxableAmount;
    const isDelhi = isDelhiIntraState(currentBusiness?.gstNumber, currentBusiness?.state);
    const cgstAmount = isDelhi ? Math.round(gstAmount / 2) : 0;
    const sgstAmount = isDelhi ? (gstAmount - cgstAmount) : 0;
    const igstAmount = isDelhi ? 0 : gstAmount;

    const paymentRecord: SubscriptionPayment = {
      id: `sub-tx-${Date.now()}`,
      businessId: currentBusiness?.id || 'default-biz',
      businessName: currentBusiness?.name || 'ServiFlow Tenant',
      ownerName: senderName || currentUser?.name || 'Business Owner',
      ownerEmail: currentUser?.email || currentBusiness?.email || '',
      ownerPhone: senderPhone || currentUser?.phone || '',
      planId: isPlan ? plan!.id : addon!.id,
      planName: itemName,
      billingCycle,
      amount: basePrice,
      discountAmount,
      referralDiscountPercent: discountPercent,
      referralDiscountAmount: referralDiscountAmount > 0 ? referralDiscountAmount : undefined,
      couponCode: couponDiscountAmount > 0 && activeCoupon ? activeCoupon.code : undefined,
      couponId: couponDiscountAmount > 0 && activeCoupon ? activeCoupon.id : undefined,
      couponDiscountAmount: couponDiscountAmount > 0 ? couponDiscountAmount : undefined,
      netPayable,
      utrNumber: cleanUtr,
      paymentMethod: activePaymentTab === 'upi_qr' ? 'upi' : 'bank_transfer',
      status: 'pending',
      createdAt: now.toISOString(),
      notes: notes.trim() || undefined,
      invoiceNumber: invoiceNum,
      receiptNumber: receiptNum,
      isAddon: !isPlan,
      addonType: !isPlan ? addon!.type : undefined,
      taxableAmount,
      gstAmount,
      cgstAmount,
      sgstAmount,
      igstAmount,
      gstRate: 18,
      customerGstin: currentBusiness?.gstNumber?.trim() || undefined,
      customerAddress: currentBusiness?.address?.trim() || undefined,
      customerCity: currentBusiness?.city?.trim() || undefined,
      customerState: currentBusiness?.state?.trim() || undefined,
      customerPin: currentBusiness?.pin?.trim() || undefined,
    };

    setTimeout(async () => {
      try {
        await submitSubscriptionPayment(paymentRecord);
      } catch (err) {
        console.error('Failed to submit subscription payment to Firestore:', err);
      }
      setIsSubmitting(false);
      setSubmittedPayment(paymentRecord);
      if (onPaymentSuccess) {
        onPaymentSuccess(paymentRecord);
      }
      showToast('Payment verification request submitted successfully!', 'success');
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 text-indigo-300 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight">
                {submittedPayment ? 'Payment Request Submitted' : `Upgrade to ${itemName}`}
              </h3>
              <p className="text-xs text-indigo-200">
                Official ServiFlow B2B SaaS Subscription Billing
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        {submittedPayment ? (
          /* SUCCESS STATE */
          <div className="p-6 sm:p-8 space-y-6 text-center">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
              <FileCheck className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h4 className="text-xl font-black text-slate-900 dark:text-slate-100">
                Payment Verification Pending
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Thank you! Your payment verification request for <strong>{itemName}</strong> has been received. Your provisional access is initiated and will be verified within 15–30 minutes.
              </p>
            </div>

            {/* Receipt Summary Box */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-left text-xs space-y-2 max-w-md mx-auto">
              <div className="flex justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-500">Invoice / Document #:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {submittedPayment.invoiceNumber || submittedPayment.receiptNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Item:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {submittedPayment.planName} ({submittedPayment.billingCycle})
                </span>
              </div>
              {submittedPayment.couponCode && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Coupon Applied:</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {submittedPayment.couponCode} (-₹{(submittedPayment.couponDiscountAmount || 0).toLocaleString('en-IN')})
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Submitted UTR #:</span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  {submittedPayment.utrNumber}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700 text-sm">
                <span className="font-bold text-slate-700 dark:text-slate-300">Amount Submitted:</span>
                <span className="font-black text-amber-600 dark:text-amber-400 tabular-nums">
                  ₹{submittedPayment.netPayable.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              {onViewReceipt && (
                <button
                  type="button"
                  onClick={() => onViewReceipt(submittedPayment)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center gap-2 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-all cursor-pointer"
                >
                  <Receipt className="w-4 h-4" />
                  <span>View Submission & Invoice</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs hover:opacity-90 transition-all cursor-pointer shadow-md"
              >
                Close & Return
              </button>
            </div>
          </div>
        ) : (
          /* FORM STATE */
          <div className="p-5 sm:p-6 space-y-5 max-h-[82vh] overflow-y-auto">
            {/* Top Order Summary Bar */}
            <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-sm text-slate-900 dark:text-slate-100">
                    {itemName}
                  </span>
                  {referralDiscountAmount > 0 && (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-bold text-[10px]">
                      10% REFERRAL
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isPlan ? plan!.targetAudience : addon!.description}
                </p>
              </div>

              {/* Annual Billing Indicator */}
              <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-black shrink-0 flex items-center gap-1.5 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                <span>Annual Plan (1 Year)</span>
              </div>
            </div>

            {/* Promo / Coupon Code Input */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Have a Promo / Coupon Code?</span>
                </label>
                {activeCoupon && (
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                  >
                    Remove Coupon
                  </button>
                )}
              </div>

              {activeCoupon ? (
                <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div className="min-w-0">
                      <span className="font-mono font-black text-emerald-800 dark:text-emerald-300">
                        {activeCoupon.code}
                      </span>
                      <span className="text-emerald-700 dark:text-emerald-400 ml-2 font-semibold">
                        ({activeCoupon.discountType === 'percentage'
                          ? `${activeCoupon.discountValue}% OFF`
                          : `₹${activeCoupon.discountValue.toLocaleString('en-IN')} OFF`}
                        )
                      </span>
                      {activeCoupon.description && (
                        <div className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80 truncate">
                          {activeCoupon.description}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="font-mono font-black text-emerald-700 dark:text-emerald-300 shrink-0 tabular-nums">
                    -₹{rawCouponDiscount.toLocaleString('en-IN')}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => {
                      setCouponInput(e.target.value.toUpperCase());
                      if (couponError) setCouponError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleApplyCoupon();
                      }
                    }}
                    placeholder="Enter promo code (e.g. WELCOME20)"
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={!couponInput.trim()}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-indigo-600 hover:opacity-90 text-white font-bold text-xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0 min-h-[40px]"
                  >
                    Apply
                  </button>
                </div>
              )}

              {couponError && (
                <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{couponError}</span>
                </p>
              )}

              {discountNote && (
                <p className="text-[11px] font-medium text-amber-700 dark:text-amber-300">
                  {discountNote}
                </p>
              )}
            </div>

            {/* Price Breakdown Calculation Box */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs space-y-2 tabular-nums">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Standard Pricing (Annual Subscription):</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  ₹{basePrice.toLocaleString('en-IN')}
                </span>
              </div>
              {referralDiscountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                  <span>Referral Partner Discount (10% OFF):</span>
                  <span>-₹{referralDiscountAmount.toLocaleString('en-IN')}</span>
                </div>
              )}
              {couponDiscountAmount > 0 && activeCoupon && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                  <span>Promo Coupon ({activeCoupon.code}):</span>
                  <span>-₹{couponDiscountAmount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-baseline">
                <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  Total Net Payable:
                </span>
                <div className="text-right">
                  <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                    ₹{netPayable.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[11px] text-slate-400 block font-normal">
                    (inclusive of GST & Platform Service)
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Method Switcher */}
            {netPayable > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    Select Direct Payment Channel
                  </span>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> 0% Transaction Fees
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setActivePaymentTab('upi_qr')}
                    className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all cursor-pointer ${
                      activePaymentTab === 'upi_qr'
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-100 font-bold'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <QrCode className="w-5 h-5 text-indigo-600 shrink-0" />
                    <div className="text-left text-xs">
                      <div className="font-bold">Instant UPI QR Code</div>
                      <div className="text-[10px] text-slate-500">GPay, PhonePe, Paytm, BHIM</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActivePaymentTab('bank_transfer')}
                    className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all cursor-pointer ${
                      activePaymentTab === 'bank_transfer'
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-100 font-bold'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Building2 className="w-5 h-5 text-indigo-600 shrink-0" />
                    <div className="text-left text-xs">
                      <div className="font-bold">NEFT / IMPS Bank Transfer</div>
                      <div className="text-[10px] text-slate-500">Corporate & Current A/C</div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* CHANNEL 1: UPI QR CODE */}
            {netPayable > 0 && activePaymentTab === 'upi_qr' && (
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-6">
                {/* QR Display */}
                <div className="p-3 bg-white rounded-2xl border-2 border-indigo-200 dark:border-indigo-800 shadow-sm shrink-0 flex flex-col items-center">
                  <QRCodeSVG value={upiUrl} size={160} level="M" />
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mt-2 tabular-nums">
                    Scan to Pay ₹{netPayable.toLocaleString('en-IN')}
                  </span>
                </div>

                {/* Instructions & Copy */}
                <div className="space-y-3 w-full text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Official ServiFlow UPI ID:</span>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-800 dark:text-slate-200 text-xs select-all">
                        {SAAS_UPI_CONFIG.vpa}
                      </code>
                      <button
                        type="button"
                        onClick={handleCopyUpi}
                        className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer"
                        title="Copy UPI ID"
                      >
                        {copiedUpi ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Open Google Pay, PhonePe, Paytm or BHIM, scan the QR code above or pay directly to the UPI ID. Once transferred, note down the <strong>12-digit UTR / UPI Reference Number</strong> below.
                  </p>

                  <a
                    href={upiUrl}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    <span>Click to launch UPI App directly (Mobile only)</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            )}

            {/* CHANNEL 2: DIRECT BANK TRANSFER */}
            {netPayable > 0 && activePaymentTab === 'bank_transfer' && (
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    Official Corporate Bank Account Details:
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyBank}
                    className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    {copiedBank ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedBank ? 'Copied' : 'Copy All'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono">
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-sans">Bank Name</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{SAAS_UPI_CONFIG.bankName}</span>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-sans">Account Number</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{SAAS_UPI_CONFIG.accountNumber}</span>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-sans">IFSC Code</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{SAAS_UPI_CONFIG.ifscCode}</span>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-sans">Beneficiary Name</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{SAAS_UPI_CONFIG.accountHolder}</span>
                  </div>
                </div>
              </div>
            )}

            {netPayable === 0 && activeCoupon && (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-2.5">
                <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-black">100% Covered by Coupon ({activeCoupon.code})</div>
                  <div className="text-[11px] opacity-85">
                    No UPI/Bank transfer needed. Click below to submit your activation request to Super Admin.
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: VERIFICATION FORM */}
            <form onSubmit={handleSubmitUtr} className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">
                  2
                </span>
                <span>
                  {netPayable === 0
                    ? 'Confirm Activation Request'
                    : 'Enter Transaction Reference / UTR Number to Activate'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {netPayable > 0 && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      12-Digit UTR / UPI Reference No. <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={utrNumber}
                      onChange={(e) => setUtrNumber(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                      placeholder="e.g. 423589201948 or UPI Ref ID"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-sm uppercase tracking-wider text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      You can find this 12-digit number in your Google Pay, PhonePe, or Banking app transfer receipt.
                    </span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Payer Name
                  </label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Optional Notes / Remarks
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Paid via ICICI Bank PhonePe"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || (netPayable > 0 && !utrNumber.trim())}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <Clock className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                  <span>
                    {isSubmitting
                      ? 'Submitting...'
                      : netPayable === 0
                      ? 'Submit & Activate Plan'
                      : 'Submit UTR & Activate Plan'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

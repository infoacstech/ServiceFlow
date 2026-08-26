import React, { useState, useMemo } from 'react';
import { Customer, Job, Invoice, Payment, RecurringContract, Quotation, Enquiry } from '../types';
import { useApp } from '../context/AppContext';
import {
  AlertTriangle,
  ShieldAlert,
  Archive,
  Trash2,
  X,
  Briefcase,
  Receipt,
  CreditCard,
  Repeat,
  FileText,
  MessageSquare,
  CheckCircle2,
  Loader2,
  Info,
} from 'lucide-react';

interface DeleteCustomerModalProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  onCustomerDeleted: () => void;
}

export const DeleteCustomerModal: React.FC<DeleteCustomerModalProps> = ({
  customer,
  isOpen,
  onClose,
  onCustomerDeleted,
}) => {
  const {
    jobs,
    invoices,
    payments,
    contracts,
    quotations,
    enquiries,
    deleteCustomer,
    archiveCustomer,
    showToast,
  } = useApp();

  // Multi-step state: 'check_and_confirm' -> 'type_delete'
  const [step, setStep] = useState<'confirm' | 'type_delete'>('confirm');
  const [confirmationInput, setConfirmationInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  // Compute all related records independently
  const relatedRecords = useMemo(() => {
    if (!customer) {
      return {
        hasRecords: false,
        totalCount: 0,
        customerJobs: [],
        customerInvoices: [],
        customerPayments: [],
        customerContracts: [],
        customerQuotations: [],
        customerEnquiries: [],
        breakdownItems: [],
      };
    }

    const customerJobs = (jobs || []).filter((j: Job) => j.customerId === customer.id);
    const activeJobs = customerJobs.filter((j: Job) => j.status !== 'completed' && j.status !== 'cancelled' && j.status !== 'closed');
    const completedJobs = customerJobs.filter((j: Job) => j.status === 'completed' || j.status === 'closed' || j.status === 'verified');
    const customerInvoices = (invoices || []).filter((inv: Invoice) => inv.customerId === customer.id);
    const unpaidInvoices = customerInvoices.filter((inv: Invoice) => inv.status !== 'paid');
    const customerPayments = (payments || []).filter((p: Payment) => p.customerId === customer.id);
    const customerContracts = (contracts || []).filter((c: RecurringContract) => c.customerId === customer.id);
    const customerQuotations = (quotations || []).filter((q: Quotation) => q.customerId === customer.id);
    const customerEnquiries = (enquiries || []).filter((e: Enquiry) => e.customerId === customer.id);

    const totalCount =
      customerJobs.length +
      customerInvoices.length +
      customerPayments.length +
      customerContracts.length +
      customerQuotations.length +
      customerEnquiries.length;

    const breakdownItems: { label: string; count: number; icon: React.ComponentType<{ className?: string }> }[] = [];
    if (customerJobs.length > 0) {
      breakdownItems.push({
        label: `Jobs (${activeJobs.length} active, ${completedJobs.length} completed)`,
        count: customerJobs.length,
        icon: Briefcase,
      });
    }
    if (customerInvoices.length > 0) {
      breakdownItems.push({
        label: `Invoices (${unpaidInvoices.length} unpaid / pending)`,
        count: customerInvoices.length,
        icon: Receipt,
      });
    }
    if (customerPayments.length > 0) {
      breakdownItems.push({
        label: 'Payment Transactions',
        count: customerPayments.length,
        icon: CreditCard,
      });
    }
    if (customerContracts.length > 0) {
      breakdownItems.push({
        label: 'AMC / Maintenance Contracts',
        count: customerContracts.length,
        icon: Repeat,
      });
    }
    if (customerQuotations.length > 0) {
      breakdownItems.push({
        label: 'Quotations',
        count: customerQuotations.length,
        icon: FileText,
      });
    }
    if (customerEnquiries.length > 0) {
      breakdownItems.push({
        label: 'Service Enquiries',
        count: customerEnquiries.length,
        icon: MessageSquare,
      });
    }

    return {
      hasRecords: totalCount > 0,
      totalCount,
      customerJobs,
      customerInvoices,
      customerPayments,
      customerContracts,
      customerQuotations,
      customerEnquiries,
      breakdownItems,
    };
  }, [customer, jobs, invoices, payments, contracts, quotations, enquiries]);

  if (!isOpen || !customer) return null;

  const isDeleteKeywordMatched = confirmationInput.trim().toUpperCase() === 'DELETE';

  const handleClose = () => {
    if (isSubmitting || isArchiving) return;
    setStep('confirm');
    setConfirmationInput('');
    onClose();
  };

  // Safe Archive Action for customers with history
  const handleArchive = async () => {
    if (!customer || isArchiving || isSubmitting) return;
    setIsArchiving(true);
    try {
      const res = await archiveCustomer(customer.id);
      if (res.success) {
        handleClose();
        onCustomerDeleted();
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to archive customer.', 'error');
    } finally {
      setIsArchiving(false);
    }
  };

  // Permanent Delete Action for clean customers
  const handlePermanentDelete = async () => {
    if (!customer || !isDeleteKeywordMatched || isSubmitting || isArchiving) return;
    setIsSubmitting(true);
    try {
      const res = await deleteCustomer(customer.id);
      if (res.success) {
        handleClose();
        onCustomerDeleted();
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete customer.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="delete-customer-modal-backdrop"
      className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        id="delete-customer-modal-card"
        className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 relative overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${
                relatedRecords.hasRecords
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60'
                  : 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60'
              }`}
            >
              {relatedRecords.hasRecords ? (
                <ShieldAlert className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 leading-tight">
                {relatedRecords.hasRecords
                  ? 'Customer Cannot Be Deleted'
                  : step === 'confirm'
                  ? 'Delete Customer?'
                  : 'Final Confirmation'}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {customer.name} {customer.companyName ? `(${customer.companyName})` : ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting || isArchiving}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CASE 1: Customer HAS Related Records -> BLOCKED FROM PERMANENT DELETION */}
        {relatedRecords.hasRecords ? (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 space-y-2">
              <p className="font-bold text-xs leading-relaxed">
                This customer has existing jobs, invoices, service history, or other business records.
              </p>
              <p className="text-[11.5px] leading-relaxed text-amber-800 dark:text-amber-300">
                Deleting this customer could break historical business data, accounting ledgers, and warranty records.
              </p>
            </div>

            {/* Itemized Record Breakdown */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Linked Business Records ({relatedRecords.totalCount}):
              </div>
              <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto pr-1">
                {relatedRecords.breakdownItems.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="font-semibold text-xs">{item.label}</span>
                      </div>
                      <span className="font-black text-xs px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                        {item.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Archive Alternative Explanation */}
            <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 text-indigo-900 dark:text-indigo-200 flex items-start gap-2">
              <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                <strong className="font-bold">Recommended:</strong> Archive this customer instead. Archived customers remain available for historical audit reports and invoices, but will be removed from active dispatch selection.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={isArchiving}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-archive-customer-modal"
                onClick={handleArchive}
                disabled={isArchiving}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                {isArchiving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Archiving Customer...
                  </>
                ) : (
                  <>
                    <Archive className="w-4 h-4" /> Archive Customer
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* CASE 2: Customer Has NO Related Records -> Safe Multi-step Permanent Deletion */
          <div className="space-y-4 text-xs">
            {step === 'confirm' ? (
              <>
                <div className="p-3.5 rounded-2xl bg-rose-50/90 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 text-rose-900 dark:text-rose-200 space-y-1.5">
                  <p className="font-bold text-xs">
                    This action will permanently delete this customer and cannot be undone.
                  </p>
                  <p className="text-[11.5px] leading-relaxed text-rose-800 dark:text-rose-300">
                    All associated profile details, contact numbers, and address entries will be wiped.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                    <span className="text-slate-400">Customer:</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{customer.name}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                    <span className="text-slate-400">Phone:</span>
                    <span className="font-medium">{customer.mobile || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                    <span className="text-slate-400">Verified Linked Records:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 0 records found
                    </span>
                  </div>
                </div>

                {/* Step 1 Actions: Cancel vs Continue */}
                <div className="pt-2 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    id="btn-continue-delete-step1"
                    onClick={() => setStep('type_delete')}
                    className="px-4 py-2.5 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    Continue <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            ) : (
              /* Step 2: Require Typing "DELETE" */
              <>
                <div className="space-y-2">
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    To prevent accidental deletion, type <strong className="text-rose-600 dark:text-rose-400 font-black tracking-wider">DELETE</strong> below to confirm.
                  </p>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Confirmation Keyword
                    </label>
                    <input
                      id="input-confirm-delete-text"
                      type="text"
                      autoFocus
                      value={confirmationInput}
                      onChange={(e) => setConfirmationInput(e.target.value)}
                      disabled={isSubmitting}
                      placeholder="Type DELETE"
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold transition-all focus:outline-none ${
                        isDeleteKeywordMatched
                          ? 'border-rose-500 focus:ring-2 focus:ring-rose-500 text-rose-700 dark:text-rose-300'
                          : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-600 text-slate-900 dark:text-slate-100'
                      }`}
                    />
                    {!isDeleteKeywordMatched && confirmationInput.length > 0 && (
                      <p className="text-[10.5px] text-amber-600 dark:text-amber-400 font-medium">
                        Please type exact keyword "DELETE" to enable button.
                      </p>
                    )}
                  </div>
                </div>

                {/* Step 2 Actions */}
                <div className="pt-2 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setStep('confirm')}
                    disabled={isSubmitting}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer text-center"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    id="btn-final-delete-customer"
                    onClick={handlePermanentDelete}
                    disabled={!isDeleteKeywordMatched || isSubmitting}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition-all ${
                      isDeleteKeywordMatched && !isSubmitting
                        ? 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer active:scale-95'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-60'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Deleting Customer...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" /> Delete Customer
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Customer } from '../types';
import { useApp } from '../context/AppContext';
import { useBackHandler } from '../utils/backNavigation';
import {
  X,
  Printer,
  Share2,
  FileText,
  Receipt,
  CreditCard,
  Building,
  Phone,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  MessageSquare,
} from 'lucide-react';

interface CustomerStatementModalProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CustomerStatementModal: React.FC<CustomerStatementModalProps> = ({
  customer,
  isOpen,
  onClose,
}) => {
  useBackHandler(isOpen, onClose, 'customer-statement');

  const { invoices, payments, currentBusiness, showToast } = useApp();
  const [activeStatementTab, setActiveStatementTab] = useState<'all' | 'invoices' | 'payments'>('all');

  if (!isOpen || !customer) return null;

  const currency = currentBusiness?.currency || '₹';

  // Customer Invoices & Payments
  const customerInvoices = (invoices || []).filter((inv) => inv.customerId === customer.id);
  const customerPayments = (payments || []).filter((p) => p.customerId === customer.id);

  // Financial Calculations
  const totalInvoiced = customerInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
  const totalPaid = customerInvoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
  const balanceDue = customerInvoices.reduce((sum, inv) => sum + (inv.balanceAmount || 0), 0);

  // Formatted date string for IST
  const statementDate = new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(new Date());

  const cleanPhone = (customer.whatsapp || customer.mobile || '').replace(/[^0-9]/g, '');

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const text = `*Account Statement - ${currentBusiness?.name || 'ServiFlow'}*\n` +
      `*Client:* ${customer.name}${customer.companyName ? ` (${customer.companyName})` : ''}\n` +
      `*Date:* ${statementDate}\n` +
      `--------------------------------\n` +
      `*Total Invoiced:* ${currency}${totalInvoiced.toLocaleString()}\n` +
      `*Total Paid:* ${currency}${totalPaid.toLocaleString()}\n` +
      `*Current Balance Due:* ${currency}${balanceDue.toLocaleString()}\n` +
      `*Total Invoices:* ${customerInvoices.length}\n` +
      `--------------------------------\n` +
      `For queries, call ${currentBusiness?.mobile || 'us'}. Thank you!`;

    const encoded = encodeURIComponent(text);
    if (cleanPhone) {
      window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
    } else {
      navigator.clipboard.writeText(text);
      showToast('Statement summary copied to clipboard!', 'success');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100 leading-tight">
                Customer Account Statement
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Generated on {statementDate} (IST)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrint}
              title="Print statement"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleShareWhatsApp}
              title="Share via WhatsApp"
              className="p-2 rounded-xl text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body / Printable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {/* Customer & Business Profile Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
                Customer Details
              </span>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-0.5">
                {customer.name}
              </h3>
              {customer.companyName && (
                <div className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1">
                  <Building className="w-3 h-3 shrink-0" />
                  <span>{customer.companyName}</span>
                </div>
              )}
              {customer.mobile && (
                <div className="text-[11.5px] text-slate-600 dark:text-slate-300 font-mono mt-1">
                  Phone: {customer.mobile}
                </div>
              )}
              {customer.address && (
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {customer.address}{customer.city ? `, ${customer.city}` : ''}
                </div>
              )}
            </div>

            <div className="sm:text-right">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                Service Provider
              </span>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-0.5">
                {currentBusiness?.name || 'ServiFlow'}
              </h3>
              {currentBusiness?.mobile && (
                <div className="text-[11.5px] text-slate-600 dark:text-slate-300 font-mono mt-1">
                  Helpline: {currentBusiness.mobile}
                </div>
              )}
              {currentBusiness?.gstNumber && (
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                  GSTIN: {currentBusiness.gstNumber}
                </div>
              )}
            </div>
          </div>

          {/* Account Metrics Grid */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50">
              <span className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400 block">Total Invoiced</span>
              <span className="text-sm sm:text-base font-extrabold text-indigo-700 dark:text-indigo-300 font-mono">
                {currency}{totalInvoiced.toLocaleString()}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50">
              <span className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400 block">Total Paid</span>
              <span className="text-sm sm:text-base font-extrabold text-emerald-700 dark:text-emerald-300 font-mono">
                {currency}{totalPaid.toLocaleString()}
              </span>
            </div>

            <div className={`p-3 rounded-2xl border ${
              balanceDue > 0
                ? 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-200/80 dark:border-rose-900/50 text-rose-700 dark:text-rose-300'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
            }`}>
              <span className="text-[10.5px] font-bold block opacity-80">Balance Due</span>
              <span className="text-sm sm:text-base font-black font-mono">
                {currency}{balanceDue.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Tab Selection */}
          <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 pb-2">
            {[
              { id: 'all', label: `Summary (${customerInvoices.length + customerPayments.length})` },
              { id: 'invoices', label: `Invoices (${customerInvoices.length})` },
              { id: 'payments', label: `Payments (${customerPayments.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveStatementTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeStatementTab === tab.id
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Invoices List */}
          {(activeStatementTab === 'all' || activeStatementTab === 'invoices') && (
            <div className="space-y-2">
              <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-indigo-500" />
                <span>Invoices</span>
              </h4>

              {customerInvoices.length === 0 ? (
                <div className="p-4 text-center text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                  No invoices recorded for this customer.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {customerInvoices.map((inv) => (
                    <div
                      key={inv.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                          <span className="font-mono text-indigo-600 dark:text-indigo-400">{inv.invoiceNumber}</span>
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                            inv.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : inv.status === 'partial'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                          }`}>
                            {inv.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Date: {inv.date} {inv.dueDate ? `• Due: ${inv.dueDate}` : ''}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-extrabold font-mono text-slate-900 dark:text-slate-100">
                          {currency}{inv.grandTotal?.toLocaleString()}
                        </div>
                        {inv.balanceAmount > 0 && (
                          <div className="text-[10.5px] font-bold text-rose-600 dark:text-rose-400 font-mono">
                            Due: {currency}{inv.balanceAmount?.toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Payments List */}
          {(activeStatementTab === 'all' || activeStatementTab === 'payments') && (
            <div className="space-y-2 pt-2">
              <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-emerald-500" />
                <span>Payment Receipts</span>
              </h4>

              {customerPayments.length === 0 ? (
                <div className="p-4 text-center text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                  No payment transactions recorded for this customer.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {customerPayments.map((p) => (
                    <div
                      key={p.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {p.referenceNumber || `Receipt #${p.id.slice(-6)}`}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {p.date} • Method: <span className="uppercase font-semibold">{p.method}</span>
                        </div>
                      </div>

                      <div className="text-right font-extrabold font-mono text-emerald-600 dark:text-emerald-400 text-sm">
                        +{currency}{p.amount?.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Send on WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold text-xs transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

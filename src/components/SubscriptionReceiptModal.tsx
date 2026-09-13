import React from 'react';
import { X, Printer, Download, CheckCircle2, Building2, ShieldCheck } from 'lucide-react';
import { SubscriptionPayment } from '../types';
import { SAAS_UPI_CONFIG } from '../utils/planUtils';

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
  if (!isOpen || !payment) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(payment.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto print:border-none print:shadow-none print:w-full">
        {/* Modal Action Bar (Hidden in Print) */}
        <div className="p-4 bg-slate-100 dark:bg-slate-800 flex items-center justify-between border-b border-slate-200 dark:border-slate-700 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              SaaS Subscription Tax Invoice / Receipt
            </span>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              {payment.status === 'verified' ? 'Verified' : 'Submitted / Pending'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center gap-1.5 hover:bg-indigo-700 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div className="p-6 sm:p-8 space-y-6 text-slate-900 dark:text-slate-100 print:p-4">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm">
                  SF
                </div>
                <span className="text-xl font-black tracking-tight">ServiFlow SaaS</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Cloud Service Management & FSM Platform
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                GSTIN: 07AAACU9821Q1Z4 • support@serviflow.io
              </p>
            </div>

            <div className="text-right">
              <div className="text-xs text-slate-400 uppercase font-mono">RECEIPT #</div>
              <div className="text-sm font-black font-mono text-indigo-600 dark:text-indigo-400">
                {payment.receiptNumber || `SF-REC-${payment.id.slice(-6)}`}
              </div>
              <div className="text-xs text-slate-500 mt-1">Date: {formattedDate}</div>
            </div>
          </div>

          {/* Billed To & Payment Metadata */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Billed To (Tenant)
              </span>
              <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                {payment.businessName}
              </div>
              <div className="text-slate-600 dark:text-slate-400">
                Owner: {payment.ownerName}
              </div>
              <div className="text-slate-500 font-mono">{payment.ownerPhone}</div>
              <div className="text-slate-500">{payment.ownerEmail}</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Payment Particulars
              </span>
              <div className="flex justify-between">
                <span className="text-slate-500">Method:</span>
                <span className="font-bold uppercase">{payment.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">UTR / Ref:</span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  {payment.utrNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                  {payment.status}
                </span>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3">Description</th>
                  <th className="p-3 text-center">Cycle</th>
                  <th className="p-3 text-right">Base Amount</th>
                  <th className="p-3 text-right">Discount</th>
                  <th className="p-3 text-right">Net Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                <tr>
                  <td className="p-3">
                    <div className="font-bold text-slate-900 dark:text-slate-100">
                      {payment.planName}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Cloud Software as a Service (SAC: 998313)
                    </div>
                  </td>
                  <td className="p-3 text-center capitalize font-semibold">
                    {payment.billingCycle}
                  </td>
                  <td className="p-3 text-right font-mono">
                    ₹{payment.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="p-3 text-right font-mono text-emerald-600">
                    {payment.discountAmount ? `-₹${payment.discountAmount.toLocaleString('en-IN')}` : '₹0'}
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                    ₹{payment.netPayable.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Grand Total & Taxes */}
          <div className="flex justify-end">
            <div className="w-64 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Taxable Value:</span>
                <span className="font-mono">
                  ₹{Math.round(payment.netPayable / 1.18).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Integrated GST (18%):</span>
                <span className="font-mono">
                  ₹{(payment.netPayable - Math.round(payment.netPayable / 1.18)).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between font-bold text-sm">
                <span>Total Paid:</span>
                <span className="font-black text-indigo-600 dark:text-indigo-400 font-mono">
                  ₹{payment.netPayable.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Electronically generated digital tax receipt. No physical signature required.</span>
            </div>
            <span>ServiFlow Technologies Pvt. Ltd.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

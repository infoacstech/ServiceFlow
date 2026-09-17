import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  Send,
  Printer,
  Calendar,
  CheckCircle2,
  Clock,
  User,
  CreditCard,
  Banknote,
  Receipt,
  X,
  Share2,
} from 'lucide-react';
import { Payment, Job, User as StaffUser, Business } from '../types';
import { formatIndiaDate } from '../utils/dateUtils';
import { openWhatsApp } from '../utils/whatsappHelper';

interface DailySettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
  technician?: StaffUser | null;
  business: Business;
  payments?: Payment[];
  jobs: Job[];
}

export const DailySettlementModal: React.FC<DailySettlementModalProps> = ({
  isOpen,
  onClose,
  technician,
  business,
  payments = [],
  jobs,
}) => {
  // Today's date in YYYY-MM-DD
  const todayStr = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [cashHandoverTo, setCashHandoverTo] = useState<string>('Manager / Cash Counter');
  const [settlementNotes, setSettlementNotes] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Filter payments collected by this technician on selectedDate
  const dayPayments = useMemo(() => {
    return (payments || []).filter((p) => {
      // Match date
      const pDate = (p.date || '').slice(0, 10);
      if (pDate !== selectedDate) return false;

      // Match technician if specified
      if (technician?.id) {
        if (p.collectedBy && p.collectedBy !== technician.id) return false;
      }
      return true;
    });
  }, [payments, selectedDate, technician]);

  // Aggregate metrics
  const cashPayments = dayPayments.filter((p) => p.method === 'cash');
  const upiPayments = dayPayments.filter((p) => p.method === 'upi');
  const otherPayments = dayPayments.filter((p) => p.method !== 'cash' && p.method !== 'upi');

  const cashTotal = cashPayments.reduce((s, p) => s + (p.amount || 0), 0);
  const upiTotal = upiPayments.reduce((s, p) => s + (p.amount || 0), 0);
  const otherTotal = otherPayments.reduce((s, p) => s + (p.amount || 0), 0);
  const grandTotal = cashTotal + upiTotal + otherTotal;

  // Jobs completed by technician on this date
  const completedJobsToday = useMemo(() => {
    return (jobs || []).filter((j) => {
      if (j.status !== 'completed') return false;
      if (technician?.id && j.assignedStaffId !== technician.id && j.assignedStaffId !== technician.email) {
        return false;
      }
      const cDate = (j.completionTime || j.scheduledDate || '').slice(0, 10);
      return cDate === selectedDate;
    });
  }, [jobs, selectedDate, technician]);

  if (!isOpen) return null;

  const techName = technician?.name || 'Field Technician';
  const currency = business?.currency || '₹';

  // Share handover report via WhatsApp to Business Owner / Cashier
  const handleShareWhatsApp = () => {
    const formattedDate = formatIndiaDate(selectedDate);
    const text = `📊 *DAILY CASH SETTLEMENT / HANDOVER REPORT*
━━━━━━━━━━━━━━━━━━━━
🏢 *${business.name || 'ServiFlow'}*
👷 *Technician:* ${techName} (${technician?.phone || 'Staff'})
📅 *Date:* ${formattedDate}
━━━━━━━━━━━━━━━━━━━━

💰 *COLLECTION BREAKDOWN:*
💵 *Cash Collected:* ${currency}${cashTotal.toLocaleString()} (${cashPayments.length} txns)
📲 *UPI Collected:* ${currency}${upiTotal.toLocaleString()} (${upiPayments.length} txns)
${otherTotal > 0 ? `🏦 *Bank / Other:* ${currency}${otherTotal.toLocaleString()}\n` : ''}⭐ *Total Collections:* ${currency}${grandTotal.toLocaleString()}
📋 *Jobs Completed Today:* ${completedJobsToday.length}

🤝 *Cash Handover Details:*
• Handed over to: ${cashHandoverTo}
• Physical Cash Handover: *${currency}${cashTotal.toLocaleString()}*
${settlementNotes ? `• Notes: ${settlementNotes}\n` : ''}
━━━━━━━━━━━━━━━━━━━━
_Verified and submitted digitally via ServiFlow App_`;

    const recipientPhone = business.mobile || '';
    openWhatsApp(recipientPhone, text);
    setIsSubmitted(true);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=850,height=800');
    if (!printWindow) {
      window.print();
      return;
    }

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Daily_Settlement_${techName.replace(/\s+/g, '_')}_${selectedDate}</title>
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; color: #0f172a; margin: 0; padding: 0; }
    .header { border-bottom: 2px solid #4f46e5; padding-bottom: 10px; margin-bottom: 14px; display: flex; justify-content: space-between; }
    .title { font-size: 18px; font-weight: 900; color: #1e1b4b; margin: 0; }
    .sub { font-size: 11px; color: #64748b; margin-top: 2px; }
    .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px; }
    .summary-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; text-align: center; }
    .summary-label { font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; }
    .summary-val { font-size: 16px; font-weight: 900; margin-top: 4px; }
    .val-cash { color: #059669; }
    .val-upi { color: #4f46e5; }
    .val-total { color: #0f172a; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 16px; }
    th { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; font-weight: 800; }
    td { border: 1px solid #e2e8f0; padding: 5px 8px; }
    .sign-section { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 30px; border-top: 1px dashed #cbd5e1; padding-top: 15px; }
    .sign-box { border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; text-align: center; background: #fafafa; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="title">${business.name || 'ServiFlow'}</h1>
      <div class="sub">DAILY TECHNICIAN CASH SETTLEMENT & HANDOVER VOUCHER</div>
    </div>
    <div style="text-align: right;">
      <div style="font-weight: 800; font-size: 13px; color: #4f46e5;">DATE: ${formatIndiaDate(selectedDate)}</div>
      <div style="font-size: 10px; color: #64748b;">Staff: ${techName}</div>
    </div>
  </div>

  <div class="summary-grid">
    <div class="summary-card">
      <div class="summary-label">Cash In Hand (To Handover)</div>
      <div class="summary-val val-cash">${currency}${cashTotal.toLocaleString()}</div>
      <div style="font-size: 9.5px; color: #64748b; margin-top: 2px;">${cashPayments.length} Cash Transactions</div>
    </div>
    <div class="summary-card">
      <div class="summary-label">UPI / Online Collections</div>
      <div class="summary-val val-upi">${currency}${upiTotal.toLocaleString()}</div>
      <div style="font-size: 9.5px; color: #64748b; margin-top: 2px;">${upiPayments.length} UPI Transactions</div>
    </div>
    <div class="summary-card">
      <div class="summary-label">Grand Total Collections</div>
      <div class="summary-val val-total">${currency}${grandTotal.toLocaleString()}</div>
      <div style="font-size: 9.5px; color: #64748b; margin-top: 2px;">${completedJobsToday.length} Completed Jobs</div>
    </div>
  </div>

  <h3 style="font-size: 11px; text-transform: uppercase; margin-bottom: 6px;">Payment Collections Itemization</h3>
  <table>
    <thead>
      <tr>
        <th>Txn / Job ID</th>
        <th>Customer / Service</th>
        <th>Mode</th>
        <th>Ref / UTR</th>
        <th style="text-align: right;">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${dayPayments.length === 0 ? `
        <tr><td colspan="5" style="text-align:center; padding: 12px; color: #94a3b8;">No collections recorded on this date</td></tr>
      ` : dayPayments.map((p) => `
        <tr>
          <td style="font-weight:700; font-family:monospace;">${p.id || p.jobId || 'TXN'}</td>
          <td>${p.notes || 'Service Payment'}</td>
          <td style="text-transform: uppercase; font-weight: 700;">${p.method}</td>
          <td style="font-family: monospace;">${p.referenceNumber || '-'}</td>
          <td style="text-align: right; font-weight: 800;">${currency}${p.amount}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="sign-section">
    <div class="sign-box">
      <div style="height: 40px;"></div>
      <div style="font-weight: 800; border-top: 1px solid #cbd5e1; padding-top: 5px;">
        ${techName} (Field Technician)
      </div>
      <div style="font-size: 9.5px; color: #64748b;">Submitted Handover Voucher</div>
    </div>
    <div class="sign-box">
      <div style="height: 40px;"></div>
      <div style="font-weight: 800; border-top: 1px solid #cbd5e1; padding-top: 5px;">
        ${cashHandoverTo} (Manager / Cashier)
      </div>
      <div style="font-size: 9.5px; color: #64748b;">Received Physical Cash Amount: ${currency}${cashTotal.toLocaleString()}</div>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 400);
    };
  </script>
</body>
</html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                End-of-Day Settlement
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 mt-0.5">
              Daily Cash Handover Summary
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Date Selector & Staff Info */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1">
                Settlement Date
              </label>
              <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <Calendar className="w-4 h-4 text-indigo-500 shrink-0" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent font-bold text-slate-900 dark:text-slate-100 focus:outline-hidden w-full"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1">
                Field Technician
              </label>
              <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold truncate">
                <User className="w-4 h-4 text-indigo-500 shrink-0" />
                <span className="truncate">{techName}</span>
              </div>
            </div>
          </div>

          {/* KPI Cards: Cash vs UPI */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60">
              <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase">
                <Banknote className="w-3.5 h-3.5" />
                <span>Cash to Handover</span>
              </div>
              <div className="text-base sm:text-lg font-black text-emerald-700 dark:text-emerald-300 mt-0.5">
                {currency}{cashTotal.toLocaleString()}
              </div>
              <div className="text-[9px] text-emerald-600 dark:text-emerald-400">
                {cashPayments.length} txns
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-900/60">
              <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-indigo-800 dark:text-indigo-300 uppercase">
                <CreditCard className="w-3.5 h-3.5" />
                <span>UPI Collected</span>
              </div>
              <div className="text-base sm:text-lg font-black text-indigo-700 dark:text-indigo-300 mt-0.5">
                {currency}{upiTotal.toLocaleString()}
              </div>
              <div className="text-[9px] text-indigo-600 dark:text-indigo-400">
                {upiPayments.length} txns
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                <Receipt className="w-3.5 h-3.5" />
                <span>Total Collected</span>
              </div>
              <div className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 mt-0.5">
                {currency}{grandTotal.toLocaleString()}
              </div>
              <div className="text-[9px] text-slate-500">
                {completedJobsToday.length} jobs done
              </div>
            </div>
          </div>

          {/* Cash Handover Recipient Field */}
          <div className="space-y-2 pt-1">
            <div>
              <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Handing Over Cash To (Cashier / Manager / Owner):
              </label>
              <input
                type="text"
                value={cashHandoverTo}
                onChange={(e) => setCashHandoverTo(e.target.value)}
                placeholder="e.g. Rajesh Kumar (Office Cashier)"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Settlement Notes / Remarks:
              </label>
              <textarea
                value={settlementNotes}
                onChange={(e) => setSettlementNotes(e.target.value)}
                rows={2}
                placeholder="e.g. ₹500 kept for vehicle fuel allowance, balance ₹2,500 handed over in cash."
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden"
              />
            </div>
          </div>

          {/* List of Payments for this date */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-slate-900 dark:text-slate-100 text-[11px]">
                Payments Recorded for {formatIndiaDate(selectedDate)}:
              </span>
              <span className="text-[10px] text-slate-400">
                {dayPayments.length} records
              </span>
            </div>

            {dayPayments.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-center text-slate-400 text-xs">
                No payment transactions recorded for this date.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {dayPayments.map((p) => (
                  <div
                    key={p.id}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs bg-white dark:bg-slate-800/80"
                  >
                    <div>
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        {p.notes || `Receipt ${p.id}`}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Mode: <span className="uppercase font-bold text-indigo-600">{p.method}</span>
                        {p.referenceNumber && ` • Ref: ${p.referenceNumber}`}
                      </div>
                    </div>
                    <div className="font-mono font-black text-emerald-600">
                      +{currency}{p.amount}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {isSubmitted && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-2 text-emerald-800 dark:text-emerald-200 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Report transmitted to manager via WhatsApp!</span>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 space-y-2">
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
            >
              <Share2 className="w-4 h-4" />
              <span>Send Daily Settlement Report to Manager via WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-700 inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Settlement Slip / PDF Voucher</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

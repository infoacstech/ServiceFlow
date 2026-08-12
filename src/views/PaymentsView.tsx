import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CreditCard, Search, DollarSign, ArrowUpRight } from 'lucide-react';
import { DateRangePicker, DateRange } from '../components/DateRangePicker';

export const PaymentsView: React.FC = () => {
  const { payments, customers, invoices, currentBusiness } = useApp();
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: '',
    endDate: '',
    preset: 'all',
  });

  const filtered = (payments || []).filter((p) => {
    const cust = (customers || []).find((c) => c.id === p.customerId);
    const matchesSearch =
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      p.referenceNumber?.toLowerCase().includes(search.toLowerCase()) ||
      cust?.name.toLowerCase().includes(search.toLowerCase());

    const matchesDate = (() => {
      if (!p.date) return true;
      const d = p.date.slice(0, 10);
      if (dateRange.startDate && d < dateRange.startDate) return false;
      if (dateRange.endDate && d > dateRange.endDate) return false;
      return true;
    })();

    return matchesSearch && matchesDate;
  });

  const totalCollected = filtered.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-600" /> Payment Receipts Ledger ({payments.length})
          </h1>
          <p className="text-xs text-slate-500">Immutable ledger of cash, UPI, & bank collections</p>
        </div>

        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200/60 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-600 text-white font-bold">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold uppercase">Filtered Collections</div>
            <div className="text-lg font-black text-emerald-900 dark:text-emerald-100">
              {currentBusiness.currency}{totalCollected.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by receipt no, UPI ref, customer..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-medium focus:outline-none"
          />
        </div>

        <DateRangePicker value={dateRange} onChange={setDateRange} align="right" />
      </div>

      {/* Payments Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Receipt No</th>
                <th className="p-3.5">Customer</th>
                <th className="p-3.5">Invoice Ref</th>
                <th className="p-3.5">Payment Date</th>
                <th className="p-3.5">Mode</th>
                <th className="p-3.5">Txn Reference</th>
                <th className="p-3.5 text-right">Amount Received</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {(filtered || []).map((p) => {
                const customer = (customers || []).find((c) => c.id === p.customerId);
                const invoice = (invoices || []).find((inv) => inv.id === p.invoiceId);

                return (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-3.5 font-extrabold text-indigo-600">{p.id}</td>
                    <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">{customer?.name}</td>
                    <td className="p-3.5 text-slate-500 font-mono">{invoice?.invoiceNumber || 'INV-DIRECT'}</td>
                    <td className="p-3.5 text-slate-500">{p.date}</td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 uppercase">
                        {p.method}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-slate-600">{p.referenceNumber || 'N/A'}</td>
                    <td className="p-3.5 text-right font-black text-emerald-600 text-sm">
                      + {currentBusiness.currency}{p.amount}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

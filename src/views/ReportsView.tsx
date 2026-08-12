import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BarChart3, TrendingUp, DollarSign, CheckCircle2, FileSpreadsheet, Calendar, PieChart } from 'lucide-react';
import { DateRangePicker, DateRange, getPresetDates } from '../components/DateRangePicker';

export const ReportsView: React.FC = () => {
  const { invoices, expenses, jobs, payments, currentBusiness } = useApp();

  const [dateRange, setDateRange] = useState<DateRange>(() => getPresetDates('this_month'));

  const isDateInRange = (dateStr?: string) => {
    if (!dateStr) return true;
    const d = dateStr.slice(0, 10);
    if (dateRange.startDate && d < dateRange.startDate) return false;
    if (dateRange.endDate && d > dateRange.endDate) return false;
    return true;
  };

  // Filter datasets by date range
  const filteredInvoices = invoices.filter((i) => isDateInRange(i.date));
  const filteredExpenses = expenses.filter((e) => isDateInRange(e.date));
  const filteredPayments = payments.filter((p) => isDateInRange(p.date));
  const filteredJobs = jobs.filter((j) => isDateInRange(j.scheduledDate));

  const totalRevenue = filteredInvoices.reduce((s, i) => s + i.grandTotal, 0);
  const totalCollected = filteredPayments.reduce((s, p) => s + p.amount, 0);
  const totalExpense = filteredExpenses.reduce((s, e) => s + e.amount, 0);
  const netProfit = totalCollected - totalExpense;

  const exportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Metric,Amount\n' +
      `Date Range,${dateRange.startDate || 'All'} to ${dateRange.endDate || 'All'}\n` +
      `Total Revenue Invoiced,${totalRevenue}\n` +
      `Total Payments Collected,${totalCollected}\n` +
      `Total Operating Expenses,${totalExpense}\n` +
      `Net Profit,${netProfit}\n` +
      `Total Jobs Completed,${filteredJobs.filter((j) => j.status === 'completed').length}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${currentBusiness.name.replace(/\s+/g, '_')}_Financial_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" /> Business Analytics & Reports
          </h1>
          <p className="text-xs text-slate-500">P&L Financial statements, collections, & CSV data export</p>
        </div>

        <div className="flex items-center gap-3">
          <DateRangePicker value={dateRange} onChange={setDateRange} align="right" />

          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-md active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export CSV Report
          </button>
        </div>
      </div>

      {/* P&L Statement Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 mb-1">Total Invoiced Sales</div>
          <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
            {currentBusiness.currency}{totalRevenue.toLocaleString()}
          </div>
          <div className="text-[10px] text-indigo-600 font-bold mt-1">
            {filteredInvoices.length} Invoices Issued
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 mb-1">Payments Collected</div>
          <div className="text-xl font-extrabold text-emerald-600">
            {currentBusiness.currency}{totalCollected.toLocaleString()}
          </div>
          <div className="text-[10px] text-emerald-600 font-bold mt-1">
            {filteredPayments.length} Transactions Received
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 mb-1">Operating Expenses</div>
          <div className="text-xl font-extrabold text-rose-600">
            {currentBusiness.currency}{totalExpense.toLocaleString()}
          </div>
          <div className="text-[10px] text-rose-600 font-bold mt-1">
            {filteredExpenses.length} Expense Items
          </div>
        </div>

        <div className="p-5 bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-3xl border border-indigo-950 shadow-md">
          <div className="text-xs font-semibold text-indigo-200 mb-1">Net Business Profit</div>
          <div className="text-2xl font-black text-emerald-400">
            {currentBusiness.currency}{netProfit.toLocaleString()}
          </div>
          <div className="text-[10px] text-indigo-300 font-bold mt-1">Collections - Expenses</div>
        </div>
      </div>

      {/* Operational Breakdown Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Jobs Summary Card */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-600" /> Jobs Activity Summary
            </h3>
            <span className="text-xs text-slate-500 font-semibold">{filteredJobs.length} Total Jobs</span>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
              <div className="text-lg font-black text-slate-900 dark:text-slate-100">
                {filteredJobs.filter((j) => j.status === 'completed' || j.status === 'closed').length}
              </div>
              <div className="text-[10px] font-bold text-slate-500 uppercase">Completed</div>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
              <div className="text-lg font-black text-amber-600">
                {filteredJobs.filter((j) => j.status === 'in_progress' || j.status === 'started').length}
              </div>
              <div className="text-[10px] font-bold text-slate-500 uppercase">In Progress</div>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
              <div className="text-lg font-black text-indigo-600">
                {filteredJobs.filter((j) => j.status === 'new' || j.status === 'assigned').length}
              </div>
              <div className="text-[10px] font-bold text-slate-500 uppercase">Pending</div>
            </div>
          </div>
        </div>

        {/* Expenses Category Distribution */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-rose-600" /> Expense Items
            </h3>
            <span className="text-xs text-slate-500 font-semibold">{currentBusiness.currency}{totalExpense}</span>
          </div>
          <div className="space-y-2">
            {filteredExpenses.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">No expenses recorded for this date range.</p>
            ) : (
              filteredExpenses.slice(0, 4).map((exp) => (
                <div key={exp.id} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{exp.category}</span>
                  <span className="font-bold text-rose-600">{currentBusiness.currency}{exp.amount}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Expense, ExpenseCategory } from '../types';
import { DollarSign, Plus, Search, Calendar, Tag, X } from 'lucide-react';

export const ExpensesView: React.FC = () => {
  const { expenses, addExpense, currentBusiness } = useApp();
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [category, setCategory] = useState('Fuel & Travel');
  const [amount, setAmount] = useState(500);
  const [description, setDescription] = useState('Fuel for technician bike visit');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    addExpense({
      category: category as ExpenseCategory,
      amount: Number(amount),
      description,
      date,
      paymentMethod: 'cash',
    });
    setIsAddOpen(false);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-indigo-600" /> Business Expenses ({expenses.length})
          </h1>
          <p className="text-xs text-slate-500">Track field travel, tool purchases, office rent, & operational expenses</p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-md active:scale-95"
        >
          <Plus className="w-4 h-4" /> Add Expense
        </button>
      </div>

      {/* Expenses Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Description</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Payment Method</th>
                <th className="p-3.5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {expenses.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-3.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 uppercase">
                      {e.category}
                    </span>
                  </td>
                  <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">{e.description}</td>
                  <td className="p-3.5 text-slate-500">{e.date}</td>
                  <td className="p-3.5 text-slate-500 uppercase">{e.paymentMethod}</td>
                  <td className="p-3.5 text-right font-black text-rose-600 text-sm">
                    - {currentBusiness.currency}{e.amount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreate}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Log Expense</h3>
              <button type="button" onClick={() => setIsAddOpen(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50"
                >
                  <option value="Fuel & Travel">Fuel & Travel</option>
                  <option value="Spare Parts Purchase">Spare Parts Purchase</option>
                  <option value="Office Rent & Utilities">Office Rent & Utilities</option>
                  <option value="Staff Refreshments">Staff Refreshments</option>
                  <option value="Marketing & Ads">Marketing & Ads</option>
                  <option value="Tool Maintenance">Tool Maintenance</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Amount ({currentBusiness.currency}) *</label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 font-bold"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Description *</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Details of expense..."
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <button type="button" onClick={() => setIsAddOpen(false)} className="px-4 py-2 rounded-xl border text-xs font-semibold">
                Cancel
              </button>
              <button type="submit" className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs shadow-md">
                Save Expense
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

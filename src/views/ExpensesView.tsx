import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Expense, ExpenseCategory } from '../types';
import { DollarSign, Plus, Search, Calendar, Tag, X, Wallet, Fuel, Wrench, Coffee, Receipt, Filter } from 'lucide-react';

export const ExpensesView: React.FC = () => {
  const { expenses, addExpense, currentBusiness, currentUser } = useApp();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [category, setCategory] = useState<ExpenseCategory>('fuel');
  const [amount, setAmount] = useState<number | ''>(200);
  const [description, setDescription] = useState('Fuel for customer site visit');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'bank_transfer' | 'card'>('cash');

  const filteredExpenses = expenses.filter((e) => {
    const matchesSearch =
      (e.description || '').toLowerCase().includes(search.toLowerCase()) ||
      (e.category || '').toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || e.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const totalExpense = filteredExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;

    addExpense({
      category,
      amount: Number(amount),
      description: description.trim() || `${category.toUpperCase()} expense recorded by ${currentUser?.name || 'Staff'}`,
      date,
      paymentMethod,
    });
    setIsAddOpen(false);
    // Reset defaults for next quick entry
    setDescription('Fuel for customer site visit');
    setAmount(200);
  };

  const quickFieldCategories: { label: string; cat: ExpenseCategory; icon: any; defaultDesc: string }[] = [
    { label: 'Fuel / Petrol', cat: 'fuel', icon: Fuel, defaultDesc: 'Bike/Vehicle fuel for site visits' },
    { label: 'Spare Parts Purchase', cat: 'material', icon: Wrench, defaultDesc: 'Emergency local spare parts purchase' },
    { label: 'Travel & Toll', cat: 'travel', icon: Receipt, defaultDesc: 'Parking, toll, and transit expenses' },
    { label: 'Staff Refreshments', cat: 'other', icon: Coffee, defaultDesc: 'Tea/Refreshment during field duty' },
  ];

  const getCategoryBadgeClass = (cat: ExpenseCategory) => {
    switch (cat) {
      case 'fuel':
        return 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200/60 dark:border-amber-900/60';
      case 'material':
        return 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border-indigo-200/60 dark:border-indigo-900/60';
      case 'travel':
        return 'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-200/60 dark:border-blue-900/60';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Field & Business Expenses</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {expenses.length} Records
                </span>
              </h1>
              <p className="text-xs text-slate-500">
                Log field travel fuel, parts purchase, parking, and daily operational expenditures
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all shadow-md active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Record Field Expense</span>
        </button>
      </div>

      {/* Filter and Summary Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search Bar */}
        <div className="md:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by description, category, or notes..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Total Metric Card */}
        <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/50 rounded-2xl px-4 py-2.5 flex items-center justify-between">
          <div className="text-xs font-semibold text-amber-900 dark:text-amber-300">
            Total Logged
          </div>
          <div className="text-base font-black text-rose-600 dark:text-rose-400">
            - {currentBusiness.currency}{totalExpense.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Description & Purpose</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Payment Method</th>
                <th className="p-3.5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-400 text-xs">
                    No expense records found. Tap "+ Record Field Expense" to add one.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border uppercase ${getCategoryBadgeClass(
                          e.category
                        )}`}
                      >
                        {e.category}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">{e.description}</td>
                    <td className="p-3.5 text-slate-500 font-medium">{e.date}</td>
                    <td className="p-3.5 text-slate-500 font-bold uppercase text-[10px]">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">
                        {e.paymentMethod || 'Cash'}
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-black text-rose-600 dark:text-rose-400 text-sm">
                      - {currentBusiness.currency}{Number(e.amount).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreate}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600">
                  <Wallet className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Record Field Expense
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">
                Quick Category Shortcuts:
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {quickFieldCategories.map((item) => {
                  const Icon = item.icon;
                  const isSelected = category === item.cat;
                  return (
                    <button
                      key={item.cat}
                      type="button"
                      onClick={() => {
                        setCategory(item.cat);
                        setDescription(item.defaultDesc);
                      }}
                      className={`p-2 rounded-xl text-left border text-[11px] font-bold flex items-center gap-1.5 transition-all ${
                        isSelected
                          ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 text-amber-800 dark:text-amber-200'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold"
                >
                  <option value="fuel">Fuel & Vehicle Petrol</option>
                  <option value="material">Spare Parts & Materials</option>
                  <option value="travel">Travel, Toll & Parking</option>
                  <option value="office">Office & Utilities</option>
                  <option value="salary">Staff Advance / Wage</option>
                  <option value="marketing">Marketing & Promotion</option>
                  <option value="other">Other / Refreshments</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Amount ({currentBusiness.currency}) *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 200"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-black text-sm focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Description / Purpose *
                </label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Petrol for visiting Sector 4 customer"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Paid Via
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold"
                  >
                    <option value="cash">Cash</option>
                    <option value="upi">UPI / Online</option>
                    <option value="card">Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md cursor-pointer transition-all active:scale-95"
              >
                Save Expense
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useBackHandler } from '../utils/backNavigation';
import { Search, X, Users, Briefcase, Receipt, FileText, Package, UserCheck } from 'lucide-react';

interface GlobalSearchModalProps {
  onSelectTab: (tab: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ onSelectTab }) => {
  const {
    isSearchOpen,
    setIsSearchOpen,
    customers,
    jobs,
    invoices,
    quotations,
    inventory,
    staff,
    currentBusiness,
  } = useApp();

  useBackHandler(isSearchOpen, () => setIsSearchOpen(false), 'global-search-modal');

  const [query, setQuery] = useState('');

  if (!isSearchOpen) return null;

  const q = (query || '').toLowerCase().trim();

  const matchingCustomers = q ? (customers || []).filter((c) => (c.name || '').toLowerCase().includes(q) || (c.mobile || '').includes(q)) : [];
  const matchingJobs = q ? (jobs || []).filter((j) => (j.jobId || '').toLowerCase().includes(q) || (j.description || '').toLowerCase().includes(q)) : [];
  const matchingInvoices = q ? (invoices || []).filter((inv) => (inv.invoiceNumber || '').toLowerCase().includes(q)) : [];
  const matchingQuotes = q ? (quotations || []).filter((qt) => (qt.quotationNumber || '').toLowerCase().includes(q)) : [];
  const matchingInventory = q ? (inventory || []).filter((item) => (item.name || '').toLowerCase().includes(q) || (item.sku || '').toLowerCase().includes(q)) : [];
  const matchingStaff = q ? (staff || []).filter((st) => (st.name || '').toLowerCase().includes(q) || (st.role || '').includes(q)) : [];

  const handleResultClick = (tab: string) => {
    onSelectTab(tab);
    setIsSearchOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-start justify-center p-4 pt-16 sm:pt-24 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-4 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Search Input Header */}
        <div className="flex items-center gap-3 px-3 py-2 border-b border-slate-100 dark:border-slate-800">
          <Search className="w-5 h-5 text-indigo-600" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type customer name, job ID (JOB-102), invoice number, item SKU..."
            className="w-full bg-transparent text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none placeholder:text-slate-400"
            autoFocus
          />
          <button
            onClick={() => setIsSearchOpen(false)}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Results list */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-4">
          {!q ? (
            <div className="text-center py-10 text-xs text-slate-400">
              Type to search across Customers, Jobs, Invoices, Quotes, Parts & Staff
            </div>
          ) : (
            <>
              {/* Customers */}
              {matchingCustomers.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1 flex items-center gap-1">
                    <Users className="w-3 h-3 text-indigo-500" /> Customers ({matchingCustomers.length})
                  </div>
                  {matchingCustomers.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => handleResultClick('customers')}
                      className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100">{c.name}</div>
                        <div className="text-[11px] text-slate-500">{c.companyName ? `${c.companyName} • ` : ''}{c.mobile}</div>
                      </div>
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 px-2 py-0.5 rounded font-mono">View CRM</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Jobs */}
              {matchingJobs.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1 flex items-center gap-1">
                    <Briefcase className="w-3 h-3 text-amber-500" /> Jobs ({matchingJobs.length})
                  </div>
                  {matchingJobs.map((j) => (
                    <div
                      key={j.id}
                      onClick={() => handleResultClick('jobs')}
                      className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100">{j.jobId}</div>
                        <div className="text-[11px] text-slate-500 line-clamp-1">{j.description}</div>
                      </div>
                      <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-semibold uppercase">{j.status}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Invoices */}
              {matchingInvoices.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1 flex items-center gap-1">
                    <Receipt className="w-3 h-3 text-emerald-500" /> Invoices ({matchingInvoices.length})
                  </div>
                  {matchingInvoices.map((inv) => (
                    <div
                      key={inv.id}
                      onClick={() => handleResultClick('invoices')}
                      className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100">{inv.invoiceNumber}</div>
                        <div className="text-[11px] text-slate-500">{currentBusiness.currency}{inv.grandTotal}</div>
                      </div>
                      <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded font-semibold uppercase">{inv.status}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Quotations */}
              {matchingQuotes.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1 flex items-center gap-1">
                    <FileText className="w-3 h-3 text-blue-500" /> Quotations ({matchingQuotes.length})
                  </div>
                  {matchingQuotes.map((qt) => (
                    <div
                      key={qt.id}
                      onClick={() => handleResultClick('quotations')}
                      className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100">{qt.quotationNumber}</div>
                        <div className="text-[11px] text-slate-500">{currentBusiness.currency}{qt.grandTotal}</div>
                      </div>
                      <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-semibold uppercase">{qt.status}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Inventory */}
              {matchingInventory.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1 flex items-center gap-1">
                    <Package className="w-3 h-3 text-purple-500" /> Inventory Parts ({matchingInventory.length})
                  </div>
                  {matchingInventory.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleResultClick('inventory')}
                      className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100">{item.name}</div>
                        <div className="text-[11px] text-slate-500">SKU: {item.sku} • Stock: {item.currentStock} {item.unit}</div>
                      </div>
                      <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">{currentBusiness.currency}{item.sellingPrice}</span>
                    </div>
                  ))}
                </div>
              )}

              {matchingCustomers.length === 0 &&
                matchingJobs.length === 0 &&
                matchingInvoices.length === 0 &&
                matchingQuotes.length === 0 &&
                matchingInventory.length === 0 && (
                  <div className="text-center py-8 text-xs text-slate-400">
                    No results found for "{query}"
                  </div>
                )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

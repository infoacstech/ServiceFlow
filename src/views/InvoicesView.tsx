import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Invoice, InvoiceStatus, PaymentMethod } from '../types';
import { CustomerSearchSelect } from '../components/CustomerSearchSelect';
import {
  Receipt,
  Plus,
  Search,
  DollarSign,
  CheckCircle2,
  Clock,
  Printer,
  Share2,
  X,
  CreditCard,
  Filter,
  MessageSquare,
  Send,
  Sparkles,
  MoreVertical,
  Phone,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { sendInvoiceWhatsAppReminder } from '../utils/whatsappHelper';
import { getIndiaDatePlusDays } from '../utils/dateUtils';
import { QRCodeSVG } from 'qrcode.react';
import { printInvoiceDocument, InvoiceTheme } from '../utils/invoicePdfHelper';

export interface InvoiceInitialFilter {
  statusFilter?: string;
  search?: string;
}

interface InvoicesViewProps {
  initialFilter?: InvoiceInitialFilter | null;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({ initialFilter }) => {
  const {
    invoices,
    customers,
    services,
    recordPayment,
    addInvoice,
    currentBusiness,
    t,
  } = useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialFilter?.statusFilter || 'all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceTheme, setInvoiceTheme] = useState<InvoiceTheme>('modern');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    if (initialFilter?.statusFilter !== undefined) {
      setStatusFilter(initialFilter.statusFilter);
    }
  }, [initialFilter]);

  // Record Payment Form
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('upi');
  const [payRef, setPayRef] = useState('');

  // Create Invoice Form
  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [dueDate, setDueDate] = useState(() => getIndiaDatePlusDays(15));
  const [items, setItems] = useState([
    { description: '', quantity: 1, rate: 0, taxPercent: 18, amount: 0 },
  ]);

  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    recordPayment({
      invoiceId: selectedInvoice.id,
      customerId: selectedInvoice.customerId,
      amount: Number(payAmount),
      date: new Date().toISOString().split('T')[0],
      method: payMethod as PaymentMethod,
      referenceNumber: payRef.trim() || undefined,
    });
    setIsPaymentModalOpen(false);
    setSelectedInvoice(null);
  };

  const handleCreateInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || items.length === 0) return;

    const sub = Math.round(items.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.rate) || 0), 0) * 100) / 100;
    const tax = Math.round(items.reduce((s, i) => s + ((Number(i.quantity) || 0) * (Number(i.rate) || 0) * (Number(i.taxPercent) || 0)) / 100, 0) * 100) / 100;
    const grand = Math.round((sub + tax) * 100) / 100;

    addInvoice({
      customerId,
      date: new Date().toISOString().split('T')[0],
      dueDate,
      notes: 'Thank you for choosing our services.',
      items: items.map((i, idx) => ({ ...i, id: `inv-item-${idx}` })),
      subtotal: sub,
      taxTotal: tax,
      discountTotal: 0,
      grandTotal: grand,
      paidAmount: 0,
      balanceAmount: grand,
      status: 'pending',
    });

    setIsCreateInvoiceOpen(false);
  };

  const filtered = (invoices || []).filter((inv) => {
    const cust = (customers || []).find((c) => c.id === inv.customerId);
    if (search.trim()) {
      const s = search.toLowerCase();
      const matchesSearch =
        (inv.invoiceNumber || '').toLowerCase().includes(s) ||
        (cust?.name || '').toLowerCase().includes(s) ||
        (cust?.mobile || '').toLowerCase().includes(s) ||
        (cust?.whatsapp || '').toLowerCase().includes(s) ||
        (cust?.companyName || '').toLowerCase().includes(s) ||
        (cust?.email || '').toLowerCase().includes(s) ||
        (inv.items || []).some((it) => (it.description || '').toLowerCase().includes(s));
      if (!matchesSearch) return false;
    }

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'pending'
        ? inv.balanceAmount > 0 || inv.status === 'pending' || inv.status === 'partial' || inv.status === 'overdue'
        : statusFilter === 'paid'
        ? inv.status === 'paid' && inv.balanceAmount === 0
        : inv.status === statusFilter;

    return matchesStatus;
  });

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-indigo-600" /> {t('invoices.title', undefined, 'Invoices & Billing')} ({invoices.length})
          </h1>
          <p className="text-xs text-slate-500">{t('invoices.subtitle', undefined, 'Tax invoices, due balance tracking, payment receipts, & PDF generation')}</p>
        </div>

        <button
          onClick={() => setIsCreateInvoiceOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-md active:scale-95"
        >
          <Plus className="w-4 h-4" /> {t('invoices.createInvoice', undefined, 'Create New Invoice')}
        </button>
      </div>

      {/* Search & Status Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('invoices.searchPlaceholder', undefined, 'Search by invoice number (INV-2026-089), customer, mobile, items...')}
            className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl font-semibold text-xs border border-slate-200 dark:border-slate-700 cursor-pointer"
          >
            <option value="all">{t('invoices.allInvoices', undefined, 'All Invoices')}</option>
            <option value="pending">{t('invoices.pendingBalance', undefined, 'Pending Balance Due')}</option>
            <option value="paid">{t('invoices.fullyPaid', undefined, 'Fully Paid')}</option>
            <option value="overdue">{t('invoices.overdue', undefined, 'Overdue')}</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
        {filtered.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 flex items-center justify-center mx-auto shadow-2xs">
              <Receipt className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No invoices found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {search
                ? `No invoices match "${search}". Try searching with customer name or invoice number.`
                : 'No invoices recorded for the selected status.'}
            </p>
            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('all');
                }}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-all cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* 1. Mobile Cards View (md:hidden) - Clean, compact, perfectly aligned */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800/80 p-2.5 space-y-2">
              {filtered.map((inv) => {
                const customer = (customers || []).find((c) => c.id === inv.customerId);
                const isMenuOpen = openMenuId === inv.id;

                return (
                  <div
                    key={inv.id}
                    onClick={() => setSelectedInvoice(inv)}
                    className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-indigo-400 dark:hover:border-indigo-500 transition-all cursor-pointer space-y-2 active:scale-[0.99] relative"
                  >
                    {/* Top Row: Fixed height h-7 for exact vertical center alignment */}
                    <div className="h-7 flex items-center justify-between gap-1.5 min-w-0">
                      {/* Left: Invoice ID + Status Badge */}
                      <div className="flex items-center gap-1.5 min-w-0 flex-1 h-7">
                        <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 font-mono truncate">
                          {inv.invoiceNumber}
                        </span>
                        <span
                          className={`h-5 inline-flex items-center px-2 rounded-md text-[9.5px] font-black uppercase shrink-0 ${
                            inv.status === 'paid'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : inv.status === 'partial'
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                              : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </div>

                      {/* Right: Amount + 3-Dot Action Menu */}
                      <div className="flex items-center gap-2 shrink-0 h-7">
                        <span
                          className={`h-5 inline-flex items-center text-xs font-mono font-black ${
                            inv.balanceAmount > 0
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {inv.balanceAmount > 0 ? (
                            <>Due: {currentBusiness.currency}{inv.balanceAmount}</>
                          ) : (
                            <>{currentBusiness.currency}{inv.grandTotal}</>
                          )}
                        </span>

                        {/* 3-Dot Action Menu */}
                        <div className="relative shrink-0 flex items-center justify-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(isMenuOpen ? null : inv.id);
                            }}
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                            aria-label="Invoice options"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>

                          {isMenuOpen && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-0 top-8 z-30 w-52 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1 animate-in fade-in zoom-in-95 text-xs text-slate-700 dark:text-slate-200"
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  setSelectedInvoice(inv);
                                }}
                                className="w-full px-3.5 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700/60 font-semibold flex items-center gap-2"
                              >
                                <Receipt className="w-3.5 h-3.5 text-indigo-500" />
                                <span>View Full Invoice</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  sendInvoiceWhatsAppReminder(inv, customer, currentBusiness);
                                }}
                                className="w-full px-3.5 py-2 text-left hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-2"
                              >
                                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Send on WhatsApp</span>
                              </button>

                              {inv.balanceAmount > 0 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    setSelectedInvoice(inv);
                                    setPayAmount(inv.balanceAmount);
                                    setIsPaymentModalOpen(true);
                                  }}
                                  className="w-full px-3.5 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700/60 font-semibold flex items-center gap-2 text-indigo-600 dark:text-indigo-400"
                                >
                                  <CreditCard className="w-3.5 h-3.5" />
                                  <span>Record Payment</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Row 2: Customer Name + Phone */}
                    <div className="flex items-center justify-between text-xs min-w-0">
                      <span className="font-extrabold text-slate-800 dark:text-slate-200 truncate">
                        {customer?.name || 'Customer'}
                      </span>
                      {customer?.mobile && (
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono shrink-0 ml-2">
                          {customer.mobile}
                        </span>
                      )}
                    </div>

                    {/* Row 3: Dates & Quick Total Summary */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span>Due: <strong className="text-slate-700 dark:text-slate-300">{inv.dueDate}</strong></span>
                      <span>Total: <strong className="font-mono text-slate-800 dark:text-slate-200">{currentBusiness.currency}{inv.grandTotal}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 2. Desktop Table View (hidden md:block) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5">{t('invoices.invoiceNumber', undefined, 'Invoice No')}</th>
                    <th className="p-3.5">{t('common.customer', undefined, 'Customer')}</th>
                    <th className="p-3.5">{t('invoices.invoiceDate', undefined, 'Issue Date')}</th>
                    <th className="p-3.5">{t('invoices.dueDate', undefined, 'Due Date')}</th>
                    <th className="p-3.5">{t('common.total', undefined, 'Total')}</th>
                    <th className="p-3.5">{t('common.paid', undefined, 'Paid')}</th>
                    <th className="p-3.5">{t('common.balance', undefined, 'Balance')}</th>
                    <th className="p-3.5">{t('common.status', undefined, 'Status')}</th>
                    <th className="p-3.5 text-right">{t('common.actions', undefined, 'Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filtered.map((inv) => {
                    const customer = (customers || []).find((c) => c.id === inv.customerId);

                    return (
                      <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="p-3.5 font-extrabold text-indigo-600 font-mono">{inv.invoiceNumber}</td>
                        <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">{customer?.name}</td>
                        <td className="p-3.5 text-slate-500">{inv.date}</td>
                        <td className="p-3.5 text-slate-500">{inv.dueDate}</td>
                        <td className="p-3.5 font-bold font-mono">{currentBusiness.currency}{inv.grandTotal}</td>
                        <td className="p-3.5 text-emerald-600 font-bold font-mono">{currentBusiness.currency}{inv.paidAmount}</td>
                        <td className="p-3.5 text-rose-600 font-extrabold font-mono">{currentBusiness.currency}{inv.balanceAmount}</td>
                        <td className="p-3.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              inv.status === 'paid'
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                                : inv.status === 'partial'
                                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                                : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                            }`}
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right space-x-1.5">
                          <button
                            onClick={() => {
                              const cust = (customers || []).find((c) => c.id === inv.customerId);
                              sendInvoiceWhatsAppReminder(inv, cust, currentBusiness);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800 text-[11px] inline-flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                            title="Send invoice & UPI link on WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" /> WhatsApp
                          </button>
                          <button
                            onClick={() => setSelectedInvoice(inv)}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-[11px] cursor-pointer"
                          >
                            View
                          </button>
                          {inv.balanceAmount > 0 && (
                            <button
                              onClick={() => {
                                setSelectedInvoice(inv);
                                setPayAmount(inv.balanceAmount);
                                setIsPaymentModalOpen(true);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-xs text-[11px] cursor-pointer"
                            >
                              Record Pay
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Record Payment Modal */}
      {isPaymentModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleRecordPaymentSubmit}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Record Payment</h3>
                <p className="text-xs text-slate-500">{selectedInvoice.invoiceNumber} • Balance: {currentBusiness.currency}{selectedInvoice.balanceAmount}</p>
              </div>
              <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Amount Received ({currentBusiness.currency})</label>
                <input
                  type="number"
                  required
                  max={selectedInvoice.balanceAmount}
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 font-black text-sm text-emerald-600"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50"
                >
                  <option value="upi">UPI (GPay / PhonePe / Paytm)</option>
                  <option value="cash">Cash Received</option>
                  <option value="bank_transfer">Bank Transfer / NEFT / IMPS</option>
                  <option value="card">Credit / Debit Card</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Transaction Ref / Note</label>
                <input
                  type="text"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  placeholder="e.g. UPI Ref #987123"
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="px-4 py-2 rounded-xl border text-xs font-semibold">
                Cancel
              </button>
              <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-semibold text-xs shadow-md">
                Confirm Payment Receipt
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Printable Invoice Modal */}
      {selectedInvoice && !isPaymentModalOpen && (() => {
        const customer = (customers || []).find((c) => c.id === selectedInvoice.customerId);
        const isPaid = selectedInvoice.status === 'paid' || (selectedInvoice.balanceAmount || 0) <= 0;
        const upiId = currentBusiness?.email ? `${currentBusiness.email.split('@')[0]}@upi` : 'merchant@upi';
        const balanceToPay = (selectedInvoice.balanceAmount || 0) > 0 ? selectedInvoice.balanceAmount : selectedInvoice.grandTotal;
        const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(currentBusiness.name || 'ServiFlow Merchant')}&am=${balanceToPay}&cu=INR&tn=${encodeURIComponent('Invoice ' + selectedInvoice.invoiceNumber)}`;

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
              {/* Modal Top Header */}
              <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 font-mono">
                        {selectedInvoice.invoiceNumber}
                      </span>
                      {isPaid ? (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                          ✓ Paid
                        </span>
                      ) : (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                          Payment Due
                        </span>
                      )}
                    </div>
                    <h3 className="font-black text-base text-slate-900 dark:text-slate-100">
                      Tax Invoice & Payment Receipt
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Theme Switcher */}
                  <div className="hidden sm:flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                    {(['modern', 'classic', 'minimal'] as InvoiceTheme[]).map((thm) => (
                      <button
                        key={thm}
                        type="button"
                        onClick={() => setInvoiceTheme(thm)}
                        className={`px-2.5 py-1 rounded-lg font-bold capitalize transition-all cursor-pointer ${
                          invoiceTheme === thm
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs'
                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        {thm}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setSelectedInvoice(null)}
                    className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* In-Modal Visual Invoice Preview */}
              <div
                className={`p-5 sm:p-6 rounded-2xl border text-xs space-y-4 ${
                  invoiceTheme === 'classic'
                    ? 'bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800'
                    : invoiceTheme === 'minimal'
                    ? 'bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-900/60'
                    : 'bg-indigo-50/30 dark:bg-slate-900 border-indigo-100 dark:border-indigo-950'
                }`}
              >
                {/* Business Header */}
                <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-3 gap-3">
                  <div>
                    <div className="font-black text-lg text-slate-900 dark:text-slate-100">
                      {currentBusiness.name}
                    </div>
                    <div className="text-slate-500 text-[11px] mt-0.5">
                      {currentBusiness.address}, {currentBusiness.city} {currentBusiness.pin}
                    </div>
                    <div className="text-slate-500 text-[11px]">
                      GSTIN: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{currentBusiness.gstNumber || '09AAAAA0000A1Z5'}</span>
                    </div>
                    <div className="text-slate-500 text-[11px]">
                      Phone: {currentBusiness.mobile} • Email: {currentBusiness.email}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-black text-indigo-600 dark:text-indigo-400 text-sm tracking-wide">
                      TAX INVOICE
                    </div>
                    <div className="text-slate-600 dark:text-slate-400 font-mono text-[11px] mt-0.5">
                      Date: <strong className="text-slate-900 dark:text-slate-100">{selectedInvoice.date}</strong>
                    </div>
                    <div className="text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                      Due: <strong className="text-slate-900 dark:text-slate-100">{selectedInvoice.dueDate || 'On Receipt'}</strong>
                    </div>
                  </div>
                </div>

                {/* Customer Billed To */}
                <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 flex justify-between items-start">
                  <div>
                    <div className="font-black text-slate-400 uppercase text-[9.5px] tracking-wider">
                      Billed To (Customer):
                    </div>
                    <div className="font-black text-slate-900 dark:text-slate-100 text-sm mt-0.5">
                      {customer?.name || 'Customer'}
                    </div>
                    <div className="text-slate-500 text-[11px]">
                      {customer?.mobile && `Phone: ${customer.mobile}`}
                      {customer?.address && ` • ${customer.address}`}
                    </div>
                  </div>
                  {customer?.gstNumber && (
                    <div className="text-right text-[11px] text-slate-500">
                      GSTIN: <strong className="font-mono text-slate-800 dark:text-slate-200">{customer.gstNumber}</strong>
                    </div>
                  )}
                </div>

                {/* Line Items Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 text-[11px]">
                        <th className="py-2 px-2 font-bold">Item Description</th>
                        <th className="py-2 px-2 text-center font-bold">Qty</th>
                        <th className="py-2 px-2 text-right font-bold">Rate</th>
                        <th className="py-2 px-2 text-center font-bold">GST</th>
                        <th className="py-2 px-2 text-right font-bold">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11.5px]">
                      {selectedInvoice.items.map((it) => (
                        <tr key={it.id}>
                          <td className="py-2.5 px-2 font-semibold text-slate-800 dark:text-slate-200">
                            {it.description}
                          </td>
                          <td className="py-2.5 px-2 text-center text-slate-600 dark:text-slate-400 font-mono">
                            {it.quantity}
                          </td>
                          <td className="py-2.5 px-2 text-right text-slate-600 dark:text-slate-400 font-mono">
                            {currentBusiness.currency}{it.rate}
                          </td>
                          <td className="py-2.5 px-2 text-center text-slate-500 font-mono">
                            {it.taxPercent || 18}%
                          </td>
                          <td className="py-2.5 px-2 text-right font-black text-slate-900 dark:text-slate-100 font-mono">
                            {currentBusiness.currency}{it.amount}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mathematical Summary & UPI QR Payment Box */}
                <div className="border-t border-slate-200 dark:border-slate-800 pt-3 grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                  {/* Left: Dynamic UPI QR Box */}
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg border border-slate-200 shrink-0">
                      <QRCodeSVG value={upiUrl} size={84} level="M" />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
                        Scan & Pay via UPI
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-300 font-mono truncate">
                        {upiId}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Supports GPay, PhonePe, Paytm & BHIM
                      </div>
                    </div>
                  </div>

                  {/* Right: Calculations */}
                  <div className="space-y-1.5 text-right font-medium text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>Subtotal:</span>
                      <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {currentBusiness.currency}{selectedInvoice.subtotal}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>GST:</span>
                      <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {currentBusiness.currency}{selectedInvoice.taxTotal}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-900 dark:text-slate-100 font-black text-sm pt-1 border-t border-slate-200 dark:border-slate-700">
                      <span>Grand Total:</span>
                      <span className="font-mono text-indigo-600 dark:text-indigo-400">
                        {currentBusiness.currency}{selectedInvoice.grandTotal}
                      </span>
                    </div>
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>Paid Amount:</span>
                      <span className="font-mono">
                        {currentBusiness.currency}{selectedInvoice.paidAmount}
                      </span>
                    </div>
                    <div className="flex justify-between text-rose-600 font-black text-sm">
                      <span>Balance Due:</span>
                      <span className="font-mono">
                        {currentBusiness.currency}{selectedInvoice.balanceAmount}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => printInvoiceDocument(selectedInvoice, customer, currentBusiness, invoiceTheme)}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                  >
                    <Printer className="w-4 h-4" /> Print / Save PDF
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sendInvoiceWhatsAppReminder(selectedInvoice, customer, currentBusiness);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" /> Share on WhatsApp
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs cursor-pointer transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Create Invoice Modal */}
      {isCreateInvoiceOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateInvoiceSubmit}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Create Tax Invoice</h3>
              <button type="button" onClick={() => setIsCreateInvoiceOpen(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2">
                <CustomerSearchSelect
                  id="invoice-customer-search-select"
                  customers={customers}
                  value={customerId}
                  onChange={(id) => setCustomerId(id)}
                  label="Select Customer"
                  required
                  placeholder="Search customer by name, mobile, company..."
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Payment Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <button type="button" onClick={() => setIsCreateInvoiceOpen(false)} className="px-4 py-2 rounded-xl border text-xs font-semibold">
                Cancel
              </button>
              <button type="submit" className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs shadow-md">
                Generate Invoice
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

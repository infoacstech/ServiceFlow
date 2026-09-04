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
  } = useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialFilter?.statusFilter || 'all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
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
  const [payRef, setPayRef] = useState('UPI-TXN-98421');

  // Create Invoice Form
  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [dueDate, setDueDate] = useState('2026-08-30');
  const [items, setItems] = useState([
    { description: 'Annual CCTV & DVR Service Charge', quantity: 1, rate: 2500, taxPercent: 18, amount: 2950 },
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
      referenceNumber: payRef,
    });
    setIsPaymentModalOpen(false);
    setSelectedInvoice(null);
  };

  const handleCreateInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || items.length === 0) return;

    const sub = items.reduce((s, i) => s + i.quantity * i.rate, 0);
    const tax = items.reduce((s, i) => s + (i.quantity * i.rate * i.taxPercent) / 100, 0);
    const grand = sub + tax;

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
            <Receipt className="w-5 h-5 text-indigo-600" /> Invoices & Billing ({invoices.length})
          </h1>
          <p className="text-xs text-slate-500">Tax invoices, due balance tracking, payment receipts, & PDF generation</p>
        </div>

        <button
          onClick={() => setIsCreateInvoiceOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-md active:scale-95"
        >
          <Plus className="w-4 h-4" /> Create New Invoice
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
            placeholder="Search by invoice number (INV-2026-089), customer, mobile, items..."
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
            <option value="all">All Invoices</option>
            <option value="pending">Pending Balance Due</option>
            <option value="paid">Fully Paid</option>
            <option value="overdue">Overdue</option>
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
                    <th className="p-3.5">Invoice No</th>
                    <th className="p-3.5">Customer</th>
                    <th className="p-3.5">Issue Date</th>
                    <th className="p-3.5">Due Date</th>
                    <th className="p-3.5">Total</th>
                    <th className="p-3.5">Paid</th>
                    <th className="p-3.5">Balance</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
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
      {selectedInvoice && !isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 border shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-xs font-bold text-indigo-600">{selectedInvoice.invoiceNumber}</span>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">Tax Invoice</h3>
              </div>
              <button onClick={() => setSelectedInvoice(null)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border text-xs space-y-4">
              <div className="flex justify-between items-start border-b pb-3">
                <div>
                  <div className="font-extrabold text-base text-slate-900 dark:text-slate-100">{currentBusiness.name}</div>
                  <div className="text-slate-500">{currentBusiness.address}, {currentBusiness.city}</div>
                  <div className="text-slate-500">GSTIN: {currentBusiness.gstNumber || '09AAAAA0000A1Z5'}</div>
                </div>
                <div className="text-right">
                  <div className="font-black text-emerald-600 text-sm">TAX INVOICE</div>
                  <div className="text-slate-500">Date: {selectedInvoice.date}</div>
                </div>
              </div>

              <div>
                <div className="font-bold text-slate-400 uppercase text-[10px]">Billed To:</div>
                <div className="font-bold text-slate-900 dark:text-slate-100">
                  {(customers || []).find((c) => c.id === selectedInvoice.customerId)?.name}
                </div>
              </div>

              <table className="w-full text-left border-collapse">
                <thead className="border-b text-slate-400">
                  <tr>
                    <th className="py-2">Description</th>
                    <th className="py-2 text-center">Qty</th>
                    <th className="py-2 text-right">Rate</th>
                    <th className="py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {selectedInvoice.items.map((it) => (
                    <tr key={it.id}>
                      <td className="py-2 font-medium">{it.description}</td>
                      <td className="py-2 text-center">{it.quantity}</td>
                      <td className="py-2 text-right">{currentBusiness.currency}{it.rate}</td>
                      <td className="py-2 text-right font-bold">{currentBusiness.currency}{it.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t pt-3 flex justify-end text-right">
                <div className="space-y-1">
                  <div>Total: {currentBusiness.currency}{selectedInvoice.grandTotal}</div>
                  <div className="text-emerald-600 font-bold">Paid: {currentBusiness.currency}{selectedInvoice.paidAmount}</div>
                  <div className="text-rose-600 font-black">Balance Due: {currentBusiness.currency}{selectedInvoice.balanceAmount}</div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => {
                  const cust = (customers || []).find((c) => c.id === selectedInvoice.customerId);
                  sendInvoiceWhatsAppReminder(selectedInvoice, cust, currentBusiness);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" /> Share on WhatsApp
              </button>
              <button onClick={() => setSelectedInvoice(null)} className="px-5 py-2 rounded-xl bg-slate-200 text-slate-800 font-semibold text-xs cursor-pointer">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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

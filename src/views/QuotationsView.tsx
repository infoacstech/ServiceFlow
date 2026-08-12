import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Quotation, LineItem } from '../types';
import {
  FileText,
  Plus,
  Search,
  CheckCircle2,
  Send,
  X,
  Trash2,
  Printer,
  Share2,
  ArrowRight,
  Copy,
} from 'lucide-react';

export const QuotationsView: React.FC = () => {
  const {
    quotations,
    customers,
    services,
    inventory,
    addQuotation,
    convertQuotationToInvoice,
    currentBusiness,
  } = useApp();

  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);

  // New Quotation Form
  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [validUntil, setValidUntil] = useState('2026-08-30');
  const [notes, setNotes] = useState('Payment 50% advance upon quotation approval.');
  const [lineItems, setLineItems] = useState<Omit<LineItem, 'id' | 'amount'>[]>([
    {
      description: services[0]?.name || '4K Camera Installation & Wiring',
      quantity: 1,
      rate: services[0]?.price || 1500,
      taxPercent: 18,
    },
  ]);

  const addLine = () => {
    setLineItems([
      ...lineItems,
      { description: 'Additional Service / Spare Part', quantity: 1, rate: 1000, taxPercent: 18 },
    ]);
  };

  const removeLine = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const calculateSubtotal = () =>
    lineItems.reduce((sum, item) => sum + item.quantity * item.rate, 0);

  const calculateTax = () =>
    lineItems.reduce((sum, item) => sum + (item.quantity * item.rate * item.taxPercent) / 100, 0);

  const calculateGrandTotal = () => calculateSubtotal() + calculateTax();

  const handleCreateQuotation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || lineItems.length === 0) return;

    addQuotation({
      customerId,
      date: new Date().toISOString().split('T')[0],
      validUntil,
      notes,
      items: lineItems.map((item, idx) => ({
        ...item,
        id: `item-${idx}`,
        amount: item.quantity * item.rate + (item.quantity * item.rate * item.taxPercent) / 100,
      })),
      subtotal: calculateSubtotal(),
      taxTotal: calculateTax(),
      discountTotal: 0,
      grandTotal: calculateGrandTotal(),
      status: 'draft',
    });

    setIsCreateOpen(false);
  };

  const filtered = (quotations || []).filter((q) => {
    const cust = (customers || []).find((c) => c.id === q.customerId);
    return (
      q.quotationNumber.toLowerCase().includes(search.toLowerCase()) ||
      cust?.name.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" /> Quotations & Estimates ({quotations.length})
          </h1>
          <p className="text-xs text-slate-500">Create professional price estimates & convert them into live invoices with 1 click</p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-md active:scale-95"
        >
          <Plus className="w-4 h-4" /> Create Quotation
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <Search className="w-4 h-4 absolute left-6 top-5 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by quote number (QT-2026-001), customer..."
          className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-medium focus:outline-none"
        />
      </div>

      {/* Quotations Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Quotation No</th>
                <th className="p-3.5">Customer</th>
                <th className="p-3.5">Date Created</th>
                <th className="p-3.5">Valid Until</th>
                <th className="p-3.5">Grand Total</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {(filtered || []).map((qt) => {
                const customer = (customers || []).find((c) => c.id === qt.customerId);

                return (
                  <tr key={qt.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-3.5 font-extrabold text-indigo-600">{qt.quotationNumber}</td>
                    <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">{customer?.name}</td>
                    <td className="p-3.5 text-slate-500">{qt.date}</td>
                    <td className="p-3.5 text-slate-500">{qt.validUntil}</td>
                    <td className="p-3.5 font-black text-slate-900 dark:text-slate-100">
                      {currentBusiness.currency}{qt.grandTotal}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 uppercase">
                        {qt.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      <button
                        onClick={() => setSelectedQuotation(qt)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200"
                      >
                        Preview / Share
                      </button>
                      <button
                        onClick={() => convertQuotationToInvoice(qt.id)}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-xs"
                      >
                        Convert to Invoice →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* PDF / Share Preview Modal */}
      {selectedQuotation && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 border shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-xs font-bold text-indigo-600">{selectedQuotation.quotationNumber}</span>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">Quotation Preview</h3>
              </div>
              <button onClick={() => setSelectedQuotation(null)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border text-xs space-y-4">
              <div className="flex justify-between items-start border-b pb-3">
                <div>
                  <div className="font-extrabold text-base text-slate-900 dark:text-slate-100">{currentBusiness.name}</div>
                  <div className="text-slate-500">{currentBusiness.address}, {currentBusiness.city}</div>
                  <div className="text-slate-500">Phone: {currentBusiness.mobile}</div>
                </div>
                <div className="text-right">
                  <div className="font-black text-indigo-600 text-sm">QUOTATION</div>
                  <div className="text-slate-500">Date: {selectedQuotation.date}</div>
                </div>
              </div>

              <div>
                <div className="font-bold text-slate-400 uppercase text-[10px]">Prepared For:</div>
                <div className="font-bold text-slate-900 dark:text-slate-100">
                  {(customers || []).find((c) => c.id === selectedQuotation.customerId)?.name}
                </div>
              </div>

              <table className="w-full text-left border-collapse">
                <thead className="border-b text-slate-400">
                  <tr>
                    <th className="py-2">Item</th>
                    <th className="py-2 text-center">Qty</th>
                    <th className="py-2 text-right">Price</th>
                    <th className="py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {selectedQuotation.items.map((it) => (
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
                  <div>Subtotal: {currentBusiness.currency}{selectedQuotation.subtotal}</div>
                  <div>Tax: {currentBusiness.currency}{selectedQuotation.taxTotal}</div>
                  <div className="text-sm font-black text-slate-900 dark:text-slate-100">
                    Grand Total: {currentBusiness.currency}{selectedQuotation.grandTotal}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t">
              <button
                onClick={() => alert('Sending quotation via WhatsApp...')}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5"
              >
                <Share2 className="w-4 h-4" /> Share WhatsApp
              </button>
              <button onClick={() => setSelectedQuotation(null)} className="px-5 py-2 rounded-xl bg-slate-200 text-slate-800 font-semibold text-xs">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Quotation Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateQuotation}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 border shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Create New Quotation</h3>
              <button type="button" onClick={() => setIsCreateOpen(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2 sm:col-span-1">
                <label className="font-semibold block mb-1">Select Customer *</label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.companyName || c.mobile})
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="font-semibold block mb-1">Valid Until Date</label>
                <input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50"
                />
              </div>
            </div>

            {/* Line Items Builder */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between font-bold text-xs">
                <span>Line Items</span>
                <button type="button" onClick={addLine} className="text-indigo-600 hover:underline">
                  + Add Line Item
                </button>
              </div>

              {lineItems.map((line, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center text-xs bg-slate-50 p-2.5 rounded-2xl border">
                  <div className="col-span-5">
                    <input
                      type="text"
                      value={line.description}
                      onChange={(e) => {
                        const updated = [...lineItems];
                        updated[idx].description = e.target.value;
                        setLineItems(updated);
                      }}
                      placeholder="Item description"
                      className="w-full px-2 py-1.5 rounded-lg border bg-white"
                    />
                  </div>

                  <div className="col-span-2">
                    <input
                      type="number"
                      value={line.quantity}
                      onChange={(e) => {
                        const updated = [...lineItems];
                        updated[idx].quantity = Number(e.target.value);
                        setLineItems(updated);
                      }}
                      placeholder="Qty"
                      className="w-full px-2 py-1.5 rounded-lg border bg-white"
                    />
                  </div>

                  <div className="col-span-2">
                    <input
                      type="number"
                      value={line.rate}
                      onChange={(e) => {
                        const updated = [...lineItems];
                        updated[idx].rate = Number(e.target.value);
                        setLineItems(updated);
                      }}
                      placeholder="Rate"
                      className="w-full px-2 py-1.5 rounded-lg border bg-white font-bold"
                    />
                  </div>

                  <div className="col-span-2 text-right font-bold text-slate-900">
                    {currentBusiness.currency}{line.quantity * line.rate}
                  </div>

                  <div className="col-span-1 text-center">
                    <button type="button" onClick={() => removeLine(idx)} className="text-rose-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl text-xs space-y-1 text-right font-semibold">
              <div>Subtotal: {currentBusiness.currency}{calculateSubtotal()}</div>
              <div>Estimated GST (18%): {currentBusiness.currency}{calculateTax()}</div>
              <div className="text-sm font-black text-indigo-600">Grand Total: {currentBusiness.currency}{calculateGrandTotal()}</div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <button type="button" onClick={() => setIsCreateOpen(false)} className="px-4 py-2 rounded-xl border text-xs font-semibold">
                Cancel
              </button>
              <button type="submit" className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs shadow-md">
                Generate Quotation
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

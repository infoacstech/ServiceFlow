import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Quotation, LineItem } from '../types';
import { CustomerSearchSelect } from '../components/CustomerSearchSelect';
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
  AlertCircle,
  Calendar,
  Percent,
  Check,
  Building2,
  Clock,
} from 'lucide-react';
import {
  getIndiaTodayDateString,
  getIndiaDatePlusDays,
  isPastIndiaDate,
  formatIndiaDate,
  formatIndiaDateTime,
} from '../utils/dateUtils';
import { sendQuotationWhatsApp } from '../utils/whatsappHelper';

interface FormLineItem {
  id: string;
  description: string;
  quantity: number | '';
  rate: number | '';
}

interface FormErrors {
  customerId?: string;
  validUntil?: string;
  lineItems?: string;
  items: {
    [index: number]: {
      description?: string;
      quantity?: string;
      rate?: string;
    };
  };
}

const GST_PRESET_RATES = [0, 5, 12, 18, 28];

export const QuotationsView: React.FC = () => {
  const {
    quotations,
    customers,
    services,
    inventory,
    addQuotation,
    convertQuotationToInvoice,
    currentBusiness,
    showToast,
  } = useApp();

  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);

  // Today in India Standard Time (Asia/Kolkata)
  const todayIndia = useMemo(() => getIndiaTodayDateString(), []);

  // Form State
  const [customerId, setCustomerId] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [notes, setNotes] = useState('Payment 50% advance upon quotation approval. Validity as stated.');
  const [isGstApplicable, setIsGstApplicable] = useState(true);
  const [gstRate, setGstRate] = useState<number>(18);
  const [customGstRate, setCustomGstRate] = useState<string>('');
  const [isCustomGst, setIsCustomGst] = useState(false);

  const [lineItems, setLineItems] = useState<FormLineItem[]>([
    {
      id: `item-${Date.now()}-0`,
      description: '',
      quantity: 1,
      rate: '',
    },
  ]);

  const [errors, setErrors] = useState<FormErrors>({ items: {} });

  // Open Create Quotation Modal with smart defaults
  const handleOpenCreateModal = () => {
    const defaultCustId = customers[0]?.id || '';
    setCustomerId(defaultCustId);

    // Default valid until is strictly Current Date + 7 days in India Standard Time
    setValidUntil(getIndiaDatePlusDays(7));
    setNotes('Payment 50% advance upon quotation approval. Validity as stated.');

    // Check if current business or customer has GST registration
    const businessHasGst = Boolean(currentBusiness.gstNumber && currentBusiness.gstNumber.trim().length > 0);
    setIsGstApplicable(businessHasGst);
    setGstRate(18);
    setIsCustomGst(false);
    setCustomGstRate('');

    // Sensible first line item
    const firstService = services[0];
    setLineItems([
      {
        id: `item-${Date.now()}-0`,
        description: firstService?.name || '',
        quantity: 1,
        rate: firstService?.price && firstService.price > 0 ? firstService.price : '',
      },
    ]);

    setErrors({ items: {} });
    setIsCreateOpen(true);
  };

  // When customer changes, reflect GST status if customer has GST
  const handleCustomerChange = (id: string) => {
    setCustomerId(id);
    if (errors.customerId) {
      setErrors((prev) => ({ ...prev, customerId: undefined }));
    }

    const selectedCust = customers.find((c) => c.id === id);
    if (selectedCust?.gstNumber && selectedCust.gstNumber.trim().length > 0) {
      setIsGstApplicable(true);
    }
  };

  // Add line item
  const addLine = () => {
    setLineItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}-${prev.length}`,
        description: '',
        quantity: 1,
        rate: '',
      },
    ]);
  };

  // Remove line item
  const removeLine = (index: number) => {
    if (lineItems.length <= 1) {
      showToast('A quotation must have at least one line item.', 'info');
      return;
    }
    setLineItems((prev) => prev.filter((_, i) => i !== index));
    setErrors((prev) => {
      const updatedItems = { ...prev.items };
      delete updatedItems[index];
      return { ...prev, items: updatedItems };
    });
  };

  // Update line item field
  const updateLine = (
    index: number,
    field: keyof FormLineItem,
    val: string | number
  ) => {
    setLineItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });

    // Clear specific error on change
    if (errors.items?.[index]?.[field as 'description' | 'quantity' | 'rate']) {
      setErrors((prev) => {
        const updatedItems = { ...prev.items };
        if (updatedItems[index]) {
          const itemCopy = { ...updatedItems[index] };
          delete itemCopy[field as 'description' | 'quantity' | 'rate'];
          if (Object.keys(itemCopy).length === 0) {
            delete updatedItems[index];
          } else {
            updatedItems[index] = itemCopy;
          }
        }
        return { ...prev, items: updatedItems };
      });
    }
  };

  // Effective GST rate %
  const effectiveGstRate = useMemo(() => {
    if (!isGstApplicable) return 0;
    if (isCustomGst) {
      const parsed = parseFloat(customGstRate);
      return isNaN(parsed) ? 0 : Math.max(0, parsed);
    }
    return gstRate;
  }, [isGstApplicable, isCustomGst, customGstRate, gstRate]);

  // Subtotal = Sum of (Qty × Rate)
  const calculateSubtotal = (): number => {
    return lineItems.reduce((sum, item) => {
      const q = typeof item.quantity === 'number' ? item.quantity : Number(item.quantity) || 0;
      const r = typeof item.rate === 'number' ? item.rate : Number(item.rate) || 0;
      return sum + q * r;
    }, 0);
  };

  // Tax Total based on dynamic GST rate
  const calculateTax = (subtotal: number): number => {
    if (!isGstApplicable || effectiveGstRate <= 0) return 0;
    return (subtotal * effectiveGstRate) / 100;
  };

  const subtotalValue = calculateSubtotal();
  const taxValue = calculateTax(subtotalValue);
  const grandTotalValue = subtotalValue + taxValue;

  // Validation function
  const validateForm = (): boolean => {
    const newErrors: FormErrors = { items: {} };
    let isValid = true;

    // 1. Customer selected validation
    if (!customerId || !customerId.trim()) {
      newErrors.customerId = 'Please select a customer for this quotation.';
      isValid = false;
    }

    // 2. Valid Until Date validation (India Standard Time check)
    if (!validUntil) {
      newErrors.validUntil = 'Valid Until Date is required.';
      isValid = false;
    } else if (isPastIndiaDate(validUntil)) {
      newErrors.validUntil = `Valid Until Date cannot be in the past (Today is ${formatIndiaDate(todayIndia)}).`;
      isValid = false;
    }

    // 3. At least one line item validation
    if (lineItems.length === 0) {
      newErrors.lineItems = 'At least one line item is required.';
      isValid = false;
    }

    // 4. Line items row-by-row validation
    lineItems.forEach((item, idx) => {
      const itemErr: { description?: string; quantity?: string; rate?: string } = {};

      if (!item.description || !item.description.trim()) {
        itemErr.description = 'Description is required';
        isValid = false;
      }

      const qNum = typeof item.quantity === 'number' ? item.quantity : Number(item.quantity);
      if (item.quantity === '' || isNaN(qNum) || qNum <= 0) {
        itemErr.quantity = 'Qty must be > 0';
        isValid = false;
      }

      const rNum = typeof item.rate === 'number' ? item.rate : Number(item.rate);
      if (item.rate === '' || isNaN(rNum) || rNum < 0) {
        itemErr.rate = 'Valid rate required (₹0 or more)';
        isValid = false;
      }

      if (Object.keys(itemErr).length > 0) {
        newErrors.items[idx] = itemErr;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleCreateQuotation = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast('Please resolve the highlighted validation errors.', 'error');
      return;
    }

    const subtotal = calculateSubtotal();
    const taxTotal = calculateTax(subtotal);
    const grandTotal = subtotal + taxTotal;

    const formattedItems: LineItem[] = lineItems.map((item, idx) => {
      const q = typeof item.quantity === 'number' ? item.quantity : Number(item.quantity) || 0;
      const r = typeof item.rate === 'number' ? item.rate : Number(item.rate) || 0;
      return {
        id: item.id || `item-${Date.now()}-${idx}`,
        description: item.description.trim(),
        quantity: q,
        rate: r,
        taxPercent: effectiveGstRate,
        amount: q * r,
      };
    });

    addQuotation({
      customerId,
      date: getIndiaTodayDateString(), // Strictly saved in India Standard Time
      validUntil,
      notes: notes.trim(),
      items: formattedItems,
      subtotal,
      taxTotal,
      discountTotal: 0,
      grandTotal,
      status: 'draft',
    });

    setIsCreateOpen(false);
  };

  const filtered = (quotations || []).filter((q) => {
    const cust = (customers || []).find((c) => c.id === q.customerId);
    const s = (search || '').toLowerCase();
    return (
      (q.quotationNumber || '').toLowerCase().includes(s) ||
      (cust?.name || '').toLowerCase().includes(s) ||
      (cust?.mobile || '').includes(s)
    );
  });

  const selectedCustomer = useMemo(() => {
    if (!selectedQuotation) return null;
    return customers.find((c) => c.id === selectedQuotation.customerId);
  }, [selectedQuotation, customers]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" /> Quotations & Estimates ({quotations.length})
          </h1>
          <p className="text-xs text-slate-500">
            Create professional price estimates in India Standard Time (IST) & convert them into live invoices with 1 click
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-md active:scale-95 cursor-pointer"
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
          placeholder="Search by quotation number (e.g. QT-2026-101), customer name or phone..."
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
                <th className="p-3.5">Date Created (IST)</th>
                <th className="p-3.5">Valid Until (IST)</th>
                <th className="p-3.5">Grand Total</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No quotations found. Click <strong className="text-indigo-600">Create Quotation</strong> to generate one.
                  </td>
                </tr>
              ) : (
                filtered.map((qt) => {
                  const customer = (customers || []).find((c) => c.id === qt.customerId);
                  const isExpired = isPastIndiaDate(qt.validUntil) && qt.status !== 'approved';

                  return (
                    <tr key={qt.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-3.5 font-extrabold text-indigo-600">
                        {qt.quotationNumber}
                      </td>
                      <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">
                        {customer?.name || 'Customer'}
                        {customer?.companyName && (
                          <span className="block text-[10px] text-slate-400 font-normal">
                            {customer.companyName}
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-slate-500 font-medium">
                        {formatIndiaDate(qt.date)}
                      </td>
                      <td className="p-3.5">
                        <span className={`font-medium ${isExpired ? 'text-amber-600 font-bold' : 'text-slate-600 dark:text-slate-300'}`}>
                          {formatIndiaDate(qt.validUntil)}
                        </span>
                        {isExpired && (
                          <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300">
                            Expired
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 font-black text-slate-900 dark:text-slate-100">
                        {currentBusiness.currency}{qt.grandTotal.toLocaleString('en-IN')}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            qt.status === 'approved'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                              : qt.status === 'sent'
                              ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {qt.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedQuotation(qt)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        >
                          Preview / Share
                        </button>
                        <button
                          onClick={() => convertQuotationToInvoice(qt.id)}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors shadow-xs cursor-pointer"
                        >
                          Convert to Invoice →
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PDF / Share Preview Modal */}
      {selectedQuotation && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-xs font-bold text-indigo-600">{selectedQuotation.quotationNumber}</span>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">Quotation Preview</h3>
              </div>
              <button
                onClick={() => setSelectedQuotation(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div id="quotation-print-area" className="p-6 bg-slate-50 dark:bg-slate-800/70 rounded-3xl border border-slate-200/80 dark:border-slate-700/60 text-xs space-y-4">
              <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-700 pb-3">
                <div>
                  <div className="font-extrabold text-base text-slate-900 dark:text-slate-100">{currentBusiness.name}</div>
                  <div className="text-slate-500">{currentBusiness.address}, {currentBusiness.city}</div>
                  <div className="text-slate-500">Phone: {currentBusiness.mobile}</div>
                  {currentBusiness.gstNumber && (
                    <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                      GSTIN: {currentBusiness.gstNumber}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-black text-indigo-600 text-sm tracking-wide">ESTIMATE / QUOTE</div>
                  <div className="text-slate-500">Date: {formatIndiaDate(selectedQuotation.date)}</div>
                  <div className="text-slate-500 font-semibold">
                    Valid Until: {formatIndiaDate(selectedQuotation.validUntil)}
                  </div>
                </div>
              </div>

              <div>
                <div className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">Prepared For:</div>
                <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  {selectedCustomer?.name || 'Customer'}
                </div>
                {selectedCustomer?.companyName && (
                  <div className="text-slate-600 dark:text-slate-400 font-medium">
                    {selectedCustomer.companyName}
                  </div>
                )}
                <div className="text-slate-500">{selectedCustomer?.mobile}</div>
                {selectedCustomer?.address && (
                  <div className="text-slate-500 text-[11px]">{selectedCustomer.address}</div>
                )}
                {selectedCustomer?.gstNumber && (
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold mt-0.5">
                    GSTIN: {selectedCustomer.gstNumber}
                  </div>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="border-b border-slate-200 dark:border-slate-700 text-slate-400 text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-2 font-bold">Description</th>
                      <th className="py-2 text-center font-bold">Qty</th>
                      <th className="py-2 text-right font-bold">Rate</th>
                      <th className="py-2 text-right font-bold">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60 dark:divide-slate-700/60">
                    {selectedQuotation.items.map((it, idx) => (
                      <tr key={it.id || idx}>
                        <td className="py-2 font-medium text-slate-900 dark:text-slate-100">{it.description}</td>
                        <td className="py-2 text-center text-slate-600 dark:text-slate-300">{it.quantity}</td>
                        <td className="py-2 text-right text-slate-600 dark:text-slate-300">
                          {currentBusiness.currency}{it.rate.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2 text-right font-bold text-slate-900 dark:text-slate-100">
                          {currentBusiness.currency}{it.amount.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-700 pt-3 flex justify-end text-right">
                <div className="space-y-1.5 w-64">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Subtotal:</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {currentBusiness.currency}{selectedQuotation.subtotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>
                      {selectedQuotation.taxTotal > 0 ? 'Estimated GST / Tax:' : 'GST / Tax:'}
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {selectedQuotation.taxTotal > 0
                        ? `${currentBusiness.currency}${selectedQuotation.taxTotal.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`
                        : 'Exempt / Nil'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-slate-900 dark:text-slate-100 pt-1.5 border-t border-slate-300 dark:border-slate-600">
                    <span>Grand Total:</span>
                    <span className="text-indigo-600">
                      {currentBusiness.currency}{selectedQuotation.grandTotal.toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {selectedQuotation.notes && (
                <div className="border-t border-slate-200 dark:border-slate-700 pt-3 text-[11px] text-slate-500">
                  <span className="font-bold text-slate-600 dark:text-slate-400">Terms / Notes: </span>
                  {selectedQuotation.notes}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => sendQuotationWhatsApp(selectedQuotation, selectedCustomer || undefined, currentBusiness)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <Share2 className="w-4 h-4" /> Share WhatsApp
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Print
                </button>
                <button
                  onClick={() => setSelectedQuotation(null)}
                  className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs hover:bg-slate-300 dark:hover:bg-slate-700 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Quotation Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateQuotation}
            noValidate
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">Create New Quotation</h3>
                <p className="text-[11px] text-slate-400">Timezone: India Standard Time (Asia/Kolkata)</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Top Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <CustomerSearchSelect
                  id="quotation-customer-search-select"
                  customers={customers}
                  value={customerId}
                  onChange={handleCustomerChange}
                  label="Select Customer *"
                  required
                  placeholder="Search customer by name or phone..."
                />
                {errors.customerId && (
                  <p className="text-rose-500 text-[11px] font-semibold mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {errors.customerId}
                  </p>
                )}
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Valid Until Date *</span>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-normal">
                    Default: +7 Days (IST)
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    min={todayIndia}
                    value={validUntil}
                    onChange={(e) => {
                      setValidUntil(e.target.value);
                      if (errors.validUntil) {
                        setErrors((prev) => ({ ...prev, validUntil: undefined }));
                      }
                    }}
                    className={`w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-xs font-medium focus:outline-none transition-colors ${
                      errors.validUntil
                        ? 'border-rose-400 focus:border-rose-500'
                        : 'border-slate-200 dark:border-slate-700 focus:border-indigo-500'
                    }`}
                  />
                </div>
                {errors.validUntil ? (
                  <p className="text-rose-500 text-[11px] font-semibold mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {errors.validUntil}
                  </p>
                ) : (
                  <p className="text-slate-400 text-[10px] mt-1">
                    Cannot be a past date. Today in India: {formatIndiaDate(todayIndia)}.
                  </p>
                )}
              </div>
            </div>

            {/* Line Items Builder */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between font-bold text-xs">
                <span className="text-slate-800 dark:text-slate-200">
                  Line Items ({lineItems.length})
                </span>
                <button
                  type="button"
                  onClick={addLine}
                  className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Line Item
                </button>
              </div>

              {errors.lineItems && (
                <p className="text-rose-500 text-[11px] font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.lineItems}
                </p>
              )}

              {/* Desktop Header */}
              <div className="hidden sm:grid sm:grid-cols-12 gap-2.5 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <div className="col-span-5">Description *</div>
                <div className="col-span-2 text-center">Qty *</div>
                <div className="col-span-2 text-right">Rate ({currentBusiness.currency}) *</div>
                <div className="col-span-2 text-right">Amount ({currentBusiness.currency})</div>
                <div className="col-span-1 text-center">Action</div>
              </div>

              {/* Rows */}
              <div className="space-y-2.5">
                {lineItems.map((line, idx) => {
                  const qNum = typeof line.quantity === 'number' ? line.quantity : Number(line.quantity) || 0;
                  const rNum = typeof line.rate === 'number' ? line.rate : Number(line.rate) || 0;
                  const itemAmount = qNum * rNum;
                  const itemErr = errors.items?.[idx] || {};

                  return (
                    <div
                      key={line.id}
                      className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 transition-all"
                    >
                      {/* Desktop Grid Row */}
                      <div className="hidden sm:grid sm:grid-cols-12 gap-2.5 items-center">
                        <div className="col-span-5">
                          <input
                            type="text"
                            value={line.description}
                            onChange={(e) => updateLine(idx, 'description', e.target.value)}
                            placeholder="e.g. Site Visit & Inspection"
                            className={`w-full px-3 py-2 rounded-xl border bg-white dark:bg-slate-900 text-xs font-medium focus:outline-none transition-colors ${
                              itemErr.description
                                ? 'border-rose-400 focus:border-rose-500'
                                : 'border-slate-200 dark:border-slate-700 focus:border-indigo-500'
                            }`}
                          />
                        </div>

                        <div className="col-span-2">
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={line.quantity}
                            onChange={(e) =>
                              updateLine(idx, 'quantity', e.target.value === '' ? '' : Number(e.target.value))
                            }
                            placeholder="1"
                            className={`w-full px-3 py-2 rounded-xl border bg-white dark:bg-slate-900 text-xs font-semibold text-center focus:outline-none transition-colors ${
                              itemErr.quantity
                                ? 'border-rose-400 focus:border-rose-500'
                                : 'border-slate-200 dark:border-slate-700 focus:border-indigo-500'
                            }`}
                          />
                        </div>

                        <div className="col-span-2">
                          <div className="relative">
                            <span className="absolute left-2.5 top-2 text-slate-400 text-xs font-semibold">
                              {currentBusiness.currency}
                            </span>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={line.rate}
                              onChange={(e) =>
                                updateLine(idx, 'rate', e.target.value === '' ? '' : Number(e.target.value))
                              }
                              placeholder="Enter rate"
                              className={`w-full pl-6 pr-2.5 py-2 rounded-xl border bg-white dark:bg-slate-900 text-xs font-semibold text-right focus:outline-none transition-colors ${
                                itemErr.rate
                                ? 'border-rose-400 focus:border-rose-500'
                                : 'border-slate-200 dark:border-slate-700 focus:border-indigo-500'
                              }`}
                            />
                          </div>
                        </div>

                        {/* Read-Only Amount (Qty × Rate) */}
                        <div className="col-span-2 text-right">
                          <div className="px-3 py-2 rounded-xl bg-slate-100/90 dark:bg-slate-800/90 font-bold text-slate-900 dark:text-slate-100 text-xs truncate border border-slate-200/50 dark:border-slate-700/50">
                            {currentBusiness.currency}{itemAmount.toLocaleString('en-IN')}
                          </div>
                        </div>

                        <div className="col-span-1 text-center">
                          <button
                            type="button"
                            onClick={() => removeLine(idx)}
                            disabled={lineItems.length === 1}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              lineItems.length === 1
                                ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                                : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                            }`}
                            title={lineItems.length === 1 ? 'At least one line item required' : 'Delete item'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Mobile Stacked Layout (Compact, No Overflow) */}
                      <div className="sm:hidden space-y-2">
                        <div>
                          <label className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                            Description *
                          </label>
                          <input
                            type="text"
                            value={line.description}
                            onChange={(e) => updateLine(idx, 'description', e.target.value)}
                            placeholder="e.g. Site Visit & Inspection"
                            className={`w-full px-3 py-2 rounded-xl border bg-white dark:bg-slate-900 text-xs font-medium focus:outline-none ${
                              itemErr.description ? 'border-rose-400' : 'border-slate-200 dark:border-slate-700'
                            }`}
                          />
                        </div>

                        <div className="grid grid-cols-12 gap-2 items-center">
                          <div className="col-span-4">
                            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                              Qty *
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={line.quantity}
                              onChange={(e) =>
                                updateLine(idx, 'quantity', e.target.value === '' ? '' : Number(e.target.value))
                              }
                              placeholder="1"
                              className={`w-full px-2 py-1.5 rounded-lg border bg-white dark:bg-slate-900 text-xs font-semibold text-center ${
                                itemErr.quantity ? 'border-rose-400' : 'border-slate-200 dark:border-slate-700'
                              }`}
                            />
                          </div>

                          <div className="col-span-4">
                            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                              Rate ({currentBusiness.currency}) *
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={line.rate}
                              onChange={(e) =>
                                updateLine(idx, 'rate', e.target.value === '' ? '' : Number(e.target.value))
                              }
                              placeholder="Enter rate"
                              className={`w-full px-2 py-1.5 rounded-lg border bg-white dark:bg-slate-900 text-xs font-semibold text-right ${
                                itemErr.rate ? 'border-rose-400' : 'border-slate-200 dark:border-slate-700'
                              }`}
                            />
                          </div>

                          <div className="col-span-3 text-right">
                            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                              Amount
                            </label>
                            <div className="text-xs font-black text-slate-900 dark:text-slate-100 py-1">
                              {currentBusiness.currency}{itemAmount.toLocaleString('en-IN')}
                            </div>
                          </div>

                          <div className="col-span-1 text-right pt-3">
                            <button
                              type="button"
                              onClick={() => removeLine(idx)}
                              disabled={lineItems.length === 1}
                              className="text-slate-400 hover:text-rose-600 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Row Error Messages */}
                      {(itemErr.description || itemErr.quantity || itemErr.rate) && (
                        <div className="mt-1.5 pt-1.5 border-t border-rose-100 dark:border-rose-950/40 flex flex-wrap gap-x-3 text-[11px] text-rose-500 font-semibold">
                          {itemErr.description && <span>• {itemErr.description}</span>}
                          {itemErr.quantity && <span>• {itemErr.quantity}</span>}
                          {itemErr.rate && <span>• {itemErr.rate}</span>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Configurable GST Settings */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isGstApplicable}
                    onChange={(e) => setIsGstApplicable(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                    Apply GST / Tax on this Quotation
                  </span>
                </label>

                {currentBusiness.gstNumber && (
                  <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    Business GSTIN: <strong>{currentBusiness.gstNumber}</strong>
                  </span>
                )}
              </div>

              {isGstApplicable && (
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-slate-500 text-xs font-semibold">GST Rate:</span>
                  {GST_PRESET_RATES.map((rate) => {
                    const isSelected = !isCustomGst && gstRate === rate;
                    return (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => {
                          setIsCustomGst(false);
                          setGstRate(rate);
                        }}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {rate}% {rate === 0 ? '(Nil/Exempt)' : rate === 18 ? '(Standard)' : ''}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => setIsCustomGst(true)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isCustomGst
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    Custom %
                  </button>

                  {isCustomGst && (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={customGstRate}
                        onChange={(e) => setCustomGstRate(e.target.value)}
                        placeholder="e.g. 12.5"
                        className="w-20 px-2 py-1 rounded-lg border bg-white dark:bg-slate-900 text-xs font-bold text-center"
                      />
                      <span className="text-xs font-bold text-slate-500">%</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <label className="font-semibold text-xs text-slate-700 dark:text-slate-300">
                Quotation Terms & Notes (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Payment 50% advance, validity 7 days from issue date."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
              />
            </div>

            {/* Financial Summary */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/70 rounded-2xl text-xs space-y-1.5 text-right font-semibold border border-slate-200/80 dark:border-slate-700/80">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Subtotal ({lineItems.length} items):</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {currentBusiness.currency}{subtotalValue.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>
                  {isGstApplicable && effectiveGstRate > 0
                    ? `Estimated GST (${effectiveGstRate}%):`
                    : 'GST / Tax:'}
                </span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {isGstApplicable && effectiveGstRate > 0
                    ? `${currentBusiness.currency}${taxValue.toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`
                    : 'Exempt / Nil'}
                </span>
              </div>
              <div className="flex justify-between text-sm font-black text-indigo-600 pt-1.5 border-t border-slate-200 dark:border-slate-700">
                <span>Grand Total:</span>
                <span>
                  {currentBusiness.currency}{grandTotalValue.toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
              >
                Generate Quotation
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Quotation, LineItem, Customer } from '../types';
import { CustomerSearchSelect } from '../components/CustomerSearchSelect';
import {
  FileText,
  Plus,
  Search,
  CheckCircle2,
  X,
  Trash2,
  Printer,
  Share2,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Building2,
  Clock,
  Pencil,
  FileDown,
  RotateCcw,
  Check,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import {
  getIndiaTodayDateString,
  getIndiaDatePlusDays,
  isPastIndiaDate,
  formatIndiaDate,
} from '../utils/dateUtils';
import { sendQuotationWhatsApp, openWhatsApp } from '../utils/whatsappHelper';
import { printQuotationDocument } from '../utils/quotationPdfHelper';

interface AddedItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

const GST_PRESET_RATES = [0, 5, 12, 18, 28];

type CreateModalStep = 'FORM' | 'REVIEW' | 'SUCCESS';

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
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);

  // Modal Control States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createStep, setCreateStep] = useState<CreateModalStep>('FORM');
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // Today in India Standard Time (Asia/Kolkata)
  const todayIndia = useMemo(() => getIndiaTodayDateString(), []);

  // Form Header State
  const [customerId, setCustomerId] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [notes, setNotes] = useState('Payment 50% advance upon quotation approval. Validity as stated.');
  const [isGstApplicable, setIsGstApplicable] = useState(true);
  const [gstRate, setGstRate] = useState<number>(18);
  const [customGstRate, setCustomGstRate] = useState<string>('');
  const [isCustomGst, setIsCustomGst] = useState(false);

  // Single Common Line Item Entry State
  const [entryDescription, setEntryDescription] = useState('');
  const [entryQuantity, setEntryQuantity] = useState<number | ''>(1);
  const [entryRate, setEntryRate] = useState<number | ''>('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Added Items List State
  const [addedItems, setAddedItems] = useState<AddedItem[]>([]);

  // Validation Errors
  const [headerErrors, setHeaderErrors] = useState<{ customerId?: string; validUntil?: string; items?: string }>({});
  const [entryErrors, setEntryErrors] = useState<{ description?: string; quantity?: string; rate?: string }>({});

  // Saved Quotation for Success Step
  const [savedQuotation, setSavedQuotation] = useState<Quotation | null>(null);

  const descriptionInputRef = useRef<HTMLInputElement>(null);

  // Reset & Open Create Quotation Modal
  const handleOpenCreateModal = () => {
    const defaultCustId = customers[0]?.id || '';
    setCustomerId(defaultCustId);

    // Default valid until is strictly Current Date + 7 days in India Standard Time
    setValidUntil(getIndiaDatePlusDays(7));
    setNotes('Payment 50% advance upon quotation approval. Validity as stated.');

    const businessHasGst = Boolean(currentBusiness.gstNumber && currentBusiness.gstNumber.trim().length > 0);
    setIsGstApplicable(businessHasGst);
    setGstRate(18);
    setIsCustomGst(false);
    setCustomGstRate('');

    // Common Item Entry reset
    setEntryDescription('');
    setEntryQuantity(1);
    setEntryRate('');
    setEditingItemId(null);

    // Clear items list
    setAddedItems([]);

    setHeaderErrors({});
    setEntryErrors({});
    setSavedQuotation(null);
    setCreateStep('FORM');
    setShowDiscardConfirm(false);
    setIsCreateOpen(true);
  };

  // Safe Close with Confirmation if user has unsaved items
  const handleAttemptClose = () => {
    if (createStep === 'SUCCESS') {
      setIsCreateOpen(false);
      return;
    }

    const hasData =
      addedItems.length > 0 ||
      entryDescription.trim().length > 0 ||
      (entryRate !== '' && Number(entryRate) > 0);

    if (hasData) {
      setShowDiscardConfirm(true);
    } else {
      setIsCreateOpen(false);
    }
  };

  const handleConfirmDiscard = () => {
    setShowDiscardConfirm(false);
    setIsCreateOpen(false);
    setAddedItems([]);
    setEditingItemId(null);
  };

  // When customer changes, reflect GST status if customer has GST
  const handleCustomerChange = (id: string) => {
    setCustomerId(id);
    if (headerErrors.customerId) {
      setHeaderErrors((prev) => ({ ...prev, customerId: undefined }));
    }

    const selectedCust = customers.find((c) => c.id === id);
    if (selectedCust?.gstNumber && selectedCust.gstNumber.trim().length > 0) {
      setIsGstApplicable(true);
    }
  };

  // Effective GST Rate %
  const effectiveGstRate = useMemo(() => {
    if (!isGstApplicable) return 0;
    if (isCustomGst) {
      const parsed = parseFloat(customGstRate);
      return isNaN(parsed) ? 0 : Math.max(0, parsed);
    }
    return gstRate;
  }, [isGstApplicable, isCustomGst, customGstRate, gstRate]);

  // Current Entry Amount Preview: Qty × Rate
  const currentEntryAmount = useMemo(() => {
    const q = typeof entryQuantity === 'number' ? entryQuantity : Number(entryQuantity) || 0;
    const r = typeof entryRate === 'number' ? entryRate : Number(entryRate) || 0;
    return q * r;
  }, [entryQuantity, entryRate]);

  // Financial Calculations based on Added Items
  const subtotalValue = useMemo(() => {
    return addedItems.reduce((sum, item) => sum + item.amount, 0);
  }, [addedItems]);

  const taxValue = useMemo(() => {
    if (!isGstApplicable || effectiveGstRate <= 0) return 0;
    return (subtotalValue * effectiveGstRate) / 100;
  }, [isGstApplicable, effectiveGstRate, subtotalValue]);

  const grandTotalValue = useMemo(() => {
    return subtotalValue + taxValue;
  }, [subtotalValue, taxValue]);

  // Common Line Item Entry Validation
  const validateCommonEntry = (): boolean => {
    const errs: { description?: string; quantity?: string; rate?: string } = {};
    let valid = true;

    if (!entryDescription.trim()) {
      errs.description = 'Description is required';
      valid = false;
    }

    const qNum = typeof entryQuantity === 'number' ? entryQuantity : Number(entryQuantity);
    if (entryQuantity === '' || isNaN(qNum) || qNum <= 0) {
      errs.quantity = 'Qty must be > 0';
      valid = false;
    }

    const rNum = typeof entryRate === 'number' ? entryRate : Number(entryRate);
    if (entryRate === '' || isNaN(rNum) || rNum < 0) {
      errs.rate = 'Rate is required (₹0 or more)';
      valid = false;
    }

    setEntryErrors(errs);
    return valid;
  };

  // Add Item or Update Existing Item in Added Items List
  const handleAddOrUpdateItem = () => {
    if (!validateCommonEntry()) return;

    const q = typeof entryQuantity === 'number' ? entryQuantity : Number(entryQuantity) || 1;
    const r = typeof entryRate === 'number' ? entryRate : Number(entryRate) || 0;
    const itemAmount = q * r;

    if (editingItemId) {
      // Update existing item
      setAddedItems((prev) =>
        prev.map((it) =>
          it.id === editingItemId
            ? {
                ...it,
                description: entryDescription.trim(),
                quantity: q,
                rate: r,
                amount: itemAmount,
              }
            : it
        )
      );
      setEditingItemId(null);
      showToast('Item updated in quotation list', 'success');
    } else {
      // Add new item to list
      const newItem: AddedItem = {
        id: `item-${Date.now()}-${addedItems.length}`,
        description: entryDescription.trim(),
        quantity: q,
        rate: r,
        amount: itemAmount,
      };
      setAddedItems((prev) => [...prev, newItem]);
    }

    // Reset common entry fields automatically for next item
    setEntryDescription('');
    setEntryQuantity(1);
    setEntryRate('');
    setEntryErrors({});

    // Clear overall items error if present
    if (headerErrors.items) {
      setHeaderErrors((prev) => ({ ...prev, items: undefined }));
    }

    // Return focus to description input for fast multi-item entry
    setTimeout(() => {
      descriptionInputRef.current?.focus();
    }, 50);
  };

  // Cancel edit mode and reset common entry
  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEntryDescription('');
    setEntryQuantity(1);
    setEntryRate('');
    setEntryErrors({});
  };

  // Load item into common entry section for editing
  const handleStartEdit = (item: AddedItem) => {
    setEditingItemId(item.id);
    setEntryDescription(item.description);
    setEntryQuantity(item.quantity);
    setEntryRate(item.rate);
    setEntryErrors({});
    descriptionInputRef.current?.focus();
  };

  // Delete item from added list
  const handleDeleteItem = (id: string) => {
    setAddedItems((prev) => prev.filter((it) => it.id !== id));
    if (editingItemId === id) {
      handleCancelEdit();
    }
  };

  // Validate entire quotation before Review step
  const handleProceedToReview = (e: React.FormEvent) => {
    e.preventDefault();

    const errs: { customerId?: string; validUntil?: string; items?: string } = {};
    let valid = true;

    if (!customerId || !customerId.trim()) {
      errs.customerId = 'Please select a customer for this quotation.';
      valid = false;
    }

    if (!validUntil) {
      errs.validUntil = 'Valid Until Date is required.';
      valid = false;
    } else if (isPastIndiaDate(validUntil)) {
      errs.validUntil = `Valid Until Date cannot be in the past (Today in India is ${formatIndiaDate(todayIndia)}).`;
      valid = false;
    }

    // If no items added yet, but user has filled common entry fields, prompt them
    if (addedItems.length === 0) {
      if (entryDescription.trim() && entryRate !== '') {
        errs.items = 'Please click "Add Item" above to add this item to your quotation.';
      } else {
        errs.items = 'Please add at least one line item to the quotation.';
      }
      valid = false;
    }

    setHeaderErrors(errs);

    if (!valid) {
      showToast('Please complete all required fields and add at least one item.', 'error');
      return;
    }

    // Advance to Review step
    setCreateStep('REVIEW');
  };

  // Confirm and Save to Database (Firebase / AppContext)
  const handleConfirmAndSaveQuotation = () => {
    const formattedItems: LineItem[] = addedItems.map((item, idx) => ({
      id: item.id || `item-${Date.now()}-${idx}`,
      description: item.description,
      quantity: item.quantity,
      rate: item.rate,
      taxPercent: effectiveGstRate,
      amount: item.amount,
    }));

    const created = addQuotation({
      customerId,
      date: getIndiaTodayDateString(), // India Standard Time
      validUntil,
      notes: notes.trim(),
      items: formattedItems,
      subtotal: subtotalValue,
      taxTotal: taxValue,
      discountTotal: 0,
      grandTotal: grandTotalValue,
      status: 'draft',
    });

    if (created) {
      setSavedQuotation(created);
      setCreateStep('SUCCESS');
    }
  };

  // Customer selected for review/success
  const activeCustomer = useMemo(() => {
    const cid = savedQuotation?.customerId || customerId;
    return customers.find((c) => c.id === cid) || null;
  }, [customers, savedQuotation, customerId]);

  // Filtered Quotations for table view
  const filtered = (quotations || []).filter((q) => {
    const cust = (customers || []).find((c) => c.id === q.customerId);
    const s = (search || '').toLowerCase();
    return (
      (q.quotationNumber || '').toLowerCase().includes(s) ||
      (cust?.name || '').toLowerCase().includes(s) ||
      (cust?.mobile || '').includes(s)
    );
  });

  const previewCustomer = useMemo(() => {
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

      {/* Existing Quotation Preview & Share Modal */}
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
                  {previewCustomer?.name || 'Customer'}
                </div>
                {previewCustomer?.companyName && (
                  <div className="text-slate-600 dark:text-slate-400 font-medium">
                    {previewCustomer.companyName}
                  </div>
                )}
                <div className="text-slate-500">{previewCustomer?.mobile}</div>
                {previewCustomer?.address && (
                  <div className="text-slate-500 text-[11px]">{previewCustomer.address}</div>
                )}
                {previewCustomer?.gstNumber && (
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold mt-0.5">
                    GSTIN: {previewCustomer.gstNumber}
                  </div>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="border-b border-slate-200 dark:border-slate-700 text-slate-400 text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-2 font-bold">#</th>
                      <th className="py-2 font-bold">Description</th>
                      <th className="py-2 text-center font-bold">Qty</th>
                      <th className="py-2 text-right font-bold">Rate</th>
                      <th className="py-2 text-right font-bold">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60 dark:divide-slate-700/60">
                    {selectedQuotation.items.map((it, idx) => (
                      <tr key={it.id || idx}>
                        <td className="py-2 text-slate-400">{idx + 1}</td>
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
                onClick={() => sendQuotationWhatsApp(selectedQuotation, previewCustomer || undefined, currentBusiness)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <Share2 className="w-4 h-4" /> Share WhatsApp
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => printQuotationDocument(selectedQuotation, previewCustomer, currentBusiness)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer"
                >
                  <FileDown className="w-4 h-4 text-indigo-600" /> PDF / Print
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

      {/* REDESIGNED CREATE QUOTATION MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          {/* STEP 1: FORM (Single Common Line Item Entry + Added Items List) */}
          {createStep === 'FORM' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto my-auto animate-in fade-in">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600" /> Create New Quotation
                  </h3>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3 text-slate-400" /> Timezone: India Standard Time (Asia/Kolkata)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAttemptClose}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 1. Customer Selection & Valid Until Date (IST) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs bg-slate-50/70 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
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
                  {headerErrors.customerId && (
                    <p className="text-rose-500 text-[11px] font-semibold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {headerErrors.customerId}
                    </p>
                  )}
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Valid Until Date *</span>
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
                      Default: +7 Days (IST)
                    </span>
                  </label>
                  <input
                    type="date"
                    min={todayIndia}
                    value={validUntil}
                    onChange={(e) => {
                      setValidUntil(e.target.value);
                      if (headerErrors.validUntil) {
                        setHeaderErrors((prev) => ({ ...prev, validUntil: undefined }));
                      }
                    }}
                    className={`w-full px-3 py-2 rounded-xl border bg-white dark:bg-slate-900 text-xs font-medium focus:outline-none transition-colors ${
                      headerErrors.validUntil
                        ? 'border-rose-400 focus:border-rose-500'
                        : 'border-slate-200 dark:border-slate-700 focus:border-indigo-500'
                    }`}
                  />
                  {headerErrors.validUntil ? (
                    <p className="text-rose-500 text-[11px] font-semibold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {headerErrors.validUntil}
                    </p>
                  ) : (
                    <p className="text-slate-400 text-[10px] mt-1">
                      Today: {formatIndiaDate(todayIndia)}
                    </p>
                  )}
                </div>
              </div>

              {/* 2. COMMON LINE ITEM ENTRY SECTION (Sirf EK common section) */}
              <div className="p-4 bg-indigo-50/40 dark:bg-indigo-950/20 rounded-2xl border-2 border-indigo-200/80 dark:border-indigo-900/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 dark:text-indigo-200">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span>
                      {editingItemId ? (
                        <span className="text-amber-600 dark:text-amber-400 font-extrabold">
                          Editing Line Item
                        </span>
                      ) : (
                        'Line Item Entry'
                      )}
                    </span>
                  </div>
                  {editingItemId && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="text-[11px] font-semibold text-slate-500 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" /> Cancel Edit
                    </button>
                  )}
                </div>

                {/* Common Entry Inputs Grid */}
                <div className="space-y-2.5">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Description *
                      </label>
                      {services.length > 0 && !editingItemId && (
                        <span className="text-[10px] text-slate-400">
                          Tip: Type custom service or select quick suggestion below
                        </span>
                      )}
                    </div>
                    <input
                      ref={descriptionInputRef}
                      type="text"
                      value={entryDescription}
                      onChange={(e) => {
                        setEntryDescription(e.target.value);
                        if (entryErrors.description) {
                          setEntryErrors((prev) => ({ ...prev, description: undefined }));
                        }
                      }}
                      placeholder="e.g. AC Deep Cleaning & Gas Refill"
                      className={`w-full px-3 py-2.5 rounded-xl border bg-white dark:bg-slate-900 text-xs font-medium focus:outline-none transition-colors ${
                        entryErrors.description
                          ? 'border-rose-400 focus:border-rose-500'
                          : 'border-slate-300 dark:border-slate-700 focus:border-indigo-500'
                      }`}
                    />
                    {entryErrors.description && (
                      <p className="text-rose-500 text-[11px] font-semibold mt-1">
                        {entryErrors.description}
                      </p>
                    )}

                    {/* Quick suggestion chips */}
                    {!editingItemId && services.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <span className="text-[10px] text-slate-400 font-medium">Quick Suggestions:</span>
                        {services.slice(0, 4).map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              setEntryDescription(s.name);
                              if (s.price && s.price > 0) {
                                setEntryRate(s.price);
                              }
                              if (entryErrors.description) {
                                setEntryErrors((prev) => ({ ...prev, description: undefined }));
                              }
                            }}
                            className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-medium text-slate-600 dark:text-slate-300 hover:border-indigo-400 hover:text-indigo-600 transition-colors cursor-pointer truncate max-w-[140px]"
                            title={s.name}
                          >
                            + {s.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Qty, Rate & Auto-calculated Amount */}
                  <div className="grid grid-cols-12 gap-2.5 items-end">
                    {/* Qty */}
                    <div className="col-span-4 sm:col-span-3">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Qty *
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={entryQuantity}
                        onChange={(e) => {
                          setEntryQuantity(e.target.value === '' ? '' : Number(e.target.value));
                          if (entryErrors.quantity) {
                            setEntryErrors((prev) => ({ ...prev, quantity: undefined }));
                          }
                        }}
                        placeholder="1"
                        className={`w-full px-3 py-2 rounded-xl border bg-white dark:bg-slate-900 text-xs font-bold text-center focus:outline-none ${
                          entryErrors.quantity
                            ? 'border-rose-400'
                            : 'border-slate-300 dark:border-slate-700 focus:border-indigo-500'
                        }`}
                      />
                      {entryErrors.quantity && (
                        <p className="text-rose-500 text-[10px] font-semibold mt-0.5">
                          {entryErrors.quantity}
                        </p>
                      )}
                    </div>

                    {/* Rate (₹) */}
                    <div className="col-span-5 sm:col-span-4">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Rate ({currentBusiness.currency}) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-2 text-slate-400 text-xs font-semibold">
                          {currentBusiness.currency}
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={entryRate}
                          onChange={(e) => {
                            setEntryRate(e.target.value === '' ? '' : Number(e.target.value));
                            if (entryErrors.rate) {
                              setEntryErrors((prev) => ({ ...prev, rate: undefined }));
                            }
                          }}
                          placeholder="Enter rate"
                          className={`w-full pl-6 pr-2.5 py-2 rounded-xl border bg-white dark:bg-slate-900 text-xs font-bold text-right focus:outline-none ${
                            entryErrors.rate
                              ? 'border-rose-400'
                              : 'border-slate-300 dark:border-slate-700 focus:border-indigo-500'
                          }`}
                        />
                      </div>
                      {entryErrors.rate && (
                        <p className="text-rose-500 text-[10px] font-semibold mt-0.5">
                          {entryErrors.rate}
                        </p>
                      )}
                    </div>

                    {/* Amount Auto-calculate Preview */}
                    <div className="col-span-3 sm:col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1 truncate">
                        Amount
                      </label>
                      <div className="px-2 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-black text-slate-900 dark:text-slate-100 text-right truncate">
                        {currentBusiness.currency}{currentEntryAmount.toLocaleString('en-IN')}
                      </div>
                    </div>

                    {/* Add Item / Update Button */}
                    <div className="col-span-12 sm:col-span-3">
                      <button
                        type="button"
                        onClick={handleAddOrUpdateItem}
                        className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer ${
                          editingItemId
                            ? 'bg-amber-600 hover:bg-amber-700 text-white'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                      >
                        {editingItemId ? (
                          <>
                            <Check className="w-4 h-4" /> Update Item
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" /> Add Item
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. ADDED ITEMS LIST (Accumulates items 1-by-1) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <span>Added Items</span>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-[10px]">
                      {addedItems.length}
                    </span>
                  </h4>
                  {addedItems.length > 0 && (
                    <span className="text-[11px] text-slate-500 font-medium">
                      Subtotal: <strong className="text-slate-900 dark:text-slate-100">{currentBusiness.currency}{subtotalValue.toLocaleString('en-IN')}</strong>
                    </span>
                  )}
                </div>

                {headerErrors.items && (
                  <p className="text-rose-500 text-[11px] font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {headerErrors.items}
                  </p>
                )}

                {addedItems.length === 0 ? (
                  <div className="p-6 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/40">
                    <p className="text-xs text-slate-400 font-medium">
                      No items added yet. Fill in Description, Qty & Rate above, then click{' '}
                      <strong className="text-indigo-600">Add Item</strong>.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-0.5">
                    {addedItems.map((item, index) => (
                      <div
                        key={item.id}
                        className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                          editingItemId === item.id
                            ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
                            : 'bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/80 hover:border-slate-300'
                        }`}
                      >
                        {/* Item Details */}
                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                          <span className="shrink-0 w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-black flex items-center justify-center">
                            #{index + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                              {item.description}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              Qty: <strong>{item.quantity}</strong> × {currentBusiness.currency}
                              {item.rate.toLocaleString('en-IN')}
                            </p>
                          </div>
                        </div>

                        {/* Amount & Actions */}
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 uppercase block">Amount</span>
                            <span className="font-black text-xs text-slate-900 dark:text-slate-100">
                              {currentBusiness.currency}{item.amount.toLocaleString('en-IN')}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-700 pl-2">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(item)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
                              title="Edit item"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title="Delete item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 4. GST & Notes Configuration */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2.5 text-xs">
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
                      GSTIN: <strong>{currentBusiness.gstNumber}</strong>
                    </span>
                  )}
                </div>

                {isGstApplicable && (
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex flex-wrap items-center gap-1.5">
                    <span className="text-slate-500 text-[11px] font-semibold">Rate:</span>
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
                          className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          {rate}%
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => setIsCustomGst(true)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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
                          placeholder="e.g. 12"
                          className="w-16 px-2 py-1 rounded-lg border bg-white dark:bg-slate-900 text-xs font-bold text-center"
                        />
                        <span className="text-xs font-bold text-slate-500">%</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Quotation terms & notes (optional)"
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* 5. FINANCIAL TOTALS SUMMARY */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/70 rounded-2xl text-xs space-y-1.5 text-right font-semibold border border-slate-200/80 dark:border-slate-700/80">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Subtotal ({addedItems.length} items):</span>
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

              {/* Bottom Actions */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleAttemptClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleProceedToReview}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                >
                  <span>Confirm & Save Quotation</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: REVIEW / CONFIRMATION MODAL */}
          {createStep === 'REVIEW' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto my-auto animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                    Review Quotation Before Saving
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Please verify customer details, items, and total amount
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCreateStep('FORM')}
                  className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Review Card */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3.5 text-xs">
                {/* Customer & Date */}
                <div className="flex justify-between items-start border-b border-slate-200/80 dark:border-slate-700/80 pb-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Customer</span>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      {activeCustomer?.name || 'Customer'}
                    </h4>
                    {activeCustomer?.companyName && (
                      <p className="text-slate-500 font-medium">{activeCustomer.companyName}</p>
                    )}
                    <p className="text-slate-500 font-semibold">{activeCustomer?.mobile}</p>
                    {activeCustomer?.gstNumber && (
                      <p className="text-[10px] text-slate-500 mt-0.5">GSTIN: {activeCustomer.gstNumber}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Quotation Period</span>
                    <p className="text-slate-600 dark:text-slate-400">Date: {formatIndiaDate(todayIndia)}</p>
                    <p className="font-bold text-indigo-600">Valid Until: {formatIndiaDate(validUntil)}</p>
                  </div>
                </div>

                {/* Items Table */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
                    Line Items ({addedItems.length})
                  </span>
                  <table className="w-full text-left border-collapse">
                    <thead className="border-b border-slate-200 dark:border-slate-700 text-slate-400 text-[10px] uppercase">
                      <tr>
                        <th className="py-1.5">#</th>
                        <th className="py-1.5">Description</th>
                        <th className="py-1.5 text-center">Qty</th>
                        <th className="py-1.5 text-right">Rate</th>
                        <th className="py-1.5 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/60 dark:divide-slate-700/60">
                      {addedItems.map((item, idx) => (
                        <tr key={item.id}>
                          <td className="py-1.5 text-slate-400">{idx + 1}</td>
                          <td className="py-1.5 font-medium text-slate-900 dark:text-slate-100">
                            {item.description}
                          </td>
                          <td className="py-1.5 text-center">{item.quantity}</td>
                          <td className="py-1.5 text-right">
                            {currentBusiness.currency}{item.rate.toLocaleString('en-IN')}
                          </td>
                          <td className="py-1.5 text-right font-bold text-slate-900 dark:text-slate-100">
                            {currentBusiness.currency}{item.amount.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals Summary */}
                <div className="border-t border-slate-200 dark:border-slate-700 pt-2.5 flex justify-end">
                  <div className="space-y-1 w-56 text-right">
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Subtotal:</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {currentBusiness.currency}{subtotalValue.toLocaleString('en-IN')}
                      </span>
                    </div>
                    {taxValue > 0 && (
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>GST ({effectiveGstRate}%):</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {currentBusiness.currency}{taxValue.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between font-black text-sm text-indigo-600 pt-1 border-t border-slate-300 dark:border-slate-600">
                      <span>Total Amount:</span>
                      <span>
                        {currentBusiness.currency}{grandTotalValue.toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {notes && (
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-2 text-[11px] text-slate-500">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Notes: </span>
                    {notes}
                  </div>
                )}
              </div>

              {/* Review Actions */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setCreateStep('FORM')}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Edit
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAndSaveQuotation}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" /> Confirm & Save Quotation
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: SUCCESS MODAL (Quotation Saved Successfully! + WhatsApp | PDF | Print) */}
          {createStep === 'SUCCESS' && savedQuotation && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl text-center space-y-5 my-auto animate-in zoom-in-95">
              {/* Success Icon */}
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 mx-auto flex items-center justify-center shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                  Quotation Saved Successfully!
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Unique Quotation Number:{' '}
                  <strong className="text-indigo-600 font-extrabold text-sm">
                    {savedQuotation.quotationNumber}
                  </strong>
                </p>
              </div>

              {/* Quotation Summary Card */}
              <div className="bg-slate-50 dark:bg-slate-800/70 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-700/70 text-left text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {activeCustomer?.name || 'Customer'}
                  </span>
                </div>
                {activeCustomer?.mobile && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Mobile:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {activeCustomer.mobile}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Validity (IST):</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {formatIndiaDate(savedQuotation.validUntil)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Items:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {savedQuotation.items.length} items
                  </span>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-slate-200 dark:border-slate-700 font-black text-sm text-slate-900 dark:text-slate-100">
                  <span>Grand Total:</span>
                  <span className="text-indigo-600">
                    {currentBusiness.currency}{savedQuotation.grandTotal.toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>

              {/* Required 3 Action Buttons: WhatsApp | PDF | Print */}
              <div className="space-y-2.5 pt-1">
                {/* 1. Share on WhatsApp */}
                <button
                  type="button"
                  onClick={() =>
                    sendQuotationWhatsApp(savedQuotation, activeCustomer || undefined, currentBusiness)
                  }
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98 cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share on WhatsApp</span>
                  {activeCustomer?.mobile && (
                    <span className="text-[10px] opacity-80 font-normal">({activeCustomer.mobile})</span>
                  )}
                </button>

                <div className="grid grid-cols-2 gap-2.5">
                  {/* 2. PDF */}
                  <button
                    type="button"
                    onClick={() =>
                      printQuotationDocument(savedQuotation, activeCustomer, currentBusiness)
                    }
                    className="py-2.5 px-3 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <FileDown className="w-4 h-4" /> Download / PDF
                  </button>

                  {/* 3. Print */}
                  <button
                    type="button"
                    onClick={() =>
                      printQuotationDocument(savedQuotation, activeCustomer, currentBusiness)
                    }
                    className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Printer className="w-4 h-4" /> Print Quotation
                  </button>
                </div>
              </div>

              {/* Close / Create Another */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleOpenCreateModal}
                  className="px-3 py-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  + Create Another Quotation
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {/* Unsaved Changes Confirmation Dialog */}
          {showDiscardConfirm && (
            <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-center animate-in zoom-in-95">
                <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 mx-auto flex items-center justify-center">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                    Discard Unsaved Quotation?
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    You have {addedItems.length} item{addedItems.length === 1 ? '' : 's'} added in this quotation. If you leave now, these items will not be saved.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDiscardConfirm(false)}
                    className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
                  >
                    Keep Editing
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDiscard}
                    className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                  >
                    Discard & Exit
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

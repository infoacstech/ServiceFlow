import React, { useState, useEffect } from 'react';
import { FileText, X, CheckCircle2, DollarSign, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Enquiry } from '../../types';

interface CreateQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  enquiry: Enquiry | null;
  onSuccess?: () => void;
}

export const CreateQuoteModal: React.FC<CreateQuoteModalProps> = ({
  isOpen,
  onClose,
  enquiry,
  onSuccess,
}) => {
  const { currentBusiness, convertEnquiryToQuote, showToast } = useApp();

  const [description, setDescription] = useState('');
  const [rate, setRate] = useState<number>(0);
  const [taxPercent, setTaxPercent] = useState<number>(18);
  const [notes, setNotes] = useState('Payment 50% advance upon quote approval. Validity 15 days.');

  useEffect(() => {
    if (enquiry) {
      setDescription(`${enquiry.serviceRequired}${enquiry.description ? ` - ${enquiry.description}` : ''}`);
      setRate(enquiry.estimatedValue || 1500);
    }
  }, [enquiry]);

  if (!isOpen || !enquiry) return null;

  const taxAmount = (rate * taxPercent) / 100;
  const grandTotal = rate + taxAmount;

  const handleGenerateQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || rate <= 0) {
      showToast('Please provide a valid line item description and rate.', 'error');
      return;
    }

    try {
      const quotation = await convertEnquiryToQuote(enquiry.id, {
        items: [
          {
            id: `item-${Date.now()}`,
            description: description.trim(),
            quantity: 1,
            rate: rate,
            taxPercent: taxPercent,
            amount: grandTotal,
          },
        ],
        notes: notes.trim(),
      });

      showToast(`Quotation #${quotation?.quotationNumber || ''} generated and linked to Enquiry!`, 'success');
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Error generating quotation from enquiry:', err);
      showToast('Failed to create quotation.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900 dark:text-slate-100">
                Generate Service Quotation
              </h3>
              <p className="text-xs text-slate-500">
                Creates an official quotation document for {enquiry.customerName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
          <div className="flex justify-between font-bold text-slate-900 dark:text-slate-100">
            <span>Enquiry: {enquiry.enquiryId}</span>
            <span>{enquiry.customerName}</span>
          </div>
          <div className="text-slate-500">Phone: {enquiry.customerPhone}</div>
        </div>

        <form onSubmit={handleGenerateQuote} className="space-y-3.5 text-xs">
          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300">
              Service Item / Scope Description *
            </label>
            <textarea
              rows={2}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. CCTV 4-Channel Setup with HDD and cabling"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                Service Rate / Subtotal (₹) *
              </label>
              <input
                type="number"
                min="1"
                required
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                GST / Tax (%)
              </label>
              <select
                value={taxPercent}
                onChange={(e) => setTaxPercent(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
              >
                <option value={0}>0% (Exempt / No Tax)</option>
                <option value={5}>5% GST</option>
                <option value={12}>12% GST</option>
                <option value={18}>18% GST (Standard Services)</option>
                <option value={28}>28% GST</option>
              </select>
            </div>
          </div>

          {/* Pricing calculations */}
          <div className="p-3.5 rounded-2xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200/60 dark:border-sky-800/60 space-y-1.5">
            <div className="flex justify-between text-slate-600 dark:text-slate-400 text-xs">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">₹{rate.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400 text-xs">
              <span>Tax ({taxPercent}%):</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">₹{taxAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm font-black text-sky-700 dark:text-sky-300 pt-1 border-t border-sky-200/80 dark:border-sky-800/80">
              <span>Estimated Quote Total:</span>
              <span>₹{grandTotal.toLocaleString()}</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300">
              Quotation Terms / Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. 50% Advance, 15 days validity"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-extrabold rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Generate & Link Quote</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

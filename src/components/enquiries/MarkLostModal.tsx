import React, { useState } from 'react';
import { X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Enquiry } from '../../types';

interface MarkLostModalProps {
  isOpen: boolean;
  onClose: () => void;
  enquiry: Enquiry | null;
  onSuccess?: () => void;
}

export const MarkLostModal: React.FC<MarkLostModalProps> = ({
  isOpen,
  onClose,
  enquiry,
  onSuccess,
}) => {
  const { markEnquiryLost, showToast } = useApp();

  const [reason, setReason] = useState('Price too high');
  const [notes, setNotes] = useState('');

  if (!isOpen || !enquiry) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    markEnquiryLost(enquiry.id, reason, notes);
    showToast(`Enquiry ${enquiry.enquiryId} marked as Lost.`, 'info');
    onClose();
    if (onSuccess) onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900 dark:text-slate-100">
                Mark Enquiry as Lost
              </h3>
              <p className="text-xs text-slate-500">
                Record loss reason for business analytics & future follow-up
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

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300">
              Primary Reason for Loss *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-bold"
            >
              <option value="Price too high">Price too high / Budget mismatch</option>
              <option value="Competitor chosen">Chose a competitor</option>
              <option value="Unresponsive / Ghosted">Customer unresponsive / No answer</option>
              <option value="Out of service area">Location outside service coverage</option>
              <option value="Service not offered">Requested service not available</option>
              <option value="Project cancelled / Postponed">Project cancelled / Postponed indefinitely</option>
              <option value="Other">Other / Miscellaneous</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300">
              Additional Details & Feedback (Optional)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Customer decided to delay installation to next quarter..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
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
              className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-extrabold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
            >
              Confirm Mark Lost
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Briefcase, X, CheckCircle2, Calendar, User, Clock, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Enquiry, JobPriority } from '../../types';

interface ConvertToJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  enquiry: Enquiry | null;
  onSuccess?: () => void;
}

export const ConvertToJobModal: React.FC<ConvertToJobModalProps> = ({
  isOpen,
  onClose,
  enquiry,
  onSuccess,
}) => {
  const { services, users, currentBusiness, convertEnquiryToJob, showToast } = useApp();

  const staffMembers = users.filter(
    (u) =>
      u.businessId === currentBusiness?.id &&
      (u.role === 'technician' || u.role === 'manager' || u.role === 'business_owner')
  );

  const [convertData, setConvertData] = useState({
    serviceId: '',
    assignedStaffId: '',
    scheduledDate: new Date().toISOString().split('T')[0],
    scheduledTimeSlot: '09:00 AM - 11:00 AM',
    estimatedAmount: 0,
    priority: 'normal' as JobPriority,
    notes: '',
  });

  useEffect(() => {
    if (enquiry) {
      setConvertData({
        serviceId: enquiry.serviceId || services[0]?.id || '',
        assignedStaffId: enquiry.assignedStaffId || staffMembers[0]?.id || '',
        scheduledDate: enquiry.followUpDate || new Date().toISOString().split('T')[0],
        scheduledTimeSlot: enquiry.followUpTime ? `${enquiry.followUpTime} - Slot` : '09:00 AM - 11:00 AM',
        estimatedAmount: enquiry.estimatedValue || 0,
        priority: (enquiry.priority === 'urgent' ? 'urgent' : enquiry.priority === 'high' ? 'high' : 'normal') as JobPriority,
        notes: enquiry.notes || enquiry.description || '',
      });
    }
  }, [enquiry, services, staffMembers.length]);

  if (!isOpen || !enquiry) return null;

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const createdJob = await convertEnquiryToJob(enquiry.id, {
        serviceId: convertData.serviceId,
        assignedStaffId: convertData.assignedStaffId,
        scheduledDate: convertData.scheduledDate,
        scheduledTimeSlot: convertData.scheduledTimeSlot,
        estimatedAmount: convertData.estimatedAmount,
        priority: convertData.priority,
        notes: convertData.notes,
      });

      showToast(`Enquiry successfully converted to Job #${createdJob?.jobId || 'NEW'}!`, 'success');
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Error converting enquiry to job:', err);
      showToast('Failed to convert enquiry to job.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900 dark:text-slate-100">
                Convert Enquiry to Job
              </h3>
              <p className="text-xs text-slate-500">
                Creates a live field service job & automatically links/creates the customer profile
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

        {/* Customer & Enquiry summary box */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-mono font-bold text-slate-400">{enquiry.enquiryId}</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">{enquiry.customerName}</span>
          </div>
          <div className="text-slate-600 dark:text-slate-400 flex items-center justify-between">
            <span>Phone: {enquiry.customerPhone}</span>
            {enquiry.companyName && <span>Org: {enquiry.companyName}</span>}
          </div>
          <div className="text-slate-700 dark:text-slate-300 font-semibold pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
            Requirement: {enquiry.serviceRequired}
          </div>
          {enquiry.location && (
            <div className="text-slate-500 text-[11px] truncate">Site: {enquiry.location}</div>
          )}
        </div>

        <form onSubmit={handleConvert} className="space-y-3.5 text-xs">
          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300">
              Service Catalog Mapping
            </label>
            <select
              value={convertData.serviceId}
              onChange={(e) => {
                const s = services.find((srv) => srv.id === e.target.value);
                setConvertData({
                  ...convertData,
                  serviceId: e.target.value,
                  estimatedAmount: s?.price || convertData.estimatedAmount,
                });
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
            >
              <option value="">-- Custom / Unlisted Service --</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.price ? `₹${s.price}` : 'No base price'})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                Scheduled Execution Date *
              </label>
              <input
                type="date"
                required
                value={convertData.scheduledDate}
                onChange={(e) => setConvertData({ ...convertData, scheduledDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">Time Slot</label>
              <select
                value={convertData.scheduledTimeSlot}
                onChange={(e) => setConvertData({ ...convertData, scheduledTimeSlot: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
              >
                <option value="09:00 AM - 11:00 AM">09:00 AM - 11:00 AM (Morning)</option>
                <option value="11:00 AM - 01:00 PM">11:00 AM - 01:00 PM (Midday)</option>
                <option value="02:00 PM - 04:00 PM">02:00 PM - 04:00 PM (Afternoon)</option>
                <option value="04:00 PM - 06:00 PM">04:00 PM - 06:00 PM (Evening)</option>
                <option value="Emergency Immediate">Emergency Immediate</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                Assign Field Technician
              </label>
              <select
                value={convertData.assignedStaffId}
                onChange={(e) => setConvertData({ ...convertData, assignedStaffId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-semibold"
              >
                <option value="">-- Unassigned (Dispatch Later) --</option>
                {staffMembers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.role})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                Estimated Job Value (₹)
              </label>
              <input
                type="number"
                min="0"
                value={convertData.estimatedAmount}
                onChange={(e) => setConvertData({ ...convertData, estimatedAmount: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-bold"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300">Priority Level</label>
            <select
              value={convertData.priority}
              onChange={(e) => setConvertData({ ...convertData, priority: e.target.value as JobPriority })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-bold"
            >
              <option value="low">Low</option>
              <option value="normal">Normal / Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent / Critical</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300">
              Work Instructions / Technician Notes
            </label>
            <textarea
              rows={2}
              placeholder="Instructions for the assigned technician or dispatch notes..."
              value={convertData.notes}
              onChange={(e) => setConvertData({ ...convertData, notes: e.target.value })}
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
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Convert & Create Job</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

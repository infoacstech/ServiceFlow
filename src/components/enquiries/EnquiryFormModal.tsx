import React, { useState, useEffect } from 'react';
import { HelpCircle, X, Sparkles, Building, Phone, Mail, MapPin, Tag } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Enquiry, EnquiryPriority, EnquirySource, EnquiryStatus } from '../../types';

interface EnquiryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  enquiryToEdit?: Enquiry | null;
}

export const EnquiryFormModal: React.FC<EnquiryFormModalProps> = ({
  isOpen,
  onClose,
  enquiryToEdit,
}) => {
  const { services, users, currentBusiness, addEnquiry, updateEnquiry, showToast } = useApp();

  const staffMembers = users.filter(
    (u) =>
      u.businessId === currentBusiness?.id &&
      (u.role === 'technician' || u.role === 'manager' || u.role === 'business_owner')
  );

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerPhoneAlt: '',
    customerEmail: '',
    companyName: '',
    serviceRequired: '',
    serviceId: '',
    description: '',
    location: '',
    source: 'phone' as EnquirySource,
    priority: 'normal' as EnquiryPriority,
    assignedStaffId: '',
    followUpDate: new Date().toISOString().split('T')[0],
    followUpTime: '10:00 AM',
    notes: '',
    estimatedValue: 0,
    status: 'new' as EnquiryStatus,
  });

  useEffect(() => {
    if (enquiryToEdit) {
      setFormData({
        customerName: enquiryToEdit.customerName || '',
        customerPhone: enquiryToEdit.customerPhone || '',
        customerPhoneAlt: enquiryToEdit.customerPhoneAlt || '',
        customerEmail: enquiryToEdit.customerEmail || '',
        companyName: enquiryToEdit.companyName || '',
        serviceRequired: enquiryToEdit.serviceRequired || '',
        serviceId: enquiryToEdit.serviceId || '',
        description: enquiryToEdit.description || '',
        location: enquiryToEdit.location || '',
        source: enquiryToEdit.source || 'phone',
        priority: enquiryToEdit.priority || 'normal',
        assignedStaffId: enquiryToEdit.assignedStaffId || '',
        followUpDate: enquiryToEdit.followUpDate || new Date().toISOString().split('T')[0],
        followUpTime: enquiryToEdit.followUpTime || '10:00 AM',
        notes: enquiryToEdit.notes || '',
        estimatedValue: enquiryToEdit.estimatedValue || 0,
        status: enquiryToEdit.status || 'new',
      });
    } else {
      setFormData({
        customerName: '',
        customerPhone: '',
        customerPhoneAlt: '',
        customerEmail: '',
        companyName: '',
        serviceRequired: services[0]?.name || 'General Service',
        serviceId: services[0]?.id || '',
        description: '',
        location: '',
        source: 'phone',
        priority: 'normal',
        assignedStaffId: staffMembers[0]?.id || '',
        followUpDate: new Date().toISOString().split('T')[0],
        followUpTime: '10:00 AM',
        notes: '',
        estimatedValue: services[0]?.price || 0,
        status: 'new',
      });
    }
  }, [enquiryToEdit, services, staffMembers.length]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerName.trim() || !formData.customerPhone.trim()) {
      showToast('Please provide both Customer Name and Phone Number.', 'error');
      return;
    }

    const assignedStaff = staffMembers.find((s) => s.id === formData.assignedStaffId);

    if (enquiryToEdit) {
      updateEnquiry(enquiryToEdit.id, {
        ...formData,
        assignedStaffName: assignedStaff?.name || '',
      });
      showToast(`Enquiry ${enquiryToEdit.enquiryId} updated successfully!`, 'success');
    } else {
      addEnquiry({
        ...formData,
        assignedStaffName: assignedStaff?.name || '',
      });
      showToast('New customer enquiry logged successfully!', 'success');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900 dark:text-slate-100">
                {enquiryToEdit ? `Edit Enquiry: ${enquiryToEdit.enquiryId}` : 'New Customer Enquiry'}
              </h3>
              <p className="text-xs text-slate-500">
                {enquiryToEdit
                  ? 'Update enquiry specifications and follow-up details'
                  : 'Capture prospective intake details & schedule follow-up'}
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

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Customer Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <span>Customer / Contact Name *</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Rahul Sharma or Priya Verma"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <span>Mobile Number *</span>
              </label>
              <input
                type="tel"
                required
                placeholder="e.g. +91 98765 43210"
                value={formData.customerPhone}
                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Alternate Phone & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                Alternate Phone (Optional)
              </label>
              <input
                type="tel"
                placeholder="e.g. Landline / Office number"
                value={formData.customerPhoneAlt}
                onChange={(e) => setFormData({ ...formData, customerPhoneAlt: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                Email Address (Optional)
              </label>
              <input
                type="email"
                placeholder="customer@example.com"
                value={formData.customerEmail}
                onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Company Name & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                Company / Organization (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Apex Tech Solutions"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                Service Address / Site Location
              </label>
              <input
                type="text"
                placeholder="e.g. Block B, Sector 62, Noida"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Service Required & Catalog Select */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                Service Required *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. CCTV Camera Installation & Setup"
                value={formData.serviceRequired}
                onChange={(e) => setFormData({ ...formData, serviceRequired: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                Pick From Service Catalog
              </label>
              <select
                value={formData.serviceId}
                onChange={(e) => {
                  const s = services.find((srv) => srv.id === e.target.value);
                  setFormData({
                    ...formData,
                    serviceId: e.target.value,
                    serviceRequired: s?.name || formData.serviceRequired,
                    estimatedValue: s?.price || formData.estimatedValue,
                  });
                }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Quick Select from Catalog --</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.price ? `₹${s.price}` : 'Custom'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300">
              Customer Requirements & Description
            </label>
            <textarea
              rows={2}
              placeholder="Provide specific notes regarding the customer's problem, premises details, or requirements..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Source, Priority, Handler */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">Source</label>
              <select
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value as EnquirySource })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
              >
                <option value="phone">Phone Call</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="walk_in">Walk-in</option>
                <option value="website">Website</option>
                <option value="referral">Referral</option>
                <option value="existing_customer">Existing Customer</option>
                <option value="google">Google</option>
                <option value="social_media">Social Media</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as EnquiryPriority })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-bold"
              >
                <option value="low">Low</option>
                <option value="normal">Normal / Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">Assigned Handler</label>
              <select
                value={formData.assignedStaffId}
                onChange={(e) => setFormData({ ...formData, assignedStaffId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
              >
                <option value="">Unassigned</option>
                {staffMembers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Follow-up Date & Time + Est Value */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-blue-50/50 dark:bg-blue-950/20 p-3 rounded-2xl border border-blue-100 dark:border-blue-900/40">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">Follow-up Date</label>
              <input
                type="date"
                value={formData.followUpDate}
                onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">Follow-up Time</label>
              <input
                type="text"
                placeholder="10:00 AM"
                value={formData.followUpTime}
                onChange={(e) => setFormData({ ...formData, followUpTime: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">Est. Value (₹)</label>
              <input
                type="number"
                min="0"
                value={formData.estimatedValue}
                onChange={(e) => setFormData({ ...formData, estimatedValue: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-bold"
              />
            </div>
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
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
            >
              {enquiryToEdit ? 'Save Changes' : 'Create Enquiry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

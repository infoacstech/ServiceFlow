import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Customer } from '../types';
import {
  Globe,
  Briefcase,
  Receipt,
  Repeat,
  Plus,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  MessageSquare,
  Wrench,
  ShieldCheck,
  Calendar,
  AlertCircle,
  FileText,
  User,
  ArrowRight,
  Sparkles,
  Check,
  Send,
  Building,
} from 'lucide-react';
import { CustomerSearchSelect } from '../components/CustomerSearchSelect';

interface CustomerPortalViewProps {
  onBackToApp?: () => void;
}

export const CustomerPortalView: React.FC<CustomerPortalViewProps> = ({ onBackToApp }) => {
  const {
    customers,
    jobs,
    invoices,
    contracts,
    services,
    addJob,
    currentBusiness,
    currentUser,
    showToast,
  } = useApp();

  // Read URL parameters for direct link access: ?portal=customer&cid=... or ?customer=...
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlCid = params.get('cid') || params.get('customer') || params.get('customerId');
      if (urlCid) {
        const matched = (customers || []).find((c) => c.id === urlCid);
        if (matched) return matched.id;
      }
    }
    return customers?.[0]?.id || '';
  });

  const [activeTab, setActiveTab] = useState<'requests' | 'contracts' | 'invoices'>('requests');
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [serviceType, setServiceType] = useState('repair');
  const [serviceCategory, setServiceCategory] = useState(services?.[0]?.id || '');
  const [serviceNotes, setServiceNotes] = useState('');
  const [preferredDate, setPreferredDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [preferredTimeSlot, setPreferredTimeSlot] = useState('10:00 AM - 01:00 PM');
  const [contactMobile, setContactMobile] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedJobId, setSubmittedJobId] = useState<string | null>(null);

  const guestCustomer: Customer = {
    id: 'guest',
    name: 'Valued Client',
    mobile: '',
    email: '',
    address: '',
    city: currentBusiness?.city || '',
    state: currentBusiness?.state || '',
    pin: currentBusiness?.pin || '',
    customerType: 'individual',
    businessId: currentBusiness?.id || 'default',
    createdAt: new Date().toISOString(),
  };

  const customer: Customer =
    (customers || []).find((c) => c.id === selectedCustomerId) ||
    customers?.[0] ||
    guestCustomer;

  useEffect(() => {
    if (customer?.mobile) {
      setContactMobile(customer.mobile);
    }
  }, [customer?.id]);

  const customerJobs = (jobs || []).filter((j) => j.customerId === customer?.id);
  const customerInvoices = (invoices || []).filter((inv) => inv.customerId === customer?.id);
  const customerContracts = (contracts || []).filter((c) => c.customerId === customer?.id);

  const activeJobs = customerJobs.filter(
    (j) => j.status !== 'completed' && j.status !== 'verified' && j.status !== 'cancelled'
  );
  const historyJobs = customerJobs.filter(
    (j) => j.status === 'completed' || j.status === 'verified' || j.status === 'closed'
  );

  const currencySymbol = currentBusiness?.currency || '₹';

  const handleBookService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceNotes.trim()) {
      showToast('Please describe the equipment issue or service required.', 'error');
      return;
    }

    setIsSubmitting(true);
    const selectedSvcObj = (services || []).find((s) => s.id === serviceCategory);
    const serviceTitle = selectedSvcObj ? selectedSvcObj.name : 'Service Call';

    const newJob = {
      customerId: customer.id,
      serviceId: serviceCategory || services?.[0]?.id || 'srv-1',
      description: `[Portal Booking] ${serviceTitle}: ${serviceNotes}`,
      priority: serviceType === 'emergency' ? ('urgent' as const) : ('high' as const),
      scheduledDate: preferredDate,
      scheduledTime: preferredTimeSlot.split(' - ')[0] || '10:00 AM',
      location: customer.address || 'Customer site address',
      estimatedAmount: selectedSvcObj?.price || 0,
      status: 'new' as const,
      notes: `Booked via Customer Self-Service Portal. Preferred Slot: ${preferredTimeSlot}. Contact: ${contactMobile || customer.mobile}`,
    };

    const createdJob = addJob(newJob, {
      isCustomerPortalRequest: true,
      customerBusinessId: customer.businessId || currentBusiness.id,
      silentToast: false,
    });
    setIsSubmitting(false);
    setIsBookModalOpen(false);
    setSubmittedJobId(createdJob?.jobId || `REQ-${Date.now().toString().slice(-4)}`);
    showToast('Your service request has been submitted to the dispatch team!', 'success');
    setServiceNotes('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'verified':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
      case 'in_progress':
      case 'started':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border-blue-300 dark:border-blue-800';
      case 'on_the_way':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border-purple-300 dark:border-purple-800';
      case 'assigned':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800';
      default:
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-800';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16 animate-in fade-in">
      {/* Top Navigation & Company Branding */}
      <header className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white flex items-center justify-center font-black text-xl shadow-md shrink-0">
            {currentBusiness.name?.charAt(0) || 'S'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                Customer Self-Service Portal
              </span>
              {currentUser && (
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                  Admin Preview Mode
                </span>
              )}
            </div>
            <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-0.5">
              {currentBusiness.name}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Direct Service Booking, AMC Tracking & Invoices
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {(currentBusiness.mobile || currentBusiness.whatsapp) && (
            <a
              href={`tel:${(currentBusiness.mobile || currentBusiness.whatsapp || '').replace(/[^0-9+]/g, '')}`}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <span>Call Support</span>
            </a>
          )}

          <button
            type="button"
            onClick={() => setIsBookModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Request Service Call</span>
          </button>
        </div>
      </header>

      {/* Admin Switcher Bar if logged in */}
      {currentUser && (
        <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Customer Selected: <strong>{customer.name}</strong> ({customer.mobile || 'No Mobile'})</span>
          </div>

          <div className="w-full sm:w-72">
            <CustomerSearchSelect
              id="admin-portal-customer-switcher"
              customers={customers}
              value={selectedCustomerId}
              onChange={(id) => setSelectedCustomerId(id)}
              placeholder="Switch customer view..."
            />
          </div>
        </div>
      )}

      {/* Success Notification if job recently submitted */}
      {submittedJobId && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100 flex items-start justify-between gap-3 animate-in fade-in">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-extrabold text-sm">Service Request Registered Successfully!</div>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                Your request has been logged with our dispatch center. Our technician will contact you shortly.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSubmittedJobId(null)}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Customer Overview Info Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Client Profile</div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100">
              {customer.name}
            </h2>
            {customer.companyName && (
              <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 mt-0.5">
                <Building className="w-3.5 h-3.5" /> {customer.companyName}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
            {customer.mobile && (
              <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 font-mono font-bold">
                📱 {customer.mobile}
              </span>
            )}
            {customer.city && (
              <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 font-semibold">
                📍 {customer.city}
              </span>
            )}
          </div>
        </div>

        {/* Quick Tabs: Requests, AMC, Invoices */}
        <div className="flex items-center gap-2 overflow-x-auto pt-1">
          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'requests'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" /> Service Calls & Visits ({customerJobs.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('contracts')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'contracts'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            <Repeat className="w-3.5 h-3.5" /> AMC Contracts ({customerContracts.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('invoices')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'invoices'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" /> Invoices & Bills ({customerInvoices.length})
          </button>
        </div>
      </div>

      {/* TAB 1: SERVICE CALLS & VISITS */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" /> Active Service Calls & Repair Visits
            </h3>

            <button
              type="button"
              onClick={() => setIsBookModalOpen(true)}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Book New Visit
            </button>
          </div>

          {customerJobs.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center mx-auto">
                <Wrench className="w-6 h-6" />
              </div>
              <div className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
                No Service Requests Registered
              </div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Need equipment maintenance, installation, or urgent repairs? Click the button below to book a technician visit.
              </p>
              <button
                type="button"
                onClick={() => setIsBookModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Request Service Call
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {customerJobs.map((j) => (
                <div
                  key={j.id}
                  className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-black text-slate-900 dark:text-slate-100">
                        {j.jobId}
                      </span>
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getStatusColor(
                          j.status
                        )}`}
                      >
                        {j.status.replace('_', ' ')}
                      </span>
                      {j.priority === 'urgent' && (
                        <span className="text-[10px] font-black bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
                          Urgent Priority
                        </span>
                      )}
                    </div>

                    <div className="font-bold text-sm text-slate-800 dark:text-slate-200">
                      {j.description}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 flex-wrap pt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                        Scheduled: {j.scheduledDate} ({j.scheduledTime})
                      </span>
                      {j.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {j.location}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right sm:border-l sm:border-slate-100 sm:dark:border-slate-800 sm:pl-4">
                    <div className="text-[11px] text-slate-400">Estimated Cost</div>
                    <div className="text-base font-black text-slate-900 dark:text-slate-100 font-mono">
                      {currencySymbol}
                      {(j.estimatedAmount || 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: AMC CONTRACTS */}
      {activeTab === 'contracts' && (
        <div className="space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Repeat className="w-4 h-4 text-purple-600" /> Active AMC & Maintenance Contracts
          </h3>

          {customerContracts.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 text-xs text-slate-400 space-y-2">
              <Repeat className="w-8 h-8 mx-auto text-slate-300" />
              <div className="font-bold text-slate-700 dark:text-slate-300">No active AMC contract registered</div>
              <p>Contact support to activate an annual maintenance contract with priority service visits.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {customerContracts.map((c) => (
                <div
                  key={c.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-purple-600 dark:text-purple-400">
                        {c.contractNumber}
                      </span>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
                        {c.status}
                      </span>
                    </div>
                    <div className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                      {c.name}
                    </div>
                    <div className="text-xs text-slate-500">
                      Frequency: <span className="font-bold capitalize">{c.visitFrequency}</span> • Renewal: {c.renewalDate}
                    </div>
                  </div>

                  <div className="text-right bg-purple-50 dark:bg-purple-950/40 p-3 rounded-xl border border-purple-100 dark:border-purple-900/50">
                    <div className="text-[10px] uppercase font-bold text-purple-700 dark:text-purple-300">
                      Visits Remaining
                    </div>
                    <div className="text-xl font-black text-purple-900 dark:text-purple-100">
                      {c.visitsRemaining} <span className="text-xs font-normal text-slate-500">/ {c.visitsAllowed}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: INVOICES */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-600" /> Service Invoices & Payment Receipts
          </h3>

          {customerInvoices.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 text-xs text-slate-400">
              No invoices generated yet for this account.
            </div>
          ) : (
            <div className="space-y-3">
              {customerInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-slate-900 dark:text-slate-100">
                        {inv.invoiceNumber}
                      </span>
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          inv.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : inv.status === 'partial'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">Date: {inv.date}</div>
                  </div>

                  <div className="text-right">
                    <div className="text-base font-black text-slate-900 dark:text-slate-100 font-mono">
                      {currencySymbol}
                      {inv.grandTotal.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Paid: {currencySymbol}
                      {(inv.paidAmount || 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Service Request Booking Modal */}
      {isBookModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto">
            <div className="p-5 bg-gradient-to-r from-emerald-700 to-teal-700 text-white flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-[10px] font-black uppercase tracking-wider text-emerald-200">
                  Quick Service Call Request
                </div>
                <h2 className="text-lg font-black text-white">Book Technician Visit</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsBookModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBookService} className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Service Type Selection */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Service Category / Equipment Type
                </label>
                <select
                  value={serviceCategory}
                  onChange={(e) => setServiceCategory(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {(services || []).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.price ? `(${currencySymbol}${s.price})` : ''}
                    </option>
                  ))}
                  <option value="other">Other Repair / Maintenance</option>
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Urgency / Priority
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setServiceType('repair')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border text-center transition-all cursor-pointer ${
                      serviceType === 'repair'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'
                    }`}
                  >
                    🛠️ Standard Visit
                  </button>
                  <button
                    type="button"
                    onClick={() => setServiceType('emergency')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border text-center transition-all cursor-pointer ${
                      serviceType === 'emergency'
                        ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-700 dark:text-rose-300'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'
                    }`}
                  >
                    🚨 Urgent / Breakdown
                  </button>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Describe Problem / Fault *
                </label>
                <textarea
                  required
                  rows={3}
                  value={serviceNotes}
                  onChange={(e) => setServiceNotes(e.target.value)}
                  placeholder="E.g. Camera 3 display blinking, DVR not recording, AC cooling down, wiring repair required..."
                  className="w-full p-3 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Preferred Date & Time Slot */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Preferred Visit Date
                  </label>
                  <input
                    type="date"
                    required
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Preferred Time Slot
                  </label>
                  <select
                    value={preferredTimeSlot}
                    onChange={(e) => setPreferredTimeSlot(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100"
                  >
                    <option value="09:00 AM - 12:00 PM">Morning (09:00 AM - 12:00 PM)</option>
                    <option value="12:00 PM - 03:00 PM">Afternoon (12:00 PM - 03:00 PM)</option>
                    <option value="03:00 PM - 06:00 PM">Evening (03:00 PM - 06:00 PM)</option>
                    <option value="Anytime during business hours">Anytime during business hours</option>
                  </select>
                </div>
              </div>

              {/* Contact Phone */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Contact Mobile Number for Updates
                </label>
                <input
                  type="tel"
                  value={contactMobile}
                  onChange={(e) => setContactMobile(e.target.value)}
                  placeholder="Enter 10-digit mobile number"
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBookModalOpen(false)}
                  className="px-4 py-2 rounded-xl border text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Submitting...' : 'Submit Request'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

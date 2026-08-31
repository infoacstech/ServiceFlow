import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Customer, Job } from '../types';
import { CsvImportModal, CsvColumnMapping } from '../components/CsvImportModal';
import { CustomerServiceSummary } from '../components/CustomerServiceSummary';
import { DeleteCustomerModal } from '../components/DeleteCustomerModal';
import { CustomerPortalShareModal } from '../components/CustomerPortalShareModal';
import {
  Users,
  Plus,
  Search,
  Phone,
  PhoneCall,
  MessageSquare,
  Mail,
  MapPin,
  Building,
  Briefcase,
  FileText,
  Receipt,
  CreditCard,
  Repeat,
  History,
  X,
  Edit2,
  Trash2,
  Check,
  Upload,
  Wrench,
  Archive,
  RotateCcw,
  ShieldAlert,
  AlertTriangle,
  MoreVertical,
  ExternalLink,
  Calendar,
  Clock,
  Eye,
  Lock,
  QrCode,
  Share2,
} from 'lucide-react';

interface CustomersViewProps {
  onNavigate?: (tab: string) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({ onNavigate }) => {
  const {
    customers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    archiveCustomer,
    unarchiveCustomer,
    jobs,
    quotations,
    invoices,
    payments,
    contracts,
    activityLogs,
    currentBusiness,
    currentUser,
    showToast,
    logActivity,
  } = useApp();

  const currencySymbol = currentBusiness?.currency || '₹';

  // Permissions logic
  const isOwnerOrAdmin = currentUser?.role === 'business_owner' || currentUser?.role === 'super_admin';
  const isManager = currentUser?.role === 'manager';
  const canEditCustomers = isOwnerOrAdmin || isManager;
  const isReadOnlyStaff = !canEditCustomers;

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'commercial' | 'individual' | 'archived'>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [activeProfileTab, setActiveProfileTab] = useState<
    'service_summary' | 'overview' | 'jobs' | 'quotations' | 'invoices' | 'payments' | 'contracts' | 'timeline'
  >('service_summary');

  // Add & Edit Modals State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [timelineLimit, setTimelineLimit] = useState<number | 'all'>(10);
  const [openCardMenuId, setOpenCardMenuId] = useState<string | null>(null);
  const [portalCustomerForShare, setPortalCustomerForShare] = useState<Customer | null>(null);

  // Add Customer Form Data
  const [formData, setFormData] = useState<Omit<Customer, 'id' | 'businessId' | 'createdAt'>>({
    name: '',
    companyName: '',
    mobile: '',
    whatsapp: '',
    email: '',
    address: '',
    city: currentBusiness?.city || 'Noida',
    state: currentBusiness?.state || 'Uttar Pradesh',
    pin: currentBusiness?.pin || '201301',
    gstNumber: '',
    notes: '',
    customerType: 'commercial',
  });

  // Edit Customer Form Data
  const [editFormData, setEditFormData] = useState<{
    name: string;
    companyName: string;
    mobile: string;
    whatsapp: string;
    email: string;
    address: string;
    city: string;
    state: string;
    pin: string;
    gstNumber: string;
    notes: string;
    customerType: 'individual' | 'commercial';
  }>({
    name: '',
    companyName: '',
    mobile: '',
    whatsapp: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pin: '',
    gstNumber: '',
    notes: '',
    customerType: 'commercial',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const customerCsvFields: CsvColumnMapping[] = [
    { fieldKey: 'name', fieldLabel: 'Customer / Contact Name', required: true },
    { fieldKey: 'mobile', fieldLabel: 'Mobile Phone Number', required: true },
    { fieldKey: 'companyName', fieldLabel: 'Company / Business Name' },
    { fieldKey: 'email', fieldLabel: 'Email Address' },
    { fieldKey: 'whatsapp', fieldLabel: 'WhatsApp Number' },
    { fieldKey: 'address', fieldLabel: 'Street Address' },
    { fieldKey: 'city', fieldLabel: 'City' },
    { fieldKey: 'state', fieldLabel: 'State' },
    { fieldKey: 'pin', fieldLabel: 'PIN Code' },
    { fieldKey: 'gstNumber', fieldLabel: 'GST Number' },
    { fieldKey: 'customerType', fieldLabel: 'Type (commercial / individual)' },
  ];

  const handleBatchImportCustomers = (importedRows: Partial<Customer>[]) => {
    let successCount = 0;

    importedRows.forEach((row) => {
      if (!row.name || !row.mobile) return;

      const typeVal = row.customerType?.toLowerCase().includes('indiv') ? 'individual' : 'commercial';

      addCustomer({
        name: row.name,
        mobile: row.mobile,
        companyName: row.companyName || '',
        whatsapp: row.whatsapp || row.mobile,
        email: row.email || '',
        address: row.address || '',
        city: row.city || currentBusiness?.city || 'Noida',
        state: row.state || currentBusiness?.state || 'Uttar Pradesh',
        pin: row.pin || currentBusiness?.pin || '201301',
        gstNumber: row.gstNumber || '',
        notes: row.notes || 'Imported via CSV batch upload',
        customerType: typeVal,
      });

      successCount++;
    });

    showToast(`Successfully imported ${successCount} customers!`, 'success');
    logActivity(
      'Bulk Customer CSV Import',
      'customer',
      `batch-${Date.now()}`,
      `Imported ${successCount} customers from CSV spreadsheet`
    );
  };

  const validatePhone = (num: string): boolean => {
    const clean = num.replace(/[^0-9]/g, '');
    return clean.length >= 10;
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    const errors: Record<string, string> = {};
    if (!formData.name.trim()) {
      errors.name = 'Customer name is required';
    }
    if (!formData.mobile.trim()) {
      errors.mobile = 'Mobile phone number is required';
    } else if (!validatePhone(formData.mobile)) {
      errors.mobile = 'Please enter a valid 10-digit mobile number';
    }
    if (!formData.address.trim()) {
      errors.address = 'Service location address is required';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      showToast('Please fix validation errors before saving', 'error');
      return;
    }

    addCustomer(formData);
    setIsAddModalOpen(false);
    setFormData({
      name: '',
      companyName: '',
      mobile: '',
      whatsapp: '',
      email: '',
      address: '',
      city: currentBusiness?.city || 'Noida',
      state: currentBusiness?.state || 'Uttar Pradesh',
      pin: currentBusiness?.pin || '201301',
      gstNumber: '',
      notes: '',
      customerType: 'commercial',
    });
  };

  const openEditCustomerModal = (customer: Customer, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!canEditCustomers) {
      showToast('Permission Denied: Only Business Owners and Managers can edit customer details.', 'error');
      return;
    }

    setEditingCustomer(customer);
    setEditFormData({
      name: customer.name || '',
      companyName: customer.companyName || '',
      mobile: customer.mobile || '',
      whatsapp: customer.whatsapp || '',
      email: customer.email || '',
      address: customer.address || '',
      city: customer.city || currentBusiness?.city || 'Noida',
      state: customer.state || currentBusiness?.state || 'Uttar Pradesh',
      pin: customer.pin || currentBusiness?.pin || '201301',
      gstNumber: customer.gstNumber || '',
      notes: customer.notes || '',
      customerType: customer.customerType || 'commercial',
    });
    setFormErrors({});
    setIsEditModalOpen(true);
    setOpenCardMenuId(null);
  };

  const handleUpdateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;

    if (!canEditCustomers) {
      showToast('Permission Denied: Insufficient privileges to edit customer records.', 'error');
      return;
    }

    setFormErrors({});
    const errors: Record<string, string> = {};

    if (!editFormData.name.trim()) {
      errors.name = 'Customer name is required';
    }
    if (!editFormData.mobile.trim()) {
      errors.mobile = 'Mobile phone number is required';
    } else if (!validatePhone(editFormData.mobile)) {
      errors.mobile = 'Please enter a valid 10-digit mobile number';
    }
    if (!editFormData.address.trim()) {
      errors.address = 'Service location address is required';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      showToast('Please fix the errors in the form before saving.', 'error');
      return;
    }

    const updates: Partial<Customer> = {
      name: editFormData.name.trim(),
      companyName: editFormData.companyName.trim(),
      mobile: editFormData.mobile.trim(),
      whatsapp: editFormData.whatsapp.trim() || editFormData.mobile.trim(),
      email: editFormData.email.trim(),
      address: editFormData.address.trim(),
      city: editFormData.city.trim(),
      state: editFormData.state.trim(),
      pin: editFormData.pin.trim(),
      gstNumber: editFormData.gstNumber.trim().toUpperCase(),
      notes: editFormData.notes.trim(),
      customerType: editFormData.customerType,
    };

    updateCustomer(editingCustomer.id, updates);

    // Update selected customer view if it is currently open
    if (selectedCustomer && selectedCustomer.id === editingCustomer.id) {
      setSelectedCustomer({
        ...selectedCustomer,
        ...updates,
      });
    }

    setIsEditModalOpen(false);
    setEditingCustomer(null);
  };

  // Filtered customer list
  const filtered = (customers || []).filter((c) => {
    if (!c) return false;
    const s = (search || '').toLowerCase();
    const matchesSearch =
      (c.name || '').toLowerCase().includes(s) ||
      (c.mobile || '').includes(search || '') ||
      Boolean(c.companyName && c.companyName.toLowerCase().includes(s)) ||
      Boolean(c.address && c.address.toLowerCase().includes(s)) ||
      Boolean(c.city && c.city.toLowerCase().includes(s));

    if (filterType === 'archived') {
      return matchesSearch && Boolean(c.isArchived);
    }
    const matchesType = filterType === 'all' || c.customerType === filterType;
    return matchesSearch && matchesType && !c.isArchived;
  });

  const archivedCount = (customers || []).filter((c) => c?.isArchived).length;

  return (
    <div className="space-y-3.5 sm:space-y-4 pb-12 animate-in fade-in" onClick={() => setOpenCardMenuId(null)}>
      {/* Compact CRM Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 px-4 py-3.5 sm:px-5 sm:py-4 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100/60 dark:border-indigo-900/40 shadow-2xs">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2 tracking-tight">
              Customer CRM <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full font-mono">({customers.length})</span>
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
              Manage client contacts, direct phone dialer, service sites, and service histories
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setIsCsvModalOpen(true)}
            className="flex-1 sm:flex-none justify-center flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all active:scale-95 cursor-pointer shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Import CSV</span>
          </button>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex-1 sm:flex-none justify-center flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Customer</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-white dark:bg-slate-900 p-2.5 sm:p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, company, location..."
            className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800/80 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 placeholder:text-slate-400 border border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
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

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto scrollbar-none pb-0.5 sm:pb-0">
          {(['all', 'commercial', 'individual'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize whitespace-nowrap transition-all cursor-pointer ${
                filterType === t
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {t}
            </button>
          ))}
          {archivedCount > 0 && (
            <button
              type="button"
              onClick={() => setFilterType('archived')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                filterType === 'archived'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-900/60 hover:bg-amber-100'
              }`}
            >
              <Archive className="w-3.5 h-3.5" /> Archived ({archivedCount})
            </button>
          )}
        </div>
      </div>

      {/* Customers Card Grid */}
      {filtered.length === 0 ? (
        <div className="p-10 sm:p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 text-xs text-slate-400 space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 mx-auto flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">
            No customer records found
          </div>
          <p className="text-slate-500 max-w-sm mx-auto text-xs">
            {search
              ? `No customer records matched "${search}". Try checking your spelling or clear search filters.`
              : filterType !== 'all'
              ? `No ${filterType} customer accounts registered yet.`
              : 'Get started by creating your first customer or importing via CSV.'}
          </p>
          <div className="pt-2 flex items-center justify-center gap-2">
            {search || filterType !== 'all' ? (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setFilterType('all');
                }}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200"
              >
                Clear Filters
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-xs hover:bg-indigo-700"
              >
                + Add Customer
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {filtered.map((customer) => {
            const customerJobs = jobs.filter((j) => j.customerId === customer.id);
            const customerInvoices = invoices.filter((inv) => inv.customerId === customer.id);
            const totalSpent = customerInvoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);

            const fullAddress = [
              customer.address,
              customer.city,
              customer.state,
              customer.pin ? `PIN: ${customer.pin}` : null,
            ]
              .filter(Boolean)
              .join(', ');

            const cleanPhone = (customer.mobile || '').replace(/[^0-9+]/g, '');

            return (
              <div
                key={customer.id}
                onClick={() => setSelectedCustomer(customer)}
                className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border shadow-xs hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group relative ${
                  customer.isArchived
                    ? 'border-amber-200/80 dark:border-amber-900/60 bg-amber-50/20'
                    : 'border-slate-200/80 dark:border-slate-800'
                }`}
              >
                <div>
                  {/* Card Header: Name, Type Badge, & 3-Dot Action Menu */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug break-words">
                        {customer.name}
                      </h3>
                      {customer.companyName && (
                        <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 mt-0.5 break-words">
                          <Building className="w-3 h-3 shrink-0" />
                          <span>{customer.companyName}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          customer.customerType === 'commercial'
                            ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60'
                            : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60'
                        }`}
                      >
                        {customer.customerType}
                      </span>

                      {/* 3-Dot Action Menu Trigger */}
                      <div className="relative">
                        <button
                          type="button"
                          aria-label="Customer actions"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenCardMenuId(openCardMenuId === customer.id ? null : customer.id);
                          }}
                          className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* 3-Dot Dropdown Menu */}
                        {openCardMenuId === customer.id && (
                          <div
                            className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-30 animate-in fade-in zoom-in-95 text-xs font-semibold text-slate-700 dark:text-slate-200"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setOpenCardMenuId(null);
                                setSelectedCustomer(customer);
                              }}
                              className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/60 flex items-center gap-2 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-indigo-500" />
                              <span>View Customer Details</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setOpenCardMenuId(null);
                                setPortalCustomerForShare(customer);
                              }}
                              className="w-full text-left px-3.5 py-2 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/50 flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold cursor-pointer"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                              <span>Share Portal & QR Code</span>
                            </button>

                            {cleanPhone && (
                              <a
                                href={`tel:${cleanPhone}`}
                                onClick={() => setOpenCardMenuId(null)}
                                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/60 flex items-center gap-2 text-emerald-600 dark:text-emerald-400 cursor-pointer"
                              >
                                <PhoneCall className="w-3.5 h-3.5" />
                                <span>Call Customer</span>
                              </a>
                            )}

                            {canEditCustomers ? (
                              <button
                                type="button"
                                onClick={(e) => openEditCustomerModal(customer, e)}
                                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/60 flex items-center gap-2 cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-amber-500" />
                                <span>Edit Customer Details</span>
                              </button>
                            ) : (
                              <div className="px-3.5 py-1.5 text-[10px] text-slate-400 italic flex items-center gap-1">
                                <Lock className="w-3 h-3" /> Edit restricted
                              </div>
                            )}

                            {isOwnerOrAdmin && (
                              <>
                                <div className="my-1 border-t border-slate-100 dark:border-slate-700" />
                                {customer.isArchived ? (
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      setOpenCardMenuId(null);
                                      await unarchiveCustomer(customer.id);
                                    }}
                                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/60 flex items-center gap-2 text-slate-600 dark:text-slate-300 cursor-pointer"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>Restore Customer</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      setOpenCardMenuId(null);
                                      await archiveCustomer(customer.id);
                                    }}
                                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/60 flex items-center gap-2 text-amber-600 dark:text-amber-400 cursor-pointer"
                                  >
                                    <Archive className="w-3.5 h-3.5" />
                                    <span>Archive Customer</span>
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenCardMenuId(null);
                                    setSelectedCustomer(customer);
                                    setIsDeleteModalOpen(true);
                                  }}
                                  className="w-full text-left px-3.5 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 text-rose-600 dark:text-rose-400 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Delete Customer</span>
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contact & Location with Tappable Dialer */}
                  <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 my-3 pt-0.5">
                    {/* Tappable Native Phone Link */}
                    <div className="flex items-center justify-between gap-2 text-slate-700 dark:text-slate-200">
                      {cleanPhone ? (
                        <a
                          href={`tel:${cleanPhone}`}
                          onClick={(e) => e.stopPropagation()}
                          title="Click to dial customer phone number"
                          className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-mono font-bold hover:underline py-0.5 transition-colors group/call"
                        >
                          <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover/call:bg-indigo-600 group-hover/call:text-white transition-colors">
                            <PhoneCall className="w-3 h-3" />
                          </div>
                          <span>{customer.mobile}</span>
                        </a>
                      ) : (
                        <div className="flex items-center gap-2 text-slate-400">
                          <Phone className="w-3.5 h-3.5" />
                          <span>No phone number</span>
                        </div>
                      )}

                      {/* Quick Actions: Call & Portal Link */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {cleanPhone && (
                          <a
                            href={`tel:${cleanPhone}`}
                            onClick={(e) => e.stopPropagation()}
                            title="Call customer immediately"
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold flex items-center gap-1 transition-colors border border-emerald-200/60 dark:border-emerald-800/60"
                          >
                            <Phone className="w-2.5 h-2.5" />
                            <span>Call</span>
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPortalCustomerForShare(customer);
                          }}
                          title="Get Customer Self-Service Portal Link & QR Sticker"
                          className="px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-300 text-[11px] font-bold flex items-center gap-1 transition-colors border border-indigo-200/60 dark:border-indigo-800/60 cursor-pointer"
                        >
                          <QrCode className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                          <span>Link & QR</span>
                        </button>
                      </div>
                    </div>

                    {customer.email && (
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                        <span className="break-all text-[11.5px]">{customer.email}</span>
                      </div>
                    )}

                    <div className="flex items-start gap-2 text-slate-600 dark:text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
                      <span className="text-[11.5px] leading-relaxed break-words line-clamp-2">
                        {fullAddress || 'No address recorded'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Metrics & Details Trigger */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                      <span>Jobs:</span>
                      <span className="font-extrabold text-slate-900 dark:text-slate-100 font-mono">
                        {customerJobs.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>Spent:</span>
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400 font-mono text-xs">
                        {currencySymbol}
                        {totalSpent.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <span className="text-indigo-600 dark:text-indigo-400 font-bold text-[11px] group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                    Details →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* CUSTOMER DETAILS SCREEN / DRAWER */}
      {/* ========================================================================= */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex justify-end animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 max-w-2xl w-full h-full p-4 sm:p-6 overflow-y-auto border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between">
            <div className="space-y-4">
              {/* Profile Header */}
              <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="min-w-0 flex-1 pr-2">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-[10.5px] font-extrabold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 px-2.5 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-900/50">
                      {selectedCustomer.customerType} Client
                    </span>
                    {selectedCustomer.isArchived && (
                      <span className="text-[10px] font-bold uppercase bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <Archive className="w-2.5 h-2.5" /> Archived Customer
                      </span>
                    )}
                  </div>

                  <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 leading-snug break-words">
                    {selectedCustomer.name}
                  </h2>
                  {selectedCustomer.companyName && (
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1 mt-0.5">
                      <Building className="w-3.5 h-3.5 shrink-0" />
                      <span>{selectedCustomer.companyName}</span>
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center cursor-pointer shrink-0 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Prominent Quick Action Bar: Call, WhatsApp, Edit */}
              <div className="flex items-center gap-2 flex-wrap bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
                {selectedCustomer.mobile && (
                  <a
                    href={`tel:${selectedCustomer.mobile.replace(/[^0-9+]/g, '')}`}
                    className="flex-1 sm:flex-none justify-center px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer active:scale-95"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Call Customer</span>
                  </a>
                )}

                {(selectedCustomer.whatsapp || selectedCustomer.mobile) && (
                  <a
                    href={`https://wa.me/${(selectedCustomer.whatsapp || selectedCustomer.mobile).replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-none justify-center px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer active:scale-95"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                    <span>WhatsApp</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => setPortalCustomerForShare(selectedCustomer)}
                  className="flex-1 sm:flex-none justify-center px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer active:scale-95"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Share Portal & QR</span>
                </button>

                {canEditCustomers ? (
                  <button
                    type="button"
                    onClick={() => openEditCustomerModal(selectedCustomer)}
                    className="flex-1 sm:flex-none justify-center px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Customer</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled
                    title="You have read-only staff access to customer data"
                    className="flex-1 sm:flex-none justify-center px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 font-bold text-xs flex items-center gap-1.5 cursor-not-allowed opacity-70"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Edit (Read-Only)</span>
                  </button>
                )}
              </div>

              {/* Profile Navigation Tabs */}
              <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto scrollbar-none">
                {[
                  { id: 'service_summary', label: 'Service & Financial Hub', icon: Wrench },
                  { id: 'overview', label: 'Contact & Location', icon: Building },
                  { id: 'jobs', label: 'Job History', icon: Briefcase },
                  { id: 'quotations', label: 'Quotations', icon: FileText },
                  { id: 'invoices', label: 'Invoices', icon: Receipt },
                  { id: 'payments', label: 'Payments', icon: CreditCard },
                  { id: 'contracts', label: 'AMC Contracts', icon: Repeat },
                  { id: 'timeline', label: 'Audit History', icon: History },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeProfileTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveProfileTab(tab.id as any)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" /> {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Tab Content */}
              {activeProfileTab === 'service_summary' && (
                <CustomerServiceSummary customer={selectedCustomer} />
              )}

              {activeProfileTab === 'overview' && (
                <div className="space-y-3.5 text-xs">
                  {/* Contact Information Box */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-3 border border-slate-200/60 dark:border-slate-800">
                    <div className="font-extrabold text-slate-900 dark:text-slate-100 text-xs flex items-center justify-between">
                      <span>Primary Contact Information</span>
                      {canEditCustomers && (
                        <button
                          type="button"
                          onClick={() => openEditCustomerModal(selectedCustomer)}
                          className="text-indigo-600 hover:underline flex items-center gap-1 font-semibold"
                        >
                          <Edit2 className="w-3 h-3" /> Edit
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-600 dark:text-slate-400">
                      <div>
                        <div className="text-[10.5px] text-slate-400 font-semibold mb-0.5">Mobile Phone</div>
                        <a
                          href={`tel:${selectedCustomer.mobile.replace(/[^0-9+]/g, '')}`}
                          className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline font-mono"
                        >
                          {selectedCustomer.mobile || 'None'}
                        </a>
                      </div>

                      <div>
                        <div className="text-[10.5px] text-slate-400 font-semibold mb-0.5">WhatsApp</div>
                        <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono">
                          {selectedCustomer.whatsapp || selectedCustomer.mobile || 'None'}
                        </span>
                      </div>

                      <div>
                        <div className="text-[10.5px] text-slate-400 font-semibold mb-0.5">Email Address</div>
                        {selectedCustomer.email ? (
                          <a
                            href={`mailto:${selectedCustomer.email}`}
                            className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline break-all"
                          >
                            {selectedCustomer.email}
                          </a>
                        ) : (
                          <span className="text-slate-400">Not recorded</span>
                        )}
                      </div>

                      <div>
                        <div className="text-[10.5px] text-slate-400 font-semibold mb-0.5">GSTIN / Tax ID</div>
                        <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono">
                          {selectedCustomer.gstNumber || 'Unregistered'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Service Site Address */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-2 border border-slate-200/60 dark:border-slate-800">
                    <div className="font-extrabold text-slate-900 dark:text-slate-100 text-xs flex items-center justify-between">
                      <span>Service Site Location</span>
                      {selectedCustomer.address && (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            `${selectedCustomer.address}, ${selectedCustomer.city || ''}`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:underline flex items-center gap-1 font-semibold"
                        >
                          <ExternalLink className="w-3 h-3" /> Open in Maps
                        </a>
                      )}
                    </div>
                    <div className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                      {selectedCustomer.address}
                      {selectedCustomer.city && `, ${selectedCustomer.city}`}
                      {selectedCustomer.state && `, ${selectedCustomer.state}`}
                      {selectedCustomer.pin && ` - PIN ${selectedCustomer.pin}`}
                    </div>
                  </div>

                  {/* Customer Notes */}
                  {selectedCustomer.notes && (
                    <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 text-amber-900 dark:text-amber-200">
                      <div className="font-bold mb-1">Customer Notes / Preferences</div>
                      <div className="whitespace-pre-line leading-relaxed">{selectedCustomer.notes}</div>
                    </div>
                  )}

                  <div className="text-[10.5px] text-slate-400 pt-1">
                    Customer Account Created: {selectedCustomer.createdAt || 'N/A'}
                  </div>
                </div>
              )}

              {/* Job History Tab */}
              {activeProfileTab === 'jobs' && (
                <div className="space-y-2.5">
                  {jobs.filter((j) => j.customerId === selectedCustomer.id).length === 0 ? (
                    <div className="text-center py-10 text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                      No jobs recorded for this customer yet
                    </div>
                  ) : (
                    jobs
                      .filter((j) => j.customerId === selectedCustomer.id)
                      .map((job) => (
                        <div
                          key={job.id}
                          className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                        >
                          <div>
                            <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                              <span className="font-mono text-indigo-600 dark:text-indigo-400">{job.jobId}</span>
                              <span>— {job.description}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-3 mt-1">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> {job.scheduledDate}
                              </span>
                              {job.scheduledTime && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> {job.scheduledTime}
                                </span>
                              )}
                              {job.priority && (
                                <span className="uppercase font-bold text-[9.5px] text-amber-600">
                                  {job.priority} priority
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-start sm:self-auto">
                            <span
                              className={`font-black uppercase text-[10px] px-2.5 py-1 rounded-full ${
                                job.status === 'completed'
                                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                                  : job.status === 'in_progress'
                                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                                  : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                              }`}
                            >
                              {job.status}
                            </span>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              )}

              {/* Quotations Tab */}
              {activeProfileTab === 'quotations' && (
                <div className="space-y-2">
                  {quotations.filter((q) => q.customerId === selectedCustomer.id).length === 0 ? (
                    <div className="text-center py-10 text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                      No quotations recorded for this customer
                    </div>
                  ) : (
                    quotations
                      .filter((q) => q.customerId === selectedCustomer.id)
                      .map((qt) => (
                        <div
                          key={qt.id}
                          className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between"
                        >
                          <div>
                            <div className="font-bold text-slate-900 dark:text-slate-100">{qt.quotationNumber}</div>
                            <div className="text-[10.5px] text-slate-500">Date: {qt.date} • Status: {qt.status}</div>
                          </div>
                          <span className="font-extrabold text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                            {currencySymbol}{qt.grandTotal?.toLocaleString()}
                          </span>
                        </div>
                      ))
                  )}
                </div>
              )}

              {/* Invoices Tab */}
              {activeProfileTab === 'invoices' && (
                <div className="space-y-2">
                  {invoices.filter((i) => i.customerId === selectedCustomer.id).length === 0 ? (
                    <div className="text-center py-10 text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                      No invoices recorded for this customer
                    </div>
                  ) : (
                    invoices
                      .filter((i) => i.customerId === selectedCustomer.id)
                      .map((inv) => (
                        <div
                          key={inv.id}
                          className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between"
                        >
                          <div>
                            <div className="font-bold text-slate-900 dark:text-slate-100">{inv.invoiceNumber}</div>
                            <div className="text-[10.5px] text-slate-500">Due: {inv.dueDate} • Status: {inv.status}</div>
                          </div>
                          <span className="font-extrabold text-indigo-600 dark:text-indigo-400 font-mono text-sm">
                            {currencySymbol}{inv.grandTotal?.toLocaleString()}
                          </span>
                        </div>
                      ))
                  )}
                </div>
              )}

              {/* Payments Tab */}
              {activeProfileTab === 'payments' && (
                <div className="space-y-2">
                  {payments.filter((p) => p.customerId === selectedCustomer.id).length === 0 ? (
                    <div className="text-center py-10 text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                      No payment receipts recorded
                    </div>
                  ) : (
                    payments
                      .filter((p) => p.customerId === selectedCustomer.id)
                      .map((p) => (
                        <div
                          key={p.id}
                          className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between"
                        >
                          <div>
                            <div className="font-bold text-slate-900 dark:text-slate-100">
                              {p.referenceNumber || `Payment #${p.id.slice(-6)}`}
                            </div>
                            <div className="text-[10.5px] text-slate-500">
                              {p.date} • Method: {p.method?.toUpperCase()}
                            </div>
                          </div>
                          <span className="font-extrabold text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                            {currencySymbol}{p.amount?.toLocaleString()}
                          </span>
                        </div>
                      ))
                  )}
                </div>
              )}

              {/* Contracts / AMC Tab */}
              {activeProfileTab === 'contracts' && (
                <div className="space-y-2">
                  {contracts.filter((c) => c.customerId === selectedCustomer.id).length === 0 ? (
                    <div className="text-center py-10 text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                      No active AMC contracts found
                    </div>
                  ) : (
                    contracts
                      .filter((c) => c.customerId === selectedCustomer.id)
                      .map((c) => (
                        <div
                          key={c.id}
                          className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between"
                        >
                          <div>
                            <div className="font-bold text-slate-900 dark:text-slate-100">
                              {c.contractNumber} — {c.name}
                            </div>
                            <div className="text-[10.5px] text-slate-500">
                              Valid: {c.startDate} to {c.endDate} • Visits: {c.visitsUsed}/{c.visitsAllowed}
                            </div>
                          </div>
                          <span className="font-bold text-indigo-600 dark:text-indigo-400 uppercase text-[10px] bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded-full">
                            {c.status}
                          </span>
                        </div>
                      ))
                  )}
                </div>
              )}

              {/* Audit Timeline */}
              {activeProfileTab === 'timeline' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b text-[11px] text-slate-500">
                    <span>
                      Showing{' '}
                      <strong>
                        {timelineLimit === 'all'
                          ? activityLogs.length
                          : Math.min(timelineLimit, activityLogs.length)}
                      </strong>{' '}
                      audit log events
                    </span>
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                      <span className="text-[10px] text-slate-400 pl-1 font-bold">Limit:</span>
                      {([10, 25, 'all'] as const).map((lim) => (
                        <button
                          key={String(lim)}
                          type="button"
                          onClick={() => setTimelineLimit(lim)}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                            timelineLimit === lim
                              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                          }`}
                        >
                          {lim === 'all' ? 'All' : lim}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3 pl-2 border-l-2 border-indigo-500 text-xs">
                    {(timelineLimit === 'all' ? activityLogs : activityLogs.slice(0, timelineLimit)).map((log) => (
                      <div key={log.id} className="pl-3 relative">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{log.action}</div>
                        <div className="text-slate-500 text-[11px]">{log.description}</div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(log.timestamp).toLocaleString()} {log.userName ? `• by ${log.userName}` : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Danger Zone */}
              <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" /> Danger Zone
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {selectedCustomer.isArchived
                        ? 'This customer is currently archived. Historical records are preserved.'
                        : 'Safely delete or archive this customer and protect historical business data.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {selectedCustomer.isArchived && (
                      <button
                        type="button"
                        id="btn-restore-customer"
                        onClick={async () => {
                          await unarchiveCustomer(selectedCustomer.id);
                          setSelectedCustomer((prev) => (prev ? { ...prev, isArchived: false } : null));
                        }}
                        className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Restore Customer
                      </button>
                    )}
                    {isOwnerOrAdmin ? (
                      <button
                        type="button"
                        id="btn-open-delete-customer"
                        onClick={() => setIsDeleteModalOpen(true)}
                        className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete Customer
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">Deletion restricted to Business Owner</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
              <button
                type="button"
                id="btn-close-customer-drawer"
                onClick={() => setSelectedCustomer(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-xs shadow-sm transition-all cursor-pointer"
              >
                Close Customer Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT CUSTOMER MODAL */}
      {/* ========================================================================= */}
      {isEditModalOpen && editingCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleUpdateCustomer}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                    Edit Customer Details
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Updates will sync to all existing jobs and records without duplicate creation
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2">
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                  Customer Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  placeholder="e.g. Rajesh Sharma"
                  className={`w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                    formErrors.name ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
                {formErrors.name && (
                  <p className="text-[11px] text-rose-500 font-medium mt-1">{formErrors.name}</p>
                )}
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                  Company / Organization Name
                </label>
                <input
                  type="text"
                  value={editFormData.companyName}
                  onChange={(e) => setEditFormData({ ...editFormData, companyName: e.target.value })}
                  placeholder="e.g. Apex Tech Ltd."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                  Customer Type
                </label>
                <select
                  value={editFormData.customerType}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, customerType: e.target.value as any })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="commercial">Commercial</option>
                  <option value="individual">Individual</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                  Primary Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  value={editFormData.mobile}
                  onChange={(e) => setEditFormData({ ...editFormData, mobile: e.target.value })}
                  placeholder="+91 98765 43210"
                  className={`w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                    formErrors.mobile ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
                {formErrors.mobile && (
                  <p className="text-[11px] text-rose-500 font-medium mt-1">{formErrors.mobile}</p>
                )}
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                  WhatsApp Number
                </label>
                <input
                  type="tel"
                  value={editFormData.whatsapp}
                  onChange={(e) => setEditFormData({ ...editFormData, whatsapp: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="col-span-2">
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                  Email Address
                </label>
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  placeholder="rajesh@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="col-span-2">
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                  Service Site Address *
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.address}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                  placeholder="Plot 45, Sector 62, Electronic City"
                  className={`w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                    formErrors.address ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
                {formErrors.address && (
                  <p className="text-[11px] text-rose-500 font-medium mt-1">{formErrors.address}</p>
                )}
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                  City
                </label>
                <input
                  type="text"
                  value={editFormData.city}
                  onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                  State
                </label>
                <input
                  type="text"
                  value={editFormData.state}
                  onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                  PIN Code
                </label>
                <input
                  type="text"
                  value={editFormData.pin}
                  onChange={(e) => setEditFormData({ ...editFormData, pin: e.target.value })}
                  placeholder="201301"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                  GST Number (Optional)
                </label>
                <input
                  type="text"
                  value={editFormData.gstNumber}
                  onChange={(e) => setEditFormData({ ...editFormData, gstNumber: e.target.value })}
                  placeholder="09AAAAA0000A1Z5"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 uppercase"
                />
              </div>

              <div className="col-span-2">
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                  Customer Notes / Special Instructions
                </label>
                <textarea
                  rows={2}
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  placeholder="Gate code, landmark, key contact instructions..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer active:scale-95"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD CUSTOMER MODAL */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveCustomer}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                Add New Customer
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2">
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                  Customer Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Anil Sharma"
                  className={`w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 ${
                    formErrors.name ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
                {formErrors.name && (
                  <p className="text-[11px] text-rose-500 font-medium mt-1">{formErrors.name}</p>
                )}
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                  Company / Organization Name
                </label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="e.g. Sharma Trading Co."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                  Customer Type
                </label>
                <select
                  value={formData.customerType}
                  onChange={(e) => setFormData({ ...formData, customerType: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value="commercial">Commercial</option>
                  <option value="individual">Individual</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                  Mobile Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  placeholder="+91 98765 43210"
                  className={`w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 ${
                    formErrors.mobile ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
                {formErrors.mobile && (
                  <p className="text-[11px] text-rose-500 font-medium mt-1">{formErrors.mobile}</p>
                )}
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                  WhatsApp Number
                </label>
                <input
                  type="tel"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="col-span-2">
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="anil@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="col-span-2">
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                  Service Site Address *
                </label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Plot 12, Industrial Area Sector 62"
                  className={`w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 ${
                    formErrors.address ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
                {formErrors.address && (
                  <p className="text-[11px] text-rose-500 font-medium mt-1">{formErrors.address}</p>
                )}
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                  City
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                  State
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                  PIN Code
                </label>
                <input
                  type="text"
                  value={formData.pin}
                  onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                  placeholder="201301"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                  GST Number (Optional)
                </label>
                <input
                  type="text"
                  value={formData.gstNumber}
                  onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                  placeholder="09AAAAA0000A1Z5"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 uppercase"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer active:scale-95"
              >
                Save Customer
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CSV Import Modal */}
      <CsvImportModal<Customer>
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        title="Import Customers from CSV"
        description="Upload your client directory to bulk import contacts into Serviflow CRM"
        fields={customerCsvFields}
        sampleFileName="serviflow_customers_sample.csv"
        sampleHeaders={[
          'Customer Name',
          'Mobile Number',
          'Company Name',
          'Email Address',
          'WhatsApp',
          'Street Address',
          'City',
          'State',
          'PIN Code',
          'GST Number',
          'Customer Type',
        ]}
        sampleDataRow={[
          'Rajesh Kumar',
          '9876543210',
          'Kumar Enterprises',
          'rajesh@kumar.com',
          '9876543210',
          'Plot 45, Sector 62',
          'Noida',
          'Uttar Pradesh',
          '201301',
          '09ABCDE1234F1Z5',
          'commercial',
        ]}
        onImport={handleBatchImportCustomers}
      />

      {/* Delete Customer Confirmation Modal */}
      <DeleteCustomerModal
        customer={selectedCustomer}
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onCustomerDeleted={() => {
          setIsDeleteModalOpen(false);
          setSelectedCustomer(null);
        }}
      />
      {/* Customer Self-Service Portal Share & QR Sticker Modal */}
      {portalCustomerForShare && (
        <CustomerPortalShareModal
          isOpen={!!portalCustomerForShare}
          onClose={() => setPortalCustomerForShare(null)}
          customer={portalCustomerForShare}
          businessName={currentBusiness?.name || 'ServiFlow'}
        />
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Customer } from '../types';
import { CsvImportModal, CsvColumnMapping } from '../components/CsvImportModal';
import { CustomerServiceSummary } from '../components/CustomerServiceSummary';
import { DeleteCustomerModal } from '../components/DeleteCustomerModal';
import {
  Users,
  Plus,
  Search,
  Phone,
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
} from 'lucide-react';

export const CustomersView: React.FC = () => {
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

  const isOwnerOrAdmin = currentUser?.role === 'business_owner' || currentUser?.role === 'super_admin';

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'commercial' | 'individual' | 'archived'>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [activeProfileTab, setActiveProfileTab] = useState<
    'service_summary' | 'overview' | 'jobs' | 'quotations' | 'invoices' | 'payments' | 'contracts' | 'timeline'
  >('service_summary');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [timelineLimit, setTimelineLimit] = useState<number | 'all'>(10);

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

  const filtered = (customers || []).filter((c) => {
    if (!c) return false;
    const s = (search || '').toLowerCase();
    const matchesSearch =
      (c.name || '').toLowerCase().includes(s) ||
      (c.mobile || '').includes(search || '') ||
      Boolean(c.companyName && c.companyName.toLowerCase().includes(s));
    
    if (filterType === 'archived') {
      return matchesSearch && Boolean(c.isArchived);
    }
    const matchesType = filterType === 'all' || c.customerType === filterType;
    return matchesSearch && matchesType && !c.isArchived;
  });

  const archivedCount = (customers || []).filter((c) => c?.isArchived).length;

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
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

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" /> Customer CRM ({customers.length})
          </h1>
          <p className="text-xs text-slate-500">Manage client contact details, address records, jobs history, & contracts</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCsvModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs transition-all active:scale-95"
          >
            <Upload className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Import CSV
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add New Customer
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, company..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {(['all', 'commercial', 'individual'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-all cursor-pointer ${
                filterType === t
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {t}
            </button>
          ))}
          {archivedCount > 0 && (
            <button
              onClick={() => setFilterType('archived')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
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

      {/* Customers Table / Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((customer) => {
          const customerJobs = jobs.filter((j) => j.customerId === customer.id);
          const customerInvoices = invoices.filter((inv) => inv.customerId === customer.id);
          const totalSpent = customerInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0);

          return (
            <div
              key={customer.id}
              onClick={() => setSelectedCustomer(customer)}
              className={`p-5 rounded-3xl bg-white dark:bg-slate-900 border shadow-xs hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group ${
                customer.isArchived
                  ? 'border-amber-200/80 dark:border-amber-900/60 bg-amber-50/20'
                  : 'border-slate-200/80 dark:border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 transition-colors">
                      {customer.name}
                    </h3>
                    {customer.companyName && (
                      <div className="text-xs font-semibold text-indigo-600 flex items-center gap-1">
                        <Building className="w-3 h-3" /> {customer.companyName}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {customer.isArchived && (
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Archive className="w-2.5 h-2.5" /> Archived
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                        customer.customerType === 'commercial'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {customer.customerType}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 my-3">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{customer.mobile}</span>
                  </div>
                  {customer.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{customer.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{customer.address}, {customer.city}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 font-medium">
                <div>
                  <span>Jobs: </span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{customerJobs.length}</span>
                </div>
                <div>
                  <span>Spent: </span>
                  <span className="font-bold text-emerald-600">{(currentBusiness?.currency || '₹')}{totalSpent}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Customer Profile Deep Detail Drawer / Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex justify-end animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 max-w-2xl w-full h-full p-6 overflow-y-auto border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between">
            <div>
              {/* Profile Header */}
              <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-full">
                      {selectedCustomer.customerType} Client
                    </span>
                    {selectedCustomer.isArchived && (
                      <span className="text-[10px] font-bold uppercase bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 px-2.5 py-1 rounded-full flex items-center gap-1">
                        <Archive className="w-2.5 h-2.5" /> Archived Customer
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">{selectedCustomer.name}</h2>
                  {selectedCustomer.companyName && (
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">{selectedCustomer.companyName}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Profile Navigation Tabs */}
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 mb-4 overflow-x-auto">
                {[
                  { id: 'service_summary', label: 'Service & Invoices Hub', icon: Wrench },
                  { id: 'overview', label: 'Overview', icon: Building },
                  { id: 'jobs', label: 'Jobs', icon: Briefcase },
                  { id: 'quotations', label: 'Quotes', icon: FileText },
                  { id: 'invoices', label: 'Invoices', icon: Receipt },
                  { id: 'payments', label: 'Payments', icon: CreditCard },
                  { id: 'contracts', label: 'AMC/Contracts', icon: Repeat },
                  { id: 'timeline', label: 'Timeline', icon: History },
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
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
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
                <div className="space-y-4 text-xs">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-2">
                    <div className="font-bold text-slate-900 dark:text-slate-100">Contact Information</div>
                    <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-400">
                      <div>Mobile: <span className="font-semibold text-slate-900 dark:text-slate-100">{selectedCustomer.mobile}</span></div>
                      <div>WhatsApp: <span className="font-semibold text-slate-900 dark:text-slate-100">{selectedCustomer.whatsapp || selectedCustomer.mobile}</span></div>
                      <div>Email: <span className="font-semibold text-slate-900 dark:text-slate-100">{selectedCustomer.email || 'N/A'}</span></div>
                      <div>GSTIN: <span className="font-semibold text-slate-900 dark:text-slate-100">{selectedCustomer.gstNumber || 'Unregistered'}</span></div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
                    <div className="font-bold text-slate-900 dark:text-slate-100 mb-1">Service Site Address</div>
                    <div className="text-slate-600 dark:text-slate-400">
                      {selectedCustomer.address}, {selectedCustomer.city}, {selectedCustomer.state} - {selectedCustomer.pin}
                    </div>
                  </div>

                  {selectedCustomer.notes && (
                    <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 text-amber-900 dark:text-amber-200">
                      <div className="font-bold mb-1">Customer Notes</div>
                      <div>{selectedCustomer.notes}</div>
                    </div>
                  )}
                </div>
              )}

              {activeProfileTab === 'jobs' && (
                <div className="space-y-2">
                  {jobs.filter((j) => j.customerId === selectedCustomer.id).length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400">No jobs recorded for this customer</div>
                  ) : (
                    jobs
                      .filter((j) => j.customerId === selectedCustomer.id)
                      .map((job) => (
                        <div key={job.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between">
                          <div>
                            <div className="font-bold text-slate-900 dark:text-slate-100">{job.jobId} - {job.description}</div>
                            <div className="text-[10px] text-slate-500">Scheduled: {job.scheduledDate}</div>
                          </div>
                          <span className="font-bold text-indigo-600 dark:text-indigo-400 uppercase text-[10px] bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded">{job.status}</span>
                        </div>
                      ))
                  )}
                </div>
              )}

              {activeProfileTab === 'quotations' && (
                <div className="space-y-2">
                  {quotations.filter((q) => q.customerId === selectedCustomer.id).length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400">No quotations recorded</div>
                  ) : (
                    quotations.filter((q) => q.customerId === selectedCustomer.id).map((qt) => (
                      <div key={qt.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-100">{qt.quotationNumber}</div>
                          <div className="text-[10px] text-slate-500">{qt.date}</div>
                        </div>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{currencySymbol}{qt.grandTotal}</span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeProfileTab === 'invoices' && (
                <div className="space-y-2">
                  {invoices.filter((i) => i.customerId === selectedCustomer.id).length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400">No invoices recorded</div>
                  ) : (
                    invoices.filter((i) => i.customerId === selectedCustomer.id).map((inv) => (
                      <div key={inv.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-100">{inv.invoiceNumber}</div>
                          <div className="text-[10px] text-slate-500">Due: {inv.dueDate}</div>
                        </div>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">{currencySymbol}{inv.grandTotal} ({inv.status})</span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeProfileTab === 'payments' && (
                <div className="space-y-2">
                  {payments.filter((p) => p.customerId === selectedCustomer.id).length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400">No payment receipts recorded</div>
                  ) : (
                    payments.filter((p) => p.customerId === selectedCustomer.id).map((p) => (
                      <div key={p.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-100">{p.referenceNumber || `Payment #${p.id.slice(-6)}`}</div>
                          <div className="text-[10px] text-slate-500">{p.date} • {p.method.toUpperCase()}</div>
                        </div>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{currencySymbol}{p.amount}</span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeProfileTab === 'contracts' && (
                <div className="space-y-2">
                  {contracts.filter((c) => c.customerId === selectedCustomer.id).length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400">No active contracts or AMCs</div>
                  ) : (
                    contracts.filter((c) => c.customerId === selectedCustomer.id).map((c) => (
                      <div key={c.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-100">{c.contractNumber} - {c.name}</div>
                          <div className="text-[10px] text-slate-500">{c.startDate} to {c.endDate}</div>
                        </div>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400 uppercase text-[10px] bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded">{c.status}</span>
                      </div>
                    ))
                  )}
                </div>
              )}

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
                      of {activityLogs.length} events
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
                        <div className="text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleString()}</div>
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
                          setSelectedCustomer((prev) => prev ? { ...prev, isArchived: false } : null);
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
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveCustomer}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Add New Customer</h3>
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2">
                <label className="font-semibold block mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Anil Sharma"
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Company / RWA Name</label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="e.g. Sharma Trading Co."
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Customer Type</label>
                <select
                  value={formData.customerType}
                  onChange={(e) => setFormData({ ...formData, customerType: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50"
                >
                  <option value="commercial">Commercial</option>
                  <option value="individual">Individual</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Mobile Number *</label>
                <input
                  type="text"
                  required
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">WhatsApp Number</label>
                <input
                  type="text"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50"
                />
              </div>

              <div className="col-span-2">
                <label className="font-semibold block mb-1">Service Address *</label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Plot 12, Industrial Area Sector 62"
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">GST Number (Optional)</label>
                <input
                  type="text"
                  value={formData.gstNumber}
                  onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                  placeholder="09AAAAA0000A1Z5"
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 uppercase"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 rounded-xl border text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs shadow-md"
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
    </div>
  );
};

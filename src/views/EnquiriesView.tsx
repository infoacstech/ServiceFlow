import React, { useState, useMemo } from 'react';
import {
  HelpCircle,
  Plus,
  Search,
  Filter,
  Phone,
  Mail,
  Calendar,
  Clock,
  User,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Building,
  Tag,
  Briefcase,
  X,
  Edit2,
  Trash2,
  ChevronRight,
  Flame,
  Clock3,
  CalendarClock,
  Sparkles,
  ExternalLink,
  History,
  PhoneCall,
  MessageCircle,
  Globe,
  MapPin,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Enquiry, EnquiryStatus, EnquiryPriority, EnquirySource, Job } from '../types';

interface EnquiriesViewProps {
  onNavigate?: (tab: string) => void;
}

export const EnquiriesView: React.FC<EnquiriesViewProps> = ({ onNavigate }) => {
  const {
    enquiries,
    customers,
    users,
    services,
    currentBusiness,
    currentUser,
    addEnquiry,
    updateEnquiry,
    deleteEnquiry,
    convertEnquiryToJob,
    addEnquiryActivity,
  } = useApp();

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');

  // Form states for new/edit enquiry
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    companyName: '',
    serviceRequired: '',
    serviceId: '',
    description: '',
    location: '',
    source: 'website' as EnquirySource,
    priority: 'medium' as EnquiryPriority,
    assignedStaffId: '',
    followUpDate: new Date().toISOString().split('T')[0],
    followUpTime: '10:00 AM',
    notes: '',
    estimatedValue: 0,
    status: 'new' as EnquiryStatus,
  });

  // Convert to Job form
  const [convertJobData, setConvertJobData] = useState({
    scheduledDate: new Date().toISOString().split('T')[0],
    scheduledTimeSlot: '09:00 AM - 11:00 AM',
    assignedStaffId: '',
    estimatedAmount: 0,
    serviceId: '',
    priority: 'medium' as any,
    notes: '',
  });

  const staffMembers = useMemo(() => {
    return users.filter(
      (u) => u.businessId === currentBusiness.id && (u.role === 'technician' || u.role === 'manager' || u.role === 'business_owner')
    );
  }, [users, currentBusiness.id]);

  // Filtered list
  const filteredEnquiries = useMemo(() => {
    return enquiries.filter((enq) => {
      const matchesSearch =
        enq.enquiryId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        enq.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (enq.customerPhone && enq.customerPhone.includes(searchQuery)) ||
        enq.serviceRequired.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (enq.companyName && enq.companyName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || enq.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || enq.priority === priorityFilter;
      const matchesSource = sourceFilter === 'all' || enq.source === sourceFilter;

      return matchesSearch && matchesStatus && matchesPriority && matchesSource;
    });
  }, [enquiries, searchQuery, statusFilter, priorityFilter, sourceFilter]);

  // Operational KPI counts
  const newCount = enquiries.filter((e) => e.status === 'new').length;
  const followUpTodayCount = enquiries.filter((e) => {
    const today = new Date().toISOString().split('T')[0];
    return (e.status === 'follow_up' || e.status === 'new' || e.status === 'contacted') && e.followUpDate === today;
  }).length;
  const qualifiedCount = enquiries.filter((e) => e.status === 'qualified').length;
  const convertedCount = enquiries.filter((e) => e.status === 'converted').length;

  const handleOpenAddModal = () => {
    setFormData({
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      companyName: '',
      serviceRequired: services[0]?.name || 'General Maintenance',
      serviceId: services[0]?.id || '',
      description: '',
      location: '',
      source: 'phone',
      priority: 'medium',
      assignedStaffId: staffMembers[0]?.id || '',
      followUpDate: new Date().toISOString().split('T')[0],
      followUpTime: '10:00 AM',
      notes: '',
      estimatedValue: services[0]?.price || 0,
      status: 'new',
    });
    setIsAddModalOpen(true);
  };

  const handleSaveEnquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerName || !formData.customerPhone) {
      alert('Please provide customer name and contact phone.');
      return;
    }

    const assignedStaff = staffMembers.find((s) => s.id === formData.assignedStaffId);

    if (selectedEnquiry && !isAddModalOpen) {
      // Update existing
      updateEnquiry(selectedEnquiry.id, {
        ...formData,
        assignedStaffName: assignedStaff?.name || '',
      });
      setIsDetailDrawerOpen(false);
    } else {
      // Create new
      addEnquiry({
        ...formData,
        assignedStaffName: assignedStaff?.name || '',
      });
      setIsAddModalOpen(false);
    }
  };

  const handleStatusChange = (enquiryId: string, newStatus: EnquiryStatus) => {
    updateEnquiry(enquiryId, { status: newStatus });
    addEnquiryActivity(enquiryId, 'Status Changed', `Status updated to ${newStatus.toUpperCase()}`);
    if (selectedEnquiry && selectedEnquiry.id === enquiryId) {
      setSelectedEnquiry({ ...selectedEnquiry, status: newStatus });
    }
  };

  const handleOpenConvertModal = (enquiry: Enquiry) => {
    setSelectedEnquiry(enquiry);
    setConvertJobData({
      scheduledDate: enquiry.followUpDate || new Date().toISOString().split('T')[0],
      scheduledTimeSlot: enquiry.followUpTime || '09:00 AM - 11:00 AM',
      assignedStaffId: enquiry.assignedStaffId || staffMembers[0]?.id || '',
      estimatedAmount: enquiry.estimatedValue || 0,
      serviceId: enquiry.serviceId || services[0]?.id || '',
      priority: enquiry.priority || 'medium',
      notes: enquiry.notes || '',
    });
    setIsConvertModalOpen(true);
  };

  const handleConfirmConvert = async () => {
    if (!selectedEnquiry) return;
    try {
      const createdJob = await convertEnquiryToJob(selectedEnquiry.id, {
        serviceId: convertJobData.serviceId,
        assignedStaffId: convertJobData.assignedStaffId,
        scheduledDate: convertJobData.scheduledDate,
        scheduledTimeSlot: convertJobData.scheduledTimeSlot,
        estimatedAmount: convertJobData.estimatedAmount,
        priority: convertJobData.priority,
        notes: convertJobData.notes,
      });
      setIsConvertModalOpen(false);
      setIsDetailDrawerOpen(false);
      if (onNavigate && createdJob) {
        onNavigate('jobs');
      }
    } catch (err: any) {
      console.error('Error converting enquiry to job:', err);
    }
  };

  const handleAddNote = () => {
    if (!selectedEnquiry || !newNoteText.trim()) return;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const formattedNote = `${selectedEnquiry.notes ? selectedEnquiry.notes + '\n' : ''}[${new Date().toISOString().split('T')[0]} ${timestamp}] ${currentUser?.name || 'Staff'}: ${newNoteText.trim()}`;
    
    updateEnquiry(selectedEnquiry.id, { notes: formattedNote });
    addEnquiryActivity(selectedEnquiry.id, 'Note Added', newNoteText.trim());
    setSelectedEnquiry({ ...selectedEnquiry, notes: formattedNote });
    setNewNoteText('');
  };

  const getStatusBadge = (status: EnquiryStatus) => {
    switch (status) {
      case 'new':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800">New</span>;
      case 'contacted':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800">Contacted</span>;
      case 'follow_up':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800 animate-pulse">Follow-up Due</span>;
      case 'qualified':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-200 border border-purple-200 dark:border-purple-800">Qualified</span>;
      case 'converted':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800">Converted to Job</span>;
      case 'closed':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">Closed</span>;
      case 'lost':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800">Lost</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  const getPriorityBadge = (priority: EnquiryPriority) => {
    switch (priority) {
      case 'urgent':
        return <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-900/60"><Flame className="w-3 h-3" /> URGENT</span>;
      case 'high':
        return <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md">HIGH</span>;
      case 'medium':
        return <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md">MED</span>;
      case 'low':
        return <span className="text-[11px] font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">LOW</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in" id="enquiries-module-root">
      {/* Top Banner / Hero */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-7 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-1">
          <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full border border-blue-500/30 text-xs font-semibold mb-1">
            <HelpCircle className="w-4 h-4 text-blue-300" />
            <span>Customer Intake & Lead Conversion</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Customer Enquiries & Intake
          </h1>
          <p className="text-xs sm:text-sm text-blue-200/80 max-w-2xl">
            Capture prospective customer requests, schedule follow-ups, qualify requirements, and convert directly into scheduled service jobs.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2.5">
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow-lg hover:shadow-blue-500/25 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Customer Enquiry</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div
          onClick={() => setStatusFilter('new')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'new'
              ? 'bg-blue-50/80 border-blue-500 dark:bg-blue-950/40 dark:border-blue-400 ring-2 ring-blue-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>New Enquiries</span>
            <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <HelpCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2">{newCount}</div>
          <div className="text-[11px] text-blue-600 dark:text-blue-400 font-medium mt-0.5">Awaiting initial contact</div>
        </div>

        <div
          onClick={() => setStatusFilter('follow_up')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'follow_up'
              ? 'bg-amber-50/80 border-amber-500 dark:bg-amber-950/40 dark:border-amber-400 ring-2 ring-amber-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>Follow-ups Today</span>
            <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
              <CalendarClock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">{followUpTodayCount}</div>
          <div className="text-[11px] text-amber-700 dark:text-amber-300 font-medium mt-0.5">Scheduled for today</div>
        </div>

        <div
          onClick={() => setStatusFilter('qualified')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'qualified'
              ? 'bg-purple-50/80 border-purple-500 dark:bg-purple-950/40 dark:border-purple-400 ring-2 ring-purple-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>Qualified Leads</span>
            <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-2">{qualifiedCount}</div>
          <div className="text-[11px] text-purple-700 dark:text-purple-300 font-medium mt-0.5">Ready to convert to job</div>
        </div>

        <div
          onClick={() => setStatusFilter('converted')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'converted'
              ? 'bg-emerald-50/80 border-emerald-500 dark:bg-emerald-950/40 dark:border-emerald-400 ring-2 ring-emerald-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>Converted to Jobs</span>
            <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">{convertedCount}</div>
          <div className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium mt-0.5">Dispatched to field work</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by customer, phone, enquiry ID, service requirement..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="follow_up">Follow-up Due</option>
            <option value="qualified">Qualified</option>
            <option value="converted">Converted to Job</option>
            <option value="closed">Closed</option>
            <option value="lost">Lost</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            <option value="all">All Sources</option>
            <option value="website">Website</option>
            <option value="phone">Phone Call</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="referral">Referral</option>
            <option value="walk_in">Walk-in</option>
            <option value="google">Google</option>
          </select>

          {(searchQuery || statusFilter !== 'all' || priorityFilter !== 'all' || sourceFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setPriorityFilter('all');
                setSourceFilter('all');
              }}
              className="text-xs text-blue-600 dark:text-blue-400 font-bold px-2 py-1 hover:underline whitespace-nowrap"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Enquiries List */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {filteredEnquiries.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">No Enquiries Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search criteria or filter options.'
                : 'Log incoming calls, customer requests and web leads to convert into service jobs.'}
            </p>
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-500 shadow-sm cursor-pointer"
            >
              + Create First Enquiry
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredEnquiries.map((enq) => {
              const isFollowUpDueToday =
                (enq.status === 'follow_up' || enq.status === 'new' || enq.status === 'contacted') &&
                enq.followUpDate === new Date().toISOString().split('T')[0];

              return (
                <div
                  key={enq.id}
                  className={`p-4 sm:p-5 transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40 flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                    isFollowUpDueToday ? 'bg-amber-50/30 dark:bg-amber-950/10' : ''
                  }`}
                >
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0">
                      <HelpCircle className="w-5 h-5" />
                    </div>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-400 dark:text-slate-500">
                          {enq.enquiryId}
                        </span>
                        <h4
                          onClick={() => {
                            setSelectedEnquiry(enq);
                            setIsDetailDrawerOpen(true);
                          }}
                          className="font-extrabold text-sm text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer truncate"
                        >
                          {enq.customerName}
                        </h4>
                        {enq.companyName && (
                          <span className="text-xs text-slate-500 font-medium truncate">
                            ({enq.companyName})
                          </span>
                        )}
                        {getStatusBadge(enq.status)}
                        {getPriorityBadge(enq.priority)}
                      </div>

                      <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <span>Service: {enq.serviceRequired}</span>
                        {enq.estimatedValue ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                            • Est. ${enq.estimatedValue}
                          </span>
                        ) : null}
                      </div>

                      {enq.description && (
                        <p className="text-xs text-slate-500 line-clamp-1">
                          {enq.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <a href={`tel:${enq.customerPhone}`} className="hover:text-blue-600 font-medium">
                            {enq.customerPhone}
                          </a>
                        </span>

                        {enq.customerEmail && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <a href={`mailto:${enq.customerEmail}`} className="hover:text-blue-600">
                              {enq.customerEmail}
                            </a>
                          </span>
                        )}

                        {enq.assignedStaffName && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3 text-indigo-400" />
                            <span>Assigned: {enq.assignedStaffName}</span>
                          </span>
                        )}

                        {enq.followUpDate && (
                          <span className={`flex items-center gap-1 ${isFollowUpDueToday ? 'font-bold text-amber-600 dark:text-amber-400' : ''}`}>
                            <CalendarClock className="w-3 h-3" />
                            <span>Follow-up: {enq.followUpDate} {enq.followUpTime || ''}</span>
                          </span>
                        )}

                        <span className="text-slate-400 capitalize">
                          Source: {enq.source}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
                    {enq.status !== 'converted' ? (
                      <button
                        onClick={() => handleOpenConvertModal(enq)}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
                        title="Convert this enquiry directly into a field service job"
                      >
                        <Briefcase className="w-3.5 h-3.5" />
                        <span>Convert to Job</span>
                      </button>
                    ) : (
                      <span className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Job Created
                      </span>
                    )}

                    <button
                      onClick={() => {
                        setSelectedEnquiry(enq);
                        setIsDetailDrawerOpen(true);
                      }}
                      className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                      title="View Details & History"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Enquiry Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <h3 className="font-black text-base text-slate-900 dark:text-slate-100">
                  New Customer Enquiry
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEnquiry} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Customer Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Contact Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +1 (555) 234-5678"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Email (Optional)</label>
                  <input
                    type="email"
                    placeholder="john@example.com"
                    value={formData.customerEmail}
                    onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Company / Organization</label>
                  <input
                    type="text"
                    placeholder="Acme Corp (if applicable)"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Service Required *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CCTV Camera Installation"
                    value={formData.serviceRequired}
                    onChange={(e) => setFormData({ ...formData, serviceRequired: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Service Catalog Item</label>
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
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  >
                    <option value="">-- Select from Catalog (Optional) --</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (${s.price})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Description / Requirements</label>
                <textarea
                  rows={2}
                  placeholder="Details regarding the enquiry, customer questions, specific requirements..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Service Location / Address</label>
                <input
                  type="text"
                  placeholder="e.g. 123 Main St, Suite 400"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Source</label>
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value as EnquirySource })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  >
                    <option value="phone">Phone Call</option>
                    <option value="website">Website Form</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="referral">Referral</option>
                    <option value="walk_in">Walk-In</option>
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
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Assigned Handler</label>
                  <select
                    value={formData.assignedStaffId}
                    onChange={(e) => setFormData({ ...formData, assignedStaffId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <CalendarClock className="w-3.5 h-3.5 text-amber-500" />
                    Follow-Up Date
                  </label>
                  <input
                    type="date"
                    value={formData.followUpDate}
                    onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Follow-Up Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 10:00 AM"
                    value={formData.followUpTime}
                    onChange={(e) => setFormData({ ...formData, followUpTime: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Estimated Project Value ($)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.estimatedValue}
                  onChange={(e) => setFormData({ ...formData, estimatedValue: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-xl shadow-md cursor-pointer"
                >
                  Save Enquiry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Convert to Job Modal */}
      {isConvertModalOpen && selectedEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-slate-100">
                    Convert Enquiry to Scheduled Job
                  </h3>
                  <p className="text-xs text-slate-500">
                    Converts {selectedEnquiry.enquiryId} for {selectedEnquiry.customerName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsConvertModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="font-bold text-slate-900 dark:text-slate-100">Customer Summary:</div>
                <div className="text-slate-600 dark:text-slate-400">
                  {selectedEnquiry.customerName} • {selectedEnquiry.customerPhone}
                </div>
                <div className="text-slate-600 dark:text-slate-400">
                  Service: <span className="font-semibold text-slate-900 dark:text-slate-200">{selectedEnquiry.serviceRequired}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Scheduled Date *</label>
                  <input
                    type="date"
                    value={convertJobData.scheduledDate}
                    onChange={(e) => setConvertJobData({ ...convertJobData, scheduledDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Time Slot</label>
                  <select
                    value={convertJobData.scheduledTimeSlot}
                    onChange={(e) => setConvertJobData({ ...convertJobData, scheduledTimeSlot: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
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
                  <label className="font-bold text-slate-700 dark:text-slate-300">Assign Technician</label>
                  <select
                    value={convertJobData.assignedStaffId}
                    onChange={(e) => setConvertJobData({ ...convertJobData, assignedStaffId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                  >
                    <option value="">-- Select Technician --</option>
                    {staffMembers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Estimated Amount ($)</label>
                  <input
                    type="number"
                    value={convertJobData.estimatedAmount}
                    onChange={(e) => setConvertJobData({ ...convertJobData, estimatedAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Job Priority</label>
                <select
                  value={convertJobData.priority}
                  onChange={(e) => setConvertJobData({ ...convertJobData, priority: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsConvertModalOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmConvert}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Create & Schedule Job</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enquiry Detail Drawer */}
      {isDetailDrawerOpen && selectedEnquiry && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg h-full shadow-2xl p-6 overflow-y-auto space-y-5 border-l border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <div className="text-xs font-mono font-bold text-slate-400">{selectedEnquiry.enquiryId}</div>
                <h3 className="font-black text-lg text-slate-900 dark:text-slate-100">
                  {selectedEnquiry.customerName}
                </h3>
              </div>
              <button
                onClick={() => setIsDetailDrawerOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status & Priority Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</span>
                <div>
                  <select
                    value={selectedEnquiry.status}
                    onChange={(e) => handleStatusChange(selectedEnquiry.id, e.target.value as EnquiryStatus)}
                    className="text-xs font-bold px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="follow_up">Follow-up Due</option>
                    <option value="qualified">Qualified</option>
                    <option value="converted">Converted to Job</option>
                    <option value="closed">Closed</option>
                    <option value="lost">Lost</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1 text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Priority</span>
                <div>{getPriorityBadge(selectedEnquiry.priority)}</div>
              </div>
            </div>

            {/* Fast Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <a
                href={`tel:${selectedEnquiry.customerPhone}`}
                className="py-2 px-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center gap-1.5 border border-blue-200 dark:border-blue-900/60 transition-all"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Call Customer</span>
              </a>

              {selectedEnquiry.status !== 'converted' ? (
                <button
                  onClick={() => handleOpenConvertModal(selectedEnquiry)}
                  className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all"
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Convert to Job</span>
                </button>
              ) : (
                <div className="py-2 px-3 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Job Converted</span>
                </div>
              )}
            </div>

            {/* Info grid */}
            <div className="space-y-2 text-xs">
              <div className="font-bold text-slate-900 dark:text-slate-100">Enquiry Details:</div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-500">Service Required:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedEnquiry.serviceRequired}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-500">Phone:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedEnquiry.customerPhone}</span>
                </div>
                {selectedEnquiry.customerEmail && (
                  <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-slate-500">Email:</span>
                    <span className="text-slate-800 dark:text-slate-200">{selectedEnquiry.customerEmail}</span>
                  </div>
                )}
                {selectedEnquiry.location && (
                  <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-slate-500">Location:</span>
                    <span className="text-slate-800 dark:text-slate-200">{selectedEnquiry.location}</span>
                  </div>
                )}
                <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-500">Assigned Handler:</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    {selectedEnquiry.assignedStaffName || 'Unassigned'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-500">Follow-up Due:</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    {selectedEnquiry.followUpDate || 'Not set'} {selectedEnquiry.followUpTime || ''}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Estimated Value:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    ${selectedEnquiry.estimatedValue || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            <div className="space-y-2 text-xs">
              <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                <span>Notes & Communication Log</span>
              </div>
              {selectedEnquiry.notes && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 font-mono text-[11px] whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                  {selectedEnquiry.notes}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a timestamped follow-up note..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                  className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddNote}
                  className="px-3.5 py-2 bg-blue-600 text-white font-bold rounded-xl text-xs hover:bg-blue-500 cursor-pointer"
                >
                  Add Note
                </button>
              </div>
            </div>

            {/* Activity History Timeline */}
            <div className="space-y-2 text-xs">
              <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <History className="w-4 h-4 text-blue-500" />
                <span>Enquiry Activity Timeline</span>
              </div>
              <div className="space-y-2 pl-2 border-l-2 border-slate-200 dark:border-slate-700">
                {(selectedEnquiry.activityHistory || []).map((act, idx) => (
                  <div key={act.id || idx} className="text-[11px] space-y-0.5 relative pl-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500 absolute -left-[13px] top-1.5" />
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{act.action}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-slate-500">{act.details}</div>
                    <div className="text-[10px] text-slate-400">By {act.actorName}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Danger delete */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => {
                  if (confirm(`Are you sure you want to delete enquiry ${selectedEnquiry.enquiryId}?`)) {
                    deleteEnquiry(selectedEnquiry.id);
                    setIsDetailDrawerOpen(false);
                  }
                }}
                className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 hover:underline cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Enquiry</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

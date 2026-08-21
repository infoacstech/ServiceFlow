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
  CalendarClock,
  Sparkles,
  ExternalLink,
  PhoneCall,
  MessageCircle,
  MapPin,
  FileText,
  DollarSign,
  Layers,
  Check,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Enquiry, EnquiryStatus, EnquiryPriority, EnquirySource } from '../types';
import { EnquiryFormModal } from '../components/enquiries/EnquiryFormModal';
import { EnquiryDetailDrawer } from '../components/enquiries/EnquiryDetailDrawer';
import { ConvertToJobModal } from '../components/enquiries/ConvertToJobModal';
import { CreateQuoteModal } from '../components/enquiries/CreateQuoteModal';
import { MarkLostModal } from '../components/enquiries/MarkLostModal';

interface EnquiriesViewProps {
  onNavigate?: (tab: string) => void;
}

export const EnquiriesView: React.FC<EnquiriesViewProps> = ({ onNavigate }) => {
  const { enquiries, customers, services } = useApp();

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today_followup' | 'overdue_followup'>('all');

  // Modal / Drawer states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [enquiryToEdit, setEnquiryToEdit] = useState<Enquiry | null>(null);

  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);

  const [convertJobEnquiry, setConvertJobEnquiry] = useState<Enquiry | null>(null);
  const [isConvertJobOpen, setIsConvertJobOpen] = useState(false);

  const [createQuoteEnquiry, setCreateQuoteEnquiry] = useState<Enquiry | null>(null);
  const [isCreateQuoteOpen, setIsCreateQuoteOpen] = useState(false);

  const [markLostEnquiry, setMarkLostEnquiry] = useState<Enquiry | null>(null);
  const [isMarkLostOpen, setIsMarkLostOpen] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  // Filtered list
  const filteredEnquiries = useMemo(() => {
    return enquiries.filter((enq) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        enq.enquiryId.toLowerCase().includes(q) ||
        enq.customerName.toLowerCase().includes(q) ||
        (enq.customerPhone && enq.customerPhone.includes(q)) ||
        (enq.companyName && enq.companyName.toLowerCase().includes(q)) ||
        enq.serviceRequired.toLowerCase().includes(q) ||
        (enq.location && enq.location.toLowerCase().includes(q)) ||
        (enq.description && enq.description.toLowerCase().includes(q));

      const matchesStatus = statusFilter === 'all' || enq.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || enq.priority === priorityFilter;
      const matchesSource = sourceFilter === 'all' || enq.source === sourceFilter;

      let matchesDate = true;
      if (dateFilter === 'today_followup') {
        matchesDate = enq.followUpDate === todayStr && enq.status !== 'converted' && enq.status !== 'lost';
      } else if (dateFilter === 'overdue_followup') {
        matchesDate =
          !!enq.followUpDate &&
          enq.followUpDate < todayStr &&
          enq.status !== 'converted' &&
          enq.status !== 'lost';
      }

      return matchesSearch && matchesStatus && matchesPriority && matchesSource && matchesDate;
    });
  }, [enquiries, searchQuery, statusFilter, priorityFilter, sourceFilter, dateFilter, todayStr]);

  // Operational KPI metrics
  const totalCount = enquiries.length;
  const newCount = enquiries.filter((e) => e.status === 'new').length;
  const followUpTodayCount = enquiries.filter(
    (e) => (e.status === 'follow_up' || e.status === 'new' || e.status === 'contacted') && e.followUpDate === todayStr
  ).length;
  const qualifiedCount = enquiries.filter((e) => e.status === 'qualified').length;
  const quotedCount = enquiries.filter((e) => e.status === 'quoted').length;
  const convertedCount = enquiries.filter((e) => e.status === 'converted').length;
  const lostCount = enquiries.filter((e) => e.status === 'lost').length;

  const handleOpenAdd = () => {
    setEnquiryToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (enq: Enquiry) => {
    setEnquiryToEdit(enq);
    setIsFormModalOpen(true);
  };

  const handleOpenDetail = (enq: Enquiry) => {
    setSelectedEnquiry(enq);
    setIsDetailDrawerOpen(true);
  };

  const getStatusBadge = (status: EnquiryStatus) => {
    switch (status) {
      case 'new':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">New</span>;
      case 'contacted':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">Contacted</span>;
      case 'follow_up':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 animate-pulse">Follow-up Due</span>;
      case 'qualified':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">Qualified</span>;
      case 'quoted':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800">Quoted</span>;
      case 'converted':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">Converted to Job</span>;
      case 'lost':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">Lost</span>;
      case 'closed':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">Closed</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  const getPriorityBadge = (priority: EnquiryPriority) => {
    switch (priority) {
      case 'urgent':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-black text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-900/60">
            <Flame className="w-3 h-3" /> URGENT
          </span>
        );
      case 'high':
        return <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md">HIGH</span>;
      case 'normal':
      case 'medium':
        return <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md">NORMAL</span>;
      case 'low':
        return <span className="text-[11px] font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">LOW</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in" id="enquiries-module-root">
      {/* Top Banner / Hero Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-7 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-1">
          <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full border border-blue-500/30 text-xs font-semibold mb-1">
            <HelpCircle className="w-4 h-4 text-blue-300" />
            <span>Customer Intake & Enquiry Management</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Customer Enquiries & Intake
          </h1>
          <p className="text-xs sm:text-sm text-blue-200/80 max-w-2xl">
            Log incoming requests, schedule follow-ups, qualify requirements, generate quotes, and convert directly into scheduled field service jobs.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2.5">
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow-lg hover:shadow-blue-500/25 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Enquiry</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total */}
        <div
          onClick={() => {
            setStatusFilter('all');
            setDateFilter('all');
          }}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'all' && dateFilter === 'all'
              ? 'bg-slate-100 dark:bg-slate-800 border-slate-400 dark:border-slate-600 ring-2 ring-slate-400/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] font-bold text-slate-500">Total Enquiries</div>
          <div className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">{totalCount}</div>
          <div className="text-[10px] text-slate-400 font-medium">All logged</div>
        </div>

        {/* New */}
        <div
          onClick={() => {
            setStatusFilter('new');
            setDateFilter('all');
          }}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'new'
              ? 'bg-blue-50/80 border-blue-500 dark:bg-blue-950/40 dark:border-blue-400 ring-2 ring-blue-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400">New Enquiries</div>
          <div className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1">{newCount}</div>
          <div className="text-[10px] text-blue-500 font-medium">Awaiting contact</div>
        </div>

        {/* Follow-up Today */}
        <div
          onClick={() => {
            setStatusFilter('all');
            setDateFilter('today_followup');
          }}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            dateFilter === 'today_followup'
              ? 'bg-amber-50/80 border-amber-500 dark:bg-amber-950/40 dark:border-amber-400 ring-2 ring-amber-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <CalendarClock className="w-3.5 h-3.5" /> Follow-ups Today
          </div>
          <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">{followUpTodayCount}</div>
          <div className="text-[10px] text-amber-700 dark:text-amber-300 font-medium">Action due today</div>
        </div>

        {/* Qualified */}
        <div
          onClick={() => {
            setStatusFilter('qualified');
            setDateFilter('all');
          }}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'qualified'
              ? 'bg-purple-50/80 border-purple-500 dark:bg-purple-950/40 dark:border-purple-400 ring-2 ring-purple-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] font-bold text-purple-600 dark:text-purple-400">Qualified</div>
          <div className="text-xl font-black text-purple-600 dark:text-purple-400 mt-1">{qualifiedCount}</div>
          <div className="text-[10px] text-purple-700 dark:text-purple-300 font-medium">Ready for quote/job</div>
        </div>

        {/* Quoted */}
        <div
          onClick={() => {
            setStatusFilter('quoted');
            setDateFilter('all');
          }}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'quoted'
              ? 'bg-sky-50/80 border-sky-500 dark:bg-sky-950/40 dark:border-sky-400 ring-2 ring-sky-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] font-bold text-sky-600 dark:text-sky-400">Quoted</div>
          <div className="text-xl font-black text-sky-600 dark:text-sky-400 mt-1">{quotedCount}</div>
          <div className="text-[10px] text-sky-700 dark:text-sky-300 font-medium">Estimates sent</div>
        </div>

        {/* Converted */}
        <div
          onClick={() => {
            setStatusFilter('converted');
            setDateFilter('all');
          }}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'converted'
              ? 'bg-emerald-50/80 border-emerald-500 dark:bg-emerald-950/40 dark:border-emerald-400 ring-2 ring-emerald-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">Converted</div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{convertedCount}</div>
          <div className="text-[10px] text-emerald-700 dark:text-emerald-300 font-medium">Jobs created</div>
        </div>
      </div>

      {/* Filter and Search Controls Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by customer name, phone, enquiry ID, company, service..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="follow_up">Follow-up Due</option>
            <option value="qualified">Qualified</option>
            <option value="quoted">Quoted</option>
            <option value="converted">Converted to Job</option>
            <option value="lost">Lost</option>
            <option value="closed">Closed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            <option value="all">All Sources</option>
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

          {(searchQuery || statusFilter !== 'all' || priorityFilter !== 'all' || sourceFilter !== 'all' || dateFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setPriorityFilter('all');
                setSourceFilter('all');
                setDateFilter('all');
              }}
              className="text-xs text-blue-600 dark:text-blue-400 font-bold px-2 py-1 hover:underline whitespace-nowrap cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Enquiries List Display */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {filteredEnquiries.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">No Enquiries Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'all' || dateFilter !== 'all'
                ? 'Try adjusting your search query or filter presets.'
                : 'Log incoming customer enquiries to qualify requirements and convert into scheduled service jobs.'}
            </p>
            <button
              onClick={handleOpenAdd}
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
                enq.followUpDate === todayStr;

              const cleanPhone = enq.customerPhone.replace(/[^0-9]/g, '');

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
                          onClick={() => handleOpenDetail(enq)}
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
                        {enq.customerId && (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200">
                            CRM Linked
                          </span>
                        )}
                      </div>

                      <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 flex-wrap">
                        <span>Service: {enq.serviceRequired}</span>
                        {enq.estimatedValue ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                            • Est. ₹{enq.estimatedValue.toLocaleString()}
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
                          Source: {enq.source.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Fast Action Buttons */}
                  <div className="flex items-center gap-2 self-end lg:self-center shrink-0 flex-wrap">
                    <a
                      href={`tel:${enq.customerPhone}`}
                      className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                      title="Call Customer"
                    >
                      <PhoneCall className="w-4 h-4" />
                    </a>

                    <a
                      href={`https://wa.me/${cleanPhone}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                      title="WhatsApp Customer"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </a>

                    {enq.status !== 'converted' && !enq.convertedQuotationId ? (
                      <button
                        onClick={() => {
                          setCreateQuoteEnquiry(enq);
                          setIsCreateQuoteOpen(true);
                        }}
                        className="px-3 py-1.5 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 text-sky-700 dark:text-sky-300 font-bold text-xs rounded-xl border border-sky-200 dark:border-sky-900/60 transition-all flex items-center gap-1 cursor-pointer"
                        title="Create Quotation"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Quote</span>
                      </button>
                    ) : null}

                    {enq.status !== 'converted' ? (
                      <button
                        onClick={() => {
                          setConvertJobEnquiry(enq);
                          setIsConvertJobOpen(true);
                        }}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
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
                      onClick={() => handleOpenDetail(enq)}
                      className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                      title="View Details & Follow-ups"
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

      {/* Modals & Drawers */}
      <EnquiryFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEnquiryToEdit(null);
        }}
        enquiryToEdit={enquiryToEdit}
      />

      <EnquiryDetailDrawer
        isOpen={isDetailDrawerOpen}
        onClose={() => {
          setIsDetailDrawerOpen(false);
          setSelectedEnquiry(null);
        }}
        enquiry={selectedEnquiry}
        onEdit={(enq) => {
          setIsDetailDrawerOpen(false);
          handleOpenEdit(enq);
        }}
        onOpenConvertJob={(enq) => {
          setConvertJobEnquiry(enq);
          setIsConvertJobOpen(true);
        }}
        onOpenCreateQuote={(enq) => {
          setCreateQuoteEnquiry(enq);
          setIsCreateQuoteOpen(true);
        }}
        onOpenMarkLost={(enq) => {
          setMarkLostEnquiry(enq);
          setIsMarkLostOpen(true);
        }}
        onNavigate={onNavigate}
      />

      <ConvertToJobModal
        isOpen={isConvertJobOpen}
        onClose={() => {
          setIsConvertJobOpen(false);
          setConvertJobEnquiry(null);
        }}
        enquiry={convertJobEnquiry}
        onSuccess={() => {
          if (onNavigate) onNavigate('jobs');
        }}
      />

      <CreateQuoteModal
        isOpen={isCreateQuoteOpen}
        onClose={() => {
          setIsCreateQuoteOpen(false);
          setCreateQuoteEnquiry(null);
        }}
        enquiry={createQuoteEnquiry}
        onSuccess={() => {
          if (onNavigate) onNavigate('quotations');
        }}
      />

      <MarkLostModal
        isOpen={isMarkLostOpen}
        onClose={() => {
          setIsMarkLostOpen(false);
          setMarkLostEnquiry(null);
        }}
        enquiry={markLostEnquiry}
      />
    </div>
  );
};

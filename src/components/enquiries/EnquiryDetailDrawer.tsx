import React, { useState } from 'react';
import {
  X,
  Phone,
  Mail,
  Calendar,
  Clock,
  User,
  Briefcase,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Flame,
  CalendarClock,
  History,
  PhoneCall,
  MessageCircle,
  MapPin,
  Building,
  Sparkles,
  Edit2,
  Trash2,
  UserPlus,
  Link,
  Plus,
  Send,
  Check,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Enquiry, EnquiryFollowUp, EnquiryPriority, EnquiryStatus } from '../../types';

interface EnquiryDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  enquiry: Enquiry | null;
  onEdit: (enquiry: Enquiry) => void;
  onOpenConvertJob: (enquiry: Enquiry) => void;
  onOpenCreateQuote: (enquiry: Enquiry) => void;
  onOpenMarkLost: (enquiry: Enquiry) => void;
  onNavigate?: (tab: string) => void;
}

export const EnquiryDetailDrawer: React.FC<EnquiryDetailDrawerProps> = ({
  isOpen,
  onClose,
  enquiry,
  onEdit,
  onOpenConvertJob,
  onOpenCreateQuote,
  onOpenMarkLost,
  onNavigate,
}) => {
  const {
    customers,
    users,
    currentBusiness,
    currentUser,
    updateEnquiry,
    deleteEnquiry,
    addEnquiryFollowUp,
    linkCustomerToEnquiry,
    createAndLinkCustomerFromEnquiry,
    markEnquiryQualified,
    addEnquiryActivity,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'followups' | 'timeline'>('overview');

  // Follow-up input form state
  const [followUpDate, setFollowUpDate] = useState(new Date().toISOString().split('T')[0]);
  const [followUpTime, setFollowUpTime] = useState('11:00 AM');
  const [followUpChannel, setFollowUpChannel] = useState<'phone' | 'whatsapp' | 'email' | 'in_person'>('phone');
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [followUpOutcome, setFollowUpOutcome] = useState('');

  // Quick note state
  const [quickNote, setQuickNote] = useState('');

  // Customer link selector
  const [isLinkingOpen, setIsLinkingOpen] = useState(false);
  const [selectedCustomerIdToLink, setSelectedCustomerIdToLink] = useState('');

  if (!isOpen || !enquiry) return null;

  const linkedCustomer = customers.find((c) => c.id === enquiry.customerId);
  const matchingCustomer = customers.find(
    (c) =>
      c.mobile === enquiry.customerPhone ||
      (enquiry.customerEmail && c.email === enquiry.customerEmail)
  );

  const cleanPhone = enquiry.customerPhone.replace(/[^0-9]/g, '');

  const handleAddFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpNotes.trim()) {
      showToast('Please add notes for this follow-up.', 'error');
      return;
    }

    try {
      await addEnquiryFollowUp(enquiry.id, {
        date: followUpDate,
        time: followUpTime,
        channel: followUpChannel,
        notes: followUpNotes.trim(),
        outcome: followUpOutcome.trim() || undefined,
        completed: false,
        actorName: currentUser?.name || 'Staff User',
      });

      showToast('Follow-up scheduled and logged!', 'success');
      setFollowUpNotes('');
      setFollowUpOutcome('');
    } catch (err) {
      console.error('Error logging follow-up:', err);
      showToast('Failed to save follow-up.', 'error');
    }
  };

  const handleAddQuickNote = () => {
    if (!quickNote.trim()) return;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const formattedNote = `${enquiry.notes ? enquiry.notes + '\n' : ''}[${new Date().toISOString().split('T')[0]} ${timestamp}] ${currentUser?.name || 'Staff'}: ${quickNote.trim()}`;

    updateEnquiry(enquiry.id, { notes: formattedNote });
    addEnquiryActivity(enquiry.id, 'Note Added', quickNote.trim());
    showToast('Note added to enquiry log.', 'success');
    setQuickNote('');
  };

  const handleLinkCustomer = (cId: string) => {
    linkCustomerToEnquiry(enquiry.id, cId);
    showToast('Customer successfully linked to Enquiry!', 'success');
    setIsLinkingOpen(false);
  };

  const handleCreateNewCustomer = async () => {
    try {
      const newCust = await createAndLinkCustomerFromEnquiry(enquiry.id);
      showToast(`Created & Linked Customer profile for ${newCust.name}!`, 'success');
    } catch (err) {
      console.error('Error creating customer from enquiry:', err);
      showToast('Failed to create customer record.', 'error');
    }
  };

  const handleMarkQualified = () => {
    markEnquiryQualified(enquiry.id);
    showToast('Enquiry marked as Qualified!', 'success');
  };

  const handleMarkContacted = () => {
    updateEnquiry(enquiry.id, { status: 'contacted' });
    addEnquiryActivity(enquiry.id, 'Status Updated', 'Marked as Contacted');
    showToast('Status updated to Contacted.', 'success');
  };

  const getStatusBadge = (status: EnquiryStatus) => {
    switch (status) {
      case 'new':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">New Enquiry</span>;
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
          <span className="inline-flex items-center gap-1 text-xs font-black text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-900/60">
            <Flame className="w-3.5 h-3.5" /> URGENT
          </span>
        );
      case 'high':
        return (
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md">
            HIGH
          </span>
        );
      case 'normal':
      case 'medium':
        return (
          <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md">
            NORMAL
          </span>
        );
      case 'low':
        return (
          <span className="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
            LOW
          </span>
        );
    }
  };

  const isFollowUpDueToday =
    (enquiry.status === 'follow_up' || enquiry.status === 'new' || enquiry.status === 'contacted') &&
    enquiry.followUpDate === new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl h-full shadow-2xl overflow-hidden flex flex-col border-l border-slate-200 dark:border-slate-800">
        {/* Top Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold text-slate-500 bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                  {enquiry.enquiryId}
                </span>
                {getStatusBadge(enquiry.status)}
                {getPriorityBadge(enquiry.priority)}
                {isFollowUpDueToday && (
                  <span className="text-xs font-black text-amber-700 bg-amber-100 dark:bg-amber-950 dark:text-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-300">
                    <CalendarClock className="w-3.5 h-3.5" /> Follow-up Today
                  </span>
                )}
              </div>

              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 truncate">
                {enquiry.customerName}
              </h2>
              {enquiry.companyName && (
                <div className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                  <Building className="w-3.5 h-3.5" />
                  <span>{enquiry.companyName}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => onEdit(enquiry)}
                className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                title="Edit Enquiry"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Communication & Action Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
            <a
              href={`tel:${enquiry.customerPhone}`}
              className="px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center gap-1.5 border border-blue-200 dark:border-blue-900/60 transition-all cursor-pointer shadow-xs"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Call</span>
            </a>

            <a
              href={`https://wa.me/${cleanPhone}`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 border border-emerald-200 dark:border-emerald-900/60 transition-all cursor-pointer shadow-xs"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>

            {enquiry.status !== 'converted' ? (
              <button
                onClick={() => onOpenCreateQuote(enquiry)}
                className="px-3 py-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 text-sky-700 dark:text-sky-300 font-bold text-xs flex items-center justify-center gap-1.5 border border-sky-200 dark:border-sky-900/60 transition-all cursor-pointer shadow-xs"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Create Quote</span>
              </button>
            ) : null}

            {enquiry.status !== 'converted' ? (
              <button
                onClick={() => onOpenConvertJob(enquiry)}
                className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Convert to Job</span>
              </button>
            ) : (
              <div className="px-3 py-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Job Converted</span>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-4 px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 border-b-2 transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Overview & CRM Link
          </button>
          <button
            onClick={() => setActiveTab('followups')}
            className={`py-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'followups'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <span>Follow-ups Log</span>
            {(enquiry.followUps || []).length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 text-[10px]">
                {(enquiry.followUps || []).length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`py-3 border-b-2 transition-all cursor-pointer ${
              activeTab === 'timeline'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Activity Timeline
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* Lifecycle Stage Advancement Bar */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Enquiry Lifecycle Progression:
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 capitalize">
                    Current: {enquiry.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {enquiry.status === 'new' && (
                    <button
                      onClick={handleMarkContacted}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" /> Mark Contacted
                    </button>
                  )}

                  {enquiry.status !== 'qualified' && enquiry.status !== 'converted' && (
                    <button
                      onClick={handleMarkQualified}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Mark Qualified
                    </button>
                  )}

                  {enquiry.status !== 'lost' && enquiry.status !== 'converted' && (
                    <button
                      onClick={() => onOpenMarkLost(enquiry)}
                      className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-rose-100 dark:hover:bg-rose-950 text-slate-700 dark:text-slate-300 hover:text-rose-600 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" /> Mark Lost
                    </button>
                  )}
                </div>
              </div>

              {/* CRM Customer Linking Card */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" />
                    <h3 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                      Customer Profile Link
                    </h3>
                  </div>
                  {linkedCustomer ? (
                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Linked in CRM
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                      Unlinked Prospective Contact
                    </span>
                  )}
                </div>

                {linkedCustomer ? (
                  <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40 text-xs space-y-1">
                    <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                      <span>{linkedCustomer.name}</span>
                      <span className="text-slate-500 capitalize">{linkedCustomer.customerType}</span>
                    </div>
                    <div className="text-slate-600 dark:text-slate-400">
                      Mobile: {linkedCustomer.mobile} {linkedCustomer.email ? `• ${linkedCustomer.email}` : ''}
                    </div>
                    {linkedCustomer.address && (
                      <div className="text-slate-500 text-[11px] truncate">
                        Address: {linkedCustomer.address}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {matchingCustomer ? (
                      <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 text-xs flex items-center justify-between gap-2">
                        <div>
                          <div className="font-bold text-amber-900 dark:text-amber-200">
                            Found Matched Customer in Database:
                          </div>
                          <div className="text-amber-700 dark:text-amber-300">
                            {matchingCustomer.name} ({matchingCustomer.mobile})
                          </div>
                        </div>
                        <button
                          onClick={() => handleLinkCustomer(matchingCustomer.id)}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold shrink-0"
                        >
                          Link Customer
                        </button>
                      </div>
                    ) : null}

                    <div className="flex items-center gap-2 flex-wrap pt-1">
                      <button
                        onClick={handleCreateNewCustomer}
                        className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Create Customer Profile</span>
                      </button>

                      <button
                        onClick={() => setIsLinkingOpen(!isLinkingOpen)}
                        className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Link className="w-3.5 h-3.5" />
                        <span>Select Existing Customer</span>
                      </button>
                    </div>

                    {isLinkingOpen && (
                      <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex gap-2 animate-in fade-in">
                        <select
                          value={selectedCustomerIdToLink}
                          onChange={(e) => setSelectedCustomerIdToLink(e.target.value)}
                          className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-xs"
                        >
                          <option value="">-- Choose Customer from CRM --</option>
                          {customers.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.mobile}) {c.companyName ? `- ${c.companyName}` : ''}
                            </option>
                          ))}
                        </select>
                        <button
                          disabled={!selectedCustomerIdToLink}
                          onClick={() => handleLinkCustomer(selectedCustomerIdToLink)}
                          className="px-4 py-1.5 bg-blue-600 disabled:opacity-50 text-white rounded-lg text-xs font-bold"
                        >
                          Link
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Linked Quote or Job info if converted */}
              {(enquiry.convertedQuotationId || enquiry.convertedJobId) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {enquiry.convertedQuotationId && (
                    <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] font-bold text-sky-600 uppercase">Linked Quotation</div>
                        <div className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                          {enquiry.convertedQuotationNumber || 'Quotation Generated'}
                        </div>
                      </div>
                      {onNavigate && (
                        <button
                          onClick={() => onNavigate('quotations')}
                          className="p-1.5 rounded-lg bg-sky-600 text-white hover:bg-sky-500 text-xs font-bold flex items-center gap-1"
                        >
                          <span>View</span> <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}

                  {enquiry.convertedJobId && (
                    <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] font-bold text-emerald-600 uppercase">Linked Service Job</div>
                        <div className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                          {enquiry.convertedJobNumber || 'Job Scheduled'}
                        </div>
                      </div>
                      {onNavigate && (
                        <button
                          onClick={() => onNavigate('jobs')}
                          className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 text-xs font-bold flex items-center gap-1"
                        >
                          <span>View Job</span> <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Loss Details if marked lost */}
              {enquiry.status === 'lost' && (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-xs space-y-1.5">
                  <div className="font-bold text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Lost Enquiry Reason: {enquiry.lostReason || 'Not specified'}</span>
                  </div>
                  {enquiry.lostNotes && (
                    <div className="text-rose-700 dark:text-rose-300 pl-5">{enquiry.lostNotes}</div>
                  )}
                </div>
              )}

              {/* Requirements & Info Grid */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 text-xs">
                <h3 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  Enquiry Specifications
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <span className="text-slate-500 block text-[11px]">Service Required</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {enquiry.serviceRequired}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <span className="text-slate-500 block text-[11px]">Estimated Value</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {enquiry.estimatedValue ? `₹${enquiry.estimatedValue.toLocaleString()}` : 'Not estimated'}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <span className="text-slate-500 block text-[11px]">Intake Source</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 capitalize">
                      {enquiry.source.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <span className="text-slate-500 block text-[11px]">Assigned Handler</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      {enquiry.assignedStaffName || 'Unassigned'}
                    </span>
                  </div>
                </div>

                {enquiry.location && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-slate-500 block text-[11px]">Service Site Location</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {enquiry.location}
                      </span>
                    </div>
                  </div>
                )}

                {enquiry.description && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1">
                    <span className="text-slate-500 block text-[11px]">Requirement Notes</span>
                    <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                      {enquiry.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Quick Communication Notes Logger */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 text-xs">
                <h3 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  Internal Notes & Communication
                </h3>

                {enquiry.notes && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl font-mono text-[11px] whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                    {enquiry.notes}
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add a timestamped quick note..."
                    value={quickNote}
                    onChange={(e) => setQuickNote(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddQuickNote()}
                    className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
                  />
                  <button
                    onClick={handleAddQuickNote}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" /> Note
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'followups' && (
            <div className="space-y-5">
              {/* Schedule Follow-up Form */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 text-xs">
                <div className="flex items-center gap-2">
                  <CalendarClock className="w-4 h-4 text-amber-500" />
                  <h3 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    Schedule New Follow-up
                  </h3>
                </div>

                <form onSubmit={handleAddFollowUp} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 dark:text-slate-300">Follow-up Date *</label>
                      <input
                        type="date"
                        required
                        value={followUpDate}
                        onChange={(e) => setFollowUpDate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 dark:text-slate-300">Time</label>
                      <input
                        type="text"
                        value={followUpTime}
                        onChange={(e) => setFollowUpTime(e.target.value)}
                        placeholder="11:00 AM"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 dark:text-slate-300">Channel</label>
                      <select
                        value={followUpChannel}
                        onChange={(e) => setFollowUpChannel(e.target.value as any)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-medium"
                      >
                        <option value="phone">Phone Call</option>
                        <option value="whatsapp">WhatsApp Message</option>
                        <option value="email">Email</option>
                        <option value="in_person">Site Visit / Meeting</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">Follow-up Agenda / Notes *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Call to discuss quote approval and site readiness..."
                      value={followUpNotes}
                      onChange={(e) => setFollowUpNotes(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-extrabold rounded-xl text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Log & Schedule Follow-up</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Follow-ups List */}
              <div className="space-y-3 text-xs">
                <h3 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  Follow-up History ({(enquiry.followUps || []).length})
                </h3>

                {(enquiry.followUps || []).length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-400">
                    No follow-ups recorded yet. Schedule your first follow-up above.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {(enquiry.followUps || []).map((fu, idx) => (
                      <div
                        key={fu.id || idx}
                        className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-amber-500" />
                              {fu.date} {fu.time || ''}
                            </span>
                            <span className="text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-md uppercase">
                              {fu.channel}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400">
                            By {fu.actorName || 'Staff'}
                          </span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 font-medium">{fu.notes}</p>
                        {fu.outcome && (
                          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                            Outcome: {fu.outcome}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="space-y-3 text-xs">
              <div className="font-extrabold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-4 h-4 text-blue-500" />
                <span>Audit & Activity Log</span>
              </div>

              <div className="space-y-3 pl-3 border-l-2 border-slate-200 dark:border-slate-700 py-1">
                {(enquiry.activityHistory || []).map((act, idx) => (
                  <div key={act.id || idx} className="text-xs space-y-1 relative pl-4">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 absolute -left-[18px] top-1 border-2 border-white dark:border-slate-900" />
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{act.action}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(act.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-slate-600 dark:text-slate-400">{act.details}</div>
                    <div className="text-[10px] text-slate-400 font-medium">Logged by {act.actorName}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Delete Action */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center shrink-0">
          <button
            onClick={() => {
              if (confirm(`Are you sure you want to delete enquiry ${enquiry.enquiryId}?`)) {
                deleteEnquiry(enquiry.id);
                onClose();
              }
            }}
            className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1.5 hover:underline cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Enquiry</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Close Drawer
          </button>
        </div>
      </div>
    </div>
  );
};

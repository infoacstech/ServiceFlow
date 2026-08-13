import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { User, UserRole } from '../types';
import { StaffCalendarTimeline } from '../components/StaffCalendarTimeline';
import {
  UserCheck,
  UserX,
  Plus,
  Mail,
  Phone,
  Shield,
  Calendar,
  Users,
  X,
  UserPlus,
  Clock,
  Ban,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Lock,
  Trash2,
} from 'lucide-react';

export const StaffView: React.FC = () => {
  const { users, staff, jobs, currentBusiness, currentUser, roles, addStaff, deleteStaff, updateUserStatus, showToast } = useApp();
  const [activeTab, setActiveTab] = useState<'calendar' | 'directory'>('calendar');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deletingStaffUser, setDeletingStaffUser] = useState<User | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('technician');
  const [skills, setSkills] = useState('');

  // Filter staff & pending users for current business
  const businessUsers = (users || staff).filter(
    (u) => u.businessId === currentBusiness.id || currentBusiness.id === 'all'
  );

  const pendingApprovals = businessUsers.filter((u) => u.approvalStatus === 'pending');
  const isOwnerOrAdmin = currentUser?.role === 'business_owner' || currentUser?.role === 'super_admin';

  const handleAddStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      showToast('Please enter full name and email address', 'error');
      return;
    }

    const skillsArray = skills.split(',').map((s) => s.trim()).filter(Boolean);

    addStaff({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || '+91 98765 00000',
      role: selectedRole,
      skills: skillsArray.length > 0 ? skillsArray : ['General Field Service'],
      joiningDate: new Date().toISOString().split('T')[0],
      status: 'active',
      approvalStatus: 'active',
      avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80`,
    });

    showToast(`Successfully created ${name} as ${selectedRole.replace('_', ' ')}!`, 'success');
    setName('');
    setEmail('');
    setPhone('');
    setSkills('');
    setSelectedRole('technician');
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-600" /> Staff & Field Executives
          </h1>
          <p className="text-xs text-slate-500">Manage field technicians, dispatch calendar, and account approvals</p>
        </div>

        {/* View Switcher Tabs & Add Staff Button */}
        <div className="flex items-center gap-3">
          <div className="flex items-center p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl gap-1">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'calendar'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-4 h-4" /> Weekly Dispatch Calendar
            </button>
            <button
              onClick={() => setActiveTab('directory')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all relative ${
                activeTab === 'directory'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" /> Team Directory ({businessUsers.length})
              {pendingApprovals.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 absolute -top-0.5 -right-0.5 animate-ping" />
              )}
            </button>
          </div>

          {isOwnerOrAdmin && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all shrink-0"
            >
              <UserPlus className="w-4 h-4" /> Add Team Member
            </button>
          )}
        </div>
      </div>

      {/* PENDING APPROVALS SECTION FOR BUSINESS OWNER */}
      {isOwnerOrAdmin && pendingApprovals.length > 0 && (
        <div className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-3xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-amber-900 dark:text-amber-200 flex items-center gap-2">
                  Pending Account Approvals ({pendingApprovals.length})
                </h2>
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  New staff registered and awaiting your approval before they can log in
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingApprovals.map((reqUser) => (
              <div
                key={reqUser.id}
                className="bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-900/50 rounded-2xl p-4 flex flex-col justify-between space-y-3 shadow-xs"
              >
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 flex items-center justify-center font-extrabold text-sm shrink-0">
                        {(reqUser?.name || reqUser?.email || 'US').substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{reqUser?.name || reqUser?.email || 'User'}</h3>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 inline-block">
                          Requested: {(reqUser?.role || 'user').replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                </div>

                <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{reqUser.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{reqUser.phone || '+91 98765 00000'}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 pt-1">
                    Requested Date: {reqUser.requestedDate || reqUser.joiningDate || 'Today'}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <button
                    onClick={() => updateUserStatus(reqUser.id, 'active')}
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Approve Account
                  </button>
                  <button
                    onClick={() => updateUserStatus(reqUser.id, 'rejected')}
                    className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-amber-100 dark:bg-slate-800 dark:hover:bg-amber-950/50 text-slate-600 dark:text-slate-300 hover:text-amber-600 font-bold text-xs flex items-center justify-center gap-1 transition-all"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => setDeletingStaffUser(reqUser)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-rose-100 dark:bg-slate-800 dark:hover:bg-rose-950/60 text-slate-500 hover:text-rose-600 transition-all"
                    title="Delete registration request"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content View */}
      {activeTab === 'calendar' ? (
        <StaffCalendarTimeline />
      ) : (
        /* Staff Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {businessUsers.map((st) => {
            const assignedJobs = jobs.filter((j) => j.assignedStaffId === st.id);
            const completedJobs = assignedJobs.filter((j) => j.status === 'completed' || j.status === 'closed');

            const isPending = st.approvalStatus === 'pending';
            const isBlocked = st.approvalStatus === 'blocked';
            const isRejected = st.approvalStatus === 'rejected';

            return (
              <div
                key={st.id}
                className={`p-5 rounded-3xl bg-white dark:bg-slate-900 border shadow-xs flex flex-col justify-between space-y-4 ${
                  isBlocked
                    ? 'border-rose-200 dark:border-rose-900/50 bg-rose-50/20 dark:bg-rose-950/10'
                    : isPending
                    ? 'border-amber-200 dark:border-amber-900/50 bg-amber-50/20 dark:bg-amber-950/10'
                    : 'border-slate-200/80 dark:border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-800 overflow-hidden ring-2 ring-indigo-500/30 shrink-0">
                        {st.avatar ? (
                          <img src={st.avatar} alt={st.name || 'Staff'} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-slate-700 dark:text-slate-200">
                            {(st?.name || st?.email || 'US').substring(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div>
                        <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          {st?.name || st?.email || 'Staff'}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                            {(st?.role || 'staff').replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {isBlocked ? (
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 flex items-center gap-1">
                          <Ban className="w-3 h-3" /> Blocked
                        </span>
                      ) : isPending ? (
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Pending
                        </span>
                      ) : isRejected ? (
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400 flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Rejected
                        </span>
                      ) : (
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{st.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{st.phone || '+91 98765 00000'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <div className="text-[10px] text-slate-400">Assigned Jobs</div>
                      <div className="font-bold text-slate-900 dark:text-slate-100">{assignedJobs.length}</div>
                    </div>
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl">
                      <div className="text-[10px] text-emerald-700 dark:text-emerald-400">Completed</div>
                      <div className="font-bold text-emerald-800 dark:text-emerald-300">{completedJobs.length}</div>
                    </div>
                  </div>

                  {/* Owner Controls (Block / Unblock / Approve / Delete) */}
                  {isOwnerOrAdmin && st.id !== currentUser?.id && st.role !== 'super_admin' && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                      {isPending ? (
                        <>
                          <button
                            onClick={() => updateUserStatus(st.id, 'active')}
                            className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-xs transition-all"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => updateUserStatus(st.id, 'rejected')}
                            className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-600 font-bold text-xs transition-all"
                          >
                            Reject
                          </button>
                        </>
                      ) : isBlocked ? (
                        <button
                          onClick={() => updateUserStatus(st.id, 'active')}
                          className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Unblock Access
                        </button>
                      ) : (
                        <button
                          onClick={() => updateUserStatus(st.id, 'blocked')}
                          className="flex-1 py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 dark:bg-slate-800 dark:hover:bg-rose-950/60 dark:hover:text-rose-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                        >
                          <Ban className="w-3.5 h-3.5 text-rose-500" /> Block Access
                        </button>
                      )}

                      <button
                        onClick={() => setDeletingStaffUser(st)}
                        className="py-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-rose-100 dark:bg-slate-800 dark:hover:bg-rose-950/60 text-slate-500 hover:text-rose-600 transition-all"
                        title="Delete staff account permanently"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Staff Member Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                    Create New Staff Member
                  </h3>
                  <p className="text-xs text-slate-500">Assign role and immediate active access</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStaffSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Suresh Patel"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="suresh@company.com"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mobile Phone
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Assign System Role
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {roles.map((r) => (
                    <button
                      type="button"
                      key={r.id}
                      onClick={() => setSelectedRole(r.code)}
                      className={`p-3 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                        selectedRole === r.code
                          ? 'bg-indigo-50/80 dark:bg-indigo-950/80 border-indigo-500 ring-1 ring-indigo-500'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <div
                        className={`p-2 rounded-xl shrink-0 ${
                          selectedRole === r.code
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        <Shield className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100">{r.name}</span>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            {r.code}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                          {r.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Skills & Certifications (Comma Separated)
                </label>
                <input
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="e.g. CCTV Wiring, Solar Inverter Setup, HVAC Repair"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" /> Create & Assign Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingStaffUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                  Delete Staff Account?
                </h3>
                <p className="text-xs text-slate-500">
                  Are you sure you want to delete <span className="font-bold text-slate-900 dark:text-slate-100">{deletingStaffUser.name || deletingStaffUser.email}</span>?
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 bg-rose-50/50 dark:bg-rose-950/30 p-3.5 rounded-2xl border border-rose-100 dark:border-rose-900/40">
              This action will permanently delete their staff record and revoke login access across all devices.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingStaffUser(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteStaff(deletingStaffUser.id);
                  setDeletingStaffUser(null);
                }}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" /> Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

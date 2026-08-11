import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { User, UserRole } from '../types';
import { StaffCalendarTimeline } from '../components/StaffCalendarTimeline';
import { UserCheck, Plus, Mail, Phone, Shield, Star, Briefcase, CheckCircle2, Calendar, Users } from 'lucide-react';

export const StaffView: React.FC = () => {
  const { staff, jobs, currentBusiness } = useApp();
  const [activeTab, setActiveTab] = useState<'calendar' | 'directory'>('calendar');

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-600" /> Staff & Technicians Dispatch
          </h1>
          <p className="text-xs text-slate-500">Manage field technicians, drag-and-drop job schedules, & technician productivity</p>
        </div>

        {/* View Switcher Tabs */}
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
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'directory'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" /> Team Directory ({staff.length})
          </button>
        </div>
      </div>

      {/* Main Content View */}
      {activeTab === 'calendar' ? (
        <StaffCalendarTimeline />
      ) : (
        /* Staff Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map((st) => {
            const assignedJobs = jobs.filter((j) => j.assignedStaffId === st.id);
            const completedJobs = assignedJobs.filter((j) => j.status === 'completed' || j.status === 'closed');

            return (
              <div
                key={st.id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-800 overflow-hidden ring-2 ring-indigo-500/30 shrink-0">
                      {st.avatar ? (
                        <img src={st.avatar} alt={st.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-slate-700">
                          {st.name.substring(0, 2)}
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{st.name}</h3>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">
                        {st.role.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{st.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{st.mobile || '+91 98765 00000'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <div className="text-[10px] text-slate-400">Assigned Jobs</div>
                    <div className="font-bold text-slate-900 dark:text-slate-100">{assignedJobs.length}</div>
                  </div>
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl">
                    <div className="text-[10px] text-emerald-700">Completed</div>
                    <div className="font-bold text-emerald-800 dark:text-emerald-300">{completedJobs.length}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

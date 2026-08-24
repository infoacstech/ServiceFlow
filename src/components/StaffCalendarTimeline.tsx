import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Job, User } from '../types';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  User as UserIcon,
  AlertCircle,
  GripVertical,
  Briefcase,
  CheckCircle2,
  Info,
  X,
  Plus,
  MapPin,
} from 'lucide-react';

export const StaffCalendarTimeline: React.FC = () => {
  const { staff, jobs, customers, updateJob, showToast, logActivity } = useApp();

  const uniqueStaff = React.useMemo(() => {
    const raw = staff || [];
    const seen = new Set<string>();
    const result: User[] = [];
    for (const tech of raw) {
      const emailKey = tech.email ? `email:${tech.email.trim().toLowerCase()}` : '';
      const phoneDigits = (tech.phone || '').replace(/[^0-9]/g, '').slice(-10);
      const phoneKey = phoneDigits ? `phone:${phoneDigits}` : '';
      const idKey = `id:${tech.id}`;

      if (seen.has(idKey) || (emailKey && seen.has(emailKey)) || (phoneKey && seen.has(phoneKey))) {
        continue;
      }
      if (idKey) seen.add(idKey);
      if (emailKey) seen.add(emailKey);
      if (phoneKey) seen.add(phoneKey);
      result.push(tech);
    }
    return result;
  }, [staff]);

  // Current anchor date (defaults to today)
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [draggedJobId, setDraggedJobId] = useState<string | null>(null);
  const [dragOverCell, setDragOverCell] = useState<{ staffId: string; dateStr: string } | null>(null);

  // Helper to get start of week (Monday)
  const getStartOfWeek = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Monday is start
    return new Date(date.setDate(diff));
  };

  const startOfWeek = getStartOfWeek(currentDate);

  // Generate 7 days for current week
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    const isoDate = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNum = d.getDate();
    const monthName = d.toLocaleDateString('en-US', { month: 'short' });
    const isToday = isoDate === new Date().toISOString().split('T')[0];
    return { date: d, isoDate, dayName, dayNum, monthName, isToday };
  });

  const navigateWeek = (direction: 'prev' | 'next' | 'today') => {
    if (direction === 'today') {
      setCurrentDate(new Date());
      return;
    }
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentDate(newDate);
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, jobId: string) => {
    e.dataTransfer.setData('text/plain', jobId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedJobId(jobId);
  };

  const handleDragOver = (e: React.DragEvent, staffId: string, dateStr: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCell?.staffId !== staffId || dragOverCell?.dateStr !== dateStr) {
      setDragOverCell({ staffId, dateStr });
    }
  };

  const handleDragLeave = () => {
    setDragOverCell(null);
  };

  const handleDrop = (e: React.DragEvent, targetStaffId: string, targetDateStr: string) => {
    e.preventDefault();
    setDragOverCell(null);
    const jobId = e.dataTransfer.getData('text/plain') || draggedJobId;
    setDraggedJobId(null);

    if (!jobId) return;

    const job = (jobs || []).find((j) => j.id === jobId);
    const targetStaff = (staff || []).find((s) => s.id === targetStaffId);

    if (!job) return;

    // Update job allocation
    updateJob(jobId, {
      assignedStaffId: targetStaffId,
      scheduledDate: targetDateStr,
    });

    logActivity(
      'Job Reassigned on Timeline',
      'job',
      jobId,
      `Allocated job ${job.jobId} to ${targetStaff?.name || 'Staff'} for ${targetDateStr}`
    );

    showToast(
      `Job ${job.jobId} allocated to ${targetStaff?.name?.split(' ')[0] || 'Staff'} on ${targetDateStr}`,
      'success'
    );
  };

  // Filter unassigned jobs
  const unassignedJobs = jobs.filter((j) => !j.assignedStaffId || j.assignedStaffId === '');

  const getStatusBadgeStyle = (status: Job['status']) => {
    switch (status) {
      case 'completed':
      case 'closed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800';
      case 'in_progress':
      case 'started':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800';
      case 'assigned':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Calendar Top Controls & Week Selector */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Technician Weekly Dispatch Timeline
            </h2>
            <p className="text-xs text-slate-500">
              Drag and drop job cards to reassign technicians or reschedule dates
            </p>
          </div>
        </div>

        {/* Week Navigation Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateWeek('prev')}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
            title="Previous Week"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigateWeek('today')}
            className="px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 text-xs font-bold border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-colors"
          >
            Current Week
          </button>
          <button
            onClick={() => navigateWeek('next')}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
            title="Next Week"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <span className="ml-2 text-xs font-black text-slate-800 dark:text-slate-200 font-mono bg-slate-50 dark:bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700">
            {weekDays[0].monthName} {weekDays[0].dayNum} – {weekDays[6].monthName} {weekDays[6].dayNum}, {weekDays[0].date.getFullYear()}
          </span>
        </div>
      </div>

      {/* Unassigned Jobs Dock */}
      {unassignedJobs.length > 0 && (
        <div className="p-4 rounded-3xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-amber-900 dark:text-amber-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" /> Unassigned Jobs Pending Allocation ({unassignedJobs.length})
            </h3>
            <span className="text-[11px] text-amber-700 dark:text-amber-300 italic">
              Drag any job onto a technician's day slot below
            </span>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
            {(unassignedJobs || []).map((job) => {
              const cust = (customers || []).find((c) => c.id === job.customerId);
              return (
                <div
                  key={job.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, job.id)}
                  onClick={() => setSelectedJob(job)}
                  className="shrink-0 w-60 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 shadow-xs cursor-grab active:cursor-grabbing hover:ring-2 hover:ring-indigo-500 transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{job.jobId}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 uppercase">
                      {job.priority}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{(job as any).serviceName || job.description}</p>
                  <div className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                    <UserIcon className="w-3 h-3 text-slate-400" /> {cust?.name || 'Customer'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Interactive Timeline Matrix Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs min-w-[900px]">
            {/* Header: Technician Column + 7 Days */}
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                <th className="p-4 text-left font-black w-56 sticky left-0 bg-slate-50 dark:bg-slate-800/90 z-10 border-r border-slate-200 dark:border-slate-800">
                  Technician / Staff
                </th>
                {weekDays.map((day) => (
                  <th
                    key={day.isoDate}
                    className={`p-3 text-center font-bold border-r border-slate-200/80 dark:border-slate-800/80 last:border-r-0 ${
                      day.isToday ? 'bg-indigo-50/70 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300' : ''
                    }`}
                  >
                    <div className="text-[10px] uppercase font-bold text-slate-400">{day.dayName}</div>
                    <div className="text-sm font-black text-slate-900 dark:text-slate-100">
                      {day.dayNum} {day.monthName}
                    </div>
                    {day.isToday && (
                      <span className="inline-block mt-0.5 text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-indigo-600 text-white">
                        Today
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Body: Each Staff Member Row */}
            <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
              {uniqueStaff.map((tech) => {
                // Get all jobs for this technician across the week
                const techWeekJobs = (jobs || []).filter((j) => j.assignedStaffId === tech.id);
                const techName = tech?.name || tech?.email || 'Technician';
                const techInitials = (tech?.name || tech?.email || 'TC').substring(0, 2).toUpperCase();

                return (
                  <tr key={tech.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    {/* Left Sticky Column: Technician Profile */}
                    <td className="p-3.5 sticky left-0 bg-white dark:bg-slate-900 z-10 border-r border-slate-200 dark:border-slate-800 space-y-1">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800 overflow-hidden ring-2 ring-indigo-500/20 shrink-0 font-bold flex items-center justify-center text-xs text-slate-700 dark:text-slate-300">
                          {tech?.avatar ? (
                            <img src={tech.avatar} alt={techName} className="w-full h-full object-cover" />
                          ) : (
                            techInitials
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 truncate">
                            {techName}
                          </h4>
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] px-1.5 py-0.2 rounded-md font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 truncate">
                              {(tech?.role || 'staff').replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-[10px] text-slate-400 font-medium flex items-center justify-between pt-1">
                        <span>Jobs this week:</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">{techWeekJobs.length}</span>
                      </div>
                    </td>

                    {/* 7 Day Timeline Cells */}
                    {weekDays.map((day) => {
                      const dayJobs = techWeekJobs.filter((j) => j.scheduledDate === day.isoDate);
                      const isTargetHovered =
                        dragOverCell?.staffId === tech.id && dragOverCell?.dateStr === day.isoDate;
                      const isOverbooked = dayJobs.length >= 3;

                      return (
                        <td
                          key={day.isoDate}
                          onDragOver={(e) => handleDragOver(e, tech.id, day.isoDate)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, tech.id, day.isoDate)}
                          className={`p-2 vertical-top h-28 border-r border-slate-200/80 dark:border-slate-800/80 last:border-r-0 transition-all ${
                            isTargetHovered
                              ? 'bg-indigo-100/80 dark:bg-indigo-900/40 ring-2 ring-indigo-500 ring-inset'
                              : day.isToday
                              ? 'bg-indigo-50/30 dark:bg-indigo-950/20'
                              : ''
                          }`}
                        >
                          <div className="h-full space-y-1.5 flex flex-col justify-between">
                            {/* Job Cards list */}
                            <div className="space-y-1.5 overflow-y-auto max-h-32 pr-0.5 no-scrollbar">
                              {(dayJobs || []).map((job) => {
                                const cust = (customers || []).find((c) => c.id === job.customerId);

                                return (
                                  <div
                                    key={job.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, job.id)}
                                    onClick={() => setSelectedJob(job)}
                                    className={`p-2 rounded-xl border text-left cursor-grab active:cursor-grabbing hover:scale-[1.02] transition-all shadow-2xs group relative ${getStatusBadgeStyle(
                                      job.status
                                    )}`}
                                  >
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="font-mono font-black text-[10px]">{job.jobId}</span>
                                      <span className="text-[9px] font-extrabold uppercase truncate">
                                        {job.scheduledTime?.split('-')[0] || 'Scheduled'}
                                      </span>
                                    </div>

                                    <p className="text-[11px] font-bold truncate leading-tight mt-0.5">
                                      {(job as any).serviceName || job.description}
                                    </p>

                                    <div className="flex items-center justify-between text-[10px] opacity-80 mt-1">
                                      <span className="truncate">{cust?.name || 'Client'}</span>
                                      <GripVertical className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Drop hint or Overbooked notice */}
                            {dayJobs.length === 0 ? (
                              <div className="text-[10px] text-slate-300 dark:text-slate-700 text-center py-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                                Available
                              </div>
                            ) : isOverbooked ? (
                              <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 text-center bg-amber-50 dark:bg-amber-950/60 rounded-md py-0.5">
                                High Workload ({dayJobs.length} Jobs)
                              </div>
                            ) : null}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Job Quick Detail / Reassign Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                    {selectedJob.jobId} - {(selectedJob as any).serviceName || selectedJob.description}
                  </h3>
                  <span className="text-xs text-slate-500 font-medium capitalize">
                    Status: {selectedJob.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold">Client:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {(customers || []).find((c) => c.id === selectedJob.customerId)?.name || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold">Location:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-indigo-500" /> {selectedJob.location}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold">Priority:</span>
                  <span className="font-bold uppercase text-amber-600">{selectedJob.priority}</span>
                </div>
              </div>

              {/* Quick Reassign Controls */}
              <div className="space-y-2 pt-1">
                <label className="block text-slate-700 dark:text-slate-300 font-bold">
                  Assigned Technician
                </label>
                <select
                  value={selectedJob.assignedStaffId || ''}
                  onChange={(e) => {
                    const newTechId = e.target.value;
                    updateJob(selectedJob.id, { assignedStaffId: newTechId });
                    setSelectedJob({ ...selectedJob, assignedStaffId: newTechId });
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-slate-100 focus:outline-none"
                >
                  <option value="">-- Unassigned --</option>
                  {(staff || []).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s?.name || s?.email || 'Staff'} ({(s?.role || 'staff').replace('_', ' ')})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-slate-700 dark:text-slate-300 font-bold">
                  Scheduled Date
                </label>
                <input
                  type="date"
                  value={selectedJob.scheduledDate}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    updateJob(selectedJob.id, { scheduledDate: newDate });
                    setSelectedJob({ ...selectedJob, scheduledDate: newDate });
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-slate-100 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-slate-700 dark:text-slate-300 font-bold">
                  Scheduled Time Slot
                </label>
                <select
                  value={selectedJob.scheduledTime}
                  onChange={(e) => {
                    const newTime = e.target.value;
                    updateJob(selectedJob.id, { scheduledTime: newTime });
                    setSelectedJob({ ...selectedJob, scheduledTime: newTime });
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-slate-100 focus:outline-none"
                >
                  <option value="09:00 AM - 11:00 AM">09:00 AM - 11:00 AM (Morning Slot)</option>
                  <option value="11:00 AM - 01:00 PM">11:00 AM - 01:00 PM (Midday Slot)</option>
                  <option value="02:00 PM - 04:00 PM">02:00 PM - 04:00 PM (Afternoon Slot)</option>
                  <option value="04:00 PM - 06:00 PM">04:00 PM - 06:00 PM (Evening Slot)</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedJob(null)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                Close & Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

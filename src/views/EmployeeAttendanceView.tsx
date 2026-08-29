import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  AttendanceRecord,
  AttendanceStatus,
  AttendanceIssueType,
  AttendanceIssue,
} from '../types';
import {
  formatDistance,
  formatWorkingDuration,
} from '../utils/geolocation';
import { getEmployeeCode, formatRoleLabel } from '../utils/employeeCode';
import {
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Filter,
  ShieldCheck,
  Building2,
  AlertTriangle,
  History,
  Check,
  X,
  User as UserIcon,
  ChevronLeft,
  ChevronRight,
  Send,
  MessageSquare,
  Sparkles,
  Info,
  CalendarDays,
  FileText,
  BadgeCheck,
  Radio,
  Briefcase,
  Layers,
} from 'lucide-react';

export const EmployeeAttendanceView: React.FC = () => {
  const {
    attendanceRecords,
    attendanceLocations,
    attendanceIssues,
    attendanceWorkingRules,
    currentUser,
    users,
    reportAttendanceIssue,
    showToast,
  } = useApp();

  // Selected Month for Attendance History (e.g., "2026-08")
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  });

  const [activeSubTab, setActiveSubTab] = useState<'history' | 'my_issues'>('history');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchDateQuery, setSearchDateQuery] = useState<string>('');

  // Report Issue Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [selectedRecordForIssue, setSelectedRecordForIssue] = useState<AttendanceRecord | null>(null);
  const [issueDate, setIssueDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [issueType, setIssueType] = useState<AttendanceIssueType>('wrong_check_in');
  const [suggestedCheckIn, setSuggestedCheckIn] = useState<string>('09:30');
  const [suggestedCheckOut, setSuggestedCheckOut] = useState<string>('18:30');
  const [suggestedStatus, setSuggestedStatus] = useState<AttendanceStatus>('present');
  const [issueDescription, setIssueDescription] = useState<string>('');
  const [isSubmittingIssue, setIsSubmittingIssue] = useState<boolean>(false);

  // Helper for India-friendly readable date (e.g., "28 Aug 2026")
  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    if (!y || !m || !d) return dateStr;
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Helper for readable date with weekday (e.g., "Fri, 28 Aug 2026")
  const formatDisplayDateWithWeekday = (dateStr: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    if (!y || !m || !d) return dateStr;
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Format month for display (e.g. "August 2026")
  const formatMonthName = (monthStr: string) => {
    const [y, m] = monthStr.split('-').map(Number);
    if (!y || !m) return monthStr;
    const dt = new Date(y, m - 1, 1);
    return dt.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  };

  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    let prevY = y;
    let prevM = m - 1;
    if (prevM < 1) {
      prevM = 12;
      prevY -= 1;
    }
    setSelectedMonth(`${prevY}-${String(prevM).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    let nextY = y;
    let nextM = m + 1;
    if (nextM > 12) {
      nextM = 1;
      nextY += 1;
    }
    setSelectedMonth(`${nextY}-${String(nextM).padStart(2, '0')}`);
  };

  // Ensure strict self-isolation: Only records matching current employee
  const myAttendanceRecords = useMemo(() => {
    if (!currentUser) return [];
    return attendanceRecords.filter((r) => {
      const matchId = r.staffId === currentUser.id;
      const matchEmail = currentUser.email && r.staffEmail?.toLowerCase() === currentUser.email.toLowerCase();
      return matchId || matchEmail;
    });
  }, [attendanceRecords, currentUser]);

  const myAttendanceIssues = useMemo(() => {
    if (!currentUser) return [];
    return attendanceIssues.filter((i) => {
      const matchId = i.staffId === currentUser.id;
      const matchEmail = currentUser.email && i.staffEmail?.toLowerCase() === currentUser.email.toLowerCase();
      return matchId || matchEmail;
    });
  }, [attendanceIssues, currentUser]);

  // Today's record
  const todayDateStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todayRecord = useMemo(() => {
    return myAttendanceRecords.find((r) => r.date === todayDateStr);
  }, [myAttendanceRecords, todayDateStr]);

  // Records for selected month
  const monthRecords = useMemo(() => {
    return myAttendanceRecords
      .filter((r) => r.date && r.date.startsWith(selectedMonth))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [myAttendanceRecords, selectedMonth]);

  // Filtered records based on status & search
  const filteredMonthRecords = useMemo(() => {
    return monthRecords.filter((r) => {
      if (statusFilter !== 'all') {
        if (statusFilter === 'leave_off') {
          if (r.status !== 'leave' && r.status !== 'holiday' && r.status !== 'weekly_off') return false;
        } else if (r.status !== statusFilter) {
          return false;
        }
      }
      if (searchDateQuery.trim()) {
        const query = searchDateQuery.trim().toLowerCase();
        const readable = formatDisplayDateWithWeekday(r.date).toLowerCase();
        const loc = (r.checkInLocationName || '').toLowerCase();
        if (!r.date.includes(query) && !readable.includes(query) && !loc.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [monthRecords, statusFilter, searchDateQuery]);

  // Monthly stats calculations
  const monthlyStats = useMemo(() => {
    let present = 0;
    let late = 0;
    let halfDay = 0;
    let absent = 0;
    let leaveOff = 0;
    let totalMinutes = 0;

    monthRecords.forEach((r) => {
      if (r.status === 'present') present++;
      else if (r.status === 'late') {
        late++;
        present++; // Late is also a worked day
      } else if (r.status === 'half_day') halfDay++;
      else if (r.status === 'absent') absent++;
      else if (r.status === 'leave' || r.status === 'holiday' || r.status === 'weekly_off') leaveOff++;

      if (r.workingDurationMinutes && r.workingDurationMinutes > 0) {
        totalMinutes += r.workingDurationMinutes;
      }
    });

    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const totalWorkingHoursFormatted = `${hours}h ${mins}m`;

    return {
      totalLogs: monthRecords.length,
      present,
      late,
      halfDay,
      absent,
      leaveOff,
      totalMinutes,
      totalWorkingHoursFormatted,
    };
  }, [monthRecords]);

  // Status Badge Styling Helper
  const getStatusBadge = (status?: AttendanceStatus, workingState?: string) => {
    switch (status) {
      case 'present':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold tracking-wider uppercase bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/80">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            PRESENT
          </span>
        );
      case 'late':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold tracking-wider uppercase bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/80">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            LATE
          </span>
        );
      case 'half_day':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold tracking-wider uppercase bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800/80">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            HALF DAY
          </span>
        );
      case 'absent':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold tracking-wider uppercase bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800/80">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            ABSENT
          </span>
        );
      case 'leave':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold tracking-wider uppercase bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800/80">
            ON LEAVE
          </span>
        );
      case 'holiday':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold tracking-wider uppercase bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800/80">
            HOLIDAY
          </span>
        );
      case 'weekly_off':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold tracking-wider uppercase bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-300 dark:border-stone-700">
            WEEKLY OFF
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold tracking-wider uppercase bg-stone-100 dark:bg-stone-800/60 text-stone-600 dark:text-stone-400 border border-stone-300 dark:border-stone-700">
            NOT CHECKED IN
          </span>
        );
    }
  };

  // Open report issue modal
  const handleOpenReportModal = (record?: AttendanceRecord) => {
    if (record) {
      setSelectedRecordForIssue(record);
      setIssueDate(record.date);
      setSuggestedCheckIn(record.checkInTime || '09:30');
      setSuggestedCheckOut(record.checkOutTime || '18:30');
      setSuggestedStatus(record.status || 'present');
    } else {
      setSelectedRecordForIssue(null);
      setIssueDate(todayDateStr);
      setSuggestedCheckIn('09:30');
      setSuggestedCheckOut('18:30');
      setSuggestedStatus('present');
    }
    setIssueType('wrong_check_in');
    setIssueDescription('');
    setIsReportModalOpen(true);
  };

  // Submit attendance issue
  const handleSubmitIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueDescription.trim() || issueDescription.trim().length < 4) {
      showToast('Please provide a brief explanation of the issue.', 'error');
      return;
    }
    setIsSubmittingIssue(true);
    try {
      const res = await reportAttendanceIssue({
        date: issueDate,
        issueType,
        description: issueDescription,
        attendanceId: selectedRecordForIssue?.id,
        suggestedCheckInTime: suggestedCheckIn,
        suggestedCheckOutTime: suggestedCheckOut,
        suggestedStatus,
      });
      if (res.success) {
        setIsReportModalOpen(false);
        setActiveSubTab('my_issues');
      }
    } finally {
      setIsSubmittingIssue(false);
    }
  };

  const employeeCode = currentUser ? getEmployeeCode(currentUser, users) : '';
  const pendingIssuesCount = myAttendanceIssues.filter((i) => i.status === 'pending').length;

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-16">
      {/* 1. Header Profile Banner */}
      <div className="bg-white dark:bg-slate-900 border border-stone-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'E'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-slate-100 tracking-tight">
                  {currentUser?.name || 'Employee Attendance'}
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  <ShieldCheck className="w-3 h-3" />
                  Read-Only Portal
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
                {employeeCode && <span className="font-semibold text-stone-700 dark:text-slate-300">{employeeCode} · </span>}
                <span>{formatRoleLabel(currentUser?.role)}</span>
                {currentUser?.phone && <span> · {currentUser.phone}</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenReportModal(todayRecord || undefined)}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 text-xs font-semibold transition-colors shadow-xs"
            >
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Report Attendance Issue</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Today's Attendance Highlight Card */}
      <div className="bg-gradient-to-br from-white to-stone-50 dark:from-slate-900 dark:to-slate-900/90 border border-indigo-200/60 dark:border-indigo-900/40 rounded-2xl p-4 sm:p-5 shadow-xs relative overflow-hidden">
        <div className="flex items-center justify-between border-b border-stone-200/60 dark:border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <CalendarDays className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Current Shift Record
              </div>
              <div className="text-sm sm:text-base font-bold text-stone-900 dark:text-slate-100">
                Today — {formatDisplayDate(todayDateStr)}
              </div>
            </div>
          </div>
          <div>{getStatusBadge(todayRecord?.status, todayRecord?.workingState)}</div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {/* Check-In */}
          <div className="p-3 bg-white dark:bg-slate-950/60 rounded-xl border border-stone-200/70 dark:border-slate-800">
            <div className="text-[11px] text-stone-500 dark:text-slate-400 font-medium mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Check-In</span>
            </div>
            <div className="text-sm font-bold text-stone-900 dark:text-slate-100">
              {todayRecord?.checkInTime || '—'}
            </div>
            {todayRecord?.isLate && (
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                +{todayRecord.lateMinutes || 0}m late
              </span>
            )}
          </div>

          {/* Check-Out */}
          <div className="p-3 bg-white dark:bg-slate-950/60 rounded-xl border border-stone-200/70 dark:border-slate-800">
            <div className="text-[11px] text-stone-500 dark:text-slate-400 font-medium mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
              <span>Check-Out</span>
            </div>
            <div className="text-sm font-bold text-stone-900 dark:text-slate-100">
              {todayRecord?.checkOutTime || (todayRecord?.workingState === 'working' ? 'Working...' : '—')}
            </div>
            {todayRecord?.workingState === 'working' && (
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold animate-pulse">
                Shift In Progress
              </span>
            )}
          </div>

          {/* Duration */}
          <div className="p-3 bg-white dark:bg-slate-950/60 rounded-xl border border-stone-200/70 dark:border-slate-800">
            <div className="text-[11px] text-stone-500 dark:text-slate-400 font-medium mb-1 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-indigo-500" />
              <span>Duration</span>
            </div>
            <div className="text-sm font-bold text-stone-900 dark:text-slate-100">
              {todayRecord?.workingDurationFormatted ||
                (todayRecord?.workingDurationMinutes ? formatWorkingDuration(todayRecord.workingDurationMinutes) : '0m')}
            </div>
            <div className="text-[10px] text-stone-400">
              Min Req: {attendanceWorkingRules?.minimumWorkingHours || 8}h
            </div>
          </div>

          {/* Location & GPS */}
          <div className="p-3 bg-white dark:bg-slate-950/60 rounded-xl border border-stone-200/70 dark:border-slate-800">
            <div className="text-[11px] text-stone-500 dark:text-slate-400 font-medium mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-500" />
              <span>Location & GPS</span>
            </div>
            <div className="text-xs font-semibold text-stone-900 dark:text-slate-100 truncate">
              {todayRecord?.checkInLocationName || 'Default Office Location'}
            </div>
            <div className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3 h-3" />
              <span>
                {todayRecord?.checkInVerificationStatus === 'verified'
                  ? 'GPS Verified'
                  : todayRecord?.checkInVerificationStatus === 'manual_correction'
                  ? 'Manual Correction'
                  : 'Location Logged'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Monthly Summary Statistics */}
      <div className="bg-white dark:bg-slate-900 border border-stone-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs">
        {/* Month Selector Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg border border-stone-200 dark:border-slate-700 hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-600 dark:text-slate-300 transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h2 className="text-base font-bold text-stone-900 dark:text-slate-100">
              {formatMonthName(selectedMonth)}
            </h2>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg border border-stone-200 dark:border-slate-700 hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-600 dark:text-slate-300 transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="text-xs text-stone-500 dark:text-slate-400">
            Total Working Hours:{' '}
            <span className="font-bold text-stone-900 dark:text-slate-100 text-sm">
              {monthlyStats.totalWorkingHoursFormatted}
            </span>
          </div>
        </div>

        {/* 5-Metric Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/50">
            <div className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">Present Days</div>
            <div className="text-lg font-black text-emerald-700 dark:text-emerald-400 mt-0.5">
              {monthlyStats.present}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50">
            <div className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">Late Arrivals</div>
            <div className="text-lg font-black text-amber-700 dark:text-amber-400 mt-0.5">
              {monthlyStats.late}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-900/50">
            <div className="text-[11px] font-semibold text-purple-800 dark:text-purple-300">Half Days</div>
            <div className="text-lg font-black text-purple-700 dark:text-purple-400 mt-0.5">
              {monthlyStats.halfDay}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/50">
            <div className="text-[11px] font-semibold text-rose-800 dark:text-rose-300">Absent Days</div>
            <div className="text-lg font-black text-rose-700 dark:text-rose-400 mt-0.5">
              {monthlyStats.absent}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50 col-span-2 sm:col-span-1">
            <div className="text-[11px] font-semibold text-blue-800 dark:text-blue-300">Leave / Off</div>
            <div className="text-lg font-black text-blue-700 dark:text-blue-400 mt-0.5">
              {monthlyStats.leaveOff}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Subtabs: Attendance History vs Reported Issues */}
      <div className="flex items-center gap-2 border-b border-stone-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveSubTab('history')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
            activeSubTab === 'history'
              ? 'bg-stone-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
              : 'text-stone-600 dark:text-slate-400 hover:bg-stone-100 dark:hover:bg-slate-800'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Attendance History ({monthRecords.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('my_issues')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
            activeSubTab === 'my_issues'
              ? 'bg-stone-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
              : 'text-stone-600 dark:text-slate-400 hover:bg-stone-100 dark:hover:bg-slate-800'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>My Reported Issues</span>
          {pendingIssuesCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold">
              {pendingIssuesCount}
            </span>
          )}
        </button>
      </div>

      {/* 5. TAB A: ATTENDANCE HISTORY */}
      {activeSubTab === 'history' && (
        <div className="space-y-3">
          {/* Filter Pills */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'all', label: 'All Status' },
                { id: 'present', label: 'Present' },
                { id: 'late', label: 'Late' },
                { id: 'half_day', label: 'Half Day' },
                { id: 'absent', label: 'Absent' },
                { id: 'leave_off', label: 'Leave / Off' },
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setStatusFilter(pill.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    statusFilter === pill.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-stone-600 dark:text-slate-300 border border-stone-200 dark:border-slate-700 hover:bg-stone-50 dark:hover:bg-slate-750'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            <div className="text-xs text-stone-500 dark:text-slate-400">
              Showing {filteredMonthRecords.length} records
            </div>
          </div>

          {/* List of Attendance Cards (Mobile-first compact stack) */}
          {filteredMonthRecords.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-stone-200/80 dark:border-slate-800 rounded-2xl p-8 text-center">
              <Calendar className="w-10 h-10 text-stone-400 mx-auto mb-2 opacity-50" />
              <h3 className="text-sm font-bold text-stone-800 dark:text-slate-200">
                No Attendance Records Found
              </h3>
              <p className="text-xs text-stone-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                No attendance logs found for {formatMonthName(selectedMonth)} with the selected status filter.
              </p>
              <button
                onClick={() => handleOpenReportModal()}
                className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-xs"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Report Missing Attendance</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredMonthRecords.map((record) => {
                const isToday = record.date === todayDateStr;
                return (
                  <div
                    key={record.id}
                    className={`bg-white dark:bg-slate-900 border rounded-2xl p-3.5 sm:p-4 transition-shadow hover:shadow-xs ${
                      isToday
                        ? 'border-indigo-300 dark:border-indigo-800/80 ring-1 ring-indigo-500/20'
                        : 'border-stone-200/80 dark:border-slate-800'
                    }`}
                  >
                    {/* Date Header */}
                    <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-stone-100 dark:border-slate-800/60">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span className="text-xs sm:text-sm font-bold text-stone-900 dark:text-slate-100">
                          {formatDisplayDateWithWeekday(record.date)}
                        </span>
                        {isToday && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                            Today
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-stone-400">
                        {record.workingState === 'completed'
                          ? 'Shift Completed'
                          : record.workingState === 'working'
                          ? 'In Progress'
                          : 'Not Checked In'}
                      </div>
                    </div>

                    {/* Middle Info Container: Time + Duration in one clean row */}
                    <div className="bg-stone-50 dark:bg-slate-800/50 rounded-xl p-3 border border-stone-200/60 dark:border-slate-700/60 mb-2.5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <Clock className="w-4 h-4 text-stone-500 shrink-0" />
                          <div className="text-xs sm:text-sm font-bold text-stone-900 dark:text-slate-100 truncate">
                            {record.checkInTime ? (
                              <span>
                                {record.checkInTime}{' '}
                                <span className="text-stone-400 font-normal">→</span>{' '}
                                {record.checkOutTime || (record.workingState === 'working' ? 'Working...' : '—')}
                              </span>
                            ) : (
                              <span className="text-stone-400 font-normal italic">Not checked in</span>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-xs sm:text-sm font-bold text-stone-900 dark:text-slate-100">
                            {record.workingDurationFormatted ||
                              (record.workingDurationMinutes
                                ? formatWorkingDuration(record.workingDurationMinutes)
                                : '0m')}
                          </div>
                          <div className="text-[10px] text-stone-400 font-medium">Duration</div>
                        </div>
                      </div>

                      {/* Location & GPS line */}
                      {(record.checkInLocationName || record.checkInAddress) && (
                        <div className="flex items-center gap-1.5 text-[11px] text-stone-600 dark:text-slate-400 mt-2 pt-2 border-t border-stone-200/40 dark:border-slate-700/40">
                          <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                          <span className="truncate">
                            {record.checkInLocationName || record.checkInAddress}
                          </span>
                          {record.checkInDistance !== undefined && (
                            <span className="text-stone-400 shrink-0">
                              · Within {formatDistance(record.checkInDistance)}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Manual correction note */}
                      {record.manualCorrection && (
                        <div className="mt-1.5 text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2 py-1 rounded-md border border-amber-200 dark:border-amber-900/50 flex items-center gap-1">
                          <Info className="w-3 h-3 shrink-0" />
                          <span className="truncate">
                            Admin Note: {record.manualCorrection.reason} ({record.manualCorrection.correctedByName})
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Row: Status Badge (Left) + Report Issue (Right) */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <div>{getStatusBadge(record.status, record.workingState)}</div>

                      <button
                        onClick={() => handleOpenReportModal(record)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-stone-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-stone-200 dark:hover:border-slate-700"
                        title="Report a discrepancy for this date"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-stone-400" />
                        <span>Report Issue</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 6. TAB B: MY REPORTED ISSUES */}
      {activeSubTab === 'my_issues' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-900 dark:text-slate-100">
              Submitted Attendance Requests ({myAttendanceIssues.length})
            </h3>
            <button
              onClick={() => handleOpenReportModal()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-xs"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Report New Issue</span>
            </button>
          </div>

          {myAttendanceIssues.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-stone-200/80 dark:border-slate-800 rounded-2xl p-8 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-60" />
              <h3 className="text-sm font-bold text-stone-800 dark:text-slate-200">
                No Reported Issues
              </h3>
              <p className="text-xs text-stone-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                You have not reported any attendance discrepancies. If your check-in time or status was marked incorrectly, use the Report Issue button.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {myAttendanceIssues.map((issue) => (
                <div
                  key={issue.id}
                  className="bg-white dark:bg-slate-900 border border-stone-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span className="text-xs sm:text-sm font-bold text-stone-900 dark:text-slate-100">
                        Date: {formatDisplayDateWithWeekday(issue.date)}
                      </span>
                    </div>

                    {issue.status === 'pending' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Pending Admin Review
                      </span>
                    )}
                    {issue.status === 'resolved' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                        <Check className="w-3 h-3" />
                        Approved & Updated
                      </span>
                    )}
                    {issue.status === 'rejected' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                        <X className="w-3 h-3" />
                        Rejected
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-stone-700 dark:text-slate-300 bg-stone-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-stone-200/60 dark:border-slate-700/60">
                    <div className="font-semibold text-stone-900 dark:text-slate-100 mb-0.5 capitalize">
                      Issue: {issue.issueType.replace(/_/g, ' ')}
                    </div>
                    <p className="text-stone-600 dark:text-slate-400">{issue.description}</p>

                    {(issue.suggestedCheckInTime || issue.suggestedCheckOutTime || issue.suggestedStatus) && (
                      <div className="mt-2 pt-2 border-t border-stone-200/60 dark:border-slate-700/60 flex flex-wrap gap-3 text-[11px] text-stone-500">
                        {issue.suggestedCheckInTime && (
                          <span>Suggested In: <b className="text-stone-800 dark:text-slate-200">{issue.suggestedCheckInTime}</b></span>
                        )}
                        {issue.suggestedCheckOutTime && (
                          <span>Suggested Out: <b className="text-stone-800 dark:text-slate-200">{issue.suggestedCheckOutTime}</b></span>
                        )}
                        {issue.suggestedStatus && (
                          <span>Suggested Status: <b className="text-stone-800 dark:text-slate-200 uppercase">{issue.suggestedStatus}</b></span>
                        )}
                      </div>
                    )}
                  </div>

                  {issue.resolutionNotes && (
                    <div className="text-[11px] text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 p-2 rounded-lg border border-indigo-200 dark:border-indigo-900/60 flex items-start gap-1.5">
                      <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Admin Response ({issue.resolvedByName || 'Owner'}): </span>
                        <span>{issue.resolutionNotes}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 7. REPORT ATTENDANCE ISSUE MODAL */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-stone-200 dark:border-slate-800 flex items-center justify-between bg-stone-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900 dark:text-slate-100">
                    Report Attendance Issue
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-slate-400">
                    Submit a correction request to Business Owner / Admin
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-slate-200 hover:bg-stone-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitIssue} className="p-5 space-y-4 text-xs">
              {/* Date & Issue Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 dark:text-slate-300 font-semibold mb-1">
                    Attendance Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={issueDate}
                    max={todayDateStr}
                    onChange={(e) => setIssueDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-stone-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden font-medium"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-slate-300 font-semibold mb-1">
                    Issue Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={issueType}
                    onChange={(e) => setIssueType(e.target.value as AttendanceIssueType)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-stone-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden font-medium"
                  >
                    <option value="wrong_check_in">Wrong Check-In Time</option>
                    <option value="wrong_check_out">Wrong Check-Out Time</option>
                    <option value="wrong_status">Status Marked Incorrectly</option>
                    <option value="gps_issue">GPS / Geofence Location Error</option>
                    <option value="missed_check_in_out">Forgot to Check-In / Out</option>
                    <option value="duration_incorrect">Duration Calculation Discrepancy</option>
                    <option value="leave_adjustment">Leave / Off Adjustment</option>
                    <option value="other">Other Reason</option>
                  </select>
                </div>
              </div>

              {/* Suggested Check-In & Check-Out times */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-stone-50 dark:bg-slate-800/40 rounded-xl border border-stone-200/60 dark:border-slate-700/60">
                <div>
                  <label className="block text-stone-600 dark:text-slate-400 font-medium mb-1">
                    Actual Check-In
                  </label>
                  <input
                    type="time"
                    value={suggestedCheckIn}
                    onChange={(e) => setSuggestedCheckIn(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-stone-900 dark:text-slate-100 outline-hidden font-medium"
                  />
                </div>

                <div>
                  <label className="block text-stone-600 dark:text-slate-400 font-medium mb-1">
                    Actual Check-Out
                  </label>
                  <input
                    type="time"
                    value={suggestedCheckOut}
                    onChange={(e) => setSuggestedCheckOut(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-stone-900 dark:text-slate-100 outline-hidden font-medium"
                  />
                </div>

                <div>
                  <label className="block text-stone-600 dark:text-slate-400 font-medium mb-1">
                    Correct Status
                  </label>
                  <select
                    value={suggestedStatus}
                    onChange={(e) => setSuggestedStatus(e.target.value as AttendanceStatus)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-stone-900 dark:text-slate-100 outline-hidden font-medium capitalize"
                  >
                    <option value="present">Present</option>
                    <option value="half_day">Half Day</option>
                    <option value="leave">Leave</option>
                    <option value="holiday">Holiday</option>
                    <option value="weekly_off">Weekly Off</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-stone-700 dark:text-slate-300 font-semibold mb-1">
                  Reason & Details <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  placeholder="Explain why the record was incorrect (e.g. 'I was at customer job site JOB-1029 on time at 9:30 AM but phone network was down...')"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-stone-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden placeholder:text-stone-400 resize-none font-normal"
                />
              </div>

              {/* Notice */}
              <div className="text-[11px] text-stone-500 dark:text-slate-400 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>
                  This report will be sent to your Business Owner / Manager for review and correction.
                </span>
              </div>

              {/* Submit & Cancel */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 dark:border-slate-700 text-stone-700 dark:text-slate-300 font-semibold hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingIssue}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
                >
                  {isSubmittingIssue ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Submit Issue Report</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

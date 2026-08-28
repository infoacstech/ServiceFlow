import React, { useState, useMemo } from 'react';
import { User, AttendanceRecord } from '../types';
import { formatWorkingDuration, formatDistance } from '../utils/geolocation';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Download,
  X,
  Phone,
  Mail,
  Building2,
  CalendarDays,
  FileSpreadsheet,
} from 'lucide-react';

interface StaffAttendanceHistoryModalProps {
  staffMember: User | null;
  isOpen: boolean;
  onClose: () => void;
  attendanceRecords: AttendanceRecord[];
  onOpenCorrection?: (record: AttendanceRecord) => void;
  isOwnerOrAdmin?: boolean;
}

export const StaffAttendanceHistoryModal: React.FC<StaffAttendanceHistoryModalProps> = ({
  staffMember,
  isOpen,
  onClose,
  attendanceRecords,
  onOpenCorrection,
  isOwnerOrAdmin,
}) => {
  // Selected Month & Year (Default: current month YYYY-MM)
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  if (!isOpen || !staffMember) return null;

  // Month navigation helpers
  const handlePrevMonth = () => {
    const [yearStr, monthStr] = selectedMonth.split('-');
    let year = parseInt(yearStr, 10);
    let month = parseInt(monthStr, 10) - 1;
    if (month < 1) {
      month = 12;
      year -= 1;
    }
    setSelectedMonth(`${year}-${String(month).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const [yearStr, monthStr] = selectedMonth.split('-');
    let year = parseInt(yearStr, 10);
    let month = parseInt(monthStr, 10) + 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
    setSelectedMonth(`${year}-${String(month).padStart(2, '0')}`);
  };

  // Month label (e.g., "August 2026")
  const monthDisplay = useMemo(() => {
    const [y, m] = selectedMonth.split('-');
    const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  }, [selectedMonth]);

  // Filter records for this staff and this month
  const staffMonthRecords = useMemo(() => {
    return (attendanceRecords || [])
      .filter((r) => {
        const matchesStaff =
          r.staffId === staffMember.id ||
          (staffMember.email && r.staffEmail?.toLowerCase() === staffMember.email.toLowerCase());
        const matchesMonth = r.date && r.date.startsWith(selectedMonth);
        return matchesStaff && matchesMonth;
      })
      .sort((a, b) => (b.date > a.date ? 1 : -1));
  }, [attendanceRecords, staffMember, selectedMonth]);

  // Calculate Monthly KPIs
  const monthlyStats = useMemo(() => {
    let presentCount = 0;
    let lateCount = 0;
    let halfDayCount = 0;
    let absentCount = 0;
    let leaveCount = 0;
    let totalDurationMinutes = 0;

    staffMonthRecords.forEach((r) => {
      if (r.status === 'present') presentCount++;
      else if (r.status === 'late') {
        lateCount++;
        presentCount++;
      } else if (r.status === 'half_day') {
        halfDayCount++;
      } else if (r.status === 'absent') {
        absentCount++;
      } else if (r.status === 'leave' || r.status === 'holiday' || r.status === 'weekly_off') {
        leaveCount++;
      }

      if (r.workingDurationMinutes) {
        totalDurationMinutes += r.workingDurationMinutes;
      }
    });

    const totalRecordedDays = staffMonthRecords.length;
    const avgDailyMinutes =
      totalRecordedDays > 0 ? Math.round(totalDurationMinutes / totalRecordedDays) : 0;

    return {
      totalRecordedDays,
      presentCount,
      lateCount,
      halfDayCount,
      absentCount,
      leaveCount,
      totalDurationMinutes,
      avgDailyMinutes,
    };
  }, [staffMonthRecords]);

  // Export Staff Monthly CSV
  const handleExportStaffCSV = () => {
    const headers = [
      'Date',
      'Staff Name',
      'Role',
      'Status',
      'Working State',
      'Check-In Time',
      'Check-In Location',
      'Check-In Distance',
      'Check-Out Time',
      'Check-Out Location',
      'Duration (Minutes)',
      'Duration Formatted',
      'Late Arrival',
    ];

    const rows = staffMonthRecords.map((r) => [
      r.date || '',
      `"${staffMember.name}"`,
      staffMember.role || 'staff',
      r.status,
      r.workingState,
      r.checkInTime || '',
      `"${r.checkInLocationName || ''}"`,
      r.checkInDistance !== undefined ? `${r.checkInDistance}m` : '',
      r.checkOutTime || '',
      `"${r.checkOutLocationName || ''}"`,
      r.workingDurationMinutes || 0,
      formatWorkingDuration(r.workingDurationMinutes),
      r.isLate ? `Late by ${r.lateMinutes}m` : 'On Time',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `attendance_${staffMember.name.toLowerCase().replace(/\s+/g, '_')}_${selectedMonth}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-md shadow-indigo-600/30 shrink-0">
              {staffMember.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 truncate">
                  {staffMember.name}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 shrink-0">
                  {staffMember.role?.replace('_', ' ')}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {staffMember.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" /> {staffMember.phone}
                  </span>
                )}
                {staffMember.email && (
                  <span className="flex items-center gap-1 truncate">
                    <Mail className="w-3 h-3 text-slate-400" /> {staffMember.email}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportStaffCSV}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Export
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Month Selector & Controls */}
        <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              <span>{monthDisplay}</span>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
            {staffMonthRecords.length} recorded session{staffMonthRecords.length !== 1 ? 's' : ''} in {monthDisplay}
          </div>
        </div>

        {/* Modal Body: Scrollable Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Monthly KPI Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5">
            <div className="p-3 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/50">
              <div className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-300">
                Present Days
              </div>
              <div className="text-lg font-black text-emerald-950 dark:text-emerald-100 mt-0.5">
                {monthlyStats.presentCount}
              </div>
              <div className="text-[9px] text-emerald-600">On duty</div>
            </div>

            <div className="p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/50">
              <div className="text-[10px] font-bold uppercase text-amber-700 dark:text-amber-300">
                Late Days
              </div>
              <div className="text-lg font-black text-amber-950 dark:text-amber-100 mt-0.5">
                {monthlyStats.lateCount}
              </div>
              <div className="text-[9px] text-amber-600">After shift start</div>
            </div>

            <div className="p-3 rounded-2xl bg-sky-50/80 dark:bg-sky-950/40 border border-sky-200/60 dark:border-sky-900/50">
              <div className="text-[10px] font-bold uppercase text-sky-700 dark:text-sky-300">
                Half Days
              </div>
              <div className="text-lg font-black text-sky-950 dark:text-sky-100 mt-0.5">
                {monthlyStats.halfDayCount}
              </div>
              <div className="text-[9px] text-sky-600">&lt; threshold hrs</div>
            </div>

            <div className="p-3 rounded-2xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/50">
              <div className="text-[10px] font-bold uppercase text-rose-700 dark:text-rose-300">
                Absent
              </div>
              <div className="text-lg font-black text-rose-950 dark:text-rose-100 mt-0.5">
                {monthlyStats.absentCount}
              </div>
              <div className="text-[9px] text-rose-600">No punch</div>
            </div>

            <div className="p-3 rounded-2xl bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-900/50">
              <div className="text-[10px] font-bold uppercase text-purple-700 dark:text-purple-300">
                Leaves
              </div>
              <div className="text-lg font-black text-purple-950 dark:text-purple-100 mt-0.5">
                {monthlyStats.leaveCount}
              </div>
              <div className="text-[9px] text-purple-600">Approved off</div>
            </div>

            <div className="p-3 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/50">
              <div className="text-[10px] font-bold uppercase text-indigo-700 dark:text-indigo-300">
                Total Hours
              </div>
              <div className="text-lg font-black text-indigo-950 dark:text-indigo-100 mt-0.5">
                {formatWorkingDuration(monthlyStats.totalDurationMinutes)}
              </div>
              <div className="text-[9px] text-indigo-600">
                Avg {formatWorkingDuration(monthlyStats.avgDailyMinutes)}/day
              </div>
            </div>
          </div>

          {/* Records List for the Month */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Daily Attendance Breakdown
            </h3>

            {staffMonthRecords.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <CalendarDays className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  No attendance records for {monthDisplay}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Records will appear here once check-ins or leaves are registered for this staff member.
                </p>
              </div>
            ) : (
              staffMonthRecords.map((rec) => {
                const dateObj = new Date(rec.date + 'T00:00:00');
                const formattedDate = dateObj.toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  weekday: 'short',
                });

                return (
                  <div
                    key={rec.id}
                    className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                  >
                    {/* Left: Date & Status */}
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-center min-w-[58px] shrink-0">
                        <div className="text-[10px] uppercase font-bold text-slate-400">
                          {dateObj.toLocaleDateString('en-GB', { weekday: 'short' })}
                        </div>
                        <div className="text-sm font-black text-slate-900 dark:text-slate-100">
                          {dateObj.getDate()}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100">
                            {formattedDate}
                          </span>

                          {rec.workingState === 'working' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Working
                            </span>
                          ) : rec.status === 'present' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              PRESENT
                            </span>
                          ) : rec.status === 'late' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300">
                              LATE ({rec.lateMinutes || 15}m)
                            </span>
                          ) : rec.status === 'half_day' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                              HALF DAY
                            </span>
                          ) : rec.status === 'leave' || rec.status === 'holiday' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                              {rec.status.toUpperCase()}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                              {rec.status.toUpperCase()}
                            </span>
                          )}
                        </div>

                        {/* Location / Geofence Info */}
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-slate-500 mt-1">
                          {rec.checkInLocationName && (
                            <span className="flex items-center gap-1 truncate max-w-[200px]">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {rec.checkInLocationName}
                            </span>
                          )}
                          {rec.checkInDistance !== undefined && (
                            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[10px]">
                              <ShieldCheck className="w-3 h-3" />
                              Within {formatDistance(rec.checkInDistance)}
                            </span>
                          )}
                          {rec.manualCorrection && (
                            <span className="text-[10px] font-bold text-purple-600 bg-purple-50 dark:bg-purple-950 px-1.5 py-0.2 rounded border border-purple-200">
                              Corrected
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Check-In, Check-Out, Duration */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 text-xs pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                      <div className="text-left sm:text-right">
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">Shift</div>
                        <div className="font-extrabold text-slate-900 dark:text-slate-100">
                          {rec.checkInTime || '—'} → {rec.checkOutTime || (rec.workingState === 'working' ? 'Active' : '—')}
                        </div>
                      </div>

                      <div className="text-right min-w-[70px]">
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">Duration</div>
                        <div className="font-black text-slate-900 dark:text-slate-100 font-mono">
                          {rec.workingDurationMinutes
                            ? formatWorkingDuration(rec.workingDurationMinutes)
                            : rec.workingState === 'working'
                            ? 'Live'
                            : '—'}
                        </div>
                      </div>

                      {isOwnerOrAdmin && onOpenCorrection && (
                        <button
                          type="button"
                          onClick={() => onOpenCorrection(rec)}
                          className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-600 dark:text-slate-300 hover:text-indigo-600 font-bold text-[10px] transition-all cursor-pointer"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400">
            {monthlyStats.presentCount} present • {monthlyStats.lateCount} late • {monthlyStats.absentCount} absent
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold hover:opacity-90 transition-opacity cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

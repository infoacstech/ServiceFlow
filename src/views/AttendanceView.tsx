import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  AttendanceRecord,
  AttendanceStatus,
  AttendanceLocation,
  AttendanceLocationType,
  User,
} from '../types';
import {
  formatDistance,
  formatWorkingDuration,
} from '../utils/geolocation';
import { StaffAttendanceHistoryModal } from '../components/StaffAttendanceHistoryModal';
import { SearchableStaffSelect } from '../components/SearchableStaffSelect';
import { getEmployeeCode, formatRoleLabel } from '../utils/employeeCode';
import {
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Play,
  Square,
  Search,
  Calendar,
  Filter,
  Plus,
  Edit2,
  Trash2,
  ShieldCheck,
  Building2,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  History,
  Sliders,
  Check,
  X,
  User as UserIcon,
  Users,
  Navigation,
  Sparkles,
  Info,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  CalendarDays,
  CalendarRange,
  Eye,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
} from 'lucide-react';

export const AttendanceView: React.FC = () => {
  const {
    attendanceRecords,
    attendanceLocations,
    attendanceWorkingRules,
    attendanceAuditLogs,
    staff,
    currentBusiness,
    currentUser,
    manualCorrectAttendance,
    markStaffLeaveOrHoliday,
    addAttendanceLocation,
    updateAttendanceLocation,
    deleteAttendanceLocation,
    updateAttendanceWorkingRules,
    showToast,
  } = useApp();

  const isOwnerOrAdmin =
    currentUser?.role === 'business_owner' || currentUser?.role === 'super_admin';

  // Navigation tab within Attendance Dashboard
  const [activeTab, setActiveTab] = useState<'roster' | 'history' | 'locations' | 'rules' | 'audit'>('roster');

  // Filter state for Daily Roster
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [filterStaffId, setFilterStaffId] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Staff Attendance History Modal State
  const [selectedStaffForHistory, setSelectedStaffForHistory] = useState<User | null>(null);
  const [isStaffHistoryModalOpen, setIsStaffHistoryModalOpen] = useState<boolean>(false);

  // Filter state for Attendance History (Default: Current Month)
  const [historyStartDate, setHistoryStartDate] = useState<string>(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}-01`;
  });
  const [historyEndDate, setHistoryEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [historyStaffId, setHistoryStaffId] = useState<string>('all');
  const [historyStatus, setHistoryStatus] = useState<string>('all');
  const [historySearchQuery, setHistorySearchQuery] = useState<string>('');
  const [isHistoryFiltersOpen, setIsHistoryFiltersOpen] = useState<boolean>(true);

  // Active filter count for Attendance History
  const activeHistoryFilterCount = useMemo(() => {
    let count = 0;
    if (historyStaffId !== 'all') count++;
    if (historyStatus !== 'all') count++;
    if (historySearchQuery.trim() !== '') count++;
    return count;
  }, [historyStaffId, historyStatus, historySearchQuery]);

  // Modals
  const [correctionModalRecord, setCorrectionModalRecord] = useState<AttendanceRecord | null>(null);
  const [correctionStatus, setCorrectionStatus] = useState<AttendanceStatus>('present');
  const [correctionCheckIn, setCorrectionCheckIn] = useState<string>('09:30');
  const [correctionCheckOut, setCorrectionCheckOut] = useState<string>('18:30');
  const [correctionDuration, setCorrectionDuration] = useState<number>(540);
  const [correctionReason, setCorrectionReason] = useState<string>('');
  const [isSubmittingCorrection, setIsSubmittingCorrection] = useState<boolean>(false);

  // Add/Edit Location Modal
  const [isLocationModalOpen, setIsLocationModalOpen] = useState<boolean>(false);
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
  const [locName, setLocName] = useState<string>('');
  const [locType, setLocType] = useState<AttendanceLocationType>('office');
  const [locAddress, setLocAddress] = useState<string>('');
  const [locLat, setLocLat] = useState<number>(28.6139);
  const [locLng, setLocLng] = useState<number>(77.209);
  const [locRadius, setLocRadius] = useState<number>(150);
  const [locIsDefault, setLocIsDefault] = useState<boolean>(false);

  // Leave Marking Modal
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState<boolean>(false);
  const [leaveStaffId, setLeaveStaffId] = useState<string>(staff[0]?.id || '');
  const [leaveDate, setLeaveDate] = useState<string>(selectedDate);
  const [leaveType, setLeaveType] = useState<'leave' | 'holiday' | 'weekly_off'>('leave');
  const [leaveNotes, setLeaveNotes] = useState<string>('');

  // Rules form state
  const [rulesWorkStart, setRulesWorkStart] = useState<string>(
    attendanceWorkingRules?.workStartTime || '09:30'
  );
  const [rulesWorkEnd, setRulesWorkEnd] = useState<string>(
    attendanceWorkingRules?.workEndTime || '18:30'
  );
  const [rulesGraceMins, setRulesGraceMins] = useState<number>(
    attendanceWorkingRules?.gracePeriodMinutes || 15
  );
  const [rulesHalfDayMins, setRulesHalfDayMins] = useState<number>(
    attendanceWorkingRules?.halfDayThresholdMinutes || 240
  );
  const [rulesGpsEnforce, setRulesGpsEnforce] = useState<boolean>(
    attendanceWorkingRules?.requireGPSVerification ?? true
  );
  const [rulesAllowFieldJob, setRulesAllowFieldJob] = useState<boolean>(
    attendanceWorkingRules?.allowFieldJobCheckIn ?? true
  );

  // Preset Date Range Helpers for History
  const setHistoryPreset = (preset: 'this_month' | 'last_month' | 'last_7_days' | 'last_30_days') => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (preset === 'this_month') {
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      setHistoryStartDate(`${y}-${m}-01`);
      setHistoryEndDate(todayStr);
    } else if (preset === 'last_month') {
      const firstDayPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      setHistoryStartDate(firstDayPrevMonth.toISOString().split('T')[0]);
      setHistoryEndDate(lastDayPrevMonth.toISOString().split('T')[0]);
    } else if (preset === 'last_7_days') {
      const past7 = new Date();
      past7.setDate(past7.getDate() - 6);
      setHistoryStartDate(past7.toISOString().split('T')[0]);
      setHistoryEndDate(todayStr);
    } else if (preset === 'last_30_days') {
      const past30 = new Date();
      past30.setDate(past30.getDate() - 29);
      setHistoryStartDate(past30.toISOString().split('T')[0]);
      setHistoryEndDate(todayStr);
    }
  };

  // Previous / Next Month Navigator for History
  const handleHistoryShiftMonth = (direction: 'prev' | 'next') => {
    const baseDate = new Date(historyStartDate + 'T00:00:00');
    const newMonth = direction === 'prev' ? baseDate.getMonth() - 1 : baseDate.getMonth() + 1;
    const targetFirst = new Date(baseDate.getFullYear(), newMonth, 1);
    const targetLast = new Date(baseDate.getFullYear(), newMonth + 1, 0);

    setHistoryStartDate(targetFirst.toISOString().split('T')[0]);
    setHistoryEndDate(targetLast.toISOString().split('T')[0]);
  };

  const handleClearHistoryFilters = () => {
    setHistoryPreset('this_month');
    setHistoryStaffId('all');
    setHistoryStatus('all');
    setHistorySearchQuery('');
  };

  // Filtered records for History View
  const historyFilteredRecords = useMemo(() => {
    return (attendanceRecords || [])
      .filter((r) => {
        // Date Range
        if (historyStartDate && r.date < historyStartDate) return false;
        if (historyEndDate && r.date > historyEndDate) return false;

        // Staff Member Filter
        if (historyStaffId !== 'all') {
          const staffObj = staff.find((s) => s.id === historyStaffId);
          const matchesStaff =
            r.staffId === historyStaffId ||
            (staffObj?.email && r.staffEmail?.toLowerCase() === staffObj.email.toLowerCase());
          if (!matchesStaff) return false;
        }

        // Status Filter
        if (historyStatus !== 'all') {
          if (historyStatus === 'working' && r.workingState !== 'working') return false;
          if (historyStatus === 'completed' && r.workingState !== 'completed') return false;
          if (historyStatus === 'present' && r.status !== 'present') return false;
          if (historyStatus === 'late' && r.status !== 'late') return false;
          if (historyStatus === 'half_day' && r.status !== 'half_day') return false;
          if (historyStatus === 'absent' && r.status !== 'absent') return false;
          if (historyStatus === 'leave' && !['leave', 'holiday', 'weekly_off'].includes(r.status)) return false;
        }

        // Search Query (Matches Name, Employee Code, Phone, Role, Location, Notes)
        if (historySearchQuery.trim()) {
          const q = historySearchQuery.toLowerCase();
          const cleanDigits = q.replace(/[^0-9]/g, '');
          const staffObj = staff.find((s) => s.id === r.staffId || (s.email && r.staffEmail?.toLowerCase() === s.email.toLowerCase()));
          const empCode = (r.staffEmployeeCode || getEmployeeCode(staffObj, staff)).toLowerCase();
          const empCodeDigits = empCode.replace(/[^0-9]/g, '');
          const phoneDigits = (r.staffPhone || staffObj?.phone || '').replace(/[^0-9]/g, '');

          const matchName = r.staffName?.toLowerCase().includes(q);
          const matchCode = empCode.includes(q) || (cleanDigits && empCodeDigits.includes(cleanDigits));
          const matchPhone = cleanDigits && phoneDigits.includes(cleanDigits);
          const matchRole = r.staffRole?.toLowerCase().includes(q);
          const matchLoc =
            r.checkInLocationName?.toLowerCase().includes(q) ||
            r.checkOutLocationName?.toLowerCase().includes(q);
          const matchNotes =
            r.checkInNotes?.toLowerCase().includes(q) ||
            r.manualCorrection?.reason?.toLowerCase().includes(q);
          if (!matchName && !matchCode && !matchPhone && !matchRole && !matchLoc && !matchNotes) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (b.date !== a.date) {
          return b.date > a.date ? 1 : -1;
        }
        return (b.checkInTime || '').localeCompare(a.checkInTime || '');
      });
  }, [
    attendanceRecords,
    historyStartDate,
    historyEndDate,
    historyStaffId,
    historyStatus,
    historySearchQuery,
    staff,
  ]);

  // Group History Records by Date
  const historyGroupedByDate = useMemo(() => {
    const groups: { date: string; records: AttendanceRecord[] }[] = [];
    const map = new Map<string, AttendanceRecord[]>();

    historyFilteredRecords.forEach((r) => {
      const d = r.date || 'Unknown Date';
      if (!map.has(d)) {
        map.set(d, []);
      }
      map.get(d)!.push(r);
    });

    const sortedDates = Array.from(map.keys()).sort((a, b) => (b > a ? 1 : -1));
    sortedDates.forEach((date) => {
      groups.push({ date, records: map.get(date)! });
    });

    return groups;
  }, [historyFilteredRecords]);

  // History KPIs Summary
  const historyKpis = useMemo(() => {
    const uniqueDates = new Set<string>();
    let presentCount = 0;
    let lateCount = 0;
    let halfDayCount = 0;
    let absentCount = 0;
    let leaveCount = 0;
    let totalDurationMinutes = 0;

    historyFilteredRecords.forEach((r) => {
      if (r.date) uniqueDates.add(r.date);
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

    return {
      workingDays: uniqueDates.size,
      totalRecords: historyFilteredRecords.length,
      presentCount,
      lateCount,
      halfDayCount,
      absentCount,
      leaveCount,
      totalDurationMinutes,
    };
  }, [historyFilteredRecords]);

  // Helper to open staff attendance history
  const handleOpenStaffHistory = (staffId: string, staffName?: string, staffEmail?: string) => {
    let found = staff.find((s) => s.id === staffId);
    if (!found && staffEmail) {
      found = staff.find((s) => s.email?.toLowerCase() === staffEmail.toLowerCase());
    }
    if (!found) {
      found = {
        id: staffId,
        businessId: currentBusiness?.id || 'biz-default',
        name: staffName || 'Staff Member',
        email: staffEmail || '',
        phone: '',
        role: 'technician',
        status: 'active',
        skills: [],
        joiningDate: new Date().toISOString().split('T')[0],
      };
    }
    setSelectedStaffForHistory(found);
    setIsStaffHistoryModalOpen(true);
  };

  // Export History CSV
  const handleExportHistoryCSV = () => {
    const headers = [
      'Date',
      'Staff Name',
      'Staff Role',
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
      'Notes / Reason',
    ];

    const rows = historyFilteredRecords.map((r) => [
      r.date || '',
      `"${r.staffName || ''}"`,
      r.staffRole || 'technician',
      r.status,
      r.workingState,
      r.checkInTime || '',
      `"${r.checkInLocationName || ''}"`,
      r.checkInDistance !== undefined ? `${r.checkInDistance}m` : '',
      r.checkOutTime || '',
      `"${r.checkOutLocationName || ''}"`,
      r.workingDurationMinutes || 0,
      formatWorkingDuration(r.workingDurationMinutes),
      r.isLate ? `Late by ${r.lateMinutes || 0}m` : 'On Time',
      `"${r.manualCorrection?.reason || r.checkInNotes || ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `serviflow_attendance_history_${historyStartDate}_to_${historyEndDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Attendance history report exported as CSV.', 'success');
  };

  // Filtered records for selected date
  const recordsForSelectedDate = useMemo(() => {
    return (attendanceRecords || []).filter((r) => r.date === selectedDate);
  }, [attendanceRecords, selectedDate]);

  // Combined staff roster with attendance records for the selected date
  const combinedRoster = useMemo(() => {
    const activeStaffList = (staff || []).filter((s) => s.status !== 'inactive');

    return activeStaffList.map((s) => {
      const existing = recordsForSelectedDate.find(
        (r) =>
          r.staffId === s.id ||
          (s.email && r.staffEmail?.toLowerCase() === s.email.toLowerCase())
      );

      if (existing) {
        return { staffMember: s, record: existing };
      }

      // Virtual un-marked record
      const virtualRecord: AttendanceRecord = {
        id: `virtual-${s.id}-${selectedDate}`,
        businessId: currentBusiness?.id || 'biz-default',
        staffId: s.id,
        staffName: s.name,
        staffEmail: s.email,
        staffRole: s.role,
        staffPhone: s.phone,
        date: selectedDate,
        status: 'absent',
        workingState: 'not_checked_in',
        auditTrail: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return { staffMember: s, record: virtualRecord };
    });
  }, [staff, recordsForSelectedDate, selectedDate, currentBusiness]);

  // Filtered roster for table display
  const displayedRoster = useMemo(() => {
    return combinedRoster.filter(({ staffMember, record }) => {
      if (filterStaffId !== 'all' && staffMember.id !== filterStaffId) {
        return false;
      }
      if (filterStatus !== 'all') {
        if (filterStatus === 'working' && record.workingState !== 'working') return false;
        if (filterStatus === 'completed' && record.workingState !== 'completed') return false;
        if (filterStatus === 'not_checked_in' && record.workingState !== 'not_checked_in') return false;
        if (['present', 'late', 'half_day', 'absent', 'leave', 'holiday', 'weekly_off'].includes(filterStatus)) {
          if (record.status !== filterStatus) return false;
        }
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const cleanDigits = q.replace(/[^0-9]/g, '');
        const empCode = getEmployeeCode(staffMember, staff).toLowerCase();
        const empCodeDigits = empCode.replace(/[^0-9]/g, '');
        const phoneDigits = (staffMember.phone || '').replace(/[^0-9]/g, '');

        const matchName = staffMember.name?.toLowerCase().includes(q);
        const matchCode = empCode.includes(q) || (cleanDigits && empCodeDigits.includes(cleanDigits));
        const matchPhone = cleanDigits && phoneDigits.includes(cleanDigits);
        const matchRole = staffMember.role?.toLowerCase().includes(q);
        const matchLoc = record.checkInLocationName?.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchPhone && !matchRole && !matchLoc) return false;
      }
      return true;
    });
  }, [combinedRoster, filterStaffId, filterStatus, searchQuery]);

  // Top KPI Metrics for selected date
  const kpiMetrics = useMemo(() => {
    let presentCount = 0;
    let lateCount = 0;
    let workingCount = 0;
    let completedCount = 0;
    let absentCount = 0;
    let leaveCount = 0;

    combinedRoster.forEach(({ record }) => {
      if (record.status === 'present' || record.status === 'late' || record.status === 'half_day') {
        presentCount++;
      }
      if (record.isLate) {
        lateCount++;
      }
      if (record.workingState === 'working') {
        workingCount++;
      }
      if (record.workingState === 'completed') {
        completedCount++;
      }
      if (record.status === 'absent') {
        absentCount++;
      }
      if (record.status === 'leave' || record.status === 'holiday' || record.status === 'weekly_off') {
        leaveCount++;
      }
    });

    return { presentCount, lateCount, workingCount, completedCount, absentCount, leaveCount };
  }, [combinedRoster]);

  // Open manual correction modal
  const handleOpenCorrection = (record: AttendanceRecord) => {
    setCorrectionModalRecord(record);
    setCorrectionStatus(record.status || 'present');
    setCorrectionCheckIn(record.checkInTime || '09:30');
    setCorrectionCheckOut(record.checkOutTime || '18:30');
    setCorrectionDuration(record.workingDurationMinutes || 540);
    setCorrectionReason('');
  };

  // Submit manual correction
  const handleSaveCorrection = async () => {
    if (!correctionModalRecord) return;
    if (!correctionReason.trim()) {
      showToast('Mandatory: Please provide a reason for manual correction.', 'error');
      return;
    }

    setIsSubmittingCorrection(true);
    try {
      const res = await manualCorrectAttendance(
        correctionModalRecord.id,
        {
          status: correctionStatus,
          checkInTime: correctionCheckIn,
          checkOutTime: correctionCheckOut,
          workingDurationMinutes: Number(correctionDuration),
        },
        correctionReason
      );

      if (res.success) {
        setCorrectionModalRecord(null);
        showToast('Manual attendance correction recorded and audit logged.', 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Correction failed', 'error');
    } finally {
      setIsSubmittingCorrection(false);
    }
  };

  // Open modal for Location add/edit
  const handleOpenLocationModal = (loc?: AttendanceLocation) => {
    if (loc) {
      setEditingLocationId(loc.id);
      setLocName(loc.name);
      setLocType(loc.type);
      setLocAddress(loc.address);
      setLocLat(loc.latitude);
      setLocLng(loc.longitude);
      setLocRadius(loc.radiusMeters);
      setLocIsDefault(Boolean(loc.isDefault));
    } else {
      setEditingLocationId(null);
      setLocName('');
      setLocType('office');
      setLocAddress('');
      setLocLat(28.6139);
      setLocLng(77.209);
      setLocRadius(150);
      setLocIsDefault(false);
    }
    setIsLocationModalOpen(true);
  };

  // Save Location (add or update)
  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locName || !locAddress) {
      showToast('Please enter location name and address.', 'error');
      return;
    }

    if (editingLocationId) {
      await updateAttendanceLocation(editingLocationId, {
        name: locName,
        type: locType,
        address: locAddress,
        latitude: Number(locLat),
        longitude: Number(locLng),
        radiusMeters: Number(locRadius),
        isDefault: locIsDefault,
      });
    } else {
      await addAttendanceLocation({
        name: locName,
        type: locType,
        address: locAddress,
        latitude: Number(locLat),
        longitude: Number(locLng),
        radiusMeters: Number(locRadius),
        isDefault: locIsDefault,
        isActive: true,
      });
    }
    setIsLocationModalOpen(false);
  };

  // Save Shift & Working Rules
  const handleSaveRules = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateAttendanceWorkingRules({
      workStartTime: rulesWorkStart,
      workEndTime: rulesWorkEnd,
      gracePeriodMinutes: Number(rulesGraceMins),
      halfDayThresholdMinutes: Number(rulesHalfDayMins),
      requireGPSVerification: rulesGpsEnforce,
      allowFieldJobCheckIn: rulesAllowFieldJob,
    });
  };

  // Save Leave / Holiday
  const handleSaveLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveStaffId) {
      showToast('Select staff member.', 'error');
      return;
    }
    await markStaffLeaveOrHoliday(leaveStaffId, leaveDate, leaveType, leaveNotes);
    setIsLeaveModalOpen(false);
    setLeaveNotes('');
  };

  // Export CSV Report
  const handleExportCSV = () => {
    const headers = [
      'Date',
      'Staff Name',
      'Staff Role',
      'Status',
      'Working State',
      'Check-In Time',
      'Check-In Location',
      'Check-In GPS Distance',
      'Check-Out Time',
      'Duration (Minutes)',
      'Duration Formatted',
      'Late Arrival',
    ];

    const rows = combinedRoster.map(({ staffMember, record }) => [
      record.date || selectedDate,
      `"${staffMember.name}"`,
      staffMember.role || 'technician',
      record.status,
      record.workingState,
      record.checkInTime || '',
      `"${record.checkInLocationName || ''}"`,
      record.checkInDistance !== undefined ? `${record.checkInDistance}m` : '',
      record.checkOutTime || '',
      record.workingDurationMinutes || 0,
      formatWorkingDuration(record.workingDurationMinutes),
      record.isLate ? `Late by ${record.lateMinutes}m` : 'On Time',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `serviflow_attendance_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Attendance report exported as CSV.', 'success');
  };

  return (
    <div className="space-y-5 pb-28 sm:pb-20 animate-in fade-in" id="attendance-management-view">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-600/30">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Staff Attendance & GPS Verification
              </h1>
              <p className="text-xs text-slate-500">
                Live staff check-ins, geofence boundary verification, shift duration tracking, & audit records
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {isOwnerOrAdmin && (
            <button
              type="button"
              id="btn-mark-leave"
              onClick={() => setIsLeaveModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" /> Mark Leave / Holiday
            </button>
          )}

          <button
            type="button"
            id="btn-export-attendance-csv"
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {/* 2. Top Navigation Tabs */}
      <div className="w-full max-w-full overflow-x-auto scrollbar-none pb-2 border-b border-slate-200 dark:border-slate-800 touch-pan-x">
        <div className="flex items-center gap-2 min-w-max">
          {[
            { id: 'roster', label: 'Daily Roster & Live Tracking', icon: Users },
            { id: 'history', label: 'Attendance History', icon: History },
            { id: 'locations', label: 'Permitted Geofence Sites', icon: Building2 },
            { id: 'rules', label: 'Shift & Working Rules', icon: Sliders },
            { id: 'audit', label: 'Security & Audit Logs', icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-2xl text-xs font-extrabold whitespace-nowrap shrink-0 transition-all cursor-pointer select-none ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" /> <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DAILY ROSTER & LIVE TRACKING                                       */}
      {/* ========================================================================= */}
      {activeTab === 'roster' && (
        <div className="space-y-4">
          {/* Top KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/50">
              <div className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-300">
                Present
              </div>
              <div className="text-xl font-black text-emerald-950 dark:text-emerald-100">
                {kpiMetrics.presentCount}
              </div>
              <div className="text-[10px] text-emerald-600">Total checked-in</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/50">
              <div className="text-[10px] font-bold uppercase text-indigo-700 dark:text-indigo-300">
                Active / Working
              </div>
              <div className="text-xl font-black text-indigo-950 dark:text-indigo-100">
                {kpiMetrics.workingCount}
              </div>
              <div className="text-[10px] text-indigo-600">On shift right now</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/50">
              <div className="text-[10px] font-bold uppercase text-amber-700 dark:text-amber-300">
                Late Arrivals
              </div>
              <div className="text-xl font-black text-amber-950 dark:text-amber-100">
                {kpiMetrics.lateCount}
              </div>
              <div className="text-[10px] text-amber-600">After grace period</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/50">
              <div className="text-[10px] font-bold uppercase text-blue-700 dark:text-blue-300">
                Completed
              </div>
              <div className="text-xl font-black text-blue-950 dark:text-blue-100">
                {kpiMetrics.completedCount}
              </div>
              <div className="text-[10px] text-blue-600">Checked out</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/50">
              <div className="text-[10px] font-bold uppercase text-rose-700 dark:text-rose-300">
                Absent / Unmarked
              </div>
              <div className="text-xl font-black text-rose-950 dark:text-rose-100">
                {kpiMetrics.absentCount}
              </div>
              <div className="text-[10px] text-rose-600">No check-in record</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-900/50">
              <div className="text-[10px] font-bold uppercase text-purple-700 dark:text-purple-300">
                On Leave / Off
              </div>
              <div className="text-xl font-black text-purple-950 dark:text-purple-100">
                {kpiMetrics.leaveCount}
              </div>
              <div className="text-[10px] text-purple-600">Approved leave / holiday</div>
            </div>
          </div>

          {/* Filter Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Date Selector */}
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                <span className="font-bold text-slate-500">Date:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent font-bold text-slate-900 dark:text-slate-100 focus:outline-none cursor-pointer"
                />
              </div>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200"
              >
                <option value="all">All Statuses</option>
                <option value="working">Currently Working</option>
                <option value="completed">Shift Completed</option>
                <option value="present">Present (On Time)</option>
                <option value="late">Late Arrival</option>
                <option value="absent">Absent / Unmarked</option>
                <option value="leave">On Leave / Holiday</option>
              </select>

              {/* Staff Member Searchable Filter */}
              <div className="w-full sm:w-64 min-w-[200px]">
                <SearchableStaffSelect
                  value={filterStaffId}
                  onChange={(id) => setFilterStaffId(id)}
                  staffList={staff}
                  allowAll={true}
                  allLabel="All Staff Members"
                  placeholder="All Staff Members"
                  id="daily-roster-staff-select"
                />
              </div>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, code (EMP-...), phone, site..."
                className="w-full pl-8 pr-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Roster Table / Mobile Cards */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-xs">
            {/* Desktop Table View (>= lg) */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400">
                <thead className="bg-slate-50/80 dark:bg-slate-800/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-4">Staff Member</th>
                    <th className="p-4">Status & State</th>
                    <th className="p-4">Check-In Details</th>
                    <th className="p-4">Check-Out Details</th>
                    <th className="p-4">Working Duration</th>
                    <th className="p-4">Geofence / Verification</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {displayedRoster.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-xs text-slate-400">
                        No staff attendance records matched your filter criteria for {selectedDate}.
                      </td>
                    </tr>
                  ) : (
                    displayedRoster.map(({ staffMember, record }) => {
                      const isUnmarked = record.workingState === 'not_checked_in' && record.status === 'absent';
                      const empCode = getEmployeeCode(staffMember, staff);
                      const roleLabel = staffMember.role ? formatRoleLabel(staffMember.role) : '';
                      const phone = staffMember.phone?.trim() || '';

                      return (
                        <tr
                          key={record.id}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          {/* Staff Info (Clickable for Staff Attendance History) */}
                          <td className="p-4">
                            <div
                              onClick={() => handleOpenStaffHistory(staffMember.id, staffMember.name, staffMember.email)}
                              className="flex items-center gap-3 cursor-pointer group w-fit"
                              title="Click to view staff monthly attendance history"
                            >
                              <div className="w-8 h-8 rounded-xl bg-indigo-600/10 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center font-bold transition-all shrink-0">
                                {(staffMember.name || 'S').charAt(0)}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                                  <span>{staffMember.name}</span>
                                  <Eye className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap mt-0.5">
                                  {empCode ? (
                                    <span className="font-bold text-indigo-600 dark:text-indigo-400 tracking-tight">
                                      {empCode}
                                    </span>
                                  ) : null}
                                  {empCode && roleLabel ? (
                                    <span className="text-slate-300 dark:text-slate-600">·</span>
                                  ) : null}
                                  {roleLabel ? (
                                    <span>{roleLabel}</span>
                                  ) : null}
                                  {phone ? (
                                    <>
                                      <span className="text-slate-300 dark:text-slate-600">•</span>
                                      <span className="text-[10px] text-slate-400">{phone}</span>
                                    </>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Status Badge */}
                          <td className="p-4">
                            {isUnmarked ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                Not Checked In
                              </span>
                            ) : record.workingState === 'working' ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 flex items-center gap-1 w-fit">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Working
                              </span>
                            ) : record.status === 'late' ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300">
                                Late ({record.lateMinutes}m)
                              </span>
                            ) : record.status === 'leave' || record.status === 'holiday' ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                                {record.status.toUpperCase()}
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                                {record.status.toUpperCase()}
                              </span>
                            )}
                          </td>

                          {/* Check-In Details */}
                          <td className="p-4">
                            {record.checkInTime ? (
                              <div className="space-y-0.5">
                                <div className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
                                  {record.checkInTime}
                                </div>
                                <div className="text-[10px] text-slate-500 truncate max-w-[160px] flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-slate-400" />
                                  {record.checkInLocationName || 'Site Location'}
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[11px]">—</span>
                            )}
                          </td>

                          {/* Check-Out Details */}
                          <td className="p-4">
                            {record.checkOutTime ? (
                              <div className="space-y-0.5">
                                <div className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5 text-rose-500" />
                                  {record.checkOutTime}
                                </div>
                                <div className="text-[10px] text-slate-500 truncate max-w-[160px]">
                                  {record.checkOutLocationName || 'Completed'}
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[11px]">—</span>
                            )}
                          </td>

                          {/* Working Duration */}
                          <td className="p-4">
                            {record.workingDurationMinutes ? (
                              <div className="font-black text-slate-900 dark:text-slate-100 font-mono">
                                {formatWorkingDuration(record.workingDurationMinutes)}
                              </div>
                            ) : record.workingState === 'working' ? (
                              <span className="text-indigo-600 dark:text-indigo-400 font-bold text-[11px] animate-pulse">
                                Live Tracking...
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">—</span>
                            )}
                          </td>

                          {/* Geofence / Verification Badge */}
                          <td className="p-4">
                            {record.checkInDistance !== undefined ? (
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  <span>Within {formatDistance(record.checkInDistance)}</span>
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  ±{record.checkInAccuracy || 10}m accuracy
                                </div>
                              </div>
                            ) : record.manualCorrection ? (
                              <span className="text-[10px] font-bold text-purple-600 bg-purple-50 dark:bg-purple-950 px-2 py-0.5 rounded-full border border-purple-200">
                                Manually Corrected
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">—</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenStaffHistory(staffMember.id, staffMember.name, staffMember.email)}
                                className="px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 font-bold text-[11px] transition-all cursor-pointer"
                                title="View Complete History"
                              >
                                History
                              </button>
                              {isOwnerOrAdmin && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenCorrection(record)}
                                  className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 text-slate-600 dark:text-slate-300 font-bold text-[11px] transition-all cursor-pointer"
                                >
                                  Edit
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Cards View (< lg) - Compact & Information-Dense */}
            <div className="block lg:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {displayedRoster.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No staff attendance records matched your filter criteria for {selectedDate}.
                </div>
              ) : (
                displayedRoster.map(({ staffMember, record }) => {
                  const isUnmarked = record.workingState === 'not_checked_in' && record.status === 'absent';
                  const empCode = getEmployeeCode(staffMember, staff);
                  const roleLabel = staffMember.role ? formatRoleLabel(staffMember.role) : '';
                  const phone = staffMember.phone?.trim() || '';

                  const checkIn = record.checkInTime || '';
                  const checkOut = record.checkOutTime || '';
                  const locationName = record.checkInLocationName || record.checkOutLocationName || '';

                  return (
                    <div key={record.id} className="p-3 sm:p-3.5 space-y-2 bg-white dark:bg-slate-900">
                      {/* 1. Compact Employee Header */}
                      <div
                        onClick={() => handleOpenStaffHistory(staffMember.id, staffMember.name, staffMember.email)}
                        className="flex items-center gap-2.5 cursor-pointer group"
                      >
                        <div className="w-8 h-8 rounded-xl bg-indigo-600/10 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                          {(staffMember.name || 'S').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-extrabold text-xs text-slate-900 dark:text-slate-100 leading-tight group-hover:text-indigo-600 transition-colors flex items-center gap-1">
                            <span className="truncate">{staffMember.name}</span>
                            <Eye className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          </div>

                          {/* Employee Code · Role · Phone */}
                          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap mt-0.5 leading-none">
                            {empCode ? (
                              <span className="font-bold text-indigo-600 dark:text-indigo-400 tracking-tight">
                                {empCode}
                              </span>
                            ) : null}
                            {empCode && roleLabel ? (
                              <span className="text-slate-300 dark:text-slate-600">·</span>
                            ) : null}
                            {roleLabel ? (
                              <span>{roleLabel}</span>
                            ) : null}
                            {phone ? (
                              <>
                                <span className="text-slate-300 dark:text-slate-600">·</span>
                                <span className="text-slate-400 font-normal">{phone}</span>
                              </>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      {/* 2. Attendance Status Badge */}
                      <div className="pt-0.5">
                        {isUnmarked ? (
                          <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            NOT CHECKED IN
                          </span>
                        ) : record.workingState === 'working' ? (
                          <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            WORKING
                          </span>
                        ) : record.status === 'present' ? (
                          <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            PRESENT
                          </span>
                        ) : record.status === 'late' ? (
                          <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300">
                            LATE {record.lateMinutes ? `(${record.lateMinutes}m)` : ''}
                          </span>
                        ) : record.status === 'half_day' ? (
                          <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                            HALF DAY
                          </span>
                        ) : record.status === 'leave' || record.status === 'holiday' ? (
                          <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                            {record.status.toUpperCase()}
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                            {record.status.toUpperCase()}
                          </span>
                        )}
                      </div>

                      {/* 3. Time + Duration Row & Location */}
                      <div className="bg-slate-50 dark:bg-slate-800/40 px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-800/80 space-y-1 text-xs">
                        {/* Time & Duration in One Row */}
                        {checkIn ? (
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 font-extrabold text-slate-900 dark:text-slate-100 text-xs min-w-0">
                              <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                              <span className="truncate">
                                {checkIn} {checkOut ? `→ ${checkOut}` : record.workingState === 'working' ? '→ Active' : ''}
                              </span>
                            </div>
                            {(record.workingDurationMinutes || record.workingState === 'working') ? (
                              <div className="text-right shrink-0">
                                <div className="text-xs font-black text-slate-900 dark:text-slate-100 font-mono leading-none">
                                  {record.workingDurationMinutes
                                    ? formatWorkingDuration(record.workingDurationMinutes)
                                    : 'Live'}
                                </div>
                                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tight leading-none mt-0.5">
                                  Duration
                                </div>
                              </div>
                            ) : null}
                          </div>
                        ) : (
                          /* Not Checked In compact row */
                          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>Not checked in</span>
                          </div>
                        )}

                        {/* Location */}
                        {checkIn && locationName ? (
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400 pt-0.5 flex-wrap">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{locationName}</span>
                            {record.checkInDistance !== undefined ? (
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[10px] shrink-0">
                                · Within {formatDistance(record.checkInDistance)}
                              </span>
                            ) : null}
                          </div>
                        ) : null}

                        {/* Verification / Manual Correction Badge */}
                        {record.manualCorrection?.reason ? (
                          <div className="text-[10px] font-medium text-purple-600 dark:text-purple-400 pt-0.5">
                            Manually corrected: {record.manualCorrection.reason}
                          </div>
                        ) : null}
                      </div>

                      {/* 4. Action Buttons */}
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenStaffHistory(staffMember.id, staffMember.name, staffMember.email)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-bold text-[11px] transition-colors cursor-pointer"
                        >
                          Staff History
                        </button>
                        {isOwnerOrAdmin ? (
                          <button
                            type="button"
                            onClick={() => handleOpenCorrection(record)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[11px] transition-colors cursor-pointer"
                          >
                            Edit
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ATTENDANCE HISTORY                                                 */}
      {/* ========================================================================= */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* Quick Date Presets & Month Stepper Toolbar */}
          <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-3 shadow-2xs">
            {/* Quick Range Presets */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0 touch-pan-x">
              <span className="text-[10px] sm:text-xs font-extrabold text-slate-400 uppercase tracking-wider mr-1 shrink-0">
                Presets:
              </span>
              <button
                type="button"
                onClick={() => setHistoryPreset('this_month')}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-700 dark:text-slate-300 hover:text-indigo-600 text-xs font-bold transition-all cursor-pointer shrink-0"
              >
                This Month
              </button>
              <button
                type="button"
                onClick={() => setHistoryPreset('last_month')}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-700 dark:text-slate-300 hover:text-indigo-600 text-xs font-bold transition-all cursor-pointer shrink-0"
              >
                Last Month
              </button>
              <button
                type="button"
                onClick={() => setHistoryPreset('last_7_days')}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-700 dark:text-slate-300 hover:text-indigo-600 text-xs font-bold transition-all cursor-pointer shrink-0"
              >
                Last 7 Days
              </button>
              <button
                type="button"
                onClick={() => setHistoryPreset('last_30_days')}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-700 dark:text-slate-300 hover:text-indigo-600 text-xs font-bold transition-all cursor-pointer shrink-0"
              >
                Last 30 Days
              </button>
            </div>

            {/* Month Navigator & Export */}
            <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleHistoryShiftMonth('prev')}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 transition-all cursor-pointer"
                  title="Shift to Previous Month"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> <span className="hidden xs:inline">Prev</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleHistoryShiftMonth('next')}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 transition-all cursor-pointer"
                  title="Shift to Next Month"
                >
                  <span className="hidden xs:inline">Next</span> <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <button
                type="button"
                onClick={handleExportHistoryCSV}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> <span>Export Report</span>
              </button>
            </div>
          </div>

          {/* History KPI Summary Cards (Balanced 2-col on mobile, Total Hours spans full-width) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5">
            {/* Card 1: Working Days */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
              <div className="text-[10px] sm:text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">
                Working Days
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 mt-1 leading-tight">
                {historyKpis.workingDays}
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">Distinct active dates</div>
            </div>

            {/* Card 2: Present */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/50 flex flex-col justify-between">
              <div className="text-[10px] sm:text-[11px] font-bold uppercase text-emerald-700 dark:text-emerald-300">
                Present
              </div>
              <div className="text-xl sm:text-2xl font-black text-emerald-950 dark:text-emerald-100 mt-1 leading-tight">
                {historyKpis.presentCount}
              </div>
              <div className="text-[10px] sm:text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 truncate">Total present logs</div>
            </div>

            {/* Card 3: Late */}
            <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/50 flex flex-col justify-between">
              <div className="text-[10px] sm:text-[11px] font-bold uppercase text-amber-700 dark:text-amber-300">
                Late
              </div>
              <div className="text-xl sm:text-2xl font-black text-amber-950 dark:text-amber-100 mt-1 leading-tight">
                {historyKpis.lateCount}
              </div>
              <div className="text-[10px] sm:text-[11px] text-amber-600 dark:text-amber-400 mt-0.5 truncate">After shift start</div>
            </div>

            {/* Card 4: Half Day */}
            <div className="p-3.5 rounded-2xl bg-sky-50/80 dark:bg-sky-950/40 border border-sky-200/60 dark:border-sky-900/50 flex flex-col justify-between">
              <div className="text-[10px] sm:text-[11px] font-bold uppercase text-sky-700 dark:text-sky-300">
                Half Day
              </div>
              <div className="text-xl sm:text-2xl font-black text-sky-950 dark:text-sky-100 mt-1 leading-tight">
                {historyKpis.halfDayCount}
              </div>
              <div className="text-[10px] sm:text-[11px] text-sky-600 dark:text-sky-400 mt-0.5 truncate">Partial work hours</div>
            </div>

            {/* Card 5: Absent */}
            <div className="p-3.5 rounded-2xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/50 flex flex-col justify-between">
              <div className="text-[10px] sm:text-[11px] font-bold uppercase text-rose-700 dark:text-rose-300">
                Absent
              </div>
              <div className="text-xl sm:text-2xl font-black text-rose-950 dark:text-rose-100 mt-1 leading-tight">
                {historyKpis.absentCount}
              </div>
              <div className="text-[10px] sm:text-[11px] text-rose-600 dark:text-rose-400 mt-0.5 truncate">Unexcused absence</div>
            </div>

            {/* Card 6: Leave / Off */}
            <div className="p-3.5 rounded-2xl bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-900/50 flex flex-col justify-between">
              <div className="text-[10px] sm:text-[11px] font-bold uppercase text-purple-700 dark:text-purple-300">
                Leave / Off
              </div>
              <div className="text-xl sm:text-2xl font-black text-purple-950 dark:text-purple-100 mt-1 leading-tight">
                {historyKpis.leaveCount}
              </div>
              <div className="text-[10px] sm:text-[11px] text-purple-600 dark:text-purple-400 mt-0.5 truncate">Approved leaves</div>
            </div>

            {/* Card 7: Total Hours (Full width on mobile & tablet) */}
            <div className="col-span-2 sm:col-span-3 lg:col-span-1 p-3.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/50 flex flex-col justify-between">
              <div className="text-[10px] sm:text-[11px] font-bold uppercase text-indigo-700 dark:text-indigo-300">
                Total Hours
              </div>
              <div className="text-xl sm:text-2xl font-black text-indigo-950 dark:text-indigo-100 mt-1 leading-tight">
                {formatWorkingDuration(historyKpis.totalDurationMinutes)}
              </div>
              <div className="text-[10px] sm:text-[11px] text-indigo-600 dark:text-indigo-400 mt-0.5 truncate">Cumulative duration</div>
            </div>
          </div>

          {/* History Collapsible Filter Panel */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden transition-all">
            {/* Filter Box Header / Toggle Bar */}
            <div className="p-3.5 sm:p-4 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setIsHistoryFiltersOpen(!isHistoryFiltersOpen)}
                className="flex items-center gap-2 cursor-pointer text-left min-w-0 flex-1 select-none"
              >
                <div className="w-7 h-7 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center shrink-0">
                  <Filter className="w-3.5 h-3.5" />
                </div>
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                    Filters & Search
                  </span>
                  {activeHistoryFilterCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-600 text-white shrink-0">
                      {activeHistoryFilterCount} active
                    </span>
                  )}
                  {/* Current Active Date Range Pill */}
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 shrink-0">
                    <CalendarRange className="w-3 h-3 text-indigo-500" /> {historyStartDate} → {historyEndDate}
                  </span>
                </div>
              </button>

              <div className="flex items-center gap-1.5 shrink-0">
                {(activeHistoryFilterCount > 0 || historySearchQuery.trim() !== '') && (
                  <button
                    type="button"
                    onClick={handleClearHistoryFilters}
                    className="px-2.5 py-1 rounded-xl text-[11px] font-bold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsHistoryFiltersOpen(!isHistoryFiltersOpen)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  title={isHistoryFiltersOpen ? 'Collapse filters' : 'Expand filters'}
                >
                  {isHistoryFiltersOpen ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Collapsible Filter Body */}
            {isHistoryFiltersOpen && (
              <div className="px-3.5 sm:px-4 pb-4 pt-1 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-3 pt-2">
                  {/* From Date */}
                  <div>
                    <label className="text-[10px] sm:text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 block mb-1">
                      From Date
                    </label>
                    <input
                      type="date"
                      value={historyStartDate}
                      onChange={(e) => setHistoryStartDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* To Date */}
                  <div>
                    <label className="text-[10px] sm:text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 block mb-1">
                      To Date
                    </label>
                    <input
                      type="date"
                      value={historyEndDate}
                      onChange={(e) => setHistoryEndDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Staff Member Searchable Selector */}
                  <div>
                    <SearchableStaffSelect
                      value={historyStaffId}
                      onChange={(id) => setHistoryStaffId(id)}
                      staffList={staff}
                      allowAll={true}
                      allLabel="All Staff Members"
                      label="Staff Member"
                      placeholder="All Staff Members"
                      id="history-staff-select"
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="text-[10px] sm:text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 block mb-1">
                      Status
                    </label>
                    <select
                      value={historyStatus}
                      onChange={(e) => setHistoryStatus(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="all">All Statuses</option>
                      <option value="present">Present (On Time)</option>
                      <option value="late">Late Arrival</option>
                      <option value="half_day">Half Day</option>
                      <option value="leave">Leave / Holiday / Off</option>
                      <option value="absent">Absent</option>
                      <option value="working">Currently Working</option>
                      <option value="completed">Completed Shift</option>
                    </select>
                  </div>

                  {/* Search */}
                  <div className="sm:col-span-2 lg:col-span-1">
                    <label className="text-[10px] sm:text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 block mb-1">
                      Search Query
                    </label>
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Staff, location, notes..."
                        value={historySearchQuery}
                        onChange={(e) => setHistorySearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Filter Action Bar */}
                <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">
                    Showing <strong className="text-slate-900 dark:text-slate-100 font-bold">{historyFilteredRecords.length}</strong> record{historyFilteredRecords.length !== 1 ? 's' : ''} across <strong className="text-slate-900 dark:text-slate-100 font-bold">{historyGroupedByDate.length}</strong> date{historyGroupedByDate.length !== 1 ? 's' : ''}
                  </span>
                  <button
                    type="button"
                    onClick={handleClearHistoryFilters}
                    className="flex items-center gap-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Clear Filters
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* History Records List (Grouped by Date) */}
          <div className="space-y-4">
            {historyGroupedByDate.length === 0 ? (
              <div className="p-10 sm:p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 shadow-2xs">
                <CalendarRange className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                  No attendance records found
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  No logs match the selected date range ({historyStartDate} to {historyEndDate}) or filter criteria. Try expanding the date range or clearing filters.
                </p>
                <button
                  type="button"
                  onClick={handleClearHistoryFilters}
                  className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-all cursor-pointer shadow-xs"
                >
                  Reset Date & Filters
                </button>
              </div>
            ) : (
              historyGroupedByDate.map(({ date, records }) => {
                const dateObj = new Date(date + 'T00:00:00');
                const formattedDateHeader = dateObj.toLocaleDateString('en-GB', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                });

                return (
                  <div
                    key={date}
                    className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden"
                  >
                    {/* Date Section Header */}
                    <div className="px-4 py-3 bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                        <span className="text-xs font-black text-slate-900 dark:text-slate-100 truncate">
                          {formattedDateHeader}
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 shrink-0">
                        {records.length} {records.length === 1 ? 'record' : 'records'}
                      </span>
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden lg:block overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50/40 dark:bg-slate-800/30 text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">
                            <th className="p-3.5">Staff Member</th>
                            <th className="p-3.5">Status</th>
                            <th className="p-3.5">Check-In</th>
                            <th className="p-3.5">Check-Out</th>
                            <th className="p-3.5">Duration</th>
                            <th className="p-3.5">Location / Site</th>
                            <th className="p-3.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                          {records.map((rec) => {
                            const staffObj = staff.find((s) => s.id === rec.staffId);
                            const roleDisplay = rec.staffRole || staffObj?.role || 'technician';
                            const phoneDisplay = rec.staffPhone || staffObj?.phone || '';
                            const empCode = rec.staffEmployeeCode || getEmployeeCode(staffObj, staff);

                            return (
                              <tr
                                key={rec.id}
                                className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                              >
                                {/* Staff Member */}
                                <td className="p-3.5">
                                  <div
                                    onClick={() => handleOpenStaffHistory(rec.staffId, rec.staffName, rec.staffEmail)}
                                    className="flex items-center gap-3 cursor-pointer group w-fit"
                                    title="Click to view staff monthly attendance history"
                                  >
                                    <div className="w-8 h-8 rounded-xl bg-indigo-600/10 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center font-bold transition-all shrink-0">
                                      {(rec.staffName || 'S').charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <div className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                                        <span>{rec.staffName}</span>
                                        <Eye className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                      </div>
                                      <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap mt-0.5">
                                        {empCode ? (
                                          <span className="font-bold text-indigo-600 dark:text-indigo-400 tracking-tight">
                                            {empCode}
                                          </span>
                                        ) : null}
                                        {empCode && roleDisplay ? (
                                          <span className="text-slate-300 dark:text-slate-600">·</span>
                                        ) : null}
                                        {roleDisplay ? (
                                          <span>{formatRoleLabel(roleDisplay)}</span>
                                        ) : null}
                                        {phoneDisplay ? (
                                          <>
                                            <span className="text-slate-300 dark:text-slate-600">•</span>
                                            <span className="text-[10px] text-slate-400">{phoneDisplay}</span>
                                          </>
                                        ) : null}
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                {/* Status */}
                                <td className="p-3.5">
                                  {rec.workingState === 'working' ? (
                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 flex items-center gap-1 w-fit">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                      Working
                                    </span>
                                  ) : rec.status === 'present' ? (
                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                      PRESENT
                                    </span>
                                  ) : rec.status === 'late' ? (
                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300">
                                      LATE ({rec.lateMinutes || 15}m)
                                    </span>
                                  ) : rec.status === 'half_day' ? (
                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                                      HALF DAY
                                    </span>
                                  ) : rec.status === 'leave' || rec.status === 'holiday' ? (
                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                                      {rec.status.toUpperCase()}
                                    </span>
                                  ) : (
                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                                      {rec.status.toUpperCase()}
                                    </span>
                                  )}
                                </td>

                                {/* Check-In */}
                                <td className="p-3.5">
                                  {rec.checkInTime ? (
                                    <div className="space-y-0.5">
                                      <div className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                                        <Clock className="w-3 h-3 text-indigo-500" />
                                        {rec.checkInTime}
                                      </div>
                                      <div className="text-[10px] text-slate-500 truncate max-w-[140px]">
                                        {rec.checkInLocationName || 'Site Location'}
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-slate-400">—</span>
                                  )}
                                </td>

                                {/* Check-Out */}
                                <td className="p-3.5">
                                  {rec.checkOutTime ? (
                                    <div className="space-y-0.5">
                                      <div className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                                        <Clock className="w-3 h-3 text-slate-400" />
                                        {rec.checkOutTime}
                                      </div>
                                      <div className="text-[10px] text-slate-500 truncate max-w-[140px]">
                                        {rec.checkOutLocationName || 'Site Location'}
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-slate-400">
                                      {rec.workingState === 'working' ? (
                                        <span className="text-indigo-600 font-semibold">Active</span>
                                      ) : (
                                        '—'
                                      )}
                                    </span>
                                  )}
                                </td>

                                {/* Duration */}
                                <td className="p-3.5">
                                  <div className="font-mono font-bold text-slate-900 dark:text-slate-100">
                                    {rec.workingDurationMinutes
                                      ? formatWorkingDuration(rec.workingDurationMinutes)
                                      : rec.workingState === 'working'
                                      ? 'Live'
                                      : '—'}
                                  </div>
                                </td>

                                {/* Location / Geofence */}
                                <td className="p-3.5">
                                  {rec.checkInDistance !== undefined ? (
                                    <div className="space-y-0.5">
                                      <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                        <ShieldCheck className="w-3.5 h-3.5" />
                                        <span>Within {formatDistance(rec.checkInDistance)}</span>
                                      </div>
                                      <div className="text-[9px] text-slate-400 font-mono">
                                        ±{rec.checkInAccuracy || 10}m GPS
                                      </div>
                                    </div>
                                  ) : rec.manualCorrection ? (
                                    <span className="text-[10px] font-bold text-purple-600 bg-purple-50 dark:bg-purple-950 px-2 py-0.5 rounded-full border border-purple-200">
                                      Corrected
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 text-[10px]">—</span>
                                  )}
                                </td>

                                {/* Actions */}
                                <td className="p-3.5 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenStaffHistory(rec.staffId, rec.staffName, rec.staffEmail)}
                                      className="px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 font-bold text-[11px] transition-all cursor-pointer"
                                    >
                                      Staff History
                                    </button>
                                    {isOwnerOrAdmin && (
                                      <button
                                        type="button"
                                        onClick={() => handleOpenCorrection(rec)}
                                        className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 text-slate-600 dark:text-slate-300 hover:text-indigo-600 font-bold text-[11px] transition-all cursor-pointer"
                                      >
                                        Edit
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Card List View (< lg) - Compact & Information-Dense */}
                    <div className="block lg:hidden divide-y divide-slate-100 dark:divide-slate-800">
                      {records.map((rec) => {
                        const staffObj = staff.find((s) => s.id === rec.staffId);
                        const roleDisplay = rec.staffRole || staffObj?.role || 'technician';
                        const phoneDisplay = rec.staffPhone || staffObj?.phone || '';
                        const empCode = rec.staffEmployeeCode || getEmployeeCode(staffObj, staff);
                        const roleLabel = roleDisplay ? formatRoleLabel(roleDisplay) : '';

                        const checkIn = rec.checkInTime || '';
                        const checkOut = rec.checkOutTime || '';
                        const locationName = rec.checkInLocationName || rec.checkOutLocationName || '';

                        return (
                          <div key={rec.id} className="p-3 sm:p-3.5 space-y-2 bg-white dark:bg-slate-900">
                            {/* 1. Compact Employee Header */}
                            <div
                              onClick={() => handleOpenStaffHistory(rec.staffId, rec.staffName, rec.staffEmail)}
                              className="flex items-center gap-2.5 cursor-pointer group"
                            >
                              <div className="w-8 h-8 rounded-xl bg-indigo-600/10 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                {(rec.staffName || 'S').charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-extrabold text-xs text-slate-900 dark:text-slate-100 leading-tight group-hover:text-indigo-600 transition-colors flex items-center gap-1">
                                  <span className="truncate">{rec.staffName}</span>
                                  <Eye className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                </div>

                                {/* Employee Code · Role · Phone */}
                                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap mt-0.5 leading-none">
                                  {empCode ? (
                                    <span className="font-bold text-indigo-600 dark:text-indigo-400 tracking-tight">
                                      {empCode}
                                    </span>
                                  ) : null}
                                  {empCode && roleLabel ? (
                                    <span className="text-slate-300 dark:text-slate-600">·</span>
                                  ) : null}
                                  {roleLabel ? (
                                    <span>{roleLabel}</span>
                                  ) : null}
                                  {phoneDisplay ? (
                                    <>
                                      <span className="text-slate-300 dark:text-slate-600">·</span>
                                      <span className="text-slate-400 font-normal">{phoneDisplay}</span>
                                    </>
                                  ) : null}
                                </div>
                              </div>
                            </div>

                            {/* 2. Attendance Status Badge */}
                            <div className="pt-0.5">
                              {rec.workingState === 'working' ? (
                                <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  WORKING
                                </span>
                              ) : rec.status === 'present' ? (
                                <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                  PRESENT
                                </span>
                              ) : rec.status === 'late' ? (
                                <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300">
                                  LATE {rec.lateMinutes ? `(${rec.lateMinutes}m)` : ''}
                                </span>
                              ) : rec.status === 'half_day' ? (
                                <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                                  HALF DAY
                                </span>
                              ) : rec.status === 'leave' || rec.status === 'holiday' ? (
                                <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                                  {rec.status.toUpperCase()}
                                </span>
                              ) : (
                                <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                                  {rec.status.toUpperCase()}
                                </span>
                              )}
                            </div>

                            {/* 3. Time + Duration Row & Location */}
                            <div className="bg-slate-50 dark:bg-slate-800/40 px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-800/80 space-y-1 text-xs">
                              {/* Time & Duration in One Row */}
                              {checkIn ? (
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5 font-extrabold text-slate-900 dark:text-slate-100 text-xs min-w-0">
                                    <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                    <span className="truncate">
                                      {checkIn} {checkOut ? `→ ${checkOut}` : rec.workingState === 'working' ? '→ Active' : ''}
                                    </span>
                                  </div>
                                  {(rec.workingDurationMinutes || rec.workingState === 'working') ? (
                                    <div className="text-right shrink-0">
                                      <div className="text-xs font-black text-slate-900 dark:text-slate-100 font-mono leading-none">
                                        {rec.workingDurationMinutes
                                          ? formatWorkingDuration(rec.workingDurationMinutes)
                                          : 'Live'}
                                      </div>
                                      <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tight leading-none mt-0.5">
                                        Duration
                                      </div>
                                    </div>
                                  ) : null}
                                </div>
                              ) : (
                                /* Not Checked In compact row */
                                <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span>Not checked in</span>
                                </div>
                              )}

                              {/* Location */}
                              {checkIn && locationName ? (
                                <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400 pt-0.5 flex-wrap">
                                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span>{locationName}</span>
                                  {rec.checkInDistance !== undefined ? (
                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[10px] shrink-0">
                                      · Within {formatDistance(rec.checkInDistance)}
                                    </span>
                                  ) : null}
                                </div>
                              ) : null}

                              {/* Verification / Manual Correction Badge */}
                              {rec.manualCorrection?.reason ? (
                                <div className="text-[10px] font-medium text-purple-600 dark:text-purple-400 pt-0.5">
                                  Manually corrected: {rec.manualCorrection.reason}
                                </div>
                              ) : null}
                            </div>

                            {/* 4. Action Buttons */}
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenStaffHistory(rec.staffId, rec.staffName, rec.staffEmail)}
                                className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-bold text-[11px] transition-colors cursor-pointer"
                              >
                                Staff History
                              </button>
                              {isOwnerOrAdmin ? (
                                <button
                                  type="button"
                                  onClick={() => handleOpenCorrection(rec)}
                                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[11px] transition-colors cursor-pointer"
                                >
                                  Edit
                                </button>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PERMITTED GEOFENCE SITES MANAGER                                    */}
      {/* ========================================================================= */}
      {activeTab === 'locations' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                Permitted Office & Site Geofences ({attendanceLocations.length})
              </h2>
              <p className="text-[11px] text-slate-400">
                Staff check-ins are verified against these allowed geographical boundaries
              </p>
            </div>
            {isOwnerOrAdmin && (
              <button
                type="button"
                id="btn-add-geofence"
                onClick={() => handleOpenLocationModal()}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Geofence Location
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {attendanceLocations.map((loc) => (
              <div
                key={loc.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5 shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center font-bold">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                        {loc.name}
                      </div>
                      <div className="text-[10px] font-bold text-indigo-600 uppercase">
                        {loc.type} {loc.isDefault ? '• Default' : ''}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      loc.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {loc.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="text-xs text-slate-500 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{loc.address}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span>Radius: <strong className="text-slate-800 dark:text-slate-200">{loc.radiusMeters}m</strong></span>
                    <span className="font-mono text-slate-400">
                      {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                    </span>
                  </div>
                </div>

                {isOwnerOrAdmin && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenLocationModal(loc)}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteAttendanceLocation(loc.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SHIFT & WORKING RULES                                              */}
      {/* ========================================================================= */}
      {activeTab === 'rules' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 max-w-2xl space-y-5">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
              Shift Timings & Geofencing Rules
            </h2>
            <p className="text-xs text-slate-500">
              Configure standard work schedules, late arrival grace limits, and validation policies.
            </p>
          </div>

          <form onSubmit={handleSaveRules} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Work Shift Start Time:
                </label>
                <input
                  type="time"
                  value={rulesWorkStart}
                  onChange={(e) => setRulesWorkStart(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Work Shift End Time:
                </label>
                <input
                  type="time"
                  value={rulesWorkEnd}
                  onChange={(e) => setRulesWorkEnd(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Late Arrival Grace Period (Minutes):
                </label>
                <input
                  type="number"
                  min={0}
                  max={60}
                  value={rulesGraceMins}
                  onChange={(e) => setRulesGraceMins(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                />
                <span className="text-[10px] text-slate-400">e.g. 15 mins after shift start</span>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Half-Day Threshold (Minutes):
                </label>
                <input
                  type="number"
                  min={60}
                  max={480}
                  value={rulesHalfDayMins}
                  onChange={(e) => setRulesHalfDayMins(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                />
                <span className="text-[10px] text-slate-400">e.g. 240 mins (4 hours)</span>
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rulesGpsEnforce}
                  onChange={(e) => setRulesGpsEnforce(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <div className="font-bold text-slate-900 dark:text-slate-100">
                    Enforce Mandatory GPS Location Verification
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Requires valid device GPS coordinates within allowed radius for check-in
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rulesAllowFieldJob}
                  onChange={(e) => setRulesAllowFieldJob(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <div className="font-bold text-slate-900 dark:text-slate-100">
                    Allow Field Job Location Check-In
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Technicians can check in at their assigned client job site
                  </div>
                </div>
              </label>
            </div>

            {isOwnerOrAdmin && (
              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer"
                >
                  Save Shift Settings
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SECURITY & AUDIT TRAIL                                              */}
      {/* ========================================================================= */}
      {activeTab === 'audit' && (
        <div className="space-y-3">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
              Immutable Attendance Audit Logs ({attendanceAuditLogs.length})
            </h2>
            <p className="text-[11px] text-slate-400">
              Every check-in, check-out, manual correction, and geofence verification is logged with timestamp and user ID
            </p>
          </div>

          <div className="space-y-2">
            {attendanceAuditLogs.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl text-xs text-slate-400">
                No attendance security events recorded yet.
              </div>
            ) : (
              attendanceAuditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="space-y-0.5">
                    <div className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-50 dark:bg-indigo-950 text-indigo-600">
                        {log.eventType.replace('_', ' ')}
                      </span>
                      <span>{log.userName}</span>
                    </div>
                    <div className="text-slate-600 dark:text-slate-400 text-[11px]">{log.details}</div>
                  </div>

                  <div className="text-right text-[10px] text-slate-400 font-mono shrink-0">
                    {new Date(log.timestamp).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MANUAL CORRECTION MODAL                                                   */}
      {/* ========================================================================= */}
      {correctionModalRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                  Manual Attendance Correction
                </h3>
                <p className="text-[10px] text-slate-400">
                  {correctionModalRecord.staffName} • {correctionModalRecord.date}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCorrectionModalRecord(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Attendance Status:
                </label>
                <select
                  value={correctionStatus}
                  onChange={(e) => setCorrectionStatus(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 font-bold"
                >
                  <option value="present">Present (Full Day)</option>
                  <option value="late">Late Arrival</option>
                  <option value="half_day">Half Day</option>
                  <option value="absent">Absent</option>
                  <option value="leave">Approved Leave</option>
                  <option value="holiday">Holiday</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Check-In Time:
                  </label>
                  <input
                    type="time"
                    value={correctionCheckIn}
                    onChange={(e) => setCorrectionCheckIn(e.target.value)}
                    className="w-full p-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Check-Out Time:
                  </label>
                  <input
                    type="time"
                    value={correctionCheckOut}
                    onChange={(e) => setCorrectionCheckOut(e.target.value)}
                    className="w-full p-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Total Duration (Minutes):
                </label>
                <input
                  type="number"
                  value={correctionDuration}
                  onChange={(e) => setCorrectionDuration(Number(e.target.value))}
                  className="w-full p-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-bold"
                />
                <span className="text-[10px] text-indigo-600 font-semibold">
                  Equivalent to: {formatWorkingDuration(correctionDuration)}
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Reason for Correction (Mandatory):
                </label>
                <textarea
                  required
                  rows={2}
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  placeholder="e.g. Technician was on emergency client site visit with poor GPS reception"
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setCorrectionModalRecord(null)}
                className="px-4 py-2 rounded-xl border text-xs font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCorrection}
                disabled={isSubmittingCorrection}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md disabled:opacity-50"
              >
                {isSubmittingCorrection ? 'Saving...' : 'Apply Correction'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* LOCATION ADD / EDIT MODAL                                                 */}
      {/* ========================================================================= */}
      {isLocationModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <form
            onSubmit={handleSaveLocation}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                {editingLocationId ? 'Edit Geofence Site' : 'Add Permitted Geofence Site'}
              </h3>
              <button
                type="button"
                onClick={() => setIsLocationModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Site Name *
                </label>
                <input
                  type="text"
                  required
                  value={locName}
                  onChange={(e) => setLocName(e.target.value)}
                  placeholder="e.g. Sector 62 Head Office"
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Site Type
                </label>
                <select
                  value={locType}
                  onChange={(e) => setLocType(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 font-bold"
                >
                  <option value="office">Head Office</option>
                  <option value="branch">Branch Office</option>
                  <option value="warehouse">Warehouse / Service Center</option>
                  <option value="remote">Remote Hub</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Full Street Address *
                </label>
                <input
                  type="text"
                  required
                  value={locAddress}
                  onChange={(e) => setLocAddress(e.target.value)}
                  placeholder="Plot 12, Industrial Area, Sector 62, Noida"
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={locLat}
                    onChange={(e) => setLocLat(Number(e.target.value))}
                    className="w-full p-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={locLng}
                    onChange={(e) => setLocLng(Number(e.target.value))}
                    className="w-full p-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Allowed Geofence Radius (Meters)
                </label>
                <input
                  type="number"
                  min={20}
                  max={2000}
                  required
                  value={locRadius}
                  onChange={(e) => setLocRadius(Number(e.target.value))}
                  className="w-full p-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-bold"
                />
                <span className="text-[10px] text-slate-400">
                  Technicians within {locRadius} meters are verified as on-site.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setIsLocationModalOpen(false)}
                className="px-4 py-2 rounded-xl border text-xs font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md"
              >
                Save Geofence Location
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MARK LEAVE / HOLIDAY MODAL                                                */}
      {/* ========================================================================= */}
      {isLeaveModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <form
            onSubmit={handleSaveLeave}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                Mark Staff Leave / Holiday
              </h3>
              <button
                type="button"
                onClick={() => setIsLeaveModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <SearchableStaffSelect
                  value={leaveStaffId}
                  onChange={(id) => setLeaveStaffId(id)}
                  staffList={staff}
                  allowAll={false}
                  label="Select Staff Member"
                  placeholder="Choose Staff Member..."
                  required={true}
                  id="leave-staff-select"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Date:
                </label>
                <input
                  type="date"
                  value={leaveDate}
                  onChange={(e) => setLeaveDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Type:
                </label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 font-bold"
                >
                  <option value="leave">Approved Paid/Unpaid Leave</option>
                  <option value="holiday">Company / Public Holiday</option>
                  <option value="weekly_off">Weekly Off</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Notes / Reason:
                </label>
                <input
                  type="text"
                  value={leaveNotes}
                  onChange={(e) => setLeaveNotes(e.target.value)}
                  placeholder="e.g. Medical leave approved by Manager"
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setIsLeaveModalOpen(false)}
                className="px-4 py-2 rounded-xl border text-xs font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md"
              >
                Save Record
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Staff Detailed Monthly Attendance History Drill-Down Modal */}
      {isStaffHistoryModalOpen && selectedStaffForHistory && (
        <StaffAttendanceHistoryModal
          isOpen={isStaffHistoryModalOpen}
          onClose={() => {
            setIsStaffHistoryModalOpen(false);
            setSelectedStaffForHistory(null);
          }}
          staffMember={selectedStaffForHistory}
          staffList={staff}
          attendanceRecords={attendanceRecords}
          isOwnerOrAdmin={isOwnerOrAdmin}
          onOpenCorrection={(record) => {
            setIsStaffHistoryModalOpen(false);
            handleOpenCorrection(record);
          }}
        />
      )}
    </div>
  );
};

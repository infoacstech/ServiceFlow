import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  AttendanceLocationType,
  AttendanceRecord,
} from '../types';
import {
  getCurrentGpsPosition,
  formatDistance,
  formatWorkingDuration,
  GpsPositionResult,
} from '../utils/geolocation';
import {
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Play,
  Square,
  ChevronDown,
  ChevronUp,
  Building2,
  Briefcase,
  Radio,
  ShieldCheck,
  RefreshCw,
  LogOut,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface AttendanceCardProps {
  compact?: boolean;
}

export const AttendanceCard: React.FC<AttendanceCardProps> = () => {
  const {
    currentUser,
    attendanceRecords,
    attendanceLocations,
    attendanceWorkingRules,
    jobs,
    checkInAttendance,
    checkOutAttendance,
    showToast,
  } = useApp();

  // Current date string in YYYY-MM-DD
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Today's attendance record for current user
  const todayRecord: AttendanceRecord | undefined = useMemo(() => {
    if (!currentUser) return undefined;
    return (attendanceRecords || []).find(
      (r) =>
        r.date === todayStr &&
        (r.staffId === currentUser.id ||
          (currentUser.email && r.staffEmail?.toLowerCase() === currentUser.email.toLowerCase()))
    );
  }, [attendanceRecords, currentUser, todayStr]);

  // Is the employee currently checked in and working or already completed?
  const isWorking = todayRecord?.workingState === 'working';
  const isCompleted = todayRecord?.workingState === 'completed';
  const isOnLeave = todayRecord?.status === 'leave' || todayRecord?.status === 'holiday' || todayRecord?.status === 'weekly_off';

  // Expand / Collapse state (Default to COLLAPSED after check-in, completed, or on leave)
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Live digital clock & working duration timer
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isCapturingGps, setIsCapturingGps] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [liveGps, setLiveGps] = useState<GpsPositionResult | null>(null);

  // Form states for Check In modal / Check Out modal
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [isCheckOutModalOpen, setIsCheckOutModalOpen] = useState(false);
  const [selectedTargetType, setSelectedTargetType] = useState<AttendanceLocationType>('office');
  const [selectedLocationOrJobId, setSelectedLocationOrJobId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Active jobs for technician
  const assignedJobsToday = useMemo(() => {
    if (!currentUser) return [];
    return (jobs || []).filter((j) => {
      const isAssigned =
        j.assignedStaffId === currentUser.id ||
        (currentUser.email && j.assignedStaffId === currentUser.email);
      const isPendingOrActive = ['assigned', 'accepted', 'on_the_way', 'started', 'in_progress'].includes(
        j.status
      );
      return isAssigned && isPendingOrActive;
    });
  }, [jobs, currentUser]);

  // Clock tick every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Calculate live working duration if checked in and currently working
  const liveWorkingMinutes = useMemo(() => {
    if (!todayRecord || todayRecord.workingState !== 'working' || !todayRecord.checkInTimestamp) {
      return todayRecord?.workingDurationMinutes || 0;
    }
    const elapsedMs = currentTime.getTime() - todayRecord.checkInTimestamp;
    return Math.max(0, Math.floor(elapsedMs / (1000 * 60)));
  }, [todayRecord, currentTime]);

  // Quick GPS test capture
  const handleTestGps = async () => {
    setIsCapturingGps(true);
    setGpsError(null);
    try {
      const pos = await getCurrentGpsPosition();
      setLiveGps(pos);
      showToast(`GPS Location Locked (${pos.accuracy}m accuracy)`, 'success');
    } catch (err: any) {
      setGpsError(err.userFriendlyMessage || err.message || 'GPS location error');
      showToast(err.userFriendlyMessage || 'Could not fetch GPS location', 'error');
    } finally {
      setIsCapturingGps(false);
    }
  };

  // Check-In Execution
  const handlePerformCheckIn = async () => {
    setIsCapturingGps(true);
    setGpsError(null);
    try {
      const res = await checkInAttendance({
        staffId: currentUser?.id,
        targetType: selectedTargetType,
        targetLocationIdOrJobId: selectedLocationOrJobId || undefined,
        notes: notes.trim() || undefined,
      });

      if (res.success) {
        setIsCheckInModalOpen(false);
        setIsExpanded(false); // Automatically collapse into sleek compact mode!
        setNotes('');
      } else {
        setGpsError(res.message);
      }
    } catch (err: any) {
      setGpsError(err.message || 'Failed to check in');
    } finally {
      setIsCapturingGps(false);
    }
  };

  // Check-Out Execution
  const handlePerformCheckOut = async () => {
    if (!todayRecord) return;
    setIsCapturingGps(true);
    setGpsError(null);
    try {
      const res = await checkOutAttendance({
        staffId: currentUser?.id,
        recordId: todayRecord.id,
        notes: notes.trim() || undefined,
      });

      if (res.success) {
        setIsCheckOutModalOpen(false);
        setIsExpanded(false); // Automatically collapse completed state
        setNotes('');
      } else {
        setGpsError(res.message);
      }
    } catch (err: any) {
      setGpsError(err.message || 'Failed to check out');
    } finally {
      setIsCapturingGps(false);
    }
  };

  // Active permitted offices
  const activeOfficeLocations = useMemo(() => {
    return (attendanceLocations || []).filter((l) => l.isActive);
  }, [attendanceLocations]);

  // Set default target location on opening modal
  useEffect(() => {
    if (isCheckInModalOpen) {
      if (assignedJobsToday.length > 0 && selectedTargetType === 'field_job') {
        setSelectedLocationOrJobId(assignedJobsToday[0].id);
      } else if (activeOfficeLocations.length > 0) {
        setSelectedLocationOrJobId(activeOfficeLocations[0].id);
      }
    }
  }, [isCheckInModalOpen, selectedTargetType, assignedJobsToday, activeOfficeLocations]);

  // Pull-down / swipe touch handler for mobile
  const touchStartY = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchEndY - touchStartY.current;
    if (diff > 40 && !isExpanded) {
      // Swiped downwards -> expand
      setIsExpanded(true);
    } else if (diff < -40 && isExpanded) {
      // Swiped upwards -> collapse
      setIsExpanded(false);
    }
    touchStartY.current = null;
  };

  // =========================================================================
  // SCENARIO 1: PRE-CHECK-IN STATE (Not Checked In Yet)
  // Clean, clear call-to-action that does not take bloated vertical space
  // =========================================================================
  if (!todayRecord || todayRecord.workingState === 'not_checked_in') {
    return (
      <>
        <div
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-3.5 sm:p-4 shadow-sm space-y-3 transition-all"
          id="technician-attendance-pre-checkin"
        >
          {/* Header row with Date & Shift Info */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <span>Daily Attendance</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    ({currentTime.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })})
                  </span>
                </div>
                <div className="text-[10.5px] text-slate-500 font-medium">
                  Shift: <strong className="text-slate-700 dark:text-slate-300">{attendanceWorkingRules?.workStartTime || '09:30'} - {attendanceWorkingRules?.workEndTime || '18:30'}</strong>
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                Not Checked In
              </span>
            </div>
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            id="btn-open-checkin-modal"
            onClick={() => setIsCheckInModalOpen(true)}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/25 transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Check In Now (GPS Verified)</span>
          </button>
        </div>

        {/* Check-In Modal Dialog */}
        {renderCheckInModal()}
      </>
    );
  }

  // =========================================================================
  // SCENARIO 2 & 3: CHECKED IN (WORKING) OR COMPLETED (SHIFT ENDED) / LEAVE
  // High-Density, Space-Saving Compact Bar (~55px) with Smooth Slide-Down Details
  // =========================================================================
  return (
    <>
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden transition-all duration-200"
        id="technician-attendance-card"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* COMPACT ATTENDANCE BAR (Always Visible ~55px-62px) */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setIsExpanded((prev) => !prev)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsExpanded((prev) => !prev);
            }
          }}
          className={`w-full px-3.5 py-2.5 sm:px-4 sm:py-3 flex items-center justify-between gap-2.5 transition-colors cursor-pointer select-none ${
            isWorking
              ? 'bg-emerald-50/70 hover:bg-emerald-50 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50 border-b border-emerald-100/80 dark:border-emerald-900/40'
              : isCompleted
              ? 'bg-slate-50/80 hover:bg-slate-100/80 dark:bg-slate-800/40 dark:hover:bg-slate-800/70 border-b border-slate-100 dark:border-slate-800'
              : 'bg-purple-50/70 hover:bg-purple-50 dark:bg-purple-950/30 border-b border-purple-100'
          }`}
          title="Tap to expand / collapse full attendance details"
        >
          {/* Left Status & Check-In Meta */}
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Pulsing Status Dot */}
            {isWorking ? (
              <div className="relative flex items-center justify-center w-3 h-3 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600" />
              </div>
            ) : isCompleted ? (
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
            ) : (
              <Calendar className="w-4 h-4 text-purple-600 shrink-0" />
            )}

            <div className="flex items-center gap-2 truncate">
              {/* Status Label */}
              <span
                className={`text-xs font-black tracking-tight ${
                  isWorking
                    ? 'text-emerald-900 dark:text-emerald-200'
                    : isCompleted
                    ? 'text-slate-800 dark:text-slate-200'
                    : 'text-purple-900 dark:text-purple-200'
                }`}
              >
                {isWorking
                  ? 'Working'
                  : isCompleted
                  ? 'Shift Completed'
                  : todayRecord.status.replace('_', ' ').toUpperCase()}
              </span>

              <span className="text-slate-300 dark:text-slate-600 text-xs">·</span>

              {/* Time Details */}
              {isWorking ? (
                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate">
                  IN <strong className="font-bold text-slate-900 dark:text-slate-100">{todayRecord.checkInTime}</strong>
                </span>
              ) : isCompleted ? (
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 truncate">
                  {todayRecord.checkInTime} – {todayRecord.checkOutTime || '--:--'}
                </span>
              ) : (
                <span className="text-[11px] text-slate-500">
                  {todayRecord.date}
                </span>
              )}

              <span className="text-slate-300 dark:text-slate-600 text-xs">·</span>

              {/* Live Working Duration Badge */}
              <span
                className={`text-[11px] font-black font-mono px-1.5 py-0.5 rounded-md ${
                  isWorking
                    ? 'bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-950 dark:text-emerald-100'
                    : 'bg-slate-200/60 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                }`}
              >
                {formatWorkingDuration(
                  isWorking ? liveWorkingMinutes : todayRecord.workingDurationMinutes || 0
                )}
              </span>
            </div>
          </div>

          {/* Right Action & Expand Trigger */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Quick Check-Out Button if working (Allows 1-tap checkout without expanding) */}
            {isWorking && (
              <button
                type="button"
                id="btn-quick-checkout"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCheckOutModalOpen(true);
                }}
                className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-extrabold text-[11px] flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                title="Quick Check-Out"
              >
                <Square className="w-3 h-3 fill-white" />
                <span className="hidden xs:inline">Check Out</span>
              </button>
            )}

            {/* Expand / Collapse Chevron Indicator */}
            <div className="p-1 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5 transition-transform">
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* EXPANDABLE FULL ATTENDANCE DETAILS DRAWER                                 */}
        {/* ========================================================================= */}
        {isExpanded && (
          <div className="p-3.5 sm:p-4 space-y-3 bg-white dark:bg-slate-900 animate-in fade-in slide-in-from-top-1 duration-150">
            {/* Shift Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-0.5">
                <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                  Check-In
                </div>
                <div className="text-sm font-black text-slate-900 dark:text-slate-100">
                  {todayRecord.checkInTime || '--:--'}
                </div>
                {todayRecord.isLate && (
                  <div className="text-[10px] text-amber-600 font-bold">Late by {todayRecord.lateMinutes}m</div>
                )}
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-0.5">
                <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                  {isWorking ? 'Current Duration' : 'Total Duration'}
                </div>
                <div className="text-sm font-black text-indigo-600 dark:text-indigo-400 font-mono">
                  {formatWorkingDuration(isWorking ? liveWorkingMinutes : todayRecord.workingDurationMinutes)}
                </div>
                {isWorking && <div className="text-[10px] text-emerald-600 font-semibold">● Active live timer</div>}
              </div>

              {isCompleted && (
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-0.5 col-span-2 sm:col-span-1">
                  <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                    Check-Out
                  </div>
                  <div className="text-sm font-black text-slate-900 dark:text-slate-100">
                    {todayRecord.checkOutTime || '--:--'}
                  </div>
                  <div className="text-[10px] text-blue-600 font-semibold">Shift Ended</div>
                </div>
              )}
            </div>

            {/* Verified Location & GPS Geofence details */}
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1 font-semibold text-[11px]">
                  <MapPin className="w-3.5 h-3.5 text-indigo-500" /> Verified Location:
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[200px] text-[11px]">
                  {todayRecord.checkInLocationName || 'Permitted Office / Site'}
                </span>
              </div>

              {todayRecord.checkInDistance !== undefined && (
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Geofence Verification:
                  </span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    Within {formatDistance(todayRecord.checkInDistance)} (±{todayRecord.checkInAccuracy || 10}m)
                  </span>
                </div>
              )}

              {(todayRecord.checkInNotes || todayRecord.checkOutNotes) && (
                <div className="text-[10.5px] text-slate-500 italic pt-0.5">
                  Remarks: "{todayRecord.checkInNotes || todayRecord.checkOutNotes}"
                </div>
              )}
            </div>

            {/* Check-Out / Shift Ending Button inside expanded state */}
            {isWorking && (
              <div className="pt-1 flex items-center gap-2">
                <button
                  type="button"
                  id="btn-expanded-checkout"
                  onClick={() => setIsCheckOutModalOpen(true)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-[0.99] text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm shadow-rose-600/25 transition-all cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5 fill-white" />
                  <span>Check Out & End Shift</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold transition-all"
                  title="Collapse"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Check-In Modal Dialog */}
      {renderCheckInModal()}

      {/* Check-Out Modal Dialog */}
      {renderCheckOutModal()}
    </>
  );

  // =========================================================================
  // HELPER: Check-In Modal Dialog
  // =========================================================================
  function renderCheckInModal() {
    if (!isCheckInModalOpen) return null;

    return (
      <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
        <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-300 flex items-center justify-center">
                <Play className="w-4 h-4 fill-emerald-600" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                  Shift Check-In Verification
                </h3>
                <p className="text-[10px] text-slate-400">GPS location verification will be recorded</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsCheckInModalOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
            >
              ✕
            </button>
          </div>

          {gpsError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">Verification Error</div>
                <div className="text-[11px]">{gpsError}</div>
              </div>
            </div>
          )}

          <div className="space-y-3 text-xs">
            {/* Check-In Location Type */}
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Select Check-In Site Type:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTargetType('office');
                    if (activeOfficeLocations.length > 0) {
                      setSelectedLocationOrJobId(activeOfficeLocations[0].id);
                    }
                  }}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    selectedTargetType === 'office'
                      ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-600 text-indigo-600 dark:text-indigo-300 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Building2 className="w-4 h-4" /> Office / Branch
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedTargetType('field_job');
                    if (assignedJobsToday.length > 0) {
                      setSelectedLocationOrJobId(assignedJobsToday[0].id);
                    }
                  }}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    selectedTargetType === 'field_job'
                      ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-600 text-indigo-600 dark:text-indigo-300 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Briefcase className="w-4 h-4" /> Client Job Site
                </button>
              </div>
            </div>

            {/* Selection for Target */}
            {selectedTargetType === 'office' && (
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Permitted Office / Geofence:
                </label>
                {activeOfficeLocations.length === 0 ? (
                  <div className="p-2.5 rounded-xl bg-amber-50 text-amber-800 text-xs">
                    No office geofences configured. Location coordinates will be recorded as general site.
                  </div>
                ) : (
                  <select
                    value={selectedLocationOrJobId}
                    onChange={(e) => setSelectedLocationOrJobId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                  >
                    {activeOfficeLocations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name} ({loc.radiusMeters}m geofence)
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {selectedTargetType === 'field_job' && (
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Select Assigned Job:
                </label>
                {assignedJobsToday.length === 0 ? (
                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs">
                    No active assigned jobs found today. You can select Office or general field check-in.
                  </div>
                ) : (
                  <select
                    value={selectedLocationOrJobId}
                    onChange={(e) => setSelectedLocationOrJobId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                  >
                    {assignedJobsToday.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.jobId} - {j.description} ({j.location})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Optional Notes */}
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Remarks / Notes (Optional):
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Reporting for Morning Shift / Site visit #1"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
              />
            </div>

            {/* GPS Diagnostic & Accuracy Check */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-500 animate-pulse shrink-0" />
                <div>
                  <div className="font-bold text-slate-900 dark:text-slate-100">Live GPS Location</div>
                  <div className="text-[10px] text-slate-500">
                    {liveGps
                      ? `${liveGps.latitude.toFixed(5)}, ${liveGps.longitude.toFixed(5)} (±${liveGps.accuracy}m)`
                      : 'Coordinates will lock on confirm'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleTestGps}
                disabled={isCapturingGps}
                className="p-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-200 hover:bg-slate-100 cursor-pointer"
                title="Test GPS capture"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isCapturingGps ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsCheckInModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              id="btn-confirm-checkin"
              onClick={handlePerformCheckIn}
              disabled={isCapturingGps}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-extrabold text-xs shadow-md flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isCapturingGps ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Verifying GPS...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-white" /> Confirm Check-In
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // HELPER: Check-Out Modal Dialog
  // =========================================================================
  function renderCheckOutModal() {
    if (!isCheckOutModalOpen) return null;

    return (
      <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
        <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-300 flex items-center justify-center">
                <Square className="w-4 h-4 fill-rose-600" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                  Shift Check-Out Confirmation
                </h3>
                <p className="text-[10px] text-slate-400">Total duration will be finalized</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsCheckOutModalOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
            >
              ✕
            </button>
          </div>

          {gpsError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="text-[11px]">{gpsError}</div>
            </div>
          )}

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Shift Check-In:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{todayRecord?.checkInTime}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Estimated Total Time:</span>
                <span className="font-black text-indigo-600 dark:text-indigo-400">
                  {formatWorkingDuration(liveWorkingMinutes)}
                </span>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                End of Day Notes / Summary (Optional):
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Completed all scheduled field jobs successfully"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsCheckOutModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              id="btn-confirm-checkout"
              onClick={handlePerformCheckOut}
              disabled={isCapturingGps}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white font-extrabold text-xs shadow-md flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isCapturingGps ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Verifying GPS...
                </>
              ) : (
                <>
                  <Square className="w-3.5 h-3.5 fill-white" /> Confirm Check-Out
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }
};

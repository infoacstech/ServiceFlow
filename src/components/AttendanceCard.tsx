import React, { useState, useEffect, useMemo } from 'react';
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
  Navigation,
  Sparkles,
  ChevronDown,
  Building2,
  Briefcase,
  AlertTriangle,
  Radio,
  FileText,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

interface AttendanceCardProps {
  compact?: boolean;
}

export const AttendanceCard: React.FC<AttendanceCardProps> = ({ compact = false }) => {
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

  // Live digital clock & working duration timer
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isCapturingGps, setIsCapturingGps] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [liveGps, setLiveGps] = useState<GpsPositionResult | null>(null);

  // Form states for Check In modal / inline drawer
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

  // Status visual badge
  const renderStatusBadge = () => {
    if (!todayRecord || todayRecord.workingState === 'not_checked_in') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          Not Checked In
        </span>
      );
    }

    if (todayRecord.workingState === 'working') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          WORKING (ACTIVE SHIFT)
        </span>
      );
    }

    if (todayRecord.workingState === 'completed') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800">
          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
          Shift Completed
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
        {todayRecord.status.toUpperCase()}
      </span>
    );
  };

  return (
    <div
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-sm space-y-3.5"
      id="technician-attendance-card"
    >
      {/* 1. Header: Live Time & Status */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-600/10 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800/80 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <span>Daily Attendance</span>
              <span className="text-[10px] text-slate-400 font-medium">
                ({currentTime.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })})
              </span>
            </div>
            <div className="text-[11px] font-bold text-slate-500 font-mono">
              {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
            </div>
          </div>
        </div>

        <div>{renderStatusBadge()}</div>
      </div>

      {/* 2. Main Attendance State Display */}
      {(!todayRecord || todayRecord.workingState === 'not_checked_in') && (
        <div className="space-y-3">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
              <span className="font-medium">Scheduled Shift:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {attendanceWorkingRules?.workStartTime || '09:30'} - {attendanceWorkingRules?.workEndTime || '18:30'}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
              <span className="font-medium">GPS Verification:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Mandatory on Check-In
              </span>
            </div>
          </div>

          <button
            type="button"
            id="btn-open-checkin-modal"
            onClick={() => setIsCheckInModalOpen(true)}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            Check In Now (GPS Verified)
          </button>
        </div>
      )}

      {todayRecord && todayRecord.workingState === 'working' && (
        <div className="space-y-3">
          {/* Active Shift Details Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/60 space-y-0.5">
              <div className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300">
                Check-In Time
              </div>
              <div className="text-sm font-black text-emerald-950 dark:text-emerald-100">
                {todayRecord.checkInTime || '--:--'}
              </div>
              {todayRecord.isLate && (
                <div className="text-[10px] text-amber-600 font-bold">Late by {todayRecord.lateMinutes}m</div>
              )}
            </div>

            <div className="p-3 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/70 dark:border-indigo-800/60 space-y-0.5">
              <div className="text-[10px] uppercase font-bold text-indigo-700 dark:text-indigo-300 flex items-center justify-between">
                <span>Working Timer</span>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
              </div>
              <div className="text-sm font-black text-indigo-950 dark:text-indigo-100 font-mono">
                {formatWorkingDuration(liveWorkingMinutes)}
              </div>
              <div className="text-[10px] text-indigo-500">Live calculating</div>
            </div>
          </div>

          {/* Location details & verified badge */}
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-[11px] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1 font-semibold">
                <MapPin className="w-3.5 h-3.5 text-indigo-500" /> Check-In Location:
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                {todayRecord.checkInLocationName || 'Permitted Site'}
              </span>
            </div>
            {todayRecord.checkInDistance !== undefined && (
              <div className="flex items-center justify-between text-slate-500">
                <span>Distance from Geofence:</span>
                <span className="font-semibold text-emerald-600">
                  {formatDistance(todayRecord.checkInDistance)} (Verified)
                </span>
              </div>
            )}
          </div>

          {/* Check-Out Button */}
          <button
            type="button"
            id="btn-open-checkout-modal"
            onClick={() => setIsCheckOutModalOpen(true)}
            className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-[0.99] text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-rose-600/20 transition-all cursor-pointer"
          >
            <Square className="w-4 h-4 fill-white" />
            Check Out & End Shift
          </button>
        </div>
      )}

      {todayRecord && todayRecord.workingState === 'completed' && (
        <div className="space-y-2.5">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                <div className="text-[10px] text-slate-400 font-bold uppercase">In</div>
                <div className="font-black text-slate-800 dark:text-slate-100">{todayRecord.checkInTime || '--:--'}</div>
              </div>
              <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Out</div>
                <div className="font-black text-slate-800 dark:text-slate-100">{todayRecord.checkOutTime || '--:--'}</div>
              </div>
              <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Total Duration</div>
                <div className="font-black text-emerald-600 dark:text-emerald-400">
                  {formatWorkingDuration(todayRecord.workingDurationMinutes)}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
              <span>Status Evaluation:</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400 capitalize">
                {todayRecord.status.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. CHECK-IN MODAL (GPS Capture & Verification Dialog)                     */}
      {/* ========================================================================= */}
      {isCheckInModalOpen && (
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
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
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
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
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
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
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
                  <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
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
                  className="p-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-200 hover:bg-slate-100"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCapturingGps ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsCheckInModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-checkin"
                onClick={handlePerformCheckIn}
                disabled={isCapturingGps}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-extrabold text-xs shadow-md flex items-center gap-2 disabled:opacity-50"
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
      )}

      {/* ========================================================================= */}
      {/* 4. CHECK-OUT MODAL                                                        */}
      {/* ========================================================================= */}
      {isCheckOutModalOpen && (
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
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
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
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-checkout"
                onClick={handlePerformCheckOut}
                disabled={isCapturingGps}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white font-extrabold text-xs shadow-md flex items-center gap-2 disabled:opacity-50"
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
      )}
    </div>
  );
};

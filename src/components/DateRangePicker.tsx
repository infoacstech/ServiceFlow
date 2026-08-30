import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Clock,
  Check,
  RotateCcw,
} from 'lucide-react';

export interface DateRange {
  startDate: string; // 'YYYY-MM-DD' or ''
  endDate: string;   // 'YYYY-MM-DD' or ''
  preset?: string;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
  align?: 'left' | 'right';
  compact?: boolean;
}

/**
 * Returns YYYY-MM-DD string in the user's local timezone
 */
export const getLocalDateString = (d: Date = new Date()): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Formats YYYY-MM-DD into a clean readable date: e.g. "30 Aug 2026"
 */
export const formatDateDisplay = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [y, m, d] = parts.map(Number);
  if (!y || !m || !d) return dateStr;
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const getPresetDates = (presetKey: string, customValue?: DateRange): DateRange => {
  const today = new Date();
  const todayStr = getLocalDateString(today);

  switch (presetKey) {
    case 'all':
      return { startDate: '', endDate: '', preset: 'all' };
    case 'today':
      return { startDate: todayStr, endDate: todayStr, preset: 'today' };
    case 'yesterday': {
      const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
      const yStr = getLocalDateString(yesterday);
      return { startDate: yStr, endDate: yStr, preset: 'yesterday' };
    }
    case 'last_7_days': {
      const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6);
      return {
        startDate: getLocalDateString(start),
        endDate: todayStr,
        preset: 'last_7_days',
      };
    }
    case 'this_week': {
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Monday
      const start = new Date(today.getFullYear(), today.getMonth(), diff);
      return { startDate: getLocalDateString(start), endDate: todayStr, preset: 'this_week' };
    }
    case 'this_month': {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return { startDate: getLocalDateString(start), endDate: todayStr, preset: 'this_month' };
    }
    case 'last_month': {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      return {
        startDate: getLocalDateString(start),
        endDate: getLocalDateString(end),
        preset: 'last_month',
      };
    }
    case 'last_30_days': {
      const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29);
      return {
        startDate: getLocalDateString(start),
        endDate: todayStr,
        preset: 'last_30_days',
      };
    }
    case 'this_quarter': {
      const currentQuarter = Math.floor(today.getMonth() / 3);
      const start = new Date(today.getFullYear(), currentQuarter * 3, 1);
      return {
        startDate: getLocalDateString(start),
        endDate: todayStr,
        preset: 'this_quarter',
      };
    }
    case 'last_quarter': {
      const currentQuarter = Math.floor(today.getMonth() / 3);
      const year = currentQuarter === 0 ? today.getFullYear() - 1 : today.getFullYear();
      const quarterStartMonth = currentQuarter === 0 ? 9 : (currentQuarter - 1) * 3;
      const start = new Date(year, quarterStartMonth, 1);
      const end = new Date(year, quarterStartMonth + 3, 0);
      return {
        startDate: getLocalDateString(start),
        endDate: getLocalDateString(end),
        preset: 'last_quarter',
      };
    }
    case 'this_year': {
      const start = new Date(today.getFullYear(), 0, 1);
      return { startDate: getLocalDateString(start), endDate: todayStr, preset: 'this_year' };
    }
    case 'custom':
      return {
        startDate: customValue?.startDate || todayStr,
        endDate: customValue?.endDate || todayStr,
        preset: 'custom',
      };
    default:
      return { startDate: '', endDate: '', preset: 'all' };
  }
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  className = '',
  align = 'right',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const todayStr = useMemo(() => getLocalDateString(new Date()), []);

  // Calendar month/year navigation state
  const [navYear, setNavYear] = useState<number>(() => {
    if (value.startDate) {
      const parsed = new Date(value.startDate);
      if (!isNaN(parsed.getTime())) return parsed.getFullYear();
    }
    return new Date().getFullYear();
  });

  const [navMonth, setNavMonth] = useState<number>(() => {
    if (value.startDate) {
      const parsed = new Date(value.startDate);
      if (!isNaN(parsed.getTime())) return parsed.getMonth();
    }
    return new Date().getMonth();
  });

  const [activeTab, setActiveTab] = useState<'calendar' | 'range'>('calendar');

  // Keep calendar month synced with selection when opened
  useEffect(() => {
    if (isOpen && value.startDate) {
      const [y, m] = value.startDate.split('-').map(Number);
      if (y && m) {
        setNavYear(y);
        setNavMonth(m - 1);
      }
    }
  }, [isOpen, value.startDate]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const formatDateLabel = (): string => {
    // If a single day is selected (startDate === endDate)
    if (value.startDate && value.endDate && value.startDate === value.endDate) {
      if (value.startDate === todayStr) {
        return `📅 ${formatDateDisplay(todayStr)}`;
      }
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (value.startDate === getLocalDateString(yesterday)) {
        return `📅 ${formatDateDisplay(value.startDate)}`;
      }
      return `📅 ${formatDateDisplay(value.startDate)}`;
    }

    if (value.preset && value.preset !== 'custom') {
      switch (value.preset) {
        case 'today':
          return `📅 ${formatDateDisplay(todayStr)}`;
        case 'yesterday': {
          const y = new Date();
          y.setDate(y.getDate() - 1);
          return `📅 ${formatDateDisplay(getLocalDateString(y))}`;
        }
        case 'last_7_days':
          return '📅 Last 7 Days';
        case 'this_week':
          return '📅 This Week';
        case 'this_month':
          return '📅 This Month';
        case 'last_month':
          return '📅 Last Month';
        case 'last_30_days':
          return '📅 Last 30 Days';
        case 'this_quarter':
          return '📅 This Quarter';
        case 'last_quarter':
          return '📅 Last Quarter';
        case 'this_year':
          return '📅 This Year';
        case 'all':
          return '📅 All History';
        default:
          break;
      }
    }

    if (value.startDate && value.endDate) {
      return `📅 ${formatDateDisplay(value.startDate)} - ${formatDateDisplay(value.endDate)}`;
    } else if (value.startDate) {
      return `📅 From ${formatDateDisplay(value.startDate)}`;
    } else if (value.endDate) {
      return `📅 Until ${formatDateDisplay(value.endDate)}`;
    }

    return '📅 All History';
  };

  const handleSelectPreset = (presetKey: string) => {
    if (presetKey === 'custom') {
      setActiveTab('range');
    } else {
      const range = getPresetDates(presetKey);
      onChange(range);
      setIsOpen(false);
    }
  };

  const handleSelectSingleDate = (dateStr: string) => {
    const isToday = dateStr === todayStr;
    onChange({
      startDate: dateStr,
      endDate: dateStr,
      preset: isToday ? 'today' : 'custom',
    });
    setIsOpen(false);
  };

  const handleCustomRangeChange = (field: 'startDate' | 'endDate', val: string) => {
    const updated: DateRange = {
      startDate: field === 'startDate' ? val : (value.startDate || todayStr),
      endDate: field === 'endDate' ? val : (value.endDate || todayStr),
      preset: 'custom',
    };
    onChange(updated);
  };

  const handlePrevMonth = () => {
    if (navMonth === 0) {
      setNavMonth(11);
      setNavYear((y) => y - 1);
    } else {
      setNavMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (navMonth === 11) {
      setNavMonth(0);
      setNavYear((y) => y + 1);
    } else {
      setNavMonth((m) => m + 1);
    }
  };

  // Generate calendar days for the current navMonth & navYear
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(navYear, navMonth, 1).getDay(); // 0 = Sun
    const totalDaysInMonth = new Date(navYear, navMonth + 1, 0).getDate();
    const prevMonthDays = new Date(navYear, navMonth, 0).getDate();

    const days: {
      dayNum: number;
      dateStr: string;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      isInRange: boolean;
    }[] = [];

    // Previous month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const prevM = navMonth === 0 ? 11 : navMonth - 1;
      const prevY = navMonth === 0 ? navYear - 1 : navYear;
      const dateStr = `${prevY}-${String(prevM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dayNum: d,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isSelected: value.startDate === dateStr || value.endDate === dateStr,
        isInRange: Boolean(value.startDate && value.endDate && dateStr >= value.startDate && dateStr <= value.endDate),
      });
    }

    // Current month days
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dateStr = `${navYear}-${String(navMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isSelected = value.startDate === dateStr || value.endDate === dateStr;
      const isInRange = Boolean(
        value.startDate && value.endDate && dateStr >= value.startDate && dateStr <= value.endDate
      );
      days.push({
        dayNum: d,
        dateStr,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        isSelected,
        isInRange,
      });
    }

    // Next month padding to fill up grid to multiple of 7
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextM = navMonth === 11 ? 0 : navMonth + 1;
      const nextY = navMonth === 11 ? navYear + 1 : navYear;
      const dateStr = `${nextY}-${String(nextM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dayNum: d,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isSelected: value.startDate === dateStr || value.endDate === dateStr,
        isInRange: Boolean(value.startDate && value.endDate && dateStr >= value.startDate && dateStr <= value.endDate),
      });
    }

    return days;
  }, [navYear, navMonth, todayStr, value.startDate, value.endDate]);

  const hasFilter = Boolean(value.startDate || value.endDate || (value.preset && value.preset !== 'all'));

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      {/* Interactive Trigger Button */}
      <button
        type="button"
        id="jobs-date-picker-trigger"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 sm:gap-2 px-3 py-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer shadow-2xs select-none ${
          hasFilter
            ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
        }`}
        title="Click to select specific date or range"
      >
        <CalendarIcon className="w-3.5 h-3.5 shrink-0" />
        <span className="whitespace-nowrap font-bold tracking-tight">{formatDateLabel()}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Calendar & Date Picker Dropdown Popover */}
      {isOpen && (
        <div
          className={`absolute top-full mt-2 z-50 w-[calc(100vw-2rem)] sm:w-84 max-w-[340px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-3.5 space-y-3 animate-in fade-in zoom-in-95 duration-150 ${
            align === 'right' ? 'right-0 sm:right-0' : 'left-0'
          }`}
          style={{ maxHeight: '85vh', overflowY: 'auto' }}
        >
          {/* Header & View Switcher */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('calendar')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'calendar'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Date Calendar
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('range')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'range'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Custom Range
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleSelectPreset('today')}
              className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" /> Today
            </button>
          </div>

          {/* Quick Shortcuts Bar */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-0.5">
            {[
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'last_7_days', label: 'Last 7D' },
              { id: 'this_month', label: 'Month' },
              { id: 'all', label: 'All' },
            ].map((p) => {
              const isActive = (value.preset || 'all') === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPreset(p.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {activeTab === 'calendar' ? (
            /* Interactive Month Calendar Grid */
            <div className="space-y-2.5">
              {/* Month Navigation */}
              <div className="flex items-center justify-between px-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-pointer"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="font-extrabold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <span>{MONTH_NAMES[navMonth]}</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-mono">{navYear}</span>
                </div>

                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-pointer"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Day of Week Headers */}
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500">
                <span>Su</span>
                <span>Mo</span>
                <span>Tu</span>
                <span>We</span>
                <span>Th</span>
                <span>Fr</span>
                <span>Sa</span>
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((item, idx) => {
                  const isSelected = item.isSelected;
                  const isToday = item.isToday;

                  return (
                    <button
                      key={`${item.dateStr}-${idx}`}
                      type="button"
                      onClick={() => handleSelectSingleDate(item.dateStr)}
                      className={`h-8 sm:h-8.5 rounded-xl flex flex-col items-center justify-center text-xs font-bold transition-all relative cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-xs font-black scale-105 z-10'
                          : item.isInRange
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                          : item.isCurrentMonth
                          ? 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                          : 'text-slate-300 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <span>{item.dayNum}</span>
                      {isToday && !isSelected && (
                        <span className="absolute bottom-1 w-1 h-1 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Quick Native Date Input Fallback */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold text-slate-400">Or type date:</span>
                <input
                  type="date"
                  value={value.startDate || todayStr}
                  onChange={(e) => {
                    if (e.target.value) {
                      handleSelectSingleDate(e.target.value);
                    }
                  }}
                  className="px-2 py-1 bg-slate-50 dark:bg-slate-800 rounded-lg text-[11px] font-bold border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                />
              </div>
            </div>
          ) : (
            /* Custom Multi-Day Range Selector */
            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={value.startDate || todayStr}
                    onChange={(e) => handleCustomRangeChange('startDate', e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={value.endDate || todayStr}
                    onChange={(e) => handleCustomRangeChange('endDate', e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Apply Range
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

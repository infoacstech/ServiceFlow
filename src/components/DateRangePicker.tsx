import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, X, Clock, Check } from 'lucide-react';

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

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  className = '',
  align = 'left',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDateLabel = () => {
    if (value.preset && value.preset !== 'custom') {
      switch (value.preset) {
        case 'all':
          return 'All Time';
        case 'today':
          return 'Today';
        case 'yesterday':
          return 'Yesterday';
        case 'last_7_days':
          return 'Last 7 Days';
        case 'this_week':
          return 'This Week';
        case 'this_month':
          return 'This Month';
        case 'last_month':
          return 'Last Month';
        case 'last_30_days':
          return 'Last 30 Days';
        case 'this_quarter':
          return 'This Quarter';
        case 'last_quarter':
          return 'Last Quarter';
        case 'this_year':
          return 'This Year';
        default:
          break;
      }
    }

    if (value.startDate && value.endDate) {
      if (value.startDate === value.endDate) {
        return value.startDate;
      }
      return `${value.startDate} to ${value.endDate}`;
    } else if (value.startDate) {
      return `From ${value.startDate}`;
    } else if (value.endDate) {
      return `Until ${value.endDate}`;
    }

    return 'All Time';
  };

  const handleSelectPreset = (presetKey: string) => {
    if (presetKey === 'custom') {
      onChange({ ...value, preset: 'custom' });
    } else {
      const range = getPresetDates(presetKey);
      onChange(range);
      setIsOpen(false);
    }
  };

  const handleCustomDateChange = (field: 'startDate' | 'endDate', val: string) => {
    const updated = {
      ...value,
      [field]: val,
      preset: 'custom',
    };
    onChange(updated);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange({ startDate: '', endDate: '', preset: 'all' });
  };

  const primaryPresets = [
    { id: 'today', label: 'Today 📅' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: 'last_7_days', label: 'Last 7 Days' },
    { id: 'this_month', label: 'This Month' },
    { id: 'custom', label: 'Custom Date / Range 🗓️' },
    { id: 'all', label: 'All Time (History)' },
  ];

  const secondaryPresets = [
    { id: 'this_week', label: 'This Week' },
    { id: 'last_month', label: 'Last Month' },
    { id: 'last_30_days', label: 'Last 30 Days' },
    { id: 'this_quarter', label: 'This Quarter' },
    { id: 'last_quarter', label: 'Last Quarter' },
    { id: 'this_year', label: 'This Year' },
  ];

  const [showMorePresets, setShowMorePresets] = useState(false);
  const [customMode, setCustomMode] = useState<'single' | 'range'>('single');

  const hasFilter = Boolean(value.startDate || value.endDate || (value.preset && value.preset !== 'all'));

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 sm:gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
          hasFilter
            ? 'bg-indigo-50/90 dark:bg-indigo-950/70 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 shadow-2xs'
            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60'
        }`}
      >
        <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
        <span className="whitespace-nowrap font-bold">{formatDateLabel()}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className={`absolute top-full mt-1.5 z-50 w-72 sm:w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-3 space-y-2.5 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-600" /> Filter by Date
            </span>
            <div className="flex items-center gap-2">
              {value.preset !== 'today' && (
                <button
                  type="button"
                  onClick={() => {
                    handleSelectPreset('today');
                  }}
                  className="text-[11px] text-indigo-600 hover:text-indigo-700 font-bold"
                >
                  Set Today
                </button>
              )}
              {hasFilter && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-[11px] text-slate-400 hover:text-rose-600 font-medium"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Primary Quick Presets */}
          <div className="grid grid-cols-2 gap-1.5">
            {primaryPresets.map((p) => {
              const isActive = (value.preset || 'all') === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPreset(p.id)}
                  className={`px-2.5 py-1.5 rounded-xl text-left text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white font-bold shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50/50 dark:hover:bg-slate-700/80'
                  }`}
                >
                  <span className="truncate">{p.label}</span>
                  {isActive && <Check className="w-3 h-3 shrink-0 ml-1" />}
                </button>
              );
            })}
          </div>

          {/* Custom Date Pickers */}
          {(value.preset === 'custom' || (value.startDate && !value.preset)) && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2 bg-slate-50/70 dark:bg-slate-800/50 p-2.5 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Custom Date Selection
                </span>
                <div className="flex items-center bg-slate-200 dark:bg-slate-700 p-0.5 rounded-lg text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      setCustomMode('single');
                      if (value.startDate) {
                        handleCustomDateChange('endDate', value.startDate);
                      }
                    }}
                    className={`px-2 py-0.5 rounded-md transition-all ${
                      customMode === 'single' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-2xs' : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Single Day
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomMode('range')}
                    className={`px-2 py-0.5 rounded-md transition-all ${
                      customMode === 'range' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-2xs' : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Date Range
                  </button>
                </div>
              </div>

              {customMode === 'single' ? (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Select Specific Date</label>
                  <input
                    type="date"
                    value={value.startDate || getLocalDateString()}
                    onChange={(e) => {
                      const d = e.target.value;
                      onChange({ startDate: d, endDate: d, preset: 'custom' });
                    }}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">From Date</label>
                    <input
                      type="date"
                      value={value.startDate}
                      onChange={(e) => handleCustomDateChange('startDate', e.target.value)}
                      className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">To Date</label>
                    <input
                      type="date"
                      value={value.endDate}
                      onChange={(e) => handleCustomDateChange('endDate', e.target.value)}
                      className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* More Presets Expandable */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowMorePresets(!showMorePresets)}
              className="text-[11px] font-semibold text-slate-500 hover:text-indigo-600 flex items-center justify-between w-full py-1"
            >
              <span>{showMorePresets ? 'Hide extended ranges' : 'More period options...'}</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${showMorePresets ? 'rotate-180' : ''}`} />
            </button>

            {showMorePresets && (
              <div className="grid grid-cols-2 gap-1 pt-1.5 animate-in fade-in">
                {secondaryPresets.map((p) => {
                  const isActive = (value.preset || 'all') === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectPreset(p.id)}
                      className={`px-2 py-1 rounded-lg text-left text-[11px] font-medium transition-all flex items-center justify-between cursor-pointer ${
                        isActive
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span className="truncate">{p.label}</span>
                      {isActive && <Check className="w-2.5 h-2.5 shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-1.5 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-400">
              {value.preset === 'today' ? 'Showing Today only' : 'Date filtered'}
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-xs font-bold shadow-xs hover:bg-indigo-700 cursor-pointer"
            >
              Apply Filter
            </button>
          </div>
        </div>
      )}
    </div>
  );
};


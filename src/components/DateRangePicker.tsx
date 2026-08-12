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
}

export const getPresetDates = (presetKey: string, customValue?: DateRange): DateRange => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  switch (presetKey) {
    case 'all':
      return { startDate: '', endDate: '', preset: 'all' };
    case 'today':
      return { startDate: todayStr, endDate: todayStr, preset: 'today' };
    case 'yesterday': {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const yStr = yesterday.toISOString().split('T')[0];
      return { startDate: yStr, endDate: yStr, preset: 'yesterday' };
    }
    case 'last_7_days': {
      const start = new Date(today);
      start.setDate(today.getDate() - 6);
      return {
        startDate: start.toISOString().split('T')[0],
        endDate: todayStr,
        preset: 'last_7_days',
      };
    }
    case 'this_week': {
      const start = new Date(today);
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Monday
      start.setDate(diff);
      const sStr = start.toISOString().split('T')[0];
      return { startDate: sStr, endDate: todayStr, preset: 'this_week' };
    }
    case 'this_month': {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const sStr = start.toISOString().split('T')[0];
      return { startDate: sStr, endDate: todayStr, preset: 'this_month' };
    }
    case 'last_month': {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      return {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
        preset: 'last_month',
      };
    }
    case 'last_30_days': {
      const start = new Date(today);
      start.setDate(today.getDate() - 29);
      return {
        startDate: start.toISOString().split('T')[0],
        endDate: todayStr,
        preset: 'last_30_days',
      };
    }
    case 'this_quarter': {
      const currentQuarter = Math.floor(today.getMonth() / 3);
      const start = new Date(today.getFullYear(), currentQuarter * 3, 1);
      return {
        startDate: start.toISOString().split('T')[0],
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
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
        preset: 'last_quarter',
      };
    }
    case 'this_year': {
      const start = new Date(today.getFullYear(), 0, 1);
      return { startDate: start.toISOString().split('T')[0], endDate: todayStr, preset: 'this_year' };
    }
    case 'custom':
      return {
        startDate: customValue?.startDate || '',
        endDate: customValue?.endDate || '',
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

  const presets = [
    { id: 'all', label: 'All Time' },
    { id: 'today', label: 'Today' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: 'last_7_days', label: 'Last 7 Days' },
    { id: 'this_week', label: 'This Week' },
    { id: 'this_month', label: 'This Month' },
    { id: 'last_month', label: 'Last Month' },
    { id: 'last_30_days', label: 'Last 30 Days' },
    { id: 'this_quarter', label: 'This Quarter' },
    { id: 'last_quarter', label: 'Last Quarter' },
    { id: 'this_year', label: 'This Year' },
    { id: 'custom', label: 'Custom Range' },
  ];

  const hasFilter = Boolean(value.startDate || value.endDate || (value.preset && value.preset !== 'all'));

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
          hasFilter
            ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300'
            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60'
        }`}
      >
        <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
        <span className="whitespace-nowrap">{formatDateLabel()}</span>
        {hasFilter && (
          <span
            onClick={handleClear}
            className="p-0.5 rounded-full hover:bg-indigo-200/50 dark:hover:bg-indigo-900/50 text-indigo-500"
            title="Clear date filter"
          >
            <X className="w-3 h-3" />
          </span>
        )}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className={`absolute top-full mt-2 z-50 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-3 space-y-3 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-600" /> Date Preset Selector
            </span>
            {hasFilter && (
              <button
                type="button"
                onClick={handleClear}
                className="text-[11px] text-slate-400 hover:text-indigo-600 font-medium"
              >
                Reset
              </button>
            )}
          </div>

          {/* Presets Grid */}
          <div className="grid grid-cols-2 gap-1.5">
            {presets.map((p) => {
              const isActive = (value.preset || 'all') === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPreset(p.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-left text-xs font-medium transition-all flex items-center justify-between ${
                    isActive
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <span className="truncate">{p.label}</span>
                  {isActive && <Check className="w-3 h-3 shrink-0 ml-1" />}
                </button>
              );
            })}
          </div>

          {/* Custom Date Pickers */}
          {((value.preset === 'custom') || (value.startDate && !value.preset)) && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">From Date</label>
                <input
                  type="date"
                  value={value.startDate}
                  onChange={(e) => handleCustomDateChange('startDate', e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">To Date</label>
                <input
                  type="date"
                  value={value.endDate}
                  onChange={(e) => handleCustomDateChange('endDate', e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-xs font-bold shadow-xs hover:bg-indigo-700"
            >
              Apply Filter
            </button>
          </div>
        </div>
      )}
    </div>
  );
};


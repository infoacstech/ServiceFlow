import React, { useState, useRef, useEffect, useMemo } from 'react';
import { User } from '../types';
import { getEmployeeCode, matchesStaffSearch, formatRoleLabel } from '../utils/employeeCode';
import { Search, ChevronDown, Check, X, User as UserIcon, Users, Phone } from 'lucide-react';

export interface SearchableStaffSelectProps {
  value: string; // staff ID or 'all'
  onChange: (staffId: string, staffMember?: User | null) => void;
  staffList: User[];
  label?: string;
  placeholder?: string;
  allowAll?: boolean;
  allLabel?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  buttonClassName?: string;
  id?: string;
  error?: string;
}

export const SearchableStaffSelect: React.FC<SearchableStaffSelectProps> = ({
  value,
  onChange,
  staffList = [],
  label,
  placeholder = 'Select Staff Member',
  allowAll = true,
  allLabel = 'All Staff Members',
  disabled = false,
  required = false,
  className = '',
  buttonClassName = '',
  id,
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Find currently selected staff member
  const selectedStaff = useMemo(() => {
    if (value === 'all') return null;
    return staffList.find((s) => s.id === value) || null;
  }, [value, staffList]);

  // Selected display text
  const selectedDisplay = useMemo(() => {
    if (value === 'all') {
      return allowAll ? `${allLabel} (${staffList.length})` : placeholder;
    }
    if (selectedStaff) {
      const code = getEmployeeCode(selectedStaff, staffList);
      return `${selectedStaff.name} · ${code}`;
    }
    return placeholder;
  }, [value, selectedStaff, allowAll, allLabel, staffList, placeholder]);

  // Filtered staff list matching query
  const filteredStaff = useMemo(() => {
    if (!searchQuery.trim()) return staffList;
    return staffList.filter((s) => matchesStaffSearch(s, searchQuery, staffList));
  }, [staffList, searchQuery]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Auto-focus search input on open
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Keyboard navigation: Escape closes dropdown
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelect = (staffId: string, member?: User | null) => {
    onChange(staffId, member);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${className}`}
      id={id ? `${id}-container` : undefined}
      onKeyDown={handleKeyDown}
    >
      {label && (
        <label
          htmlFor={id}
          className="text-[10px] sm:text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 block mb-1"
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
            setSearchQuery('');
          }
        }}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 sm:py-2.5 rounded-xl border text-xs font-bold transition-all text-left cursor-pointer select-none ${
          disabled
            ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800'
            : isOpen
            ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-white dark:bg-slate-900 shadow-xs'
            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-600'
        } ${buttonClassName}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {value === 'all' ? (
            <div className="w-5 h-5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center shrink-0">
              <Users className="w-3 h-3" />
            </div>
          ) : selectedStaff ? (
            <div className="w-5 h-5 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">
              {(selectedStaff.name || 'S').charAt(0).toUpperCase()}
            </div>
          ) : (
            <UserIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          )}

          <span
            className={`truncate ${
              value === 'all' || selectedStaff
                ? 'text-slate-900 dark:text-slate-100 font-bold'
                : 'text-slate-400 font-medium'
            }`}
          >
            {selectedDisplay}
          </span>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-indigo-600' : ''
          }`}
        />
      </button>

      {/* Floating Popover / Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 min-w-[260px]"
          role="listbox"
        >
          {/* Top Search Input Header */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, code (EMP-...), phone..."
                className="w-full pl-8 pr-7 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Results List */}
          <div className="max-h-56 sm:max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 overscroll-contain">
            {/* 'All Staff Members' Option (if allowed and no search query or matches 'all') */}
            {allowAll && (!searchQuery || 'all staff members'.includes(searchQuery.toLowerCase())) && (
              <button
                type="button"
                onClick={() => handleSelect('all', null)}
                className={`w-full flex items-center justify-between p-2.5 text-left transition-colors cursor-pointer select-none ${
                  value === 'all'
                    ? 'bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-300'
                }`}
                role="option"
                aria-selected={value === 'all'}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center shrink-0">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold text-slate-900 dark:text-slate-100 truncate">
                      {allLabel}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      View records for all {staffList.length} staff members
                    </div>
                  </div>
                </div>
                {value === 'all' && <Check className="w-4 h-4 text-indigo-600 shrink-0 ml-2" />}
              </button>
            )}

            {/* Matching Staff Members */}
            {filteredStaff.length > 0 ? (
              filteredStaff.map((staff) => {
                const isSelected = value === staff.id;
                const code = getEmployeeCode(staff, staffList);
                const roleLabel = formatRoleLabel(staff.role);

                return (
                  <button
                    key={staff.id}
                    type="button"
                    onClick={() => handleSelect(staff.id, staff)}
                    className={`w-full flex items-center justify-between p-2.5 text-left transition-colors cursor-pointer select-none ${
                      isSelected
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-300'
                    }`}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {/* Avatar initial */}
                      <div className="w-7 h-7 rounded-xl bg-indigo-600/10 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300 font-black text-xs flex items-center justify-center shrink-0">
                        {(staff.name || 'S').charAt(0).toUpperCase()}
                      </div>

                      {/* Info lines: Name, Code · Role */}
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-black text-slate-900 dark:text-slate-100 truncate">
                          {staff.name}
                        </div>
                        <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap truncate mt-0.5">
                          {code ? (
                            <span className="font-bold text-indigo-600 dark:text-indigo-400 tracking-tight">
                              {code}
                            </span>
                          ) : null}
                          {code && roleLabel ? (
                            <span className="text-slate-300 dark:text-slate-600">·</span>
                          ) : null}
                          {roleLabel ? (
                            <span className="truncate">{roleLabel}</span>
                          ) : null}
                          {staff.phone ? (
                            <>
                              <span className="text-slate-300 dark:text-slate-600 hidden xs:inline">·</span>
                              <span className="text-slate-400 dark:text-slate-500 text-[10px] hidden xs:flex items-center gap-0.5">
                                <Phone className="w-2.5 h-2.5" />
                                {staff.phone}
                              </span>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="shrink-0 ml-2">
                        <Check className="w-4 h-4 text-indigo-600" />
                      </div>
                    )}
                  </button>
                );
              })
            ) : (
              <div className="p-5 text-center text-slate-400 dark:text-slate-500">
                <Search className="w-5 h-5 mx-auto mb-1.5 text-slate-300 dark:text-slate-600" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  No staff members found
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  No match for &ldquo;{searchQuery}&rdquo;. Try name, code or phone.
                </p>
              </div>
            )}
          </div>

          {/* Quick Footer showing total count */}
          <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between text-[10px] text-slate-400 px-3 font-medium">
            <span>
              {filteredStaff.length} of {staffList.length} staff members
            </span>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-indigo-600 font-bold hover:underline cursor-pointer"
              >
                Reset Search
              </button>
            )}
          </div>
        </div>
      )}

      {error && <p className="text-xs text-rose-500 mt-1 font-semibold">{error}</p>}
    </div>
  );
};

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Customer } from '../types';
import {
  Search,
  User,
  Building2,
  Phone,
  MapPin,
  X,
  Check,
  Plus,
  ChevronDown,
  UserCheck,
} from 'lucide-react';

export interface CustomerSearchSelectProps {
  id?: string;
  customers: Customer[];
  value: string; // customerId
  onChange: (customerId: string, customer?: Customer) => void;
  onAddNewCustomer?: () => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
  error?: string;
  className?: string;
}

export const CustomerSearchSelect: React.FC<CustomerSearchSelectProps> = ({
  id = 'customer-search-select',
  customers = [],
  value,
  onChange,
  onAddNewCustomer,
  placeholder = 'Search by customer name, phone, company, or city...',
  label,
  required = false,
  disabled = false,
  helperText,
  error,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Find currently selected customer
  const selectedCustomer = useMemo(() => {
    return (customers || []).find((c) => c.id === value);
  }, [customers, value]);

  // Filtered customer list based on query
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) {
      return customers;
    }
    const query = searchQuery.toLowerCase().trim();
    return customers.filter((c) => {
      const nameMatch = c.name?.toLowerCase().includes(query);
      const companyMatch = c.companyName?.toLowerCase().includes(query);
      const phoneMatch = c.mobile?.toLowerCase().includes(query);
      const emailMatch = c.email?.toLowerCase().includes(query);
      const cityMatch = c.city?.toLowerCase().includes(query);
      const addressMatch = c.address?.toLowerCase().includes(query);
      const gstMatch = c.gstNumber?.toLowerCase().includes(query);

      return (
        nameMatch ||
        companyMatch ||
        phoneMatch ||
        emailMatch ||
        cityMatch ||
        addressMatch ||
        gstMatch
      );
    });
  }, [customers, searchQuery]);

  // Reset highlight when filtered list changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredCustomers]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelectCustomer = (customer: Customer) => {
    onChange(customer.id, customer);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('', undefined);
    setSearchQuery('');
    setTimeout(() => {
      setIsOpen(true);
      inputRef.current?.focus();
    }, 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredCustomers.length - 1 ? prev + 1 : prev
      );
      // Scroll into view
      const item = listRef.current?.children[highlightedIndex + 1] as HTMLElement;
      item?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      const item = listRef.current?.children[highlightedIndex - 1] as HTMLElement;
      item?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCustomers[highlightedIndex]) {
        handleSelectCustomer(filteredCustomers[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`} id={id}>
      {/* Label and Quick Add header */}
      <div className="flex items-center justify-between mb-1">
        {label && (
          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
            <span>{label}</span>
            {required && <span className="text-rose-500">*</span>}
          </label>
        )}
        {onAddNewCustomer && (
          <button
            type="button"
            onClick={onAddNewCustomer}
            className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-0.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>New Customer</span>
          </button>
        )}
      </div>

      {/* Selected Customer View (When one is chosen and dropdown is closed) */}
      {selectedCustomer && !isOpen ? (
        <div
          onClick={() => {
            if (!disabled) {
              setIsOpen(true);
              setTimeout(() => inputRef.current?.focus(), 50);
            }
          }}
          className={`group relative flex items-center justify-between p-2.5 sm:p-3 rounded-2xl border bg-white dark:bg-slate-900 shadow-xs transition-all cursor-pointer ${
            disabled
              ? 'opacity-60 cursor-not-allowed border-slate-200 dark:border-slate-800'
              : 'border-indigo-200 dark:border-indigo-800/80 hover:border-indigo-400 dark:hover:border-indigo-600 ring-1 ring-indigo-500/10'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Avatar */}
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-black flex items-center justify-center text-xs shrink-0 border border-indigo-200/50 dark:border-indigo-800">
              {selectedCustomer.customerType === 'commercial' ? (
                <Building2 className="w-4 h-4" />
              ) : (
                selectedCustomer.name.slice(0, 2).toUpperCase()
              )}
            </div>

            {/* Customer Details */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">
                  {selectedCustomer.name}
                </span>
                {selectedCustomer.companyName && (
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md truncate max-w-[140px]">
                    {selectedCustomer.companyName}
                  </span>
                )}
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                    selectedCustomer.customerType === 'commercial'
                      ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300'
                      : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                  }`}
                >
                  {selectedCustomer.customerType || 'Individual'}
                </span>
              </div>

              <div className="flex items-center gap-2.5 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-emerald-500 shrink-0" />
                  <strong className="text-slate-700 dark:text-slate-300 font-semibold">
                    {selectedCustomer.mobile}
                  </strong>
                </span>
                {(selectedCustomer.city || selectedCustomer.address) && (
                  <span className="flex items-center gap-1 truncate text-slate-400">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span className="truncate">
                      {selectedCustomer.city || selectedCustomer.address}
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 pl-2 shrink-0">
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-1 rounded-lg hidden sm:inline-block">
              Change
            </span>
            {!disabled && (
              <button
                type="button"
                onClick={handleClearSelection}
                title="Clear selected customer"
                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Search Box & Trigger */
        <div className="relative">
          <div
            className={`flex items-center gap-2 px-3 py-2 sm:py-2.5 rounded-2xl border bg-white dark:bg-slate-900 transition-all ${
              isOpen
                ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm'
                : error
                ? 'border-rose-400 ring-1 ring-rose-400'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
            } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
            onClick={() => {
              if (!disabled) {
                setIsOpen(true);
                inputRef.current?.focus();
              }
            }}
          >
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              id={`${id}-input`}
              disabled={disabled}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (!isOpen) setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder={
                selectedCustomer
                  ? `Selected: ${selectedCustomer.name} (Type to search another...)`
                  : placeholder
              }
              className="w-full bg-transparent text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
            />

            {searchQuery ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSearchQuery('');
                  inputRef.current?.focus();
                }}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(!isOpen);
                }}
                className="p-1 rounded-md text-slate-400"
              >
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${
                    isOpen ? 'rotate-180 text-indigo-600' : ''
                  }`}
                />
              </button>
            )}
          </div>

          {/* Dropdown Menu */}
          {isOpen && (
            <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100">
              {/* Header with Stats */}
              <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] font-bold text-slate-500">
                <span>
                  {searchQuery
                    ? `Found ${filteredCustomers.length} of ${customers.length} customer${
                        customers.length !== 1 ? 's' : ''
                      }`
                    : `All Registered Customers (${customers.length})`}
                </span>
                {onAddNewCustomer && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onAddNewCustomer();
                    }}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Create New</span>
                  </button>
                )}
              </div>

              {/* Customer List Items */}
              <div
                ref={listRef}
                className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-1"
              >
                {filteredCustomers.length === 0 ? (
                  <div className="p-4 text-center space-y-2">
                    <User className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      No customers match &quot;{searchQuery}&quot;
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Check spelling or create a new customer profile.
                    </p>
                    {onAddNewCustomer && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsOpen(false);
                          onAddNewCustomer();
                        }}
                        className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-xs hover:bg-indigo-700 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add &quot;{searchQuery}&quot; as New Customer</span>
                      </button>
                    )}
                  </div>
                ) : (
                  filteredCustomers.map((customer, index) => {
                    const isSelected = customer.id === value;
                    const isHighlighted = index === highlightedIndex;

                    return (
                      <div
                        key={customer.id}
                        onClick={() => handleSelectCustomer(customer)}
                        onMouseEnter={() => setHighlightedIndex(index)}
                        className={`flex items-center justify-between p-2.5 rounded-xl text-xs transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50/90 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-100'
                            : isHighlighted
                            ? 'bg-slate-100/90 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          {/* Avatar Circle */}
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${
                              isSelected
                                ? 'bg-indigo-600 text-white'
                                : customer.customerType === 'commercial'
                                ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {customer.customerType === 'commercial' ? (
                              <Building2 className="w-3.5 h-3.5" />
                            ) : (
                              customer.name.slice(0, 2).toUpperCase()
                            )}
                          </div>

                          {/* Info */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold truncate">
                                {customer.name}
                              </span>
                              {customer.companyName && (
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                  ({customer.companyName})
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                              <span className="flex items-center gap-0.5 text-slate-600 dark:text-slate-300 font-medium">
                                <Phone className="w-2.5 h-2.5 text-emerald-500" />
                                {customer.mobile}
                              </span>
                              {customer.city && (
                                <span className="flex items-center gap-0.5 text-slate-400 truncate">
                                  <MapPin className="w-2.5 h-2.5" />
                                  {customer.city}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Selection check icon */}
                        {isSelected && (
                          <div className="pl-2 text-indigo-600 dark:text-indigo-400 shrink-0">
                            <Check className="w-4 h-4 font-bold" />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Helper text or error */}
      {error ? (
        <p className="text-[10px] font-medium text-rose-500 mt-1">{error}</p>
      ) : helperText ? (
        <p className="text-[10px] text-slate-400 mt-1">{helperText}</p>
      ) : null}
    </div>
  );
};

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Building2,
  Search,
  Bell,
  Plus,
  ShieldAlert,
  UserCheck,
  Check,
  RotateCcw,
  Sliders,
  ChevronDown,
  Sparkles,
  Sun,
  Moon,
  History,
} from 'lucide-react';
import { UserRole } from '../types';
import { ThemeToggle } from './ThemeToggle';

interface NavbarProps {
  onOpenOnboarding: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenOnboarding,
  activeTab,
  setActiveTab,
}) => {
  const {
    currentBusiness,
    businesses,
    switchBusiness,
    currentUser,
    switchRole,
    notifications,
    markNotificationRead,
    setIsSearchOpen,
    resetDemoData,
    theme,
    toggleTheme,
    setIsActivityLogOpen,
  } = useApp();

  const [isTenantMenuOpen, setIsTenantMenuOpen] = useState(false);
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const [isNotifMenuOpen, setIsNotifMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const unreadNotifs = notifications.filter((n) => !n.read);

  const rolesList: { id: UserRole; label: string; badgeColor: string }[] = [
    { id: 'business_owner', label: 'Business Owner', badgeColor: 'bg-indigo-500/10 text-indigo-600 border-indigo-200' },
    { id: 'manager', label: 'Manager', badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-200' },
    { id: 'technician', label: 'Field Technician', badgeColor: 'bg-amber-500/10 text-amber-600 border-amber-200' },
    { id: 'super_admin', label: 'Super Admin', badgeColor: 'bg-purple-500/10 text-purple-600 border-purple-200' },
  ];

  const currentRoleObj = rolesList.find((r) => r.id === currentUser.role) || rolesList[0];

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 py-2.5 transition-all">
      <div className="flex items-center justify-between gap-3 max-w-7xl mx-auto">
        {/* Left: Brand / Tenant Selector */}
        <div className="flex items-center gap-3">
          {/* Tenant Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsTenantMenuOpen(!isTenantMenuOpen)}
              className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors border border-slate-200/60 dark:border-slate-700/60"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm overflow-hidden shrink-0">
                {currentBusiness.logo ? (
                  <img src={currentBusiness.logo} alt={currentBusiness.name} className="w-full h-full object-cover" />
                ) : (
                  currentBusiness.name.substring(0, 2).toUpperCase()
                )}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 line-clamp-1 max-w-[140px]">
                  {currentBusiness.name}
                </div>
                <div className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
                  <span>{currentBusiness.type}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </div>
              </div>
            </button>

            {/* Tenant Dropdown */}
            {isTenantMenuOpen && (
              <div
                className="absolute left-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-in fade-in zoom-in-95"
                onClick={() => setIsTenantMenuOpen(false)}
              >
                <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Switch Active Business
                </div>
                <div className="space-y-1 my-1">
                  {businesses.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => switchBusiness(b.id)}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors ${
                        b.id === currentBusiness.id
                          ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-medium'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xs font-semibold shrink-0 overflow-hidden">
                          {b.logo ? <img src={b.logo} alt="" className="w-full h-full object-cover" /> : b.name.substring(0, 2)}
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-medium truncate">{b.name}</div>
                          <div className="text-[10px] text-slate-500">{b.type}</div>
                        </div>
                      </div>
                      {b.id === currentBusiness.id && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                    </button>
                  ))}
                </div>
                <div className="pt-2 mt-1 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={onOpenOnboarding}
                    className="w-full flex items-center justify-center gap-2 p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs transition-all shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" /> Onboard New Business
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center: Search Trigger */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="hidden md:flex items-center gap-2 bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200/70 dark:hover:bg-slate-800 px-3.5 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-slate-500 text-xs w-72 transition-all group"
        >
          <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
          <span className="flex-1 text-left">Search customers, jobs, invoices...</span>
          <kbd className="bg-white dark:bg-slate-900 text-[10px] px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-mono text-slate-400">
            ⌘K
          </kbd>
        </button>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          {/* Live Role Switcher Pill */}
          <div className="relative">
            <button
              onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border shadow-xs transition-all ${currentRoleObj.badgeColor}`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{currentRoleObj.label}</span>
              <ChevronDown className="w-3 h-3 opacity-70" />
            </button>

            {isRoleMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-50"
                onClick={() => setIsRoleMenuOpen(false)}
              >
                <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Test Role Switcher
                </div>
                <div className="space-y-1">
                  {rolesList.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => switchRole(r.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                        currentUser.role === r.id
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <span>{r.label}</span>
                      {currentUser.role === r.id && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* AI Assistant Quick Tab */}
          <button
            onClick={() => setActiveTab('ai_assistant')}
            className={`p-2 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-medium ${
              activeTab === 'ai_assistant'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border-indigo-200/60 dark:border-indigo-800/60 hover:bg-indigo-100'
            }`}
            title="AI Business Assistant"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden lg:inline">AI Insights</span>
          </button>

          {/* Activity Log Audit Trail Trigger */}
          <button
            onClick={() => setIsActivityLogOpen(true)}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title="Activity Log & Audit Trail"
            aria-label="Activity Log"
          >
            <History className="w-4 h-4" />
          </button>

          {/* Dark / Light Theme Toggle */}
          <ThemeToggle />

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => setIsNotifMenuOpen(!isNotifMenuOpen)}
              className="relative p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifs.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </button>

            {isNotifMenuOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-3 z-50">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Notifications</span>
                  <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950 text-indigo-600 px-2 py-0.5 rounded-full font-semibold">
                    {unreadNotifs.length} new
                  </span>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {notifications.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-400">No notifications</div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markNotificationRead(n.id)}
                        className={`p-2.5 rounded-xl border text-xs transition-colors cursor-pointer ${
                          n.read
                            ? 'bg-slate-50/50 dark:bg-slate-950/50 border-slate-100 dark:border-slate-800 text-slate-500'
                            : 'bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-slate-900 dark:text-slate-100 font-medium'
                        }`}
                      >
                        <div className="font-semibold text-slate-900 dark:text-slate-100 mb-0.5">{n.title}</div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight">{n.message}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile / Settings menu */}
          <div className="relative">
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800 overflow-hidden ring-2 ring-slate-200 dark:ring-slate-700 hover:ring-indigo-500 transition-all"
            >
              {currentUser.avatar ? (
                <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-xs text-slate-700">
                  {currentUser.name.substring(0, 2).toUpperCase()}
                </div>
              )}
            </button>

            {isProfileMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-50"
                onClick={() => setIsProfileMenuOpen(false)}
              >
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{currentUser.name}</div>
                  <div className="text-[10px] text-slate-400 truncate">{currentUser.email}</div>
                </div>

                <button
                  onClick={() => setActiveTab('settings')}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Sliders className="w-3.5 h-3.5" /> Business Settings
                </button>

                <button
                  onClick={resetDemoData}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset Demo Data
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

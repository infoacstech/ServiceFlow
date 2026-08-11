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

  type ActiveMenu = 'tenant' | 'role' | 'notif' | 'profile' | null;
  const [activeMenu, setActiveMenu] = useState<ActiveMenu>(null);

  const toggleMenu = (menu: ActiveMenu) => {
    setActiveMenu((prev) => (prev === menu ? null : menu));
  };

  const closeAllMenus = () => {
    setActiveMenu(null);
  };

  const unreadNotifs = notifications.filter((n) => !n.read);

  const rolesList: { id: UserRole; label: string; badgeColor: string }[] = [
    { id: 'business_owner', label: 'Business Owner', badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800' },
    { id: 'manager', label: 'Manager', badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' },
    { id: 'technician', label: 'Field Technician', badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800' },
    { id: 'super_admin', label: 'Super Admin', badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800' },
  ];

  const currentRoleObj = rolesList.find((r) => r.id === currentUser.role) || rolesList[0];

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-2 sm:px-4 py-2 sm:py-2.5 transition-all">
      {/* Click-outside backdrop overlay to close open menus */}
      {activeMenu !== null && (
        <div
          className="fixed inset-0 z-40 bg-black/10 dark:bg-black/30 backdrop-blur-[1px]"
          onClick={closeAllMenus}
        />
      )}

      <div className="flex items-center justify-between gap-1.5 sm:gap-3 max-w-7xl mx-auto relative z-50">
        {/* Left: Brand / Tenant Selector */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Tenant Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => toggleMenu('tenant')}
              className="flex items-center gap-1.5 sm:gap-2 p-1 sm:p-1.5 sm:pr-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors border border-slate-200/60 dark:border-slate-700/60 text-left"
              title="Switch business"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs sm:text-sm shadow-xs overflow-hidden shrink-0">
                {currentBusiness.logo ? (
                  <img src={currentBusiness.logo} alt={currentBusiness.name} className="w-full h-full object-cover" />
                ) : (
                  currentBusiness.name.substring(0, 2).toUpperCase()
                )}
              </div>
              <div className="text-left max-w-[100px] xs:max-w-[130px] sm:max-w-[160px]">
                <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate flex items-center gap-1">
                  <span className="truncate">{currentBusiness.name}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                </div>
                <div className="text-[10px] text-slate-500 hidden sm:block font-medium truncate">
                  {currentBusiness.type}
                </div>
              </div>
            </button>

            {/* Tenant Dropdown */}
            {activeMenu === 'tenant' && (
              <div className="absolute left-0 mt-2 w-72 max-w-[calc(100vw-1.5rem)] bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Switch Active Business
                </div>
                <div className="space-y-1 my-1 max-h-60 overflow-y-auto">
                  {businesses.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => {
                        switchBusiness(b.id);
                        closeAllMenus();
                      }}
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
                    onClick={() => {
                      onOpenOnboarding();
                      closeAllMenus();
                    }}
                    className="w-full flex items-center justify-center gap-2 p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs transition-all shadow-xs"
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
          className="hidden md:flex items-center gap-2 bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200/70 dark:hover:bg-slate-800 px-3.5 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-slate-500 text-xs w-64 lg:w-72 transition-all group shrink-0"
        >
          <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
          <span className="flex-1 text-left truncate">Search customers, jobs, invoices...</span>
          <kbd className="bg-white dark:bg-slate-900 text-[10px] px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-mono text-slate-400">
            ⌘K
          </kbd>
        </button>

        {/* Right Controls */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Live Role Switcher Pill */}
          <div className="relative">
            <button
              onClick={() => toggleMenu('role')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 sm:py-1 rounded-full text-xs font-medium border shadow-xs transition-all ${currentRoleObj.badgeColor}`}
              title="Switch user role"
            >
              <UserCheck className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden xs:inline">{currentRoleObj.label}</span>
              <ChevronDown className="w-3 h-3 opacity-70 shrink-0" />
            </button>

            {activeMenu === 'role' && (
              <div className="absolute right-0 sm:right-0 mt-2 w-56 max-w-[calc(100vw-1.5rem)] bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Test Role Switcher
                </div>
                <div className="space-y-1">
                  {rolesList.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => {
                        switchRole(r.id);
                        closeAllMenus();
                      }}
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
            onClick={() => {
              setActiveTab('ai_assistant');
              closeAllMenus();
            }}
            className={`hidden sm:flex p-1.5 sm:p-2 rounded-xl border transition-all items-center gap-1.5 text-xs font-medium ${
              activeTab === 'ai_assistant'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border-indigo-200/60 dark:border-indigo-800/60 hover:bg-indigo-100'
            }`}
            title="AI Business Assistant"
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            <span className="hidden lg:inline">AI Insights</span>
          </button>

          {/* Activity Log Audit Trail Trigger */}
          <button
            onClick={() => {
              setIsActivityLogOpen(true);
              closeAllMenus();
            }}
            className="hidden sm:flex p-1.5 sm:p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
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
              onClick={() => toggleMenu('notif')}
              className="relative p-1.5 sm:p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifs.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </button>

            {activeMenu === 'notif' && (
              <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-1.5rem)] bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-3 z-50 animate-in fade-in zoom-in-95">
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
              onClick={() => toggleMenu('profile')}
              className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800 overflow-hidden ring-2 ring-slate-200 dark:ring-slate-700 hover:ring-indigo-500 transition-all shrink-0"
              title="User Profile & Settings"
            >
              {currentUser.avatar ? (
                <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-200">
                  {currentUser.name.substring(0, 2).toUpperCase()}
                </div>
              )}
            </button>

            {activeMenu === 'profile' && (
              <div className="absolute right-0 mt-2 w-56 max-w-[calc(100vw-1.5rem)] bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{currentUser.name}</div>
                  <div className="text-[10px] text-slate-400 truncate">{currentUser.email}</div>
                </div>

                <button
                  onClick={() => {
                    setActiveTab('settings');
                    closeAllMenus();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Sliders className="w-3.5 h-3.5" /> Business Settings
                </button>

                <button
                  onClick={() => {
                    resetDemoData();
                    closeAllMenus();
                  }}
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

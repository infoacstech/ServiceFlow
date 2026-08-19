import React, { useState, useEffect } from 'react';
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
  RefreshCw,
  Sliders,
  ChevronDown,
  Sparkles,
  History,
  LogOut,
  Smartphone,
  Volume2,
  VolumeX,
  Download,
  Laptop,
  CheckCircle2,
  Radio,
  User,
  Mail,
  Phone,
  Shield,
  KeyRound,
  Sun,
  Moon,
  ExternalLink,
  Settings as SettingsIcon,
} from 'lucide-react';
import { UserRole } from '../types';
import {
  isVoiceNotificationEnabled,
  setVoiceNotificationEnabled,
  playCustomVoiceNotification,
  speakText,
  getVoiceVolume,
  setVoiceVolume,
  getSelectedVoiceLanguage,
  setSelectedVoiceLanguage,
  SUPPORTED_VOICE_LANGUAGES,
  VoiceLanguageCode,
  playNotificationChime,
} from '../utils/audioNotification';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

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
    users,
    switchRole,
    notifications,
    markNotificationRead,
    setIsSearchOpen,
    setIsAuthModalOpen,
    resetDemoData,
    theme,
    toggleTheme,
    setIsActivityLogOpen,
    syncOfflineQueue,
    pendingSyncQueue,
    isProfileDrawerOpen,
    setIsProfileDrawerOpen,
    isInstallModalOpen,
    setIsInstallModalOpen,
    showToast,
    logoutUser,
  } = useApp();

  type ActiveMenu = 'tenant' | 'notif' | null;
  const [activeMenu, setActiveMenu] = useState<ActiveMenu>(null);
  const [isRefreshingPage, setIsRefreshingPage] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running in Standalone app mode
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    setIsStandalone(isStandaloneMode);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const ownerUser = (users || []).find(
    (u) => u.businessId === currentBusiness?.id && u.role === 'business_owner'
  );

  const toggleMenu = (menu: ActiveMenu) => {
    setActiveMenu((prev) => (prev === menu ? null : menu));
  };

  const closeAllMenus = () => {
    setActiveMenu(null);
  };

  const unreadNotifs = notifications.filter((n) => !n.read);

  const roleMap: Record<UserRole, { label: string; badgeColor: string }> = {
    business_owner: {
      label: 'Owner',
      badgeColor: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    },
    manager: {
      label: 'Manager',
      badgeColor: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    },
    technician: {
      label: 'Technician',
      badgeColor: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    },
    super_admin: {
      label: 'Super Admin',
      badgeColor: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    },
  };

  const currentRoleObj = currentUser?.role ? roleMap[currentUser.role] : {
    label: 'Guest',
    badgeColor: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
  };

  return (
    <header className="sticky top-0 z-40 w-full max-w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-2 sm:px-4 py-2 sm:py-2.5 transition-all">
      {/* Click-outside backdrop overlay to close open menus */}
      {activeMenu !== null && (
        <div
          className="fixed inset-0 z-40 bg-black/20 dark:bg-black/40"
          onClick={closeAllMenus}
        />
      )}

      <div className="flex items-center justify-between gap-2 sm:gap-3 max-w-7xl mx-auto w-full relative z-50">
        {/* Left: Brand / Company Name Display (Full Visibility without restrictive truncation) */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink min-w-0 flex-1 sm:flex-initial">
          {currentUser?.role === 'super_admin' ? (
            /* Tenant Switcher Dropdown (Super Admin Only) */
            <div className="relative min-w-0">
              <button
                onClick={() => toggleMenu('tenant')}
                className="flex items-center gap-2 p-1 sm:p-1.5 sm:pr-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors border border-slate-200/60 dark:border-slate-700/60 text-left min-w-0 cursor-pointer"
                title={`Current Active Business: ${currentBusiness?.name || 'ServiFlow'}`}
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs sm:text-sm shadow-xs overflow-hidden shrink-0">
                  {currentBusiness?.logo ? (
                    <img src={currentBusiness.logo} alt={currentBusiness.name} className="w-full h-full object-cover" />
                  ) : (
                    (currentBusiness?.name || 'SF').substring(0, 2).toUpperCase()
                  )}
                </div>
                <div className="text-left min-w-0">
                  <div className="text-xs sm:text-sm md:text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-1 leading-tight">
                    <span className="truncate max-w-[180px] xs:max-w-[240px] sm:max-w-xs md:max-w-sm lg:max-w-md" title={currentBusiness?.name}>
                      {currentBusiness?.name || 'ServiFlow'}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate leading-none mt-0.5 hidden xs:block">
                    {currentBusiness?.type || 'Field Services'}
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
                    {businesses.map((b, idx) => (
                      <button
                        key={b.id || `nav-biz-${idx}`}
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
                            {b.logo ? <img src={b.logo} alt="" className="w-full h-full object-cover" /> : (b?.name || 'SF').substring(0, 2).toUpperCase()}
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
          ) : (
            /* Full Company Name Display for Business Owners / Staff / Technicians */
            <div
              className="flex items-center gap-2 sm:gap-2.5 p-1 sm:p-1.5 sm:px-3 rounded-2xl bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-left min-w-0"
              title={currentBusiness?.name || 'ServiFlow'}
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs sm:text-sm shadow-xs overflow-hidden shrink-0">
                {currentBusiness?.logo ? (
                  <img src={currentBusiness.logo} alt={currentBusiness.name} className="w-full h-full object-cover" />
                ) : (
                  (currentBusiness?.name || 'SF').substring(0, 2).toUpperCase()
                )}
              </div>
              <div className="text-left min-w-0">
                <div className="text-xs sm:text-sm md:text-base font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight truncate max-w-[180px] xs:max-w-[260px] sm:max-w-xs md:max-w-md lg:max-w-lg">
                  {currentBusiness?.name || 'ServiFlow'}
                </div>
                <div className="text-[10px] sm:text-[11px] text-slate-500 font-semibold truncate leading-none mt-0.5 hidden xs:block">
                  {ownerUser?.name ? `Owner: ${ownerUser.name}` : (currentBusiness?.type || 'Field Services')}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Center: Search Trigger (Desktop) */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="hidden md:flex items-center gap-2 bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200/70 dark:hover:bg-slate-800 px-3.5 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-slate-500 text-xs w-56 lg:w-64 transition-all group shrink-0"
        >
          <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
          <span className="flex-1 text-left truncate">Search customers, jobs, invoices...</span>
          <kbd className="bg-white dark:bg-slate-900 text-[10px] px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-mono text-slate-400">
            ⌘K
          </kbd>
        </button>

        {/* Right Action Controls & User Profile */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* User Role Badge */}
          <div className={`hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border shadow-xs ${currentRoleObj.badgeColor}`}>
            <UserCheck className="w-3.5 h-3.5 shrink-0" />
            <span>{currentRoleObj.label}</span>
          </div>

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

          {/* Unified Sync & Refresh Data Button */}
          <button
            onClick={() => {
              setIsRefreshingPage(true);
              syncOfflineQueue();
              setTimeout(() => {
                setIsRefreshingPage(false);
                showToast(
                  pendingSyncQueue.length > 0
                    ? `Synchronized ${pendingSyncQueue.length} offline updates with cloud database!`
                    : 'Cloud sync complete. All local and field data is up to date.',
                  'success'
                );
              }, 600);
            }}
            disabled={isRefreshingPage}
            className={`flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border text-xs font-bold transition-all active:scale-95 cursor-pointer ${
              pendingSyncQueue.length > 0
                ? 'bg-amber-500 hover:bg-amber-600 text-stone-900 border-amber-600 shadow-xs animate-pulse'
                : 'bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600'
            }`}
            title="Sync Data & Cloud Sync"
            aria-label="Sync Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingPage ? 'animate-spin text-indigo-600 dark:text-indigo-400' : ''}`} />
            <span className="hidden md:inline">Sync</span>
            {pendingSyncQueue.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-stone-900 text-amber-400 text-[10px] font-mono font-black">
                {pendingSyncQueue.length}
              </span>
            )}
          </button>

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
              <div className="absolute right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-1.5rem)] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3 z-[100] animate-in fade-in zoom-in-95 ring-1 ring-black/5">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Notifications</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        playCustomVoiceNotification('Notification Summary', `You have ${unreadNotifs.length} unread notifications.`);
                      }}
                      className="p-1 text-[10px] bg-indigo-50 dark:bg-indigo-950 text-indigo-600 hover:bg-indigo-100 rounded-lg font-medium flex items-center gap-1 cursor-pointer"
                      title="Speak Summary"
                    >
                      <Volume2 className="w-3 h-3" /> Read All
                    </button>
                  </div>
                  <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950 text-indigo-600 px-2 py-0.5 rounded-full font-semibold">
                    {unreadNotifs.length} new
                  </span>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {notifications.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-400">No notifications</div>
                  ) : (
                    notifications.map((n, idx) => (
                      <div
                        key={n.id || `nav-notif-${idx}`}
                        onClick={() => {
                          markNotificationRead(n.id);
                        }}
                        className={`p-2.5 rounded-xl border text-xs transition-colors cursor-pointer relative group ${
                          n.read
                            ? 'bg-slate-50/50 dark:bg-slate-950/50 border-slate-100 dark:border-slate-800 text-slate-500'
                            : 'bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-slate-900 dark:text-slate-100 font-medium'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-semibold text-slate-900 dark:text-slate-100 mb-0.5">{n.title}</div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              speakText(`${n.title}. ${n.message}`);
                            }}
                            className="p-1 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-400 shrink-0"
                            title="Speak out loud"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight">{n.message}</div>
                      </div>
                    ))
                  )}
                </div>
                <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 text-center">
                  <button
                    onClick={() => {
                      setActiveTab('notifications');
                      closeAllMenus();
                    }}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    Open Full Notifications Center →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Direct User Profile & Settings Drawer Trigger Button */}
          <button
            onClick={() => setIsProfileDrawerOpen(true)}
            className="flex items-center gap-1.5 sm:gap-2 p-1 sm:px-2 sm:py-1 rounded-xl bg-slate-100/90 hover:bg-slate-200/90 dark:bg-slate-800/90 dark:hover:bg-slate-700/90 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 transition-all shrink-0 cursor-pointer active:scale-95 shadow-xs"
            title="Click to Open Profile & Settings (लॉग आउट और सेटिंग्स)"
            aria-label="User Profile and Settings"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-600 text-white overflow-hidden ring-2 ring-indigo-500/30 flex items-center justify-center font-black text-xs shadow-xs shrink-0">
              {currentUser?.avatar ? (
                <img src={currentUser.avatar} alt={currentUser?.name || 'User'} className="w-full h-full object-cover" />
              ) : (
                <span>{(currentUser?.name || currentUser?.email || 'US').substring(0, 2).toUpperCase()}</span>
              )}
            </div>
            <div className="hidden lg:flex flex-col text-left leading-tight">
              <span className="text-xs font-bold truncate max-w-[110px] text-slate-900 dark:text-slate-100">
                {currentUser?.name || 'User Profile'}
              </span>
              <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                Profile & Settings
              </span>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};

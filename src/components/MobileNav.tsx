import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Grid,
  Bell,
  X,
  Wrench,
  UserCheck,
  Package,
  FileText,
  Receipt,
  CreditCard,
  Repeat,
  DollarSign,
  BarChart3,
  Sparkles,
  Settings,
  ShieldCheck,
  Building2,
  Clock,
  Ban,
  CheckCircle2,
  Gift,
  Headphones,
  Sliders,
  FileCode,
  Layers,
  Trash2,
  ShieldAlert,
  HelpCircle,
  Globe,
  Check,
} from 'lucide-react';

interface MobileNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, setActiveTab }) => {
  const {
    currentUser,
    getRolePermissions,
    businesses,
    referralPayoutRequests,
    activeSupportSession,
    attendanceIssues,
    t,
    language,
    setLanguage,
    supportedLanguages,
  } = useApp();
  const permissions = getRolePermissions(currentUser?.role);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const pendingAttendanceCount = (attendanceIssues || []).filter(
    (i) => i.status === 'pending'
  ).length;

  const isTech = currentUser?.role === 'technician';
  const isSuperAdmin = currentUser?.role === 'super_admin';

  // Super Admin Bottom Bar Items
  const superAdminBottomItems = [
    { id: 'super_admin_dashboard', label: t('nav.platformDashboard', undefined, 'Platform'), icon: LayoutDashboard },
    { id: 'super_admin_tenants', label: t('nav.tenantBusinesses', undefined, 'Tenants'), icon: Building2 },
    { id: 'super_admin_pending', label: t('nav.pendingApprovals', undefined, 'Approvals'), icon: CheckCircle2 },
    { id: 'super_admin_support', label: 'Support', icon: Headphones },
    { id: 'more', label: t('nav.more', undefined, 'Console'), icon: Grid },
  ];

  // Tenant Bottom Bar Items
  const tenantBottomItems = isTech
    ? [
        { id: 'jobs', label: t('nav.myJobs', undefined, 'My Jobs'), icon: Briefcase },
        { id: 'customers', label: t('nav.customers', undefined, 'Customers'), icon: Users },
        { id: 'notifications', label: t('nav.notifications', undefined, 'Alerts'), icon: Bell },
        { id: 'settings', label: t('nav.settings', undefined, 'Profile'), icon: Settings },
        { id: 'more', label: t('nav.more', undefined, 'More'), icon: Grid },
      ]
    : [
        { id: 'dashboard', label: t('nav.dashboard', undefined, 'Dashboard'), icon: LayoutDashboard },
        { id: 'jobs', label: t('nav.jobs', undefined, 'Jobs'), icon: Briefcase },
        { id: 'customers', label: t('nav.customers', undefined, 'Customers'), icon: Users },
        { id: 'invoices', label: t('nav.invoices', undefined, 'Invoices'), icon: Receipt },
        { id: 'more', label: t('nav.modules', undefined, 'Modules'), icon: Grid },
      ];

  const bottomItems = isSuperAdmin ? superAdminBottomItems : tenantBottomItems;

  // Super Admin Drawer Modules
  const superAdminModules = [
    { id: 'super_admin_dashboard', label: t('nav.platformDashboard', undefined, 'Platform Dashboard'), icon: LayoutDashboard },
    { id: 'super_admin_tenants', label: t('nav.tenantBusinesses', undefined, 'Tenant Businesses'), icon: Building2 },
    { id: 'super_admin_pending', label: t('nav.pendingApprovals', undefined, 'Pending Approvals'), icon: Clock },
    { id: 'super_admin_suspended', label: 'Suspended Businesses', icon: Ban },
    { id: 'super_admin_analytics', label: 'Platform Analytics', icon: BarChart3 },
    { id: 'super_admin_referrals', label: 'Referral Analytics', icon: Gift },
    { id: 'super_admin_support', label: 'Support Access', icon: Headphones },
    { id: 'super_admin_notifications', label: t('nav.notifications', undefined, 'System Notifications'), icon: Bell },
    { id: 'super_admin_audit', label: t('nav.securityAudit', undefined, 'Security Audit Logs'), icon: FileCode },
    { id: 'super_admin_security', label: 'Security & Access', icon: ShieldAlert },
    { id: 'super_admin_settings', label: 'Global Settings & MFA', icon: Sliders },
    { id: 'super_admin_plans', label: 'Plans & Subscriptions', icon: Layers },
    { id: 'super_admin_data_maintenance', label: t('nav.dataMaintenance', undefined, 'Data & Maintenance'), icon: Trash2 },
    { id: 'settings', label: t('nav.settings', undefined, 'Profile Settings'), icon: Settings },
  ];

  // Tenant Module Groups
  const coreOperationsModules = [
    { id: 'dashboard', label: t('nav.dashboard', undefined, 'Dashboard'), icon: LayoutDashboard, visible: !isTech && (permissions.canManageJobs || permissions.canViewFinancials) },
    { id: 'enquiries', label: t('nav.enquiries', undefined, 'Enquiries & Intake'), icon: HelpCircle, visible: !isTech && (permissions.canManageJobs || permissions.canManageStaff) },
    { id: 'jobs', label: isTech ? t('nav.myJobs', undefined, 'My Assigned Jobs') : t('nav.jobs', undefined, 'Jobs & Field Work'), icon: Briefcase, visible: permissions.canManageJobs },
    { id: 'customers', label: t('nav.customers', undefined, 'Customers CRM'), icon: Users, visible: permissions.canManageJobs || permissions.canManageStaff },
    { id: 'staff', label: t('nav.staff', undefined, 'Staff & Techs'), icon: UserCheck, visible: permissions.canManageStaff },
    { id: 'attendance', label: permissions.canManageStaff ? t('nav.attendance', undefined, 'Attendance & GPS') : t('nav.myAttendance', undefined, 'My Attendance'), icon: Clock, visible: true },
  ].filter((m) => m.visible);

  const businessFinanceModules = [
    { id: 'services', label: t('nav.services', undefined, 'Service Catalog'), icon: Wrench, visible: permissions.canManageServices },
    { id: 'inventory', label: t('nav.inventory', undefined, 'Inventory & Parts'), icon: Package, visible: permissions.canManageInventory },
    { id: 'quotations', label: t('nav.quotations', undefined, 'Quotations'), icon: FileText, visible: permissions.canViewFinancials },
    { id: 'invoices', label: t('nav.invoices', undefined, 'Invoices'), icon: Receipt, visible: permissions.canViewFinancials },
    { id: 'payments', label: t('nav.payments', undefined, 'Payment Ledger'), icon: CreditCard, visible: permissions.canViewFinancials },
    { id: 'contracts', label: t('nav.contracts', undefined, 'Recurring Contracts'), icon: Repeat, visible: permissions.canManageContracts },
    { id: 'expenses', label: t('nav.expenses', undefined, 'Expenses'), icon: DollarSign, visible: true },
  ].filter((m) => m.visible);

  const managementModules = [
    { id: 'reports', label: t('nav.reports', undefined, 'Reports & Analytics'), icon: BarChart3, visible: permissions.canViewFinancials },
    { id: 'notifications', label: t('nav.notifications', undefined, 'Notifications'), icon: Bell, visible: true },
    { id: 'ai_assistant', label: t('nav.aiAssistant', undefined, 'AI Assistant'), icon: Sparkles, visible: permissions.canManageJobs || permissions.canViewFinancials },
  ].filter((m) => m.visible);

  const accountSettingsItems = [
    { id: 'settings', label: t('settings.myProfile', undefined, 'Profile & Business'), icon: Settings, desc: 'Company & user info' },
    { id: 'settings', label: t('settings.language', undefined, 'Language / भाषा'), icon: Globe, desc: language === 'hi' ? 'हिन्दी सक्रिय' : language === 'mr' ? 'मराठी सक्रिय' : 'English Active' },
    { id: 'settings', label: t('settings.passwordSecurity', undefined, 'Security & Access'), icon: ShieldCheck, desc: 'PIN & credentials' },
    { id: 'settings', label: 'Subscription & Plans', icon: Layers, desc: 'Billing & upgrades' },
  ];

  const handleTabClick = (id: string) => {
    if (id === 'more') {
      setIsMoreMenuOpen(true);
    } else {
      setActiveTab(id);
      setIsMoreMenuOpen(false);
    }
  };

  return (
    <>
      {/* Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 flex items-center justify-around shadow-lg">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          let isActive = false;
          if (isSuperAdmin) {
            if (item.id === 'super_admin_dashboard') {
              isActive = activeTab === 'super_admin_dashboard' || activeTab === 'super_admin';
            } else if (item.id === 'super_admin_pending') {
              isActive = activeTab === 'super_admin_pending' || activeTab === 'super_admin_approvals';
            } else if (item.id === 'super_admin_tenants') {
              isActive = activeTab === 'super_admin_tenants';
            } else if (item.id === 'super_admin_support') {
              isActive = activeTab === 'super_admin_support';
            } else {
              isActive = activeTab === item.id;
            }
          } else {
            isActive = activeTab === item.id;
          }
          isActive = isActive && !isMoreMenuOpen;

          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl text-[10px] font-semibold transition-all cursor-pointer ${
                isActive
                  ? isSuperAdmin
                    ? 'text-purple-600 dark:text-purple-400 font-black'
                    : 'text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''}`} />
              <span className="truncate max-w-[68px]">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* More Modules Full-Screen Modal Drawer */}
      {isMoreMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end animate-in fade-in">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs cursor-pointer"
            onClick={() => setIsMoreMenuOpen(false)}
          />

          <div className="relative z-10 bg-white dark:bg-slate-900 rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto border-t border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-black text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                  {isSuperAdmin ? (
                    <>
                      <ShieldCheck className="w-5 h-5 text-purple-600" />
                      <span>SaaS Master Console</span>
                    </>
                  ) : (
                    <span>ServiFlow Modules</span>
                  )}
                </h3>
                <p className="text-xs text-slate-500">
                  {isSuperAdmin
                    ? 'Tenant management, global security & platform administration'
                    : 'Everything you need to manage your service business'}
                </p>
              </div>
              <button
                onClick={() => setIsMoreMenuOpen(false)}
                className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isSuperAdmin ? (
              <div className="grid grid-cols-3 gap-2.5">
                {superAdminModules.map((m) => {
                  const Icon = m.icon;
                  const isDashboard = m.id === 'super_admin_dashboard';
                  const isPending = m.id === 'super_admin_pending';
                  const isCurrent =
                    activeTab === m.id ||
                    (isDashboard && activeTab === 'super_admin') ||
                    (isPending && activeTab === 'super_admin_approvals');

                  return (
                    <button
                      key={m.id}
                      onClick={() => handleTabClick(m.id)}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center gap-2 transition-all active:scale-95 cursor-pointer min-h-[92px] ${
                        isCurrent
                          ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800 font-bold'
                          : 'bg-slate-50 dark:bg-slate-800/60 hover:bg-purple-50 border-slate-200/80 dark:border-slate-700/80'
                      }`}
                    >
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-xs bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 line-clamp-2">
                        {m.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-4">
                {/* 1. CORE OPERATIONS */}
                {coreOperationsModules.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 px-1">
                      Core Operations
                    </div>
                    <div className="grid grid-cols-3 gap-2.5">
                      {coreOperationsModules.map((m) => {
                        const Icon = m.icon;
                        const isCurrent = activeTab === m.id;

                        return (
                          <button
                            key={m.id}
                            onClick={() => handleTabClick(m.id)}
                            className={`relative flex flex-col items-center justify-center p-3 rounded-2xl border text-center gap-2 transition-all active:scale-95 cursor-pointer min-h-[92px] ${
                              isCurrent
                                ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 font-bold shadow-xs'
                                : 'bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50/50 border-slate-200/80 dark:border-slate-700/80'
                            }`}
                          >
                            {m.id === 'attendance' && permissions.canManageStaff && pendingAttendanceCount > 0 && (
                              <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full text-[9px] font-black bg-rose-500 text-white animate-pulse">
                                {pendingAttendanceCount}
                              </span>
                            )}
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-xs bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                              <Icon className="w-5 h-5" />
                            </div>
                            <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 line-clamp-2">
                              {m.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. BUSINESS & FINANCE */}
                {businessFinanceModules.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
                      Business & Finance
                    </div>
                    <div className="grid grid-cols-3 gap-2.5">
                      {businessFinanceModules.map((m) => {
                        const Icon = m.icon;
                        const isCurrent = activeTab === m.id;

                        return (
                          <button
                            key={m.id}
                            onClick={() => handleTabClick(m.id)}
                            className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center gap-2 transition-all active:scale-95 cursor-pointer min-h-[92px] ${
                              isCurrent
                                ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 font-bold shadow-xs'
                                : 'bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50/50 border-slate-200/80 dark:border-slate-700/80'
                            }`}
                          >
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-xs bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                              <Icon className="w-5 h-5" />
                            </div>
                            <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 line-clamp-2">
                              {m.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. MANAGEMENT */}
                {managementModules.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
                      Management
                    </div>
                    <div className="grid grid-cols-3 gap-2.5">
                      {managementModules.map((m) => {
                        const Icon = m.icon;
                        const isCurrent = activeTab === m.id;

                        return (
                          <button
                            key={m.id}
                            onClick={() => handleTabClick(m.id)}
                            className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center gap-2 transition-all active:scale-95 cursor-pointer min-h-[92px] ${
                              isCurrent
                                ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 font-bold shadow-xs'
                                : 'bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50/50 border-slate-200/80 dark:border-slate-700/80'
                            }`}
                          >
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-xs bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                              <Icon className="w-5 h-5" />
                            </div>
                            <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 line-clamp-2">
                              {m.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* QUICK LANGUAGE SELECTOR FOR MOBILE */}
                <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-850 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      {t('settings.language', undefined, 'Language / भाषा')}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400">
                      {language === 'hi' ? 'हिन्दी' : language === 'mr' ? 'मराठी' : 'English'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {supportedLanguages.map((l) => {
                      const isSel = language === l.code;
                      return (
                        <button
                          key={l.code}
                          type="button"
                          onClick={() => setLanguage(l.code)}
                          className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                            isSel
                              ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-600/30'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <span>{l.nativeName}</span>
                          {isSel && <Check className="w-3 h-3 stroke-[3]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. ACCOUNT & SETTINGS (Visually Separate Bottom Section) */}
                <div className="space-y-2 pt-3 border-t border-slate-200/80 dark:border-slate-800">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
                    Account & Settings
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {accountSettingsItems.map((item, idx) => {
                      const Icon = item.icon;
                      const isCurrent = activeTab === item.id && idx === 0;

                      return (
                        <button
                          key={`${item.id}-${idx}`}
                          onClick={() => handleTabClick(item.id)}
                          className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all active:scale-95 cursor-pointer min-h-[56px] ${
                            isCurrent
                              ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 font-bold'
                              : 'bg-slate-50/90 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200/70 dark:border-slate-700/70'
                          }`}
                        >
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 shrink-0">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                              {item.label}
                            </div>
                            <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                              {item.desc}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};


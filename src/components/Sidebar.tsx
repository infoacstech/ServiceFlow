import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  Users,
  Wrench,
  Briefcase,
  UserCheck,
  Package,
  FileText,
  Receipt,
  CreditCard,
  Repeat,
  DollarSign,
  BarChart3,
  Bell,
  Sparkles,
  Settings,
  ShieldCheck,
  Globe,
  KeyRound,
  LogOut,
  Zap,
  Building2,
  Clock,
  Ban,
  Activity,
  Gift,
  Headphones,
  Sliders,
  FileCode,
  Layers,
  Trash2,
  ShieldAlert,
  CheckCircle2,
  Radio,
  HelpCircle,
} from 'lucide-react';
import { PricingModal } from './PricingModal';
import { BrandLogo } from './BrandLogo';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const {
    currentUser,
    getRolePermissions,
    currentBusiness,
    businesses,
    users,
    plans,
    referralPayoutRequests,
    activeSupportSession,
    attendanceIssues,
    logoutUser,
    t,
    language,
    setLanguage,
    supportedLanguages,
  } = useApp();
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const permissions = getRolePermissions(currentUser?.role);

  const pendingAttendanceIssuesCount = (attendanceIssues || []).filter(
    (i) => i.status === 'pending'
  ).length;

  const isTech = currentUser?.role === 'technician';
  const isSuperAdmin = currentUser?.role === 'super_admin';

  const currentPlan =
    plans.find((p) => p.id === currentBusiness?.planId) ||
    plans.find((p) => p.id === 'plan-starter') ||
    plans[0];

  // Super Admin stats for badges
  const pendingApprovalsCount = (users || []).filter(
    (u) => u.approvalStatus === 'pending'
  ).length + (businesses || []).filter((b) => b.status === 'pending').length;

  const suspendedBusinessesCount = (businesses || []).filter(
    (b) => b.status === 'suspended'
  ).length;

  const pendingPayoutsCount = (referralPayoutRequests || []).filter(
    (p) => p.status === 'pending'
  ).length;

  // ==========================================
  // 1. SUPER ADMIN PLATFORM NAVIGATION
  // ==========================================
  const platformNavSections = [
    {
      title: 'OVERVIEW',
      items: [
        {
          id: 'super_admin_dashboard',
          label: t('nav.platformDashboard', undefined, 'Platform Dashboard'),
          icon: LayoutDashboard,
          badge: null,
          badgeColor: '',
        },
      ],
    },
    {
      title: 'TENANT MANAGEMENT',
      items: [
        {
          id: 'super_admin_tenants',
          label: t('nav.tenantBusinesses', undefined, 'Tenant Businesses'),
          icon: Building2,
          badge: businesses.length > 0 ? String(businesses.length) : null,
          badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
        },
        {
          id: 'super_admin_pending',
          label: t('nav.pendingApprovals', undefined, 'Pending Approvals'),
          icon: Clock,
          badge: pendingApprovalsCount > 0 ? String(pendingApprovalsCount) : null,
          badgeColor: 'bg-amber-500 text-slate-950 font-black animate-pulse',
        },
        {
          id: 'super_admin_suspended',
          label: 'Suspended Businesses',
          icon: Ban,
          badge: suspendedBusinessesCount > 0 ? String(suspendedBusinessesCount) : null,
          badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
        },
      ],
    },
    {
      title: 'PLATFORM OPERATIONS',
      items: [
        {
          id: 'super_admin_analytics',
          label: 'Platform Analytics',
          icon: BarChart3,
          badge: null,
          badgeColor: '',
        },
        {
          id: 'super_admin_referrals',
          label: 'Referral Analytics',
          icon: Gift,
          badge: pendingPayoutsCount > 0 ? `${pendingPayoutsCount} Req` : null,
          badgeColor: 'bg-amber-500 text-slate-950 font-black animate-pulse',
        },
        {
          id: 'super_admin_support',
          label: 'Support Access',
          icon: Headphones,
          badge: activeSupportSession ? 'LIVE' : null,
          badgeColor: 'bg-emerald-500 text-white font-black animate-pulse',
        },
        {
          id: 'super_admin_notifications',
          label: t('nav.notifications', undefined, 'System Notifications'),
          icon: Bell,
          badge: null,
          badgeColor: '',
        },
      ],
    },
    {
      title: 'SECURITY & COMPLIANCE',
      items: [
        {
          id: 'super_admin_audit',
          label: t('nav.securityAudit', undefined, 'Security Audit Logs'),
          icon: FileCode,
          badge: null,
          badgeColor: '',
        },
        {
          id: 'super_admin_security',
          label: 'Security & Access',
          icon: ShieldAlert,
          badge: null,
          badgeColor: '',
        },
      ],
    },
    {
      title: 'PLATFORM MANAGEMENT',
      items: [
        {
          id: 'super_admin_settings',
          label: 'Global Settings & MFA',
          icon: Sliders,
          badge: null,
          badgeColor: '',
        },
        {
          id: 'super_admin_plans',
          label: 'Plans & Subscriptions',
          icon: Layers,
          badge: null,
          badgeColor: '',
        },
        {
          id: 'super_admin_data_maintenance',
          label: t('nav.dataMaintenance', undefined, 'Data & Maintenance'),
          icon: Trash2,
          badge: 'Clean State',
          badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
        },
      ],
    },
    {
      title: 'ACCOUNT',
      items: [
        {
          id: 'settings',
          label: t('nav.settings', undefined, 'Profile Settings'),
          icon: Settings,
          badge: null,
          badgeColor: '',
        },
      ],
    },
  ];

  // ==========================================
  // 2. TENANT BUSINESS ERP NAVIGATION
  // ==========================================
  const tenantNavSections = [
    {
      title: 'OPERATIONS',
      items: [
        {
          id: 'dashboard',
          label: t('nav.dashboard', undefined, 'Dashboard'),
          icon: LayoutDashboard,
          visible: !isTech && (permissions.canManageJobs || permissions.canViewFinancials),
        },
        {
          id: 'enquiries',
          label: t('nav.enquiries', undefined, 'Enquiries & Intake'),
          icon: HelpCircle,
          visible: !isTech && (permissions.canManageJobs || permissions.canManageStaff),
        },
        {
          id: 'jobs',
          label: isTech ? t('nav.myJobs', undefined, 'My Assigned Jobs') : t('nav.jobs', undefined, 'Job Management'),
          icon: Briefcase,
          visible: permissions.canManageJobs,
        },
        {
          id: 'customers',
          label: t('nav.customers', undefined, 'Customers CRM'),
          icon: Users,
          visible: permissions.canManageJobs || permissions.canManageStaff,
        },
        {
          id: 'services',
          label: t('nav.services', undefined, 'Service Catalog'),
          icon: Wrench,
          visible: permissions.canManageServices,
        },
        {
          id: 'staff',
          label: t('nav.staff', undefined, 'Staff & Techs'),
          icon: UserCheck,
          visible: permissions.canManageStaff,
        },
        {
          id: 'attendance',
          label: permissions.canManageStaff
            ? t('nav.attendance', undefined, 'Attendance & GPS')
            : t('nav.myAttendance', undefined, 'My Attendance'),
          icon: Clock,
          visible: true,
          badge:
            permissions.canManageStaff && pendingAttendanceIssuesCount > 0
              ? `${pendingAttendanceIssuesCount}`
              : undefined,
          badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse',
        },
        {
          id: 'inventory',
          label: t('nav.inventory', undefined, 'Inventory & Parts'),
          icon: Package,
          visible: permissions.canManageInventory,
        },
      ],
    },
    {
      title: 'FINANCE & BILLING',
      items: [
        {
          id: 'quotations',
          label: t('nav.quotations', undefined, 'Quotations'),
          icon: FileText,
          visible: permissions.canViewFinancials,
        },
        {
          id: 'invoices',
          label: t('nav.invoices', undefined, 'Invoices'),
          icon: Receipt,
          visible: permissions.canViewFinancials,
        },
        {
          id: 'payments',
          label: t('nav.payments', undefined, 'Payment Ledger'),
          icon: CreditCard,
          visible: permissions.canViewFinancials,
        },
        {
          id: 'contracts',
          label: t('nav.contracts', undefined, 'Recurring Contracts'),
          icon: Repeat,
          visible: permissions.canManageContracts,
        },
        {
          id: 'expenses',
          label: t('nav.expenses', undefined, 'Expense Tracker'),
          icon: DollarSign,
          visible: true,
        },
      ],
    },
    {
      title: 'INTELLIGENCE & PORTAL',
      items: [
        {
          id: 'reports',
          label: t('nav.reports', undefined, 'Reports & Analytics'),
          icon: BarChart3,
          visible: permissions.canViewFinancials,
        },
        {
          id: 'ai_assistant',
          label: t('nav.aiAssistant', undefined, 'AI Business Assistant'),
          icon: Sparkles,
          visible: permissions.canManageJobs || permissions.canViewFinancials,
        },
        {
          id: 'customer_portal',
          label: t('nav.customerPortal', undefined, 'Customer Portal'),
          icon: Globe,
          visible: permissions.canAccessCustomerPortal,
        },
        {
          id: 'notifications',
          label: t('nav.notifications', undefined, 'Notifications'),
          icon: Bell,
          visible: true,
        },
      ],
    },
    {
      title: 'ACCOUNT',
      items: [
        {
          id: 'settings',
          label: isTech ? t('nav.settings', undefined, 'Profile & Security') : t('nav.settings', undefined, 'Profile Settings'),
          icon: Settings,
          visible: true,
        },
      ],
    },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-slate-950 text-slate-300 border-r border-slate-850 p-3 shrink-0 select-none">
      {/* Brand Header */}
      <div className="px-3 py-3 mb-2 flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <BrandLogo size={32} />
          <div className="min-w-0">
            <div className="font-black text-sm text-white tracking-tight flex items-center gap-1.5">
              <span>{isSuperAdmin ? 'SERVIFLOW' : 'ServiFlow'}</span>
              {isSuperAdmin && (
                <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 font-black tracking-widest uppercase">
                  MASTER
                </span>
              )}
            </div>
            <div className="text-[10px] text-slate-400 font-bold tracking-wider uppercase truncate">
              {isSuperAdmin ? 'PLATFORM ADMIN' : currentBusiness?.name || 'Field ERP'}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Links Area */}
      <nav className="flex-1 space-y-4 overflow-y-auto pr-1 scrollbar-none">
        {isSuperAdmin ? (
          /* ================= SUPER ADMIN NAVIGATION ================= */
          platformNavSections.map((section, sIdx) => (
            <div key={`sa-section-${sIdx}`} className="space-y-1">
              <div className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                {section.title}
              </div>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  // Handle matching for super_admin base tab
                  const isDashboard = item.id === 'super_admin_dashboard';
                  const isPending = item.id === 'super_admin_pending';
                  const isActive =
                    activeTab === item.id ||
                    (isDashboard && activeTab === 'super_admin') ||
                    (isPending && activeTab === 'super_admin_approvals');

                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/25'
                          : 'hover:bg-slate-900 text-slate-400 hover:text-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isActive ? 'text-white' : 'text-slate-400'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold border shrink-0 ${
                            item.badgeColor
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          /* ================= TENANT ERP NAVIGATION ================= */
          tenantNavSections.map((section, sIdx) => {
            const visibleItems = section.items.filter((item) => item.visible);
            if (visibleItems.length === 0) return null;

            return (
              <div key={`tenant-section-${sIdx}`} className="space-y-1">
                <div className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                  {section.title}
                </div>
                <div className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          isActive
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                            : 'hover:bg-slate-900 text-slate-400 hover:text-slate-100'
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isActive ? 'text-white' : 'text-slate-400'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </nav>

      {/* Bottom Footer Area */}
      <div className="mt-auto pt-3 border-t border-slate-850 space-y-2">
        {/* Quick Language Toggle */}
        <div className="px-1">
          <div className="flex items-center justify-between px-1.5 mb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <Globe className="w-3 h-3 text-indigo-400" />
              {t('common.language', undefined, 'Language')}
            </span>
            <span className="text-[9px] text-indigo-400 font-mono">
              {language === 'hi' ? 'हिन्दी' : language === 'mr' ? 'मराठी' : 'EN'}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            {supportedLanguages.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => setLanguage(l.code)}
                className={`py-1 text-center rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  language === l.code
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
                title={l.name}
              >
                {l.code === 'en' ? 'EN' : l.code === 'hi' ? 'हिन्दी' : 'मराठी'}
              </button>
            ))}
          </div>
        </div>

        {isSuperAdmin ? (
          /* Super Admin System Status Widget */
          <div className="p-3 rounded-2xl bg-gradient-to-br from-slate-900 to-purple-950/30 border border-purple-500/20 text-xs">
            <div className="flex items-center justify-between font-semibold text-slate-200 mb-1">
              <span className="font-extrabold text-white flex items-center gap-1.5 text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                Master Console
              </span>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-md font-extrabold uppercase flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                ONLINE
              </span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1 flex justify-between items-center">
              <span>{businesses.length} Active Tenants</span>
              <span className="font-mono text-purple-300 text-[9px]">v2.4 Pro</span>
            </div>
          </div>
        ) : (
          /* Tenant Plan Status Banner */
          <div
            onClick={() => setIsPricingModalOpen(true)}
            className="p-3 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950/40 border border-slate-800 text-xs hover:border-indigo-500/50 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between font-semibold text-slate-200 mb-1">
              <span className="font-extrabold text-white group-hover:text-indigo-300 transition-colors flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                {currentPlan?.name} Plan
              </span>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-md font-extrabold uppercase">
                ₹{currentPlan?.price}/mo
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
              <span>
                {currentPlan?.maxStaff >= 999
                  ? 'Unlimited'
                  : `Up to ${currentPlan?.maxStaff}`}{' '}
                Staff
              </span>
              <span className="text-indigo-400 font-bold group-hover:underline">
                Upgrade →
              </span>
            </div>
          </div>
        )}
      </div>

      <PricingModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
      />
    </aside>
  );
};


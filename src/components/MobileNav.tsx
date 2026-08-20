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
} from 'lucide-react';

interface MobileNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, setActiveTab }) => {
  const { currentUser, getRolePermissions, businesses, referralPayoutRequests, activeSupportSession } = useApp();
  const permissions = getRolePermissions(currentUser?.role);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const isTech = currentUser?.role === 'technician';
  const isSuperAdmin = currentUser?.role === 'super_admin';

  // Super Admin Bottom Bar Items
  const superAdminBottomItems = [
    { id: 'super_admin_dashboard', label: 'Platform', icon: LayoutDashboard },
    { id: 'super_admin_tenants', label: 'Tenants', icon: Building2 },
    { id: 'super_admin_pending', label: 'Approvals', icon: CheckCircle2 },
    { id: 'super_admin_support', label: 'Support', icon: Headphones },
    { id: 'more', label: 'Console', icon: Grid },
  ];

  // Tenant Bottom Bar Items
  const tenantBottomItems = isTech
    ? [
        { id: 'jobs', label: 'My Jobs', icon: Briefcase },
        { id: 'customers', label: 'Customers', icon: Users },
        { id: 'notifications', label: 'Alerts', icon: Bell },
        { id: 'settings', label: 'Profile', icon: Settings },
        { id: 'more', label: 'More', icon: Grid },
      ]
    : [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'jobs', label: 'Jobs', icon: Briefcase },
        { id: 'customers', label: 'Customers', icon: Users },
        { id: 'invoices', label: 'Invoices', icon: Receipt },
        { id: 'more', label: 'Modules', icon: Grid },
      ];

  const bottomItems = isSuperAdmin ? superAdminBottomItems : tenantBottomItems;

  // Super Admin Drawer Modules
  const superAdminModules = [
    { id: 'super_admin_dashboard', label: 'Platform Dashboard', icon: LayoutDashboard },
    { id: 'super_admin_tenants', label: 'Tenant Businesses', icon: Building2 },
    { id: 'super_admin_pending', label: 'Pending Approvals', icon: Clock },
    { id: 'super_admin_suspended', label: 'Suspended Businesses', icon: Ban },
    { id: 'super_admin_analytics', label: 'Platform Analytics', icon: BarChart3 },
    { id: 'super_admin_referrals', label: 'Referral Analytics', icon: Gift },
    { id: 'super_admin_support', label: 'Support Access', icon: Headphones },
    { id: 'super_admin_notifications', label: 'System Notifications', icon: Bell },
    { id: 'super_admin_audit', label: 'Security Audit Logs', icon: FileCode },
    { id: 'super_admin_security', label: 'Security & Access', icon: ShieldAlert },
    { id: 'super_admin_settings', label: 'Global Settings & MFA', icon: Sliders },
    { id: 'super_admin_plans', label: 'Plans & Subscriptions', icon: Layers },
    { id: 'super_admin_data_maintenance', label: 'Data & Maintenance', icon: Trash2 },
    { id: 'settings', label: 'Profile Settings', icon: Settings },
  ];

  // Tenant ERP Drawer Modules
  const tenantModules = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, visible: !isTech && (permissions.canManageJobs || permissions.canViewFinancials) },
    { id: 'jobs', label: 'Jobs & Field Work', icon: Briefcase, visible: permissions.canManageJobs },
    { id: 'customers', label: 'Customers CRM', icon: Users, visible: permissions.canManageJobs || permissions.canManageStaff },
    { id: 'services', label: 'Service Catalog', icon: Wrench, visible: permissions.canManageServices },
    { id: 'staff', label: 'Staff & Techs', icon: UserCheck, visible: permissions.canManageStaff },
    { id: 'inventory', label: 'Inventory & Parts', icon: Package, visible: permissions.canManageInventory },
    { id: 'quotations', label: 'Quotations', icon: FileText, visible: permissions.canViewFinancials },
    { id: 'invoices', label: 'Invoices', icon: Receipt, visible: permissions.canViewFinancials },
    { id: 'payments', label: 'Payment Ledger', icon: CreditCard, visible: permissions.canViewFinancials },
    { id: 'contracts', label: 'Recurring Contracts', icon: Repeat, visible: permissions.canManageContracts },
    { id: 'expenses', label: 'Expenses', icon: DollarSign, visible: permissions.canViewFinancials },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3, visible: permissions.canViewFinancials },
    { id: 'notifications', label: 'Notifications', icon: Bell, visible: true },
    { id: 'ai_assistant', label: 'AI Assistant', icon: Sparkles, visible: permissions.canManageJobs || permissions.canViewFinancials },
    { id: 'settings', label: 'Profile Settings', icon: Settings, visible: true },
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
          const isDashboard = item.id === 'super_admin_dashboard';
          const isActive =
            (activeTab === item.id || (isDashboard && activeTab === 'super_admin')) &&
            !isMoreMenuOpen;

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

          <div className="relative z-10 bg-white dark:bg-slate-900 rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto border-t border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-black text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                  {isSuperAdmin ? (
                    <>
                      <ShieldCheck className="w-5 h-5 text-purple-600" />
                      <span>SaaS Master Console</span>
                    </>
                  ) : (
                    <span>All Business Modules</span>
                  )}
                </h3>
                <p className="text-xs text-slate-500">Tap any module to open</p>
              </div>
              <button
                onClick={() => setIsMoreMenuOpen(false)}
                className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {(isSuperAdmin ? superAdminModules : tenantModules.filter((m) => m.visible)).map((m) => {
                const Icon = m.icon;
                const isDashboard = m.id === 'super_admin_dashboard';
                const isCurrent = activeTab === m.id || (isDashboard && activeTab === 'super_admin');

                return (
                  <button
                    key={m.id}
                    onClick={() => handleTabClick(m.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center gap-2 transition-all active:scale-95 cursor-pointer ${
                      isCurrent
                        ? isSuperAdmin
                          ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800 font-bold'
                          : 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 font-bold'
                        : 'bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 border-slate-200/80 dark:border-slate-700/80'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-xs ${
                        isSuperAdmin
                          ? 'bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400'
                          : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                      }`}
                    >
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
        </div>
      )}
    </>
  );
};


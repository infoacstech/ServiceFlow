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
} from 'lucide-react';
import { PricingModal } from './PricingModal';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { currentUser, getRolePermissions, currentBusiness, plans, logoutUser, showToast } = useApp();
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const permissions = getRolePermissions(currentUser?.role);

  const isTech = currentUser?.role === 'technician';
  const isSuperAdmin = currentUser?.role === 'super_admin';

  const currentPlan =
    plans.find((p) => p.id === currentBusiness?.planId) ||
    plans.find((p) => p.id === 'plan-starter') ||
    plans[0];

  const mainNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, visible: !isTech && (permissions.canManageJobs || permissions.canViewFinancials) },
    { id: 'jobs', label: isTech ? 'My Assigned Jobs' : 'Job Management', icon: Briefcase, visible: permissions.canManageJobs },
    { id: 'customers', label: 'Customers CRM', icon: Users, visible: permissions.canManageJobs || permissions.canManageStaff },
    { id: 'services', label: 'Service Catalog', icon: Wrench, visible: permissions.canManageServices },
    { id: 'staff', label: 'Staff & Techs', icon: UserCheck, visible: permissions.canManageStaff },
    { id: 'inventory', label: 'Inventory & Parts', icon: Package, visible: permissions.canManageInventory },
    { id: 'quotations', label: 'Quotations', icon: FileText, visible: permissions.canViewFinancials },
    { id: 'invoices', label: 'Invoices', icon: Receipt, visible: permissions.canViewFinancials },
    { id: 'payments', label: 'Payment Ledger', icon: CreditCard, visible: permissions.canViewFinancials },
    { id: 'contracts', label: 'Recurring Contracts', icon: Repeat, visible: permissions.canManageContracts },
    { id: 'expenses', label: 'Expense Tracker', icon: DollarSign, visible: permissions.canViewFinancials },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3, visible: permissions.canViewFinancials },
    { id: 'notifications', label: 'Notifications', icon: Bell, visible: true },
    { id: 'ai_assistant', label: 'AI Business Assistant', icon: Sparkles, visible: permissions.canManageJobs || permissions.canViewFinancials },
    { id: 'customer_portal', label: 'Customer Portal', icon: Globe, visible: permissions.canAccessCustomerPortal },
    { id: 'settings', label: isTech ? 'Profile & Settings' : 'Profile Settings', icon: Settings, visible: true },
  ];

  if (isSuperAdmin || permissions.canAccessSuperAdmin) {
    mainNavItems.unshift({ id: 'super_admin', label: 'SaaS Platform Admin', icon: ShieldCheck, visible: true });
  }

  const visibleNav = mainNavItems.filter((item) => item.visible);

  return (
    <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-300 border-r border-slate-800 p-3 shrink-0 select-none">
      <div className="px-3 py-3 mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-base shadow-md">
            S
          </div>
          <div>
            <div className="font-extrabold text-sm text-white tracking-tight">ServiFlow SaaS</div>
            <div className="text-[10px] text-indigo-400 font-semibold tracking-wider uppercase">Field Operations</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
        {visibleNav.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'hover:bg-slate-800/80 text-slate-400 hover:text-slate-100'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Plan Status Banner */}
      <div className="mt-auto pt-3 border-t border-slate-800/80">
        <div
          onClick={() => setIsPricingModalOpen(true)}
          className="p-3 rounded-2xl bg-gradient-to-br from-slate-800/80 to-indigo-950/40 border border-slate-700/60 text-xs hover:border-indigo-500/50 transition-all cursor-pointer group"
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
            <span>{currentPlan?.maxStaff >= 999 ? 'Unlimited' : `Up to ${currentPlan?.maxStaff}`} Staff</span>
            <span className="text-indigo-400 font-bold group-hover:underline">Upgrade →</span>
          </div>
        </div>
      </div>

      <PricingModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
      />
    </aside>
  );
};

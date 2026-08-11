import React from 'react';
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
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { currentUser } = useApp();

  const isTech = currentUser.role === 'technician';
  const isSuperAdmin = currentUser.role === 'super_admin';

  const mainNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['business_owner', 'manager'] },
    { id: 'jobs', label: isTech ? 'My Assigned Jobs' : 'Job Management', icon: Briefcase, roles: ['business_owner', 'manager', 'technician'] },
    { id: 'customers', label: 'Customers CRM', icon: Users, roles: ['business_owner', 'manager', 'technician'] },
    { id: 'services', label: 'Service Catalog', icon: Wrench, roles: ['business_owner', 'manager'] },
    { id: 'staff', label: 'Staff & Techs', icon: UserCheck, roles: ['business_owner', 'manager'] },
    { id: 'inventory', label: 'Inventory & Parts', icon: Package, roles: ['business_owner', 'manager'] },
    { id: 'quotations', label: 'Quotations', icon: FileText, roles: ['business_owner', 'manager'] },
    { id: 'invoices', label: 'Invoices', icon: Receipt, roles: ['business_owner', 'manager'] },
    { id: 'payments', label: 'Payment Ledger', icon: CreditCard, roles: ['business_owner', 'manager'] },
    { id: 'contracts', label: 'Recurring Contracts', icon: Repeat, roles: ['business_owner', 'manager'] },
    { id: 'expenses', label: 'Expense Tracker', icon: DollarSign, roles: ['business_owner', 'manager'] },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3, roles: ['business_owner', 'manager'] },
    { id: 'notifications', label: 'Notifications', icon: Bell, roles: ['business_owner', 'manager', 'technician'] },
    { id: 'ai_assistant', label: 'AI Business Assistant', icon: Sparkles, roles: ['business_owner', 'manager'] },
    { id: 'customer_portal', label: 'Customer Portal', icon: Globe, roles: ['business_owner', 'manager'] },
    { id: 'settings', label: 'Business Settings', icon: Settings, roles: ['business_owner', 'manager'] },
    { id: 'login', label: 'Login Panel & Switch', icon: KeyRound, roles: ['business_owner', 'manager', 'technician', 'super_admin'] },
  ];

  if (isSuperAdmin) {
    mainNavItems.unshift({ id: 'super_admin', label: 'SaaS Platform Admin', icon: ShieldCheck, roles: ['super_admin'] });
  }

  const visibleNav = mainNavItems.filter((item) => item.roles.includes(currentUser.role));

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
        <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/50 text-xs">
          <div className="flex items-center justify-between font-semibold text-slate-200 mb-1">
            <span>Professional Plan</span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-md font-bold uppercase">Active</span>
          </div>
          <div className="text-[11px] text-slate-400">Multi-tenant FSM ready</div>
        </div>
      </div>
    </aside>
  );
};

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
  KeyRound,
} from 'lucide-react';

interface MobileNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, setActiveTab }) => {
  const { currentUser } = useApp();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const isTech = currentUser.role === 'technician';
  const isSuperAdmin = currentUser.role === 'super_admin';

  const bottomItems = isTech
    ? [
        { id: 'jobs', label: 'My Jobs', icon: Briefcase },
        { id: 'customers', label: 'Customers', icon: Users },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'more', label: 'More', icon: Grid },
      ]
    : [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'jobs', label: 'Jobs', icon: Briefcase },
        { id: 'customers', label: 'Customers', icon: Users },
        { id: 'more', label: 'Modules', icon: Grid },
      ];

  const allModules = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['business_owner', 'manager'] },
    { id: 'jobs', label: 'Jobs & Field Work', icon: Briefcase, roles: ['business_owner', 'manager', 'technician'] },
    { id: 'customers', label: 'Customers CRM', icon: Users, roles: ['business_owner', 'manager', 'technician'] },
    { id: 'services', label: 'Service Catalog', icon: Wrench, roles: ['business_owner', 'manager'] },
    { id: 'staff', label: 'Staff & Techs', icon: UserCheck, roles: ['business_owner', 'manager'] },
    { id: 'inventory', label: 'Inventory & Parts', icon: Package, roles: ['business_owner', 'manager'] },
    { id: 'quotations', label: 'Quotations', icon: FileText, roles: ['business_owner', 'manager'] },
    { id: 'invoices', label: 'Invoices', icon: Receipt, roles: ['business_owner', 'manager'] },
    { id: 'payments', label: 'Payment Ledger', icon: CreditCard, roles: ['business_owner', 'manager'] },
    { id: 'contracts', label: 'Recurring Contracts', icon: Repeat, roles: ['business_owner', 'manager'] },
    { id: 'expenses', label: 'Expenses', icon: DollarSign, roles: ['business_owner', 'manager'] },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3, roles: ['business_owner', 'manager'] },
    { id: 'notifications', label: 'Notifications', icon: Bell, roles: ['business_owner', 'manager', 'technician'] },
    { id: 'ai_assistant', label: 'AI Business Assistant', icon: Sparkles, roles: ['business_owner', 'manager'] },
    { id: 'settings', label: 'Settings', icon: Settings, roles: ['business_owner', 'manager'] },
    { id: 'login', label: 'Login Panel & Switch', icon: KeyRound, roles: ['business_owner', 'manager', 'technician', 'super_admin'] },
  ];

  if (isSuperAdmin) {
    allModules.unshift({ id: 'super_admin', label: 'Super Admin', icon: ShieldCheck, roles: ['super_admin'] });
  }

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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 flex items-center justify-around">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id && !isMoreMenuOpen;
          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-[10px] font-semibold transition-all ${
                isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* More Modules Full-Screen Modal Drawer */}
      {isMoreMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex flex-col justify-end animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-t-3xl p-5 max-h-[80vh] overflow-y-auto border-t border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">All Business Modules</h3>
                <p className="text-xs text-slate-500">Tap to navigate</p>
              </div>
              <button
                onClick={() => setIsMoreMenuOpen(false)}
                className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {allModules
                .filter((m) => m.roles.includes(currentUser.role))
                .map((m) => {
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.id}
                      onClick={() => handleTabClick(m.id)}
                      className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 border border-slate-200/80 dark:border-slate-700/80 text-center gap-2 transition-all active:scale-95"
                    >
                      <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-medium text-slate-800 dark:text-slate-200 line-clamp-2">
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

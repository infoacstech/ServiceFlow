import React, { useState, useEffect } from 'react';
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
  Download,
  Smartphone,
} from 'lucide-react';
import { InstallAppModal } from './InstallAppModal';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface MobileNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, setActiveTab }) => {
  const { currentUser, getRolePermissions } = useApp();
  const permissions = getRolePermissions(currentUser?.role);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const isTech = currentUser?.role === 'technician';
  const isSuperAdmin = currentUser?.role === 'super_admin';

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
    { id: 'ai_assistant', label: 'AI Business Assistant', icon: Sparkles, visible: permissions.canManageJobs || permissions.canViewFinancials },
    { id: 'settings', label: 'Settings', icon: Settings, visible: permissions.canAccessSettings },
    { id: 'login', label: 'Login Panel & Switch', icon: KeyRound, visible: true },
  ];

  if (isSuperAdmin || permissions.canAccessSuperAdmin) {
    allModules.unshift({ id: 'super_admin', label: 'Super Admin', icon: ShieldCheck, visible: true });
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
                .filter((m) => m.visible)
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

            {/* Install Standalone App Prompt inside drawer */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  setIsInstallModalOpen(true);
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 active:scale-98 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                    <Smartphone className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-left">
                    <div>Install ServiFlow App</div>
                    <div className="text-[10px] text-indigo-200 font-normal">Dedicated fullscreen mobile app</div>
                  </div>
                </div>
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Standalone Installation Modal */}
      <InstallAppModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        deferredPrompt={deferredPrompt}
      />
    </>
  );
};

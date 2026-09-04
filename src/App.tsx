import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { navigationManager, useBackHandler } from './utils/backNavigation';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { OnboardingModal } from './components/OnboardingModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { ToastContainer } from './components/ToastContainer';
import { ActivityLogDrawer } from './components/ActivityLogDrawer';
import { OfflineSyncBanner } from './components/OfflineSyncBanner';
import { SupportSessionBanner } from './components/SupportSessionBanner';
import { GlobalBroadcastBanner } from './components/GlobalBroadcastBanner';
import { AuthModal } from './components/AuthModal';
import { AccessDeniedView } from './components/AccessDeniedView';
import { PullToRefresh } from './components/PullToRefresh';
import { JobNotificationPopup } from './components/JobNotificationPopup';
import { QuickActionFab } from './components/QuickActionFab';
import { UserProfileDrawer } from './components/UserProfileDrawer';
import { InstallAppModal } from './components/InstallAppModal';
import { PwaInstallPrompt } from './components/PwaInstallPrompt';

import type { JobInitialFilter } from './views/JobsView';
import type { InvoiceInitialFilter } from './views/InvoicesView';

// Route-based Code Splitting: Lazy load views on demand to drastically optimize initial bundle load
const DashboardView = React.lazy(() => import('./views/DashboardView').then(m => ({ default: m.DashboardView })));
const EnquiriesView = React.lazy(() => import('./views/EnquiriesView').then(m => ({ default: m.EnquiriesView })));
const CustomersView = React.lazy(() => import('./views/CustomersView').then(m => ({ default: m.CustomersView })));
const ServicesView = React.lazy(() => import('./views/ServicesView').then(m => ({ default: m.ServicesView })));
const JobsView = React.lazy(() => import('./views/JobsView').then(m => ({ default: m.JobsView })));
const TechnicianView = React.lazy(() => import('./views/TechnicianView').then(m => ({ default: m.TechnicianView })));
const InventoryView = React.lazy(() => import('./views/InventoryView').then(m => ({ default: m.InventoryView })));
const QuotationsView = React.lazy(() => import('./views/QuotationsView').then(m => ({ default: m.QuotationsView })));
const InvoicesView = React.lazy(() => import('./views/InvoicesView').then(m => ({ default: m.InvoicesView })));
const PaymentsView = React.lazy(() => import('./views/PaymentsView').then(m => ({ default: m.PaymentsView })));
const ContractsView = React.lazy(() => import('./views/ContractsView').then(m => ({ default: m.ContractsView })));
const StaffView = React.lazy(() => import('./views/StaffView').then(m => ({ default: m.StaffView })));
const ExpensesView = React.lazy(() => import('./views/ExpensesView').then(m => ({ default: m.ExpensesView })));
const ReportsView = React.lazy(() => import('./views/ReportsView').then(m => ({ default: m.ReportsView })));
const AIAssistantView = React.lazy(() => import('./views/AIAssistantView').then(m => ({ default: m.AIAssistantView })));
const CustomerPortalView = React.lazy(() => import('./views/CustomerPortalView').then(m => ({ default: m.CustomerPortalView })));
const SuperAdminView = React.lazy(() => import('./views/SuperAdminView').then(m => ({ default: m.SuperAdminView })));
const SettingsView = React.lazy(() => import('./views/SettingsView').then(m => ({ default: m.SettingsView })));
const NotificationsView = React.lazy(() => import('./views/NotificationsView').then(m => ({ default: m.NotificationsView })));
const AttendanceView = React.lazy(() => import('./views/AttendanceView').then(m => ({ default: m.AttendanceView })));
const EmployeeAttendanceView = React.lazy(() => import('./views/EmployeeAttendanceView').then(m => ({ default: m.EmployeeAttendanceView })));
const LoginView = React.lazy(() => import('./views/LoginView').then(m => ({ default: m.LoginView })));

const ViewLoadingFallback: React.FC = () => (
  <div className="p-4 sm:p-6 space-y-4 animate-pulse">
    <div className="h-9 bg-slate-200/80 dark:bg-slate-800/70 rounded-2xl w-48" />
    <div className="h-24 bg-slate-100 dark:bg-slate-800/40 rounded-2xl w-full border border-slate-200/60 dark:border-slate-800/60" />
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <div className="h-28 bg-slate-100 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800/60" />
      <div className="h-28 bg-slate-100 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800/60" />
      <div className="h-28 bg-slate-100 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800/60" />
    </div>
  </div>
);

const MainContent: React.FC = () => {
  const {
    currentUser,
    currentBusiness,
    isAuthInitializing,
    isAuthModalOpen,
    setIsAuthModalOpen,
    isProfileDrawerOpen,
    setIsProfileDrawerOpen,
    isInstallModalOpen,
    setIsInstallModalOpen,
    getRolePermissions,
    showToast,
  } = useApp();
  const [activeTab, setActiveTab] = useState<string>(() => {
    return localStorage.getItem('serviflow_active_tab') || sessionStorage.getItem('serviflow_active_tab') || 'dashboard';
  });
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isCreateJobOpen, setIsCreateJobOpen] = useState(false);

  // Global Android / Browser Hardware Back Button handling for App-level modals & drawers
  useBackHandler(isCreateJobOpen, () => setIsCreateJobOpen(false), 'app-create-job');
  useBackHandler(isOnboardingOpen, () => setIsOnboardingOpen(false), 'app-onboarding');
  useBackHandler(isAuthModalOpen, () => setIsAuthModalOpen(false), 'app-auth-modal');
  useBackHandler(isProfileDrawerOpen, () => setIsProfileDrawerOpen(false), 'app-profile-drawer');
  useBackHandler(isInstallModalOpen, () => setIsInstallModalOpen(false), 'app-install-modal');

  const [jobsFilter, setJobsFilter] = useState<JobInitialFilter | null>(null);
  const [invoicesFilter, setInvoicesFilter] = useState<InvoiceInitialFilter | null>(null);
  const [isPublicCustomerPortal, setIsPublicCustomerPortal] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('portal') === 'customer' || !!params.get('cid') || !!params.get('customer');
    }
    return false;
  });

  const prevUserIdRef = React.useRef<string | null>(null);

  // Initialize global navigation manager once on mount
  useEffect(() => {
    navigationManager.init(
      activeTab,
      (targetTab) => {
        setActiveTab(targetTab);
        if (currentUser) {
          localStorage.setItem('serviflow_active_tab', targetTab);
          sessionStorage.setItem('serviflow_active_tab', targetTab);
        }
      },
      (msg, type) => {
        showToast(msg, type === 'warning' ? 'info' : type);
      }
    );
  }, []);

  // Sync activeTab only when switching authenticated user/session
  React.useEffect(() => {
    if (currentUser) {
      if (prevUserIdRef.current !== currentUser.id) {
        prevUserIdRef.current = currentUser.id;
        const isTechUser = currentUser.role === 'technician';
        const isSuperUser = currentUser.role === 'super_admin';
        const savedTab = localStorage.getItem('serviflow_active_tab') || sessionStorage.getItem('serviflow_active_tab');

        if (isTechUser) {
          // Technicians & staff must default to 'jobs' (My Jobs) and are restricted from dashboard
          if (!savedTab || savedTab === 'login' || savedTab === 'dashboard') {
            setActiveTab('jobs');
            navigationManager.pushScreen('jobs');
            localStorage.setItem('serviflow_active_tab', 'jobs');
            sessionStorage.setItem('serviflow_active_tab', 'jobs');
          } else {
            setActiveTab(savedTab);
            navigationManager.pushScreen(savedTab);
          }
        } else if (!savedTab || savedTab === 'login') {
          const defaultTab = isSuperUser ? 'super_admin_dashboard' : 'dashboard';
          setActiveTab(defaultTab);
          navigationManager.pushScreen(defaultTab);
          localStorage.setItem('serviflow_active_tab', defaultTab);
          sessionStorage.setItem('serviflow_active_tab', defaultTab);
        } else {
          setActiveTab(savedTab);
          navigationManager.pushScreen(savedTab);
        }
      }
    } else if (!isAuthInitializing) {
      prevUserIdRef.current = null;
      setActiveTab('login');
      navigationManager.pushScreen('login');
    }
  }, [currentUser?.id, currentUser?.role, isAuthInitializing]);

  const handleTabChange = (tab: string) => {
    let targetTab = tab;
    if (currentUser?.role === 'technician' && tab === 'dashboard') {
      targetTab = 'jobs';
    }
    if (currentUser?.role === 'super_admin' && tab === 'super_admin') {
      targetTab = 'super_admin_dashboard';
    }
    navigationManager.pushScreen(targetTab);
    setActiveTab(targetTab);
    if (currentUser) {
      localStorage.setItem('serviflow_active_tab', targetTab);
      sessionStorage.setItem('serviflow_active_tab', targetTab);
    }
  };

  // 1. Loading / Splash Screen ONLY while resolving if NO cached session exists
  if (isAuthInitializing && !currentUser) {
    return (
      <div className="min-h-screen bg-[#F7F5F0] dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-indigo-600/30 mb-6 animate-pulse">
          S
        </div>
        <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight mb-2">
          ServiFlow Field Operations
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 max-w-sm">
          Restoring authenticated session and tenant credentials from cloud database...
        </p>
        <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-indigo-600 dark:text-indigo-400 font-semibold text-xs shadow-sm">
          <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span>Authenticating Session...</span>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated State (Logged Out or No Active Session)
  if (!currentUser) {
    if (isPublicCustomerPortal) {
      return (
        <div className="min-h-screen bg-[#F7F5F0] dark:bg-slate-950 text-stone-900 dark:text-slate-100 flex flex-col font-sans antialiased overflow-x-hidden">
          <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 px-4 py-3">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black flex items-center justify-center text-sm shadow-sm">
                  {currentBusiness?.name?.charAt(0) || 'S'}
                </div>
                <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                  {currentBusiness?.name || 'ServiFlow Portal'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsPublicCustomerPortal(false)}
                className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
              >
                Staff / Admin Login →
              </button>
            </div>
          </header>

          <main className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-6 overflow-y-auto">
            <CustomerPortalView onBackToApp={() => setIsPublicCustomerPortal(false)} />
          </main>
          <ToastContainer />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#F7F5F0] dark:bg-slate-950 text-stone-900 dark:text-slate-100 flex flex-col font-sans antialiased overflow-x-hidden">
        <main className="flex-1 max-w-7xl mx-auto w-full min-h-screen overflow-y-auto">
          <PullToRefresh className="p-3 sm:p-6 lg:p-8">
            <LoginView onLoginSuccess={() => {}} />
          </PullToRefresh>
        </main>
        <ToastContainer />
      </div>
    );
  }

  const permissions = getRolePermissions(currentUser?.role);

  const getTabAccess = (tab: string) => {
    if (tab === 'super_admin' || tab.startsWith('super_admin_')) {
      return { allowed: permissions.canAccessSuperAdmin, label: 'SaaS Platform Super Admin' };
    }
    switch (tab) {
      case 'dashboard':
        return {
          allowed: currentUser?.role !== 'technician' && (permissions.canManageJobs || permissions.canViewFinancials),
          label: 'Admin or Manager'
        };
      case 'enquiries':
        return {
          allowed: currentUser?.role !== 'technician' && (permissions.canManageJobs || permissions.canManageStaff),
          label: 'Admin or Manager'
        };
      case 'jobs':
        return { allowed: permissions.canManageJobs, label: 'Technician, Manager, or Admin' };
      case 'customers':
        return { allowed: permissions.canManageJobs || permissions.canManageStaff, label: 'Technician, Manager, or Admin' };
      case 'services':
        return { allowed: permissions.canManageServices, label: 'Admin or Manager' };
      case 'staff':
        return { allowed: permissions.canManageStaff, label: 'Admin or Manager' };
      case 'attendance':
        return { allowed: true, label: '' };
      case 'inventory':
        return { allowed: permissions.canManageInventory, label: 'Admin or Manager' };
      case 'quotations':
      case 'invoices':
      case 'payments':
      case 'reports':
        return { allowed: permissions.canViewFinancials, label: 'Admin or Manager' };
      case 'expenses':
        return { allowed: true, label: '' };
      case 'contracts':
        return { allowed: permissions.canManageContracts, label: 'Admin or Manager' };
      case 'ai_assistant':
        return { allowed: permissions.canManageJobs || permissions.canViewFinancials, label: 'Admin or Manager' };
      case 'customer_portal':
        return { allowed: permissions.canAccessCustomerPortal, label: 'Admin or Manager' };
      case 'settings':
        return { allowed: true, label: '' };
      case 'notifications':
      case 'login':
      default:
        return { allowed: true, label: '' };
    }
  };

  const currentTabAccess = getTabAccess(activeTab);

  const handleNavigateWithFilter = (tab: string, filter?: any) => {
    if (tab === 'jobs') {
      setJobsFilter(filter || null);
    } else if (tab === 'invoices') {
      setInvoicesFilter(filter || null);
    }
    handleTabChange(tab);
  };

  const handleOpenNewJob = () => {
    handleTabChange('jobs');
    setIsCreateJobOpen(true);
  };

  const isTech = currentUser?.role === 'technician';

  return (
    <div className="min-h-screen bg-[#F7F5F0] dark:bg-slate-950 text-stone-900 dark:text-slate-100 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white w-full max-w-full overflow-x-hidden">
      {/* Super Admin Support Access Active Banner */}
      <SupportSessionBanner />

      {/* Offline Sync Banner for Technicians */}
      <OfflineSyncBanner />

      {/* Global Platform Broadcast Announcement Banner */}
      <GlobalBroadcastBanner />

      {/* Top Navbar Header */}
      <Navbar
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
        activeTab={activeTab}
        setActiveTab={handleTabChange}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex w-full">
        {/* Desktop Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={handleTabChange} />

        {/* View Content Area with Natural Scroll & Pull-To-Refresh */}
        <main className="flex-1 min-w-0 flex flex-col w-full">
          <PullToRefresh
            disabled={isCreateJobOpen || isOnboardingOpen || isAuthModalOpen || isProfileDrawerOpen || isInstallModalOpen}
            className="p-3 sm:p-4 lg:p-5 pb-24 sm:pb-8 w-full max-w-full"
          >
            <div key={activeTab} className="animate-in fade-in duration-200">
              {!currentTabAccess.allowed ? (
                <AccessDeniedView
                  requiredRoleLabel={currentTabAccess.label}
                  onSwitchAccount={() => handleTabChange('login')}
                />
              ) : (
                <React.Suspense fallback={<ViewLoadingFallback />}>
                  {activeTab === 'dashboard' && (
                    <DashboardView
                      setActiveTab={handleTabChange}
                      onNavigateWithFilter={handleNavigateWithFilter}
                      onOpenNewJob={handleOpenNewJob}
                    />
                  )}

                  {activeTab === 'enquiries' && <EnquiriesView onNavigate={handleTabChange} />}

                  {activeTab === 'customers' && <CustomersView />}

                  {activeTab === 'services' && <ServicesView />}

                  {activeTab === 'jobs' &&
                    (isTech ? (
                      <TechnicianView />
                    ) : (
                      <JobsView
                        isCreateModalOpen={isCreateJobOpen}
                        setIsCreateModalOpen={setIsCreateJobOpen}
                        initialFilter={jobsFilter}
                      />
                    ))}

                  {activeTab === 'staff' && <StaffView />}

                  {activeTab === 'attendance' &&
                    (permissions.canManageStaff ? <AttendanceView /> : <EmployeeAttendanceView />)}

                  {activeTab === 'inventory' && <InventoryView />}

                  {activeTab === 'quotations' && <QuotationsView />}

                  {activeTab === 'invoices' && <InvoicesView initialFilter={invoicesFilter} />}

                  {activeTab === 'payments' && <PaymentsView />}

                  {activeTab === 'contracts' && <ContractsView />}

                  {activeTab === 'expenses' && <ExpensesView />}

                  {activeTab === 'reports' && <ReportsView />}

                  {activeTab === 'ai_assistant' && <AIAssistantView />}

                  {activeTab === 'customer_portal' && <CustomerPortalView />}

                  {(activeTab === 'super_admin' || activeTab.startsWith('super_admin_')) && (
                    <SuperAdminView
                      activeSubSection={activeTab}
                      onNavigate={handleTabChange}
                    />
                  )}

                  {activeTab === 'settings' && <SettingsView />}

                  {activeTab === 'notifications' && <NotificationsView />}

                  {activeTab === 'login' && (
                    <LoginView onLoginSuccess={() => handleTabChange(isTech ? 'jobs' : 'dashboard')} />
                  )}
                </React.Suspense>
              )}
            </div>
          </PullToRefresh>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav activeTab={activeTab} setActiveTab={handleTabChange} />

      {/* Global Modals & Toasts */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
      />
      <GlobalSearchModal onSelectTab={(tab) => handleTabChange(tab)} />
      <ActivityLogDrawer />
      <JobNotificationPopup
        onOpenJob={(jobId) => {
          handleNavigateWithFilter('jobs', { query: jobId });
        }}
      />
      <QuickActionFab
        onOpenNewJob={handleOpenNewJob}
        onNavigate={handleTabChange}
        activeTab={activeTab}
      />

      {/* Root-Level Full Viewport User Profile & Settings Drawer */}
      <UserProfileDrawer
        isOpen={isProfileDrawerOpen}
        onClose={() => setIsProfileDrawerOpen(false)}
        onNavigateToSettings={() => {
          handleTabChange('settings');
          setIsProfileDrawerOpen(false);
        }}
        onOpenInstallModal={() => {
          setIsInstallModalOpen(true);
          setIsProfileDrawerOpen(false);
        }}
        onSignOut={() => {
          handleTabChange('login');
        }}
      />

      {/* Root-Level Standalone Installation Modal */}
      <InstallAppModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />

      {/* PWA Floating Install Prompt for mobile/desktop browsers */}
      <PwaInstallPrompt />

      <ToastContainer />
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}

export default App;

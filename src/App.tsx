import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
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

import { DashboardView } from './views/DashboardView';
import { EnquiriesView } from './views/EnquiriesView';
import { CustomersView } from './views/CustomersView';
import { ServicesView } from './views/ServicesView';
import { JobsView, JobInitialFilter } from './views/JobsView';
import { TechnicianView } from './views/TechnicianView';
import { InventoryView } from './views/InventoryView';
import { QuotationsView } from './views/QuotationsView';
import { InvoicesView, InvoiceInitialFilter } from './views/InvoicesView';
import { PaymentsView } from './views/PaymentsView';
import { ContractsView } from './views/ContractsView';
import { StaffView } from './views/StaffView';
import { ExpensesView } from './views/ExpensesView';
import { ReportsView } from './views/ReportsView';
import { AIAssistantView } from './views/AIAssistantView';
import { CustomerPortalView } from './views/CustomerPortalView';
import { SuperAdminView } from './views/SuperAdminView';
import { SettingsView } from './views/SettingsView';
import { NotificationsView } from './views/NotificationsView';
import { AttendanceView } from './views/AttendanceView';
import { LoginView } from './views/LoginView';

const MainContent: React.FC = () => {
  const {
    currentUser,
    isAuthInitializing,
    isAuthModalOpen,
    setIsAuthModalOpen,
    isProfileDrawerOpen,
    setIsProfileDrawerOpen,
    isInstallModalOpen,
    setIsInstallModalOpen,
    getRolePermissions,
  } = useApp();
  const [activeTab, setActiveTab] = useState<string>(() => {
    return localStorage.getItem('serviflow_active_tab') || sessionStorage.getItem('serviflow_active_tab') || 'dashboard';
  });
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isCreateJobOpen, setIsCreateJobOpen] = useState(false);

  const [jobsFilter, setJobsFilter] = useState<JobInitialFilter | null>(null);
  const [invoicesFilter, setInvoicesFilter] = useState<InvoiceInitialFilter | null>(null);

  // Sync activeTab when user or auth state changes
  React.useEffect(() => {
    if (currentUser) {
      const isTechUser = currentUser.role === 'technician';
      const isSuperUser = currentUser.role === 'super_admin';
      const savedTab = localStorage.getItem('serviflow_active_tab') || sessionStorage.getItem('serviflow_active_tab');

      if (isTechUser) {
        // Technicians & staff must default to 'jobs' (My Jobs) and are restricted from dashboard
        if (!savedTab || savedTab === 'login' || savedTab === 'dashboard') {
          setActiveTab('jobs');
          localStorage.setItem('serviflow_active_tab', 'jobs');
          sessionStorage.setItem('serviflow_active_tab', 'jobs');
        } else {
          setActiveTab(savedTab);
        }
      } else if (!savedTab || savedTab === 'login') {
        const defaultTab = isSuperUser ? 'super_admin_dashboard' : 'dashboard';
        setActiveTab(defaultTab);
        localStorage.setItem('serviflow_active_tab', defaultTab);
        sessionStorage.setItem('serviflow_active_tab', defaultTab);
      } else {
        setActiveTab(savedTab);
      }
    } else if (!isAuthInitializing) {
      setActiveTab('login');
    }
  }, [currentUser, isAuthInitializing]);

  const handleTabChange = (tab: string) => {
    let targetTab = tab;
    if (currentUser?.role === 'technician' && tab === 'dashboard') {
      targetTab = 'jobs';
    }
    if (currentUser?.role === 'super_admin' && tab === 'super_admin') {
      targetTab = 'super_admin_dashboard';
    }
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
      case 'attendance':
        return { allowed: permissions.canManageStaff, label: 'Admin or Manager' };
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
          <PullToRefresh className="p-3 sm:p-4 lg:p-5 pb-24 sm:pb-8 w-full max-w-full">
            <div key={activeTab} className="animate-in fade-in duration-200">
              {!currentTabAccess.allowed ? (
                <AccessDeniedView
                  requiredRoleLabel={currentTabAccess.label}
                  onSwitchAccount={() => handleTabChange('login')}
                />
              ) : (
                <>
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

                  {activeTab === 'attendance' && <AttendanceView />}

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
                </>
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

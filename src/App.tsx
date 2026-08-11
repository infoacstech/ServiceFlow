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

import { DashboardView } from './views/DashboardView';
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

const MainContent: React.FC = () => {
  const { currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isCreateJobOpen, setIsCreateJobOpen] = useState(false);

  const [jobsFilter, setJobsFilter] = useState<JobInitialFilter | null>(null);
  const [invoicesFilter, setInvoicesFilter] = useState<InvoiceInitialFilter | null>(null);

  const handleNavigateWithFilter = (tab: string, filter?: any) => {
    if (tab === 'jobs') {
      setJobsFilter(filter || null);
    } else if (tab === 'invoices') {
      setInvoicesFilter(filter || null);
    }
    setActiveTab(tab);
  };

  const handleOpenNewJob = () => {
    setActiveTab('jobs');
    setIsCreateJobOpen(true);
  };

  const isTech = currentUser.role === 'technician';

  return (
    <div className="min-h-screen bg-[#F7F5F0] dark:bg-slate-950 text-stone-900 dark:text-slate-100 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Offline Sync Banner for Technicians */}
      <OfflineSyncBanner />

      {/* Top Navbar Header */}
      <Navbar
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto overflow-hidden">
        {/* Desktop Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* View Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div key={activeTab} className="animate-in fade-in duration-200">
            {activeTab === 'dashboard' && (
              <DashboardView
                setActiveTab={setActiveTab}
                onNavigateWithFilter={handleNavigateWithFilter}
                onOpenNewJob={handleOpenNewJob}
              />
            )}

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

            {activeTab === 'inventory' && <InventoryView />}

            {activeTab === 'quotations' && <QuotationsView />}

            {activeTab === 'invoices' && <InvoicesView initialFilter={invoicesFilter} />}

            {activeTab === 'payments' && <PaymentsView />}

            {activeTab === 'contracts' && <ContractsView />}

            {activeTab === 'expenses' && <ExpensesView />}

            {activeTab === 'reports' && <ReportsView />}

            {activeTab === 'ai_assistant' && <AIAssistantView />}

            {activeTab === 'customer_portal' && <CustomerPortalView />}

            {activeTab === 'super_admin' && <SuperAdminView />}

            {activeTab === 'settings' && <SettingsView />}

            {activeTab === 'notifications' && <NotificationsView />}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Global Modals & Toasts */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
      />
      <GlobalSearchModal onSelectTab={(tab) => setActiveTab(tab)} />
      <ActivityLogDrawer />
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

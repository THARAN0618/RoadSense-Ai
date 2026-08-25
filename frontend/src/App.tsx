import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { CitizenDashboard } from './pages/CitizenDashboard';
import { AuthorityDashboard } from './pages/AuthorityDashboard';
import { WorkerDashboard } from './pages/WorkerDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { MapViewPage } from './pages/MapViewPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ReportPotholeModal } from './components/ReportPotholeModal';
import { ReportDetailModal } from './components/ReportDetailModal';
import { PotholeReport } from './types';
import { Loader2 } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [activeTab, setActiveTab] = useState<string>('default');

  // Modals state
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [selectedReport, setSelectedReport] = useState<PotholeReport | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
          <span className="text-xs font-semibold">Loading RoadSense AI...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return authView === 'login' ? (
      <LoginPage onSwitchToRegister={() => setAuthView('register')} />
    ) : (
      <RegisterPage onSwitchToLogin={() => setAuthView('login')} />
    );
  }

  // Determine default tab based on user role if activeTab is 'default'
  const currentTab =
    activeTab === 'default'
      ? user.role === 'CITIZEN'
        ? 'dashboard'
        : user.role === 'FIELD_WORKER'
        ? 'jobs'
        : user.role === 'AUTHORITY'
        ? 'authority'
        : 'admin-overview'
      : activeTab;

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar onOpenReportModal={() => setIsReportModalOpen(true)} />

      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto">
        <Sidebar
          activeTab={currentTab}
          setActiveTab={setActiveTab}
          onOpenReportModal={() => setIsReportModalOpen(true)}
        />

        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          {currentTab === 'dashboard' && (
            <CitizenDashboard
              key={refreshTrigger}
              onSelectReport={(r) => setSelectedReport(r)}
              onOpenReportModal={() => setIsReportModalOpen(true)}
            />
          )}

          {currentTab === 'authority' && (
            <AuthorityDashboard
              key={refreshTrigger}
              onSelectReport={(r) => setSelectedReport(r)}
            />
          )}

          {currentTab === 'jobs' && (
            <WorkerDashboard
              key={refreshTrigger}
              onSelectReport={(r) => setSelectedReport(r)}
            />
          )}

          {(currentTab === 'admin-overview' || currentTab === 'users' || currentTab === 'analytics' || currentTab === 'audit') && (
            <AdminDashboard key={refreshTrigger} />
          )}

          {currentTab === 'map' && (
            <MapViewPage
              key={refreshTrigger}
              onSelectReport={(r) => setSelectedReport(r)}
            />
          )}
        </main>
      </div>

      {/* Global Modals */}
      <ReportPotholeModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSuccess={handleRefresh}
      />

      <ReportDetailModal
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
        onRefresh={() => {
          handleRefresh();
          setSelectedReport(null);
        }}
      />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}

export default App;

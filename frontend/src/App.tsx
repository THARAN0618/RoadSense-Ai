import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
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
import { PotholeReport, Role } from './types';
import { Loader2 } from 'lucide-react';

const getDefaultPathForRole = (role?: Role): string => {
  switch (role) {
    case 'ADMIN':
      return '/admin';
    case 'AUTHORITY':
      return '/authority';
    case 'FIELD_WORKER':
      return '/jobs';
    case 'CITIZEN':
    default:
      return '/dashboard';
  }
};

const ProtectedLayout: React.FC<{ children: React.ReactNode; allowedRoles?: Role[] }> = ({
  children,
  allowedRoles,
}) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={getDefaultPathForRole(user.role)} replace />;
  }

  return <>{children}</>;
};

const MainAppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

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

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <Routes>
      {/* Unauthenticated Auth Routes */}
      <Route
        path="/login"
        element={
          user ? (
            <Navigate to={getDefaultPathForRole(user.role)} replace />
          ) : (
            <LoginPage onSwitchToRegister={() => navigate('/register')} />
          )
        }
      />
      <Route
        path="/register"
        element={
          user ? (
            <Navigate to={getDefaultPathForRole(user.role)} replace />
          ) : (
            <RegisterPage onSwitchToLogin={() => navigate('/login')} />
          )
        }
      />

      {/* Root Route Redirect */}
      <Route
        path="/"
        element={
          user ? (
            <Navigate to={getDefaultPathForRole(user.role)} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Protected App Layout & Routes */}
      <Route
        path="/*"
        element={
          !user ? (
            <Navigate to="/login" replace />
          ) : (
            <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
              <Navbar onOpenReportModal={() => setIsReportModalOpen(true)} />

              <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto">
                <Sidebar onOpenReportModal={() => setIsReportModalOpen(true)} />

                <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
                  <Routes>
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedLayout allowedRoles={['CITIZEN', 'ADMIN']}>
                          <CitizenDashboard
                            key={refreshTrigger}
                            onSelectReport={(r) => setSelectedReport(r)}
                            onOpenReportModal={() => setIsReportModalOpen(true)}
                          />
                        </ProtectedLayout>
                      }
                    />
                    <Route
                      path="/jobs"
                      element={
                        <ProtectedLayout allowedRoles={['FIELD_WORKER', 'AUTHORITY', 'ADMIN']}>
                          <WorkerDashboard
                            key={refreshTrigger}
                            onSelectReport={(r) => setSelectedReport(r)}
                          />
                        </ProtectedLayout>
                      }
                    />
                    <Route
                      path="/authority"
                      element={
                        <ProtectedLayout allowedRoles={['AUTHORITY', 'ADMIN']}>
                          <AuthorityDashboard
                            key={refreshTrigger}
                            onSelectReport={(r) => setSelectedReport(r)}
                          />
                        </ProtectedLayout>
                      }
                    />
                    <Route
                      path="/admin"
                      element={
                        <ProtectedLayout allowedRoles={['ADMIN']}>
                          <AdminDashboard key={refreshTrigger} />
                        </ProtectedLayout>
                      }
                    />
                    <Route
                      path="/admin/users"
                      element={
                        <ProtectedLayout allowedRoles={['ADMIN']}>
                          <AdminDashboard key={refreshTrigger} />
                        </ProtectedLayout>
                      }
                    />
                    <Route
                      path="/admin/analytics"
                      element={
                        <ProtectedLayout allowedRoles={['ADMIN']}>
                          <AdminDashboard key={refreshTrigger} />
                        </ProtectedLayout>
                      }
                    />
                    <Route
                      path="/admin/audit"
                      element={
                        <ProtectedLayout allowedRoles={['ADMIN']}>
                          <AdminDashboard key={refreshTrigger} />
                        </ProtectedLayout>
                      }
                    />
                    <Route
                      path="/map"
                      element={
                        <ProtectedLayout>
                          <MapViewPage
                            key={refreshTrigger}
                            onSelectReport={(r) => setSelectedReport(r)}
                          />
                        </ProtectedLayout>
                      }
                    />
                    <Route path="*" element={<Navigate to={getDefaultPathForRole(user.role)} replace />} />
                  </Routes>
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
          )
        }
      />
    </Routes>
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

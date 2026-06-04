import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, usePermission, Spinner, color } from '@trello/ui';
import { SYSTEM_ROLES } from './lib/api';
import { Layout } from './components/Layout';
import { RequirePermission, NotAuthorized } from './components/RequirePermission';
import { LoginPage } from './pages/Login';
import { DashboardPage } from './pages/Dashboard';
import { UsersPage } from './pages/Users';
import { WorkspacesPage } from './pages/Workspaces';
import { AuditPage } from './pages/Audit';

export function App() {
  const { user, loading, logout } = useAuth();
  const { hasRole } = usePermission();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: color.offWhite }}>
        <Spinner size={32} />
      </div>
    );
  }
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Gate: a system role is required for the admin console.
  const isAdmin = SYSTEM_ROLES.some(hasRole);
  if (!isAdmin) return <NotAuthorized onLogout={logout} />;

  return (
    <Layout>
      <Routes>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route
          path="/workspaces"
          element={
            <RequirePermission role={['super_admin', 'admin']}>
              <WorkspacesPage />
            </RequirePermission>
          }
        />
        <Route
          path="/audit"
          element={
            <RequirePermission permission="system.view_audit_log" role={['super_admin', 'admin', 'support']}>
              <AuditPage />
            </RequirePermission>
          }
        />
        <Route path="/login" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}

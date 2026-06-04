import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth, Spinner } from '@trello/ui';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Workspaces } from './pages/Workspaces';
import { WorkspaceBoards } from './pages/WorkspaceBoards';
import { BoardView } from './pages/BoardView';
import { NavBar } from './components/NavBar';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return <>{children}</>;
}

function Shell({ children }) {
  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <NavBar />
      <div style={{ flex: 1, minHeight: 0 }}>{children}</div>
    </div>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/"
        element={<ProtectedRoute><Shell><Workspaces /></Shell></ProtectedRoute>}
      />
      <Route
        path="/w/:workspaceId"
        element={<ProtectedRoute><Shell><WorkspaceBoards /></Shell></ProtectedRoute>}
      />
      <Route
        path="/b/:boardId"
        element={<ProtectedRoute><Shell><BoardView /></Shell></ProtectedRoute>}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

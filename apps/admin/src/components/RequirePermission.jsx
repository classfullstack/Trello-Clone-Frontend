import { Navigate } from 'react-router-dom';
import { usePermission, color, space, font } from '@trello/ui';

// Route guard — hides UI and redirects. Backend re-checks every mutation (RBAC.md).
export function RequirePermission({
  permission, role, redirect = '/dashboard', children,
}) {
  const { can, hasRole } = usePermission();

  const permOk = !permission
    || (Array.isArray(permission) ? permission.some(can) : can(permission));
  const roleOk = !role
    || (Array.isArray(role) ? role.some(hasRole) : hasRole(role));

  if (!permOk || !roleOk) return <Navigate to={redirect} replace />;
  return <>{children}</>;
}

// Inline gate — renders fallback (or nothing) instead of redirecting.
export function Can({
  permission, fallback = null, children,
}) {
  const { can } = usePermission();
  const ok = Array.isArray(permission) ? permission.some(can) : can(permission);
  return <>{ok ? children : fallback}</>;
}

export function NotAuthorized({ onLogout }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: space.base,
      alignItems: 'center', justifyContent: 'center', fontFamily: font.text, color: color.navyDeep,
    }}>
      <h1 style={{ fontFamily: font.display, color: color.danger }}>Not authorized</h1>
      <p style={{ color: color.navyLight }}>This account has no admin role.</p>
      <button onClick={onLogout} style={{
        background: color.blue, color: color.white, border: 'none', borderRadius: 5,
        padding: '10px 24px', cursor: 'pointer', fontSize: 15,
      }}>Sign out</button>
    </div>
  );
}

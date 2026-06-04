import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth, color, space, font, radius } from '@trello/ui';

const NAV = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/users', label: 'Users' },
  { to: '/workspaces', label: 'Workspaces' },
  { to: '/audit', label: 'Audit Log' },
];

export function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: font.text }}>
      <aside style={{
        width: 240, background: color.navyDeep, color: color.white,
        display: 'flex', flexDirection: 'column', padding: space.lg, boxSizing: 'border-box',
      }}>
        <div style={{ fontFamily: font.display, fontSize: 20, fontWeight: 600, marginBottom: space.xl }}>
          Trello Admin
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: space.xs }}>
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              style={({ isActive }) => ({
                padding: '10px 14px', borderRadius: radius.base, textDecoration: 'none',
                color: isActive ? color.white : 'rgba(255,255,255,0.7)',
                background: isActive ? color.blue : 'transparent',
                fontSize: 15, fontWeight: isActive ? 600 : 400,
              })}
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: color.offWhite }}>
        <header style={{
          height: 60, background: color.white, borderBottom: `1px solid ${color.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          gap: space.base, padding: `0 ${space.lg}`,
        }}>
          <span style={{ color: color.navyMedium, fontSize: 14 }}>{user?.email}</span>
          <button onClick={onLogout} style={{
            background: 'transparent', border: `1px solid ${color.border}`, color: color.navyMedium,
            borderRadius: radius.base, padding: '6px 14px', cursor: 'pointer', fontSize: 14,
          }}>Logout</button>
        </header>
        <main style={{ flex: 1, padding: space.xl, overflow: 'auto' }}>{children}</main>
      </div>
    </div>
  );
}

export function PageTitle({ title, subtitle, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: space.lg }}>
      <div>
        <h1 style={{ fontFamily: font.display, fontSize: 24, fontWeight: 600, color: color.navyDeep, margin: 0 }}>{title}</h1>
        {subtitle && <p style={{ color: color.navyLight, margin: `${space.xs} 0 0`, fontSize: 14 }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

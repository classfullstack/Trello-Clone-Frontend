import { useNavigate } from 'react-router-dom';
import { Search, Home, User, Settings as SettingsIcon, LogOut } from 'lucide-react';
import {
  useAuth, useToast, ThemeToggle, Avatar, Dropdown, MenuItem, MenuDivider,
  color, font, radius, space,
} from '@trello/ui';
import { meUser } from '../lib/me';
import { NotificationsBell } from './NotificationsBell';

function Logo({ onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: space.sm, border: 'none', background: 'transparent',
      cursor: 'pointer', padding: '4px 8px', borderRadius: radius.base,
    }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
        <span style={{ width: 5, height: 13, background: color.blue, borderRadius: 2 }} />
        <span style={{ width: 5, height: 9, background: color.blue, borderRadius: 2 }} />
      </span>
      <span style={{ fontFamily: font.display, fontSize: 19, fontWeight: 700, color: color.blue, letterSpacing: '-0.5px' }}>
        Trello
      </span>
    </button>
  );
}

export function NavBar() {
  const { user, logout } = useAuth();
  const me = meUser(user);
  const toast = useToast();
  const navigate = useNavigate();

  const onLogout = async () => {
    await logout();
    toast.info('You have been logged out.');
    navigate('/login');
  };

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 500, background: color.surface,
      borderBottom: `1px solid ${color.border}`, padding: '6px 16px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: space.base,
      height: 52, boxSizing: 'border-box',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: space.xs, minWidth: 0 }}>
        <Logo onClick={() => navigate('/')} />
      </div>

      <div style={{
        flex: 1, maxWidth: 360, display: 'flex', alignItems: 'center', gap: space.sm,
        border: `1px solid ${color.border}`, borderRadius: radius.primary, padding: '0 10px',
        background: color.surface,
      }}>
        <Search size={16} aria-hidden style={{ color: color.mediumGray, flexShrink: 0 }} />
        <input
          placeholder="Search"
          style={{
            flex: 1, border: 'none', outline: 'none', height: 34, fontFamily: font.text,
            fontSize: 14, color: color.text, background: 'transparent',
          }}
        />
      </div>

      {me && (
        <div style={{ display: 'flex', alignItems: 'center', gap: space.xs }}>
          <ThemeToggle />
          <NotificationsBell enabled={!!me} />
          <Dropdown
            align="right"
            width={240}
            trigger={
              <button aria-label="Account menu" style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, borderRadius: '50%' }}>
                <Avatar name={me.name} email={me.email} src={me.avatarUrl} size={32} />
              </button>
            }
          >
            <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: space.sm }}>
              <Avatar name={me.name} email={me.email} src={me.avatarUrl} size={36} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: font.text, fontWeight: 600, fontSize: 14, color: color.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {me.name || 'Member'}
                </div>
                <div style={{ fontFamily: font.text, fontSize: 12, color: color.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {me.email}
                </div>
              </div>
            </div>
            <MenuDivider />
            <MenuItem icon={<Home size={16} />} onClick={() => navigate('/')}>Workspaces</MenuItem>
            <MenuItem icon={<User size={16} />} onClick={() => navigate('/profile')}>Profile</MenuItem>
            <MenuItem icon={<SettingsIcon size={16} />} onClick={() => navigate('/settings')}>Settings</MenuItem>
            <MenuDivider />
            <MenuItem icon={<LogOut size={16} />} danger onClick={onLogout}>Log out</MenuItem>
          </Dropdown>
        </div>
      )}
    </header>
  );
}

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, color, font, shadow, space } from '@trello/ui';

export function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const onLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = (user?.name || user?.email || '?').slice(0, 1).toUpperCase();

  return (
    <header
      style={{
        background: color.white,
        borderBottom: `1px solid ${color.lightGray}`,
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Link
        to="/"
        style={{
          fontFamily: font.display,
          fontSize: 20,
          fontWeight: 500,
          color: color.navyDeep,
          textDecoration: 'none',
        }}
      >
        Trello
      </Link>

      {user && (
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setOpen((v) => !v)}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: 'none',
              background: color.blue,
              color: color.white,
              fontWeight: 600,
              cursor: 'pointer',
            }}
            aria-label="User menu"
          >
            {initials}
          </button>
          {open && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: 44,
                minWidth: 200,
                background: color.white,
                border: `1px solid ${color.lightGray}`,
                borderRadius: 4,
                boxShadow: shadow.dropdown,
                zIndex: 100,
              }}
            >
              <div style={{ padding: space.md, borderBottom: `1px solid ${color.lightGray}` }}>
                <div style={{ fontWeight: 600, color: color.navyDeep }}>{user.name || 'Member'}</div>
                <div style={{ fontSize: 13, color: color.navyLight }}>{user.email}</div>
              </div>
              <button
                onClick={onLogout}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '12px 16px',
                  border: 'none',
                  background: 'transparent',
                  color: color.navyDeep,
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                Log out
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

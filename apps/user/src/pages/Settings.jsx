import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, Monitor, Check, AlertTriangle } from 'lucide-react';
import {
  Card, Skeleton, Button, Input, Modal, useTheme, useAuth,
  color, font, space, radius,
} from '@trello/ui';
import { useSettings, useUpdateSettings, useDeleteAccount } from '../lib/userData';

const sectionTitle = { fontFamily: font.display, fontSize: 20, fontWeight: 700, color: color.text, margin: 0 };

const THEMES = [
  { key: 'light', label: 'Light', Icon: Sun },
  { key: 'dark', label: 'Dark', Icon: Moon },
  { key: 'system', label: 'System', Icon: Monitor },
];

const NOTIF_TYPES = [
  { key: 'comments', label: 'Comments', desc: 'New comments on cards you follow.' },
  { key: 'mentions', label: 'Mentions', desc: 'When someone @mentions you.' },
  { key: 'dueSoon', label: 'Due dates', desc: 'Cards with an upcoming due date.' },
  { key: 'assigned', label: 'Assignments', desc: 'When you are added to a card.' },
  { key: 'invites', label: 'Invites', desc: 'Board and workspace invitations.' },
];

const DEFAULT_NOTIFS = {
  inApp: true,
  email: false,
  comments: true,
  mentions: true,
  dueSoon: true,
  assigned: true,
  invites: true,
};

function ThemeOption({ option, active, onClick }) {
  const { Icon } = option;
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1, minWidth: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: space.sm,
        padding: space.base, borderRadius: radius.large, cursor: 'pointer',
        background: active ? color.primaryBadgeBg : color.surface,
        border: `2px solid ${active ? color.blue : color.border}`, color: color.text,
        fontFamily: font.text, fontSize: 14, fontWeight: 600,
      }}
    >
      <Icon size={22} />
      {option.label}
      {active && <Check size={14} style={{ color: color.blue }} />}
    </button>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        width: 40, height: 22, borderRadius: radius.pill, border: 'none', cursor: 'pointer',
        background: checked ? color.blue : color.lightGray, position: 'relative', transition: 'background .15s',
        flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: 2, left: checked ? 20 : 2, width: 18, height: 18,
        borderRadius: '50%', background: '#fff', transition: 'left .15s',
      }} />
    </button>
  );
}

export function Settings() {
  const { theme, setTheme } = useTheme();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const settingsQ = useSettings();
  const updateSettings = useUpdateSettings();
  const deleteAccount = useDeleteAccount();

  const [notifications, setNotifications] = useState(DEFAULT_NOTIFS);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  useEffect(() => {
    const n = settingsQ.data?.notifications;
    if (n) setNotifications((prev) => ({ ...prev, ...n }));
  }, [settingsQ.data]);

  const onPickTheme = (t) => {
    setTheme(t);
    updateSettings.mutate({ theme: t });
  };

  const onToggleNotif = (key, value) => {
    const next = { ...notifications, [key]: value };
    setNotifications(next);
    updateSettings.mutate({ notifications: next });
  };

  const onDelete = () => {
    deleteAccount.mutate(undefined, {
      onSuccess: async () => {
        setDeleteOpen(false);
        await logout();
        navigate('/login');
      },
    });
  };

  const canDelete = confirmText.trim().toUpperCase() === 'DELETE';

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: `${space.xxl} ${space.lg}`, display: 'flex', flexDirection: 'column', gap: space.lg }}>
      <h1 style={{ fontFamily: font.display, fontSize: 28, fontWeight: 700, color: color.text, margin: 0 }}>Settings</h1>

      <Card style={{ display: 'flex', flexDirection: 'column', gap: space.base }}>
        <h2 style={sectionTitle}>Appearance</h2>
        <div style={{ fontFamily: font.text, fontSize: 14, color: color.textMuted }}>
          Choose how Trello looks to you.
        </div>
        <div style={{ display: 'flex', gap: space.sm, flexWrap: 'wrap' }}>
          {THEMES.map((o) => (
            <ThemeOption key={o.key} option={o} active={theme === o.key} onClick={() => onPickTheme(o.key)} />
          ))}
        </div>
      </Card>

      <Card style={{ display: 'flex', flexDirection: 'column', gap: space.base }}>
        <h2 style={sectionTitle}>Notifications</h2>
        {settingsQ.isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: space.base }}>
            <Skeleton width="100%" height={40} />
            <Skeleton width="100%" height={40} />
          </div>
        ) : (
          <>
            <Row label="In-app notifications" desc="Show notifications inside the app.">
              <Toggle checked={!!notifications.inApp} onChange={(v) => onToggleNotif('inApp', v)} />
            </Row>
            <Row label="Email notifications" desc="Receive updates by email.">
              <Toggle checked={!!notifications.email} onChange={(v) => onToggleNotif('email', v)} />
            </Row>
            <div style={{ height: 1, background: color.border, margin: `${space.xs} 0` }} />
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: color.textMuted }}>
              Notify me about
            </div>
            {NOTIF_TYPES.map((t) => (
              <Row key={t.key} label={t.label} desc={t.desc}>
                <Toggle checked={notifications[t.key] !== false} onChange={(v) => onToggleNotif(t.key, v)} />
              </Row>
            ))}
          </>
        )}
      </Card>

      <Card style={{ display: 'flex', flexDirection: 'column', gap: space.base, border: `1px solid ${color.danger}` }}>
        <h2 style={{ ...sectionTitle, color: color.danger }}>Danger zone</h2>
        <Row label="Delete account" desc="Permanently remove your account and all data. This cannot be undone.">
          <Button variant="danger" leftIcon={<AlertTriangle size={15} />} onClick={() => { setConfirmText(''); setDeleteOpen(true); }}>
            Delete account
          </Button>
        </Row>
      </Card>

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete account"
        size="sm"
        footer={<>
          <Button variant="ghost" onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button variant="danger" disabled={!canDelete} loading={deleteAccount.isPending} onClick={onDelete}>
            Delete account
          </Button>
        </>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: space.base }}>
          <div style={{ fontFamily: font.text, fontSize: 14, color: color.text }}>
            This permanently deletes your account and all associated data. This action cannot be undone.
          </div>
          <Input
            label={'Type "DELETE" to confirm'}
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
            autoFocus
          />
        </div>
      </Modal>
    </div>
  );
}

function Row({ label, desc, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: space.base }}>
      <div>
        <div style={{ fontFamily: font.text, fontSize: 14, fontWeight: 600, color: color.text }}>{label}</div>
        <div style={{ fontFamily: font.text, fontSize: 13, color: color.textMuted }}>{desc}</div>
      </div>
      {children}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Sun, Moon, Monitor, Check } from 'lucide-react';
import {
  Card, Skeleton, useTheme,
  color, font, space, radius,
} from '@trello/ui';
import { useSettings, useUpdateSettings } from '../lib/userData';

const sectionTitle = { fontFamily: font.display, fontSize: 20, fontWeight: 700, color: color.text, margin: 0 };

const THEMES = [
  { key: 'light', label: 'Light', Icon: Sun },
  { key: 'dark', label: 'Dark', Icon: Moon },
  { key: 'system', label: 'System', Icon: Monitor },
];

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
  const settingsQ = useSettings();
  const updateSettings = useUpdateSettings();

  const [notifications, setNotifications] = useState({ inApp: true, email: false });

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
          </>
        )}
      </Card>
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

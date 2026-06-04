import {
  Card, useTheme, useToast, color, space, font, radius,
} from '@trello/ui';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useUpdateSettings } from '../lib/settings';
import { PageHeader } from '../components/Layout';

const OPTIONS = [
  { key: 'light', label: 'Light', Icon: Sun },
  { key: 'dark', label: 'Dark', Icon: Moon },
  { key: 'system', label: 'System', Icon: Monitor },
];

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const toast = useToast();
  const updateSettings = useUpdateSettings();

  const choose = (t) => {
    if (t === theme) return;
    setTheme(t);
    updateSettings.mutate({ theme: t }, {
      onSuccess: () => toast.success('Theme saved.'),
      onError: (err) => toast.error(err.response?.data?.message ?? 'Failed to save theme.'),
    });
  };

  return (
    <div>
      <PageHeader title="Settings" subtitle="Customize your console" breadcrumb={['Admin', 'Settings']} />

      <div style={{ maxWidth: 640 }}>
        <Card>
          <h2 style={{ fontFamily: font.display, fontSize: 18, fontWeight: 700, color: color.text, margin: `0 0 ${space.xs}` }}>
            Appearance
          </h2>
          <p style={{ color: color.textMuted, fontSize: 14, margin: `0 0 ${space.base}` }}>
            Choose how the console looks. System follows your OS preference.
          </p>
          <div style={{ display: 'flex', gap: space.base, flexWrap: 'wrap' }}>
            {OPTIONS.map(({ key, label, Icon }) => {
              const selected = theme === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => choose(key)}
                  aria-pressed={selected}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: space.sm,
                    width: 120, padding: space.base, cursor: 'pointer',
                    background: selected ? color.primaryBadgeBg : color.surface,
                    border: `2px solid ${selected ? color.blue : color.border}`,
                    borderRadius: radius.large, color: color.text,
                    fontFamily: font.text, fontSize: 14, fontWeight: 600,
                    transition: 'border-color .12s, background .12s',
                  }}
                >
                  <Icon size={24} color={selected ? color.blue : color.textMuted} />
                  {label}
                </button>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

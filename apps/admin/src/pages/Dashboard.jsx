import { useQuery } from '@tanstack/react-query';
import { Card, Skeleton, color, space, font, radius } from '@trello/ui';
import { api } from '../lib/api';
import { PageHeader } from '../components/Layout';
import { IconUsers, IconActive, IconSuspended, IconWorkspaces, IconBoards, IconStorage } from '../components/icons';

function fmtNum(v) {
  if (v === undefined || v === null) return '—';
  return typeof v === 'number' ? v.toLocaleString() : v;
}

function fmtBytes(bytes) {
  if (bytes === undefined || bytes === null) return '—';
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const val = bytes / 1024 ** i;
  return `${val.toFixed(val >= 100 || i === 0 ? 0 : 1)} ${units[i]}`;
}

const TINTS = {
  blue: { bg: '#E9F2FE', fg: color.blue },
  green: { bg: '#E6F4EA', fg: '#1F6E43' },
  red: { bg: color.errorBg, fg: color.danger },
  purple: { bg: '#F3E8FF', fg: '#7E22CE' },
  cyan: { bg: '#E0F7FB', fg: '#0E7490' },
  gray: { bg: color.offWhite, fg: color.navyMedium },
};

function StatCard({ label, value, Icon, tint = 'blue', loading }) {
  const t = TINTS[tint] ?? TINTS.blue;
  return (
    <Card hoverable style={{ padding: space.lg }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: space.base }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ color: color.navyLight, fontSize: 13, fontFamily: font.text, fontWeight: 500 }}>{label}</div>
          <div style={{ fontFamily: font.display, fontSize: 30, fontWeight: 700, color: color.navyDeep, marginTop: space.sm, lineHeight: 1.1 }}>
            {loading ? <Skeleton width={72} height={30} /> : value}
          </div>
        </div>
        <span style={{
          width: 42, height: 42, borderRadius: radius.large, flexShrink: 0,
          background: t.bg, color: t.fg, display: 'inline-flex',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={22} />
        </span>
      </div>
    </Card>
  );
}

export function DashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => (await api.get('/admin/stats')).data,
  });

  const cards = [
    { label: 'Total users', value: fmtNum(data?.users?.total), Icon: IconUsers, tint: 'blue' },
    { label: 'Active users', value: fmtNum(data?.users?.active), Icon: IconActive, tint: 'green' },
    { label: 'Suspended users', value: fmtNum(data?.users?.suspended), Icon: IconSuspended, tint: 'red' },
    { label: 'Workspaces', value: fmtNum(data?.workspaces?.total), Icon: IconWorkspaces, tint: 'purple' },
    { label: 'Boards', value: fmtNum(data?.boards?.total), Icon: IconBoards, tint: 'cyan' },
    { label: 'Storage used', value: fmtBytes(data?.storage?.bytes), Icon: IconStorage, tint: 'gray' },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="System overview at a glance" breadcrumb={['Admin', 'Dashboard']} />

      {isError && (
        <div style={{
          background: color.errorBg, border: `1px solid ${color.danger}`, color: color.danger,
          borderRadius: radius.base, padding: '10px 14px', fontSize: 14, marginBottom: space.base,
        }}>
          Stats endpoint unavailable — showing placeholders.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: space.base }}>
        {cards.map((c) => (
          <StatCard key={c.label} {...c} loading={isLoading} />
        ))}
      </div>
    </div>
  );
}

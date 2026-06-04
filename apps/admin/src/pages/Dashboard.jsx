import { useQuery } from '@tanstack/react-query';
import { Card, color, space, font } from '@trello/ui';
import { api } from '../lib/api';
import { PageTitle } from '../components/Layout';

function fmt(v) {
  if (v === undefined || v === null) return '—';
  return typeof v === 'number' ? v.toLocaleString() : v;
}

export function DashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => (await api.get('/admin/stats')).data,
  });

  const cards = [
    { label: 'Total users', value: fmt(data?.totalUsers) },
    { label: 'Workspaces', value: fmt(data?.totalWorkspaces) },
    { label: 'Storage used', value: fmt(data?.storageUsed) },
  ];

  return (
    <div>
      <PageTitle title="Dashboard" subtitle="System overview" />
      {isError && (
        <div style={{ color: color.navyLight, fontSize: 14, marginBottom: space.base }}>
          Stats unavailable — showing placeholders.
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: space.base }}>
        {cards.map((c) => (
          <Card key={c.label}>
            <div style={{ color: color.navyLight, fontSize: 13, fontFamily: font.text }}>{c.label}</div>
            <div style={{ fontFamily: font.display, fontSize: 32, fontWeight: 600, color: color.navyDeep, marginTop: space.sm }}>
              {isLoading ? '…' : c.value}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

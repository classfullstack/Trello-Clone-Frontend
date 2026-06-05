import { useQuery } from '@tanstack/react-query';
import { Card, color, space, font, radius } from '@trello/ui';
import { HardDrive, KanbanSquare, User } from 'lucide-react';
import { api } from '../lib/api';
import { PageHeader } from '../components/Layout';
import { Table } from '../components/Table';

function fmtBytes(n) {
  const b = Number(n) || 0;
  if (b < 1024) return `${b} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let v = b / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i += 1; }
  return `${v.toFixed(v >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

function Bar({ value, max }) {
  const pct = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: space.md }}>
      <div style={{ flex: 1, height: 8, background: color.surfaceAlt, borderRadius: 999, overflow: 'hidden', minWidth: 80 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color.blue, borderRadius: 999 }} />
      </div>
      <span style={{ color: color.textMuted, fontSize: 13, whiteSpace: 'nowrap', minWidth: 70, textAlign: 'right' }}>
        {fmtBytes(value)}
      </span>
    </div>
  );
}

export function StoragePage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'storage'],
    queryFn: async () => (await api.get('/admin/storage')).data,
  });

  const totalBytes = data?.totalBytes ?? 0;
  const byWorkspace = data?.byWorkspace ?? [];
  const byUser = data?.byUser ?? [];
  const maxWs = Math.max(1, ...byWorkspace.map((r) => r.bytes));
  const maxUser = Math.max(1, ...byUser.map((r) => r.bytes));

  const wsColumns = [
    { key: 'name', header: 'Workspace', render: (r) => <span style={{ fontWeight: 600, color: color.text }}>{r.name ?? r.workspaceId}</span> },
    { key: 'bytes', header: 'Usage', render: (r) => <Bar value={r.bytes} max={maxWs} /> },
  ];
  const userColumns = [
    { key: 'email', header: 'User', render: (r) => <span style={{ fontWeight: 600, color: color.text }}>{r.email ?? r.userId}</span> },
    { key: 'bytes', header: 'Usage', render: (r) => <Bar value={r.bytes} max={maxUser} /> },
  ];

  return (
    <div>
      <PageHeader title="Storage" subtitle="Attachment usage across the platform" breadcrumb={['Admin', 'Storage']} />

      <Card style={{ marginBottom: space.lg, padding: space.lg }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: space.base }}>
          <span style={{
            width: 48, height: 48, borderRadius: radius.large, flexShrink: 0,
            background: 'rgba(24,104,219,0.12)', color: color.blue,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <HardDrive size={24} />
          </span>
          <div>
            <div style={{ color: color.textMuted, fontSize: 13 }}>Total storage used</div>
            <div style={{ fontFamily: font.display, fontSize: 28, fontWeight: 700, color: color.text }}>
              {isLoading ? '—' : fmtBytes(totalBytes)}
            </div>
          </div>
        </div>
      </Card>

      <div style={{ display: 'grid', gap: space.lg, gridTemplateColumns: '1fr', marginBottom: space.lg }}>
        <div>
          <h2 style={{ fontFamily: font.display, fontSize: 16, fontWeight: 600, color: color.text, display: 'flex', alignItems: 'center', gap: space.sm, marginBottom: space.md }}>
            <KanbanSquare size={18} /> By workspace
          </h2>
          <Table
            columns={wsColumns}
            rows={byWorkspace}
            rowKey={(r) => r.workspaceId}
            loading={isLoading}
            error={isError ? 'Failed to load storage usage.' : null}
            empty="No storage usage"
          />
        </div>
        <div>
          <h2 style={{ fontFamily: font.display, fontSize: 16, fontWeight: 600, color: color.text, display: 'flex', alignItems: 'center', gap: space.sm, marginBottom: space.md }}>
            <User size={18} /> By user
          </h2>
          <Table
            columns={userColumns}
            rows={byUser}
            rowKey={(r) => r.userId}
            loading={isLoading}
            error={isError ? 'Failed to load storage usage.' : null}
            empty="No storage usage"
          />
        </div>
      </div>
    </div>
  );
}

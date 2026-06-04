import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Input, Badge, color, space, font } from '@trello/ui';
import { api } from '../lib/api';
import { PageTitle } from '../components/Layout';
import { Table } from '../components/Table';

const EMPTY = { actor: '', action: '', from: '', to: '' };

function toParams(f) {
  return {
    actor: f.actor || undefined,
    action: f.action || undefined,
    from: f.from || undefined,
    to: f.to || undefined,
  };
}

function toCsv(rows) {
  const head = ['id', 'actor', 'action', 'target', 'decision', 'ip', 'createdAt'];
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = rows.map((r) =>
    [r.id, r.actorEmail ?? r.actor, r.action, r.target, r.decision, r.ip, r.createdAt].map(esc).join(',')
  );
  return [head.join(','), ...lines].join('\n');
}

export function AuditPage() {
  const [draft, setDraft] = useState(EMPTY);
  const [applied, setApplied] = useState(EMPTY);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'audit', applied],
    queryFn: async () => {
      const res = await api.get('/admin/audit', { params: toParams(applied) });
      return Array.isArray(res.data) ? res.data : res.data?.data ?? [];
    },
  });

  const rows = data ?? [];

  const exportCsv = () => {
    const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const field = { display: 'flex', flexDirection: 'column', gap: 4 };
  const labelStyle = { fontSize: 12, color: color.darkGray, fontFamily: font.text };

  const columns = [
    { key: 'createdAt', header: 'Time', render: (r) => r.createdAt ? new Date(r.createdAt).toLocaleString() : '—' },
    { key: 'actor', header: 'Actor', render: (r) => r.actorEmail ?? r.actor ?? '—' },
    { key: 'action', header: 'Action', render: (r) => <span style={{ fontFamily: font.mono, fontSize: 13 }}>{r.action}</span> },
    { key: 'target', header: 'Target', render: (r) => r.target ?? '—' },
    { key: 'decision', header: 'Decision', render: (r) => (
      <Badge kind={r.decision === 'DENY' ? 'error' : 'success'}>{r.decision ?? 'ALLOW'}</Badge>
    ) },
    { key: 'ip', header: 'IP', render: (r) => r.ip ?? '—' },
  ];

  return (
    <div>
      <PageTitle
        title="Audit Log"
        subtitle="Sensitive actions and access decisions"
        action={<Button variant="secondary" onClick={exportCsv} disabled={rows.length === 0}>Export CSV</Button>}
      />

      <div style={{
        display: 'flex', gap: space.base, flexWrap: 'wrap', alignItems: 'flex-end',
        marginBottom: space.base, background: color.white, padding: space.base,
        border: `1px solid ${color.border}`, borderRadius: 8,
      }}>
        <div style={field}>
          <label style={labelStyle}>Actor</label>
          <Input style={{ minHeight: 40, width: 200 }} placeholder="email or id"
            value={draft.actor} onChange={(e) => setDraft({ ...draft, actor: e.target.value })} />
        </div>
        <div style={field}>
          <label style={labelStyle}>Action</label>
          <Input style={{ minHeight: 40, width: 200 }} placeholder="e.g. users.suspend"
            value={draft.action} onChange={(e) => setDraft({ ...draft, action: e.target.value })} />
        </div>
        <div style={field}>
          <label style={labelStyle}>From</label>
          <Input type="date" style={{ minHeight: 40 }}
            value={draft.from} onChange={(e) => setDraft({ ...draft, from: e.target.value })} />
        </div>
        <div style={field}>
          <label style={labelStyle}>To</label>
          <Input type="date" style={{ minHeight: 40 }}
            value={draft.to} onChange={(e) => setDraft({ ...draft, to: e.target.value })} />
        </div>
        <Button onClick={() => setApplied(draft)} style={{ minHeight: 40 }}>Filter</Button>
        <Button variant="ghost" onClick={() => { setDraft(EMPTY); setApplied(EMPTY); }} style={{ minHeight: 40 }}>Reset</Button>
      </div>

      <Table
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        loading={isLoading}
        error={isError ? 'Failed to load audit log (endpoint may not exist yet).' : null}
        empty="No audit entries match."
      />
    </div>
  );
}

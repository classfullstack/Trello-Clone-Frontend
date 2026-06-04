import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Modal, Badge, usePermission, color, space, font } from '@trello/ui';
import { api } from '../lib/api';
import { PageTitle } from '../components/Layout';
import { Table } from '../components/Table';

export function WorkspacesPage() {
  const qc = useQueryClient();
  const { can } = usePermission();
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'workspaces'],
    queryFn: async () => {
      const res = await api.get('/admin/workspaces');
      return Array.isArray(res.data) ? res.data : res.data?.data ?? [];
    },
  });

  const del = useMutation({
    mutationFn: (id) => api.delete(`/admin/workspaces/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'workspaces'] });
      setDeleteTarget(null);
    },
  });

  const canDelete = can('workspaces.delete');

  const columns = [
    { key: 'name', header: 'Workspace', render: (w) => <span style={{ fontWeight: 600 }}>{w.name}</span> },
    { key: 'ownerEmail', header: 'Owner', render: (w) => w.ownerEmail ?? '—' },
    { key: 'memberCount', header: 'Members', render: (w) => <Badge>{w.memberCount ?? 0}</Badge> },
    { key: 'boardCount', header: 'Boards', render: (w) => <Badge>{w.boardCount ?? 0}</Badge> },
    { key: 'actions', header: '', width: 160, render: (w) => (
      <div style={{ display: 'flex', gap: space.sm, justifyContent: 'flex-end' }}>
        {canDelete && (
          <Button variant="danger" style={{ minHeight: 32, padding: '4px 12px', fontSize: 13 }}
            onClick={() => setDeleteTarget(w)}>Delete</Button>
        )}
      </div>
    ) },
  ];

  return (
    <div>
      <PageTitle title="Workspaces" subtitle={data ? `${data.length} total` : undefined} />

      <Table
        columns={columns}
        rows={data ?? []}
        rowKey={(w) => w.id}
        loading={isLoading}
        error={isError ? 'Failed to load workspaces (endpoint may not exist yet).' : null}
        empty="No workspaces found."
      />

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete workspace">
        <p style={{ fontFamily: font.text, color: color.navyMedium }}>
          Permanently delete <strong>{deleteTarget?.name}</strong> and all its boards? This cannot be undone.
        </p>
        {del.isError && <p style={{ color: color.danger }}>Action failed.</p>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: space.sm, marginTop: space.base }}>
          <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" disabled={del.isPending}
            onClick={() => deleteTarget && del.mutate(deleteTarget.id)}>
            {del.isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

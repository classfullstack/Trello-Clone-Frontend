import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Badge, Avatar, IconButton, Dropdown, MenuItem,
  usePermission, useToast, useConfirm, color, space,
} from '@trello/ui';
import { MoreHorizontal, Trash2, FolderX } from 'lucide-react';
import { api } from '../lib/api';
import { PageHeader, SearchInput } from '../components/Layout';
import { Table, Pagination } from '../components/Table';

const PAGE_SIZE = 20;

function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
}

export function WorkspacesPage() {
  const qc = useQueryClient();
  const { can } = usePermission();
  const toast = useToast();
  const confirm = useConfirm();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'workspaces', search, page],
    queryFn: async () => {
      const res = await api.get('/admin/workspaces', {
        params: { search: search || undefined, page, pageSize: PAGE_SIZE },
      });
      return Array.isArray(res.data) ? { data: res.data, total: res.data.length } : res.data;
    },
  });

  const del = useMutation({
    mutationFn: (id) => api.delete(`/admin/workspaces/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'workspaces'] });
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
      toast.success('Workspace deleted.');
    },
    onError: (err) => toast.error(err.response?.data?.message ?? 'Delete failed.'),
  });

  const onDeleteClick = async (w) => {
    const ok = await confirm({
      title: 'Delete workspace',
      message: `Permanently delete ${w.name} and all of its boards? This cannot be undone.`,
      confirmText: 'Delete permanently',
      danger: true,
    });
    if (ok) del.mutate(w.id);
  };

  const canDelete = can('workspaces.delete');

  const columns = [
    {
      key: 'name', header: 'Workspace', render: (w) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: space.md }}>
          <Avatar name={w.name} size={32} style={{ borderRadius: 6 }} />
          <span style={{ fontWeight: 600, color: color.text }}>{w.name}</span>
        </div>
      ),
    },
    { key: 'ownerEmail', header: 'Owner', render: (w) => <span style={{ color: color.textMuted }}>{w.ownerEmail ?? '—'}</span> },
    { key: 'memberCount', header: 'Members', align: 'center', render: (w) => <Badge>{w.memberCount ?? 0}</Badge> },
    { key: 'boardCount', header: 'Boards', align: 'center', render: (w) => <Badge kind="primary">{w.boardCount ?? 0}</Badge> },
    { key: 'createdAt', header: 'Created', render: (w) => <span style={{ color: color.textMuted }}>{fmtDate(w.createdAt)}</span> },
  ];

  if (canDelete) {
    columns.push({
      key: 'actions', header: '', width: 64, align: 'right', render: (w) => (
        <Dropdown align="right" width={180} trigger={<IconButton label="Actions"><MoreHorizontal size={18} /></IconButton>}>
          <MenuItem icon={<Trash2 size={16} />} danger onClick={() => onDeleteClick(w)}>Delete workspace</MenuItem>
        </Dropdown>
      ),
    });
  }

  const total = data?.total ?? 0;

  return (
    <div>
      <PageHeader title="Workspaces" subtitle={total ? `${total.toLocaleString()} total` : 'Manage tenant workspaces'} breadcrumb={['Admin', 'Workspaces']} />

      <div style={{ marginBottom: space.base }}>
        <SearchInput value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search workspaces…" />
      </div>

      <Table
        columns={columns}
        rows={data?.data ?? []}
        rowKey={(w) => w.id}
        loading={isLoading}
        error={isError ? 'Failed to load workspaces. The endpoint may not be available yet.' : null}
        empty="No workspaces found"
        emptyDescription={search ? 'Try a different search term.' : 'Workspaces created by users will appear here.'}
        emptyIcon={<FolderX size={36} />}
      />

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />
    </div>
  );
}

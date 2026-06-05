import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Badge, Avatar, IconButton, Dropdown, MenuItem, Button, Modal, Input, Select,
  usePermission, useToast, useConfirm, color, space, font,
} from '@trello/ui';
import { MoreHorizontal, Trash2, FolderX, Pencil, UserCog, Lock, Unlock } from 'lucide-react';
import { api } from '../lib/api';
import { PageHeader, SearchInput } from '../components/Layout';
import { Table, Pagination } from '../components/Table';

const PAGE_SIZE = 20;

function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
}

export function WorkspacesPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { can } = usePermission();
  const toast = useToast();
  const confirm = useConfirm();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editTarget, setEditTarget] = useState(null);
  const [editName, setEditName] = useState('');
  const [editVisibility, setEditVisibility] = useState('private');
  const [transferTarget, setTransferTarget] = useState(null);
  const [newOwnerId, setNewOwnerId] = useState('');

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

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin', 'workspaces'] });

  const update = useMutation({
    mutationFn: ({ id, body }) => api.patch(`/admin/workspaces/${id}`, body),
    onSuccess: () => { invalidate(); toast.success('Workspace updated.'); setEditTarget(null); },
    onError: (err) => toast.error(err.response?.data?.message ?? 'Update failed.'),
  });

  const transfer = useMutation({
    mutationFn: ({ id, body }) => api.post(`/admin/workspaces/${id}/transfer-owner`, body),
    onSuccess: () => { invalidate(); toast.success('Owner transferred.'); setTransferTarget(null); },
    onError: (err) => toast.error(err.response?.data?.message ?? 'Transfer failed.'),
  });

  const lock = useMutation({
    mutationFn: ({ id, locked }) => api.post(`/admin/workspaces/${id}/lock`, { locked }),
    onSuccess: (_d, v) => { invalidate(); toast.success(v.locked ? 'Workspace locked.' : 'Workspace unlocked.'); },
    onError: (err) => toast.error(err.response?.data?.message ?? 'Action failed.'),
  });

  const onLockClick = async (w) => {
    const locking = !w.isLocked;
    const ok = await confirm({
      title: locking ? 'Lock workspace' : 'Unlock workspace',
      message: locking
        ? `Lock ${w.name}? It will be flagged as locked.`
        : `Unlock ${w.name}?`,
      confirmText: locking ? 'Lock' : 'Unlock',
      danger: locking,
    });
    if (ok) lock.mutate({ id: w.id, locked: locking });
  };

  const openEdit = (w) => {
    setEditTarget(w);
    setEditName(w.name ?? '');
    setEditVisibility(w.visibility ?? 'private');
  };

  const canDelete = can('workspaces.delete');
  const canUpdate = can('workspaces.update');
  const canLock = can('workspaces.lock');
  const hasActions = canDelete || canUpdate || canLock;

  const columns = [
    {
      key: 'name', header: 'Workspace', render: (w) => (
        <div
          onClick={() => navigate(`/workspaces/${w.id}`)}
          style={{ display: 'flex', alignItems: 'center', gap: space.md, cursor: 'pointer' }}
        >
          <Avatar name={w.name} size={32} style={{ borderRadius: 6 }} />
          <span style={{ fontWeight: 600, color: color.blue }}>{w.name}</span>
          {w.isLocked && (
            <span title="Locked" style={{ display: 'inline-flex', color: color.danger }}><Lock size={14} /></span>
          )}
        </div>
      ),
    },
    { key: 'ownerEmail', header: 'Owner', render: (w) => <span style={{ color: color.textMuted }}>{w.ownerEmail ?? '—'}</span> },
    { key: 'visibility', header: 'Visibility', render: (w) => <Badge>{w.visibility ?? '—'}</Badge> },
    { key: 'memberCount', header: 'Members', align: 'center', render: (w) => <Badge>{w.memberCount ?? 0}</Badge> },
    { key: 'boardCount', header: 'Boards', align: 'center', render: (w) => <Badge kind="primary">{w.boardCount ?? 0}</Badge> },
    { key: 'createdAt', header: 'Created', render: (w) => <span style={{ color: color.textMuted }}>{fmtDate(w.createdAt)}</span> },
  ];

  if (hasActions) {
    columns.push({
      key: 'actions', header: '', width: 64, align: 'right', render: (w) => (
        <Dropdown align="right" width={190} trigger={<IconButton label="Actions"><MoreHorizontal size={18} /></IconButton>}>
          {canUpdate && <MenuItem icon={<Pencil size={16} />} onClick={() => openEdit(w)}>Edit</MenuItem>}
          {canUpdate && <MenuItem icon={<UserCog size={16} />} onClick={() => { setTransferTarget(w); setNewOwnerId(''); }}>Transfer owner</MenuItem>}
          {canLock && (
            w.isLocked
              ? <MenuItem icon={<Unlock size={16} />} onClick={() => onLockClick(w)}>Unlock</MenuItem>
              : <MenuItem icon={<Lock size={16} />} onClick={() => onLockClick(w)}>Lock</MenuItem>
          )}
          {canDelete && <MenuItem icon={<Trash2 size={16} />} danger onClick={() => onDeleteClick(w)}>Delete workspace</MenuItem>}
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

      {/* Edit workspace */}
      <Modal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Edit workspace"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button
              loading={update.isPending}
              onClick={() => editTarget && update.mutate({
                id: editTarget.id,
                body: { name: editName.trim(), visibility: editVisibility },
              })}
            >
              Save changes
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: space.base }}>
          <Input label="Name" value={editName} onChange={(e) => setEditName(e.target.value)} />
          <Select label="Visibility" value={editVisibility} onChange={(e) => setEditVisibility(e.target.value)}>
            <option value="private">private</option>
            <option value="workspace">workspace</option>
            <option value="public">public</option>
          </Select>
        </div>
      </Modal>

      {/* Transfer owner */}
      <Modal
        open={!!transferTarget}
        onClose={() => setTransferTarget(null)}
        title="Transfer owner"
        footer={
          <>
            <Button variant="ghost" onClick={() => setTransferTarget(null)}>Cancel</Button>
            <Button
              loading={transfer.isPending}
              disabled={!newOwnerId.trim()}
              onClick={() => transferTarget && transfer.mutate({
                id: transferTarget.id,
                body: { newOwnerId: newOwnerId.trim() },
              })}
            >
              Transfer
            </Button>
          </>
        }
      >
        <p style={{ fontFamily: font.text, color: color.textMuted, marginTop: 0 }}>
          Transfer ownership of <strong>{transferTarget?.name}</strong> to another user.
        </p>
        <Input
          label="New owner user ID"
          placeholder="UUID of the new owner"
          value={newOwnerId}
          onChange={(e) => setNewOwnerId(e.target.value)}
          helper="The new owner is granted the workspace owner role."
        />
      </Modal>
    </div>
  );
}

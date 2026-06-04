import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Input, Badge, Modal, usePermission, color, space, font } from '@trello/ui';
import { api, SYSTEM_ROLES } from '../lib/api';
import { PageTitle } from '../components/Layout';
import { Table } from '../components/Table';

const PAGE_SIZE = 20;

export function UsersPage() {
  const qc = useQueryClient();
  const { can } = usePermission();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [suspendTarget, setSuspendTarget] = useState(null);
  const [roleTarget, setRoleTarget] = useState(null);
  const [roleToAssign, setRoleToAssign] = useState('admin');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'users', search, page],
    queryFn: async () => {
      const res = await api.get('/admin/users', {
        params: { search: search || undefined, page, pageSize: PAGE_SIZE },
      });
      // Tolerate either {data,total} or a bare array.
      return Array.isArray(res.data) ? { data: res.data, total: res.data.length } : res.data;
    },
  });

  const suspend = useMutation({
    mutationFn: (id) => api.post(`/admin/users/${id}/suspend`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      setSuspendTarget(null);
    },
  });

  const assignRole = useMutation({
    mutationFn: (vars) => api.post('/admin/roles/assign', vars),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      setRoleTarget(null);
    },
  });

  const canSuspend = can('users.suspend');
  const canAssign = can('roles.assign');

  const columns = [
    { key: 'email', header: 'Email', render: (u) => (
      <div>
        <div style={{ fontWeight: 600 }}>{u.email}</div>
        {u.name && <div style={{ color: color.navyLight, fontSize: 12 }}>{u.name}</div>}
      </div>
    ) },
    { key: 'roles', header: 'Roles', render: (u) => (
      <div style={{ display: 'flex', gap: space.xs, flexWrap: 'wrap' }}>
        {(u.roles ?? []).length === 0
          ? <Badge>none</Badge>
          : u.roles.map((r) => (
              <Badge key={r} kind={r === 'super_admin' || r === 'admin' ? 'primary' : 'default'}>{r}</Badge>
            ))}
      </div>
    ) },
    { key: 'status', header: 'Status', render: (u) => (
      <Badge kind={u.status === 'suspended' ? 'error' : 'success'}>{u.status ?? 'active'}</Badge>
    ) },
    { key: 'actions', header: '', width: 220, render: (u) => (
      <div style={{ display: 'flex', gap: space.sm, justifyContent: 'flex-end' }}>
        {canAssign && (
          <Button variant="secondary" style={{ minHeight: 32, padding: '4px 12px', fontSize: 13 }}
            onClick={() => { setRoleTarget(u); setRoleToAssign('admin'); }}>
            Assign role
          </Button>
        )}
        {canSuspend && u.status !== 'suspended' && (
          <Button variant="danger" style={{ minHeight: 32, padding: '4px 12px', fontSize: 13 }}
            onClick={() => setSuspendTarget(u)}>
            Suspend
          </Button>
        )}
      </div>
    ) },
  ];

  const total = data?.total ?? 0;
  const maxPage = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <PageTitle title="Users" subtitle={total ? `${total} total` : undefined} />

      <div style={{ marginBottom: space.base, maxWidth: 320 }}>
        <Input placeholder="Search by email or name…" value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      </div>

      <Table
        columns={columns}
        rows={data?.data ?? []}
        rowKey={(u) => u.id}
        loading={isLoading}
        error={isError ? 'Failed to load users (endpoint may not exist yet).' : null}
        empty="No users found."
      />

      {total > PAGE_SIZE && (
        <div style={{ display: 'flex', alignItems: 'center', gap: space.base, marginTop: space.base, fontFamily: font.text, fontSize: 14, color: color.navyMedium }}>
          <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
            style={{ minHeight: 32, padding: '4px 12px' }}>Prev</Button>
          <span>Page {page} / {maxPage}</span>
          <Button variant="secondary" disabled={page >= maxPage} onClick={() => setPage((p) => p + 1)}
            style={{ minHeight: 32, padding: '4px 12px' }}>Next</Button>
        </div>
      )}

      <Modal open={!!suspendTarget} onClose={() => setSuspendTarget(null)} title="Suspend user">
        <p style={{ fontFamily: font.text, color: color.navyMedium }}>
          Suspend <strong>{suspendTarget?.email}</strong>? They lose access immediately.
        </p>
        {suspend.isError && <p style={{ color: color.danger }}>Action failed.</p>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: space.sm, marginTop: space.base }}>
          <Button variant="ghost" onClick={() => setSuspendTarget(null)}>Cancel</Button>
          <Button variant="danger" disabled={suspend.isPending}
            onClick={() => suspendTarget && suspend.mutate(suspendTarget.id)}>
            {suspend.isPending ? 'Suspending…' : 'Suspend'}
          </Button>
        </div>
      </Modal>

      <Modal open={!!roleTarget} onClose={() => setRoleTarget(null)} title="Assign role">
        <p style={{ fontFamily: font.text, color: color.navyMedium }}>
          Assign a system role to <strong>{roleTarget?.email}</strong>.
        </p>
        <select value={roleToAssign} onChange={(e) => setRoleToAssign(e.target.value)}
          style={{ width: '100%', padding: 10, borderRadius: 5, border: `1px solid ${color.border}`, fontSize: 15, fontFamily: font.text }}>
          {SYSTEM_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        {(roleToAssign === 'super_admin' || roleToAssign === 'admin') && (
          <p style={{ color: color.danger, fontSize: 13, marginTop: space.sm }}>
            Warning: this grants elevated privileges.
          </p>
        )}
        {assignRole.isError && <p style={{ color: color.danger }}>Action failed.</p>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: space.sm, marginTop: space.base }}>
          <Button variant="ghost" onClick={() => setRoleTarget(null)}>Cancel</Button>
          <Button disabled={assignRole.isPending}
            onClick={() => roleTarget && assignRole.mutate({ userId: roleTarget.id, role: roleToAssign })}>
            {assignRole.isPending ? 'Assigning…' : 'Assign'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

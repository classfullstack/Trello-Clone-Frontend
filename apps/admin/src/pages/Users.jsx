import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Button, Badge, Modal, Select, Input, Avatar, Dropdown, MenuItem, IconButton,
  usePermission, useToast, color, space, font,
} from '@trello/ui';
import { api, SYSTEM_ROLES } from '../lib/api';
import { PageHeader, SearchInput } from '../components/Layout';
import { Table, Pagination } from '../components/Table';

const PAGE_SIZE = 20;
const ELEVATED = new Set(['super_admin', 'admin']);

function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
}

export function UsersPage() {
  const qc = useQueryClient();
  const { can } = usePermission();
  const toast = useToast();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [suspendTarget, setSuspendTarget] = useState(null);
  const [roleTarget, setRoleTarget] = useState(null);
  const [roleKey, setRoleKey] = useState('admin');
  const [tenantId, setTenantId] = useState('');

  // debounce-ish: commit search on submit / enter
  const onSearchChange = (e) => {
    setSearchInput(e.target.value);
    setPage(1);
    setSearch(e.target.value);
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'users', search, page],
    queryFn: async () => {
      const res = await api.get('/admin/users', {
        params: { search: search || undefined, page, pageSize: PAGE_SIZE },
      });
      return Array.isArray(res.data) ? { data: res.data, total: res.data.length } : res.data;
    },
  });

  const suspend = useMutation({
    mutationFn: ({ id, suspend: s }) => api.post(`/admin/users/${id}/suspend`, { suspend: s }),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
      toast.success(vars.suspend ? 'User suspended.' : 'User reinstated.');
      setSuspendTarget(null);
    },
    onError: (err) => toast.error(err.response?.data?.message ?? 'Action failed.'),
  });

  const assignRole = useMutation({
    mutationFn: (vars) => api.post('/admin/roles/assign', vars),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('Role assigned.');
      setRoleTarget(null);
    },
    onError: (err) => toast.error(err.response?.data?.message ?? 'Action failed.'),
  });

  const canSuspend = can('users.suspend');
  const canAssign = can('roles.assign');
  const hasActions = canSuspend || canAssign;

  const isActive = (u) => u.isActive !== false;

  const columns = [
    {
      key: 'email', header: 'User', render: (u) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: space.md }}>
          <Avatar name={u.name} email={u.email} size={32} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, color: color.navyDeep }}>{u.name || u.email}</div>
            {u.name && <div style={{ color: color.navyLight, fontSize: 12 }}>{u.email}</div>}
          </div>
        </div>
      ),
    },
    {
      key: 'roles', header: 'Roles', render: (u) => (
        <div style={{ display: 'flex', gap: space.xs, flexWrap: 'wrap' }}>
          {(u.roles ?? []).length === 0
            ? <span style={{ color: color.mediumGray, fontSize: 13 }}>none</span>
            : u.roles.map((r) => (
              <Badge key={r} kind={ELEVATED.has(r) ? 'primary' : 'default'}>{r}</Badge>
            ))}
        </div>
      ),
    },
    {
      key: 'status', header: 'Status', render: (u) => (
        <Badge kind={isActive(u) ? 'success' : 'error'}>{isActive(u) ? 'Active' : 'Suspended'}</Badge>
      ),
    },
    { key: 'createdAt', header: 'Joined', render: (u) => <span style={{ color: color.navyLight }}>{fmtDate(u.createdAt)}</span> },
  ];

  if (hasActions) {
    columns.push({
      key: 'actions', header: '', width: 64, align: 'right', render: (u) => (
        <Dropdown align="right" width={200} trigger={
          <IconButton label="Actions">⋯</IconButton>
        }>
          {canAssign && (
            <MenuItem icon="🛡️" onClick={() => { setRoleTarget(u); setRoleKey('admin'); setTenantId(''); }}>
              Assign role
            </MenuItem>
          )}
          {canSuspend && (
            isActive(u)
              ? <MenuItem icon="⛔" danger onClick={() => setSuspendTarget({ user: u, suspend: true })}>Suspend user</MenuItem>
              : <MenuItem icon="✓" onClick={() => setSuspendTarget({ user: u, suspend: false })}>Reinstate user</MenuItem>
          )}
        </Dropdown>
      ),
    });
  }

  const total = data?.total ?? 0;
  const suspending = suspendTarget?.suspend;

  return (
    <div>
      <PageHeader title="Users" subtitle={total ? `${total.toLocaleString()} total` : 'Manage accounts and roles'} breadcrumb={['Admin', 'Users']} />

      <div style={{ marginBottom: space.base, display: 'flex', gap: space.base, flexWrap: 'wrap' }}>
        <SearchInput value={searchInput} onChange={onSearchChange} placeholder="Search by email or name…" />
      </div>

      <Table
        columns={columns}
        rows={data?.data ?? []}
        rowKey={(u) => u.id}
        loading={isLoading}
        error={isError ? 'Failed to load users. The endpoint may not be available yet.' : null}
        empty="No users found"
        emptyDescription={search ? 'Try a different search term.' : 'Users will appear here once they sign up.'}
        emptyIcon="👤"
      />

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />

      {/* Suspend / reinstate confirm */}
      <Modal
        open={!!suspendTarget}
        onClose={() => setSuspendTarget(null)}
        title={suspending ? 'Suspend user' : 'Reinstate user'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setSuspendTarget(null)}>Cancel</Button>
            <Button
              variant={suspending ? 'danger' : 'primary'}
              loading={suspend.isPending}
              onClick={() => suspendTarget && suspend.mutate({ id: suspendTarget.user.id, suspend: suspendTarget.suspend })}
            >
              {suspending ? 'Suspend' : 'Reinstate'}
            </Button>
          </>
        }
      >
        <p style={{ fontFamily: font.text, color: color.navyMedium, margin: 0 }}>
          {suspending
            ? <>Suspend <strong>{suspendTarget?.user.email}</strong>? They lose access immediately.</>
            : <>Reinstate <strong>{suspendTarget?.user.email}</strong>? Access will be restored.</>}
        </p>
      </Modal>

      {/* Assign role */}
      <Modal
        open={!!roleTarget}
        onClose={() => setRoleTarget(null)}
        title="Assign role"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRoleTarget(null)}>Cancel</Button>
            <Button
              loading={assignRole.isPending}
              onClick={() => roleTarget && assignRole.mutate({
                userId: roleTarget.id, roleKey, tenantId: tenantId.trim() || undefined,
              })}
            >
              Assign role
            </Button>
          </>
        }
      >
        <p style={{ fontFamily: font.text, color: color.navyMedium, marginTop: 0 }}>
          Assign a role to <strong>{roleTarget?.email}</strong>.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: space.base }}>
          <Select label="Role" value={roleKey} onChange={(e) => setRoleKey(e.target.value)}>
            {SYSTEM_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </Select>
          <Input
            label="Tenant ID (optional)"
            placeholder="Workspace / tenant scope — leave blank for global"
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            helper="Scopes the role to a workspace. Omit for a system-wide role."
          />
          {ELEVATED.has(roleKey) && (
            <div style={{
              background: color.errorBg, border: `1px solid ${color.danger}`, color: color.danger,
              borderRadius: 4, padding: '8px 12px', fontSize: 13,
            }}>
              Warning: this grants elevated administrative privileges.
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

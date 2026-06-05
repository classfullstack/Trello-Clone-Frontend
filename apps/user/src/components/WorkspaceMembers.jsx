import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus } from 'lucide-react';
import { Modal, Button, Input, Select, Avatar, Badge, Spinner, useToast, color, space } from '@trello/ui';
import { api } from '../lib/api';

const ROLES = [
  { value: 'ws_admin', label: 'Admin' },
  { value: 'ws_member', label: 'Member' },
  { value: 'ws_guest', label: 'Guest' },
];

export function WorkspaceMembers({ workspaceId, open, onClose }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('ws_member');

  const membersQ = useQuery({
    queryKey: ['ws-members', workspaceId],
    queryFn: async () => {
      const r = await api.get(`/workspaces/${workspaceId}/members`);
      return Array.isArray(r.data) ? r.data : r.data?.items ?? [];
    },
    enabled: !!workspaceId && open,
  });

  const invite = useMutation({
    mutationFn: ({ email, role }) => api.post(`/workspaces/${workspaceId}/members`, { email, role }),
    onSuccess: () => {
      toast.success('Member invited.');
      setEmail('');
      qc.invalidateQueries({ queryKey: ['ws-members', workspaceId] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Could not invite. Check the email exists.'),
  });

  const onInvite = (e) => {
    e.preventDefault();
    const v = email.trim();
    if (v) invite.mutate({ email: v, role });
  };

  const members = membersQ.data ?? [];

  return (
    <Modal open={open} onClose={onClose} title="Workspace members" size="md">
      <form onSubmit={onInvite} style={{ display: 'flex', gap: space.sm, marginBottom: space.lg, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <Input label="Invite by email" type="email" placeholder="person@example.com"
            value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div style={{ width: 130 }}>
          <Select label="Role" value={role} onChange={(e) => setRole(e.target.value)}>
            {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </Select>
        </div>
        <Button type="submit" leftIcon={<UserPlus size={15} />} loading={invite.isPending} disabled={!email.trim()}>Invite</Button>
      </form>

      <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: color.textMuted, marginBottom: space.sm }}>
        Members ({members.length})
      </div>
      {membersQ.isLoading && <Spinner size={18} />}
      <div style={{ display: 'flex', flexDirection: 'column', gap: space.sm }}>
        {members.map((m) => (
          <div key={m.userId || m.id} style={{ display: 'flex', alignItems: 'center', gap: space.sm }}>
            <Avatar name={m.name} email={m.email} src={m.avatarUrl} size={32} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, color: color.text, fontWeight: 500 }}>{m.name || m.email}</div>
              <div style={{ fontSize: 12, color: color.textMuted }}>{m.email}</div>
            </div>
            <Badge kind={m.role === 'ws_owner' ? 'primary' : 'default'}>{(m.role || 'member').replace('ws_', '')}</Badge>
          </div>
        ))}
        {!membersQ.isLoading && members.length === 0 && (
          <div style={{ fontSize: 13, color: color.textMuted }}>No members yet.</div>
        )}
      </div>
    </Modal>
  );
}

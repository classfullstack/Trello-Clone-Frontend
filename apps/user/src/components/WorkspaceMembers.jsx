import { useState, useEffect, useRef, useId } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Search } from 'lucide-react';
import {
  Modal, Button, Select, Avatar, Badge, Spinner, useToast,
  color, font, space, radius, shadow, focusRing,
} from '@trello/ui';
import { api } from '../lib/api';

const ROLES = [
  { value: 'ws_admin', label: 'Admin' },
  { value: 'ws_member', label: 'Member' },
  { value: 'ws_guest', label: 'Guest' },
];

function useUserSearch(term) {
  const [debounced, setDebounced] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebounced(term.trim()), 250);
    return () => clearTimeout(t);
  }, [term]);

  return useQuery({
    queryKey: ['user-search', debounced],
    queryFn: async () => {
      const r = await api.get('/users/search', { params: { q: debounced } });
      return Array.isArray(r.data) ? r.data : r.data?.items ?? [];
    },
    enabled: debounced.length >= 1,
    staleTime: 30_000,
  });
}

function InviteCombobox({ email, setEmail }) {
  const listboxId = useId();
  const ref = useRef(null);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const searchQ = useUserSearch(email);
  const results = searchQ.data ?? [];

  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  useEffect(() => { setHighlight(-1); }, [results]);

  const pick = (u) => {
    setEmail(u.email || '');
    setOpen(false);
    setHighlight(-1);
  };

  const onKeyDown = (e) => {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => (h + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => (h - 1 + results.length) % results.length);
    } else if (e.key === 'Enter' && highlight >= 0) {
      e.preventDefault();
      pick(results[highlight]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const borderColor = focused ? color.blue : color.border;
  const showMenu = open && email.trim().length >= 1;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <label htmlFor={`${listboxId}-input`}
        style={{ display: 'block', fontFamily: font.text, fontSize: 13, fontWeight: 600, color: color.darkGray, marginBottom: space.xs }}>
        Invite by email
      </label>
      <div style={{
        display: 'flex', alignItems: 'center', gap: space.sm, minHeight: 44,
        border: `1px solid ${borderColor}`, borderRadius: radius.primary, padding: '0 12px',
        background: color.surface, boxShadow: focused ? focusRing : 'none',
        transition: 'border-color .12s, box-shadow .12s',
      }}>
        <Search size={16} aria-hidden style={{ color: color.mediumGray, flexShrink: 0 }} />
        <input
          id={`${listboxId}-input`}
          type="email"
          placeholder="Search people or type an email…"
          value={email}
          role="combobox"
          aria-expanded={showMenu}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={highlight >= 0 ? `${listboxId}-opt-${highlight}` : undefined}
          autoComplete="off"
          onChange={(e) => { setEmail(e.target.value); setOpen(true); }}
          onFocus={() => { setFocused(true); setOpen(true); }}
          onBlur={() => setFocused(false)}
          onKeyDown={onKeyDown}
          style={{
            flex: 1, border: 'none', outline: 'none', height: 42, fontFamily: font.text,
            fontSize: 15, color: color.text, background: 'transparent',
          }}
        />
        {searchQ.isFetching && <Spinner size={16} />}
      </div>

      {showMenu && (
        <div
          id={listboxId}
          role="listbox"
          style={{
            position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 50,
            background: color.surface, border: `1px solid ${color.border}`, borderRadius: radius.large,
            boxShadow: shadow.dropdown, padding: space.xs, maxHeight: 280, overflowY: 'auto',
          }}
        >
          {searchQ.isLoading && (
            <div style={{ padding: 12, display: 'flex', justifyContent: 'center' }}><Spinner size={18} /></div>
          )}
          {!searchQ.isLoading && results.length === 0 && (
            <div style={{ padding: '10px 12px', fontSize: 14, color: color.textMuted }}>
              No matches. Press Invite to send to this email.
            </div>
          )}
          {results.map((u, i) => (
            <button
              key={u.id}
              id={`${listboxId}-opt-${i}`}
              type="button"
              role="option"
              aria-selected={i === highlight}
              onMouseEnter={() => setHighlight(i)}
              onMouseDown={(e) => { e.preventDefault(); pick(u); }}
              style={{
                display: 'flex', alignItems: 'center', gap: space.sm, width: '100%', textAlign: 'left',
                border: 'none', cursor: 'pointer', borderRadius: radius.base, padding: '8px 10px',
                background: i === highlight ? color.surfaceAlt : 'transparent', color: color.text,
              }}
            >
              <Avatar name={u.name} email={u.email} src={u.avatarUrl} size={32} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: font.text, fontSize: 14, fontWeight: 600, color: color.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {u.name || u.email}
                </div>
                <div style={{ fontFamily: font.text, fontSize: 12, color: color.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {u.email}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

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
      <form onSubmit={onInvite} style={{ display: 'flex', gap: space.md, marginBottom: space.lg, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <InviteCombobox email={email} setEmail={setEmail} />
        </div>
        <div style={{ width: 140 }}>
          <Select label="Role" value={role} onChange={(e) => setRole(e.target.value)}>
            {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </Select>
        </div>
        <Button type="submit" leftIcon={<UserPlus size={16} />} loading={invite.isPending} disabled={!email.trim()}>Invite</Button>
      </form>

      <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: color.textMuted, marginBottom: space.sm }}>
        Members ({members.length})
      </div>
      {membersQ.isLoading && <Spinner size={18} />}
      <div style={{ display: 'flex', flexDirection: 'column', gap: space.md }}>
        {members.map((m) => (
          <div key={m.userId || m.id} style={{ display: 'flex', alignItems: 'center', gap: space.md }}>
            <Avatar name={m.name} email={m.email} src={m.avatarUrl} size={36} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, color: color.text, fontWeight: 600 }}>{m.name || m.email}</div>
              <div style={{ fontSize: 13, color: color.textMuted }}>{m.email}</div>
            </div>
            <Badge kind={m.role === 'ws_owner' ? 'primary' : 'default'}>{(m.role || 'member').replace('ws_', '')}</Badge>
          </div>
        ))}
        {!membersQ.isLoading && members.length === 0 && (
          <div style={{ fontSize: 14, color: color.textMuted }}>No members yet.</div>
        )}
      </div>
    </Modal>
  );
}

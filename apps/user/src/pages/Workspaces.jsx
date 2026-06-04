import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Button, Input, Modal, Card, Avatar, Spinner, Skeleton, EmptyState, useToast,
  color, font, space, radius, shadow, boardBackgrounds,
} from '@trello/ui';
import { api } from '../lib/api';

async function fetchWorkspaces() {
  const res = await api.get('/workspaces');
  return Array.isArray(res.data) ? res.data : res.data?.items ?? res.data?.data ?? [];
}

export function Workspaces() {
  const qc = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');

  const { data, isLoading, isError } = useQuery({ queryKey: ['workspaces'], queryFn: fetchWorkspaces });

  const create = useMutation({
    mutationFn: (n) => api.post('/workspaces', { name: n }),
    onSuccess: () => {
      setName(''); setOpen(false);
      toast.success('Workspace created.');
      qc.invalidateQueries({ queryKey: ['workspaces'] });
    },
    onError: () => toast.error('Could not create workspace.'),
  });

  const submit = (e) => {
    e.preventDefault();
    if (name.trim()) create.mutate(name.trim());
  };

  const workspaces = data ?? [];

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: `${space.xl} ${space.base}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: space.base, marginBottom: space.lg }}>
        <div>
          <h1 style={{ fontFamily: font.display, fontSize: 28, fontWeight: 700, color: color.navyDeep, margin: 0 }}>
            Your Workspaces
          </h1>
          <p style={{ fontFamily: font.text, fontSize: 14, color: color.navyLight, margin: `${space.xs} 0 0` }}>
            Group boards by team or project.
          </p>
        </div>
        <Button leftIcon="+" onClick={() => setOpen(true)}>Create workspace</Button>
      </div>

      {isLoading && (
        <div style={gridStyle}>
          {[0, 1, 2].map((i) => <Skeleton key={i} height={120} radius={radius.large} />)}
        </div>
      )}

      {isError && (
        <EmptyState icon="⚠️" title="Could not load workspaces"
          description="The backend may be offline. Try again in a moment."
          action={<Button variant="secondary" onClick={() => qc.invalidateQueries({ queryKey: ['workspaces'] })}>Retry</Button>} />
      )}

      {!isLoading && !isError && workspaces.length === 0 && (
        <Card style={{ padding: 0 }}>
          <EmptyState icon="🗂️" title="No workspaces yet"
            description="Create your first workspace to start organizing boards."
            action={<Button leftIcon="+" onClick={() => setOpen(true)}>Create workspace</Button>} />
        </Card>
      )}

      {!isLoading && !isError && workspaces.length > 0 && (
        <div style={gridStyle}>
          {workspaces.map((w, i) => (
            <WorkspaceCard key={w.id} ws={w} grad={boardBackgrounds[i % boardBackgrounds.length]}
              onClick={() => navigate(`/w/${w.id}`)} />
          ))}
        </div>
      )}

      <Modal
        open={open} onClose={() => setOpen(false)} title="Create workspace" size="sm"
        footer={<>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} loading={create.isPending} disabled={!name.trim()}>Create</Button>
        </>}
      >
        <form onSubmit={submit}>
          <Input label="Workspace name" autoFocus placeholder="e.g. Marketing Team"
            value={name} onChange={(e) => setName(e.target.value)} />
        </form>
      </Modal>
    </div>
  );
}

const gridStyle = {
  display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: space.base,
};

function WorkspaceCard({ ws, grad, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        textAlign: 'left', padding: 0, cursor: 'pointer', borderRadius: radius.large,
        overflow: 'hidden', background: color.white, boxShadow: hover ? shadow.hover : shadow.subtle,
        transform: hover ? 'translateY(-2px)' : 'none', transition: 'box-shadow .15s, transform .15s',
        border: `1px solid ${color.border}`,
      }}
    >
      <div style={{ height: 72, background: grad }} />
      <div style={{ padding: space.base, display: 'flex', alignItems: 'center', gap: space.md }}>
        <Avatar name={ws.name} size={40} style={{ borderRadius: radius.large, marginTop: -36, border: `3px solid ${color.white}` }} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: font.display, fontSize: 16, fontWeight: 600, color: color.navyDeep, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {ws.name}
          </div>
          <div style={{ fontFamily: font.text, fontSize: 13, color: color.navyLight }}>
            {ws.boardCount != null ? `${ws.boardCount} board${ws.boardCount === 1 ? '' : 's'}` : 'Open boards'}
            {ws.role ? ` · ${ws.role}` : ''}
          </div>
        </div>
      </div>
    </button>
  );
}

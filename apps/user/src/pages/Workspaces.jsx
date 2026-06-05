import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, MoreHorizontal, Pencil, Trash2, FolderKanban, AlertTriangle } from 'lucide-react';
import {
  Button, Input, Modal, Card, Avatar, Skeleton, EmptyState, IconButton,
  Dropdown, MenuItem, useConfirm,
  color, font, space, radius, shadow, boardBackgrounds,
} from '@trello/ui';
import { api } from '../lib/api';
import { useCreateWorkspace, useRenameWorkspace, useDeleteWorkspace } from '../lib/wsData';

async function fetchWorkspaces() {
  const res = await api.get('/workspaces');
  return Array.isArray(res.data) ? res.data : res.data?.items ?? res.data?.data ?? [];
}

export function Workspaces() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [editing, setEditing] = useState(null); // { id, name }

  const { data, isLoading, isError } = useQuery({ queryKey: ['workspaces'], queryFn: fetchWorkspaces });

  const create = useCreateWorkspace();
  const rename = useRenameWorkspace();
  const remove = useDeleteWorkspace();

  const submitCreate = (e) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    create.mutate(n, { onSuccess: () => { setName(''); setOpen(false); } });
  };

  const submitRename = (e) => {
    e.preventDefault();
    const n = editing?.name.trim();
    if (!n) return;
    rename.mutate({ id: editing.id, name: n }, { onSuccess: () => setEditing(null) });
  };

  const onDelete = async (ws) => {
    const ok = await confirm({
      title: 'Delete workspace?',
      message: `"${ws.name}" and its boards will be removed. This cannot be undone.`,
      confirmText: 'Delete', danger: true,
    });
    if (ok) remove.mutate(ws.id);
  };

  const workspaces = data ?? [];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: `${space.xxl} ${space.lg}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: space.base, marginBottom: space.xl }}>
        <div>
          <h1 style={{ fontFamily: font.display, fontSize: 34, fontWeight: 800, color: color.text, margin: 0, letterSpacing: '-0.5px' }}>
            Your Workspaces
          </h1>
          <p style={{ fontFamily: font.text, fontSize: 16, color: color.textMuted, margin: `${space.sm} 0 0` }}>
            Group boards by team or project.
          </p>
        </div>
        <Button leftIcon={<Plus size={16} />} onClick={() => setOpen(true)}>Create workspace</Button>
      </div>

      {isLoading && (
        <div style={gridStyle}>
          {[0, 1, 2].map((i) => <Skeleton key={i} height={120} radius={radius.large} />)}
        </div>
      )}

      {isError && (
        <EmptyState icon={<AlertTriangle size={36} />} title="Could not load workspaces"
          description="The backend may be offline. Try again in a moment."
          action={<Button variant="secondary" onClick={() => qc.invalidateQueries({ queryKey: ['workspaces'] })}>Retry</Button>} />
      )}

      {!isLoading && !isError && workspaces.length === 0 && (
        <Card style={{ padding: 0 }}>
          <EmptyState icon={<FolderKanban size={36} />} title="No workspaces yet"
            description="Create your first workspace to start organizing boards."
            action={<Button leftIcon={<Plus size={16} />} onClick={() => setOpen(true)}>Create workspace</Button>} />
        </Card>
      )}

      {!isLoading && !isError && workspaces.length > 0 && (
        <div style={gridStyle}>
          {workspaces.map((w, i) => (
            <WorkspaceCard key={w.id} ws={w} grad={boardBackgrounds[i % boardBackgrounds.length]}
              onOpen={() => navigate(`/w/${w.id}`)}
              onRename={() => setEditing({ id: w.id, name: w.name })}
              onDelete={() => onDelete(w)} />
          ))}
        </div>
      )}

      <Modal
        open={open} onClose={() => setOpen(false)} title="Create workspace" size="sm"
        footer={<>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submitCreate} loading={create.isPending} disabled={!name.trim()}>Create</Button>
        </>}
      >
        <form onSubmit={submitCreate}>
          <Input label="Workspace name" autoFocus placeholder="e.g. Marketing Team"
            value={name} onChange={(e) => setName(e.target.value)} />
        </form>
      </Modal>

      <Modal
        open={!!editing} onClose={() => setEditing(null)} title="Rename workspace" size="sm"
        footer={<>
          <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
          <Button onClick={submitRename} loading={rename.isPending} disabled={!editing?.name.trim()}>Save</Button>
        </>}
      >
        <form onSubmit={submitRename}>
          <Input label="Workspace name" autoFocus value={editing?.name ?? ''}
            onChange={(e) => setEditing((s) => ({ ...s, name: e.target.value }))} />
        </form>
      </Modal>
    </div>
  );
}

const gridStyle = {
  display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: space.lg,
};

function WorkspaceCard({ ws, grad, onOpen, onRename, onDelete }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative', borderRadius: radius.large, overflow: 'hidden',
        background: color.surface, boxShadow: hover ? shadow.hover : shadow.subtle,
        transform: hover ? 'translateY(-2px)' : 'none', transition: 'box-shadow .15s, transform .15s',
        border: `1px solid ${color.border}`,
      }}
    >
      <button
        onClick={onOpen}
        style={{ display: 'block', width: '100%', textAlign: 'left', padding: 0, cursor: 'pointer', border: 'none', background: 'transparent' }}
      >
        <div style={{ height: 88, background: grad }} />
        <div style={{ padding: space.lg, display: 'flex', alignItems: 'center', gap: space.md }}>
          <Avatar name={ws.name} size={52} style={{ borderRadius: radius.large, marginTop: -44, border: `3px solid ${color.surface}` }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: font.display, fontSize: 18, fontWeight: 700, color: color.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {ws.name}
            </div>
            <div style={{ fontFamily: font.text, fontSize: 14, color: color.textMuted }}>
              {ws.boardCount != null ? `${ws.boardCount} board${ws.boardCount === 1 ? '' : 's'}` : 'Open boards'}
              {ws.role ? ` · ${ws.role}` : ''}
            </div>
          </div>
        </div>
      </button>

      <div style={{ position: 'absolute', top: 8, right: 8 }}>
        <Dropdown
          align="right"
          width={180}
          trigger={
            <IconButton label="Workspace actions" style={{ background: 'rgba(0,0,0,0.28)', color: '#fff' }}>
              <MoreHorizontal size={18} />
            </IconButton>
          }
        >
          <MenuItem icon={<Pencil size={16} />} onClick={onRename}>Rename</MenuItem>
          <MenuItem icon={<Trash2 size={16} />} danger onClick={onDelete}>Delete</MenuItem>
        </Dropdown>
      </div>
    </div>
  );
}

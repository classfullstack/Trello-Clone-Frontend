import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, Plus, MoreHorizontal, Pencil, Trash2, Archive, ArchiveRestore, Image, AlertTriangle, LayoutGrid, Star, Users,
} from 'lucide-react';
import {
  Button, Input, Modal, Skeleton, EmptyState, IconButton, Dropdown, MenuItem, useConfirm,
  color, font, space, shadow, radius, boardBackgrounds,
} from '@trello/ui';
import { api } from '../lib/api';
import { useCreateBoard, useUpdateBoard, useDeleteBoard, useStarBoard } from '../lib/wsData';
import { WorkspaceMembers } from '../components/WorkspaceMembers';

async function fetchBoards(workspaceId) {
  const res = await api.get('/boards', { params: { workspaceId } });
  return Array.isArray(res.data) ? res.data : res.data?.items ?? [];
}

export function WorkspaceBoards() {
  const { workspaceId = '' } = useParams();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [name, setName] = useState('');
  const [editing, setEditing] = useState(null); // { id, name }
  const [bgFor, setBgFor] = useState(null); // board id
  const [membersOpen, setMembersOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['boards', workspaceId],
    queryFn: () => fetchBoards(workspaceId),
    enabled: !!workspaceId,
  });

  const create = useCreateBoard(workspaceId);
  const update = useUpdateBoard(workspaceId);
  const remove = useDeleteBoard(workspaceId);
  const star = useStarBoard(workspaceId);

  const onCreate = (e) => {
    e.preventDefault();
    const n = name.trim();
    if (n) create.mutate({ name: n }, { onSuccess: () => setName('') });
  };

  const submitRename = (e) => {
    e.preventDefault();
    const n = editing?.name.trim();
    if (n) update.mutate({ id: editing.id, patch: { name: n } }, { onSuccess: () => setEditing(null) });
  };

  const onArchive = (b) => update.mutate({ id: b.id, patch: { archived: !b.archived } });

  const onDelete = async (b) => {
    const ok = await confirm({
      title: 'Delete board?', message: `"${b.name}" will be permanently removed. This cannot be undone.`,
      confirmText: 'Delete', danger: true,
    });
    if (ok) remove.mutate(b.id);
  };

  const pickBg = (bg) => {
    update.mutate({ id: bgFor, patch: { background: bg } }, { onSuccess: () => setBgFor(null) });
  };

  const boards = [...(data ?? [])].sort((a, b) => (b.starred ? 1 : 0) - (a.starred ? 1 : 0));

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: `${space.xxl} ${space.lg}` }}>
      <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 15, color: color.textMuted }}>
        <ArrowLeft size={16} /> Workspaces
      </Link>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: space.base, flexWrap: 'wrap' }}>
        <h1 style={{ fontFamily: font.display, fontSize: 30, fontWeight: 800, color: color.text, letterSpacing: '-0.5px' }}>Boards</h1>
        <Button variant="secondary" leftIcon={<Users size={16} />} onClick={() => setMembersOpen(true)}>Members</Button>
      </div>
      <WorkspaceMembers workspaceId={workspaceId} open={membersOpen} onClose={() => setMembersOpen(false)} />

      <form onSubmit={onCreate} style={{ display: 'flex', gap: space.sm, maxWidth: 560, marginTop: space.lg, marginBottom: space.xl }}>
        <Input placeholder="New board name" value={name} onChange={(e) => setName(e.target.value)} wrapStyle={{ flex: 1 }} />
        <Button type="submit" leftIcon={<Plus size={16} />} loading={create.isPending} disabled={!name.trim()} style={{ whiteSpace: 'nowrap' }}>Create</Button>
      </form>

      {isLoading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: space.lg }}>
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} height={120} radius={radius.large} />)}
        </div>
      )}
      {isError && (
        <EmptyState icon={<AlertTriangle size={36} />} title="Could not load boards"
          description="Try again in a moment."
          action={<Button variant="secondary" onClick={() => refetch()}>Retry</Button>} />
      )}
      {!isLoading && !isError && boards.length === 0 && (
        <EmptyState icon={<LayoutGrid size={36} />} title="No boards yet" description="Create one above to get started." />
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: space.lg }}>
        {boards.map((b, i) => (
          <BoardCard
            key={b.id} board={b} grad={boardBackgrounds[i % boardBackgrounds.length]}
            onOpen={() => navigate(`/b/${b.id}`)}
            onRename={() => setEditing({ id: b.id, name: b.name })}
            onChangeBg={() => setBgFor(b.id)}
            onArchive={() => onArchive(b)}
            onDelete={() => onDelete(b)}
            onStar={() => star.mutate({ id: b.id, starred: !b.starred })}
          />
        ))}
      </div>

      <Modal
        open={!!editing} onClose={() => setEditing(null)} title="Rename board" size="sm"
        footer={<>
          <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
          <Button onClick={submitRename} loading={update.isPending} disabled={!editing?.name.trim()}>Save</Button>
        </>}
      >
        <form onSubmit={submitRename}>
          <Input label="Board name" autoFocus value={editing?.name ?? ''}
            onChange={(e) => setEditing((s) => ({ ...s, name: e.target.value }))} />
        </form>
      </Modal>

      <Modal open={!!bgFor} onClose={() => setBgFor(null)} title="Change background" size="sm">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: space.sm }}>
          {boardBackgrounds.map((bg) => (
            <button key={bg} onClick={() => pickBg(bg)}
              style={{ height: 56, borderRadius: radius.large, background: bg, border: `1px solid ${color.border}`, cursor: 'pointer' }}
              aria-label="Pick background" />
          ))}
        </div>
      </Modal>
    </div>
  );
}

function BoardCard({ board, grad, onOpen, onRename, onChangeBg, onArchive, onDelete, onStar }) {
  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={onOpen}
        style={{
          width: '100%', textAlign: 'left', height: 120, borderRadius: radius.large,
          background: board.background || grad, boxShadow: shadow.base, padding: space.lg,
          color: '#fff', fontFamily: font.display, fontSize: 20, fontWeight: 700,
          display: 'flex', alignItems: 'flex-end', cursor: 'pointer', border: 'none',
          opacity: board.archived ? 0.55 : 1,
        }}
      >
        {board.name}{board.archived ? ' (archived)' : ''}
      </button>
      <div style={{ position: 'absolute', top: 6, left: 6 }}>
        <IconButton label={board.starred ? 'Unstar board' : 'Star board'}
          style={{ background: 'rgba(0,0,0,0.28)', color: board.starred ? '#F2D600' : '#fff' }}
          onClick={(e) => { e.stopPropagation(); onStar(); }}>
          <Star size={16} fill={board.starred ? '#F2D600' : 'none'} />
        </IconButton>
      </div>
      <div style={{ position: 'absolute', top: 6, right: 6 }}>
        <Dropdown
          align="right" width={190}
          trigger={
            <IconButton label="Board actions" style={{ background: 'rgba(0,0,0,0.28)', color: '#fff' }}>
              <MoreHorizontal size={18} />
            </IconButton>
          }
        >
          <MenuItem icon={<Pencil size={16} />} onClick={onRename}>Rename</MenuItem>
          <MenuItem icon={<Image size={16} />} onClick={onChangeBg}>Change background</MenuItem>
          <MenuItem icon={board.archived ? <ArchiveRestore size={16} /> : <Archive size={16} />} onClick={onArchive}>
            {board.archived ? 'Unarchive' : 'Archive'}
          </MenuItem>
          <MenuItem icon={<Trash2 size={16} />} danger onClick={onDelete}>Delete</MenuItem>
        </Dropdown>
      </div>
    </div>
  );
}

import { useState, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext, horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  Plus, MoreHorizontal, Pencil, Image, Archive, ArchiveRestore, Trash2, AlertTriangle,
} from 'lucide-react';
import {
  Button, Input, Modal, Spinner, EmptyState, IconButton, Dropdown, MenuItem, useConfirm,
  color, font, radius, shadow, space, boardBackgrounds,
} from '@trello/ui';
import {
  useBoardData, useCreateList, useUpdateList, useDeleteList, useMoveList,
  useCreateCard, useMoveCard,
} from '../lib/boardData';
import { useUpdateBoard, useDeleteBoard } from '../lib/wsData';
import { useBoardSocket } from '../lib/socket';
import { midpoint } from '../lib/position';
import { ListColumn } from '../components/ListColumn';
import { CardTile } from '../components/CardTile';
import { CardModal } from '../components/CardModal';

export function BoardView() {
  const { boardId = '' } = useParams();
  const navigate = useNavigate();
  const confirm = useConfirm();
  useBoardSocket(boardId);

  const { board, lists, cards, isLoading, isError } = useBoardData(boardId);
  const createList = useCreateList(boardId);
  const renameList = useUpdateList(boardId, { successMessage: 'List renamed.' });
  const archiveList = useUpdateList(boardId, { successMessage: 'List archived.' });
  const deleteList = useDeleteList(boardId);
  const moveList = useMoveList(boardId);
  const createCard = useCreateCard(boardId);
  const moveCard = useMoveCard(boardId);
  const updateBoard = useUpdateBoard(board?.workspaceId);
  const deleteBoard = useDeleteBoard(board?.workspaceId);

  const [activeCard, setActiveCard] = useState(null);
  const [activeList, setActiveList] = useState(null);
  const [openCard, setOpenCard] = useState(null);
  const [addingList, setAddingList] = useState(false);
  const [listName, setListName] = useState('');
  const [renameOpen, setRenameOpen] = useState(false);
  const [boardName, setBoardName] = useState('');
  const [bgOpen, setBgOpen] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const cardsByList = useMemo(() => {
    const map = new Map();
    lists.forEach((l) => map.set(l.id, []));
    cards.forEach((c) => {
      const arr = map.get(c.listId) ?? [];
      arr.push(c);
      map.set(c.listId, arr);
    });
    map.forEach((arr) => arr.sort((a, b) => a.position - b.position));
    return map;
  }, [lists, cards]);

  const findCard = (id) => cards.find((c) => c.id === id) ?? null;
  const listIdFromSortable = (id) => String(id).replace(/^list:/, '');

  const onDragStart = (e) => {
    const id = String(e.active.id);
    if (id.startsWith('list:')) {
      setActiveList(lists.find((l) => l.id === listIdFromSortable(id)) ?? null);
    } else {
      setActiveCard(findCard(id));
    }
  };

  const onDragEnd = (e) => {
    const wasList = !!activeList;
    setActiveCard(null);
    setActiveList(null);
    const { active, over } = e;
    if (!over) return;
    const activeId = String(active.id);

    // List reorder.
    if (activeId.startsWith('list:')) {
      const fromId = listIdFromSortable(activeId);
      const overId = listIdFromSortable(String(over.id));
      if (fromId === overId) return;
      const ordered = lists.filter((l) => l.id !== fromId);
      let index = ordered.findIndex((l) => l.id === overId);
      if (index < 0) index = ordered.length;
      const before = index > 0 ? ordered[index - 1].position : null;
      const after = index < ordered.length ? ordered[index].position : null;
      moveList.mutate({ listId: fromId, position: midpoint(before, after) });
      return;
    }
    if (wasList) return;

    // Card move.
    const card = findCard(activeId);
    if (!card) return;
    const overData = over.data.current;
    const targetListId = overData?.listId ?? card.listId;
    const overCard = overData?.type === 'card' ? findCard(String(over.id)) : null;

    const dest = (cardsByList.get(targetListId) ?? []).filter((c) => c.id !== card.id);
    let index = dest.length;
    if (overCard) index = dest.findIndex((c) => c.id === overCard.id);
    if (index < 0) index = dest.length;

    const before = index > 0 ? dest[index - 1].position : null;
    const after = index < dest.length ? dest[index].position : null;
    const position = midpoint(before, after);

    if (card.listId === targetListId && card.position === position) return;
    moveCard.mutate({ cardId: card.id, listId: targetListId, position });
  };

  const submitList = (e) => {
    e.preventDefault();
    const name = listName.trim();
    if (!name) return;
    const last = lists.length ? lists[lists.length - 1].position : null;
    createList.mutate({ name, position: midpoint(last, null) });
    setListName('');
    setAddingList(false);
  };

  const addCard = (listId, title) => {
    const dest = cardsByList.get(listId) ?? [];
    const last = dest.length ? dest[dest.length - 1].position : null;
    createCard.mutate({ listId, title, position: midpoint(last, null) });
  };

  const onRenameList = (listId, name) => renameList.mutate({ listId, patch: { name } });
  const onArchiveList = (listId) => archiveList.mutate({ listId, patch: { archived: true } });
  const onDeleteList = async (list) => {
    const ok = await confirm({
      title: 'Delete list?', message: `"${list.name}" and its cards will be removed. This cannot be undone.`,
      confirmText: 'Delete', danger: true,
    });
    if (ok) deleteList.mutate(list.id);
  };

  const submitBoardRename = (e) => {
    e.preventDefault();
    const n = boardName.trim();
    if (n) updateBoard.mutate({ id: boardId, patch: { name: n } }, { onSuccess: () => setRenameOpen(false) });
  };
  const onArchiveBoard = () => updateBoard.mutate({ id: boardId, patch: { archived: !board?.archived } });
  const onDeleteBoard = async () => {
    const ok = await confirm({
      title: 'Delete board?', message: `"${board?.name}" will be permanently removed. This cannot be undone.`,
      confirmText: 'Delete', danger: true,
    });
    if (ok) deleteBoard.mutate(boardId, { onSuccess: () => navigate('/') });
  };
  const pickBg = (bg) => updateBoard.mutate({ id: boardId, patch: { background: bg } }, { onSuccess: () => setBgOpen(false) });

  const bg = board?.background || `linear-gradient(135deg, ${color.blue}, ${color.navyDeep})`;

  return (
    <div style={{ height: '100%', background: bg, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{
        padding: '12px 24px', display: 'flex', alignItems: 'center', gap: space.base,
        background: 'rgba(0,0,0,0.18)', flexShrink: 0,
      }}>
        <Link to="/" style={{ color: '#fff', fontSize: 14, opacity: 0.9 }}>Boards</Link>
        <span style={{ color: 'rgba(255,255,255,0.6)' }}>/</span>
        <h1 style={{ fontFamily: font.display, fontSize: 20, fontWeight: 600, color: '#fff', margin: 0 }}>
          {board?.name ?? 'Board'}
        </h1>
        <span style={{ flex: 1 }} />
        {board && (
          <Dropdown
            align="right" width={190}
            trigger={<IconButton label="Board actions" style={{ color: '#fff', background: 'rgba(255,255,255,0.18)' }}><MoreHorizontal size={18} /></IconButton>}
          >
            <MenuItem icon={<Pencil size={16} />} onClick={() => { setBoardName(board.name); setRenameOpen(true); }}>Rename</MenuItem>
            <MenuItem icon={<Image size={16} />} onClick={() => setBgOpen(true)}>Change background</MenuItem>
            <MenuItem icon={board.archived ? <ArchiveRestore size={16} /> : <Archive size={16} />} onClick={onArchiveBoard}>
              {board.archived ? 'Unarchive' : 'Archive'}
            </MenuItem>
            <MenuItem icon={<Trash2 size={16} />} danger onClick={onDeleteBoard}>Delete board</MenuItem>
          </Dropdown>
        )}
      </div>

      {isLoading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          <Spinner size={32} color="#fff" />
        </div>
      )}

      {isError && !isLoading && (
        <EmptyState icon={<AlertTriangle size={36} />} title="Could not load board"
          description="The board may be unavailable or the backend is offline." style={{ color: '#fff' }} />
      )}

      {!isLoading && !isError && (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <div style={{
            display: 'flex', gap: space.md, padding: '16px 24px 24px',
            overflowX: 'auto', overflowY: 'hidden', alignItems: 'flex-start', flex: 1, minHeight: 0,
          }}>
            <SortableContext items={lists.map((l) => `list:${l.id}`)} strategy={horizontalListSortingStrategy}>
              {lists.map((l) => (
                <ListColumn
                  key={l.id}
                  list={l}
                  cards={cardsByList.get(l.id) ?? []}
                  onAddCard={addCard}
                  onCardClick={(c) => setOpenCard(c)}
                  onRename={onRenameList}
                  onArchive={onArchiveList}
                  onDelete={onDeleteList}
                />
              ))}
            </SortableContext>

            <div style={{ width: 280, flexShrink: 0 }}>
              {addingList ? (
                <form onSubmit={submitList} style={{
                  background: color.surface, borderRadius: radius.large, padding: space.sm,
                  display: 'flex', flexDirection: 'column', gap: space.sm, boxShadow: shadow.base,
                }}>
                  <Input autoFocus placeholder="Enter list name…" value={listName} onChange={(e) => setListName(e.target.value)} />
                  <div style={{ display: 'flex', gap: space.sm }}>
                    <Button type="submit" size="sm" loading={createList.isPending}>Add list</Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => { setAddingList(false); setListName(''); }}>Cancel</Button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setAddingList(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, width: '100%', textAlign: 'left',
                    padding: space.md, border: 'none', background: 'rgba(255,255,255,0.24)', color: '#fff',
                    borderRadius: radius.large, cursor: 'pointer', fontSize: 14, fontFamily: font.text, fontWeight: 500,
                  }}
                >
                  <Plus size={16} /> Add {lists.length ? 'another list' : 'a list'}
                </button>
              )}
            </div>
          </div>

          <DragOverlay>
            {activeCard && <CardTile card={activeCard} overlay />}
            {activeList && (
              <div style={{
                width: 280, background: color.surfaceAlt, borderRadius: radius.large, padding: space.sm,
                boxShadow: shadow.hover, fontFamily: font.text, fontWeight: 600, color: color.text,
              }}>
                {activeList.name}
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      <Modal
        open={renameOpen} onClose={() => setRenameOpen(false)} title="Rename board" size="sm"
        footer={<>
          <Button variant="ghost" onClick={() => setRenameOpen(false)}>Cancel</Button>
          <Button onClick={submitBoardRename} loading={updateBoard.isPending} disabled={!boardName.trim()}>Save</Button>
        </>}
      >
        <form onSubmit={submitBoardRename}>
          <Input label="Board name" autoFocus value={boardName} onChange={(e) => setBoardName(e.target.value)} />
        </form>
      </Modal>

      <Modal open={bgOpen} onClose={() => setBgOpen(false)} title="Change background" size="sm">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: space.sm }}>
          {boardBackgrounds.map((b) => (
            <button key={b} onClick={() => pickBg(b)}
              style={{ height: 56, borderRadius: radius.large, background: b, border: `1px solid ${color.border}`, cursor: 'pointer' }}
              aria-label="Pick background" />
          ))}
        </div>
      </Modal>

      <CardModal card={openCard} boardId={boardId} board={board} onClose={() => setOpenCard(null)} />
    </div>
  );
}

import { useState, useMemo, useEffect } from 'react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext, horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  Plus, MoreHorizontal, Pencil, Image, Archive, ArchiveRestore, Trash2, AlertTriangle,
  Filter as FilterIcon, X, FileText, Tag as TagIcon, Users, SlidersHorizontal, CalendarDays,
} from 'lucide-react';
import {
  Button, Input, Textarea, Modal, Skeleton, EmptyState, IconButton, Dropdown, MenuItem, LabelChip, Avatar, useConfirm,
  color, font, radius, shadow, space, boardBackgrounds,
} from '@trello/ui';
import {
  useBoardData, useCreateList, useUpdateList, useDeleteList, useMoveList,
  useCreateCard, useMoveCard, useSortList,
} from '../lib/boardData';
import { useUpdateBoard, useDeleteBoard } from '../lib/wsData';
import { useBoardSocket } from '../lib/socket';
import { midpoint } from '../lib/position';
import { ListColumn } from '../components/ListColumn';
import { CardTile } from '../components/CardTile';
import { CardModal } from '../components/CardModal';
import { LabelsManager } from '../components/LabelsManager';
import { BoardMembers } from '../components/BoardMembers';
import { CustomFieldsManager } from '../components/CustomFieldsManager';

const EMPTY_FILTER = { text: '', labelIds: [], memberIds: [], due: '' };

function dueBucket(dueDate) {
  if (!dueDate) return 'none';
  const d = new Date(dueDate);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (day < today) return 'overdue';
  if (day.getTime() === today.getTime()) return 'today';
  const weekEnd = new Date(today); weekEnd.setDate(weekEnd.getDate() + 7);
  if (day <= weekEnd) return 'week';
  return 'later';
}

function matchesFilter(card, f) {
  if (f.text && !card.title?.toLowerCase().includes(f.text.toLowerCase())) return false;
  if (f.labelIds.length) {
    const ids = new Set((card.labels ?? []).map((l) => l.id));
    if (!f.labelIds.some((id) => ids.has(id))) return false;
  }
  if (f.memberIds.length) {
    const ids = new Set((card.members ?? []).map((m) => m.id));
    if (!f.memberIds.some((id) => ids.has(id))) return false;
  }
  if (f.due) {
    const bucket = dueBucket(card.dueDate);
    if (f.due === 'none' && bucket !== 'none') return false;
    if (f.due === 'overdue' && bucket !== 'overdue') return false;
    if (f.due === 'today' && bucket !== 'today') return false;
    if (f.due === 'week' && !['overdue', 'today', 'week'].includes(bucket)) return false;
  }
  return true;
}

export function BoardView() {
  const { boardId = '' } = useParams();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [searchParams, setSearchParams] = useSearchParams();
  useBoardSocket(boardId);

  const { board, lists, cards, isLoading, isError } = useBoardData(boardId);
  const [filter, setFilter] = useState(EMPTY_FILTER);
  const activeFilterCount =
    (filter.text ? 1 : 0) + filter.labelIds.length + filter.memberIds.length + (filter.due ? 1 : 0);

  const boardMembers = useMemo(() => {
    const m = new Map();
    cards.forEach((c) => (c.members ?? []).forEach((u) => m.set(u.id, u)));
    return [...m.values()];
  }, [cards]);

  const visibleCards = useMemo(
    () => (activeFilterCount ? cards.filter((c) => matchesFilter(c, filter)) : cards),
    [cards, filter, activeFilterCount],
  );
  const createList = useCreateList(boardId);
  const renameList = useUpdateList(boardId, { successMessage: 'List renamed.' });
  const archiveList = useUpdateList(boardId, { successMessage: 'List archived.' });
  const deleteList = useDeleteList(boardId);
  const moveList = useMoveList(boardId);
  const createCard = useCreateCard(boardId);
  const moveCard = useMoveCard(boardId);
  const sortList = useSortList(boardId);
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
  const [descOpen, setDescOpen] = useState(false);
  const [boardDesc, setBoardDesc] = useState('');
  const [labelsOpen, setLabelsOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [fieldsOpen, setFieldsOpen] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const cardsByList = useMemo(() => {
    const map = new Map();
    lists.forEach((l) => map.set(l.id, []));
    visibleCards.forEach((c) => {
      const arr = map.get(c.listId) ?? [];
      arr.push(c);
      map.set(c.listId, arr);
    });
    map.forEach((arr) => arr.sort((a, b) => a.position - b.position));
    return map;
  }, [lists, visibleCards]);

  // Open a card from the ?card=<id> query param (e.g. navigated from search).
  useEffect(() => {
    const cardId = searchParams.get('card');
    if (cardId && cards.length) {
      const c = cards.find((x) => x.id === cardId);
      if (c) {
        setOpenCard(c);
        searchParams.delete('card');
        setSearchParams(searchParams, { replace: true });
      }
    }
  }, [searchParams, cards, setSearchParams]);

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

  const onSortList = (listId, by) => sortList.mutate({ listId, by });
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
  const submitBoardDesc = (e) => {
    e.preventDefault();
    updateBoard.mutate({ id: boardId, patch: { description: boardDesc.trim() || null } }, { onSuccess: () => setDescOpen(false) });
  };

  const bg = board?.background || 'linear-gradient(135deg, #0079BF 0%, #5067C5 100%)';

  return (
    <div style={{ height: '100%', minHeight: '100%', background: bg, backgroundAttachment: 'fixed', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        padding: '12px 24px', display: 'flex', alignItems: 'center', gap: space.base,
        background: 'rgba(0,0,0,0.18)', flexShrink: 0,
      }}>
        <Link to="/" style={{ color: '#fff', fontSize: 14, opacity: 0.9 }}>Boards</Link>
        <span style={{ color: 'rgba(255,255,255,0.6)' }}>/</span>
        <h1 style={{ fontFamily: font.display, fontSize: 24, fontWeight: 700, color: '#fff', margin: 0 }}>
          {board?.name ?? 'Board'}
        </h1>
        <span style={{ flex: 1 }} />
        {board && (
          <Link to={`/b/${boardId}/calendar`} style={{ color: '#fff', textDecoration: 'none' }}>
            <Button variant="secondary" size="sm" leftIcon={<CalendarDays size={15} />}
              style={{ background: 'rgba(255,255,255,0.18)', color: '#fff', border: 'none' }}>
              Calendar
            </Button>
          </Link>
        )}
        {board && (
          <FilterBar
            filter={filter}
            setFilter={setFilter}
            labels={board.labels ?? []}
            members={boardMembers}
            count={activeFilterCount}
            onClear={() => setFilter(EMPTY_FILTER)}
          />
        )}
        {board && (
          <Dropdown
            align="right" width={190}
            trigger={<IconButton label="Board actions" style={{ color: '#fff', background: 'rgba(255,255,255,0.18)' }}><MoreHorizontal size={18} /></IconButton>}
          >
            <MenuItem icon={<Pencil size={16} />} onClick={() => { setBoardName(board.name); setRenameOpen(true); }}>Rename</MenuItem>
            <MenuItem icon={<FileText size={16} />} onClick={() => { setBoardDesc(board.description ?? ''); setDescOpen(true); }}>Edit description</MenuItem>
            <MenuItem icon={<Image size={16} />} onClick={() => setBgOpen(true)}>Change background</MenuItem>
            <MenuItem icon={<TagIcon size={16} />} onClick={() => setLabelsOpen(true)}>Manage labels</MenuItem>
            <MenuItem icon={<Users size={16} />} onClick={() => setMembersOpen(true)}>Members</MenuItem>
            <MenuItem icon={<SlidersHorizontal size={16} />} onClick={() => setFieldsOpen(true)}>Custom fields</MenuItem>
            <MenuItem icon={board.archived ? <ArchiveRestore size={16} /> : <Archive size={16} />} onClick={onArchiveBoard}>
              {board.archived ? 'Unarchive' : 'Archive'}
            </MenuItem>
            <MenuItem icon={<Trash2 size={16} />} danger onClick={onDeleteBoard}>Delete board</MenuItem>
          </Dropdown>
        )}
      </div>

      {isLoading && <BoardSkeleton />}

      {isError && !isLoading && (
        <EmptyState icon={<AlertTriangle size={36} />} title="Could not load board"
          description="The board may be unavailable or the backend is offline." style={{ color: '#fff' }} />
      )}

      {!isLoading && !isError && (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <div style={{
            display: 'flex', gap: space.base, padding: '20px 24px 24px',
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
                  onSort={onSortList}
                />
              ))}
            </SortableContext>

            <div style={{ width: 296, flexShrink: 0 }}>
              {addingList ? (
                <form onSubmit={submitList} style={{
                  background: color.surface, borderRadius: radius.large, padding: space.md,
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
                    display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left',
                    padding: space.base, border: 'none', background: 'rgba(255,255,255,0.24)', color: '#fff',
                    borderRadius: radius.large, cursor: 'pointer', fontSize: 15, fontFamily: font.text, fontWeight: 600,
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
                width: 296, background: color.surfaceAlt, borderRadius: radius.large, padding: space.md,
                boxShadow: shadow.hover, fontFamily: font.text, fontWeight: 600, fontSize: 15, color: color.text,
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

      <Modal
        open={descOpen} onClose={() => setDescOpen(false)} title="Board description" size="sm"
        footer={<>
          <Button variant="ghost" onClick={() => setDescOpen(false)}>Cancel</Button>
          <Button onClick={submitBoardDesc} loading={updateBoard.isPending}>Save</Button>
        </>}
      >
        <form onSubmit={submitBoardDesc}>
          <Textarea autoFocus value={boardDesc} onChange={(e) => setBoardDesc(e.target.value)}
            placeholder="Add a description for this board…" style={{ minHeight: 120 }} />
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

      <LabelsManager open={labelsOpen} onClose={() => setLabelsOpen(false)} boardId={boardId} labels={board?.labels ?? []} />
      <BoardMembers open={membersOpen} onClose={() => setMembersOpen(false)} boardId={boardId} workspaceId={board?.workspaceId} />
      <CustomFieldsManager open={fieldsOpen} onClose={() => setFieldsOpen(false)} boardId={boardId} fields={board?.customFields ?? []} />

      <CardModal card={openCard} boardId={boardId} board={board} onClose={() => setOpenCard(null)} />
    </div>
  );
}

function BoardSkeleton() {
  return (
    <div style={{ display: 'flex', gap: space.base, padding: '20px 24px 24px', flex: 1, minHeight: 0, alignItems: 'flex-start', overflow: 'hidden' }}>
      {[4, 2, 3].map((n, li) => (
        <div key={li} style={{ width: 296, flexShrink: 0, background: color.surface, borderRadius: radius.large, padding: space.md, display: 'flex', flexDirection: 'column', gap: space.sm }}>
          <Skeleton width="55%" height={16} style={{ marginBottom: space.xs }} />
          {Array.from({ length: n }).map((_, ci) => (
            <Skeleton key={ci} height={56} radius={radius.base} />
          ))}
        </div>
      ))}
      <div style={{ width: 296, flexShrink: 0 }}>
        <Skeleton height={44} radius={radius.large} style={{ background: 'rgba(255,255,255,0.5)' }} />
      </div>
    </div>
  );
}

const DUE_OPTIONS = [
  { key: 'overdue', label: 'Overdue' },
  { key: 'today', label: 'Due today' },
  { key: 'week', label: 'Due this week' },
  { key: 'none', label: 'No due date' },
];

function FilterBar({ filter, setFilter, labels, members, count, onClear }) {
  const toggle = (field, id) => setFilter((f) => {
    const set = new Set(f[field]);
    if (set.has(id)) set.delete(id); else set.add(id);
    return { ...f, [field]: [...set] };
  });

  const heading = { fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: color.textMuted, margin: '10px 0 6px' };

  return (
    <Dropdown
      align="right"
      width={280}
      trigger={
        <button style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, height: 32, padding: '0 12px',
          border: 'none', borderRadius: radius.base, cursor: 'pointer', fontFamily: font.text, fontSize: 14,
          color: '#fff', background: count ? color.blue : 'rgba(255,255,255,0.18)',
        }}>
          <FilterIcon size={15} /> Filter
          {count > 0 && (
            <span style={{
              background: '#fff', color: color.blue, borderRadius: radius.pill, fontSize: 11,
              fontWeight: 700, padding: '0 6px', lineHeight: '16px',
            }}>{count}</span>
          )}
        </button>
      }
    >
      <div onClick={(e) => e.stopPropagation()} style={{ padding: '4px 12px 12px', maxHeight: 420, overflowY: 'auto' }}>
        <div style={heading}>Keyword</div>
        <Input placeholder="Filter cards…" value={filter.text} onChange={(e) => setFilter((f) => ({ ...f, text: e.target.value }))} />

        {labels.length > 0 && (
          <>
            <div style={heading}>Labels</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {labels.map((l) => {
                const on = filter.labelIds.includes(l.id);
                return (
                  <button key={l.id} onClick={() => toggle('labelIds', l.id)} style={{
                    border: on ? `2px solid ${color.blue}` : `2px solid transparent`,
                    background: 'transparent', borderRadius: radius.base, padding: 0, cursor: 'pointer',
                  }}>
                    <LabelChip color={l.color} name={l.name} />
                  </button>
                );
              })}
            </div>
          </>
        )}

        {members.length > 0 && (
          <>
            <div style={heading}>Members</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {members.map((m) => {
                const on = filter.memberIds.includes(m.id);
                return (
                  <button key={m.id} onClick={() => toggle('memberIds', m.id)} style={{
                    display: 'flex', alignItems: 'center', gap: space.sm, border: 'none', cursor: 'pointer',
                    background: on ? color.surfaceAlt : 'transparent', borderRadius: radius.base, padding: '4px 6px',
                    fontFamily: font.text, fontSize: 13, color: color.text, textAlign: 'left',
                  }}>
                    <input type="checkbox" readOnly checked={on} />
                    <Avatar name={m.name} email={m.email} src={m.avatarUrl} size={24} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name || m.email}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        <div style={heading}>Due date</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {DUE_OPTIONS.map((o) => (
            <button key={o.key} onClick={() => setFilter((f) => ({ ...f, due: f.due === o.key ? '' : o.key }))} style={{
              display: 'flex', alignItems: 'center', gap: space.sm, border: 'none', cursor: 'pointer',
              background: filter.due === o.key ? color.surfaceAlt : 'transparent', borderRadius: radius.base,
              padding: '6px', fontFamily: font.text, fontSize: 13, color: color.text, textAlign: 'left',
            }}>
              <input type="radio" readOnly checked={filter.due === o.key} /> {o.label}
            </button>
          ))}
        </div>

        {count > 0 && (
          <Button variant="ghost" size="sm" leftIcon={<X size={14} />} onClick={onClear} style={{ marginTop: 10, width: '100%' }}>
            Clear filters
          </Button>
        )}
      </div>
    </Dropdown>
  );
}

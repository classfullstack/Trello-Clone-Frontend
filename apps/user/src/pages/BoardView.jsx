import { useState, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import {
  Button, Input, Spinner, EmptyState, useToast,
  color, font, radius, shadow, space,
} from '@trello/ui';
import { useBoardData, useCreateList, useCreateCard, useMoveCard } from '../lib/boardData';
import { useBoardSocket } from '../lib/socket';
import { midpoint } from '../lib/position';
import { ListColumn } from '../components/ListColumn';
import { CardTile } from '../components/CardTile';
import { CardModal } from '../components/CardModal';

export function BoardView() {
  const { boardId = '' } = useParams();
  const toast = useToast();
  useBoardSocket(boardId);

  const { board, lists, cards, isLoading, isError } = useBoardData(boardId);
  const createList = useCreateList(boardId);
  const createCard = useCreateCard(boardId);
  const moveCard = useMoveCard(boardId);

  const [activeCard, setActiveCard] = useState(null);
  const [openCard, setOpenCard] = useState(null);
  const [addingList, setAddingList] = useState(false);
  const [listName, setListName] = useState('');

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

  const onDragStart = (e) => setActiveCard(findCard(String(e.active.id)));

  const onDragEnd = (e) => {
    setActiveCard(null);
    const { active, over } = e;
    if (!over) return;

    const card = findCard(String(active.id));
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
    moveCard.mutate(
      { cardId: card.id, listId: targetListId, position },
      { onError: () => toast.error('Could not move card.') },
    );
  };

  const submitList = (e) => {
    e.preventDefault();
    const name = listName.trim();
    if (!name) return;
    createList.mutate(name, {
      onError: () => toast.error('Could not create list.'),
    });
    setListName('');
    setAddingList(false);
  };

  const addCard = (listId, title) => {
    const dest = cardsByList.get(listId) ?? [];
    const last = dest.length ? dest[dest.length - 1].position : null;
    createCard.mutate(
      { listId, title, position: midpoint(last, null) },
      { onError: () => toast.error('Could not add card.') },
    );
  };

  const bg = board?.background || `linear-gradient(135deg, ${color.blue}, ${color.navyDeep})`;

  return (
    <div style={{ height: '100%', background: bg, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{
        padding: '12px 24px', display: 'flex', alignItems: 'center', gap: space.base,
        background: 'rgba(0,0,0,0.18)', flexShrink: 0,
      }}>
        <Link to="/" style={{ color: color.white, fontSize: 14, opacity: 0.9 }}>Boards</Link>
        <span style={{ color: 'rgba(255,255,255,0.6)' }}>/</span>
        <h1 style={{ fontFamily: font.display, fontSize: 20, fontWeight: 600, color: color.white, margin: 0 }}>
          {board?.name ?? 'Board'}
        </h1>
      </div>

      {isLoading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          <Spinner size={32} color={color.white} />
        </div>
      )}

      {isError && !isLoading && (
        <EmptyState
          icon="⚠️"
          title="Could not load board"
          description="The board may be unavailable or the backend is offline."
          style={{ color: color.white }}
        />
      )}

      {!isLoading && !isError && (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <div style={{
            display: 'flex', gap: space.md, padding: '16px 24px 24px',
            overflowX: 'auto', overflowY: 'hidden', alignItems: 'flex-start', flex: 1, minHeight: 0,
          }}>
            {lists.map((l) => (
              <ListColumn
                key={l.id}
                list={l}
                cards={cardsByList.get(l.id) ?? []}
                onAddCard={addCard}
                onCardClick={(c) => setOpenCard(c)}
              />
            ))}

            <div style={{ width: 280, flexShrink: 0 }}>
              {addingList ? (
                <form onSubmit={submitList} style={{
                  background: color.white, borderRadius: radius.large, padding: space.sm,
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
                    width: '100%', textAlign: 'left', padding: space.md, border: 'none',
                    background: 'rgba(255,255,255,0.24)', color: color.white, borderRadius: radius.large,
                    cursor: 'pointer', fontSize: 14, fontFamily: font.text, fontWeight: 500,
                  }}
                >
                  + Add {lists.length ? 'another list' : 'a list'}
                </button>
              )}
            </div>
          </div>

          <DragOverlay>
            {activeCard && <CardTile card={activeCard} overlay />}
          </DragOverlay>
        </DndContext>
      )}

      <CardModal card={openCard} boardId={boardId} onClose={() => setOpenCard(null)} />
    </div>
  );
}

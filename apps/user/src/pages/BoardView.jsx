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
import { Button, Input, Spinner, color, font, radius, shadow, space } from '@trello/ui';
import {
  useBoard, useLists, useCards, useCreateList, useCreateCard, useMoveCard,
} from '../lib/boardData';
import { useBoardSocket } from '../lib/socket';
import { midpoint } from '../lib/position';
import { ListColumn } from '../components/ListColumn';
import { CardModal } from '../components/CardModal';

export function BoardView() {
  const { boardId = '' } = useParams();
  useBoardSocket(boardId);

  const { data: board } = useBoard(boardId);
  const { data: lists, isLoading: listsLoading, isError } = useLists(boardId);
  const { data: cards } = useCards(boardId);
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
    (lists ?? []).forEach((l) => map.set(l.id, []));
    (cards ?? []).forEach((c) => {
      const arr = map.get(c.listId) ?? [];
      arr.push(c);
      map.set(c.listId, arr);
    });
    map.forEach((arr) => arr.sort((a, b) => a.position - b.position));
    return map;
  }, [lists, cards]);

  const findCard = (id) => (cards ?? []).find((c) => c.id === id) ?? null;

  const onDragStart = (e) => setActiveCard(findCard(String(e.active.id)));

  const onDragEnd = (e) => {
    setActiveCard(null);
    const { active, over } = e;
    if (!over) return;

    const card = findCard(String(active.id));
    if (!card) return;

    // Resolve target list: dropped over a card or over an empty list droppable.
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
    if (listName.trim()) {
      createList.mutate(listName.trim());
      setListName('');
      setAddingList(false);
    }
  };

  const bg = board?.background || `linear-gradient(135deg, ${color.blue}, ${color.navyDeep})`;

  return (
    <div style={{ height: '100%', background: bg, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: space.base }}>
        <Link to="/" style={{ color: color.white, fontSize: 14 }}>Boards</Link>
        <h1 style={{ fontFamily: font.display, fontSize: 20, fontWeight: 500, color: color.white, margin: 0 }}>
          {board?.name ?? 'Board'}
        </h1>
      </div>

      {listsLoading && <Spinner />}
      {isError && <div style={{ color: color.white, padding: space.xl }}>Could not load board.</div>}

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div style={{ display: 'flex', gap: space.md, padding: '0 24px 24px', overflowX: 'auto', alignItems: 'flex-start', flex: 1 }}>
          {(lists ?? []).map((l) => (
            <ListColumn
              key={l.id}
              list={l}
              cards={cardsByList.get(l.id) ?? []}
              onAddCard={(listId, title) => createCard.mutate({ listId, title })}
              onCardClick={(c) => setOpenCard(c)}
            />
          ))}

          <div style={{ width: 280, flexShrink: 0 }}>
            {addingList ? (
              <form onSubmit={submitList} style={{ background: color.offWhite, borderRadius: radius.large, padding: space.sm, display: 'flex', flexDirection: 'column', gap: space.sm }}>
                <Input autoFocus placeholder="List name" value={listName} onChange={(e) => setListName(e.target.value)} />
                <div style={{ display: 'flex', gap: space.sm }}>
                  <Button type="submit">Add list</Button>
                  <Button type="button" variant="ghost" onClick={() => setAddingList(false)}>Cancel</Button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setAddingList(true)}
                style={{
                  width: '100%', textAlign: 'left', padding: space.md, border: 'none',
                  background: 'rgba(255,255,255,0.24)', color: color.white, borderRadius: radius.large,
                  cursor: 'pointer', fontSize: 14, boxShadow: shadow.subtle,
                }}
              >
                + Add a list
              </button>
            )}
          </div>
        </div>

        <DragOverlay>
          {activeCard && (
            <div style={{ background: color.white, borderRadius: radius.large, boxShadow: shadow.hover, padding: space.sm, fontSize: 14, color: color.navyDeep, width: 264 }}>
              {activeCard.title}
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <CardModal card={openCard} boardId={boardId} onClose={() => setOpenCard(null)} />
    </div>
  );
}

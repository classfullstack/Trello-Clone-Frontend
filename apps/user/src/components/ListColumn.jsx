import { useState } from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { Button, Input, color, font, radius, space } from '@trello/ui';
import { CardTile } from './CardTile';

export function ListColumn({ list, cards, onAddCard, onCardClick }) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const { setNodeRef } = useDroppable({ id: `list:${list.id}`, data: { type: 'list', listId: list.id } });

  const submit = (e) => {
    e.preventDefault();
    if (title.trim()) {
      onAddCard(list.id, title.trim());
      setTitle('');
      setAdding(false);
    }
  };

  return (
    <div
      style={{
        width: 280,
        flexShrink: 0,
        background: color.offWhite,
        borderRadius: radius.large,
        padding: space.sm,
        maxHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontFamily: font.text, fontWeight: 600, fontSize: 14, color: color.navyDeep, padding: '4px 8px',
      }}>
        <span>{list.name}</span>
        {cards.length > 0 && (
          <span style={{ fontSize: 12, fontWeight: 500, color: color.navyLight }}>{cards.length}</span>
        )}
      </div>

      <div ref={setNodeRef} style={{ overflowY: 'auto', flex: 1, minHeight: 8, padding: '4px 0' }}>
        <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map((c) => (
            <CardTile key={c.id} card={c} onClick={() => onCardClick(c)} />
          ))}
        </SortableContext>
      </div>

      {adding ? (
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: space.sm }}>
          <Input
            autoFocus
            placeholder="Card title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => !title && setAdding(false)}
          />
          <div style={{ display: 'flex', gap: space.sm }}>
            <Button type="submit">Add</Button>
            <Button type="button" variant="ghost" onClick={() => { setAdding(false); setTitle(''); }}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setAdding(true)}
          style={{
            border: 'none',
            background: 'transparent',
            color: color.navyLight,
            textAlign: 'left',
            padding: '8px',
            cursor: 'pointer',
            borderRadius: radius.base,
            fontSize: 14,
          }}
        >
          + Add a card
        </button>
      )}
    </div>
  );
}

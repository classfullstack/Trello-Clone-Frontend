import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { color, font, radius, shadow, space } from '@trello/ui';

export function CardTile({ card, onClick }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: 'card', listId: card.listId },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    background: color.white,
    borderRadius: radius.large,
    boxShadow: shadow.subtle,
    padding: space.sm,
    marginBottom: space.sm,
    cursor: 'grab',
    fontFamily: font.text,
    fontSize: 14,
    color: color.navyDeep,
    border: `1px solid ${color.border}`,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} onClick={onClick}>
      {card.labels && card.labels.length > 0 && (
        <div style={{ display: 'flex', gap: 4, marginBottom: 6, flexWrap: 'wrap' }}>
          {card.labels.map((l) => (
            <span key={l.id} style={{ width: 36, height: 8, borderRadius: 4, background: l.color }} />
          ))}
        </div>
      )}
      <div>{card.title}</div>
      {card.dueDate && (
        <div style={{ fontSize: 12, color: color.navyLight, marginTop: 4 }}>
          Due {new Date(card.dueDate).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}

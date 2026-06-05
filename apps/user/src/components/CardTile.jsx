import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Clock, MessageSquare, CheckSquare } from 'lucide-react';
import { Avatar, LabelChip, color, font, radius, shadow, space } from '@trello/ui';

function dueState(due) {
  if (!due) return null;
  const d = new Date(due);
  const now = new Date();
  const overdue = d < now;
  return { label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), overdue };
}

export function CardTile({ card, onClick, overlay = false }) {
  const sortable = useSortable({
    id: card.id,
    data: { type: 'card', listId: card.listId },
    disabled: overlay,
  });
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = sortable;

  const style = {
    transform: overlay ? undefined : CSS.Transform.toString(transform),
    transition,
    opacity: !overlay && isDragging ? 0.3 : 1,
    background: color.surface,
    borderRadius: radius.large,
    boxShadow: overlay ? shadow.hover : shadow.subtle,
    padding: card.coverUrl ? 0 : '10px 12px',
    overflow: 'hidden',
    marginBottom: space.sm,
    cursor: overlay ? 'grabbing' : 'pointer',
    fontFamily: font.text,
    fontSize: 15,
    color: color.text,
    border: `1px solid ${color.border}`,
    rotate: overlay ? '3deg' : undefined,
    width: overlay ? 280 : undefined,
  };

  const labels = card.labels ?? [];
  const members = card.members ?? [];
  const due = dueState(card.dueDate);
  const count = card.commentCount ?? 0;
  const cl = card.checklistSummary;

  return (
    <div ref={overlay ? undefined : setNodeRef} style={style} {...(overlay ? {} : attributes)} {...(overlay ? {} : listeners)} onClick={onClick}>
      {card.coverUrl && (
        <img src={card.coverUrl} alt="" style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block' }} />
      )}
      <div style={{ padding: card.coverUrl ? '10px 12px' : 0 }}>
      {labels.length > 0 && (
        <div style={{ display: 'flex', gap: 4, marginBottom: 6, flexWrap: 'wrap' }}>
          {labels.map((l) => <LabelChip key={l.id} color={l.color} name={l.name} compact />)}
        </div>
      )}

      <div style={{ lineHeight: '22px', fontWeight: 500 }}>{card.title}</div>

      {(due || count > 0 || members.length > 0 || cl) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: space.sm, marginTop: 6, flexWrap: 'wrap' }}>
          {due && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12,
              padding: '2px 6px', borderRadius: radius.base,
              background: due.overdue ? color.errorBg : color.surfaceAlt,
              color: due.overdue ? color.danger : color.textMuted,
            }}>
              <Clock size={12} /> {due.label}
            </span>
          )}
          {cl && cl.total > 0 && (
            <span style={{ fontSize: 12, color: color.textMuted, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              <CheckSquare size={12} /> {cl.done}/{cl.total}
            </span>
          )}
          {count > 0 && (
            <span style={{ fontSize: 12, color: color.textMuted, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              <MessageSquare size={12} /> {count}
            </span>
          )}
          <span style={{ flex: 1 }} />
          {members.slice(0, 3).map((m) => (
            <Avatar key={m.id} name={m.name} email={m.email} src={m.avatarUrl} size={24} />
          ))}
        </div>
      )}
      </div>
    </div>
  );
}

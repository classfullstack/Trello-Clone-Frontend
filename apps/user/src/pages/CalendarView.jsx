import { useState, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Columns3, AlertTriangle } from 'lucide-react';
import {
  Button, Spinner, EmptyState, IconButton,
  color, font, space, radius,
} from '@trello/ui';
import { useBoardData, useUpdateCard } from '../lib/boardData';
import { CardModal } from '../components/CardModal';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Monday-first 6-week grid covering the given month.
function monthGrid(year, month) {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7; // days before the 1st (Mon=0)
  const start = new Date(year, month, 1 - offset);
  return Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
}

export function CalendarView() {
  const { boardId = '' } = useParams();
  const { board, cards, isLoading, isError } = useBoardData(boardId);
  const updateCard = useUpdateCard(boardId, { successMessage: null });
  const [cursor, setCursor] = useState(() => { const n = new Date(); return { y: n.getFullYear(), m: n.getMonth() }; });
  const [openCard, setOpenCard] = useState(null);

  const days = useMemo(() => monthGrid(cursor.y, cursor.m), [cursor]);
  const byDay = useMemo(() => {
    const map = new Map();
    cards.forEach((c) => {
      if (!c.dueDate) return;
      const key = ymd(new Date(c.dueDate));
      (map.get(key) ?? map.set(key, []).get(key)).push(c);
    });
    return map;
  }, [cards]);

  const monthLabel = new Date(cursor.y, cursor.m, 1).toLocaleString(undefined, { month: 'long', year: 'numeric' });
  const prev = () => setCursor(({ y, m }) => m === 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 });
  const next = () => setCursor(({ y, m }) => m === 11 ? { y: y + 1, m: 0 } : { y, m: m + 1 });
  const todayKey = ymd(new Date());

  const onDrop = (e, day) => {
    e.preventDefault();
    const cardId = e.dataTransfer.getData('text/cardId');
    if (cardId) updateCard.mutate({ cardId, patch: { dueDate: new Date(day.getFullYear(), day.getMonth(), day.getDate(), 12).toISOString() } });
  };

  if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', padding: space.xl }}><Spinner size={28} /></div>;
  if (isError) return <EmptyState icon={<AlertTriangle size={36} />} title="Could not load board" description="Try again in a moment." />;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: space.base, padding: '12px 24px', borderBottom: `1px solid ${color.border}` }}>
        <Link to={`/b/${boardId}`} style={{ fontSize: 14, color: color.textMuted }}>{board?.name ?? 'Board'}</Link>
        <span style={{ flex: 1 }} />
        <IconButton label="Previous month" onClick={prev}><ChevronLeft size={18} /></IconButton>
        <span style={{ fontFamily: font.display, fontWeight: 600, fontSize: 16, color: color.text, minWidth: 150, textAlign: 'center' }}>{monthLabel}</span>
        <IconButton label="Next month" onClick={next}><ChevronRight size={18} /></IconButton>
        <Link to={`/b/${boardId}`}><Button variant="secondary" size="sm" leftIcon={<Columns3 size={15} />}>Board</Button></Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: `1px solid ${color.border}` }}>
        {WEEKDAYS.map((w) => (
          <div key={w} style={{ padding: '6px 8px', fontSize: 12, fontWeight: 600, color: color.textMuted, textAlign: 'center' }}>{w}</div>
        ))}
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: '1fr', minHeight: 0 }}>
        {days.map((day) => {
          const key = ymd(day);
          const inMonth = day.getMonth() === cursor.m;
          const list = byDay.get(key) ?? [];
          return (
            <div key={key} onDragOver={(e) => e.preventDefault()} onDrop={(e) => onDrop(e, day)}
              style={{
                border: `1px solid ${color.border}`, padding: 4, overflowY: 'auto',
                background: inMonth ? color.surface : color.surfaceAlt, minHeight: 90,
              }}>
              <div style={{
                fontSize: 12, fontWeight: key === todayKey ? 700 : 500, marginBottom: 4,
                color: key === todayKey ? color.blue : (inMonth ? color.text : color.textMuted),
              }}>
                {day.getDate()}
              </div>
              {list.map((c) => (
                <div key={c.id} draggable
                  onDragStart={(e) => e.dataTransfer.setData('text/cardId', c.id)}
                  onClick={() => setOpenCard(c)}
                  style={{
                    background: color.surfaceAlt, border: `1px solid ${color.border}`, borderRadius: radius.base,
                    padding: '3px 6px', marginBottom: 3, fontSize: 12, color: color.text, cursor: 'pointer',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                  {c.title}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      <CardModal card={openCard} boardId={boardId} board={board} onClose={() => setOpenCard(null)} />
    </div>
  );
}

import { useState, useEffect } from 'react';
import {
  Modal, Button, Input, Textarea, Avatar, LabelChip, Spinner, useToast,
  color, font, space, radius,
} from '@trello/ui';
import {
  useUpdateCard, useCardDetail, useComments, useAddComment, useToggleChecklistItem,
} from '../lib/boardData';

const sectionLabel = { fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: color.navyLight, marginBottom: 8 };

function Comment({ c }) {
  const author = c.author ?? {};
  return (
    <div style={{ display: 'flex', gap: space.sm }}>
      <Avatar name={author.name} email={author.email} src={author.avatarUrl} size={32} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13 }}>
          <span style={{ fontWeight: 600, color: color.navyDeep }}>{author.name || author.email || 'User'}</span>
          {c.createdAt && (
            <span style={{ color: color.navyLight, marginLeft: 6, fontSize: 12 }}>
              {new Date(c.createdAt).toLocaleString()}
            </span>
          )}
        </div>
        <div style={{
          marginTop: 4, fontSize: 14, color: color.navyDeep, background: color.offWhite,
          padding: '8px 12px', borderRadius: radius.large, wordBreak: 'break-word',
        }}>
          {c.body}
        </div>
      </div>
    </div>
  );
}

function Checklist({ checklist, cardId }) {
  const toggle = useToggleChecklistItem(cardId);
  const items = checklist.items ?? [];
  const done = items.filter((i) => i.done).length;
  const pct = items.length ? Math.round((done / items.length) * 100) : 0;
  return (
    <div style={{ marginBottom: space.lg }}>
      <div style={sectionLabel}>{checklist.title || 'Checklist'}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: space.sm, marginBottom: space.sm }}>
        <span style={{ fontSize: 12, color: color.navyLight, width: 32 }}>{pct}%</span>
        <div style={{ flex: 1, height: 8, background: color.offWhite, borderRadius: radius.pill, overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: color.success, transition: 'width .2s' }} />
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {items.map((it) => (
          <label key={it.id} style={{ display: 'flex', alignItems: 'center', gap: space.sm, fontSize: 14, cursor: 'pointer', padding: '2px 0' }}>
            <input
              type="checkbox"
              checked={!!it.done}
              onChange={() => toggle.mutate({ itemId: it.id, done: !it.done })}
            />
            <span style={{ color: it.done ? color.navyLight : color.navyDeep, textDecoration: it.done ? 'line-through' : 'none' }}>
              {it.text}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

export function CardModal({ card, boardId, onClose }) {
  const toast = useToast();
  const update = useUpdateCard(boardId);
  const detailQ = useCardDetail(card?.id);
  const commentsQ = useComments(card?.id);
  const addComment = useAddComment(card?.id);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [due, setDue] = useState('');
  const [comment, setComment] = useState('');

  const full = detailQ.data ?? card;

  useEffect(() => {
    setTitle(card?.title ?? '');
    setDescription(card?.description ?? '');
    setDue(card?.dueDate ? card.dueDate.slice(0, 10) : '');
  }, [card]);

  useEffect(() => {
    if (detailQ.data) {
      setDescription(detailQ.data.description ?? '');
      setDue(detailQ.data.dueDate ? detailQ.data.dueDate.slice(0, 10) : '');
    }
  }, [detailQ.data]);

  if (!card) return null;

  const saveField = (patch) =>
    update.mutate({ cardId: card.id, patch }, { onError: () => toast.error('Could not save changes.') });

  const onComment = (e) => {
    e.preventDefault();
    const body = comment.trim();
    if (!body) return;
    addComment.mutate(body, {
      onSuccess: () => setComment(''),
      onError: () => toast.error('Could not add comment.'),
    });
  };

  const labels = full.labels ?? [];
  const members = full.members ?? [];
  const comments = commentsQ.data ?? [];
  const checklists = full.checklists ?? [];

  return (
    <Modal open={!!card} onClose={onClose} width={680} title={null} padded>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => title.trim() && title !== card.title && saveField({ title: title.trim() })}
        aria-label="Card title"
        style={{
          fontFamily: font.display, fontSize: 22, fontWeight: 600, color: color.navyDeep,
          border: 'none', outline: 'none', width: '100%', marginBottom: space.lg,
          background: 'transparent',
        }}
      />

      {(labels.length > 0 || members.length > 0) && (
        <div style={{ display: 'flex', gap: space.xl, flexWrap: 'wrap', marginBottom: space.lg }}>
          {labels.length > 0 && (
            <div>
              <div style={sectionLabel}>Labels</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {labels.map((l) => <LabelChip key={l.id} color={l.color} name={l.name} />)}
              </div>
            </div>
          )}
          {members.length > 0 && (
            <div>
              <div style={sectionLabel}>Members</div>
              <div style={{ display: 'flex', gap: 4 }}>
                {members.map((m) => <Avatar key={m.id} name={m.name} email={m.email} src={m.avatarUrl} size={32} />)}
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ marginBottom: space.lg }}>
        <div style={sectionLabel}>Description</div>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={() => description !== (full.description ?? '') && saveField({ description })}
          placeholder="Add a more detailed description…"
          style={{ minHeight: 96 }}
        />
      </div>

      <div style={{ marginBottom: space.lg, maxWidth: 200 }}>
        <div style={sectionLabel}>Due date</div>
        <Input
          type="date"
          value={due}
          onChange={(e) => setDue(e.target.value)}
          onBlur={() => saveField({ dueDate: due || null })}
        />
      </div>

      {checklists.map((cl) => <Checklist key={cl.id} checklist={cl} cardId={card.id} />)}

      <div>
        <div style={sectionLabel}>Comments</div>
        <form onSubmit={onComment} style={{ display: 'flex', gap: space.sm, marginBottom: space.base }}>
          <Input placeholder="Write a comment…" value={comment} onChange={(e) => setComment(e.target.value)} wrapStyle={{ flex: 1 }} />
          <Button type="submit" loading={addComment.isPending} disabled={!comment.trim()} style={{ whiteSpace: 'nowrap' }}>Send</Button>
        </form>
        <div style={{ display: 'flex', flexDirection: 'column', gap: space.md }}>
          {commentsQ.isLoading && <Spinner size={18} />}
          {!commentsQ.isLoading && comments.map((c) => <Comment key={c.id} c={c} />)}
          {!commentsQ.isLoading && comments.length === 0 && (
            <div style={{ fontSize: 13, color: color.mediumGray }}>No comments yet.</div>
          )}
        </div>
      </div>
    </Modal>
  );
}

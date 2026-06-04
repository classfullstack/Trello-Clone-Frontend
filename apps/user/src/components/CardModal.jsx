import { useState, useEffect } from 'react';
import { Plus, Trash2, Pencil, X, Archive } from 'lucide-react';
import {
  Modal, Button, Input, Textarea, Avatar, LabelChip, Spinner, IconButton, useConfirm,
  color, font, space, radius,
} from '@trello/ui';
import {
  useUpdateCard, useDeleteCard, useCardDetail, useComments, useAddComment,
  useEditComment, useDeleteComment, useToggleChecklistItem, useAddChecklistItem,
  useDeleteChecklistItem, useAddCardLabel, useRemoveCardLabel,
} from '../lib/boardData';

const sectionLabel = { fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: color.textMuted, marginBottom: 8 };

function Comment({ c, cardId, currentUserId }) {
  const confirm = useConfirm();
  const edit = useEditComment(cardId);
  const del = useDeleteComment(cardId);
  const author = c.author ?? {};
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(c.body);
  const mine = currentUserId && author.id === currentUserId;

  const save = () => {
    const b = body.trim();
    if (b && b !== c.body) edit.mutate({ commentId: c.id, body: b }, { onSuccess: () => setEditing(false) });
    else setEditing(false);
  };

  const onDelete = async () => {
    const ok = await confirm({ title: 'Delete comment?', message: 'This cannot be undone.', confirmText: 'Delete', danger: true });
    if (ok) del.mutate(c.id);
  };

  return (
    <div style={{ display: 'flex', gap: space.sm }}>
      <Avatar name={author.name} email={author.email} src={author.avatarUrl} size={32} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontWeight: 600, color: color.text }}>{author.name || author.email || 'User'}</span>
          {c.createdAt && (
            <span style={{ color: color.textMuted, fontSize: 12 }}>{new Date(c.createdAt).toLocaleString()}</span>
          )}
          {c.editedAt && <span style={{ color: color.textMuted, fontSize: 11 }}>(edited)</span>}
        </div>
        {editing ? (
          <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: space.sm }}>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} style={{ minHeight: 60 }} />
            <div style={{ display: 'flex', gap: space.sm }}>
              <Button size="sm" onClick={save} loading={edit.isPending}>Save</Button>
              <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setBody(c.body); }}>Cancel</Button>
            </div>
          </div>
        ) : (
          <>
            <div style={{
              marginTop: 4, fontSize: 14, color: color.text, background: color.surfaceAlt,
              padding: '8px 12px', borderRadius: radius.large, wordBreak: 'break-word',
            }}>
              {c.body}
            </div>
            {mine && (
              <div style={{ display: 'flex', gap: space.sm, marginTop: 4 }}>
                <button onClick={() => { setBody(c.body); setEditing(true); }} style={linkBtn}><Pencil size={12} /> Edit</button>
                <button onClick={onDelete} style={{ ...linkBtn, color: color.danger }}><Trash2 size={12} /> Delete</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const linkBtn = {
  display: 'inline-flex', alignItems: 'center', gap: 3, border: 'none', background: 'transparent',
  color: color.textMuted, cursor: 'pointer', fontSize: 12, fontFamily: font.text, padding: 0,
};

function Checklist({ checklist, cardId }) {
  const confirm = useConfirm();
  const toggle = useToggleChecklistItem(cardId);
  const addItem = useAddChecklistItem(cardId);
  const delItem = useDeleteChecklistItem(cardId);
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState('');
  const items = checklist.items ?? [];
  const done = items.filter((i) => i.done).length;
  const pct = items.length ? Math.round((done / items.length) * 100) : 0;

  const submit = (e) => {
    e.preventDefault();
    const t = text.trim();
    if (t) addItem.mutate({ checklistId: checklist.id, text: t }, { onSuccess: () => { setText(''); setAdding(false); } });
  };

  const onDeleteItem = async (id) => {
    const ok = await confirm({ title: 'Delete item?', message: 'This cannot be undone.', confirmText: 'Delete', danger: true });
    if (ok) delItem.mutate(id);
  };

  return (
    <div style={{ marginBottom: space.lg }}>
      <div style={sectionLabel}>{checklist.title || 'Checklist'}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: space.sm, marginBottom: space.sm }}>
        <span style={{ fontSize: 12, color: color.textMuted, width: 32 }}>{pct}%</span>
        <div style={{ flex: 1, height: 8, background: color.surfaceAlt, borderRadius: radius.pill, overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: color.success, transition: 'width .2s' }} />
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {items.map((it) => (
          <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: space.sm, fontSize: 14, padding: '2px 0' }}>
            <input type="checkbox" checked={!!it.done} onChange={() => toggle.mutate({ itemId: it.id, done: !it.done })} />
            <span style={{ flex: 1, color: it.done ? color.textMuted : color.text, textDecoration: it.done ? 'line-through' : 'none' }}>
              {it.text}
            </span>
            <IconButton label="Delete item" size={24} onClick={() => onDeleteItem(it.id)}><Trash2 size={13} /></IconButton>
          </div>
        ))}
      </div>
      {adding ? (
        <form onSubmit={submit} style={{ display: 'flex', gap: space.sm, marginTop: space.sm }}>
          <Input autoFocus placeholder="Add an item" value={text} onChange={(e) => setText(e.target.value)} wrapStyle={{ flex: 1 }} />
          <Button type="submit" size="sm" loading={addItem.isPending} disabled={!text.trim()}>Add</Button>
        </form>
      ) : (
        <button onClick={() => setAdding(true)} style={{ ...linkBtn, marginTop: space.sm }}><Plus size={13} /> Add item</button>
      )}
    </div>
  );
}

function LabelsEditor({ boardId, card, boardLabels }) {
  const confirm = useConfirm();
  const add = useAddCardLabel(boardId, card.id);
  const remove = useRemoveCardLabel(boardId, card.id);
  const applied = card.labels ?? [];
  const appliedIds = new Set(applied.map((l) => l.id));

  const onRemove = async (l) => {
    const ok = await confirm({ title: 'Remove label?', message: 'This cannot be undone.', confirmText: 'Remove', danger: true });
    if (ok) remove.mutate(l.id);
  };

  return (
    <div>
      <div style={sectionLabel}>Labels</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
        {applied.map((l) => (
          <span key={l.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
            <LabelChip color={l.color} name={l.name} />
            <IconButton label="Remove label" size={20} onClick={() => onRemove(l)}><X size={12} /></IconButton>
          </span>
        ))}
        {applied.length === 0 && <span style={{ fontSize: 13, color: color.textMuted }}>No labels.</span>}
      </div>
      {boardLabels.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {boardLabels.filter((l) => !appliedIds.has(l.id)).map((l) => (
            <button key={l.id} onClick={() => add.mutate(l.id)}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }} aria-label={`Add label ${l.name}`}>
              <LabelChip color={l.color} name={l.name} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function CardModal({ card, boardId, board, onClose }) {
  const confirm = useConfirm();
  const update = useUpdateCard(boardId, { successMessage: null });
  const del = useDeleteCard(boardId);
  const detailQ = useCardDetail(card?.id);
  const commentsQ = useComments(card?.id);
  const addComment = useAddComment(card?.id);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [due, setDue] = useState('');
  const [comment, setComment] = useState('');

  const full = detailQ.data ?? card;
  const boardLabels = board?.labels ?? [];

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

  const saveField = (patch) => update.mutate({ cardId: card.id, patch });

  const onComment = (e) => {
    e.preventDefault();
    const body = comment.trim();
    if (!body) return;
    addComment.mutate(body, { onSuccess: () => setComment('') });
  };

  const onDeleteCard = async () => {
    const ok = await confirm({ title: 'Delete card?', message: 'This cannot be undone.', confirmText: 'Delete', danger: true });
    if (ok) del.mutate(card.id, { onSuccess: onClose });
  };

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
          fontFamily: font.display, fontSize: 22, fontWeight: 600, color: color.text,
          border: 'none', outline: 'none', width: '100%', marginBottom: space.lg, background: 'transparent',
        }}
      />

      <div style={{ marginBottom: space.lg }}>
        <LabelsEditor boardId={boardId} card={full} boardLabels={boardLabels} />
      </div>

      {members.length > 0 && (
        <div style={{ marginBottom: space.lg }}>
          <div style={sectionLabel}>Members</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {members.map((m) => <Avatar key={m.id} name={m.name} email={m.email} src={m.avatarUrl} size={32} />)}
          </div>
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
        <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} onBlur={() => saveField({ dueDate: due || null })} />
      </div>

      {checklists.map((cl) => <Checklist key={cl.id} checklist={cl} cardId={card.id} />)}

      <div style={{ marginBottom: space.lg }}>
        <div style={sectionLabel}>Comments</div>
        <form onSubmit={onComment} style={{ display: 'flex', gap: space.sm, marginBottom: space.base }}>
          <Input placeholder="Write a comment…" value={comment} onChange={(e) => setComment(e.target.value)} wrapStyle={{ flex: 1 }} />
          <Button type="submit" loading={addComment.isPending} disabled={!comment.trim()} style={{ whiteSpace: 'nowrap' }}>Send</Button>
        </form>
        <div style={{ display: 'flex', flexDirection: 'column', gap: space.md }}>
          {commentsQ.isLoading && <Spinner size={18} />}
          {!commentsQ.isLoading && comments.map((c) => <Comment key={c.id} c={c} cardId={card.id} currentUserId={full.currentUserId} />)}
          {!commentsQ.isLoading && comments.length === 0 && (
            <div style={{ fontSize: 13, color: color.textMuted }}>No comments yet.</div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: space.sm, borderTop: `1px solid ${color.border}`, paddingTop: space.base }}>
        <Button variant="secondary" leftIcon={<Archive size={15} />}
          onClick={() => saveField({ archived: !full.archived })}>
          {full.archived ? 'Unarchive' : 'Archive'}
        </Button>
        <Button variant="danger" leftIcon={<Trash2 size={15} />} loading={del.isPending} onClick={onDeleteCard}>
          Delete card
        </Button>
      </div>
    </Modal>
  );
}

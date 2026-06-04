import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal, Button, Input, Badge, color, font, space } from '@trello/ui';
import { api } from '../lib/api';
import { useUpdateCard } from '../lib/boardData';

async function fetchComments(cardId) {
  const res = await api.get(`/cards/${cardId}/comments`);
  return Array.isArray(res.data) ? res.data : res.data?.items ?? [];
}

export function CardModal({ card, boardId, onClose }) {
  const qc = useQueryClient();
  const update = useUpdateCard(boardId);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [due, setDue] = useState('');
  const [comment, setComment] = useState('');

  useEffect(() => {
    setTitle(card?.title ?? '');
    setDescription(card?.description ?? '');
    setDue(card?.dueDate ? card.dueDate.slice(0, 10) : '');
  }, [card]);

  const { data: comments } = useQuery({
    queryKey: ['comments', card?.id],
    queryFn: () => fetchComments(card.id),
    enabled: !!card,
  });

  const addComment = useMutation({
    mutationFn: (body) => api.post(`/cards/${card.id}/comments`, { body }),
    onSuccess: () => {
      setComment('');
      qc.invalidateQueries({ queryKey: ['comments', card?.id] });
    },
  });

  if (!card) return null;

  const saveField = (patch) => update.mutate({ cardId: card.id, patch });

  const onComment = (e) => {
    e.preventDefault();
    if (comment.trim()) addComment.mutate(comment.trim());
  };

  const lbl = { fontSize: 13, fontWeight: 600, color: color.navyLight, marginBottom: 6 };

  return (
    <Modal open={!!card} onClose={onClose} width={640}>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => title !== card.title && saveField({ title })}
        style={{
          fontFamily: font.display, fontSize: 20, fontWeight: 500, color: color.navyDeep,
          border: 'none', outline: 'none', width: '100%', marginBottom: space.lg,
        }}
      />

      <div style={{ marginBottom: space.lg }}>
        <div style={lbl}>Description</div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={() => description !== (card.description ?? '') && saveField({ description })}
          placeholder="Add a more detailed description…"
          rows={4}
          style={{
            width: '100%', fontFamily: font.text, fontSize: 14, color: color.navyDeep,
            border: `1px solid ${color.border}`, borderRadius: 4, padding: 12, resize: 'vertical', boxSizing: 'border-box',
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: space.xl, marginBottom: space.lg, flexWrap: 'wrap' }}>
        <div>
          <div style={lbl}>Due date</div>
          <Input
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            onBlur={() => saveField({ dueDate: due || null })}
            style={{ width: 180 }}
          />
        </div>
        <div>
          <div style={lbl}>Labels</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', minHeight: 32 }}>
            {(card.labels ?? []).length > 0 ? (
              card.labels.map((l) => <Badge key={l.id} kind="primary">{l.name}</Badge>)
            ) : (
              <span style={{ fontSize: 13, color: color.mediumGray }}>None</span>
            )}
          </div>
        </div>
      </div>

      <div>
        <div style={lbl}>Comments</div>
        <form onSubmit={onComment} style={{ display: 'flex', gap: space.sm, marginBottom: space.base }}>
          <Input placeholder="Write a comment…" value={comment} onChange={(e) => setComment(e.target.value)} />
          <Button type="submit" disabled={addComment.isPending} style={{ whiteSpace: 'nowrap' }}>Send</Button>
        </form>
        <div style={{ display: 'flex', flexDirection: 'column', gap: space.md }}>
          {(comments ?? []).map((c) => (
            <div key={c.id} style={{ fontSize: 14 }}>
              <span style={{ fontWeight: 600, color: color.navyDeep }}>{c.authorName || 'User'}</span>
              <span style={{ color: color.navyDeep }}>: {c.body}</span>
            </div>
          ))}
          {(comments ?? []).length === 0 && (
            <div style={{ fontSize: 13, color: color.mediumGray }}>No comments yet.</div>
          )}
        </div>
      </div>
    </Modal>
  );
}

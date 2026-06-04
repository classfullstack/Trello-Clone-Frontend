import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@trello/ui';
import { api } from './api';

function unwrap(data) {
  if (Array.isArray(data)) return data;
  const items = data?.items ?? data?.data;
  return Array.isArray(items) ? items : [];
}

// GET /boards/:id returns the full nested payload {..., lists:[{...,cards:[]}], labels:[]}.
export function useBoard(boardId) {
  return useQuery({
    queryKey: ['board', boardId],
    queryFn: async () => {
      const res = await api.get(`/boards/${boardId}`);
      return res.data ?? null;
    },
    enabled: !!boardId,
  });
}

// Derive flat lists + cards from the board payload, falling back to separate fetches.
export function useBoardData(boardId) {
  const boardQ = useBoard(boardId);
  const nested = Array.isArray(boardQ.data?.lists);

  const listsQ = useQuery({
    queryKey: ['lists', boardId],
    queryFn: async () => {
      const res = await api.get('/lists', { params: { boardId } });
      return unwrap(res.data);
    },
    enabled: !!boardId && !nested && !boardQ.isLoading,
  });

  const cardsQ = useQuery({
    queryKey: ['cards', boardId],
    queryFn: async () => {
      const res = await api.get('/cards', { params: { boardId } });
      return unwrap(res.data);
    },
    enabled: !!boardId && !nested && !boardQ.isLoading,
  });

  const { lists, cards } = useMemo(() => {
    if (nested) {
      const ls = [...boardQ.data.lists].sort((a, b) => a.position - b.position);
      const cs = [];
      ls.forEach((l) => (l.cards ?? []).forEach((c) => cs.push({ ...c, listId: c.listId ?? l.id })));
      return { lists: ls.map(({ cards: _c, ...l }) => l), cards: cs };
    }
    return {
      lists: [...(listsQ.data ?? [])].sort((a, b) => a.position - b.position),
      cards: [...(cardsQ.data ?? [])].sort((a, b) => a.position - b.position),
    };
  }, [nested, boardQ.data, listsQ.data, cardsQ.data]);

  return {
    board: boardQ.data,
    lists: lists.filter((l) => !l.archived),
    cards: cards.filter((c) => !c.archived),
    labels: boardQ.data?.labels ?? [],
    isLoading: boardQ.isLoading || (!nested && (listsQ.isLoading || cardsQ.isLoading)),
    isError: boardQ.isError || (!nested && (listsQ.isError || cardsQ.isError)),
  };
}

function invalidateBoard(qc, boardId) {
  qc.invalidateQueries({ queryKey: ['board', boardId] });
  qc.invalidateQueries({ queryKey: ['lists', boardId] });
  qc.invalidateQueries({ queryKey: ['cards', boardId] });
}

/* --------------------------------------------------------------------- List */

export function useCreateList(boardId) {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ name, position }) => api.post('/lists', { boardId, name, position }),
    onSuccess: () => { toast.success('List added.'); invalidateBoard(qc, boardId); },
    onError: () => toast.error('Could not create list.'),
  });
}

export function useUpdateList(boardId, opts = {}) {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ listId, patch }) => api.patch(`/lists/${listId}`, patch),
    onSuccess: () => {
      if (opts.successMessage !== null) toast.success(opts.successMessage ?? 'List updated.');
      invalidateBoard(qc, boardId);
    },
    onError: () => toast.error('Could not update list.'),
  });
}

export function useDeleteList(boardId) {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (listId) => api.delete(`/lists/${listId}`),
    onSuccess: () => { toast.success('List deleted.'); invalidateBoard(qc, boardId); },
    onError: () => toast.error('Could not delete list.'),
  });
}

export function useMoveList(boardId) {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ listId, position }) => api.patch(`/lists/${listId}`, { position }),
    onMutate: async ({ listId, position }) => {
      await qc.cancelQueries({ queryKey: ['board', boardId] });
      await qc.cancelQueries({ queryKey: ['lists', boardId] });
      const prevBoard = qc.getQueryData(['board', boardId]);
      const prevLists = qc.getQueryData(['lists', boardId]);
      const bump = (l) => (l.id === listId ? { ...l, position } : l);
      if (prevBoard?.lists) {
        qc.setQueryData(['board', boardId], (old) => ({ ...old, lists: old.lists.map(bump) }));
      }
      if (prevLists) qc.setQueryData(['lists', boardId], (old) => (old ?? []).map(bump));
      return { prevBoard, prevLists };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prevBoard) qc.setQueryData(['board', boardId], ctx.prevBoard);
      if (ctx?.prevLists) qc.setQueryData(['lists', boardId], ctx.prevLists);
      toast.error('Could not reorder list.');
    },
    onSettled: () => invalidateBoard(qc, boardId),
  });
}

/* --------------------------------------------------------------------- Card */

export function useCreateCard(boardId) {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ listId, title, position }) => api.post('/cards', { listId, title, position }),
    onSuccess: () => { toast.success('Card added.'); invalidateBoard(qc, boardId); },
    onError: () => toast.error('Could not add card.'),
  });
}

export function useMoveCard(boardId) {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ cardId, listId, position }) =>
      api.patch(`/cards/${cardId}/move`, { listId, position }),
    onMutate: async ({ cardId, listId, position }) => {
      await qc.cancelQueries({ queryKey: ['cards', boardId] });
      await qc.cancelQueries({ queryKey: ['board', boardId] });
      const prevCards = qc.getQueryData(['cards', boardId]);
      const prevBoard = qc.getQueryData(['board', boardId]);
      const patchCard = (c) => (c.id === cardId ? { ...c, listId, position } : c);
      if (prevCards) qc.setQueryData(['cards', boardId], (old) => (old ?? []).map(patchCard));
      if (prevBoard?.lists) {
        qc.setQueryData(['board', boardId], (old) => {
          const moved = old.lists.flatMap((l) => l.cards ?? []).find((c) => c.id === cardId);
          if (!moved) return old;
          const updated = { ...moved, listId, position };
          return {
            ...old,
            lists: old.lists.map((l) => ({
              ...l,
              cards: l.id === listId
                ? [...(l.cards ?? []).filter((c) => c.id !== cardId), updated]
                : (l.cards ?? []).filter((c) => c.id !== cardId),
            })),
          };
        });
      }
      return { prevCards, prevBoard };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prevCards) qc.setQueryData(['cards', boardId], ctx.prevCards);
      if (ctx?.prevBoard) qc.setQueryData(['board', boardId], ctx.prevBoard);
      toast.error('Could not move card.');
    },
    onSettled: () => invalidateBoard(qc, boardId),
  });
}

export function useUpdateCard(boardId, opts = {}) {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ cardId, patch }) => api.patch(`/cards/${cardId}`, patch),
    onSuccess: () => {
      if (opts.successMessage !== null) toast.success(opts.successMessage ?? 'Card saved.');
      invalidateBoard(qc, boardId);
    },
    onError: () => toast.error('Could not save changes.'),
  });
}

export function useDeleteCard(boardId) {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (cardId) => api.delete(`/cards/${cardId}`),
    onSuccess: () => { toast.success('Card deleted.'); invalidateBoard(qc, boardId); },
    onError: () => toast.error('Could not delete card.'),
  });
}

export function useCardDetail(cardId) {
  return useQuery({
    queryKey: ['card', cardId],
    queryFn: async () => {
      const res = await api.get(`/cards/${cardId}`);
      return res.data ?? null;
    },
    enabled: !!cardId,
  });
}

/* ------------------------------------------------------------------ Comments */

export function useComments(cardId) {
  return useQuery({
    queryKey: ['comments', cardId],
    queryFn: async () => {
      const res = await api.get(`/cards/${cardId}/comments`);
      return unwrap(res.data);
    },
    enabled: !!cardId,
  });
}

export function useAddComment(cardId) {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (body) => api.post(`/cards/${cardId}/comments`, { body }),
    onSuccess: () => { toast.success('Comment added.'); qc.invalidateQueries({ queryKey: ['comments', cardId] }); },
    onError: () => toast.error('Could not add comment.'),
  });
}

export function useEditComment(cardId) {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ commentId, body }) => api.patch(`/comments/${commentId}`, { body }),
    onSuccess: () => { toast.success('Comment updated.'); qc.invalidateQueries({ queryKey: ['comments', cardId] }); },
    onError: () => toast.error('Could not edit comment.'),
  });
}

export function useDeleteComment(cardId) {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (commentId) => api.delete(`/comments/${commentId}`),
    onSuccess: () => { toast.success('Comment deleted.'); qc.invalidateQueries({ queryKey: ['comments', cardId] }); },
    onError: () => toast.error('Could not delete comment.'),
  });
}

/* ---------------------------------------------------------------- Checklist */

export function useToggleChecklistItem(cardId) {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ itemId, done }) => api.patch(`/checklist-items/${itemId}`, { done }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['card', cardId] }),
    onError: () => toast.error('Could not update item.'),
  });
}

export function useAddChecklistItem(cardId) {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ checklistId, text }) => api.post(`/checklists/${checklistId}/items`, { text }),
    onSuccess: () => { toast.success('Item added.'); qc.invalidateQueries({ queryKey: ['card', cardId] }); },
    onError: () => toast.error('Could not add item.'),
  });
}

export function useDeleteChecklistItem(cardId) {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (itemId) => api.delete(`/checklist-items/${itemId}`),
    onSuccess: () => { toast.success('Item deleted.'); qc.invalidateQueries({ queryKey: ['card', cardId] }); },
    onError: () => toast.error('Could not delete item.'),
  });
}

/* ------------------------------------------------------------------- Labels */

export function useAddCardLabel(boardId, cardId) {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (labelId) => api.post(`/cards/${cardId}/labels`, { labelId }),
    onSuccess: () => {
      toast.success('Label added.');
      qc.invalidateQueries({ queryKey: ['card', cardId] });
      invalidateBoard(qc, boardId);
    },
    onError: () => toast.error('Could not add label.'),
  });
}

export function useRemoveCardLabel(boardId, cardId) {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (labelId) => api.delete(`/cards/${cardId}/labels/${labelId}`),
    onSuccess: () => {
      toast.success('Label removed.');
      qc.invalidateQueries({ queryKey: ['card', cardId] });
      invalidateBoard(qc, boardId);
    },
    onError: () => toast.error('Could not remove label.'),
  });
}

export function useCreateBoardLabel(boardId) {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ name, color }) => api.post(`/boards/${boardId}/labels`, { name, color }),
    onSuccess: () => { toast.success('Label created.'); invalidateBoard(qc, boardId); },
    onError: () => toast.error('Could not create label.'),
  });
}

export function useDeleteBoardLabel(boardId) {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (labelId) => api.delete(`/labels/${labelId}`),
    onSuccess: () => { toast.success('Label deleted.'); invalidateBoard(qc, boardId); },
    onError: () => toast.error('Could not delete label.'),
  });
}

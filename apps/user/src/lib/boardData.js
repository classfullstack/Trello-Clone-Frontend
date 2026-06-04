import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
    lists,
    cards,
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

export function useCreateList(boardId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name) => api.post('/lists', { boardId, name }),
    onSuccess: () => invalidateBoard(qc, boardId),
  });
}

export function useUpdateList(boardId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ listId, patch }) => api.patch(`/lists/${listId}`, patch),
    onSuccess: () => invalidateBoard(qc, boardId),
  });
}

export function useCreateCard(boardId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ listId, title, position }) => api.post('/cards', { listId, title, position }),
    onSuccess: () => invalidateBoard(qc, boardId),
  });
}

export function useMoveCard(boardId) {
  const qc = useQueryClient();
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
    },
    onSettled: () => invalidateBoard(qc, boardId),
  });
}

export function useUpdateCard(boardId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, patch }) => api.patch(`/cards/${cardId}`, patch),
    onSuccess: () => invalidateBoard(qc, boardId),
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
  return useMutation({
    mutationFn: (body) => api.post(`/cards/${cardId}/comments`, { body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comments', cardId] }),
  });
}

export function useToggleChecklistItem(cardId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, done }) => api.patch(`/checklist-items/${itemId}`, { done }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['card', cardId] }),
  });
}

export function useAddChecklistItem(cardId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ checklistId, text }) => api.post(`/checklists/${checklistId}/items`, { text }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['card', cardId] }),
  });
}

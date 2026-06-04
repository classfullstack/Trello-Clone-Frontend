import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api';

function unwrap(data) {
  if (Array.isArray(data)) return data;
  const items = data?.items;
  return Array.isArray(items) ? items : [];
}

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

export function useLists(boardId) {
  return useQuery({
    queryKey: ['lists', boardId],
    queryFn: async () => {
      const res = await api.get('/lists', { params: { boardId } });
      return unwrap(res.data).sort((a, b) => a.position - b.position);
    },
    enabled: !!boardId,
  });
}

export function useCards(boardId) {
  return useQuery({
    queryKey: ['cards', boardId],
    queryFn: async () => {
      const res = await api.get('/cards', { params: { boardId } });
      return unwrap(res.data).sort((a, b) => a.position - b.position);
    },
    enabled: !!boardId,
  });
}

export function useCreateList(boardId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name) => api.post('/lists', { boardId, name }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lists', boardId] }),
  });
}

export function useCreateCard(boardId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars) =>
      api.post('/cards', { listId: vars.listId, title: vars.title }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cards', boardId] }),
  });
}

export function useMoveCard(boardId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars) =>
      api.patch(`/cards/${vars.cardId}/move`, { listId: vars.listId, position: vars.position }),
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: ['cards', boardId] });
      const prev = qc.getQueryData(['cards', boardId]);
      qc.setQueryData(['cards', boardId], (old) =>
        (old ?? []).map((c) =>
          c.id === vars.cardId ? { ...c, listId: vars.listId, position: vars.position } : c
        )
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['cards', boardId], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['cards', boardId] }),
  });
}

export function useUpdateCard(boardId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars) =>
      api.patch(`/cards/${vars.cardId}`, vars.patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cards', boardId] }),
  });
}

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@trello/ui';
import { api } from './api';

/* --------------------------------------------------------------- Workspace */

export function useCreateWorkspace() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (name) => api.post('/workspaces', { name }),
    onSuccess: () => { toast.success('Workspace created.'); qc.invalidateQueries({ queryKey: ['workspaces'] }); },
    onError: () => toast.error('Could not create workspace.'),
  });
}

export function useRenameWorkspace() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ id, name }) => api.patch(`/workspaces/${id}`, { name }),
    onSuccess: () => { toast.success('Workspace renamed.'); qc.invalidateQueries({ queryKey: ['workspaces'] }); },
    onError: () => toast.error('Could not rename workspace.'),
  });
}

export function useDeleteWorkspace() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (id) => api.delete(`/workspaces/${id}`),
    onSuccess: () => { toast.success('Workspace deleted.'); qc.invalidateQueries({ queryKey: ['workspaces'] }); },
    onError: () => toast.error('Could not delete workspace.'),
  });
}

/* ------------------------------------------------------------------- Board */

export function useCreateBoard(workspaceId) {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ name, background }) => api.post('/boards', { workspaceId, name, background }),
    onSuccess: () => { toast.success('Board created.'); qc.invalidateQueries({ queryKey: ['boards', workspaceId] }); },
    onError: () => toast.error('Could not create board.'),
  });
}

export function useUpdateBoard(workspaceId, opts = {}) {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ id, patch }) => api.patch(`/boards/${id}`, patch),
    onSuccess: (_d, { id }) => {
      if (opts.successMessage !== null) toast.success(opts.successMessage ?? 'Board updated.');
      if (workspaceId) qc.invalidateQueries({ queryKey: ['boards', workspaceId] });
      qc.invalidateQueries({ queryKey: ['board', id] });
    },
    onError: () => toast.error('Could not update board.'),
  });
}

export function useDeleteBoard(workspaceId) {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (id) => api.delete(`/boards/${id}`),
    onSuccess: () => { toast.success('Board deleted.'); if (workspaceId) qc.invalidateQueries({ queryKey: ['boards', workspaceId] }); },
    onError: () => toast.error('Could not delete board.'),
  });
}

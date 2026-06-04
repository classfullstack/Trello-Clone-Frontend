import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';

let socket = null;

function getSocket() {
  if (!socket) {
    socket = io('/', {
      path: '/socket.io',
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 3,
    });
  }
  return socket;
}

// Join board room and invalidate react-query cache on realtime events.
// Degrades gracefully when the socket server is absent.
export function useBoardSocket(boardId) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!boardId) return;
    const s = getSocket();
    const room = `board:${boardId}`;

    const invalidate = () => {
      qc.invalidateQueries({ queryKey: ['lists', boardId] });
      qc.invalidateQueries({ queryKey: ['cards', boardId] });
    };

    const join = () => s.emit('board:join', room);
    if (s.connected) join();
    s.on('connect', join);

    s.on('card:created', invalidate);
    s.on('card:updated', invalidate);
    s.on('card:moved', invalidate);
    s.on('card:deleted', invalidate);
    s.on('list:created', invalidate);
    s.on('list:updated', invalidate);

    return () => {
      s.emit('board:leave', room);
      s.off('connect', join);
      s.off('card:created', invalidate);
      s.off('card:updated', invalidate);
      s.off('card:moved', invalidate);
      s.off('card:deleted', invalidate);
      s.off('list:created', invalidate);
      s.off('list:updated', invalidate);
    };
  }, [boardId, qc]);
}

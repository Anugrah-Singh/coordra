'use client';

import { useEffect } from 'react';
import { io, type Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { getApiBaseUrl } from '@/lib/api-client';

let socket: Socket | null = null;

const getSocket = () => {
  socket ??= io(getApiBaseUrl(), {
    withCredentials: true,
    autoConnect: false,
    transports: ['websocket', 'polling'],
  });
  return socket;
};

export const useWorkspaceSocket = (workspaceId?: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const currentSocket = getSocket();
    const invalidateWorkspace = () => {
      void queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      if (workspaceId) {
        void queryClient.invalidateQueries({
          predicate: (query) => query.queryKey.includes(workspaceId),
        });
      }
    };
    const invalidateNotifications = () =>
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    const onWorkspaceError = (payload: { message?: string }) =>
      toast.error(payload.message ?? 'Real-time workspace connection failed');

    currentSocket.on('workspace:changed', invalidateWorkspace);
    currentSocket.on('notifications:changed', invalidateNotifications);
    currentSocket.on('workspace:error', onWorkspaceError);
    currentSocket.connect();
    if (workspaceId) currentSocket.emit('workspace:join', workspaceId);

    return () => {
      if (workspaceId) currentSocket.emit('workspace:leave', workspaceId);
      currentSocket.off('workspace:changed', invalidateWorkspace);
      currentSocket.off('notifications:changed', invalidateNotifications);
      currentSocket.off('workspace:error', onWorkspaceError);
    };
  }, [queryClient, workspaceId]);
};

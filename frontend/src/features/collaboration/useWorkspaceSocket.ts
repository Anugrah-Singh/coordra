'use client';

import { useEffect } from 'react';
import { io, type Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { getApiBaseUrl } from '@/lib/api-client';

let socket: Socket | null = null;

const workspaceEvents = [
  'workspace_updated',
  'owner_transferred',
  'project_created',
  'project_updated',
  'project_deleted',
  'task_created',
  'task_updated',
  'task_status_changed',
  'task_assigned',
  'task_archived',
  'task_unarchived',
  'task_duplicated',
  'comment_created',
  'comment_updated',
  'comment_deleted',
  'label_created',
  'label_updated',
  'label_deleted',
  'task_label_added',
  'task_label_removed',
  'member_added',
  'member_role_updated',
  'member_removed',
  'workspace_invite_created',
  'workspace_invite_deleted',
  'workspace_invite_accepted',
  'workspace_invite_declined',
] as const;

const userEvents = [
  'notification_created',
  'notification_read',
  'notifications_read_all',
] as const;

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

    const invalidateNotifications = () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };

    const onWorkspaceError = (payload: { message?: string }) => {
      toast.error(payload.message ?? 'Real-time workspace connection failed');
    };

    workspaceEvents.forEach((event) => {
      currentSocket.on(event, invalidateWorkspace);
    });

    userEvents.forEach((event) => {
      currentSocket.on(event, invalidateNotifications);
    });

    currentSocket.on('workspace_error', onWorkspaceError);
    currentSocket.connect();

    if (workspaceId) {
      currentSocket.emit('join_workspace', workspaceId);
    }

    return () => {
      if (workspaceId) {
        currentSocket.emit('leave_workspace', workspaceId);
      }

      workspaceEvents.forEach((event) => {
        currentSocket.off(event, invalidateWorkspace);
      });

      userEvents.forEach((event) => {
        currentSocket.off(event, invalidateNotifications);
      });

      currentSocket.off('workspace_error', onWorkspaceError);
    };
  }, [queryClient, workspaceId]);
};

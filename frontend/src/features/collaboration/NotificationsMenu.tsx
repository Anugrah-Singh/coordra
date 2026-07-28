'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingButton } from '@/components/shared/LoadingButton';
import { LoadingState as Spinner } from '@/components/shared/LoadingState';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { notificationApi } from '@/features/collaboration/collaboration.api';
import { formatDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';

export const NotificationsMenu = ({
  workspaceId,
}: {
  workspaceId: string | undefined;
}) => {
  const queryClient = useQueryClient();
  const queryKey = ['notifications', workspaceId ?? 'all'];

  const notificationsQuery = useQuery({
    queryKey,
    queryFn: () => notificationApi.list(workspaceId),
  });

  const countQuery = useQuery({
    queryKey: ['notifications', 'unread-count', workspaceId ?? 'all'],
    queryFn: () => notificationApi.unreadCount(workspaceId),
    refetchInterval: 60_000,
  });

  const markReadMutation = useMutation({
    mutationFn: notificationApi.markRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationApi.markAllRead(workspaceId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="relative inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          type="button"
          aria-label="Notifications"
        >
          <Bell size={19} />
          {(countQuery.data?.count ?? 0) > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-destructive px-1 font-mono text-[9px] text-destructive-foreground">
              {(countQuery.data?.count ?? 0) > 9 ? '9+' : countQuery.data?.count}
            </span>
          ) : null}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[min(24rem,calc(100vw-2rem))] gap-0 overflow-hidden p-0"
      >
        <header className="flex items-start justify-between gap-3 border-b p-4 [&_h3]:font-heading [&_h3]:font-semibold [&_p]:text-xs [&_p]:text-muted-foreground">
          <div>
            <h3>Notifications</h3>
            <p>{countQuery.data?.count ?? 0} unread</p>
          </div>
          <LoadingButton
            variant="ghost"
            size="sm"
            disabled={(countQuery.data?.count ?? 0) === 0}
            isLoading={markAllMutation.isPending}
            onClick={() => markAllMutation.mutate()}
          >
            <CheckCheck size={15} /> Mark all read
          </LoadingButton>
        </header>

        <div className="max-h-[26rem] overflow-y-auto">
          {notificationsQuery.isLoading ? (
            <Spinner label="Loading notifications" />
          ) : null}
          {notificationsQuery.data?.map((notification) => (
            <button
              key={notification.id}
              className={cn(
                'grid w-full grid-cols-[auto_1fr] gap-3 border-b p-4 text-left hover:bg-muted [&_strong]:block [&_strong]:text-sm [&_small]:mt-1 [&_small]:block [&_small]:text-xs [&_small]:text-muted-foreground',
                !notification.readAt && 'bg-secondary/40'
              )}
              type="button"
              onClick={() => {
                if (!notification.readAt) markReadMutation.mutate(notification.id);
              }}
            >
              <span className="mt-1.5 size-2 rounded-full bg-primary" />
              <span>
                <strong>{notification.message}</strong>
                <small>{formatDateTime(notification.createdAt)}</small>
              </span>
            </button>
          ))}
          {!notificationsQuery.isLoading && notificationsQuery.data?.length === 0 ? (
            <EmptyState
              title="All caught up"
              description="New workspace activity will appear here."
            />
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
};

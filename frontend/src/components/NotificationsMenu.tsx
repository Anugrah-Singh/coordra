import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Bell, CheckCheck } from 'lucide-react';
import { notificationApi } from '../api';
import { formatDateTime } from '../lib/format';
import { queryClient } from '../lib/queryClient';
import { Button, EmptyState, Spinner } from './ui';

export const NotificationsMenu = ({ workspaceId }: { workspaceId: string | undefined }) => {
  const [open, setOpen] = useState(false);
  const queryKey = ['notifications', workspaceId ?? 'all'];

  const notificationsQuery = useQuery({
    queryKey,
    queryFn: () => notificationApi.list(workspaceId),
    enabled: open,
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
    <div className="popover-wrap">
      <button
        className="icon-button icon-button--header"
        type="button"
        aria-label="Notifications"
        onClick={() => setOpen((value) => !value)}
      >
        <Bell size={19} />
        {(countQuery.data?.count ?? 0) > 0 ? (
          <span className="notification-count">
            {(countQuery.data?.count ?? 0) > 9 ? '9+' : countQuery.data?.count}
          </span>
        ) : null}
      </button>

      {open ? (
        <section className="popover notification-popover">
          <header className="popover__header">
            <div>
              <h3>Notifications</h3>
              <p>{countQuery.data?.count ?? 0} unread</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              disabled={(countQuery.data?.count ?? 0) === 0}
              isLoading={markAllMutation.isPending}
              onClick={() => markAllMutation.mutate()}
            >
              <CheckCheck size={15} /> Mark all read
            </Button>
          </header>

          <div className="notification-list">
            {notificationsQuery.isLoading ? <Spinner label="Loading notifications" /> : null}
            {notificationsQuery.data?.map((notification) => (
              <button
                key={notification.id}
                className={`notification-item${notification.readAt ? '' : ' notification-item--unread'}`}
                type="button"
                onClick={() => {
                  if (!notification.readAt) markReadMutation.mutate(notification.id);
                }}
              >
                <span className="notification-item__dot" />
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
        </section>
      ) : null}
    </div>
  );
};

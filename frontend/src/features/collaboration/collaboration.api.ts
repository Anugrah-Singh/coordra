import { request } from '@/lib/api-client';
import type {
  AuditLog,
  Notification,
  WorkspaceInvite,
  WorkspaceMember,
  WorkspaceRole,
} from '@/types/api';

const workspacePath = (workspaceId: string) => `/api/workspaces/${workspaceId}`;

const toSearch = (params: Record<string, string | undefined>) => {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      search.set(key, value);
    }
  });

  const query = search.toString();
  return query ? `?${query}` : '';
};

export const memberApi = {
  list: (workspaceId: string) =>
    request<WorkspaceMember[]>({
      method: 'GET',
      url: `${workspacePath(workspaceId)}/members?limit=100`,
    }),

  add: (
    workspaceId: string,
    input: { email: string; role: Exclude<WorkspaceRole, 'OWNER'> }
  ) =>
    request<WorkspaceMember>({
      method: 'POST',
      url: `${workspacePath(workspaceId)}/members`,
      data: input,
    }),

  updateRole: (
    workspaceId: string,
    memberId: string,
    role: Exclude<WorkspaceRole, 'OWNER'>
  ) =>
    request<WorkspaceMember>({
      method: 'PATCH',
      url: `${workspacePath(workspaceId)}/members/${memberId}/role`,
      data: { role },
    }),

  remove: (workspaceId: string, memberId: string) =>
    request<WorkspaceMember>({
      method: 'DELETE',
      url: `${workspacePath(workspaceId)}/members/${memberId}`,
    }),
};

export const notificationApi = {
  list: (workspaceId?: string) =>
    request<Notification[]>({
      method: 'GET',
      url: `/api/notifications${toSearch({
        workspaceId,
        limit: '50',
      })}`,
    }),

  unreadCount: (workspaceId?: string) =>
    request<{ count: number }>({
      method: 'GET',
      url: `/api/notifications/unread-count${toSearch({ workspaceId })}`,
    }),

  markRead: (notificationId: string) =>
    request<Notification>({
      method: 'PATCH',
      url: `/api/notifications/${notificationId}/read`,
    }),

  markAllRead: (workspaceId?: string) =>
    request<{ count: number; notifications: Notification[] }>({
      method: 'PATCH',
      url: `/api/notifications/read-all${toSearch({ workspaceId })}`,
    }),
};

export const inviteApi = {
  list: (workspaceId: string) =>
    request<WorkspaceInvite[]>({
      method: 'GET',
      url: `${workspacePath(workspaceId)}/invites?limit=100`,
    }),

  create: (
    workspaceId: string,
    input: { email: string; role: Exclude<WorkspaceRole, 'OWNER'> }
  ) =>
    request<{ invite: WorkspaceInvite; token?: string; invitePath?: string }>({
      method: 'POST',
      url: `${workspacePath(workspaceId)}/invites`,
      data: input,
    }),

  remove: (workspaceId: string, inviteId: string) =>
    request<WorkspaceInvite>({
      method: 'DELETE',
      url: `${workspacePath(workspaceId)}/invites/${inviteId}`,
    }),

  accept: (token: string) =>
    request<unknown>({
      method: 'POST',
      url: `/api/workspace-invites/${encodeURIComponent(token)}/accept`,
    }),

  decline: (token: string) =>
    request<unknown>({
      method: 'POST',
      url: `/api/workspace-invites/${encodeURIComponent(token)}/decline`,
    }),
};

export const auditApi = {
  list: (workspaceId: string) =>
    request<AuditLog[]>({
      method: 'GET',
      url: `${workspacePath(workspaceId)}/audit-logs?limit=100`,
    }),
};

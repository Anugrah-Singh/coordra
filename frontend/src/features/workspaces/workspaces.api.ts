import { request } from '@/lib/api-client';
import type { Workspace } from '@/types/api';

const workspacePath = (workspaceId: string) => `/api/workspaces/${workspaceId}`;

export const workspaceApi = {
  list: () => request<Workspace[]>({ method: 'GET', url: '/api/workspaces' }),

  get: (workspaceId: string) =>
    request<Workspace>({ method: 'GET', url: workspacePath(workspaceId) }),

  create: (name: string) =>
    request<Workspace>({
      method: 'POST',
      url: '/api/workspaces',
      data: { name },
    }),

  update: (workspaceId: string, name: string) =>
    request<Workspace>({
      method: 'PATCH',
      url: workspacePath(workspaceId),
      data: { name },
    }),

  remove: (workspaceId: string, confirmationName: string) =>
    request<Workspace>({
      method: 'DELETE',
      url: workspacePath(workspaceId),
      data: { confirmationName },
    }),

  transferOwner: (workspaceId: string, newOwnerMemberId: string) =>
    request<unknown>({
      method: 'PATCH',
      url: `${workspacePath(workspaceId)}/transfer-owner`,
      data: { newOwnerMemberId },
    }),
};
